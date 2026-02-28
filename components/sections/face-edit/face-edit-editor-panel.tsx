"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ZoomIn,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ImageUp,
  SlidersHorizontal,
  Play,
  Check,
  X,
  Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlider } from "@/hooks/use-slider";
import { FACE_EDIT_SAMPLES } from "./face-edit-sample-sidebar";
import { FaceEditMaskEditor } from "./face-edit-mask-editor";

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
          <a
            href={src}
            download
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {filename}
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

type Gender = "female" | "male";

/* ── Step indicator ── */
const STEPS = [
  { id: 1, label: "이미지 업로드", icon: ImageUp },
  { id: 2, label: "옵션 설정", icon: SlidersHorizontal },
  { id: 3, label: "실행", icon: Play },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 py-2.5 shrink-0">
      {STEPS.map((step, i) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const Icon = isComplete ? Check : step.icon;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                  isComplete
                    ? "bg-primary/20 text-[#A5B4FC]"
                    : isCurrent
                      ? "bg-primary text-white"
                      : "bg-white/[0.06] text-muted-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold transition-colors",
                  isCurrent
                    ? "text-card-foreground"
                    : isComplete
                      ? "text-[#A5B4FC]"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-muted-foreground/30 text-[10px] mx-1">
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FaceEditEditorPanel() {
  const searchParams = useSearchParams();
  const sampleId = searchParams.get("sample_id");
  const activeSample = FACE_EDIT_SAMPLES.find((s) => s.id === sampleId);

  const [gender, setGender] = useState<Gender>("female");
  const [strength, setStrength] = useState(1.0);
  const [resultScale, setResultScale] = useState(1.0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* 샘플 선택 시 에디터에 반영 */
  const prevSampleRef = useRef<string | null>(null);
  useEffect(() => {
    if (sampleId && sampleId !== prevSampleRef.current && activeSample) {
      prevSampleRef.current = sampleId;
      setUploadedImage(activeSample.image);
      setFileName("샘플 이미지");
      setGender(activeSample.gender);
    } else if (!sampleId && prevSampleRef.current) {
      prevSampleRef.current = null;
    }
  }, [sampleId, activeSample]);

  const { sliderPos, sliderProps } = useSlider(50);
  const isSampleView = !!activeSample && uploadedImage === activeSample.image;
  const hasImage = !!uploadedImage;
  const currentStep = hasImage ? 2 : 1;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setFileName(null);
    setMaskDataUrl(null);
    setMaskBlob(null);
    prevSampleRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleMaskSave = useCallback((dataUrl: string, blob: Blob) => {
    setMaskDataUrl(dataUrl);
    setMaskBlob(blob);
  }, []);

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-base font-bold text-foreground">얼굴 변경</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            원하는 얼굴 영역을 선택하고 자연스럽게 바꿔보세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const src = isSampleView ? activeSample!.after : uploadedImage;
              if (src) setLightboxSrc(src);
            }}
            disabled={!hasImage}
            className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-foreground hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="확대 보기"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const src = isSampleView ? activeSample!.after : uploadedImage;
              if (src) {
                const link = document.createElement("a");
                link.href = src;
                link.download = src.split("/").pop() || "image.png";
                link.click();
              }
            }}
            disabled={!hasImage}
            className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-foreground hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="다운로드"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* C: Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Upload Area */}
      <div className="flex-1 flex flex-col px-4 pb-4 gap-4 min-h-0 overflow-y-auto">
        <div
          onClick={() => !hasImage && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex-1 min-h-[240px] rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all",
            hasImage
              ? "border-white/[0.1] bg-white/[0.02]"
              : "border-dashed cursor-pointer",
            !hasImage &&
              (isDragging
                ? "border-[#818CF8] bg-primary/10"
                : "border-white/[0.15] bg-white/[0.03] hover:border-[#818CF8] hover:bg-[#A5B4FC]/10")
          )}
        >
          {isSampleView ? (
            /* ── Before / After 슬라이더 ── */
            <div
              {...sliderProps}
              className="relative w-full h-full rounded-lg overflow-hidden select-none cursor-ew-resize"
            >
              {/* After (전체 배경) */}
              <img
                src={activeSample!.after}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
              {/* Before (clip) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={activeSample!.image}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
                  draggable={false}
                />
              </div>
              {/* Slider line + handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] z-10"
                style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
                  <div className="flex items-center gap-0.5 text-white text-xs font-bold">
                    <span>◂</span>
                    <span>▸</span>
                  </div>
                </div>
              </div>
              {/* Labels */}
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-bold text-white bg-black/50 rounded-md z-10">
                Before
              </span>
              <span className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-bold text-white bg-black/50 rounded-md z-10">
                After
              </span>
            </div>
          ) : hasImage ? (
            <>
              {/* Preview image */}
              <div className="relative max-h-full max-w-full p-2">
                <img
                  src={uploadedImage!}
                  alt="업로드된 이미지"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                {/* 마스크 프리뷰 오버레이 */}
                {maskDataUrl && (
                  <div
                    className="absolute inset-0 p-2 pointer-events-none"
                    style={{ filter: "drop-shadow(0 0 2px rgba(130,160,255,1)) drop-shadow(0 0 6px rgba(100,140,255,0.5))" }}
                  >
                    <img
                      src={maskDataUrl}
                      alt="마스크"
                      className="max-h-full max-w-full object-contain rounded-lg opacity-60"
                    />
                  </div>
                )}
              </div>
              {/* 가이드 오버레이 — 마스크 없을 때만 */}
              {!maskDataUrl && !isSampleView && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-xl">
                  <p className="text-sm text-white/80 font-semibold mb-3">
                    변경할 얼굴 영역을 선택하세요
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaskEditorOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-primary to-[#818CF8] shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all cursor-pointer"
                  >
                    <Paintbrush className="w-4 h-4" />
                    영역 선택하기
                  </button>
                </div>
              )}
              {/* Overlay controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-card-foreground rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  교체
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-400 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              </div>
              {/* Mask 버튼 */}
              {!isSampleView && (
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaskEditorOpen(true);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-sm border transition-colors cursor-pointer",
                      maskDataUrl
                        ? "text-[#A5B4FC] bg-primary/20 border-primary/30 hover:bg-primary/30"
                        : "text-card-foreground bg-black/60 border-white/[0.1] hover:bg-black/80"
                    )}
                  >
                    <Paintbrush className="w-3 h-3" />
                    {maskDataUrl ? "마스크 수정" : "영역 선택하기"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-[15px] font-extrabold text-card-foreground">
                Drop image here or click to upload
              </p>
              <p className="text-[15px] text-muted-foreground">
                JPG, PNG, WebP
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="이미지 파일 선택"
        />

        {/* Gender Selection — D: 이모지 제거 */}
        <div className="space-y-2 shrink-0">
          <label className="text-sm font-semibold text-card-foreground">
            성별 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender("female")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border",
                gender === "female"
                  ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                  : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/[0.15] hover:text-card-foreground"
              )}
            >
              여성
            </button>
            <button
              type="button"
              onClick={() => setGender("male")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer border",
                gender === "male"
                  ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                  : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/[0.15] hover:text-card-foreground"
              )}
            >
              남성
            </button>
          </div>
        </div>

        {/* Sliders — D: 이모지 제거 */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-card-foreground">
                변화 강도
              </span>
              <span className="text-[15px] font-bold text-[#A5B4FC]">
                {strength.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className={cn(
                "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                "bg-primary",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-card-foreground">
                결과 크기
              </span>
              <span className="text-[15px] font-bold text-[#A5B4FC]">
                {resultScale.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.01}
              value={resultScale}
              onChange={(e) => setResultScale(Number(e.target.value))}
              className={cn(
                "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                "bg-primary",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              )}
            />
          </div>
        </div>

        {/* D: 실행 버튼 — 이모지 제거 */}
        <div className="flex items-center justify-between shrink-0 pt-1">
          <span className="text-xs text-white/50">85 크레딧/장</span>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all duration-300 cursor-pointer"
          >
            생성하기 · 85 크레딧
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* Mask Editor Modal */}
      {uploadedImage && !isSampleView && (
        <FaceEditMaskEditor
          isOpen={maskEditorOpen}
          onClose={() => setMaskEditorOpen(false)}
          onSave={handleMaskSave}
          imageSrc={uploadedImage}
          initialMaskDataUrl={maskDataUrl}
        />
      )}
    </div>
  );
}
