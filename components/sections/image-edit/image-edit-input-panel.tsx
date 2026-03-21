"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, PenLine, X, GripVertical, Zap, Loader2, RotateCcw, Ruler } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SAMPLES } from "@/lib/constants/samples";
import { IMAGE_EDIT_MODELS } from "@/lib/services/ai/models";
import { prependHistoryItem } from "@/hooks/use-history";

interface UploadedImage {
  file: File | null;
  previewUrl: string;
}

const MODEL_OPTIONS = [
  { value: "seedream-5.0", label: "Seedream 5.0" },
  { value: "seedream-4.5", label: "Seedream 4.5" },
  { value: "seedream-4.0", label: "Seedream 4.0" },
  { value: "nano-banana-2", label: "Nano Banana 2" },
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
  { value: "nano-banana", label: "Nano Banana" },
];

const MODEL_STORAGE_KEY = "phos:last-model";

const ALL_SIZE_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "3K", label: "3K" },
  { value: "4K", label: "4K" },
  { value: "custom", label: "커스텀" },
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

const DEFAULT_MAX_IMAGES = 14;

/* ── 디자인 시스템 기반 공통 스타일 ── */
const fieldBase =
  "rounded-lg border border-white/[0.15] bg-white/[0.12] text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors";
const sliderThumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export interface ImageEditInputPanelHandle {
  addImageFromUrl: (url: string) => Promise<void>;
  loadFavorite: (fav: { model_id: string; prompt: string; image_size: string; ratio: string; scale: number; image_count: number; reference_image_urls: string[] }) => void;
  getCurrentSettings: () => { model: string; prompt: string; imageSize: string; ratio: string; scale: number; imageCount: number; images: (File | string)[] };
}

interface ImageEditInputPanelProps {
  sampleId?: string | null;
  onGenerate?: (outputUrls: string[]) => void;
  onGenerateStart?: (imageCount: number, firstImageUrl: string | null, scale?: number) => void;
  onGenerateEnd?: () => void;
}

