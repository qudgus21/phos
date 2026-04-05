"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { compressImageForFavorite } from "@/lib/utils/compress-image";
import { queryKeys } from "@/lib/query-keys";
import type { Database } from "@/lib/types/database";
import type { ApiResponse } from "@/lib/types/api";

type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];

export type { FavoriteRow };

interface SaveFavoriteInput {
  name: string;
  prompt: string;
  modelId: string;
  ratio: string;
  imageSize: string;
  scale: number;
  imageCount: number;
  /** File 또는 URL — 압축 후 Storage 업로드 */
  images: (File | string)[];
  /** 기능별 추가 설정 (retouching filter/gender/mode 등) */
  metadata?: Record<string, unknown>;
}

export function useFavorites(featureType: string = "image-edit", maxFavorites: number = 3) {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery<FavoriteRow[]>({
    queryKey: queryKeys.favorites.byFeature(featureType),
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("feature_type", featureType)
        .order("created_at", { ascending: false })
        .limit(maxFavorites);

      return (data ?? []) as FavoriteRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SaveFavoriteInput) => {
      const supabase = createClient();

      // 현재 유저
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("AUTH_REQUIRED");

      // 5개 제한 체크
      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", featureType);

      if ((count ?? 0) >= maxFavorites) {
        throw new Error("MAX_FAVORITES");
      }

      // DB row 먼저 생성 (ID 확보)
      const { data: row, error: insertError } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          feature_type: featureType,
          name: input.name,
          prompt: input.prompt,
          model_id: input.modelId,
          ratio: input.ratio,
          image_size: input.imageSize,
          scale: input.scale,
          image_count: input.imageCount,
          reference_image_urls: [],
          metadata: input.metadata ?? {},
        })
        .select()
        .single();

      if (insertError || !row) {
        throw new Error("SAVE_FAILED");
      }

      // 참조이미지 압축 & R2 업로드
      if (input.images.length > 0) {
        const urls: string[] = [];
        const compressed = await Promise.all(
          input.images.map((img) => compressImageForFavorite(img))
        );

        for (let i = 0; i < compressed.length; i++) {
          const key = `favorite-images/${user.id}/${row.id}/${i}.webp`;

          // presigned URL 발급
          const presignRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: key, contentType: "image/webp" }),
          });
          if (!presignRes.ok) {
            console.error("Presign failed:", await presignRes.text());
            continue;
          }
          const { data } = (await presignRes.json()) as ApiResponse<{
            uploadUrl: string;
            publicUrl: string;
          }>;

          // R2에 직접 업로드
          const uploadRes = await fetch(data.uploadUrl, {
            method: "PUT",
            body: compressed[i],
            headers: { "Content-Type": "image/webp" },
          });
          if (!uploadRes.ok) {
            console.error("R2 upload failed:", uploadRes.status);
            continue;
          }

          urls.push(data.publicUrl);
        }

        // URL 업데이트
        if (urls.length > 0) {
          await supabase
            .from("favorites")
            .update({ reference_image_urls: urls })
            .eq("id", row.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.byFeature(featureType) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 캐시에서 target 찾기 (optimistic에서 이미 제거되었으므로 previousData에서 찾음)
      const target = favorites.find((f) => f.id === id);
      if (target && target.reference_image_urls.length > 0) {
        // R2 public URL에서 key 추출: https://pub-xxx.r2.dev/{key}
        const keys = target.reference_image_urls
          .map((url) => {
            try {
              const u = new URL(url);
              return u.pathname.slice(1); // leading slash 제거
            } catch {
              return "";
            }
          })
          .filter(Boolean);

        if (keys.length > 0) {
          await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: keys }),
          });
        }
      }

      await supabase.from("favorites").delete().eq("id", id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.byFeature(featureType) });
      const previous = queryClient.getQueryData<FavoriteRow[]>(queryKeys.favorites.byFeature(featureType));
      queryClient.setQueryData<FavoriteRow[]>(
        queryKeys.favorites.byFeature(featureType),
        (old) => old?.filter((f) => f.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.favorites.byFeature(featureType), context.previous);
      }
    },
  });

  return {
    favorites,
    isLoading,
    saveFavorite: saveMutation.mutateAsync,
    deleteFavorite: deleteMutation.mutate,
    fetchFavorites: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.byFeature(featureType) }),
    maxFavorites,
    isFull: favorites.length >= maxFavorites,
  };
}
