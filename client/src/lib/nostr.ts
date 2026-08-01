import { SimplePool } from 'nostr-tools/pool';
import type { Event, Filter } from 'nostr-tools';
import { CANONICAL_RELAY } from './btc-relay';

export { CANONICAL_RELAY } from './btc-relay';

/**
 * DEFAULT_RELAYS is retained as a compatibility name for older callers, but
 * it is deliberately the canonical relay only. Backup relays are publish-only.
 */
export const DEFAULT_RELAYS = [CANONICAL_RELAY];

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
  // NIP-65 preferences are intentionally ignored for website/community data:
  // the btc-online relay is the sole canonical read source.
  return { read: [CANONICAL_RELAY], write: [CANONICAL_RELAY] };
}

export interface FavouritesResult {
  urls: Set<string>;
  /** Merchant URL → ALL of the user's live kind-7 reaction event ids (unlikes delete every one). */
  reactionIds: Map<string, string[]>;
  event: Event | null;
  isPrivate: boolean;
}

/**
 * Fetch the user's likes.
 * Public likes are NIP-25 kind-7 reaction events (content "+", with an
 * ["r", <merchant-url>] tag); an unlike is a kind-5 deletion of the reaction.
 * Kind 10003 is never written for likes anymore — it is only READ here for
 * backwards compatibility: a `private:true` event marks encrypted private
 * likes, and a public legacy event's `r` tags are merged so older likes are
 * not lost before they are migrated.
 */
export async function fetchFavourites(pubkey: string, relays: string[]): Promise<FavouritesResult> {
  const [reactions, deletions, legacy] = await Promise.all([
    poolQuerySync(relays, { kinds: [7], authors: [pubkey] }),
    poolQuerySync(relays, { kinds: [5], authors: [pubkey] }),
    poolGet(relays, { kinds: [10003], authors: [pubkey] }),
  ]);

  const deletedIds = new Set<string>();
  for (const d of deletions) {
    for (const t of d.tags) if (t[0] === 'e') deletedIds.add(t[1]);
  }

  const urls = new Set<string>();
  const reactionIds = new Map<string, string[]>();
  // A URL is liked while at least one live (non-deleted) positive reaction
  // exists. Every live reaction id is tracked so an unlike can delete them
  // all — duplicates from retries or other clients must not survive.
  for (const ev of reactions) {
    if (deletedIds.has(ev.id)) continue;
    if (ev.content !== '+' && ev.content !== '') continue; // only positive reactions count as likes
    const url = ev.tags.find(t => t[0] === 'r')?.[1];
    if (!url) continue;
    urls.add(url);
    const ids = reactionIds.get(url) ?? [];
    ids.push(ev.id);
    reactionIds.set(url, ids);
  }

  if (!legacy) return { urls, reactionIds, event: null, isPrivate: false };

  const isPrivate = legacy.tags.some(t => t[0] === 'private' && t[1] === 'true');
  if (!isPrivate) {
    for (const tag of legacy.tags) {
      if (tag[0] === 'r') urls.add(tag[1]);
    }
  }
  return { urls, reactionIds, event: legacy, isPrivate };
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

/** Race a promise against a hard timeout; resolves with fallback if time runs out. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);
}

export async function fetchLikeCount(url: string, relays: string[]): Promise<number> {
  return (await fetchLikeAuthors(url, relays)).length;
}

/**
 * Fetch pubkeys that publicly like a merchant URL.
 * A like is a NIP-25 kind-7 reaction (content "+", ["r", <url>] tag); an
 * unlike is a kind-5 deletion of that reaction, so reactions referenced by
 * an author's deletion event are excluded. Public legacy kind-10003 bookmark
 * events are unioned in for backwards compatibility only — new likes are
 * never written as kind 10003.
 */
export async function fetchLikeAuthors(url: string, relays: string[]): Promise<string[]> {
  try {
    const reactions = await withTimeout(
      pool.querySync(relays, { kinds: [7], '#r': [url], limit: 500 } as Filter, { maxWait: 4000 }),
      6000,
      [] as Event[],
    );
    const positive = reactions.filter(
      e => (e.content === '+' || e.content === '') && e.tags.some(t => t[0] === 'r' && t[1] === url),
    );

    const authors = Array.from(new Set(positive.map(e => e.pubkey)));
    const deletions = authors.length
      ? await withTimeout(
          pool.querySync(relays, { kinds: [5], authors, limit: 500 } as Filter, { maxWait: 4000 }),
          6000,
          [] as Event[],
        )
      : [];
    const deletedByAuthor = new Map<string, Set<string>>();
    for (const d of deletions) {
      for (const t of d.tags) {
        if (t[0] !== 'e') continue;
        const set = deletedByAuthor.get(d.pubkey) ?? new Set<string>();
        set.add(t[1]);
        deletedByAuthor.set(d.pubkey, set);
      }
    }

    // Unified like rule (same as fetchFavourites): an author likes the URL
    // while at least one live (non-deleted) positive reaction exists.
    const liked = new Set<string>();
    for (const e of positive) {
      if (!deletedByAuthor.get(e.pubkey)?.has(e.id)) liked.add(e.pubkey);
    }

    // Legacy compat: authors whose latest public kind-10003 still lists the URL.
    const legacyEvents = await withTimeout(
      pool.querySync(relays, { kinds: [10003], limit: 500 } as Filter, { maxWait: 4000 }),
      6000,
      [] as Event[],
    );
    const latestLegacyByAuthor = new Map<string, Event>();
    for (const e of legacyEvents) {
      if (e.tags.some(t => t[0] === 'private' && t[1] === 'true')) continue;
      const current = latestLegacyByAuthor.get(e.pubkey);
      if (!current || e.created_at > current.created_at) latestLegacyByAuthor.set(e.pubkey, e);
    }
    for (const [author, e] of Array.from(latestLegacyByAuthor)) {
      if (e.tags.some((t: string[]) => t[0] === 'r' && t[1] === url)) liked.add(author);
    }

    return Array.from(liked);
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