export const ImageEditInputPanel = forwardRef<ImageEditInputPanelHandle, ImageEditInputPanelProps>(function ImageEditInputPanel({ sampleId, onGenerate, onGenerateStart, onGenerateEnd }, ref) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const activeSample = SAMPLES.find((s) => s.id === sampleId);

  const [model, setModelRaw] = useState(MODEL_OPTIONS[0].value);
  const setModel = useCallback((id: string) => {
    setModelRaw(id);
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  }, []);
  // hydration 후 localStorage에서 마지막 사용 모델 복원
  useEffect(() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && MODEL_OPTIONS.some((o) => o.value === saved)) {
      setModelRaw(saved);
    }
  }, []);
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("1K");

  const currentModelDef = IMAGE_EDIT_MODELS.find((m) => m.id === model);
  const maxImages = currentModelDef?.maxImages ?? DEFAULT_MAX_IMAGES;
  // 모델이 네이티브 지원하는 크기만 표시 (배율은 Real-ESRGAN으로 별도 처리)
  const sizeOptions = ALL_SIZE_OPTIONS.filter(
    (opt) => currentModelDef?.supportedSizes.includes(opt.value)
  );

  const skipModelResetRef = useRef(false);

  // 모델 변경 시 설정 초기화 (즐겨찾기 로드 시에는 건너뜀)
  useEffect(() => {
    if (skipModelResetRef.current) {
      skipModelResetRef.current = false;
      return;
    }
    const validSizes = currentModelDef?.supportedSizes ?? [];
    setImageSize(validSizes[0] ?? "1K");
    setRatio("AUTO");
    setScale(1);
    setImageCount(1);
    if (images.length > maxImages) {
      setImages((prev) => prev.slice(0, maxImages));
    }
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const [ratio, setRatio] = useState("AUTO");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [scale, setScale] = useState(1);
  const [imageCount, setImageCount] = useState(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const lastClientXRef = useRef(0);
  const prevSampleIdRef = useRef<string | null | undefined>(null);

  // 샘플 변경 시 images 상태에 샘플 input 주입
  useEffect(() => {
    if (sampleId === prevSampleIdRef.current) return;
    prevSampleIdRef.current = sampleId;

    // 기존 blob URL 정리
    images.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
    });

    if (activeSample && activeSample.inputs.length > 0) {
      skipModelResetRef.current = true;
      setImages(
        activeSample.inputs.map((src) => ({ file: null, previewUrl: src }))
      );
      if (activeSample.model) setModel(activeSample.model);
      if (activeSample.prompt) setPrompt(activeSample.prompt);
      if (activeSample.imageSize) setImageSize(activeSample.imageSize);
      if (activeSample.ratio) setRatio(activeSample.ratio);
      if (activeSample.scale != null) setScale(activeSample.scale);
      if (activeSample.imageCount != null) setImageCount(activeSample.imageCount);
    } else {
      setImages([]);
    }
  }, [sampleId, activeSample]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 드래그 중 자동 스크롤 ── */
  const SCROLL_ZONE = 80;
  const SCROLL_SPEED = 12;

  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = lastClientXRef.current;

      if (x > rect.left && x < rect.left + SCROLL_ZONE) {
        const intensity = 1 - (x - rect.left) / SCROLL_ZONE;
        container.scrollLeft -= SCROLL_SPEED * Math.max(intensity, 0.2);
      } else if (x < rect.right && x > rect.right - SCROLL_ZONE) {
        const intensity = 1 - (rect.right - x) / SCROLL_ZONE;
        container.scrollLeft += SCROLL_SPEED * Math.max(intensity, 0.2);
      }

      autoScrollRef.current = requestAnimationFrame(tick);
    };

    if (autoScrollRef.current === null) {
      autoScrollRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  // 2-4: 생성 중 페이지 이탈 경고
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  const scaleDisplay = `×${scale.toFixed(1)}`;
  const creditCost = imageSize === "4K" ? 150 : 75;

  const isCustomSize = imageSize === "custom";

  // 3-1: 생성 핸들러 추출 + 2-5: Cmd+Enter 단축키
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast("프롬프트를 입력해주세요", "warning");
      return;
    }
    if (isGenerating) return;
    setIsGenerating(true);
    onGenerateStart?.(imageCount, images[0]?.previewUrl ?? null, scale);
    window.dispatchEvent(
      new CustomEvent("credits-updated", {
        detail: { delta: -(creditCost * imageCount) },
      })
    );
    try {
      const fd = new FormData();
      fd.append("modelId", model);
      fd.append("prompt", prompt);
      fd.append("imageSize", imageSize);
      fd.append("ratio", ratio);
      fd.append("width", String(width));
      fd.append("height", String(height));
      fd.append("scale", String(scale));
      fd.append("imageCount", String(imageCount));

      for (const img of images) {
        if (img.file) {
          fd.append("images", img.file);
        } else if (img.previewUrl.startsWith("http")) {
          fd.append("images", img.previewUrl);
        } else if (img.previewUrl.startsWith("/")) {
          const r = await fetch(img.previewUrl);
          const blob = await r.blob();
          const ext = blob.type.split("/")[1] || "png";
          fd.append("images", new File([blob], `sample.${ext}`, { type: blob.type }));
        }
      }

      const res = await fetch("/api/image-edit/generate", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? "생성에 실패했습니다");
      }
      prependHistoryItem(queryClient, "image-edit", {
        id: data.data.historyId,
        display_urls: data.data.outputUrls,
        original_urls: data.data.outputUrls,
        input_urls: [],
        model_id: model,
        prompt,
        credits_used: creditCost * imageCount,
        metadata: {},
      });
      onGenerate?.(data.data.outputUrls);
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
          detail: { delta: creditCost * imageCount },
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
  }, [prompt, isGenerating, imageCount, images, creditCost, model, imageSize, ratio, width, height, scale, onGenerateStart, onGenerate, onGenerateEnd, toast, queryClient]);

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

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      );
      const remaining = maxImages - images.length;
      const toAdd = validFiles.slice(0, remaining).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      if (toAdd.length > 0) setImages((prev) => [...prev, ...toAdd]);
    },
    [images.length, maxImages]
  );

  useImperativeHandle(ref, () => ({
    addImageFromUrl: async (url: string) => {
      if (images.length >= maxImages) return;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "png";
        const file = new File([blob], `ref-${Date.now()}.${ext}`, { type: blob.type });
        addFiles([file]);
      } catch {
        // 외부 URL fetch 실패 시 previewUrl만으로 추가
        setImages((prev) => [...prev, { file: null, previewUrl: url }]);
      }
    },
    loadFavorite: (fav) => {
      skipModelResetRef.current = true;
      const validModel = MODEL_OPTIONS.some((o) => o.value === fav.model_id) ? fav.model_id : MODEL_OPTIONS[0].value;
      setModel(validModel);
      setPrompt(fav.prompt);
      setImageSize(fav.image_size);
      setRatio(fav.ratio);
      setScale(Number(fav.scale));
      setImageCount(fav.image_count);
      // 참조이미지 복원
      images.forEach((img) => { if (img.file) URL.revokeObjectURL(img.previewUrl); });
      if (fav.reference_image_urls.length > 0) {
        setImages(fav.reference_image_urls.map((url) => ({ file: null, previewUrl: url })));
      } else {
        setImages([]);
      }
      toast("즐겨찾기를 불러왔습니다", "success");
    },
    getCurrentSettings: () => ({
      model,
      prompt,
      imageSize,
      ratio,
      scale,
      imageCount,
      images: images.map((img) => img.file ?? img.previewUrl).filter(Boolean) as (File | string)[],
    }),
  }), [images, addFiles, model, prompt, imageSize, ratio, scale, imageCount, setModel, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      if (prev[index].file) URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  /* ── 외부 파일 드롭 / 컨테이너 핸들러 ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx !== null) {
      lastClientXRef.current = e.clientX;
      return;
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    stopAutoScroll();

    if (dragIdx !== null) {
      if (insertIdx !== null) {
        setImages((prev) => {
          const next = [...prev];
          const [moved] = next.splice(dragIdx, 1);
          const adjusted = insertIdx > dragIdx ? insertIdx - 1 : insertIdx;
          next.splice(adjusted, 0, moved);
          return next;
        });
      }
      setDragIdx(null);
      setInsertIdx(null);
      return;
    }

    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  /* ── 이미지 재정렬 드래그 ── */
  const handleReorderStart = (e: React.DragEvent, index: number) => {
    setDragIdx(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 30, 30);
    }
    lastClientXRef.current = e.clientX;
    startAutoScroll();
  };

  const handleReorderOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx === null) return;
    e.dataTransfer.dropEffect = "move";
    lastClientXRef.current = e.clientX;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const raw = e.clientX < midX ? index : index + 1;

    if (raw === dragIdx || raw === dragIdx + 1) {
      setInsertIdx(null);
    } else {
      setInsertIdx(raw);
    }
  };

  const handleReorderEnd = () => {
    stopAutoScroll();
    setDragIdx(null);
    setInsertIdx(null);
  };

  return (
    <>
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
            <PenLine className="w-4 h-4 text-white/50" />
            입력
          </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-gradient-to-r from-[#A5B4FC] to-[#67E8F9] bg-clip-text text-transparent">모델 선택</span>
          <Dropdown
            options={MODEL_OPTIONS}
            value={model}
            onChange={setModel}
            variant="gradient"
          />
        </div>
      </div>

      {/* ── Form ── */}
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 min-h-0 overflow-y-auto">
        {/* Prompt */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-sm font-semibold text-foreground">
            프롬프트 <span className="text-error">*</span>
          </label>
          <div className="gradient-border-wrap rounded-lg flex">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예시: 미니멀 카페, 자연광, 따뜻한 톤"
              className={cn(fieldBase, "focus:ring-0 focus:border-transparent w-full px-3.5 py-3 min-h-[110px] resize-y placeholder:text-white/50")}
            />
          </div>
          <p className="text-[13px] text-muted-foreground">장소, 스타일, 조명을 구체적으로 입력하세요</p>
        </div>

        {/* Reference Images */}
        <div
          className="flex-1 flex flex-col gap-2.5 min-h-0"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-label="참조 이미지 파일 선택"
          />

          <div className="flex items-center justify-between shrink-0">
            <span className="text-sm text-card-foreground">참조 이미지 ({images.length}/{maxImages})</span>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={images.length >= maxImages}
              className="px-3 py-1.5 text-xs font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              이미지 추가
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-x-auto min-h-[150px] rounded-lg transition-colors",
              isDragOver && "bg-[#A5B4FC]/10 ring-2 ring-[#818CF8] ring-dashed"
            )}
          >
            <div className="flex gap-2 w-max h-full items-stretch">
              {images.flatMap((img, i) => {
                const nodes: React.ReactNode[] = [];

                {/* 삽입 인디케이터 — 독립 요소로 양쪽 gap 동일 */}
                if (dragIdx !== null && insertIdx === i) {
                  nodes.push(
                    <motion.div
                      key="insert-indicator"
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      className="w-1.5 self-stretch shrink-0 rounded-full bg-[#818CF8] shadow-[0_0_16px_rgba(129,140,248,0.7)]"
                    />
                  );
                }

                nodes.push(
                  <motion.div
                    key={img.previewUrl}
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="h-full"
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleReorderStart(e, i)}
                      onDragOver={(e) => handleReorderOver(e, i)}
                      onDragEnd={handleReorderEnd}
                      className={cn(
                        "relative aspect-square h-full rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing transition-[opacity,transform] duration-200",
                        dragIdx === i && "opacity-30 scale-[0.85] ring-2 ring-[#818CF8]/50"
                      )}
                    >
                      <img
                        src={img.previewUrl}
                        alt={`참조 이미지 ${i + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3 text-white/70" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute top-1 left-1 text-[10px] font-bold text-white/80 bg-black/50 rounded px-1 leading-4">{i + 1}</span>
                    </div>
                  </motion.div>
                );

                return nodes;
              })}

              {/* 맨 끝 삽입 인디케이터 */}
              {dragIdx !== null && insertIdx === images.length && (
                <motion.div
                  key="insert-indicator"
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="w-1.5 self-stretch shrink-0 rounded-full bg-[#818CF8] shadow-[0_0_16px_rgba(129,140,248,0.7)]"
                />
              )}

              {/* Empty slots */}
              {images.length < maxImages &&
                Array.from({ length: maxImages - images.length }).map((_, i) => (
                  <button
                    key={`empty-${i}`}
                    type="button"
                    onClick={openFilePicker}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragIdx !== null) {
                        lastClientXRef.current = e.clientX;
                        setInsertIdx(images.length);
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-1 aspect-square h-full rounded-lg border border-dashed border-white/[0.18] bg-white/[0.16] hover:border-[#818CF8] hover:bg-[#A5B4FC]/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#A5B4FC]" />
                    <span className="text-[10px] text-muted-foreground/60">이미지 추가</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Additional Settings */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">추가 설정</h3>
            <button
              type="button"
              onClick={() => {
                setImageSize(sizeOptions[0]?.value ?? "2K");
                setRatio("AUTO");
                setWidth(1024);
                setHeight(1024);
                setScale(1);
                setImageCount(1);
              }}
              className="p-1 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
              title="추가 설정 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* 해상도 · 비율 (+ 크기: custom일 때만) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-semibold text-card-foreground w-[70px]">해상도</label>
                <label className="text-sm font-semibold text-card-foreground w-[80px] ml-1">비율</label>
              </div>
              <div className="flex items-center gap-1.5">
                <Dropdown options={sizeOptions} value={imageSize} onChange={setImageSize} className="w-[70px]" openDirection="above" />
                <div className="ml-1"><Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="w-[72px]" openDirection="above" columns={5} /></div>
                {isCustomSize && (
                  <>
                    <input type="number" min={1024} max={4096} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={cn(fieldBase, "w-[62px] px-1.5 py-1.5 text-center text-sm ml-1")} />
                    <span className="text-sm text-white/40">×</span>
                    <input type="number" min={1024} max={4096} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={cn(fieldBase, "w-[62px] px-1.5 py-1.5 text-center text-sm")} />
                    <button
                      type="button"
                      onClick={() => { setWidth(1024); setHeight(1024); }}
                      className="relative w-7 h-7 rounded border border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                      title="크기 초기화"
                    >
                      <Ruler className="w-3 h-3 text-white/40" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 배율 */}
            {imageSize !== "custom" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-card-foreground shrink-0 w-14">배율</span>
                <input type="range" min={1} max={4} step={0.2} value={scale} onChange={(e) => setScale(Number(e.target.value))} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
                <span className="text-sm font-bold text-[#A5B4FC] shrink-0">{scaleDisplay}</span>
              </div>
            )}

            {/* 수량 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">수량</span>
              <input type="range" min={1} max={4} value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
              <span className="text-sm font-bold text-[#A5B4FC] shrink-0">{imageCount}장</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions Footer ── */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">
            4K: 이미지당 80 크레딧 (≈ $0.16)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            >
              초기화
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer",
                prompt.trim() && !isGenerating
                  ? "text-white bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110"
                  : "text-white/50 bg-gradient-to-r from-primary to-secondary opacity-40 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {isGenerating ? "생성 중..." : `실행 / ${creditCost * imageCount} 크레딧`}
            </button>
          </div>
        </div>
      </div>
    </div>

      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setPrompt("");
          images.forEach((img) => { if (img.file) URL.revokeObjectURL(img.previewUrl); });
          setImages([]);
          const validSizes = currentModelDef?.supportedSizes ?? [];
          setImageSize(validSizes[0] ?? "1K");
          setRatio("AUTO");
          setWidth(1024);
          setHeight(1024);
          setScale(1);
          setImageCount(1);
        }}
        title="초기화"
        description="입력한 프롬프트와 참조 이미지, 설정이 모두 초기화됩니다."
        confirmLabel="초기화"
        variant="danger"
      />
    </>
  );
});
