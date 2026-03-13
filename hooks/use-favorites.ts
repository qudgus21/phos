"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImageForFavorite } from "@/lib/utils/compress-image";
import type { Database } from "@/lib/types/database";

type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];

export type { FavoriteRow };

const MAX_FAVORITES = 5;

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
}

export function useFavorites(featureType: string = "image-edit") {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFavorites = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("feature_type", featureType)
      .order("created_at", { ascending: false })
      .limit(MAX_FAVORITES);

    if (data) setFavorites(data as FavoriteRow[]);
    setIsLoading(false);
  }, [featureType]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const saveFavorite = useCallback(
    async (input: SaveFavoriteInput) => {
      const supabase = createClient();

      // 현재 유저
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      // 5개 제한 체크
      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", featureType);

      if ((count ?? 0) >= MAX_FAVORITES) {
        throw new Error("즐겨찾기는 최대 5개까지 저장할 수 있습니다");
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
        })
        .select()
        .single();

      if (insertError || !row) {
        throw new Error(insertError?.message ?? "저장에 실패했습니다");
      }

      // 참조이미지 압축 & Storage 업로드
      if (input.images.length > 0) {
        const urls: string[] = [];
        const compressed = await Promise.all(
          input.images.map((img) => compressImageForFavorite(img))
        );

        for (let i = 0; i < compressed.length; i++) {
          const path = `${user.id}/${row.id}/${i}.webp`;
          const { error: uploadError } = await supabase.storage
            .from("favorite-images")
            .upload(path, compressed[i], {
              contentType: "image/webp",
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("favorite-images").getPublicUrl(path);
          urls.push(publicUrl);
        }

        // URL 업데이트
        if (urls.length > 0) {
          await supabase
            .from("favorites")
            .update({ reference_image_urls: urls })
            .eq("id", row.id);
        }
      }

      await fetchFavorites();
    },
    [featureType, fetchFavorites]
  );

  const deleteFavorite = useCallback(
    async (id: string) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 해당 row 조회 (이미지 개수 파악)
      const target = favorites.find((f) => f.id === id);
      if (target && target.reference_image_urls.length > 0) {
        const paths = target.reference_image_urls.map((url) => {
          // public URL에서 path 추출
          const idx = url.indexOf("/favorite-images/");
          return idx >= 0 ? url.slice(idx + "/favorite-images/".length) : "";
        }).filter(Boolean);

        if (paths.length > 0) {
          await supabase.storage.from("favorite-images").remove(paths);
        }
      }

      await supabase.from("favorites").delete().eq("id", id);
      await fetchFavorites();
    },
    [favorites, fetchFavorites]
  );

  return {
    favorites,
    isLoading,
    isSaving,
    setIsSaving,
    saveFavorite,
    deleteFavorite,
    fetchFavorites,
    maxFavorites: MAX_FAVORITES,
    isFull: favorites.length >= MAX_FAVORITES,
  };
}
