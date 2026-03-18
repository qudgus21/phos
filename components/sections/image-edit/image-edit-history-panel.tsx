"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Clock, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

function HistoryThumbnail({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const optimized = src?.includes("supabase.co/storage/") ?? false;

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

/** 화면에 보이면 display URL을 프리로드하는 래퍼 */
function PreloadOnVisible({ url, children }: { url?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new window.Image();
          img.src = url;
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  return <div ref={ref}>{children}</div>;
}

function DeleteConfirmModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
          이 기록을 삭제할까요?
        </p>
        <p className="text-[12px] text-muted-foreground text-center mt-1.5">
          삭제된 기록은 복구할 수 없습니다
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
          >
            삭제
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type HistoryRow = Database["public"]["Tables"]["generation_history"]["Row"];

/* 리터칭 히스토리: metadata → 옵션 요약 텍스트 */
const FILTER_LABELS: Record<string, string> = { none: "필터 없음", studio: "스튜디오", brightening: "브라이트닝", glow: "글로우" };
const MODE_LABELS: Record<string, string> = { natural: "보정", "soft-makeup": "메이크업", matte: "매트" };
const GENDER_LABELS: Record<string, string> = { female: "여성", male: "남성" };

function getRetouchingSummary(meta: Record<string, unknown> | null): string {
  if (!meta) return "피부 보정";
  const parts: string[] = [];
  if (meta.filter && meta.filter !== "none") parts.push(FILTER_LABELS[meta.filter as string] ?? String(meta.filter));
  parts.push(GENDER_LABELS[meta.gender as string] ?? "여성");
  parts.push(MODE_LABELS[meta.mode as string] ?? "보정");
  if (meta.faceReshape) parts.push("윤곽보정");
  return parts.join(" · ");
}

interface ImageEditHistoryPanelProps {
  featureType?: string;
  refreshKey?: number;
  onSelect?: (displayUrls: string[], originalUrls: string[]) => void;
}

export function ImageEditHistoryPanel({
  featureType = "image-edit",
  refreshKey = 0,
  onSelect,
}: ImageEditHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("generation_history")
      .select("*")
      .eq("feature_type", featureType)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data as HistoryRow[]);
    }
    setIsLoading(false);
  }, [featureType]);

  // 초기 로드 시에만 로딩 스피너 표시
  useEffect(() => {
    fetchHistory(true);
  }, [featureType]); // eslint-disable-line react-hooks/exhaustive-deps

  // refreshKey 변경 시 (생성 완료 후) 로딩 없이 조용히 갱신
  useEffect(() => {
    if (refreshKey > 0) fetchHistory(false);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 상대 시간 텍스트 갱신 (1분마다 re-render — 네트워크 호출 없음)
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = (item: HistoryRow) => {
    setSelectedId(item.id);
    onSelect?.(item.display_urls, item.original_urls);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteTargetId(null);

    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);

    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        fetchHistory(false);
      }
    } catch {
      fetchHistory(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          히스토리
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <Loader2 className="w-5 h-5 text-muted-foreground/50 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <Clock className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">기록이 없습니다</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-1.5">
              {history.map((item, i) => (
                <PreloadOnVisible key={item.id} url={item.display_urls?.[0]}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "group relative w-full flex gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer",
                    selectedId === item.id
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted/30">
                    {(item.thumb_urls?.[0] || item.display_urls?.[0]) ? (
                      <HistoryThumbnail src={item.thumb_urls?.[0] || item.display_urls?.[0]} />
                    ) : (
                      <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-muted-foreground/50 animate-spin" />
                      </div>
                    )}
                    {(item.display_urls?.length ?? 0) > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                        +{item.display_urls.length - 1}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <p className="text-[11px] text-foreground truncate leading-tight">
                      {item.feature_type === "retouching"
                        ? getRetouchingSummary(item.metadata as Record<string, unknown> | null)
                        : item.prompt.length > 40
                          ? item.prompt.slice(0, 40) + "..."
                          : item.prompt}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTime(item.created_at)}
                    </p>
                  </div>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, item.id)}
                    className="absolute -top-1 -right-1 z-10 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-400"
                  >
                    <X className="w-2 h-2 text-white" />
                  </button>
                </motion.div>
                </PreloadOnVisible>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
