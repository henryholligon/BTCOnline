import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useNostr } from "@/context/NostrContext";

export interface MerchantComment {
  id: number;
  merchantId: number;
  userId: number;
  body: string;
  createdAt: string;
  authorName: string;
  rating?: number | null;
}

export interface MerchantRating {
  average: number;
  count: number;
}

export function useComments(merchantId: number, enabled = true) {
  return useQuery<MerchantComment[]>({
    queryKey: [`/api/merchants/${merchantId}/comments`],
    enabled: enabled && merchantId > 0,
  });
}

export function useMyComment(merchantId: number, enabled = true) {
  const { user, signEvent } = useNostr();
  return useQuery<MerchantComment | null>({
    queryKey: [`/api/merchants/${merchantId}/my-comment`, user?.pubkey ?? "anonymous"],
    enabled: enabled && merchantId > 0,
    // 404 means "no comment yet" — treat as null rather than an error
    queryFn: async () => {
      const path = `/api/merchants/${merchantId}/my-comment`;
      const headers: Record<string, string> = {};
      if (user) {
        const event = await signEvent({
          kind: 22242,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["u", path], ["method", "GET"]],
          content: "Authenticate to view my comment",
        });
        headers["x-nostr-event"] = JSON.stringify(event);
      }
      const res = await fetch(path, { credentials: "include", headers });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch existing comment");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useMyReview(merchantId: number, enabled = true) {
  const { user, signEvent } = useNostr();
  return useQuery<MerchantComment | null>({
    queryKey: [`/api/merchants/${merchantId}/my-review`, user?.pubkey ?? "anonymous"],
    enabled: enabled && merchantId > 0,
    queryFn: async () => {
      const path = `/api/merchants/${merchantId}/my-review`;
      const headers: Record<string, string> = {};
      if (user) {
        const event = await signEvent({
          kind: 22242,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["u", path], ["method", "GET"]],
          content: "Authenticate to view my review",
        });
        headers["x-nostr-event"] = JSON.stringify(event);
      }
      const res = await fetch(path, { credentials: "include", headers });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch existing review");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useSubmitComment(merchantId: number) {
  const { user, signEvent } = useNostr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, rating }: { body: string; rating: number | null }) => {
      const path = `/api/merchants/${merchantId}/comments`;
      const event = user ? await signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["u", path], ["method", "POST"]],
        content: "Authenticate to post a comment",
      }) : null;
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(event ? { "x-nostr-event": JSON.stringify(event) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ body, rating }),
      });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json() as Promise<MerchantComment>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/rating`] });
      if (data.rating != null) {
        queryClient.setQueryData([`/api/merchants/${merchantId}/my-review`, user?.pubkey ?? "anonymous"], data);
      }
    },
    throwOnError: false,
  });
}

export function useMerchantRating(merchantId: number, enabled = true) {
  return useQuery<MerchantRating | null>({
    queryKey: [`/api/merchants/${merchantId}/rating`],
    enabled: enabled && merchantId > 0,
  });
}

export function useDeleteComment(merchantId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/comments`] });
    },
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
    staleTime: Infinity, // never changes during a session
  });
  return data?.pubkey ?? null;
}
