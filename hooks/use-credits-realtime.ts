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
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      await supabase.auth.getSession();
      if (cancelled) return;
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
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
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
