"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Database } from "@/lib/types/database";

export type HistoryRow = Database["public"]["Tables"]["generation_history"]["Row"];

export function useHistory(featureType: string) {
  const queryClient = useQueryClient();

  const query = useQuery<HistoryRow[]>({
    queryKey: queryKeys.history.byFeature(featureType),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("generation_history")
        .select("*")
        .eq("feature_type", featureType)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[HistoryPanel] fetch error:", error.message, error);
        throw error;
      }
      // 5분 이상 pending인 행은 클라이언트에서 제외 (DB cron이 정리하기 전까지의 간극)
      const PENDING_TIMEOUT_MS = 5 * 60 * 1000;
      const now = Date.now();
      return ((data ?? []) as HistoryRow[]).filter((row) => {
        if (row.status !== "pending") return true;
        return now - new Date(row.created_at).getTime() <= PENDING_TIMEOUT_MS;
      });
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.history.byFeature(featureType) });
      const previous = queryClient.getQueryData<HistoryRow[]>(queryKeys.history.byFeature(featureType));
      queryClient.setQueryData<HistoryRow[]>(
        queryKeys.history.byFeature(featureType),
        (old) => old?.filter((h) => h.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.history.byFeature(featureType), context.previous);
      }
    },
  });

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    deleteHistory: deleteMutation.mutate,
  };
}

/** 생성 시작 시 히스토리 캐시에 pending 항목을 즉시 추가한다 (낙관적 업데이트) */
export function prependHistoryItem(
  queryClient: ReturnType<typeof useQueryClient>,
  featureType: string,
  item: {
    id: string;
    model_id: string;
    prompt: string;
    credits_used: number;
    metadata: Record<string, unknown>;
    status?: string;
    input_urls?: string[];
  }
) {
  const newRow: HistoryRow = {
    id: item.id,
    user_id: "",
    feature_type: featureType,
    model_id: item.model_id,
    prompt: item.prompt,
    input_urls: item.input_urls ?? [],
    thumb_urls: [],
    display_urls: [],
    original_urls: [],
    credits_used: item.credits_used,
    metadata: item.metadata,
    status: item.status ?? "pending",
    error_message: null,
    onetime_deducted: 0,
    subscription_deducted: 0,
    created_at: new Date().toISOString(),
  };

  queryClient.setQueryData<HistoryRow[]>(
    queryKeys.history.byFeature(featureType),
    (old) => [newRow, ...(old ?? [])].slice(0, 50)
  );
}

/** 임시 ID를 실제 historyId로 교체한다 (API 응답 후) */
export function replaceHistoryId(
  queryClient: ReturnType<typeof useQueryClient>,
  featureType: string,
  tempId: string,
  realId: string
) {
  queryClient.setQueryData<HistoryRow[]>(
    queryKeys.history.byFeature(featureType),
    (old) => old?.map((h) => h.id === tempId ? { ...h, id: realId } : h) ?? []
  );
}

/** 낙관적으로 추가한 pending 항목을 제거한다 (API 호출 실패 시) */
export function removeHistoryItem(
  queryClient: ReturnType<typeof useQueryClient>,
  featureType: string,
  id: string
) {
  queryClient.setQueryData<HistoryRow[]>(
    queryKeys.history.byFeature(featureType),
    (old) => old?.filter((h) => h.id !== id) ?? []
  );
}
