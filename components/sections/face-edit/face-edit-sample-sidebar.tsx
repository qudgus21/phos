"use client";

import { useState, useCallback, type RefObject } from "react";
import Image from "next/image";
import { Star, Loader2, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FaceEditFavoriteSaveModal } from "@/components/sections/face-edit/face-edit-favorite-save-modal";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreditsBalance } from "@/hooks/use-credits";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { FaceEditInputPanelHandle } from "./face-edit-input-panel";

type Gender = "female" | "male";

export interface FaceEditSampleData {
  id: string;
  gender: Gender;
  label: string;
  thumbnail: string;
  before: string;
  after: string;
  mask?: string;
  settings: {
    gender: Gender;
    strength: number;
    scale: number | "auto";
  };
}

export const FACE_EDIT_SAMPLES: FaceEditSampleData[] = [
  {
    id: "sample1",
    gender: "female",
    label: "여성 글래머러스",
    thumbnail: "/images/face-edit/sample1/thumbnail.webp",
    before: "/images/face-edit/sample1/before.webp",
    after: "/images/face-edit/sample1/after.webp",
    mask: "/images/face-edit/sample1/mask.webp",
    settings: { gender: "female", strength: 0.7, scale: "auto" },
  },
  {
    id: "sample2",
    gender: "male",
    label: "남성 클린",
    thumbnail: "/images/face-edit/sample2/thumbnail.webp",
    before: "/images/face-edit/sample2/before.webp",
    after: "/images/face-edit/sample2/after.webp",
    mask: "/images/face-edit/sample2/mask.webp",
    settings: { gender: "female", strength: 0.5, scale: "auto" },
  },
  {
    id: "sample3",
    gender: "male",
    label: "남성 클린",
    thumbnail: "/images/face-edit/sample3/thumbnail.webp",
    before: "/images/face-edit/sample3/before.webp",
    after: "/images/face-edit/sample3/after.webp",
    mask: "/images/face-edit/sample3/mask.webp",

    settings: { gender: "male", strength: 0.7, scale: "auto" },
  },
  {
    id: "sample4",
    gender: "female",
    label: "여성 스튜디오",
    thumbnail: "/images/face-edit/sample4/thumbnail.webp",
    before: "/images/face-edit/sample4/before.webp",
    after: "/images/face-edit/sample4/after.webp",
    mask: "/images/face-edit/sample4/mask.webp",

    settings: { gender: "female", strength: 0.8, scale: "auto" },
  },
  {
    id: "sample5",
    gender: "female",
    label: "여성 내추럴",
    thumbnail: "/images/face-edit/sample5/thumbnail.webp",
    before: "/images/face-edit/sample5/before.webp",
    after: "/images/face-edit/sample5/after.webp",
    mask: "/images/face-edit/sample5/mask.webp",
    settings: { gender: "female", strength: 0.7, scale: "auto" },
  },
  {
    id: "sample6",
    gender: "male",
    label: "남성 내추럴",
    thumbnail: "/images/face-edit/sample6/thumbnail.webp",
    before: "/images/face-edit/sample6/before.webp",
    after: "/images/face-edit/sample6/after.webp",
    mask: "/images/face-edit/sample6/mask.webp",
    settings: { gender: "male", strength: 1.0, scale: "auto" },
  },
];

const TABS = [
  { id: "samples", label: "샘플" },
  { id: "favorites", label: "즐겨찾기" },
];

interface FaceEditSampleSidebarProps {
  inputPanelRef: RefObject<FaceEditInputPanelHandle | null>;
  selectedSampleId: string | null;
  onSelectSample: (id: string | null) => void;
}

export function FaceEditSampleSidebar({ inputPanelRef, selectedSampleId, onSelectSample }: FaceEditSampleSidebarProps) {
  const [activeTab, setActiveTab] = useState("samples");
  const { toast } = useToast();

  const { data: creditInfo } = useCreditsBalance(true);
  const planMaxFavorites = creditInfo?.plan?.maxFavorites ?? 3;
  const { favorites, isLoading: favLoading, saveFavorite, deleteFavorite, maxFavorites, isFull: favFull } = useFavorites("face-edit", planMaxFavorites);
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
      modelId: "flux-fill-pro",
      ratio: "AUTO",
      imageSize: settings.scale === "auto" ? "auto" : `${settings.scale}K`,
      scale: settings.scale === "auto" ? 1 : Number(settings.scale),
      imageCount: 1,
      images: settings.image ? [settings.image] : [],
      metadata: {
        gender: settings.gender,
        strength: settings.strength,
        scale: settings.scale,
      },
    });
    toast("즐겨찾기에 저장했습니다", "success");
  }, [inputPanelRef, saveFavorite, toast]);

  const handleLoadFavorite = useCallback((fav: typeof favorites[0]) => {
    inputPanelRef.current?.loadFavorite(fav);
  }, [inputPanelRef]);

  const getPreview = () => {
    const s = inputPanelRef.current?.getCurrentSettings();
    return {
      gender: s?.gender ?? "female",
      strength: s?.strength ?? 1,
      scale: s?.scale ?? "auto",
      hasImage: !!s?.image,
      hasMask: !!s?.maskBlob,
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
          FACE_EDIT_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelect(sample.id)}
              className={cn(
                "w-full aspect-square rounded-lg overflow-hidden border transition-colors cursor-pointer",
                selectedSampleId === sample.id
                  ? "border-indigo-500 ring-1 ring-indigo-500/50"
                  : "border-border hover:border-border/80"
              )}
            >
              <Image
                src={sample.thumbnail}
                alt={sample.label}
                width={200}
                height={200}
                priority
                className="w-full h-full object-cover"
              />
            </button>
          ))}

        {activeTab === "favorites" && (
          <>
            {/* 저장 버튼 */}
            <button
              type="button"
              onClick={() => {
                requireAuth(() => {
                  const settings = inputPanelRef.current?.getCurrentSettings();
                  if (!settings?.image) {
                    toast("이미지를 업로드해주세요", "warning");
                    return;
                  }
                  setShowSaveModal(true);
                })
              }}
              disabled={favFull}
              className={cn(
                "w-full flex items-center justify-center gap-1 py-2.5 rounded-lg border transition-colors cursor-pointer text-[11px] font-semibold",
                favFull
                  ? "border-border text-muted-foreground/60 dark:text-muted-foreground/40 cursor-not-allowed"
                  : "border-indigo-500/40 text-foreground bg-indigo-500/20 hover:bg-indigo-500/35 hover:border-indigo-500/60"
              )}
              title={favFull ? `최대 ${maxFavorites}개` : "현재 설정 저장"}
            >
              <Plus className="w-3 h-3" />
              저장 ({favorites.length}/{maxFavorites})
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
                  설정을 저장하면<br />여기에 표시됩니다
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

    <FaceEditFavoriteSaveModal
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
            toast("즐겨찾기를 삭제했습니다", "success");
          } catch {
            toast("삭제에 실패했습니다", "error");
          } finally {
            setDeletingFavId(null);
          }
        }
      }}
      title="즐겨찾기 삭제"
      description="이 즐겨찾기를 삭제하시겠습니까?"
      confirmLabel="삭제"
      variant="danger"
    />
    {loginModal}
    </>
  );
}
