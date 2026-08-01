import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { npubEncode, nsecEncode } from 'nostr-tools/nip19';
import { decrypt as ncryptsecDecrypt } from 'nostr-tools/nip49';
import { BunkerSigner } from 'nostr-tools/nip46';
import type { Event, EventTemplate, VerifiedEvent } from 'nostr-tools';
import {
  CANONICAL_RELAY,
  BACKUP_RELAYS,
  requestRelayAccess,
  addToOutbox,
  removeFromOutbox,
  markOutboxAttempt,
  getPendingOutboxEntries,
  publishToCanonical,
} from '@/lib/btc-relay';
import {
  pool,
  DEFAULT_RELAYS,
  fetchProfile,
  fetchFollows,
  fetchFavourites,
  fetchUserLists,
  fetchLikeCount as fetchLikeCountFromRelay,
  fetchLikeAuthors as fetchLikeAuthorsFromRelay,
  fetchSaveCount as fetchSaveCountFromRelay,
  bytesToHex,
  hexToBytes,
  getListTitle,
  getListDescription,
  getListUrls,
} from '@/lib/nostr';
import { encryptForSelf, decryptForSelf, canEncrypt } from '@/lib/nip44-self';
import NostrLoginModal from '@/components/nostr-login-modal';
import { generateNostrIdentity } from '@/lib/generated-identity';

export type LoginMethod = 'nip07' | 'nip46' | 'generated';

export interface NostrUser {
  pubkey: string;
  npub: string;
  displayName: string;
  picture?: string;
  loginMethod: LoginMethod;
}

export interface LikeAuthor {
  pubkey: string;
  npub: string;
  displayName: string;
}

export interface NostrList {
  dTag: string;
  title: string;
  description: string;
  urls: string[];
  isPrivate: boolean;
  event: Event | null;
}

export interface SavedPublicList {
  authorPubkey: string;
  dTag: string;
  title: string;
  description: string;
  merchantCount: number;
}

interface StoredSession {
  pubkey: string;
  method: LoginMethod;
  ncryptsec?: string;
  bunkerUri?: string;
  bunkerLocalSkHex?: string;
  custody?: 'custodial';
  email?: string;
}

interface NostrContextValue {
  user: NostrUser | null;
  readRelays: string[];
  writeRelays: string[];
  favourites: Set<string>;
  lists: NostrList[];
  isLoading: boolean;
  isLoginModalOpen: boolean;
  /** Whether the user's likes are public (default: true). */
  likesPublic: boolean;
  /** Whether the current session can perform NIP-44 encryption. */
  canUsePrivate: boolean;
  /** Cached like counts keyed by merchant URL. */
  likeCounts: Map<string, number>;
  /** Public Nostr identities that have liked, keyed by merchant URL. */
  likeAuthors: Map<string, LikeAuthor[]>;
  /** Cached list-save counts keyed by merchant URL. */
  saveCounts: Map<string, number>;
  /** Public lists saved/bookmarked by the user. */
  savedLists: SavedPublicList[];
  /** Hex pubkeys the current user follows (kind:3 contact list). Empty set when not signed in. */
  follows: Set<string>;
  loginNip07: () => Promise<void>;
  loginWithBunker: (bunkerUri: string) => Promise<void>;
  loginWithGeneratedKey: (sk: Uint8Array, ncryptsec?: string, custodialEmail?: string) => Promise<void>;
  restoreGeneratedSession: (ncryptsec: string, password: string) => Promise<void>;
  logout: () => void;
  signEvent: (template: EventTemplate) => Promise<VerifiedEvent>;
  toggleFavourite: (merchantUrl: string) => Promise<void>;
  toggleLikesPublic: () => Promise<void>;
  createList: (name: string, description?: string, isPrivate?: boolean) => Promise<void>;
  deleteList: (dTag: string) => Promise<void>;
  renameList: (dTag: string, newTitle: string) => Promise<void>;
  toggleListMember: (dTag: string, merchantUrl: string, currentlyInList: boolean) => Promise<void>;
  toggleListPrivacy: (dTag: string) => Promise<void>;
  /** Fetch and cache the public like count for a merchant URL. No-op if already cached. */
  fetchLikeCount: (url: string) => Promise<void>;
  fetchLikeAuthors: (url: string) => Promise<void>;
  /** Fetch and cache the public list-save count for a merchant URL. No-op if already cached. */
  fetchSaveCount: (url: string) => Promise<void>;
  /** Publish a signed Nostr event to the user's write relays. */
  publishEvent: (template: EventTemplate) => Promise<VerifiedEvent>;
  updateProfile: (profile: { name: string; picture?: string }) => Promise<void>;
  savePublicList: (list: SavedPublicList) => void;
  unsavePublicList: (authorPubkey: string, dTag: string) => void;
  restoringNcryptsec: string | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  getSecretKey: () => Uint8Array | null;
  loginMethod: LoginMethod | null;
  sessionNcryptsec: string | null;
}

