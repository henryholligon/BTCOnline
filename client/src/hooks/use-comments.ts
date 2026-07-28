import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  return useQuery<MerchantComment | null>({
    queryKey: [`/api/merchants/${merchantId}/my-comment`],
    enabled: enabled && merchantId > 0,
    // 404 means "no comment yet" — treat as null rather than an error
    queryFn: async () => {
      const res = await fetch(`/api/merchants/${merchantId}/my-comment`, { credentials: "include" });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch existing comment");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useSubmitComment(merchantId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, rating }: { body: string; rating: number | null }) => {
      const res = await apiRequest("POST", `/api/merchants/${merchantId}/comments`, { body, rating });
      return res.json() as Promise<MerchantComment>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/rating`] });
      queryClient.setQueryData([`/api/merchants/${merchantId}/my-comment`], data);
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
