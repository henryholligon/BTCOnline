import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { npubEncode, nsecEncode } from 'nostr-tools/nip19';
import { decrypt as ncryptsecDecrypt } from 'nostr-tools/nip49';
import { BunkerSigner } from 'nostr-tools/nip46';
import type { Event, EventTemplate, VerifiedEvent } from 'nostr-tools';
import {
  pool,
  DEFAULT_RELAYS,
  fetchProfile,
  fetchRelayList,
  fetchFavourites,
  fetchUserLists,
  bytesToHex,
  hexToBytes,
  getListTitle,
  getListUrls,
} from '@/lib/nostr';
import NostrLoginModal from '@/components/nostr-login-modal';

export type LoginMethod = 'nip07' | 'nip46' | 'generated';

export interface NostrUser {
  pubkey: string;
  npub: string;
  displayName: string;
  picture?: string;
  loginMethod: LoginMethod;
}

export interface NostrList {
  dTag: string;
  title: string;
  urls: string[];
  event: Event | null;
}

interface StoredSession {
  pubkey: string;
  method: LoginMethod;
  ncryptsec?: string;
  bunkerUri?: string;
  bunkerLocalSkHex?: string;
}

interface NostrContextValue {
  user: NostrUser | null;
  readRelays: string[];
  writeRelays: string[];
  favourites: Set<string>;
  lists: NostrList[];
  isLoading: boolean;
  isLoginModalOpen: boolean;
  loginNip07: () => Promise<void>;
  loginWithBunker: (bunkerUri: string) => Promise<void>;
  loginWithGeneratedKey: (sk: Uint8Array, ncryptsec?: string) => Promise<void>;
  restoreGeneratedSession: (ncryptsec: string, password: string) => Promise<void>;
  logout: () => void;
  signEvent: (template: EventTemplate) => Promise<VerifiedEvent>;
  toggleFavourite: (merchantUrl: string) => Promise<void>;
  createList: (name: string) => Promise<void>;
  deleteList: (dTag: string) => Promise<void>;
  renameList: (dTag: string, newTitle: string) => Promise<void>;
  toggleListMember: (dTag: string, merchantUrl: string, currentlyInList: boolean) => Promise<void>;
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

function saveSession(s: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NostrUser | null>(null);
  const [readRelays, setReadRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [writeRelays, setWriteRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [lists, setLists] = useState<NostrList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [restoringNcryptsec, setRestoringNcryptsec] = useState<string | null>(null);

  const secretKeyRef = useRef<Uint8Array | null>(null);
  const bunkerSignerRef = useRef<BunkerSigner | null>(null);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setRestoringNcryptsec(prev => { if (prev) clearSession(); return null; });
  }, []);

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
    try {
      const npub = npubEncode(pubkey);
      const relays = await fetchRelayList(pubkey);
      setReadRelays(relays.read);
      setWriteRelays(relays.write);

      const profile = await fetchProfile(pubkey, relays.read);
      const displayName = profile?.display_name || profile?.name || npub.slice(0, 12) + '…';

      setUser({ pubkey, npub, displayName, picture: profile?.picture, loginMethod: method });

      const favs = await fetchFavourites(pubkey, relays.read);
      setFavourites(favs);

      const listEvents = await fetchUserLists(pubkey, relays.read);
      setLists(listEvents.map(ev => ({
        dTag: ev.tags.find(t => t[0] === 'd')?.[1] ?? ev.id,
        title: getListTitle(ev),
        urls: getListUrls(ev),
        event: ev,
      })));
    } catch (err) {
      console.error('Nostr init error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    if (session.method === 'nip07') {
      if (window.nostr) {
        window.nostr.getPublicKey().then(pk => {
          if (pk === session.pubkey) initUser(pk, 'nip07');
          else clearSession();
        }).catch(clearSession);
      } else {
        clearSession();
      }
    } else if (session.method === 'generated') {
      if (session.ncryptsec) {
        setRestoringNcryptsec(session.ncryptsec);
        setIsLoginModalOpen(true);
      } else {
        clearSession();
      }
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

    saveSession({ pubkey, method: 'nip46', bunkerUri, bunkerLocalSkHex: localSkHex });
    await initUser(pubkey, 'nip46');
    closeLoginModal();
  }, [initUser, closeLoginModal]);

  const loginWithGeneratedKey = useCallback(async (sk: Uint8Array, ncryptsec?: string) => {
    secretKeyRef.current = sk;
    const pubkey = getPublicKey(sk);
    saveSession({ pubkey, method: 'generated', ncryptsec });
    await initUser(pubkey, 'generated');
    setRestoringNcryptsec(null);
    closeLoginModal();
  }, [initUser, closeLoginModal]);

  const restoreGeneratedSession = useCallback(async (ncryptsec: string, password: string) => {
    const sk = ncryptsecDecrypt(ncryptsec, password);
    secretKeyRef.current = sk;
    const pubkey = getPublicKey(sk);
    saveSession({ pubkey, method: 'generated', ncryptsec });
    setRestoringNcryptsec(null);
    setIsLoginModalOpen(false);
    await initUser(pubkey, 'generated');
  }, [initUser]);

  const logout = useCallback(() => {
    clearSession();
    secretKeyRef.current = null;
    bunkerSignerRef.current = null;
    setUser(null);
    setFavourites(new Set());
    setLists([]);
    setReadRelays(DEFAULT_RELAYS);
    setWriteRelays(DEFAULT_RELAYS);
  }, []);

  const publishEvent = useCallback(async (template: EventTemplate) => {
    const signed = await signEvent(template);
    const promises = pool.publish(writeRelays, signed);
    await Promise.any(promises);
    return signed;
  }, [signEvent, writeRelays]);

  const toggleFavourite = useCallback(async (merchantUrl: string) => {
    if (!user) { openLoginModal(); return; }
    const next = new Set(favourites);
    if (next.has(merchantUrl)) next.delete(merchantUrl);
    else next.add(merchantUrl);

    const tags: string[][] = Array.from(next).map(url => ['r', url]);
    const event = await publishEvent({
      kind: 10003,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: '',
    });
    setFavourites(next);
  }, [user, favourites, publishEvent, openLoginModal]);

  const createList = useCallback(async (name: string) => {
    if (!user) return;
    const dTag = `btconline-${Date.now()}`;
    await publishEvent({
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', dTag], ['title', name]],
      content: '',
    });
    setLists(prev => [...prev, { dTag, title: name, urls: [], event: null }]);
  }, [user, publishEvent]);

  const deleteList = useCallback(async (dTag: string) => {
    if (!user) return;
    await publishEvent({
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', dTag], ['title', ''], ['deleted', 'true']],
      content: '',
    });
    setLists(prev => prev.filter(l => l.dTag !== dTag));
  }, [user, publishEvent]);

  const renameList = useCallback(async (dTag: string, newTitle: string) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (!list) return;
    const tags: string[][] = [
      ['d', dTag],
      ['title', newTitle],
      ...list.urls.map(url => ['r', url]),
    ];
    await publishEvent({
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: '',
    });
    setLists(prev => prev.map(l => l.dTag === dTag ? { ...l, title: newTitle } : l));
  }, [user, lists, publishEvent]);

