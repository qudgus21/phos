"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

/**
 * user_credits 테이블 변경을 Realtime으로 감지하여
 * credits.balance 쿼리를 자동 갱신한다.
 */
export function useCreditsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!userId) return;

    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
