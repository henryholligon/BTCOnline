import { SimplePool } from 'nostr-tools/pool';
import type { Event, Filter } from 'nostr-tools';
import { CANONICAL_RELAY, BACKUP_RELAYS } from './btc-relay';

export { CANONICAL_RELAY } from './btc-relay';

/**
 * DEFAULT_RELAYS contains the backup relays used for profile bootstrapping
 * and NIP-65 relay-list lookups. Community data (likes, saves, merchant
 * lists, favourites) is read exclusively from the canonical relay.
 */
export const DEFAULT_RELAYS = BACKUP_RELAYS;

/** Bootstrap relay set for profile and relay-list lookups. */
const BOOTSTRAP_RELAYS = [CANONICAL_RELAY, ...BACKUP_RELAYS];

export const pool = new SimplePool();

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function poolGet(relays: string[], filter: Filter, timeout = 5000): Promise<Event | null> {
  try {
    const events = await pool.querySync(relays, filter, { maxWait: timeout });
    if (events.length === 0) return null;
    return events.reduce((best, e) => (e.created_at > best.created_at ? e : best));
  } catch {
    return null;
  }
}

export async function poolQuerySync(relays: string[], filter: Filter, timeout = 5000): Promise<Event[]> {
  try {
    return await pool.querySync(relays, filter, { maxWait: timeout });
  } catch {
    return [];
  }
}

export async function fetchProfile(pubkey: string, relays: string[]) {
  const event = await poolGet(relays, { kinds: [0], authors: [pubkey] });
  if (!event) return null;
  try {
    return JSON.parse(event.content) as { name?: string; display_name?: string; picture?: string };
  } catch {
    return null;
  }
}

/**
 * Fetch the user's follow list (Kind 3 — contact list).
 * Returns an array of hex pubkeys the user follows.
 * If no event is found on any relay, returns an empty array.
 */
export async function fetchFollows(pubkey: string, relays: string[]): Promise<string[]> {
  const event = await poolGet(relays, { kinds: [3], authors: [pubkey] });
  if (!event) return [];
  return event.tags
    .filter(t => t[0] === 'p' && typeof t[1] === 'string' && t[1].length === 64)
    .map(t => t[1]);
}

export async function fetchRelayList(pubkey: string): Promise<{ read: string[]; write: string[] }> {
  const event = await poolGet(BOOTSTRAP_RELAYS, { kinds: [10002], authors: [pubkey] });
  if (!event) return { read: BOOTSTRAP_RELAYS, write: BOOTSTRAP_RELAYS };

  const read: string[] = [];
  const write: string[] = [];
  for (const tag of event.tags) {
    if (tag[0] === 'r') {
      const url = tag[1];
      const marker = tag[2];
      if (!marker || marker === 'read') read.push(url);
      if (!marker || marker === 'write') write.push(url);
    }
  }
  return {
    read: read.length > 0 ? read : DEFAULT_RELAYS,
    write: write.length > 0 ? write : DEFAULT_RELAYS,
  };
}

export interface FavouritesResult {
  urls: Set<string>;
  event: Event | null;
  isPrivate: boolean;
}

/**
 * Fetch the user's favourites (Kind 10003).
 * If the event is private (encrypted), `isPrivate` is true and `urls` is empty —
 * the caller must decrypt `event.content` with NIP-44.
 */
export async function fetchFavourites(pubkey: string, relays: string[]): Promise<FavouritesResult> {
  const event = await poolGet(relays, { kinds: [10003], authors: [pubkey] });
  if (!event) return { urls: new Set(), event: null, isPrivate: false };

  const isPrivate = event.tags.some(t => t[0] === 'private' && t[1] === 'true');
  if (isPrivate) {
    return { urls: new Set(), event, isPrivate: true };
  }

  const urls = new Set<string>();
  for (const tag of event.tags) {
    if (tag[0] === 'r') urls.add(tag[1]);
  }
  return { urls, event, isPrivate: false };
}

export async function fetchUserLists(pubkey: string, relays: string[]): Promise<Event[]> {
  const events = await poolQuerySync(relays, { kinds: [30004], authors: [pubkey] });

  // Parametrized replaceable events: keep only the latest event per d-tag
  const latestByDTag = new Map<string, Event>();
  for (const event of events) {
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] ?? event.id;
    const existing = latestByDTag.get(dTag);
    if (!existing || event.created_at > existing.created_at) {
      latestByDTag.set(dTag, event);
    }
  }

  // Exclude tombstoned / deleted lists
  return Array.from(latestByDTag.values()).filter(
    event => !event.tags.some(t => t[0] === 'deleted' && t[1] === 'true')
  );
}