  const toggleListMember = useCallback(async (dTag: string, merchantUrl: string, currentlyInList: boolean) => {
    if (!user) return;
    const list = lists.find(l => l.dTag === dTag);
    if (!list) return;

    const nextUrls = currentlyInList
      ? list.urls.filter(u => u !== merchantUrl)
      : [...list.urls, merchantUrl];

    const tags: string[][] = [
      ['d', dTag],
      ['title', list.title],
      ...nextUrls.map(url => ['r', url]),
    ];

    const signed = await publishEvent({
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: '',
    });

    setLists(prev => prev.map(l =>
      l.dTag === dTag ? { ...l, urls: nextUrls, event: signed } : l
    ));
  }, [user, lists, publishEvent]);

  const getSecretKey = useCallback((): Uint8Array | null => secretKeyRef.current, []);
  const _session = user ? loadSession() : null;
  const loginMethod: LoginMethod | null = _session?.method ?? null;
  const sessionNcryptsec: string | null = _session?.ncryptsec ?? null;

  return (
    <NostrContext.Provider value={{
      user, readRelays, writeRelays, favourites, lists,
      isLoading, isLoginModalOpen,
      loginNip07, loginWithBunker, loginWithGeneratedKey, restoreGeneratedSession,
      logout, signEvent,
      toggleFavourite, createList, deleteList, renameList, toggleListMember,
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
    };
  }
}
