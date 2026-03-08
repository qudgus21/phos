"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sparkles, PenLine, ImagePlus, Zap, ZoomIn, Download, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SAMPLES } from "@/lib/constants/samples";

/**
 * 이미지를 PNG로 변환하여 다운로드한다.
 * Canvas API를 사용해 클라이언트에서 처리 — 원본 해상도/비율 유지.
 */
async function downloadAsPng(src: string) {
  const img = new window.Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 컨텍스트를 생성할 수 없습니다");

  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("PNG 변환 실패");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // 원본 파일명에서 확장자를 .png로 교체
  const originalName = src.split("/").pop()?.split("?")[0] || "image";
  const baseName = originalName.replace(/\.[^.]+$/, "");
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
  onAddToInput?: (src: string) => void;
  generatedUrls?: string[];
  isGenerating?: boolean;
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
    <div className="absolute inset-x-0 bottom-0 flex justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-lg">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onZoom(); }}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          title="확대"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); downloadAsPng(src); }}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          title="다운로드"
        >
          <Download className="w-4 h-4 text-white" />
        </button>
        {onAddToInput && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToInput(src); }}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            title="참조 이미지에 추가"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 확대 모달 (라이트박스) ── */
function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
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
            onClick={() => downloadAsPng(src)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {filename.replace(/\.[^.]+$/, ".png")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export function ImageEditResultPanel({ onAddToInput, generatedUrls, isGenerating }: ImageEditResultPanelProps) {
  const searchParams = useSearchParams();
  const sampleId = searchParams.get("sample_id");
  const activeSample = SAMPLES.find((s) => s.id === sampleId);
  const outputs = generatedUrls && generatedUrls.length > 0
    ? generatedUrls
    : activeSample?.outputs ?? [];

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-secondary" />
          결과
        </h2>
      </div>

      {isGenerating ? (
        /* Loading State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          <div className="relative w-20 h-20">
            {/* 외곽 회전 링 */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-secondary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            {/* 내부 역회전 링 */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-transparent border-b-primary/60 border-l-secondary/60"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            {/* 중앙 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground">이미지 생성 중</p>
            <motion.p
              className="text-[13px] text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              잠시만 기다려 주세요...
            </motion.p>
          </div>
        </div>
      ) : outputs.length === 1 ? (
        <div className="flex-1 p-4 min-h-0 flex items-center justify-center">
          <div className="relative group max-w-full max-h-full">
            <Image
              src={outputs[0]}
              alt="결과"
              width={1600}
              height={1600}
              className="max-w-full max-h-full object-contain"
            />
            <ImageActionBar
              src={outputs[0]}
              onZoom={() => setLightboxSrc(outputs[0])}
              onAddToInput={onAddToInput}
            />
          </div>
        </div>
      ) : outputs.length > 1 ? (
        <div className="flex-1 p-4 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
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
                      width={800}
                      height={800}
                      className="max-w-full max-h-full object-contain"
                    />
                    <ImageActionBar
                      src={outputs[i]}
                      onZoom={() => setLightboxSrc(outputs[i])}
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
