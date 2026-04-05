"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { HistoryRow } from "@/hooks/use-history";

const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5분 (webhook 재시도 + 업스케일 체이닝 시간 고려)

interface UseGenerationRealtimeOptions {
  onCompleted?: (row: HistoryRow) => void;
  onFailed?: (row: HistoryRow) => void;
}

export function useGenerationRealtime(
  featureType: string,
  options?: UseGenerationRealtimeOptions
) {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const supabaseRef = useRef(createClient());

  // 마운트 시 pending row 복구
  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase
      .from("generation_history")
      .select("*")
      .eq("feature_type", featureType)
      .eq("status", "pending")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const now = Date.now();
          const active: typeof data = [];
          const expired: typeof data = [];

          for (const row of data) {
            const age = now - new Date(row.created_at).getTime();
            if (age > PENDING_TIMEOUT_MS) {
              expired.push(row);
            } else {
              active.push(row);
            }
          }

          // 타임아웃된 pending은 무시 (useHistory queryFn에서 이미 필터링됨)

          if (active.length > 0) {
            const ids = active.map((r) => r.id);
            setPendingIds((prev) => [...new Set([...prev, ...ids])]);

            // 캐시에도 pending row 추가
            queryClient.setQueryData<HistoryRow[]>(
              queryKeys.history.byFeature(featureType),
              (old) => {
                const existing = old ?? [];
                const newRows = (active as HistoryRow[]).filter(
                  (r) => !existing.some((e) => e.id === r.id)
                );
                return [...newRows, ...existing].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              }
            );
          }
        }
      });
  }, [featureType, queryClient]);

  // Realtime 구독 — auth 세션이 준비된 후에 채널 구독 (RLS에 access_token 필요)
  // 프로덕션 풀 페이지 로드 시, 채널이 auth 복원보다 먼저 join되면
  // phx_join에 access_token이 빠져서 RLS(auth.uid()=user_id)에 의해 이벤트가 필터링됨
  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // 1. auth 세션 복원 대기
      await supabase.auth.getSession();
      if (cancelled) return;

      // 2. realtime에 access_token 확실히 설정 (accessToken 콜백 사용)
      await supabase.realtime.setAuth();
      if (cancelled) return;

      // 3. 이제 accessTokenValue가 설정된 상태에서 채널 구독
      channel = supabase
        .channel(`gen-${featureType}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "generation_history",
            filter: `feature_type=eq.${featureType}`,
          },
          (payload) => {
            const newRow = payload.new as HistoryRow;

            if (newRow.status === "completed") {
              queryClient.setQueryData<HistoryRow[]>(
                queryKeys.history.byFeature(featureType),
                (old) =>
                  old?.map((h) => (h.id === newRow.id ? newRow : h)) ?? [
                    newRow,
                  ]
              );
              setPendingIds((prev) => prev.filter((id) => id !== newRow.id));
              optionsRef.current?.onCompleted?.(newRow);
            } else if (newRow.status === "failed") {
              queryClient.setQueryData<HistoryRow[]>(
                queryKeys.history.byFeature(featureType),
                (old) => old?.filter((h) => h.id !== newRow.id) ?? []
              );
              setPendingIds((prev) => prev.filter((id) => id !== newRow.id));
              optionsRef.current?.onFailed?.(newRow);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [featureType, queryClient]);

  // API 응답 후 즉시 추적 시작 (레이스 컨디션 방지)
  const trackGeneration = useCallback(
    (historyId: string) => {
      setPendingIds((prev) => [...new Set([...prev, historyId])]);

      // 이미 완료됐을 수 있으니 DB 재확인
      const supabase = supabaseRef.current;
      supabase
        .from("generation_history")
        .select("*")
        .eq("id", historyId)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const row = data as HistoryRow;

          if (row.status === "completed") {
            queryClient.setQueryData<HistoryRow[]>(
              queryKeys.history.byFeature(featureType),
              (old) =>
                old?.map((h) => (h.id === row.id ? row : h)) ?? [row]
            );
            setPendingIds((prev) => prev.filter((id) => id !== historyId));
            optionsRef.current?.onCompleted?.(row);
          } else if (row.status === "failed") {
            queryClient.setQueryData<HistoryRow[]>(
              queryKeys.history.byFeature(featureType),
              (old) => old?.filter((h) => h.id !== row.id) ?? []
            );
            setPendingIds((prev) => prev.filter((id) => id !== historyId));
            optionsRef.current?.onFailed?.(row);
          }
        });
    },
    [featureType, queryClient]
  );

  return {
    pendingIds,
    isGenerating: pendingIds.length > 0,
    trackGeneration,
  };
}
