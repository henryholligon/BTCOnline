import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNostr } from "@/context/NostrContext";
import { pool, poolQuerySync, REVIEW_KIND, RATING_TAG, CANONICAL_RELAY } from "@/lib/nostr";
import type { Event, Filter } from "nostr-tools";

export interface MerchantComment {
  /** Nostr event id (hex). */
  id: string;
  /** Plain-text comment body (may be empty for star-only reviews). */
  body: string;
  /** Unix timestamp of the event. */
  createdAt: number;
  /** Author's hex pubkey. */
  pubkey: string;
  /** 1–5 star rating (undefined = plain comment without rating). */
  rating?: number;
  /** Parent event id for replies; undefined = top-level. */
  parentId?: string;
  /** Derived display name (from kind:0 profile or fallback). */
  authorName: string;
  /** Author's kind:0 picture URL, if available. */
  authorPicture?: string;
}

export interface MerchantRating {
  average: number;
  count: number;
}

interface NostrProfile {
  displayName: string;
  picture?: string;
}

/** Module-level cache so profiles survive across card open/close cycles. */
const profileCache = new Map<string, NostrProfile>();
/** Tracks pubkeys whose fetch is already in flight to avoid duplicate requests. */
const inFlight = new Set<string>();

/**
 * Given a list of hex pubkeys, fetches their kind:0 metadata from the canonical
 * relay in a single batched query and returns a map of pubkey → NostrProfile.
 * Results are cached for the lifetime of the page; repeated calls are instant.
 */
