"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sparkles, Upload, SlidersHorizontal, Zap, ZoomIn, Download, Plus, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSlider } from "@/hooks/use-slider";
import { RETOUCHING_SAMPLES } from "@/lib/constants/retouching-samples";

/** Supabase Storage URL이면 이미 최적화된 WebP → unoptimized 가능 */
const SKIP_OPTIMIZER = process.env.NEXT_PUBLIC_SKIP_IMAGE_OPTIMIZER === "true";
const isOptimizedUrl = (url: string) =>
  SKIP_OPTIMIZER || url.includes("supabase.co/storage/");

async function downloadImage(src: string) {
  const res = await fetch(src);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했습니다"))), "image/png")
  );

  const url = URL.createObjectURL(pngBlob);
  const a = document.createElement("a");
  a.href = url;
  const baseName = src.split("/").pop()?.split("?")[0]?.replace(/\.\w+$/, "") || "image";
  a.download = `${baseName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const WORKFLOW_STEPS = [
  { icon: Upload, label: "이미지 업로드" },
  { icon: SlidersHorizontal, label: "옵션 설정" },
  { icon: Zap, label: "실행" },
];

interface RetouchingResultPanelProps {
  sampleId?: string | null;
  displayUrls?: string[];
  originalUrls?: string[];
  beforeImageUrl?: string | null;
  isGenerating?: boolean;
  generatingCount?: number;
  generatingInputImage?: string | null;
  onAddToInput?: (src: string) => void;
}

/* ── 툴팁 액션 버튼 ── */
function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative group/btn">
      <button
        type="button"
        onClick={onClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
      >
        <Icon className="w-5 h-5 text-white" />
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] text-white bg-black/80 rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
        {label}
      </span>
    </div>
  );
}

/* ── 다운로드 버튼 (로딩 상태 포함) ── */
function DownloadButton({ src }: { src: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadImage(src);
    } catch {
      toast("다운로드에 실패했습니다", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative group/btn">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-wait"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Download className="w-5 h-5 text-white" />
        )}
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] text-white bg-black/80 rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
        {isDownloading ? "다운로드 중..." : "다운로드"}
      </span>
    </div>
  );
}

/* ── 이미지 액션 버튼 오버레이 ── */
function ImageActionBar({
  src,
  onZoom,
  onAddToInput,
}: {
  src: string;
  onZoom: () => void;
  onAddToInput?: (src: string) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <div className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-xl">
        <ActionButton icon={ZoomIn} label="확대" onClick={(e) => { e.stopPropagation(); onZoom(); }} />
        <DownloadButton src={src} />
        {onAddToInput && (
          <ActionButton icon={Plus} label="다시 보정" onClick={(e) => { e.stopPropagation(); onAddToInput(src); }} />
        )}
      </div>
    </div>
  );
}

/* ── 텍스트 로테이션 ── */
function RotatingText({ texts, interval = 4000 }: { texts: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % texts.length), interval);
    return () => clearInterval(id);
  }, [texts.length, interval]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {texts[index]}
      </motion.span>
    </AnimatePresence>
  );
}

/* ── 프로그레시브 블러 플레이스홀더 ── */
function GeneratingPlaceholder({ count, inputImage, phase = "generating" }: { count: number; inputImage?: string | null; phase?: "generating" | "loading" }) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const interval = setInterval(() => {
      const sec = (Date.now() - startTimeRef.current) / 1000;
      const p = Math.min(95, 100 * (1 - Math.exp(-sec / 60)));
      setProgress(p);
    }, 200);

    return () => clearInterval(interval);
  }, [count]);

  const blur = 60 - (progress / 95) * 40;

  const blobColors = [
    "from-indigo-500/30 via-purple-500/20 to-cyan-500/30",
    "from-rose-500/30 via-amber-500/20 to-emerald-500/30",
  ];

  const renderBlurContent = (index: number) => {
    if (inputImage) {
      return (
        <>
          <img src={inputImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </>
      );
    }
    return (
      <>
        <div className="absolute inset-0 bg-muted/40" />
        <motion.div
          className={cn("absolute inset-0 bg-gradient-to-br opacity-60", blobColors[index % blobColors.length])}
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5 + index * 3, -(3 + index * 2), 0] }}
          transition={{ duration: 7 + index * 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
        />
        <motion.div
          className="absolute w-[50%] h-[50%] top-[25%] left-[25%] rounded-full bg-gradient-to-tr from-white/10 to-white/5"
          animate={{ scale: [1, 1.3, 0.9, 1], x: [0, 15, -10, 0], y: [0, -10, 15, 0] }}
          transition={{ duration: 9 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
        />
      </>
    );
  };

  const spinnerOverlay = (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-secondary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2.5 rounded-full border-4 border-transparent border-b-primary/60 border-l-secondary/60"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-7 h-7 text-primary brightness-150" />
          </motion.div>
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-bold text-foreground">
          {phase === "loading" ? "저장 중" : "이미지 보정 중"}
        </p>
        <motion.p
          className="text-sm font-medium text-foreground/70"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            {phase === "loading" ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                결과를 불러오고 있습니다...
              </motion.span>
            ) : (
              <RotatingText texts={["잠시만 기다려 주세요", "페이지를 벗어나지 마세요"]} interval={5000} />
            )}
          </AnimatePresence>
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0 p-4">
        <div
          className="relative w-full h-full rounded-lg overflow-hidden"
          style={{ filter: `blur(${blur}px)`, transition: "filter 1s ease-out" }}
        >
          {renderBlurContent(0)}
        </div>
      </div>
      {spinnerOverlay}
    </div>
  );
}

/* ── 확대 모달 (라이트박스) ── */
function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadImage(src);
    } catch {
      toast("다운로드에 실패했습니다", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filename = src.split("/").pop() || "image.png";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/75"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <motion.img
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          src={src}
          alt="확대 보기"
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-wait"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading ? "다운로드 중..." : filename}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export function RetouchingResultPanel({ sampleId, displayUrls, originalUrls, beforeImageUrl, isGenerating, generatingCount = 1, generatingInputImage, onAddToInput }: RetouchingResultPanelProps) {
  // 샘플 선택 시 after 이미지를 결과로 표시
  const activeSample = sampleId ? RETOUCHING_SAMPLES.find((s) => s.id === sampleId) : null;
  const effectiveDisplayUrls = activeSample ? [activeSample.after] : displayUrls;
  const effectiveOriginalUrls = activeSample ? [activeSample.after] : originalUrls;
  const effectiveBeforeUrl = activeSample ? activeSample.before : beforeImageUrl;

  const outputs = effectiveDisplayUrls && effectiveDisplayUrls.length > 0 ? effectiveDisplayUrls : [];
  const originals = effectiveOriginalUrls && effectiveOriginalUrls.length > 0 ? effectiveOriginalUrls : outputs;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const { sliderPos, sliderProps } = useSlider(50);
  const wasGeneratingRef = useRef(false);
  const hasBeforeImage = !!effectiveBeforeUrl;

  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current) {
      wasGeneratingRef.current = false;
      if (displayUrls && displayUrls.length > 0) {
        setIsImageLoading(true);
      }
    }
  }, [isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const showPlaceholder = isGenerating || isImageLoading;

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-secondary" />
          결과
        </h2>
        {hasBeforeImage && outputs.length > 0 && !showPlaceholder && (
          <div className="relative flex items-center bg-muted/60 rounded-lg p-0.5">
            {/* 슬라이딩 배경 */}
            <div
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-foreground/10 border border-white/10 transition-all duration-200 ease-out"
              style={{ left: compareMode ? "calc(50% + 2px)" : "2px" }}
            />
            <button
              type="button"
              onClick={() => setCompareMode(false)}
              className={cn(
                "relative z-10 px-3 py-1 rounded-md text-[12px] font-medium transition-colors duration-200 cursor-pointer",
                !compareMode ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              결과
            </button>
            <button
              type="button"
              onClick={() => setCompareMode(true)}
              className={cn(
                "relative z-10 px-3 py-1 rounded-md text-[12px] font-medium transition-colors duration-200 cursor-pointer",
                compareMode ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              비교
            </button>
          </div>
        )}
      </div>

      {/* 이미지 로딩 중일 때 숨겨진 img로 프리로드 */}
      {isImageLoading && !isGenerating && outputs.length > 0 && (
        <img src={outputs[0]} alt="" className="hidden" onLoad={handleImageLoad} onError={handleImageLoad} />
      )}

      {showPlaceholder ? (
        <GeneratingPlaceholder count={generatingCount} inputImage={generatingInputImage} phase={isImageLoading ? "loading" : "generating"} />
      ) : outputs.length > 0 ? (
        compareMode && effectiveBeforeUrl ? (
          /* Before/After 슬라이더 비교 */
          <div className="relative flex-1 min-h-0 p-4 cursor-col-resize select-none" onDragStart={(e) => e.preventDefault()} {...sliderProps}>
            {/* After (결과) — 전체 배경 */}
            <Image
              src={outputs[0]}
              alt="결과"
              fill
              priority
              draggable={false}
              unoptimized={isOptimizedUrl(outputs[0])}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain !p-4 pointer-events-none"
            />
            {/* Before (원본) — clip으로 왼쪽에서 슬라이더 위치만큼만 표시 */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image
                src={effectiveBeforeUrl}
                alt="원본"
                fill
                draggable={false}
                unoptimized={isOptimizedUrl(effectiveBeforeUrl)}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain !p-4 pointer-events-none"
              />
            </div>
            {/* 슬라이더 핸들 */}
            <div
              className="absolute top-4 bottom-4 w-0.5 bg-white/80 z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                <div className="flex gap-[2px]">
                  <svg width="4" height="8" viewBox="0 0 4 8" fill="none">
                    <path d="M3 1L1 4L3 7" stroke="#1a1b2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="4" height="8" viewBox="0 0 4 8" fill="none">
                    <path d="M1 1L3 4L1 7" stroke="#1a1b2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            {/* 라벨 */}
            <span
              className="absolute top-6 left-6 px-2 py-0.5 text-[11px] font-semibold bg-black/50 text-white rounded z-20 transition-opacity duration-200"
              style={{ opacity: sliderPos > 10 ? 1 : 0 }}
            >원본</span>
            <span
              className="absolute top-6 right-6 px-2 py-0.5 text-[11px] font-semibold bg-black/50 text-white rounded z-20 transition-opacity duration-200"
              style={{ opacity: sliderPos < 90 ? 1 : 0 }}
            >결과</span>
          </div>
        ) : (
          /* 결과만 보기 */
          <div className="relative flex-1 min-h-0 p-4 group">
            <Image
              src={outputs[0]}
              alt="결과"
              fill
              priority
              unoptimized={isOptimizedUrl(outputs[0])}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain !p-4"
            />
            <ImageActionBar
              src={originals[0]}
              onZoom={() => setLightboxSrc(originals[0])}
              onAddToInput={onAddToInput}
            />
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground">AI 보정 결과</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              이미지를 업로드하고 실행하면
              <br />
              결과가 여기에 표시됩니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <span className="text-muted-foreground/30 text-xs mb-5">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
