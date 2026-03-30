"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { HistoryRow } from "@/hooks/use-history";

const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5분

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

          // 타임아웃된 pending은 failed 처리 (UI에서만 제거)
          if (expired.length > 0) {
            for (const row of expired) {
              optionsRef.current?.onFailed?.({
                ...row,
                status: "failed",
                error_message: "생성 시간이 초과되었습니다",
              } as HistoryRow);
            }
          }

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

  // Realtime 구독
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
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
            // 캐시에서 pending row를 completed로 교체
            queryClient.setQueryData<HistoryRow[]>(
              queryKeys.history.byFeature(featureType),
              (old) =>
                old?.map((h) => (h.id === newRow.id ? newRow : h)) ?? [newRow]
            );
            setPendingIds((prev) => prev.filter((id) => id !== newRow.id));
            optionsRef.current?.onCompleted?.(newRow);
          } else if (newRow.status === "failed") {
            // 실패한 row는 캐시에서 제거
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

    return () => {
      supabase.removeChannel(channel);
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
