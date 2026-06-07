import { SimplePool } from 'nostr-tools/pool';
import type { Event, Filter } from 'nostr-tools';

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
];

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
    // Collect all responses within the window and return the one with the
    // highest created_at so we never serve stale replaceable-event data.
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

export async function fetchRelayList(pubkey: string): Promise<{ read: string[]; write: string[] }> {
  const event = await poolGet(DEFAULT_RELAYS, { kinds: [10002], authors: [pubkey] });
  if (!event) return { read: DEFAULT_RELAYS, write: DEFAULT_RELAYS };

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

export async function fetchFavourites(pubkey: string, relays: string[]): Promise<Set<string>> {
  const event = await poolGet(relays, { kinds: [10003], authors: [pubkey] });
  const urls = new Set<string>();
  if (!event) return urls;
  for (const tag of event.tags) {
    if (tag[0] === 'r') urls.add(tag[1]);
  }
  return urls;
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

export function getListTitle(event: Event): string {
  const titleTag = event.tags.find(t => t[0] === 'title');
  if (titleTag?.[1]) return titleTag[1];
  const dTag = event.tags.find(t => t[0] === 'd');
  return dTag?.[1] || 'Untitled List';
}

export function getListUrls(event: Event): string[] {
  return event.tags.filter(t => t[0] === 'r').map(t => t[1]);
}
