"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Upload,
  X,
  Zap,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { prependHistoryItem, replaceHistoryId, removeHistoryItem } from "@/hooks/use-history";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { motion, AnimatePresence } from "framer-motion";
import { RETOUCHING_SAMPLES } from "@/lib/constants/retouching-samples";
import { compressImageForInput } from "@/lib/utils/compress-image";
import { useDictionary } from "@/lib/i18n/dictionary-context";

/* ── Dropdown options ── */
const RATIO_OPTIONS = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
];

const CREDIT_COST = 110;

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
  dict,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  dict: ReturnType<typeof useDictionary>;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"below" | "above">("below");
  const containerRef = useRef<HTMLDivElement>(null);

  const RETOUCH_AREAS = [
    { id: "lips", label: dict.tools.retouching.areas.lips },
    { id: "eyebrows", label: dict.tools.retouching.areas.eyebrows },
    { id: "nose", label: dict.tools.retouching.areas.nose },
    { id: "hair", label: dict.tools.retouching.areas.hair },
    { id: "background", label: dict.tools.retouching.areas.background },
    { id: "clothes", label: dict.tools.retouching.areas.clothing },
  ];

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

  const label = selected.length === 0 ? dict.tools.retouching.excludeDefault : dict.tools.retouching.excludeCount.replace("{count}", String(selected.length));

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
              "absolute z-[9999] w-full rounded-lg border border-border bg-card py-1 shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.55)]",
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
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-sm cursor-pointer transition-colors hover:bg-muted text-card-foreground"
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
                  <span>{area.label} {dict.tools.retouching.excludeAreaSuffix}</span>
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
  isGenerating?: boolean;
  onSubmit?: (inputImage?: string | null, scale?: number) => void;
  onSubmitError?: () => void;
  onPendingStart?: (historyId: string) => void;
  externalImageUrl?: string | null;
}