/**
 * Fetch all public (non-private, non-deleted) Kind 30004 lists from relays,
 * deduplicated by author+dTag keeping the latest.
 */
export async function fetchPublicLists(relays: string[]): Promise<Event[]> {
  const events = await poolQuerySync(relays, { kinds: [30004], limit: 300 } as Filter, 8000);

  // Step 1: deduplicate by author+dTag keeping only the LATEST revision.
  // This must happen before any filtering so that a list toggled to private/deleted
  // is correctly represented by its newest (private/deleted) event and not a stale
  // older public revision.
  const latestByKey = new Map<string, Event>();
  for (const event of events) {
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] ?? event.id;
    const key = `${event.pubkey}:${dTag}`;
    const existing = latestByKey.get(key);
    if (!existing || event.created_at > existing.created_at) {
      latestByKey.set(key, event);
    }
  }

  // Step 2: now filter — only keep lists whose LATEST revision is public, not
  // deleted, has a non-empty title, AND contains at least one `r` (URL) tag.
  // The `r`-tag requirement distinguishes BTCOnline merchant lists from the
  // many other kinds of kind-30004 curation sets on public relays (article
  // packs, note threads, profile lists) which use `a` or `e` tags instead.
  return Array.from(latestByKey.values())
    .filter(e =>
      !e.tags.some(t => t[0] === 'private' && t[1] === 'true') &&
      !e.tags.some(t => t[0] === 'deleted' && t[1] === 'true') &&
      e.tags.some(t => t[0] === 'title' && t[1]) &&
      e.tags.some(t => t[0] === 'r' && t[1])
    )
    .sort((a, b) => b.created_at - a.created_at);
}

/**
 * Fetch the number of public list saves for a merchant URL.
 * Counts Kind 30004 list events with an `r` tag matching the URL, excluding private ones.
 */
export async function fetchSaveCount(url: string, relays: string[]): Promise<number> {
  try {
    const events = await pool.querySync(
      relays,
      { kinds: [30004], '#r': [url] } as Filter,
      { maxWait: 5000 },
    );
    return events.filter(e => !e.tags.some(t => t[0] === 'private' && t[1] === 'true')).length;
  } catch {
    return 0;
  }
}

/**
 * Fetch the number of public likes for a merchant URL.
 * Only counts Kind 10003 events that are NOT private-encrypted.
 */
/** Race a promise against a hard timeout; resolves with fallback if time runs out. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);
}

export async function fetchLikeCount(url: string, relays: string[]): Promise<number> {
  try {
    const events = await withTimeout(
      pool.querySync(relays, { kinds: [10003], limit: 500 } as Filter, { maxWait: 4000 }),
      6000,
      [] as Event[],
    );
    const latestByAuthor = new Map<string, Event>();
    for (const event of events) {
      if (event.tags.some(t => t[0] === 'private' && t[1] === 'true')) continue;
      const current = latestByAuthor.get(event.pubkey);
      if (!current || event.created_at > current.created_at) latestByAuthor.set(event.pubkey, event);
    }
    return Array.from(latestByAuthor.values())
      .filter(event => event.tags.some(t => t[0] === 'r' && t[1] === url))
      .length;
  } catch {
    return 0;
  }
}

/** Fetch public Nostr identities whose latest public kind-10003 event includes a merchant URL. */
export async function fetchLikeAuthors(url: string, relays: string[]): Promise<string[]> {
  try {
    const events = await withTimeout(
      pool.querySync(relays, { kinds: [10003], limit: 500 } as Filter, { maxWait: 4000 }),
      6000,
      [] as Event[],
    );
    // Kind 10003 is replaceable: use each author's latest public event so
    // stale events do not make an old like appear current.
    const latestByAuthor = new Map<string, Event>();
    for (const event of events) {
      if (event.tags.some(t => t[0] === 'private' && t[1] === 'true')) continue;
      const current = latestByAuthor.get(event.pubkey);
      if (!current || event.created_at > current.created_at) {
        latestByAuthor.set(event.pubkey, event);
      }
    }
    return Array.from(latestByAuthor.values())
      .filter(event => event.tags.some(t => t[0] === 'r' && t[1] === url))
      .map(event => event.pubkey);
  } catch {
    return [];
  }
}

export function getListTitle(event: Event): string {
  const titleTag = event.tags.find(t => t[0] === 'title');
  if (titleTag?.[1]) return titleTag[1];
  const dTag = event.tags.find(t => t[0] === 'd');
  return dTag?.[1] || 'Untitled List';
}

export function getListDescription(event: Event): string {
  return event.tags.find(t => t[0] === 'description')?.[1] || '';
}

export function getListUrls(event: Event): string[] {
  return event.tags.filter(t => t[0] === 'r').map(t => t[1]);
}