export function useNostrProfiles(pubkeys: (string | null | undefined)[]): Map<string, NostrProfile> {
  const [profiles, setProfiles] = useState<Map<string, NostrProfile>>(() => new Map(profileCache));

  useEffect(() => {
    const missing = [...new Set(pubkeys.filter((p): p is string => !!p && !profileCache.has(p) && !inFlight.has(p)))];
    if (missing.length === 0) return;
    missing.forEach(p => inFlight.add(p));

    let cancelled = false;
    pool.querySync([CANONICAL_RELAY], { kinds: [0], authors: missing }, { maxWait: 5000 })
      .then(events => {
        if (cancelled) return;
        const best = new Map<string, { created_at: number; content: string }>();
        for (const ev of events) {
          const prev = best.get(ev.pubkey);
          if (!prev || ev.created_at > prev.created_at) best.set(ev.pubkey, ev);
        }
        best.forEach((ev, pk) => {
          try {
            const meta = JSON.parse(ev.content) as { name?: string; display_name?: string; picture?: string };
            const displayName = meta.display_name?.trim() || meta.name?.trim() || `npub:${pk.slice(0, 8)}…`;
            profileCache.set(pk, { displayName, picture: meta.picture });
          } catch {
            profileCache.set(pk, { displayName: `npub:${pk.slice(0, 8)}…` });
          }
          inFlight.delete(pk);
        });
        missing.forEach(pk => {
          if (!profileCache.has(pk)) {
            profileCache.set(pk, { displayName: `npub:${pk.slice(0, 8)}…` });
            inFlight.delete(pk);
          }
        });
        setProfiles(new Map(profileCache));
      })
      .catch(() => {
        missing.forEach(pk => { inFlight.delete(pk); });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkeys.filter(Boolean).sort().join(",")]);

  return profiles;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a kind-1111 Nostr event into a MerchantComment display object.
 * Author profiles are read from the in-memory cache (populated by useNostrProfiles).
 */
function eventToComment(ev: Event): MerchantComment {
  const ratingTag = ev.tags.find(t => t[0] === RATING_TAG);
  // NIP-22: ["e", <parent-id>, <relay-url>, "reply"] marks a threaded reply.
  // Events without a "reply" marker are top-level comments on the merchant.
  const replyTag = ev.tags.find(t => t[0] === 'e' && t[3] === 'reply');
  const profile = profileCache.get(ev.pubkey);
  return {
    id: ev.id,
    body: ev.content,
    createdAt: ev.created_at,
    pubkey: ev.pubkey,
    rating: ratingTag ? parseInt(ratingTag[1], 10) : undefined,
    parentId: replyTag?.[1],
    authorName: profile?.displayName ?? `npub:${ev.pubkey.slice(0, 8)}…`,
    authorPicture: profile?.picture,
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all kind-1111 comment/review events for a merchant from the canonical
 * relay. Results are deduplicated by id and sorted chronologically.
 */
export function useComments(merchantWebsite: string, enabled = true) {
  return useQuery<MerchantComment[]>({
    queryKey: ["nostr-comments", merchantWebsite],
    enabled: enabled && !!merchantWebsite,
    queryFn: async () => {
      const events = await poolQuerySync(
        [CANONICAL_RELAY],
        { kinds: [REVIEW_KIND], '#r': [merchantWebsite], limit: 500 } as Filter,
        8000,
      );
      return events
        .map(eventToComment)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    staleTime: 30_000,
  });
}

/**
 * Returns the current user's latest comment event for a merchant, or null.
 */
export function useMyComment(merchantWebsite: string, enabled = true) {
  const { user } = useNostr();
  return useQuery<MerchantComment | null>({
    queryKey: ["nostr-my-comment", merchantWebsite, user?.pubkey ?? "anonymous"],
    enabled: enabled && !!merchantWebsite && !!user,
    queryFn: async () => {
      if (!user) return null;
      const events = await poolQuerySync(
        [CANONICAL_RELAY],
        { kinds: [REVIEW_KIND], authors: [user.pubkey], '#r': [merchantWebsite] } as Filter,
        8000,
      );
      if (events.length === 0) return null;
      // Return the most recent event
      const sorted = events.sort((a, b) => b.created_at - a.created_at);
      return eventToComment(sorted[0]);
    },
    staleTime: 30_000,
  });
}

/**
 * Returns the current user's latest review (comment with a rating tag) for a
 * merchant, or null if they haven't left one.
 */
export function useMyReview(merchantWebsite: string, enabled = true) {
  const { user } = useNostr();
  return useQuery<MerchantComment | null>({
    queryKey: ["nostr-my-review", merchantWebsite, user?.pubkey ?? "anonymous"],
    enabled: enabled && !!merchantWebsite && !!user,
    queryFn: async () => {
      if (!user) return null;
      const events = await poolQuerySync(
        [CANONICAL_RELAY],
        { kinds: [REVIEW_KIND], authors: [user.pubkey], '#r': [merchantWebsite] } as Filter,
        8000,
      );
      const reviews = events.filter(e => e.tags.some(t => t[0] === RATING_TAG));
      if (reviews.length === 0) return null;
      reviews.sort((a, b) => b.created_at - a.created_at);
      return eventToComment(reviews[0]);
    },
    staleTime: 30_000,
  });
}

/**
 * Compute the aggregate rating (average & count) for a merchant from all
 * kind-1111 events with a rating tag. Deduplicated by author — only the
 * latest review per pubkey counts toward the average.
 */
export function useMerchantRating(merchantWebsite: string, enabled = true) {
  return useQuery<MerchantRating | null>({
    queryKey: ["nostr-rating", merchantWebsite],
    enabled: enabled && !!merchantWebsite,
    queryFn: async () => {
      const events = await poolQuerySync(
        [CANONICAL_RELAY],
        { kinds: [REVIEW_KIND], '#r': [merchantWebsite], limit: 500 } as Filter,
        8000,
      );
      // Deduplicate by author — keep latest review per pubkey
      const latestByAuthor = new Map<string, number>();
      for (const ev of events) {
        const tag = ev.tags.find(t => t[0] === RATING_TAG);
        if (!tag) continue;
        const r = parseInt(tag[1], 10);
        if (r < 1 || r > 5) continue;
        const existing = latestByAuthor.get(ev.pubkey);
        if (existing === undefined || ev.created_at > existing) {
          latestByAuthor.set(ev.pubkey, r);
        }
      }
      const uniqueRatings = Array.from(latestByAuthor.values());
      if (uniqueRatings.length === 0) return null;
      const sum = uniqueRatings.reduce((a, b) => a + b, 0);
      return {
        average: Math.round((sum / uniqueRatings.length) * 10) / 10,
        count: uniqueRatings.length,
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Delete a comment/review event by publishing a NIP-09 kind-5 deletion event.
 * The mutation accepts the event id (hex string) of the comment to delete.
 * Only the event author or an admin should call this.
 */
export function useDeleteComment() {
  const { publishEvent, user } = useNostr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Sign in first");
      await publishEvent({
        kind: 5,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', eventId], ['k', '1111']],
        content: '',
      });
    },
    throwOnError: false,
  });
}

export function useIsAdmin() {
  const { data } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/admin-status"],
    staleTime: 30_000,
  });
  return data?.isAdmin ?? false;
}

/** Returns the master Nostr pubkey (hex) used to publish merchant listings, or null. */
export function useMasterPubkey(): string | null {
  const { data } = useQuery<{ pubkey: string | null }>({
    queryKey: ["/api/nostr/master-pubkey"],
    staleTime: Infinity,
  });
  return data?.pubkey ?? null;
}
