"use client";

import { useState, useCallback, type RefObject } from "react";
import Image from "next/image";
import { Star, Loader2, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { RetouchingFavoriteSaveModal } from "@/components/sections/retouching/retouching-favorite-save-modal";
import { RETOUCHING_SAMPLES } from "@/lib/constants/retouching-samples";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreditsBalance } from "@/hooks/use-credits";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { RetouchingInputPanelHandle } from "@/components/sections/retouching/retouching-input-panel";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface RetouchingSampleSidebarProps {
  inputPanelRef: RefObject<RetouchingInputPanelHandle | null>;
  selectedSampleId: string | null;
  onSelectSample: (id: string | null) => void;
}

export function RetouchingSampleSidebar({
  inputPanelRef,
  selectedSampleId,
  onSelectSample,
}: RetouchingSampleSidebarProps) {
  const dict = useDictionary();
  const TABS = [
    { id: "samples", label: dict.common.tabs.samples },
    { id: "favorites", label: dict.common.tabs.favorites },
  ];
  const [activeTab, setActiveTab] = useState("samples");
  const { toast } = useToast();

  const { data: creditInfo } = useCreditsBalance(true);
  const planMaxFavorites = creditInfo?.plan?.maxFavorites ?? 3;
  const { favorites, isLoading: favLoading, saveFavorite, deleteFavorite, maxFavorites, isFull: favFull } = useFavorites("retouching", planMaxFavorites);
  const { requireAuth, loginModal } = useRequireAuth();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [deletingFavId, setDeletingFavId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      onSelectSample(selectedSampleId === id ? null : id);
    },
    [onSelectSample, selectedSampleId]
  );

  const handleSaveFavorite = useCallback(async (name: string) => {
    const settings = inputPanelRef.current?.getCurrentSettings();
    if (!settings) return;
    await saveFavorite({
      name,
      prompt: "",
      modelId: "retouching-gpt-image-1.5",
      ratio: settings.ratio,
      imageSize: "auto",
      scale: settings.scale,
      imageCount: 1,
      images: settings.image ? [settings.image] : [],
      metadata: {
        filter: settings.filter,
        filterIntensity: settings.filterIntensity,
        gender: settings.gender,
        mode: settings.mode,
        faceReshape: settings.faceReshape,
        faceReshapeIntensity: settings.faceReshapeIntensity,
        excludedAreas: settings.excludedAreas,
      },
    });
    toast(dict.tools.favorites.saved, "success");
  }, [inputPanelRef, saveFavorite, toast]);

  const handleLoadFavorite = useCallback((fav: typeof favorites[0]) => {
    inputPanelRef.current?.loadFavorite(fav);
  }, [inputPanelRef]);

  const getPreview = () => {
    const s = inputPanelRef.current?.getCurrentSettings();
    return {
      filter: s?.filter ?? "none",
      filterIntensity: s?.filterIntensity ?? 0.5,
      gender: s?.gender ?? "female",
      mode: s?.mode ?? "natural",
      faceReshape: s?.faceReshape ?? false,
      ratio: s?.ratio ?? "1:1",
      scale: s?.scale ?? 1,
      hasImage: !!s?.image,
    };
  };

  return (
    <>
    <aside className="hidden lg:flex flex-col w-[100px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-col p-2 gap-0.5 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full text-center px-3 py-2 text-[13px] font-medium rounded-md transition-all cursor-pointer",
              tab.id === activeTab
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
        {activeTab === "samples" &&
          RETOUCHING_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelect(sample.id)}
              className={cn(
                "w-full rounded-lg overflow-hidden border transition-colors cursor-pointer",
                selectedSampleId === sample.id
                  ? "border-indigo-500 ring-1 ring-indigo-500/50"
                  : "border-border hover:border-border/80"
              )}
            >
              <Image
                src={sample.thumbnail}
                alt={dict.tools.retouching.sampleLabels[sample.id] ?? sample.label}
                width={200}
                height={200}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}

        {activeTab === "favorites" && (
          <>
            {/* 저장 버튼 */}
            <button
              type="button"
              onClick={() => requireAuth(() => setShowSaveModal(true))}
              disabled={favFull}
              className={cn(
                "w-full flex items-center justify-center gap-1 py-2.5 rounded-lg border transition-colors cursor-pointer text-[11px] font-semibold",
                favFull
                  ? "border-border text-muted-foreground/60 dark:text-muted-foreground/40 cursor-not-allowed"
                  : "border-indigo-500/40 text-foreground bg-indigo-500/20 hover:bg-indigo-500/35 hover:border-indigo-500/60"
              )}
              title={favFull ? dict.tools.favorites.maxFavTitle.replace("{max}", String(maxFavorites)) : dict.tools.favorites.saveFavTitle}
            >
              <Plus className="w-3 h-3" />
              {dict.tools.favorites.countBadge.replace("{current}", String(favorites.length)).replace("{max}", String(maxFavorites))}
            </button>

            {/* 즐겨찾기 리스트 */}
            {favLoading ? (
              <div className="flex items-center justify-center pt-6">
                <Loader2 className="w-4 h-4 text-muted-foreground/70 dark:text-muted-foreground/50 animate-spin" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-6 gap-1.5">
                <Star className="w-5 h-5 text-muted-foreground/50 dark:text-muted-foreground/30" />
                <p className="text-[10px] text-muted-foreground/70 dark:text-muted-foreground/50 text-center leading-tight">
                  {dict.tools.favorites.emptyHint.split("\n").map((l, i) => i === 0 ? <>{l}<br /></> : l)}
                </p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="group relative w-full rounded-lg overflow-hidden border border-border hover:border-border/80 transition-colors cursor-pointer"
                  onClick={() => handleLoadFavorite(fav)}
                >
                  {/* 썸네일 */}
                  {fav.reference_image_urls.length > 0 ? (
                    <div className="relative w-full aspect-square bg-muted/30">
                      <Image
                        src={fav.reference_image_urls[0]}
                        alt=""
                        fill
                        unoptimized
                        sizes="100px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-muted/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-muted-foreground/40 dark:text-muted-foreground/20" />
                    </div>
                  )}
                  {/* 이름 오버레이 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1.5 pb-1 pt-4">
                    <p className="text-[10px] font-medium text-white/90 truncate leading-tight">{fav.name}</p>
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingFavId(fav.id);
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white/40 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>

    <RetouchingFavoriteSaveModal
      open={showSaveModal}
      onClose={() => setShowSaveModal(false)}
      onSave={handleSaveFavorite}
      currentCount={favorites.length}
      maxCount={maxFavorites}
      preview={getPreview()}
    />

    <ConfirmModal
      open={deletingFavId !== null}
      onClose={() => setDeletingFavId(null)}
      onConfirm={async () => {
        if (deletingFavId) {
          try {
            await deleteFavorite(deletingFavId);
            toast(dict.tools.favorites.deleted, "success");
          } catch {
            toast(dict.tools.favorites.deleteFailed, "error");
          } finally {
            setDeletingFavId(null);
          }
        }
      }}
      title={dict.tools.favorites.deleteTitle}
      description={dict.tools.favorites.deleteDesc}
      confirmLabel={dict.common.delete}
      variant="danger"
    />
    {loginModal}
    </>
  );
}
