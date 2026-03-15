"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";

/* ── Filter Chips ── */
const FILTERS = [
  { id: "none", label: "없음" },
  { id: "studio", label: "스튜디오" },
  { id: "brightening", label: "브라이트닝" },
  { id: "soft-light", label: "소프트라이트" },
];

/* ── Retouching Area Chips ── */
const RETOUCH_AREAS = [
  { id: "lips", label: "입술 제외" },
  { id: "eyebrows", label: "눈썹 제외" },
  { id: "nose", label: "코 제외" },
  { id: "hair", label: "헤어 제외" },
  { id: "background", label: "배경 제외" },
  { id: "clothes", label: "의상 제외" },
];

/* ── Dropdown options ── */
const SIZE_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "3K", label: "3K" },
  { value: "4K", label: "4K" },
];
const RATIO_OPTIONS = [
  // 1행: 덜 쓰이는 비율 (트리거에서 먼 쪽)
  { value: "2:3", label: "2:3" },
  { value: "3:2", label: "3:2" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "21:9", label: "21:9" },
  // 2행: 자주 쓰는 비율 (트리거에 가까운 쪽)
  { value: "AUTO", label: "AUTO" },
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
];
const GENDER_OPTIONS = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
];
const MODE_OPTIONS = [
  { value: "natural", label: "보정(기본)" },
  { value: "soft-makeup", label: "보정(메이크업)" },
  { value: "matte", label: "보정(매트메이크업)" },
];

interface RetouchingInputPanelProps {
  onGenerate?: (outputUrls: string[]) => void;
  onGenerateStart?: (count: number) => void;
  onGenerateEnd?: () => void;
}

export function RetouchingInputPanel({ onGenerate, onGenerateStart, onGenerateEnd }: RetouchingInputPanelProps) {
  /* Image upload */
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Settings */
  const [outputSize, setOutputSize] = useState("1K");
  const [ratio, setRatio] = useState("AUTO");
  const [activeFilter, setActiveFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(0.5);
  const [excludedAreas, setExcludedAreas] = useState<string[]>([]);
  const [gender, setGender] = useState("female");
  const [mode, setMode] = useState("natural");
  const [showGuide, setShowGuide] = useState(false);

  const hasImage = !!uploadedImage;

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const toggleArea = (id: string) => {
    setExcludedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col">
      {/* Settings */}
      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
        {/* ── Image Upload Area — flex-1로 남은 공간 흡수 ── */}
        <div
          onClick={() => !hasImage && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex-1 min-h-[120px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all",
            hasImage
              ? "border-primary/30 bg-white/[0.02]"
              : "border-dashed cursor-pointer",
            !hasImage &&
              (isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/40 bg-white/[0.03] hover:border-primary hover:bg-primary/5")
          )}
        >
          {hasImage ? (
            <>
              <img
                src={uploadedImage!}
                alt="업로드된 이미지"
                className="max-h-full max-w-full object-contain rounded-lg p-1"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-card/80 border border-border flex items-center justify-center text-card-foreground hover:bg-card transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-sm font-bold text-card-foreground">
                Drop image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuide(true);
                }}
                className="text-[12px] font-semibold text-primary hover:text-[#818CF8] transition-colors cursor-pointer mt-1"
              >
                생성 이미지 가이드 →
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="이미지 파일 선택"
        />
        {/* ── 필터 선택 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-card-foreground">
              필터 선택
            </span>
            <span className="text-[13px] font-bold text-primary">
              {FILTERS.find((f) => f.id === activeFilter)?.label}
              {activeFilter !== "none" && ` ${filterIntensity.toFixed(1)}`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer border",
                  activeFilter === filter.id
                    ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                    : "border-border bg-white/[0.03] text-card-foreground hover:border-white/[0.15]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={activeFilter === "none" ? 0 : filterIntensity}
              onChange={(e) => setFilterIntensity(Number(e.target.value))}
              disabled={activeFilter === "none"}
              className={cn(
                "flex-1 h-1.5 rounded-full appearance-none",
                activeFilter === "none"
                  ? "bg-muted cursor-not-allowed opacity-40"
                  : "bg-primary cursor-pointer",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md",
                activeFilter === "none"
                  ? "[&::-webkit-slider-thumb]:cursor-not-allowed"
                  : "[&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
                activeFilter === "none"
                  ? "[&::-moz-range-thumb]:cursor-not-allowed"
                  : "[&::-moz-range-thumb]:cursor-pointer"
              )}
            />
            <span className={cn(
              "text-[13px] font-bold w-7 text-right",
              activeFilter === "none" ? "text-muted-foreground/40" : "text-primary"
            )}>
              {activeFilter === "none" ? "0.0" : filterIntensity.toFixed(1)}
            </span>
          </div>
        </div>

        {/* ── 성별 + 모드 ── */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[13px] font-medium text-card-foreground">
            보정 설정
          </span>
          <div className="flex gap-1.5">
            <Dropdown options={GENDER_OPTIONS} value={gender} onChange={setGender} className="flex-1" />
            <Dropdown options={MODE_OPTIONS} value={mode} onChange={setMode} className="flex-1" />
          </div>
        </div>

        {/* ── 보정 부위 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-card-foreground">
              보정 부위
            </span>
            <span className="text-[13px] font-bold text-primary">
              {excludedAreas.length === 0 ? "기본" : `${excludedAreas.length}개 제외`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {RETOUCH_AREAS.map((area) => {
              const active = excludedAreas.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id)}
                  className={cn(
                    "py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer border",
                    active
                      ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                      : "border-border bg-white/[0.03] text-card-foreground hover:border-white/[0.15]"
                  )}
                >
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 하단 고정: 비율/해상도 + 생성 버튼 ── */}
      <div className="shrink-0 px-3 pb-3 space-y-2">
        <div className="rounded-xl border border-border bg-white/[0.02] p-2.5 space-y-2.5">
          <div className="flex gap-1.5">
            <Dropdown options={SIZE_OPTIONS} value={outputSize} onChange={setOutputSize} className="flex-1" />
            <Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="flex-1" columns={5} align="right" />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all duration-300 cursor-pointer"
          >
            생성하기
            <Gem className="w-4 h-4" />
            80 크레딧
          </button>
        </div>

        {showGuide && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.55)] p-5 space-y-3 max-w-xs w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-bold text-card-foreground">생성 이미지 가이드</p>
              <ul className="space-y-1.5 text-[12px] text-card-foreground/80 leading-relaxed">
                <li>· 최소 1024x1024 해상도 이상을 권장합니다.</li>
                <li>· 큰 이미지는 자동으로 리사이즈되어 업로드됩니다.</li>
                <li>· 필터 강도는 0~1 선택이며 1에 가까울수록 강합니다.</li>
              </ul>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-primary hover:bg-[#818CF8] transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
