"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sparkles, Paintbrush, ZoomIn, Download, X, Loader2, Columns2, ImageIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FACE_EDIT_SAMPLES } from "./face-edit-sample-sidebar";
import { useToast } from "@/components/ui/toast";
import { useSlider } from "@/hooks/use-slider";

const SKIP_OPTIMIZER = process.env.NEXT_PUBLIC_SKIP_IMAGE_OPTIMIZER === "true";
const isOptimizedUrl = (url: string) =>
  SKIP_OPTIMIZER || url.includes("images.phos.studio/") || url.includes("r2.dev/") || url.includes("supabase.co/storage/");

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
  { icon: Paintbrush, label: "영역 선택" },
  { icon: Sparkles, label: "프롬프트" },
  { icon: Loader2, label: "실행" },
];

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
        aria-label={label}
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

function ImageActionBar({ src, onZoom, onAddToInput }: { src: string; onZoom: () => void; onAddToInput?: (src: string) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <div className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-xl">
        <ActionButton icon={ZoomIn} label="확대" onClick={(e) => { e.stopPropagation(); onZoom(); }} />
        <DownloadButton src={src} />
        {onAddToInput && (
          <ActionButton icon={Plus} label="입력에 추가" onClick={(e) => { e.stopPropagation(); onAddToInput(src); }} />
        )}
      </div>
    </div>
  );
}

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

function GeneratingPlaceholder({ inputImage, willUpscale = false, phase = "generating" }: { inputImage?: string | null; willUpscale?: boolean; phase?: "generating" | "loading" }) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    const interval = setInterval(() => {
      const sec = (Date.now() - startTimeRef.current) / 1000;
      setProgress(Math.min(95, 100 * (1 - Math.exp(-sec / 60))));
      setElapsed(sec);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const blur = 60 - (progress / 95) * 40;

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0 p-4">
        <div
          className="relative w-full h-full rounded-lg overflow-hidden"
          style={{ filter: `blur(${blur}px)`, transition: "filter 1s ease-out" }}
        >
          {inputImage ? (
            <>
              <img src={inputImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-muted/40" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-cyan-500/30 opacity-60"
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -3, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
        </div>
      </div>

      {/* Spinner */}
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
                : "얼굴 변경 중"}
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
              ) : willUpscale && elapsed > 25 ? (
                <motion.span key="upscale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  고해상도로 변환하고 있습니다...
                </motion.span>
              ) : (
                <RotatingText texts={["잠시만 기다려 주세요", "이미지를 만들고 있어요"]} interval={5000} />
              )}
            </AnimatePresence>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

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
          aria-label="닫기"
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
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? "다운로드 중..." : filename}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/* ── Before/After 비교 슬라이더 ── */
function CompareSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const { sliderPos, sliderProps } = useSlider(50);

  return (
    <div
      {...sliderProps}
      className="relative flex-1 min-h-0 m-4 rounded-lg overflow-hidden cursor-col-resize select-none"
    >
      {/* After (전체 배경) */}
      <img
        src={afterSrc}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
      {/* Before (clip) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt="Before"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10 -translate-x-1/2"
        style={{ left: `${sliderPos}%` }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border-2 border-white shadow-lg flex items-center justify-center"
        style={{ left: `${sliderPos}%` }}
      >
        <ChevronLeft className="w-3 h-3 text-black/60 -mr-0.5" />
        <ChevronRight className="w-3 h-3 text-black/60 -ml-0.5" />
      </div>

      {/* Labels */}
      <span
        className="absolute top-3 left-3 px-2 py-0.5 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-sm rounded-md z-10 transition-opacity"
        style={{ opacity: sliderPos > 8 ? 1 : 0 }}
      >
        Before
      </span>
      <span
        className="absolute top-3 right-3 px-2 py-0.5 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-sm rounded-md z-10 transition-opacity"
        style={{ opacity: sliderPos < 92 ? 1 : 0 }}
      >
        After
      </span>
    </div>
  );
}

/* ── 모드 토글 ── */
function ViewModeToggle({ mode, onChange }: { mode: "single" | "compare"; onChange: (m: "single" | "compare") => void }) {
  return (
    <div className="flex items-center bg-muted border border-border rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onChange("single")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
          mode === "single"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ImageIcon className="w-3 h-3" />
        단일
      </button>
      <button
        type="button"
        onClick={() => onChange("compare")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
          mode === "compare"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Columns2 className="w-3 h-3" />
        비교
      </button>
    </div>
  );
}

interface FaceEditResultPanelProps {
  sampleId?: string | null;
  displayUrls?: string[];
  originalUrls?: string[];
  isGenerating?: boolean;
  generatingInputImage?: string | null;
  generatingScale?: string;
  historyBeforeImage?: string | null;
  onAddToInput?: (src: string) => void;
}

export function FaceEditResultPanel({ sampleId, displayUrls, originalUrls, isGenerating, generatingInputImage, generatingScale = "auto", historyBeforeImage, onAddToInput }: FaceEditResultPanelProps) {
  const activeSample = FACE_EDIT_SAMPLES.find((s) => s.id === sampleId);

  const outputs = displayUrls && displayUrls.length > 0
    ? displayUrls
    : activeSample ? [activeSample.after] : [];

  const originals = originalUrls && originalUrls.length > 0
    ? originalUrls
    : outputs;

  // before 이미지 우선순위: 생성 시 입력 > 히스토리 input_urls > 샘플 before
  const beforeImage = generatingInputImage
    ?? historyBeforeImage
    ?? (activeSample?.before ?? null);

  const [viewMode, setViewMode] = useState<"single" | "compare">(() => {
    if (activeSample) return "compare";
    if (typeof window === "undefined") return "single";
    return (localStorage.getItem("face-edit-view-mode") as "single" | "compare") || "single";
  });

  // 샘플 전환 시 항상 비교모드로 전환
  useEffect(() => {
    if (activeSample) setViewMode("compare");
  }, [sampleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewModeChange = useCallback((m: "single" | "compare") => {
    setViewMode(m);
    localStorage.setItem("face-edit-view-mode", m);
  }, []);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const wasGeneratingRef = useRef(false);

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
  const hasOutput = outputs.length > 0;
  const canCompare = hasOutput && !!beforeImage;

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between px-4 h-[49px] shrink-0 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-secondary" />
          결과
        </h2>
        {canCompare && !showPlaceholder && (
          <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
        )}
      </div>

      {/* Preload hidden img */}
      {isImageLoading && !isGenerating && outputs.length > 0 && (
        <img src={outputs[0]} alt="" className="hidden" onLoad={handleImageLoad} onError={handleImageLoad} />
      )}

      {showPlaceholder ? (
        <GeneratingPlaceholder inputImage={generatingInputImage} willUpscale={generatingScale !== "auto" && Number(generatingScale) >= 2} phase={isImageLoading ? "loading" : "generating"} />
      ) : hasOutput ? (
        viewMode === "compare" && beforeImage ? (
          <CompareSlider key={sampleId ?? "result"} beforeSrc={beforeImage} afterSrc={outputs[0]} />
        ) : (
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
            <Sparkles className="w-8 h-8 text-muted-foreground/70 dark:text-muted-foreground/50" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground">AI 생성 결과</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              영역을 선택하고 실행하면
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
                  <span className="text-muted-foreground/50 dark:text-muted-foreground/30 text-xs mb-5">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxSrc && (
        <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
