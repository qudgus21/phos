"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  { id: "whiteskin", label: "흰피부" },
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
const GENDER_OPTIONS = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
];
const ETHNICITY_OPTIONS = [
  { value: "asian", label: "동양인" },
  { value: "western", label: "서양인" },
];
const MODE_OPTIONS = [
  { value: "basic", label: "보정(기본)" },
  { value: "makeup", label: "보정(메이크업)" },
  { value: "matte", label: "보정(매트메이크업)" },
  { value: "glow", label: "물광보정" },
];

export function RetouchingInputPanel() {
  /* Image upload */
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Settings */
  const [imageScale, setImageScale] = useState(1.0);
  const [activeFilter, setActiveFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(0.5);
  const [excludedAreas, setExcludedAreas] = useState<string[]>([]);
  const [gender, setGender] = useState("female");
  const [ethnicity, setEthnicity] = useState("asian");
  const [mode, setMode] = useState("basic");
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
      {/* Settings — flex-1로 자연스럽게 공간 채움, 스크롤 없음 */}
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

        {/* ── 이미지 크기 조절 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-card-foreground">
              이미지 크기 조절
            </span>
            <span className="text-[13px] font-bold text-primary">
              {imageScale.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={imageScale}
            onChange={(e) => setImageScale(Number(e.target.value))}
            className={cn(
              "w-full h-1.5 rounded-full appearance-none cursor-pointer",
              "bg-primary",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            )}
          />
        </div>

        {/* ── 필터 선택 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-card-foreground">
              필터 선택
            </span>
            <span className="text-[13px] font-bold text-primary">
              {FILTERS.find((f) => f.id === activeFilter)?.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
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
          {activeFilter !== "none" && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(Number(e.target.value))}
                className={cn(
                  "flex-1 h-1.5 rounded-full appearance-none cursor-pointer",
                  "bg-primary",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
                  "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                )}
              />
              <span className="text-[13px] font-bold text-primary w-7 text-right">
                {filterIntensity.toFixed(1)}
              </span>
            </div>
          )}
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

      {/* ── 하단 고정: 드롭다운 + 생성 버튼 ── */}
      <div className="shrink-0 px-3 pb-3 space-y-2">
        <div className="rounded-xl border border-border bg-white/[0.02] p-2.5 space-y-2.5">
          <div className="flex gap-1.5">
            <Dropdown options={GENDER_OPTIONS} value={gender} onChange={setGender} className="flex-1" />
            <Dropdown options={ETHNICITY_OPTIONS} value={ethnicity} onChange={setEthnicity} className="flex-1" />
            <Dropdown options={MODE_OPTIONS} value={mode} onChange={setMode} className="flex-1" />
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

        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="w-full text-[13px] font-semibold text-primary hover:text-[#818CF8] transition-colors cursor-pointer text-center"
        >
          생성 이미지 가이드
        </button>

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
