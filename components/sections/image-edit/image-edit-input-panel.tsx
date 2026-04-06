"use client";

import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Plus, PenLine, X, GripVertical, Zap, Loader2, RotateCcw, Ruler, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SAMPLES } from "@/lib/constants/samples";
import { IMAGE_EDIT_MODELS, getImageEditCredits } from "@/lib/services/ai/models";
import { prependHistoryItem, replaceHistoryId, removeHistoryItem } from "@/hooks/use-history";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCreditsBalance } from "@/hooks/use-credits";
import { queryKeys } from "@/lib/query-keys";
import type { UserCreditInfo } from "@/lib/types/credits";
import { useLocale } from "@/lib/i18n/dictionary-context";
import { compressImageForInput } from "@/lib/utils/compress-image";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface UploadedImage {
  file: File | null;
  previewUrl: string;
  loading?: boolean;
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
  { value: "custom", label: "" },
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
  "rounded-lg border border-border bg-muted text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors";
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
  isGenerating?: boolean;
  onSubmit?: (imageCount: number, firstImageUrl: string | null, scale?: number) => void;
  onSubmitError?: () => void;
  onPendingStart?: (historyId: string) => void;
}

export const ImageEditInputPanel = forwardRef<ImageEditInputPanelHandle, ImageEditInputPanelProps>(function ImageEditInputPanel({ sampleId, isGenerating: isGeneratingExternal, onSubmit, onSubmitError, onPendingStart }, ref) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, requireAuth, loginModal } = useRequireAuth();
  const { data: creditInfo } = useCreditsBalance(!!user);
  const dict = useDictionary();
  const locale = useLocale();
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
  const sizeOptionsWithLabels = ALL_SIZE_OPTIONS.map((opt) =>
    opt.value === "custom" ? { ...opt, label: dict.tools.imageEdit.custom } : opt
  );
  const sizeOptions = sizeOptionsWithLabels.filter(
    (opt) => currentModelDef?.supportedSizes.includes(opt.value)
  );

  // 쿨다운 카운트다운
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownSeconds = creditInfo?.plan.cooldownSeconds ?? 0;
  const lastGenAt = creditInfo?.lastGenerationAt ?? null;

  useEffect(() => {
    if (cooldownSeconds <= 0 || !lastGenAt) {
      setCooldownLeft(0);
      return;
    }
    const calc = () => {
      const elapsed = (Date.now() - new Date(lastGenAt).getTime()) / 1000;
      return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
    };
    setCooldownLeft(calc());
    const timer = setInterval(() => {
      const left = calc();
      setCooldownLeft(left);
      if (left <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds, lastGenAt]);

  const cooldownLabel = useMemo(() => {
    if (cooldownLeft <= 0) return "";
    const min = Math.floor(cooldownLeft / 60);
    const sec = cooldownLeft % 60;
    return min > 0
      ? `${min}:${String(sec).padStart(2, "0")}`
      : `${sec}s`;
  }, [cooldownLeft]);

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
  const [showCooldownModal, setShowCooldownModal] = useState(false);
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

    if (!activeSample || activeSample.inputs.length === 0) return;
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

  const scaleDisplay = `×${scale.toFixed(1)}`;
  const creditCost = getImageEditCredits(model, imageSize);

  const isCustomSize = imageSize === "custom";

  // 3-1: 생성 핸들러 추출 + 2-5: Cmd+Enter 단축키
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast(dict.tools.imageEdit.promptRequired, "warning");
      return;
    }
    if (isGenerating) return;
    if (images.some((img) => img.loading)) {
      toast(dict.common.errors.imageProcessing, "warning");
      return;
    }

    const totalCost = creditCost * imageCount;
    const cachedCredits = queryClient.getQueryData<UserCreditInfo>(queryKeys.credits.balance);

    // 쿨다운 체크
    if (cachedCredits && cachedCredits.plan.cooldownSeconds > 0 && cachedCredits.lastGenerationAt) {
      const elapsed = (Date.now() - new Date(cachedCredits.lastGenerationAt).getTime()) / 1000;
      const remaining = Math.ceil(cachedCredits.plan.cooldownSeconds - elapsed);
      if (remaining > 0) {
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        const label = min > 0 ? `${min}:${String(sec).padStart(2, "0")}` : `${sec}s`;
        toast(dict.common.errors.cooldownActive.replace("{remaining}", label), "warning");
        return;
      }
    }

    if (cachedCredits && cachedCredits.balance.total < totalCost) {
      toast(dict.common.errors.insufficientCredits, "error", 5000, {
        label: dict.common.errors.viewPlans,
        onClick: () => { window.location.href = `/${locale}/pricing`; },
      });
      return;
    }

    setIsGenerating(true);

    // 쿨다운 타이머 즉시 시작 (낙관적 업데이트)
    if (creditInfo && creditInfo.plan.cooldownSeconds > 0) {
      const updated = { ...creditInfo, lastGenerationAt: new Date().toISOString() };
      queryClient.setQueryData(queryKeys.credits.balance, updated);
      setCooldownLeft(creditInfo.plan.cooldownSeconds);
    }

    // 낙관적 업데이트: 버튼 클릭 즉시 히스토리에 pending 추가 + 로딩 UI 표시
    const tempId = crypto.randomUUID();
    prependHistoryItem(queryClient, "image-edit", {
      id: tempId,
      model_id: model,
      prompt,
      credits_used: creditCost * imageCount,
      metadata: {},
      status: "pending",
      input_urls: images[0]?.previewUrl ? [images[0].previewUrl] : [],
    });
    onSubmit?.(imageCount, images[0]?.previewUrl ?? null, scale);
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
        throw new Error(getApiErrorMessage(data.error, dict));
      }
      // 임시 ID → 실제 historyId로 교체
      replaceHistoryId(queryClient, "image-edit", tempId, data.data.historyId);
      onPendingStart?.(data.data.historyId);

      if (data.data.balanceAfter != null) {
        window.dispatchEvent(
          new CustomEvent("credits-updated", {
            detail: { total: data.data.balanceAfter },
          })
        );
      }
    } catch (err) {
      // 실패 시 낙관적으로 추가한 항목 제거
      removeHistoryItem(queryClient, "image-edit", tempId);
      onSubmitError?.();
      // 실패 시 타이머 초기화
      setCooldownLeft(0);
      window.dispatchEvent(
        new CustomEvent("credits-updated", {
          detail: { delta: creditCost * imageCount },
        })
      );
      toast(
        err instanceof Error ? err.message : dict.common.errors.generationFailed,
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, isGeneratingExternal, imageCount, images, creditCost, model, imageSize, ratio, width, height, scale, onSubmit, onSubmitError, onPendingStart, toast, queryClient]);

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
      const filesToAdd = validFiles.slice(0, remaining);
      if (filesToAdd.length === 0) return;

      // 로딩 placeholder 즉시 추가
      const placeholders = filesToAdd.map((_, i) => ({
        file: null,
        previewUrl: `__loading__${Date.now()}_${i}`,
        loading: true,
      }));
      setImages((prev) => [...prev, ...placeholders]);

      // 백그라운드에서 2K WebP 압축 후 교체
      filesToAdd.forEach((file, i) => {
        const placeholderUrl = placeholders[i].previewUrl;
        compressImageForInput(file).then((compressed) => {
          setImages((prev) =>
            prev.map((img) =>
              img.previewUrl === placeholderUrl
                ? { file: compressed, previewUrl: URL.createObjectURL(compressed) }
                : img
            )
          );
        }).catch(() => {
          // 압축 실패 시 원본 사용
          setImages((prev) =>
            prev.map((img) =>
              img.previewUrl === placeholderUrl
                ? { file, previewUrl: URL.createObjectURL(file) }
                : img
            )
          );
        });
      });
    },
    [images.length, maxImages]
  );

  useImperativeHandle(ref, () => ({
    addImageFromUrl: async (url: string) => {
      if (images.length >= maxImages) return;
      // 로딩 placeholder 즉시 추가
      const placeholderUrl = `__loading__${Date.now()}`;
      setImages((prev) => [...prev, { file: null, previewUrl: placeholderUrl, loading: true }]);
      try {
        const compressed = await compressImageForInput(url);
        setImages((prev) =>
          prev.map((img) =>
            img.previewUrl === placeholderUrl
              ? { file: compressed, previewUrl: URL.createObjectURL(compressed) }
              : img
          )
        );
      } catch {
        // 실패 시 원본 URL로 fallback
        setImages((prev) =>
          prev.map((img) =>
            img.previewUrl === placeholderUrl
              ? { file: null, previewUrl: url }
              : img
          )
        );
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
        const placeholders = fav.reference_image_urls.map((_, i) => ({
          file: null,
          previewUrl: `__loading__fav_${Date.now()}_${i}`,
          loading: true,
        }));
        setImages(placeholders);
        fav.reference_image_urls.forEach((url, i) => {
          const placeholderUrl = placeholders[i].previewUrl;
          compressImageForInput(url).then((compressed) => {
            setImages((prev) =>
              prev.map((img) =>
                img.previewUrl === placeholderUrl
                  ? { file: compressed, previewUrl: URL.createObjectURL(compressed) }
                  : img
              )
            );
          }).catch(() => {
            setImages((prev) =>
              prev.map((img) =>
                img.previewUrl === placeholderUrl
                  ? { file: null, previewUrl: url }
                  : img
              )
            );
          });
        });
      } else {
        setImages([]);
      }
      toast(dict.tools.imageEdit.favoriteLoaded, "success");
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
            <PenLine className="w-4 h-4 text-muted-foreground" />
            {dict.tools.imageEdit.input}
          </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-gradient-to-r from-[#A5B4FC] to-[#67E8F9] bg-clip-text text-transparent">{dict.tools.imageEdit.modelSelect}</span>
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
            {dict.tools.imageEdit.prompt}
          </label>
          <div className="gradient-border-wrap rounded-lg flex">
            <textarea
              value={prompt}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setPrompt(e.target.value);
              }}
              maxLength={2000}
              placeholder={dict.tools.imageEdit.promptPlaceholder}
              className={cn(fieldBase, "focus:ring-0 focus:border-transparent w-full px-3.5 py-3 min-h-[110px] resize-y placeholder:text-muted-foreground/70 dark:placeholder:text-muted-foreground/50")}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">{dict.tools.imageEdit.promptHint}</p>
            <span className={cn("text-[12px] tabular-nums", prompt.length >= 2000 ? "text-error" : "text-muted-foreground")}>
              {prompt.length}/2,000
            </span>
          </div>
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
            aria-label={dict.tools.imageEdit.refFileAriaLabel}
          />

          <div className="flex items-center justify-between shrink-0">
            <span className="text-sm text-card-foreground">{dict.tools.imageEdit.refImages.replace("{count}", String(images.length)).replace("{max}", String(maxImages))}</span>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={images.length >= maxImages}
              className="px-3 py-1.5 text-xs font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {dict.tools.imageEdit.addImage}
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-x-auto min-h-[100px] lg:min-h-[150px] rounded-lg transition-colors",
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
                      draggable={!img.loading}
                      onDragStart={(e) => handleReorderStart(e, i)}
                      onDragOver={(e) => handleReorderOver(e, i)}
                      onDragEnd={handleReorderEnd}
                      className={cn(
                        "relative aspect-square h-full rounded-lg overflow-hidden group transition-[opacity,transform] duration-200",
                        img.loading ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                        dragIdx === i && "opacity-30 scale-[0.85] ring-2 ring-[#818CF8]/50"
                      )}
                    >
                      {img.loading ? (
                        <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        </div>
                      ) : (
                        <img
                          src={img.previewUrl}
                          alt={`${dict.tools.imageEdit.refImageAlt} ${i + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3 text-white/70" />
                      </div>
                      {!img.loading && (
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
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
                    className="flex flex-col items-center justify-center gap-1 aspect-square h-full rounded-lg border-2 border-dashed border-primary/30 dark:border-white/[0.18] bg-muted/30 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#A5B4FC]" />
                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground/60">{dict.tools.imageEdit.addImage}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Additional Settings */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{dict.tools.imageEdit.extraSettings}</h3>
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
              className="p-1 text-muted-foreground/70 dark:text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
              title={dict.tools.imageEdit.extraSettingsReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* 해상도 · 비율 (+ 크기: custom일 때만) */}
            <div className="space-y-1.5">
              <div className="hidden lg:flex items-center gap-1.5">
                <label className="text-sm font-semibold text-card-foreground w-[70px]">{dict.tools.imageEdit.resolution}</label>
                <label className="text-sm font-semibold text-card-foreground w-[80px] ml-1">{dict.tools.imageEdit.ratio}</label>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Dropdown options={sizeOptions} value={imageSize} onChange={setImageSize} className="w-[70px] min-w-[70px]" openDirection="above" />
                <div className="ml-0 lg:ml-1"><Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="w-[72px]" openDirection="above" columns={5} /></div>
                {isCustomSize && (
                  <div className="flex items-center gap-1.5 w-full lg:w-auto">
                    <input type="number" min={1024} max={4096} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={cn(fieldBase, "w-[62px] px-1.5 py-1.5 text-center text-sm")} />
                    <span className="text-sm text-muted-foreground">×</span>
                    <input type="number" min={1024} max={4096} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={cn(fieldBase, "w-[62px] px-1.5 py-1.5 text-center text-sm")} />
                    <button
                      type="button"
                      onClick={() => { setWidth(1024); setHeight(1024); }}
                      className="relative w-7 h-7 rounded border border-border bg-muted/50 hover:border-border/80 hover:bg-muted transition-colors cursor-pointer flex items-center justify-center"
                      title={dict.tools.imageEdit.resetButton}
                    >
                      <Ruler className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 배율 */}
            {imageSize !== "custom" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-card-foreground shrink-0 w-14">{dict.tools.imageEdit.scale}</span>
                <input type="range" min={1} max={4} step={0.2} value={scale} onChange={(e) => setScale(Number(e.target.value))} aria-label={dict.tools.imageEdit.scale} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
                <span className="text-sm font-bold text-[#A5B4FC] shrink-0">{scaleDisplay}</span>
              </div>
            )}

            {/* 수량 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">{dict.tools.imageEdit.count}</span>
              <input type="range" min={1} max={4} value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} aria-label={dict.tools.imageEdit.count} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
              <span className="text-sm font-bold text-[#A5B4FC] shrink-0">{imageCount}{dict.tools.imageEdit.countUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions Footer ── */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {dict.tools.imageEdit.creditsPerImage.replace("{credits}", String(creditCost))}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {dict.tools.imageEdit.resetButton}
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => cooldownLeft > 0 ? setShowCooldownModal(true) : requireAuth(handleGenerate)}
              className={cn(
                "flex items-center gap-2 px-3 lg:px-5 py-2.5 text-[13px] lg:text-[15px] font-extrabold rounded-xl transition-all duration-300 cursor-pointer tracking-wide",
                prompt.trim() && !isGenerating && cooldownLeft <= 0
                  ? "text-white bg-gradient-to-r from-primary to-secondary shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:brightness-110 hover:scale-[1.03]"
                  : "text-white/50 bg-gradient-to-r from-primary to-secondary opacity-40 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {dict.tools.imageEdit.generatingButton}
                </>
              ) : cooldownLeft > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {cooldownLabel}
                </>
              ) : (
                <>
                  {dict.tools.imageEdit.generateButton}
                  <span className="ml-2 inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                    <Zap className="w-2.5 h-2.5" />
                    {creditCost * imageCount}
                  </span>
                </>
              )}
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
        title={dict.tools.imageEdit.resetConfirmTitle}
        description={dict.tools.imageEdit.resetConfirmDesc}
        confirmLabel={dict.tools.imageEdit.resetConfirmLabel}
        variant="danger"
      />
      <ConfirmModal
        open={showCooldownModal}
        onClose={() => setShowCooldownModal(false)}
        onConfirm={() => { window.location.href = `/${locale}/pricing`; }}
        title={dict.common.cooldownModal.title}
        description={
          <div className="space-y-2.5">
            <p className="text-[13px] text-slate-400">{dict.common.cooldownModal.description}</p>
            <ul className="text-left space-y-1.5">
              {dict.common.cooldownModal.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[13px]">
                  <span className="text-indigo-400">✓</span>
                  <span className="text-slate-200">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        }
        confirmLabel={dict.common.cooldownModal.upgradeButton}
        cancelLabel={dict.common.cooldownModal.waitButton.replace("{remaining}", cooldownLabel)}
      />
      {loginModal}
    </>
  );
});
