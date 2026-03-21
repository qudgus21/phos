"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Upload,
  X,
  Gem,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { prependHistoryItem } from "@/hooks/use-history";
import { motion, AnimatePresence } from "framer-motion";
import { RETOUCHING_SAMPLES } from "@/lib/constants/retouching-samples";

/* ── Filter Chips ── */
const FILTERS = [
  { id: "none", label: "없음" },
  { id: "studio", label: "스튜디오" },
  { id: "brightening", label: "브라이트닝" },
  { id: "glow", label: "글로우" },
];

/* ── Retouching Area Options (for dropdown) ── */
const RETOUCH_AREAS = [
  { id: "lips", label: "입술" },
  { id: "eyebrows", label: "눈썹" },
  { id: "nose", label: "코" },
  { id: "hair", label: "헤어" },
  { id: "background", label: "배경" },
  { id: "clothes", label: "의상" },
];

/* ── Dropdown options ── */
const RATIO_OPTIONS = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
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

const CREDIT_COST = 80;

const SCALE_OPTIONS = [
  { value: "1", label: "1K" },
  { value: "2", label: "2K" },
  { value: "3", label: "3K" },
  { value: "4", label: "4K" },
];

/* ── Multi-select Dropdown ── */
function ExcludeAreasDropdown({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"below" | "above">("below");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const menuHeight = RETOUCH_AREAS.length * 32 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < menuHeight && rect.top > menuHeight ? "above" : "below");
    }
    setOpen((v) => !v);
  };

  const label = selected.length === 0 ? "기본 (전체 보정)" : `${selected.length}개 부위 제외`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-between gap-1.5 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-all duration-200 cursor-pointer",
          "bg-muted border-border text-foreground hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10",
          open && "ring-1 ring-primary/40 border-primary/40"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: direction === "above" ? 4 : -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "above" ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[9999] w-full rounded-lg border border-white/[0.14] bg-card py-1 shadow-[0_8px_30px_rgba(0,0,0,0.55)]",
              direction === "above" ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {RETOUCH_AREAS.map((area) => {
              const isSelected = selected.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onToggle(area.id)}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-sm cursor-pointer transition-colors hover:bg-white/[0.08] text-card-foreground"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border bg-transparent"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>{area.label} 제외</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Panel ── */
export interface RetouchingInputPanelHandle {
  loadFavorite: (fav: { prompt: string; model_id: string; ratio: string; image_size: string; scale: number; image_count: number; reference_image_urls: string[]; metadata?: Record<string, unknown> | null }) => void;
  getCurrentSettings: () => {
    filter: string; filterIntensity: number; gender: string; mode: string;
    faceReshape: boolean; faceReshapeIntensity: number; excludedAreas: string[];
    ratio: string; scale: number; image: File | string | null;
  };
}

interface RetouchingInputPanelProps {
  sampleId?: string | null;
  onGenerate?: (outputUrls: string[], inputImageUrl?: string | null, ratio?: string) => void;
  onGenerateStart?: (count: number, inputImage?: string | null, scale?: number) => void;
  onGenerateEnd?: () => void;
  externalImageUrl?: string | null;
}

export const RetouchingInputPanel = forwardRef<RetouchingInputPanelHandle, RetouchingInputPanelProps>(function RetouchingInputPanel({ sampleId, onGenerate, onGenerateStart, onGenerateEnd, externalImageUrl }, ref) {
  const queryClient = useQueryClient();
  /* Image upload */
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Settings */
  const outputSize = "auto";
  const [ratio, setRatio] = useState("1:1");
  const [scale, setScale] = useState(1);
  const [activeFilter, setActiveFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(0.5);
  const [excludedAreas, setExcludedAreas] = useState<string[]>([]);
  const [gender, setGender] = useState("female");
  const [mode, setMode] = useState("natural");
  const [faceReshape, setFaceReshape] = useState(false);
  const [faceReshapeIntensity, setFaceReshapeIntensity] = useState(0.5);
  const [showGuide, setShowGuide] = useState(false);

  /* Generation */
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const hasImage = !!uploadedImage;

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          toast("이미지가 너무 작습니다 (100×100px 이상)", "warning");
          return;
        }
        if (img.width > 8192 || img.height > 8192) {
          toast("이미지가 너무 큽니다 (8192px 이하)", "warning");
          return;
        }

        // 항상 WebP 변환 (≤1024px: 포맷만, >1024px: 리사이즈+포맷)
        const MAX = 1024;
        const needsResize = img.width > MAX || img.height > MAX;
        const resizeScale = needsResize ? MAX / Math.max(img.width, img.height) : 1;
        const w = Math.round(img.width * resizeScale);
        const h = Math.round(img.height * resizeScale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
            setUploadedFile(webpFile);
            setUploadedImage(canvas.toDataURL("image/webp"));
          },
          "image/webp",
          0.85
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [toast]);

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
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // 샘플 선택 시 설정값 주입
  useEffect(() => {
    if (!sampleId) return;
    const sample = RETOUCHING_SAMPLES.find((s) => s.id === sampleId);
    if (!sample) return;
    const controller = new AbortController();
    setActiveFilter(sample.settings.filter);
    setFilterIntensity(sample.settings.filterIntensity);
    setGender(sample.settings.gender);
    setMode(sample.settings.mode);
    setFaceReshape(sample.settings.faceReshape);
    setFaceReshapeIntensity(sample.settings.faceReshapeIntensity);
    setExcludedAreas(sample.settings.excludedAreas);
    setRatio(sample.settings.ratio);
    // before 이미지를 업로드 영역에 표시
    setUploadedImage(sample.before);
    // File 객체 생성 (생성 시 필요)
    (async () => {
      try {
        const res = await fetch(sample.before, { signal: controller.signal });
        const blob = await res.blob();
        const ext = sample.before.endsWith(".webp") ? "webp" : "png";
        const file = new File([blob], `sample-${sampleId}.${ext}`, { type: blob.type || `image/${ext}` });
        if (!controller.signal.aborted) setUploadedFile(file);
      } catch {
        // fetch 취소 또는 실패 시 무시
      }
    })();
    return () => controller.abort();
  }, [sampleId]);

  // 외부에서 이미지 URL 주입 (결과 → 입력 재사용)
  useEffect(() => {
    if (!externalImageUrl) return;
    const controller = new AbortController();
    const cleanUrl = externalImageUrl.replace(/#.*$/, "");
    // 즉시 미리보기 반영
    setUploadedImage(cleanUrl);
    // 백그라운드에서 File 객체 생성
    (async () => {
      try {
        const res = await fetch(cleanUrl, { signal: controller.signal });
        const blob = await res.blob();
        const file = new File([blob], `input-${Date.now()}.png`, { type: blob.type || "image/png" });
        if (!controller.signal.aborted) setUploadedFile(file);
      } catch {
        // fetch 취소 또는 실패 시 무시
      }
    })();
    return () => controller.abort();
  }, [externalImageUrl]);

  const toggleArea = useCallback((id: string) => {
    setExcludedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  /* ── Imperative Handle (즐겨찾기용) ── */
  useImperativeHandle(ref, () => ({
    loadFavorite: (fav) => {
      // metadata에 retouching 설정이 저장됨
      const meta = (fav.metadata ?? {}) as Record<string, unknown>;
      setActiveFilter((meta.filter as string) ?? "none");
      setFilterIntensity(Number(meta.filterIntensity ?? 0.5));
      setGender((meta.gender as string) ?? "female");
      setMode((meta.mode as string) ?? "natural");
      setFaceReshape(Boolean(meta.faceReshape));
      setFaceReshapeIntensity(Number(meta.faceReshapeIntensity ?? 0.5));
      setExcludedAreas((meta.excludedAreas as string[]) ?? []);
      setRatio(fav.ratio || "1:1");
      setScale(Number(fav.scale) || 1);
      // 참조 이미지 복원
      if (fav.reference_image_urls.length > 0) {
        const url = fav.reference_image_urls[0];
        setUploadedImage(url);
        (async () => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            setUploadedFile(new File([blob], `fav-${Date.now()}.webp`, { type: blob.type || "image/webp" }));
          } catch {
            toast("이미지를 불러오지 못했습니다. 다시 업로드해주세요", "warning");
            setUploadedImage(null);
          }
        })();
      }
      toast("즐겨찾기를 불러왔습니다", "success");
    },
    getCurrentSettings: () => ({
      filter: activeFilter,
      filterIntensity,
      gender,
      mode,
      faceReshape,
      faceReshapeIntensity,
      excludedAreas,
      ratio,
      scale,
      image: uploadedFile ?? uploadedImage,
    }),
  }));

  /* ── 생성 핸들러 ── */
  const handleGenerate = useCallback(async () => {
    if (!uploadedFile) {
      toast("이미지를 업로드해주세요", "warning");
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    onGenerateStart?.(1, uploadedImage, scale);

    window.dispatchEvent(
      new CustomEvent("credits-updated", {
        detail: { delta: -CREDIT_COST },
      })
    );

    try {
      const fd = new FormData();
      fd.append("image", uploadedFile);
      fd.append("filter", activeFilter);
      fd.append("filterIntensity", String(filterIntensity));
      fd.append("gender", gender);
      fd.append("mode", mode);
      fd.append("excludedAreas", excludedAreas.join(","));
      fd.append("faceReshape", String(faceReshape));
      fd.append("faceReshapeIntensity", String(faceReshapeIntensity));
      fd.append("outputSize", outputSize);
      fd.append("ratio", ratio);
      fd.append("scale", String(scale));

      const res = await fetch("/api/retouching/generate", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? "생성에 실패했습니다");
      }
      prependHistoryItem(queryClient, "retouching", {
        id: data.data.historyId,
        display_urls: data.data.outputUrls,
        original_urls: data.data.outputUrls,
        input_urls: data.data.inputImageUrl ? [data.data.inputImageUrl] : [],
        model_id: "retouching-gpt-image-1.5",
        prompt: "",
        credits_used: CREDIT_COST,
        metadata: { filter: activeFilter, filterIntensity, gender, mode, faceReshape, faceReshapeIntensity },
      });
      onGenerate?.(data.data.outputUrls, data.data.inputImageUrl, ratio);
      if (data.data.balanceAfter != null) {
        window.dispatchEvent(
          new CustomEvent("credits-updated", {
            detail: { total: data.data.balanceAfter },
          })
        );
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("credits-updated", {
          detail: { delta: CREDIT_COST },
        })
      );
      toast(
        err instanceof Error ? err.message : "생성에 실패했습니다",
        "error"
      );
    } finally {
      setIsGenerating(false);
      onGenerateEnd?.();
    }
  }, [uploadedFile, uploadedImage, isGenerating, activeFilter, filterIntensity, gender, mode, excludedAreas, faceReshape, faceReshapeIntensity, outputSize, ratio, scale, onGenerateStart, onGenerate, onGenerateEnd, toast, queryClient]);

  /* ── beforeunload 가드 ── */
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  /* ── Cmd+Enter 단축키 ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col">
      {/* Settings */}
      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
        {/* ── Image Upload Area ── */}
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
              aria-label="필터 강도"
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

        {/* ── 보정 설정 (성별 + 모드) ── */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[13px] font-medium text-card-foreground">
            보정 설정
          </span>
          <div className="flex gap-1.5">
            <Dropdown options={GENDER_OPTIONS} value={gender} onChange={setGender} className="flex-1" />
            <Dropdown options={MODE_OPTIONS} value={mode} onChange={setMode} className="flex-1" />
          </div>
        </div>

        {/* ── 윤곽 보정 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-medium text-card-foreground">
                윤곽 보정
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFaceReshape((v) => !v)}
              role="switch"
              aria-checked={faceReshape}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer",
                faceReshape ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  faceReshape && "translate-x-4"
                )}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={faceReshape ? faceReshapeIntensity : 0}
              onChange={(e) => setFaceReshapeIntensity(Number(e.target.value))}
              disabled={!faceReshape}
              aria-label="얼굴 보정 강도"
              className={cn(
                "flex-1 h-1.5 rounded-full appearance-none",
                faceReshape
                  ? "bg-primary cursor-pointer"
                  : "bg-muted cursor-not-allowed opacity-40",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md",
                faceReshape
                  ? "[&::-webkit-slider-thumb]:cursor-pointer"
                  : "[&::-webkit-slider-thumb]:cursor-not-allowed",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
                faceReshape
                  ? "[&::-moz-range-thumb]:cursor-pointer"
                  : "[&::-moz-range-thumb]:cursor-not-allowed"
              )}
            />
            <span className={cn(
              "text-[13px] font-bold w-7 text-right",
              faceReshape ? "text-primary" : "text-muted-foreground/40"
            )}>
              {faceReshape ? faceReshapeIntensity.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>

        {/* ── 보정 제외 부위 ── */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[12px] text-muted-foreground">
            보정 제외 부위
          </span>
          <ExcludeAreasDropdown selected={excludedAreas} onToggle={toggleArea} />
        </div>
      </div>

      {/* ── 하단 고정: 비율/해상도 + 생성 버튼 ── */}
      <div className="shrink-0 px-3 pb-3 space-y-2">
        <div className="rounded-xl border border-border bg-white/[0.02] p-2.5 space-y-2.5">
          <div className="flex gap-1.5">
            <Dropdown options={SCALE_OPTIONS} value={String(scale)} onChange={(v) => setScale(Number(v))} className="flex-1" />
            <Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="flex-1" />
          </div>

          <button
            type="button"
            disabled={isGenerating || !hasImage}
            onClick={handleGenerate}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-bold text-white transition-all duration-300",
              isGenerating || !hasImage
                ? "bg-muted cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110 cursor-pointer"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                생성하기
                <Gem className="w-4 h-4" />
                {CREDIT_COST} 크레딧
              </>
            )}
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
});
