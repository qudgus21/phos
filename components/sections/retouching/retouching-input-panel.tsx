"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  ChevronDown,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
const GENDER_OPTIONS = ["여성", "남성"];
const ETHNICITY_OPTIONS = ["동양인", "서양인"];
const MODE_OPTIONS = ["보정(기본)", "보정(강하게)", "보정(자연스럽게)"];

/* ── Generic dropdown ── */
function MiniDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg border border-border bg-white/[0.03] text-sm font-semibold text-card-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        {value}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-primary transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 w-full rounded-lg border border-border bg-card shadow-elevated z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors",
                opt === value
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-card-foreground hover:bg-white/[0.06]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RetouchingInputPanel() {
  /* Image upload */
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Settings */
  const [imageScale, setImageScale] = useState(1.0);
  const [activeFilter, setActiveFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(0);
  const [excludedAreas, setExcludedAreas] = useState<string[]>([]);
  const [gender, setGender] = useState("여성");
  const [ethnicity, setEthnicity] = useState("동양인");
  const [mode, setMode] = useState("보정(기본)");

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
                이미지를 끌어다 놓거나 클릭
              </p>
              <p className="text-xs text-muted-foreground">
                JPG / PNG
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
            min={0.5}
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
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white/[0.03] text-card-foreground hover:border-white/[0.15]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {activeFilter !== "none" && (
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={filterIntensity}
              onChange={(e) => setFilterIntensity(Number(e.target.value))}
              className={cn(
                "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                "bg-primary",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              )}
            />
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
                      ? "border-primary bg-primary/20 text-[#A5B4FC]"
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
            <MiniDropdown
              value={gender}
              options={GENDER_OPTIONS}
              onChange={setGender}
            />
            <MiniDropdown
              value={ethnicity}
              options={ETHNICITY_OPTIONS}
              onChange={setEthnicity}
            />
            <MiniDropdown
              value={mode}
              options={MODE_OPTIONS}
              onChange={setMode}
            />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-bold text-primary-foreground bg-primary hover:bg-[#818CF8] btn-glow transition-all duration-200 cursor-pointer"
          >
            생성하기
            <Gem className="w-4 h-4" />
            80 크레딧
          </button>
        </div>

        <button
          type="button"
          className="w-full text-[13px] font-semibold text-primary hover:text-[#818CF8] transition-colors cursor-pointer text-center"
        >
          생성 이미지 가이드
        </button>
      </div>
    </div>
  );
}