export const RetouchingInputPanel = forwardRef<RetouchingInputPanelHandle, RetouchingInputPanelProps>(function RetouchingInputPanel({ sampleId, isGenerating: isGeneratingExternal, onSubmit, onSubmitError, onPendingStart, externalImageUrl }, ref) {
  const dict = useDictionary();
  const queryClient = useQueryClient();

  const FILTERS = [
    { id: "none", label: dict.tools.retouching.filters.none },
    { id: "studio", label: dict.tools.retouching.filters.studio },
    { id: "brightening", label: dict.tools.retouching.filters.brightening },
    { id: "glow", label: dict.tools.retouching.filters.glow },
  ];
  const GENDER_OPTIONS = [
    { value: "female", label: dict.tools.retouching.genders.female },
    { value: "male", label: dict.tools.retouching.genders.male },
  ];
  const MODE_OPTIONS = [
    { value: "natural", label: dict.tools.retouching.modes.basic },
    { value: "soft-makeup", label: dict.tools.retouching.modes.makeup },
    { value: "matte", label: dict.tools.retouching.modes.matte },
  ];
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
  const { requireAuth, loginModal } = useRequireAuth();

  const hasImage = !!uploadedImage;

  const [isImageLoading, setIsImageLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsImageLoading(true);
    try {
      const compressed = await compressImageForInput(file);
      setUploadedFile(compressed);
      setUploadedImage(URL.createObjectURL(compressed));
    } catch {
      toast(dict.tools.retouching.imageProcessError, "warning");
    } finally {
      setIsImageLoading(false);
    }
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
    setActiveFilter(sample.settings.filter);
    setFilterIntensity(sample.settings.filterIntensity);
    setGender(sample.settings.gender);
    setMode(sample.settings.mode);
    setFaceReshape(sample.settings.faceReshape);
    setFaceReshapeIntensity(sample.settings.faceReshapeIntensity);
    setExcludedAreas(sample.settings.excludedAreas);
    setScale(sample.settings.scale);
    setRatio(sample.settings.ratio);
    // 샘플 이미지는 이미 최적화된 로컬 파일 → 직접 세팅
    setUploadedImage(sample.before);
    setUploadedFile(null);
    // File 객체 생성 (생성 시 필요)
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(sample.before);
        const blob = await res.blob();
        const ext = sample.before.endsWith(".webp") ? "webp" : "png";
        const file = new File([blob], `sample-${sampleId}.${ext}`, { type: blob.type || `image/${ext}` });
        if (!cancelled) setUploadedFile(file);
      } catch {
        // fetch 취소 또는 실패 시 무시
      }
    })();
    return () => { cancelled = true; };
  }, [sampleId]);

  // 외부에서 이미지 URL 주입 (결과 → 입력 재사용)
  useEffect(() => {
    if (!externalImageUrl) return;
    let cancelled = false;
    const cleanUrl = externalImageUrl.replace(/#.*$/, "");
    setIsImageLoading(true);
    setUploadedImage(null);
    setUploadedFile(null);
    (async () => {
      try {
        const compressed = await compressImageForInput(cleanUrl);
        if (!cancelled) {
          setUploadedFile(compressed);
          setUploadedImage(URL.createObjectURL(compressed));
        }
      } catch {
        // fetch 실패 시 무시
      } finally {
        if (!cancelled) setIsImageLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
        setIsImageLoading(true);
        setUploadedImage(null);
        setUploadedFile(null);
        (async () => {
          try {
            const compressed = await compressImageForInput(url);
            setUploadedFile(compressed);
            setUploadedImage(URL.createObjectURL(compressed));
          } catch {
            toast(dict.tools.retouching.imageLoadError, "warning");
          } finally {
            setIsImageLoading(false);
          }
        })();
      }
      toast(dict.tools.retouching.favoriteLoaded, "success");
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
      toast(dict.common.errors.uploadRequired, "warning");
      return;
    }
    if (isGenerating) return;
    if (isImageLoading) {
      toast(dict.common.errors.imageProcessing, "warning");
      return;
    }

    setIsGenerating(true);
    const tempId = crypto.randomUUID();
    prependHistoryItem(queryClient, "retouching", {
      id: tempId,
      model_id: "retouching-gpt-image-1.5",
      prompt: "",
      credits_used: CREDIT_COST,
      metadata: { filter: activeFilter, filterIntensity, gender, mode, faceReshape, faceReshapeIntensity },
      status: "pending",
      input_urls: uploadedImage ? [uploadedImage] : [],
    });
    onSubmit?.(uploadedImage, scale);

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
        throw new Error(data.error?.message ?? dict.common.errors.generationFailed);
      }
      replaceHistoryId(queryClient, "retouching", tempId, data.data.historyId);
      onPendingStart?.(data.data.historyId);
      if (data.data.balanceAfter != null) {
        window.dispatchEvent(
          new CustomEvent("credits-updated", {
            detail: { total: data.data.balanceAfter },
          })
        );
      }
    } catch (err) {
      removeHistoryItem(queryClient, "retouching", tempId);
      onSubmitError?.();
      window.dispatchEvent(
        new CustomEvent("credits-updated", {
          detail: { delta: CREDIT_COST },
        })
      );
      toast(
        err instanceof Error ? err.message : dict.common.errors.generationFailed,
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFile, uploadedImage, isGenerating, isGeneratingExternal, activeFilter, filterIntensity, gender, mode, excludedAreas, faceReshape, faceReshapeIntensity, outputSize, ratio, scale, onSubmit, onSubmitError, onPendingStart, toast, queryClient]);


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
              ? "border-primary/30 bg-muted/20"
              : "border-dashed cursor-pointer",
            !hasImage &&
              (isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/30 dark:border-white/[0.18] bg-muted/30 hover:border-primary dark:hover:border-primary hover:bg-primary/5")
          )}
        >
          {isImageLoading ? (
            <div className="flex-1 w-full flex items-center justify-center">
              <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            </div>
          ) : hasImage ? (
            <>
              <img
                src={uploadedImage!}
                alt={dict.tools.retouching.uploadedAlt}
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
              <Upload className="w-8 h-8 text-muted-foreground/70 dark:text-muted-foreground/50" />
              <p className="text-sm font-bold text-card-foreground">
                {dict.tools.retouching.uploadImage}
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
                className="text-[12px] font-semibold text-indigo-400 dark:text-indigo-300 hover:text-[#818CF8] transition-colors cursor-pointer mt-1"
              >
                {dict.tools.retouching.guideButton}
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
          aria-label={dict.tools.retouching.uploadedAlt}
        />

        {/* ── 필터 선택 ── */}
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-card-foreground">
              {dict.tools.retouching.filterSection}
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
                    : "border-border bg-muted/30 text-card-foreground hover:border-border/80"
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
              aria-label={dict.tools.retouching.filterSection}
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
              activeFilter === "none" ? "text-muted-foreground/60 dark:text-muted-foreground/40" : "text-primary"
            )}>
              {activeFilter === "none" ? "0.0" : filterIntensity.toFixed(1)}
            </span>
          </div>
        </div>

        {/* ── 보정 설정 (성별 + 모드) ── */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[13px] font-medium text-card-foreground">
            {dict.tools.retouching.retouchSettings}
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
                {dict.tools.retouching.reshapeLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFaceReshape((v) => !v)}
              role="switch"
              aria-checked={faceReshape}
              aria-label={dict.tools.retouching.reshapeLabel}
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
              aria-label={dict.tools.retouching.reshapeLabel}
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
              faceReshape ? "text-primary" : "text-muted-foreground/60 dark:text-muted-foreground/40"
            )}>
              {faceReshape ? faceReshapeIntensity.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>

        {/* ── 보정 제외 부위 ── */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[12px] text-muted-foreground">
            {dict.tools.retouching.excludeSection}
          </span>
          <ExcludeAreasDropdown selected={excludedAreas} onToggle={toggleArea} dict={dict} />
        </div>
      </div>

      {/* ── 하단 고정: 비율/해상도 + 생성 버튼 ── */}
      <div className="shrink-0 px-3 pb-3 space-y-2">
        <div className="rounded-xl border border-border bg-muted/20 p-2.5 space-y-2.5">
          <div className="flex gap-1.5">
            <Dropdown options={SCALE_OPTIONS} value={String(scale)} onChange={(v) => setScale(Number(v))} className="flex-1" />
            <Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="flex-1" />
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => requireAuth(handleGenerate)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[16px] font-extrabold tracking-wide text-white transition-all duration-300",
              isGenerating
                ? "bg-muted cursor-not-allowed opacity-50"
                : !hasImage
                  ? "bg-gradient-to-r from-primary to-secondary opacity-60 cursor-pointer"
                  : "bg-gradient-to-r from-primary to-secondary shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:brightness-110 hover:scale-[1.02] cursor-pointer"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {dict.tools.retouching.generatingButton}
              </>
            ) : (
              <>
                {dict.tools.retouching.generateButton}
                <span className="ml-1.5 inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                  <Zap className="w-2.5 h-2.5" />
                  {CREDIT_COST}
                </span>
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
              <p className="text-sm font-bold text-card-foreground">{dict.tools.retouching.guideTitle}</p>
              <ul className="space-y-1.5 text-[12px] text-card-foreground/80 leading-relaxed">
                <li>· {dict.tools.retouching.guideItems[0]}</li>
                <li>· {dict.tools.retouching.guideItems[1]}</li>
                <li>· {dict.tools.retouching.guideItems[2]}</li>
              </ul>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-primary hover:bg-[#818CF8] transition-colors cursor-pointer"
              >
                {dict.tools.retouching.guideConfirm}
              </button>
            </div>
          </div>
        )}
      </div>
      {loginModal}
    </div>
  );
});
