"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { UserCreditInfo } from "@/lib/types/credits";

export function useCreditsBalance(enabled: boolean) {
  return useQuery<UserCreditInfo>({
    queryKey: queryKeys.credits.balance,
    queryFn: async () => {
      const res = await fetch("/api/credits/balance");
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch credits");
      return json.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
