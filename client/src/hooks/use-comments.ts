import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface MerchantComment {
  id: number;
  merchantId: number;
  userId: number;
  body: string;
  createdAt: string;
  authorName: string;
}

export function useComments(merchantId: number, enabled = true) {
  return useQuery<MerchantComment[]>({
    queryKey: [`/api/merchants/${merchantId}/comments`],
    enabled: enabled && merchantId > 0,
  });
}

export function useSubmitComment(merchantId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/merchants/${merchantId}/comments`, { body });
      return res.json() as Promise<MerchantComment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/merchants/${merchantId}/comments`] });
    },
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
