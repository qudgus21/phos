"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Clock, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHistory } from "@/hooks/use-history";
import type { HistoryRow } from "@/hooks/use-history";
import { cn } from "@/lib/utils";
import { useDictionary, useLocale } from "@/lib/i18n/dictionary-context";

function HistoryThumbnail({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const optimized = src?.includes("images.phos.studio/") || src?.includes("r2.dev/") || src?.includes("supabase.co/storage/") ? true : false;

  return (
    <>
      {!loaded && <div className="absolute inset-0 rounded-md bg-muted/50 animate-pulse" />}
      <Image
        src={src}
        alt=""
        fill
        unoptimized={optimized}
        sizes="48px"
        className={cn("object-cover transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

/** 화면에 보이면 URL들을 프리로드하는 래퍼 */
function PreloadOnVisible({ urls, children }: { urls: (string | undefined)[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const validUrls = urls.filter(Boolean) as string[];
    if (validUrls.length === 0 || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          validUrls.forEach((u) => {
            const img = new window.Image();
            img.src = u;
          });
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [urls]);

  return <div ref={ref}>{children}</div>;
}

function DeleteConfirmModal({
  open,
  onConfirm,
  onCancel,
  confirmText,
  warningText,
  cancelLabel,
  deleteLabel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: string;
  warningText: string;
  cancelLabel: string;
  deleteLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 w-[280px] rounded-xl glass-card border border-border p-5 shadow-elevated"
      >
        <p className="text-[14px] font-medium text-foreground text-center">
          {confirmText}
        </p>
        <p className="text-[12px] text-muted-foreground text-center mt-1.5">
          {warningText}
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
          >
            {deleteLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ImageEditHistoryPanelProps {
  featureType?: string;
  onSelect?: (displayUrls: string[], originalUrls: string[], inputUrls?: string[]) => void;
  onSelectPending?: (inputUrls: string[]) => void;
}

export function ImageEditHistoryPanel({
  featureType = "image-edit",
  onSelect,
  onSelectPending,
}: ImageEditHistoryPanelProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const { history, isLoading, deleteHistory } = useHistory(featureType);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 상대 시간 텍스트 갱신 (1분마다 re-render — 네트워크 호출 없음)
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = (item: HistoryRow) => {
    setSelectedId(item.id);
    onSelect?.(item.display_urls, item.original_urls, item.input_urls);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteTargetId(null);
    if (selectedId === id) setSelectedId(null);
    deleteHistory(id);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return dict.common.time.justNow;
    if (diffMin < 60) return dict.common.time.minutesAgo.replace("{min}", String(diffMin));
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return dict.common.time.hoursAgo.replace("{hr}", String(diffHr));
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return dict.common.time.daysAgo.replace("{day}", String(diffDay));
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const getRetouchingSummary = (meta: Record<string, unknown> | null): string => {
    if (!meta) return dict.tools.retouching.retouchSettings;
    const parts: string[] = [];
    if (meta.filter && meta.filter !== "none") {
      const filterKey = meta.filter as keyof typeof dict.tools.retouching.filters;
      parts.push(dict.tools.retouching.filters[filterKey] ?? String(meta.filter));
    }
    const genderKey = meta.gender as keyof typeof dict.tools.retouching.genders;
    parts.push(dict.tools.retouching.genders[genderKey] ?? String(meta.gender ?? ""));
    const modeMap: Record<string, string> = {
      natural: dict.tools.retouching.modes.basic,
      "soft-makeup": dict.tools.retouching.modes.makeup,
      matte: dict.tools.retouching.modes.matte,
    };
    parts.push(modeMap[meta.mode as string] ?? String(meta.mode ?? ""));
    if (meta.faceReshape) parts.push(dict.tools.retouching.reshapeLabel);
    return parts.filter(Boolean).join(" · ");
  };

  const getFaceEditSummary = (meta: Record<string, unknown> | null): string => {
    if (!meta) return dict.tools.faceEdit.header;
    const parts: string[] = [];
    const genderKey = meta.gender as keyof typeof dict.tools.retouching.genders;
    parts.push(dict.tools.retouching.genders[genderKey] ?? String(meta.gender ?? ""));
    if (meta.strength != null) parts.push(`${dict.tools.faceEdit.strengthLabel} ${Number(meta.strength).toFixed(1)}`);
    if (meta.scale && meta.scale !== "auto") parts.push(`${meta.scale}K`);
    return parts.filter(Boolean).join(" · ");
  };

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {dict.tools.history.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <Loader2 className="w-5 h-5 text-muted-foreground/70 dark:text-muted-foreground/50 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <Clock className="w-6 h-6 text-muted-foreground/50 dark:text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{dict.tools.history.empty}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-1.5">
              {history.filter((item) => item.status !== "failed").map((item, i) => {
                const isPending = item.status === "pending";
                return (
                <PreloadOnVisible key={item.id} urls={isPending ? [] : [item.display_urls?.[0], item.input_urls?.[0]]}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={isPending ? () => { setSelectedId(item.id); onSelectPending?.(item.input_urls ?? []); } : () => handleSelect(item)}
                  className={cn(
                    "group relative w-full flex gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer",
                    selectedId === item.id
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted/30">
                    {isPending ? (
                      <div className="absolute inset-0 bg-muted/50 animate-pulse flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 text-primary/60 animate-spin" />
                      </div>
                    ) : (item.thumb_urls?.[0] || item.display_urls?.[0]) ? (
                      <HistoryThumbnail src={item.thumb_urls?.[0] || item.display_urls?.[0]} />
                    ) : (
                      <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-muted-foreground/50 animate-spin" />
                      </div>
                    )}
                    {!isPending && (item.display_urls?.length ?? 0) > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                        +{item.display_urls.length - 1}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <p className="text-[11px] text-foreground truncate leading-tight">
                      {isPending
                        ? dict.tools.history.generating
                        : item.feature_type === "retouching"
                          ? getRetouchingSummary(item.metadata as Record<string, unknown> | null)
                          : item.feature_type === "face-edit"
                            ? getFaceEditSummary(item.metadata as Record<string, unknown> | null)
                            : item.prompt.length > 40
                              ? item.prompt.slice(0, 40) + "..."
                              : item.prompt}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isPending ? dict.tools.history.generatingHint : formatTime(item.created_at)}
                    </p>
                  </div>
                  {/* Delete */}
                  {!isPending && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, item.id)}
                    className="absolute -top-1 -right-1 z-10 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-400"
                  >
                    <X className="w-2 h-2 text-white" />
                  </button>
                  )}
                </motion.div>
                </PreloadOnVisible>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        confirmText={dict.tools.history.deleteConfirm}
        warningText={dict.tools.history.deleteWarning}
        cancelLabel={dict.common.cancel}
        deleteLabel={dict.common.delete}
      />
    </div>
  );
}
