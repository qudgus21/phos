"use client";

import { useState, useRef, useCallback } from "react";
import {
  Search,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ImageUp,
  SlidersHorizontal,
  Play,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Gender = "female" | "male";

interface FaceEditEditorPanelProps {
  sampleImage?: string | null;
  sampleGender?: Gender | null;
  onSampleConsumed?: () => void;
}

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

export function FaceEditEditorPanel({
  sampleImage,
  sampleGender,
  onSampleConsumed,
}: FaceEditEditorPanelProps) {
  const [gender, setGender] = useState<Gender>("female");
  const [strength, setStrength] = useState(1.0);
  const [resultScale, setResultScale] = useState(1.0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* B: 샘플 이미지가 전달되면 에디터에 반영 */
  const prevSampleRef = useRef<string | null>(null);
  if (sampleImage && sampleImage !== prevSampleRef.current) {
    prevSampleRef.current = sampleImage;
    setUploadedImage(sampleImage);
    setFileName("샘플 이미지");
    if (sampleGender) setGender(sampleGender);
    onSampleConsumed?.();
  }

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
    prevSampleRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-foreground hover:bg-white/[0.12] transition-colors cursor-pointer"
            title="확대 보기"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-foreground hover:bg-white/[0.12] transition-colors cursor-pointer"
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
          {hasImage ? (
            <>
              {/* A: Preview image */}
              <img
                src={uploadedImage!}
                alt="업로드된 이미지"
                className="max-h-full max-w-full object-contain rounded-lg p-2"
              />
              {/* A: Overlay controls */}
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
              {/* A: File info */}
              {fileName && (
                <div className="absolute bottom-2 left-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-black/50 backdrop-blur-sm rounded-md">
                  {fileName}
                </div>
              )}
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-[15px] font-extrabold text-card-foreground">
                이미지를 여기에 끌어다 놓거나 클릭하여 업로드
              </p>
              <p className="text-[15px] text-muted-foreground">
                JPG 또는 PNG를 지원합니다.
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
                  ? "border-primary bg-primary/20 text-[#A5B4FC] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
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
                  ? "border-primary bg-primary/20 text-[#A5B4FC] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
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
              min={0}
              max={2}
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
            className="px-4 py-2 text-sm font-semibold text-primary-foreground rounded-lg bg-primary hover:bg-[#818CF8] hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all duration-200 cursor-pointer"
          >
            얼굴 변경 실행 / 85 크레딧
          </button>
        </div>
      </div>
    </div>
  );
}
