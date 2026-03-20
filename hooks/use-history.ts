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
      return (data ?? []) as HistoryRow[];
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

/** 생성 완료 후 히스토리 캐시에 새 항목을 추가하고 지연 갱신을 예약한다 */
export function prependHistoryItem(
  queryClient: ReturnType<typeof useQueryClient>,
  featureType: string,
  item: {
    id?: string | null;
    display_urls: string[];
    original_urls: string[];
    input_urls: string[];
    model_id: string;
    prompt: string;
    credits_used: number;
    metadata: Record<string, unknown>;
  }
) {
  const newRow: HistoryRow = {
    id: item.id || crypto.randomUUID(),
    user_id: "",
    feature_type: featureType,
    model_id: item.model_id,
    prompt: item.prompt,
    input_urls: item.input_urls,
    thumb_urls: [],
    display_urls: item.display_urls,
    original_urls: item.original_urls,
    credits_used: item.credits_used,
    metadata: item.metadata,
    created_at: new Date().toISOString(),
  };

  queryClient.setQueryData<HistoryRow[]>(
    queryKeys.history.byFeature(featureType),
    (old) => [newRow, ...(old ?? [])].slice(0, 50)
  );

  // Lambda가 썸네일/display URL을 처리한 뒤 실제 데이터로 갱신
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.history.byFeature(featureType),
    });
  }, 3000);
}