const NostrContext = createContext<NostrContextValue | null>(null);

export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error('useNostr must be used within NostrProvider');
  return ctx;
}

const STORAGE_KEY = 'nostr_session';
const SAVED_LISTS_KEY = 'nostr_saved_lists';

/** Per-pubkey localStorage key so cross-user sessions never bleed. */
function getLikesPublicKey(pubkey: string) { return `nostr_likes_public_${pubkey}`; }

function saveSession(s: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession() { localStorage.removeItem(STORAGE_KEY); }

function loadSavedLists(): SavedPublicList[] {
  try { return JSON.parse(localStorage.getItem(SAVED_LISTS_KEY) || '[]'); }
  catch { return []; }
}

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NostrUser | null>(null);
  const [readRelays, setReadRelays] = useState<string[]>([CANONICAL_RELAY]);
  const [writeRelays, setWriteRelays] = useState<string[]>([CANONICAL_RELAY]);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [lists, setLists] = useState<NostrList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [restoringNcryptsec, setRestoringNcryptsec] = useState<string | null>(null);
  const [likesPublic, setLikesPublicState] = useState<boolean>(true); // initUser sets authoritative value from relay
  const [savedLists, setSavedLists] = useState<SavedPublicList[]>(loadSavedLists);
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [likeAuthors, setLikeAuthors] = useState<Map<string, LikeAuthor[]>>(new Map());
  const [saveCounts, setSaveCounts] = useState<Map<string, number>>(new Map());
  const [follows, setFollows] = useState<Set<string>>(new Set());

  const secretKeyRef = useRef<Uint8Array | null>(null);
  const bunkerSignerRef = useRef<BunkerSigner | null>(null);
  const likeCountFetchingRef = useRef<Set<string>>(new Set());
  const likeAuthorsFetchingRef = useRef<Set<string>>(new Set());
  const saveCountFetchingRef = useRef<Set<string>>(new Set());
  /** True when the current session loaded private likes but could not decrypt them. */
  const privateLikesDecryptFailedRef = useRef(false);
  /** Tracks whether the post-login outbox drain has already been kicked off. */
  const outboxDrainedRef = useRef(false);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setRestoringNcryptsec(prev => { if (prev) clearSession(); return null; });
  }, []);

  const canUsePrivate = canEncrypt(secretKeyRef.current);

  const signEvent = useCallback(async (template: EventTemplate): Promise<VerifiedEvent> => {
    const session = loadSession();
    if (!session) throw new Error('Not logged in');
    if (session.method === 'nip07') {
      if (!window.nostr) throw new Error('No Nostr extension found');
      return window.nostr.signEvent(template) as Promise<VerifiedEvent>;
    }
    if (session.method === 'generated' && secretKeyRef.current) {
      return finalizeEvent(template, secretKeyRef.current) as VerifiedEvent;
    }
    if (session.method === 'nip46' && bunkerSignerRef.current) {
      return bunkerSignerRef.current.signEvent(template) as Promise<VerifiedEvent>;
    }
    throw new Error('No signer available');
  }, []);

  const initUser = useCallback(async (pubkey: string, method: LoginMethod) => {
    setIsLoading(true);
    let loadedProfile: { name?: string; display_name?: string; picture?: string } | null = null;
    try {
      const npub = npubEncode(pubkey);
      // Community data is always read from the canonical relay only.
      setReadRelays([CANONICAL_RELAY]);
      setWriteRelays([CANONICAL_RELAY]);

      // Profile lookup: canonical relay first, then backup relays for users
      // who have not yet published to the canonical relay.
      loadedProfile = await fetchProfile(pubkey, [CANONICAL_RELAY, ...DEFAULT_RELAYS]);
      const displayName = loadedProfile?.display_name || loadedProfile?.name || npub.slice(0, 12) + '…';
      setUser({ pubkey, npub, displayName, picture: loadedProfile?.picture, loginMethod: method });

      // Fetch favourites from canonical relay only
      const favResult = await fetchFavourites(pubkey, [CANONICAL_RELAY]);
      if (favResult.isPrivate && favResult.event) {
        try {
          const decrypted = await decryptForSelf(favResult.event.content, secretKeyRef.current);
          const data = JSON.parse(decrypted) as { merchants?: string[] };
          setFavourites(new Set(data.merchants || []));
          privateLikesDecryptFailedRef.current = false;
        } catch {
          // Could not decrypt — do NOT set favourites to empty to avoid
          // silent data loss if the user later switches to public.
          privateLikesDecryptFailedRef.current = true;
          setFavourites(new Set());
        }
        // Relay is authoritative: event has private:true → likes are private.
        setLikesPublicState(false);
        localStorage.setItem(getLikesPublicKey(pubkey), 'false');
      } else {
        setFavourites(favResult.urls);
        privateLikesDecryptFailedRef.current = false;
        // Relay is authoritative: public event (or no event) → likes are public.
        setLikesPublicState(true);
        localStorage.setItem(getLikesPublicKey(pubkey), 'true');
      }

      // Fetch follow list (kind:3) and user lists from canonical relay
      const [listEvents, followPubkeys] = await Promise.all([
        fetchUserLists(pubkey, [CANONICAL_RELAY]),
        fetchFollows(pubkey, [CANONICAL_RELAY]),
      ]);
      setFollows(new Set(followPubkeys));
      const parsedLists: NostrList[] = [];
      for (const ev of listEvents) {
        const isPrivate = ev.tags.some(t => t[0] === 'private' && t[1] === 'true');
        if (isPrivate) {
          try {
            const decrypted = await decryptForSelf(ev.content, secretKeyRef.current);
            const data = JSON.parse(decrypted) as { title?: string; description?: string; merchants?: string[] };
            parsedLists.push({
              dTag: ev.tags.find(t => t[0] === 'd')?.[1] ?? ev.id,
              title: data.title || 'Untitled List',
              description: data.description || '',
              urls: data.merchants || [],
              isPrivate: true,
              event: ev,
            });
          } catch {
            // Decryption failed — skip this list (probably belongs to another device/key)
          }
        } else {
          parsedLists.push({
            dTag: ev.tags.find(t => t[0] === 'd')?.[1] ?? ev.id,
            title: getListTitle(ev),
            description: getListDescription(ev),
            urls: getListUrls(ev),
            isPrivate: false,
            event: ev,
          });
        }
      }
      setLists(parsedLists);
    } catch (err) {
      console.error('Nostr init error', err);
    } finally {
      setIsLoading(false);
    }
    return loadedProfile;
  }, []);

  // Drain outbox entries after a successful login.
  useEffect(() => {
    if (!user) { outboxDrainedRef.current = false; return; }
    if (outboxDrainedRef.current) return;
    outboxDrainedRef.current = true;
    const pending = getPendingOutboxEntries();
    if (pending.length === 0) return;
    console.log(`[btc-relay] draining ${pending.length} outbox event(s) after login`);
    (async () => {
      for (const entry of pending) {
        try {
          await publishToCanonical(entry.event, signEvent);
          removeFromOutbox(entry.event.id);
        } catch {
          markOutboxAttempt(entry.event.id);
        }
      }
    })();
  }, [user?.pubkey, signEvent]);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    if (session.method === 'nip07') {
      if (window.nostr) {
        window.nostr.getPublicKey().then(pk => {
          if (pk === session.pubkey) initUser(pk, 'nip07');
          else clearSession();
        }).catch(clearSession);
      } else { clearSession(); }
    } else if (session.method === 'generated') {
      if (session.custody === 'custodial' && session.email) {
        fetch('/api/auth/session', { credentials: 'include' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error('session expired')))
          .then(data => {
            secretKeyRef.current = hexToBytes(data.nsecHex);
            initUser(session.pubkey, 'generated');
          })
          .catch(() => clearSession());
      } else if (session.ncryptsec) {
        setRestoringNcryptsec(session.ncryptsec);
        setIsLoginModalOpen(true);
      } else { clearSession(); }
    } else if (session.method === 'nip46' && session.bunkerUri && session.bunkerLocalSkHex) {
      const localSk = hexToBytes(session.bunkerLocalSkHex);
      BunkerSigner.fromURI(localSk, session.bunkerUri, {
        pool,
        onauth: (url: string) => window.open(url, '_blank'),
      }).then(signer => {
        bunkerSignerRef.current = signer;
        initUser(session.pubkey, 'nip46');
      }).catch(() => clearSession());
    }
  }, [initUser]);

  const loginNip07 = useCallback(async () => {
    if (!window.nostr) throw new Error('No Nostr extension found. Please install Alby or nos2x.');
    const pubkey = await window.nostr.getPublicKey();
    requestRelayAccess(pubkey); // fire-and-forget — never sends private key
    saveSession({ pubkey, method: 'nip07' });
    await initUser(pubkey, 'nip07');
    closeLoginModal();
  }, [initUser, closeLoginModal]);

  const loginWithBunker = useCallback(async (bunkerUri: string) => {
    const localSk = generateSecretKey();
    const localSkHex = bytesToHex(localSk);
    const signer = await BunkerSigner.fromURI(localSk, bunkerUri, {
      pool,
      onauth: (url: string) => window.open(url, '_blank'),
    });
    bunkerSignerRef.current = signer;
    const pubkey = await signer.getPublicKey();
    requestRelayAccess(pubkey); // fire-and-forget — never sends private key
    saveSession({ pubkey, method: 'nip46', bunkerUri, bunkerLocalSkHex: localSkHex });
    await initUser(pubkey, 'nip46');
    closeLoginModal();
  }, [initUser, closeLoginModal]);

  const loginWithGeneratedKey = useCallback(async (sk: Uint8Array, ncryptsec?: string, custodialEmail?: string) => {
    secretKeyRef.current = sk;
    const pubkey = getPublicKey(sk);
    requestRelayAccess(pubkey); // fire-and-forget — never sends private key
    saveSession({
      pubkey, method: 'generated', ncryptsec,
      ...(custodialEmail ? { custody: 'custodial', email: custodialEmail } : {}),
    });
    const profile = await initUser(pubkey, 'generated');
    // Pure generated Nostr identities get a real kind:0 profile that is visible
    // to other Nostr clients. Email-custodial users deliberately keep their
    // existing email-derived identity until they choose to edit it.
    if (!custodialEmail && !profile) {
      const generated = generateNostrIdentity(pubkey);
      const profileEvent = finalizeEvent({
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({ name: generated.name, display_name: generated.name, picture: generated.avatarUrl }),
      }, sk);
      // Publish with NIP-42 auth to canonical relay, backup relays fire-and-forget
      addToOutbox(profileEvent);
      publishToCanonical(profileEvent, signEvent)
        .then(() => removeFromOutbox(profileEvent.id))
        .catch(() => markOutboxAttempt(profileEvent.id));
      pool.publish(BACKUP_RELAYS, profileEvent).forEach(p => p.catch(() => {}));
      setUser(prev => prev ? { ...prev, displayName: generated.name, picture: generated.avatarUrl } : prev);
    }
    setRestoringNcryptsec(null);
    closeLoginModal();
  }, [initUser, closeLoginModal, signEvent]);

  const restoreGeneratedSession = useCallback(async (ncryptsec: string, password: string) => {
    const sk = ncryptsecDecrypt(ncryptsec, password);
    secretKeyRef.current = sk;
    const pubkey = getPublicKey(sk);
    requestRelayAccess(pubkey); // fire-and-forget — never sends private key
    saveSession({ pubkey, method: 'generated', ncryptsec });
    setRestoringNcryptsec(null);
    setIsLoginModalOpen(false);
    const profile = await initUser(pubkey, 'generated');
    if (!profile) {
      const generated = generateNostrIdentity(pubkey);
      const profileEvent = finalizeEvent({
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({ name: generated.name, display_name: generated.name, picture: generated.avatarUrl }),
      }, sk);
      addToOutbox(profileEvent);
      publishToCanonical(profileEvent, signEvent)
        .then(() => removeFromOutbox(profileEvent.id))
        .catch(() => markOutboxAttempt(profileEvent.id));
      pool.publish(BACKUP_RELAYS, profileEvent).forEach(p => p.catch(() => {}));
      setUser(prev => prev ? { ...prev, displayName: generated.name, picture: generated.avatarUrl } : prev);
    }
  }, [initUser, signEvent]);

  const logout = useCallback(() => {
    const session = loadSession();
    if (session?.custody === 'custodial') {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    clearSession();
    secretKeyRef.current = null;
    bunkerSignerRef.current = null;
    setUser(null);
    setFavourites(new Set());
    setLists([]);
    setReadRelays([CANONICAL_RELAY]);
    setWriteRelays([CANONICAL_RELAY]);
    setLikeCounts(new Map());
    setLikeAuthors(new Map());
    setFollows(new Set());
    likeCountFetchingRef.current.clear();
    privateLikesDecryptFailedRef.current = false;
    setLikesPublicState(true); // reset to default; next login sets authoritative value
  }, []);

  const publishEvent = useCallback(async (template: EventTemplate) => {
    const signed = await signEvent(template);

    // 1. Persist to local outbox before attempting relay publish.
    addToOutbox(signed);

    // 2. Publish to canonical relay with NIP-42 AUTH (primary, authoritative).
    try {
      await publishToCanonical(signed, signEvent);
      removeFromOutbox(signed.id);
    } catch (err) {
      markOutboxAttempt(signed.id);
      console.warn('[btc-relay] canonical publish failed — event queued for retry:', err);
    }

    // 3. Redundant publish to backup relays (fire-and-forget, no auth required).
    //    These results are never read back as canonical data.
    pool.publish(BACKUP_RELAYS, signed).forEach(p => p.catch(() => {}));

    return signed;
  }, [signEvent]);

  const updateProfile = useCallback(async (profile: { name: string; picture?: string }) => {
    if (!user) throw new Error('Not logged in');
    const name = profile.name.trim();
    if (!name) throw new Error('A profile name is required');
    const picture = profile.picture?.trim();
    await publishEvent({
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({
        name,
        display_name: name,
        ...(picture ? { picture } : {}),
      }),
    });
    setUser(prev => prev ? { ...prev, displayName: name, picture: picture || undefined } : prev);
  }, [user, publishEvent]);

  // ── Favourites ──────────────────────────────────────────────────────────────

  const toggleFavourite = useCallback(async (merchantUrl: string) => {
    if (!user) { openLoginModal(); return; }

    // Guard: if likes are private but we couldn't decrypt them, mutating from
    // the empty in-memory set would silently overwrite the user's real likes.
    if (!likesPublic && privateLikesDecryptFailedRef.current) {
      throw new Error(
        'Your private likes could not be decrypted in this session. ' +
        'Log out and sign in again to recover them.'
      );
    }

    const next = new Set(favourites);
    if (next.has(merchantUrl)) next.delete(merchantUrl);
    else next.add(merchantUrl);

    const isAdding = !favourites.has(merchantUrl);

    if (likesPublic) {
      const tags: string[][] = Array.from(next).map(url => ['r', url]);
      await publishEvent({ kind: 10003, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
    } else {
      const encrypted = await encryptForSelf(
        JSON.stringify({ merchants: Array.from(next) }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 10003,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['private', 'true']],
        content: encrypted,
      });
    }
    setFavourites(next);

    // Optimistically keep likeAuthors and likeCounts in sync so the likes panel
    // reflects the change immediately without waiting for a relay re-fetch.
    if (likesPublic && user) {
      const meAsAuthor: LikeAuthor = {
        pubkey: user.pubkey,
        npub: user.npub,
        displayName: user.displayName,
      };

      setLikeAuthors(prev => {
        const next = new Map(prev);
        const current = next.get(merchantUrl) ?? [];
        if (isAdding) {
          // Add if not already present
          if (!current.some(a => a.pubkey === user.pubkey)) {
            next.set(merchantUrl, [...current, meAsAuthor]);
          }
        } else {
          next.set(merchantUrl, current.filter(a => a.pubkey !== user.pubkey));
        }
        return next;
      });

      setLikeCounts(prev => {
        const next = new Map(prev);
        const current = next.get(merchantUrl) ?? 0;
        next.set(merchantUrl, Math.max(0, current + (isAdding ? 1 : -1)));
        return next;
      });

      // Clear the fetching ref so the next expansion can do a fresh relay fetch
      likeAuthorsFetchingRef.current.delete(merchantUrl);
      likeCountFetchingRef.current.delete(merchantUrl);
    }
  }, [user, likesPublic, favourites, publishEvent, openLoginModal]);

  const toggleLikesPublic = useCallback(async () => {
    if (!user) return;
    const newPublic = !likesPublic;
    if (newPublic) {
      // Switching private → public. Guard: if we couldn't decrypt the private
      // list we must not republish an empty set and silently wipe the user's likes.
      if (privateLikesDecryptFailedRef.current) {
        throw new Error(
          'Your existing private likes could not be decrypted in this session. ' +
          'Log out and sign in again to recover them before switching to public.'
        );
      }
      // Publish unencrypted
      const tags: string[][] = Array.from(favourites).map(url => ['r', url]);
      await publishEvent({ kind: 10003, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
    } else {
      // Publish encrypted
      const encrypted = await encryptForSelf(
        JSON.stringify({ merchants: Array.from(favourites) }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 10003,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['private', 'true']],
        content: encrypted,
      });
    }
    setLikesPublicState(newPublic);
    localStorage.setItem(getLikesPublicKey(user.pubkey), String(newPublic));
  }, [user, likesPublic, favourites, publishEvent]);

  // ── Lists ───────────────────────────────────────────────────────────────────

  const createList = useCallback(async (name: string, description = '', isPrivate = false) => {
    if (!user) return;
    const dTag = `btconline-${Date.now()}`;

    if (isPrivate) {
      const encrypted = await encryptForSelf(
        JSON.stringify({ title: name, description, merchants: [] }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['private', 'true']],
        content: encrypted,
      });
      setLists(prev => [...prev, { dTag, title: name, description, urls: [], isPrivate: true, event: null }]);
    } else {
      const tags: string[][] = [
        ['d', dTag],
        ['title', name],
        ...(description ? [['description', description]] : []),
      ];
      await publishEvent({ kind: 30004, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
      setLists(prev => [...prev, { dTag, title: name, description, urls: [], isPrivate: false, event: null }]);
    }
  }, [user, publishEvent]);

  const deleteList = useCallback(async (dTag: string) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (list?.isPrivate) {
      const encrypted = await encryptForSelf(
        JSON.stringify({ title: '', description: '', merchants: [], deleted: true }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['private', 'true'], ['deleted', 'true']],
        content: encrypted,
      });
    } else {
      await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['title', ''], ['deleted', 'true']],
        content: '',
      });
    }
    setLists(prev => prev.filter(l => l.dTag !== dTag));
  }, [user, lists, publishEvent]);

  const renameList = useCallback(async (dTag: string, newTitle: string) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (!list) return;
    if (list.isPrivate) {
      const encrypted = await encryptForSelf(
        JSON.stringify({ title: newTitle, description: list.description, merchants: list.urls }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['private', 'true']],
        content: encrypted,
      });
    } else {
      const tags: string[][] = [
        ['d', dTag],
        ['title', newTitle],
        ...(list.description ? [['description', list.description]] : []),
        ...list.urls.map(url => ['r', url]),
      ];
      await publishEvent({ kind: 30004, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
    }
    setLists(prev => prev.map(l => l.dTag === dTag ? { ...l, title: newTitle } : l));
  }, [user, lists, publishEvent]);

  const toggleListMember = useCallback(async (dTag: string, merchantUrl: string, currentlyInList: boolean) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (!list) return;

    const nextUrls = currentlyInList
      ? list.urls.filter(u => u !== merchantUrl)
      : [...list.urls, merchantUrl];

    if (list.isPrivate) {
      const encrypted = await encryptForSelf(
        JSON.stringify({ title: list.title, description: list.description, merchants: nextUrls }),
        secretKeyRef.current,
      );
      const signed = await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['private', 'true']],
        content: encrypted,
      });
      setLists(prev => prev.map(l => l.dTag === dTag ? { ...l, urls: nextUrls, event: signed } : l));
    } else {
      const tags: string[][] = [
        ['d', dTag],
        ['title', list.title],
        ...(list.description ? [['description', list.description]] : []),
        ...nextUrls.map(url => ['r', url]),
      ];
      const signed = await publishEvent({ kind: 30004, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
      setLists(prev => prev.map(l => l.dTag === dTag ? { ...l, urls: nextUrls, event: signed } : l));
    }
  }, [user, lists, publishEvent]);

  const toggleListPrivacy = useCallback(async (dTag: string) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (!list) return;
    const newPrivate = !list.isPrivate;
    if (newPrivate) {
      const encrypted = await encryptForSelf(
        JSON.stringify({ title: list.title, description: list.description, merchants: list.urls }),
        secretKeyRef.current,
      );
      await publishEvent({
        kind: 30004,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', dTag], ['private', 'true']],
        content: encrypted,
      });
    } else {
      const tags: string[][] = [
        ['d', dTag],
        ['title', list.title],
        ...(list.description ? [['description', list.description]] : []),
        ...list.urls.map(url => ['r', url]),
      ];
      await publishEvent({ kind: 30004, created_at: Math.floor(Date.now() / 1000), tags, content: '' });
    }
    setLists(prev => prev.map(l => l.dTag === dTag ? { ...l, isPrivate: newPrivate } : l));
  }, [user, lists, publishEvent]);

  // ── Like counts ─────────────────────────────────────────────────────────────

  const fetchLikeCount = useCallback(async (url: string) => {
    if (likeCountFetchingRef.current.has(url)) return;
    likeCountFetchingRef.current.add(url);
    try {
      const count = await fetchLikeCountFromRelay(url, readRelays);
      setLikeCounts(prev => {
        const next = new Map(prev);
        next.set(url, count);
        return next;
      });
    } catch {
      likeCountFetchingRef.current.delete(url); // allow retry
    }
  }, [readRelays]);

  const fetchLikeAuthors = useCallback(async (url: string) => {
    if (likeAuthorsFetchingRef.current.has(url)) return;
    likeAuthorsFetchingRef.current.add(url);
    try {
      const pubkeys = await fetchLikeAuthorsFromRelay(url, readRelays);
      // Fetch all kind:0 profiles in one batched relay query instead of N sequential ones.
      // Wrap in Promise.race so a stalled relay can never keep us loading indefinitely.
      const profileEvents = pubkeys.length
        ? await Promise.race([
            pool.querySync(readRelays, { kinds: [0], authors: pubkeys }, { maxWait: 4000 }),
            new Promise<never[]>(resolve => setTimeout(() => resolve([]), 6000)),
          ])
        : [];
      const profileMap = new Map<string, { display_name?: string; name?: string; picture?: string }>();
      for (const ev of profileEvents) {
        try { profileMap.set(ev.pubkey, JSON.parse(ev.content)); } catch { /* skip bad JSON */ }
      }
      const authors = pubkeys.map(pubkey => {
        const profile = profileMap.get(pubkey);
        const npub = npubEncode(pubkey);
        return {
          pubkey,
          npub,
          displayName: profile?.display_name || profile?.name || `${npub.slice(0, 10)}…`,
        };
      });
      setLikeAuthors(prev => {
        const next = new Map(prev);
        next.set(url, authors);
        return next;
      });
    } catch {
      // On any error, still mark as resolved (empty) so the panel shows "No public likes yet"
      // rather than staying on "Loading…" forever.
      setLikeAuthors(prev => {
        const next = new Map(prev);
        if (!next.has(url)) next.set(url, []);
        return next;
      });
      likeAuthorsFetchingRef.current.delete(url);
    }
  }, [readRelays]);

  const fetchSaveCount = useCallback(async (url: string) => {
    if (saveCountFetchingRef.current.has(url)) return;
    saveCountFetchingRef.current.add(url);
    try {
      const count = await fetchSaveCountFromRelay(url, readRelays);
      setSaveCounts(prev => {
        const next = new Map(prev);
        next.set(url, count);
        return next;
      });
    } catch {
      saveCountFetchingRef.current.delete(url);
    }
  }, [readRelays]);

  // ── Saved public lists ───────────────────────────────────────────────────────

  const savePublicList = useCallback((list: SavedPublicList) => {
    setSavedLists(prev => {
      const next = [
        ...prev.filter(l => !(l.authorPubkey === list.authorPubkey && l.dTag === list.dTag)),
        list,
      ];
      localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const unsavePublicList = useCallback((authorPubkey: string, dTag: string) => {
    setSavedLists(prev => {
      const next = prev.filter(l => !(l.authorPubkey === authorPubkey && l.dTag === dTag));
      localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getSecretKey = useCallback((): Uint8Array | null => secretKeyRef.current, []);
  const _session = user ? loadSession() : null;
  const loginMethod: LoginMethod | null = _session?.method ?? null;
  const sessionNcryptsec: string | null = _session?.ncryptsec ?? null;

  return (
    <NostrContext.Provider value={{
      user, readRelays, writeRelays, favourites, follows, lists, isLoading, isLoginModalOpen,
      likesPublic, canUsePrivate, likeCounts, likeAuthors, saveCounts, savedLists,
      loginNip07, loginWithBunker, loginWithGeneratedKey, restoreGeneratedSession,
       logout, signEvent, publishEvent, updateProfile,
      toggleFavourite, toggleLikesPublic,
      createList, deleteList, renameList, toggleListMember, toggleListPrivacy,
      fetchLikeCount, fetchLikeAuthors, fetchSaveCount,
      savePublicList, unsavePublicList,
      restoringNcryptsec, openLoginModal, closeLoginModal,
      getSecretKey, loginMethod, sessionNcryptsec,
    }}>
      {children}
      <NostrLoginModal />
    </NostrContext.Provider>
  );
}

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: EventTemplate): Promise<VerifiedEvent>;
      getRelays?(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;
      nip44?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}
