"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sparkles, PenLine, ImagePlus, Zap, ZoomIn, Download, Plus, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SAMPLES } from "@/lib/constants/samples";
import { useToast } from "@/components/ui/toast";

/**
 * 이미지를 PNG로 변환하여 다운로드한다.
 * Canvas API를 사용해 클라이언트에서 처리 — 원본 해상도/비율 유지.
 */
/** 이미지 최적화 우회 모드 (A/B 비교용) — 원본 그대로 unoptimized 표시 */
const SKIP_OPTIMIZER = process.env.NEXT_PUBLIC_SKIP_IMAGE_OPTIMIZER === "true";

/** Supabase Storage URL이면 이미 최적화된 WebP → unoptimized 가능 */
const isOptimizedUrl = (url: string) =>
  SKIP_OPTIMIZER || url.includes("supabase.co/storage/");

async function downloadImage(src: string) {
  const res = await fetch(src);
  const blob = await res.blob();

  // createImageBitmap — layout 트리거 없이 빠른 디코딩
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("이미지 변환에 실패했습니다")), "image/png")
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
  { icon: PenLine, label: "프롬프트 입력" },
  { icon: ImagePlus, label: "참조 이미지" },
  { icon: Zap, label: "실행" },
];


interface ImageEditResultPanelProps {
  sampleId?: string | null;
  onAddToInput?: (src: string) => void;
  /** display_urls (1200px WebP) — 결과 표시용 */
  displayUrls?: string[];
  /** original_urls (원본 해상도 WebP) — 확대/다운로드용 */
  originalUrls?: string[];
  isGenerating?: boolean;
  generatingCount?: number;
  generatingInputImage?: string | null;
  generatingScale?: number;
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
          <ActionButton icon={Plus} label="참조에 추가" onClick={(e) => { e.stopPropagation(); onAddToInput(src); }} />
        )}
      </div>
    </div>
  );
}

/* ── 프로그레시브 블러 플레이스홀더 ── */
function GeneratingPlaceholder({ count, inputImage, willUpscale = false, phase = "generating" }: { count: number; inputImage?: string | null; willUpscale?: boolean; phase?: "generating" | "loading" }) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const interval = setInterval(() => {
      const sec = (Date.now() - startTimeRef.current) / 1000;
      const p = Math.min(95, 100 * (1 - Math.exp(-sec / 60)));
      setProgress(p);
      setElapsed(sec);
    }, 200);

    return () => clearInterval(interval);
  }, [count]);

  // blur: 60px → 20px (진행도에 따라, 절대 0까지 가지 않음)
  const blur = 60 - (progress / 95) * 40;

  const isSingle = count === 1;

  // 각 셀에 들어갈 gradient blob
  const blobColors = [
    "from-indigo-500/30 via-purple-500/20 to-cyan-500/30",
    "from-rose-500/30 via-amber-500/20 to-emerald-500/30",
    "from-sky-500/30 via-violet-500/20 to-pink-500/30",
    "from-teal-500/30 via-blue-500/20 to-orange-500/30",
  ];

  /* 블러 셀 내부 콘텐츠: input 이미지가 있으면 사용, 없으면 gradient blob */
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
          className={cn("absolute inset-0 bg-gradient-to-br opacity-60", blobColors[index])}
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

  /* 중앙 스피너 + 문구 오버레이 */
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
          {phase === "loading"
            ? "저장 중"
            : willUpscale && elapsed > 25
              ? "업스케일 중"
              : "이미지 생성 중"}
        </p>
        <motion.p
          className="text-sm font-medium text-foreground/70"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {phase === "loading"
            ? "결과를 불러오고 있습니다..."
            : willUpscale && elapsed > 25
              ? "고해상도로 변환하고 있습니다..."
              : "잠시만 기다려 주세요..."}
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 min-h-0">
      {/* 블러 배경 */}
      {isSingle ? (
        <div className="absolute inset-0 p-4">
          <div
            className="relative w-full h-full rounded-lg overflow-hidden"
            style={{ filter: `blur(${blur}px)`, transition: "filter 1s ease-out" }}
          >
            {renderBlurContent(0)}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 p-4 flex items-center justify-center">
          <div className={cn("grid gap-2 w-full", count <= 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-2 grid-rows-2")}>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg border border-white/10 overflow-hidden"
                style={{ filter: `blur(${blur}px)`, transition: "filter 1s ease-out" }}
              >
                {renderBlurContent(i)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 스피너 오버레이 */}
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
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* 이미지 */}
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

        {/* 하단 다운로드 버튼 */}
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

export function ImageEditResultPanel({ sampleId, onAddToInput, displayUrls, originalUrls, isGenerating, generatingCount = 1, generatingInputImage, generatingScale = 0 }: ImageEditResultPanelProps) {
  const activeSample = SAMPLES.find((s) => s.id === sampleId);

  // display_urls가 있으면 사용, 없으면 샘플 fallback
  const outputs = displayUrls && displayUrls.length > 0
    ? displayUrls
    : activeSample?.outputs ?? [];

  // 확대/다운로드용 원본 URL (없으면 display로 fallback)
  const originals = originalUrls && originalUrls.length > 0
    ? originalUrls
    : outputs;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const wasGeneratingRef = useRef(false);

  // 생성 완료 직후(isGenerating true→false)에만 로딩 플레이스홀더 표시
  // 히스토리 클릭 시에는 isGenerating이 변하지 않으므로 트리거되지 않음
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
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-secondary" />
          결과
        </h2>
      </div>

      {/* 이미지 로딩 중일 때 숨겨진 img로 프리로드 */}
      {isImageLoading && !isGenerating && outputs.length > 0 && (
        <img src={outputs[0]} alt="" className="hidden" onLoad={handleImageLoad} />
      )}

      {showPlaceholder ? (
        <GeneratingPlaceholder count={generatingCount} inputImage={generatingInputImage} willUpscale={generatingScale > 1} phase={isImageLoading ? "loading" : "generating"} />
      ) : outputs.length === 1 ? (
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
      ) : outputs.length > 1 ? (
        <div className="flex-1 p-4 min-h-0 flex items-center justify-center overflow-y-auto">
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "relative aspect-square rounded-lg border border-white/10 bg-muted/30 flex items-center justify-center",
                  outputs[i] && "group"
                )}
              >
                {outputs[i] ? (
                  <>
                    <Image
                      src={outputs[i]}
                      alt={`결과 ${i + 1}`}
                      fill
                      priority={i === 0}
                      unoptimized={isOptimizedUrl(outputs[i])}
                      sizes="25vw"
                      className="object-contain"
                    />
                    <ImageActionBar
                      src={originals[i]}
                      onZoom={() => setLightboxSrc(originals[i])}
                      onAddToInput={onAddToInput}
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground">AI 생성 결과</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              프롬프트를 입력하고 실행하면
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
