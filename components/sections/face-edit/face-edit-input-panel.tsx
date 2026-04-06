"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Paintbrush, Upload, RefreshCw, Trash2, Zap, Loader2, RotateCcw, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import { FaceEditMaskEditor } from "./face-edit-mask-editor";
import { FACE_EDIT_SAMPLES } from "./face-edit-sample-sidebar";
import { prependHistoryItem, replaceHistoryId, removeHistoryItem } from "@/hooks/use-history";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/query-keys";
import type { UserCreditInfo } from "@/lib/types/credits";
import { useLocale } from "@/lib/i18n/dictionary-context";
import { compressImageForInput } from "@/lib/utils/compress-image";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const SCALE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "1", label: "1K" },
  { value: "2", label: "2K" },
  { value: "3", label: "3K" },
  { value: "4", label: "4K" },
];

const CREDIT_COST = 40;

const sliderThumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

export interface FaceEditInputPanelHandle {
  loadSample: (sampleId: string) => void;
  addImageFromUrl: (url: string) => Promise<void>;
  loadFavorite: (fav: {
    metadata: Record<string, unknown>;
    scale: number;
    reference_image_urls: string[];
  }) => void;
  getCurrentSettings: () => {
    gender: "female" | "male";
    strength: number;
    scale: string;
    image: File | string | null;
    maskBlob: Blob | null;
  };
}

interface FaceEditInputPanelProps {
  sampleId?: string | null;
  isGenerating?: boolean;
  onSubmit?: (inputImage: string | null, scale?: string) => void;
  onSubmitError?: () => void;
  onPendingStart?: (historyId: string) => void;
}

export const FaceEditInputPanel = forwardRef<FaceEditInputPanelHandle, FaceEditInputPanelProps>(function FaceEditInputPanel({ sampleId, isGenerating: isGeneratingExternal, onSubmit, onSubmitError, onPendingStart }, ref) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dict = useDictionary();
  const locale = useLocale();
  const { requireAuth, loginModal } = useRequireAuth();
  const activeSample = FACE_EDIT_SAMPLES.find((s) => s.id === sampleId);

  const GENDER_OPTIONS = [
    { value: "female", label: dict.tools.retouching.genders.female },
    { value: "male", label: dict.tools.retouching.genders.male },
  ];

  const [gender, setGender] = useState<"female" | "male">("female");
  const [strength, setStrength] = useState(1);
  const [scale, setScale] = useState<string>("auto");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imgMaxH, setImgMaxH] = useState<number | undefined>(undefined);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSampleIdRef = useRef<string | null | undefined>(null);

  /* 이미지 영역 max-height = width (1:1 제한) */
  useEffect(() => {
    const el = imgContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setImgMaxH(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 쿨다운 타이머 — cachedCredits에서 남은 시간 계산 */
  useEffect(() => {
    const cachedCredits = queryClient.getQueryData<UserCreditInfo>(queryKeys.credits.balance);
    const cooldownSeconds = cachedCredits?.plan.cooldownSeconds ?? 0;
    const lastGenAt = cachedCredits?.lastGenerationAt ?? null;

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
  }, [queryClient]);

  /* 샘플 선택 시 반영 */
  useEffect(() => {
    if (sampleId === prevSampleIdRef.current) return;
    prevSampleIdRef.current = sampleId;

    if (activeSample) {
      setUploadedImage(activeSample.before);
      setUploadedFile(null);
      setFileName(dict.tools.faceEdit.sampleImage);
      setGender(activeSample.settings.gender);
      setStrength(activeSample.settings.strength);
      setScale(String(activeSample.settings.scale));

      if (activeSample.mask) {
        (async () => {
          try {
            const res = await fetch(activeSample.mask!);
            const blob = await res.blob();
            // 프리뷰용 dataUrl
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setMaskDataUrl(dataUrl);
            // API용 흑백 변환 (흰=변경, 검정=보존) — before 이미지 크기에 맞춤
            const maskBitmap = await createImageBitmap(blob);
            const beforeRes = await fetch(activeSample.before);
            const beforeBitmap = await createImageBitmap(await beforeRes.blob());
            const tw = beforeBitmap.width;
            const th = beforeBitmap.height;
            beforeBitmap.close();
            const canvas = document.createElement("canvas");
            canvas.width = tw;
            canvas.height = th;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(maskBitmap, 0, 0, tw, th);
            maskBitmap.close();
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imageData.data;
            for (let i = 0; i < d.length; i += 4) {
              if (d[i + 3] > 20) {
                d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 255;
              } else {
                d[i] = d[i + 1] = d[i + 2] = 0;
                d[i + 3] = 255;
              }
            }
            ctx.putImageData(imageData, 0, 0);
            const apiBlob = await new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b!), "image/png")
            );
            setMaskBlob(apiBlob);
          } catch {
            setMaskDataUrl(null);
            setMaskBlob(null);
          }
        })();
      } else {
        setMaskDataUrl(null);
        setMaskBlob(null);
      }
    }
  }, [sampleId, activeSample]);

  const hasImage = !!uploadedImage;
  const hasMask = !!maskDataUrl;

  useImperativeHandle(ref, () => ({
    loadSample: async (id: string) => {
      const sample = FACE_EDIT_SAMPLES.find((s) => s.id === id);
      if (sample) {
        setUploadedImage(sample.before);
        setUploadedFile(null);
        setFileName(dict.tools.faceEdit.sampleImage);
        setGender(sample.settings.gender);
        setStrength(sample.settings.strength);
        setScale(String(sample.settings.scale));

        if (sample.mask) {
          try {
            const res = await fetch(sample.mask);
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setMaskDataUrl(dataUrl);
            setMaskBlob(blob);
          } catch {
            setMaskDataUrl(null);
            setMaskBlob(null);
          }
        } else {
          setMaskDataUrl(null);
          setMaskBlob(null);
        }
      }
    },
    addImageFromUrl: async (url: string) => {
      setIsImageLoading(true);
      setMaskDataUrl(null);
      setMaskBlob(null);
      setUploadedImage(null);
      setUploadedFile(null);
      try {
        const compressed = await compressImageForInput(url);
        setUploadedFile(compressed);
        setUploadedImage(URL.createObjectURL(compressed));
        setFileName(dict.tools.faceEdit.resultImageLabel);
      } catch {
        setUploadedImage(url);
      } finally {
        setIsImageLoading(false);
      }
    },
    loadFavorite: (fav) => {
      const meta = fav.metadata ?? {};
      if (meta.gender === "female" || meta.gender === "male") setGender(meta.gender);
      if (typeof meta.strength === "number") setStrength(meta.strength);
      if (typeof fav.scale === "number" && fav.scale >= 1) setScale(String(fav.scale));
      if (typeof meta.scale === "string") setScale(meta.scale);
      if (fav.reference_image_urls?.length > 0) {
        setUploadedImage(fav.reference_image_urls[0]);
        setUploadedFile(null);
        setFileName(dict.tools.faceEdit.favoriteImageLabel);
      }
      setMaskDataUrl(null);
      setMaskBlob(null);
      toast(dict.tools.faceEdit.favoriteLoaded, "success");
    },
    getCurrentSettings: () => ({
      gender,
      strength,
      scale,
      image: uploadedFile ?? uploadedImage,
      maskBlob,
    }),
  }), [gender, strength, scale, uploadedFile, uploadedImage, maskBlob, toast, dict]);

  const [isImageLoading, setIsImageLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsImageLoading(true);
    setMaskDataUrl(null);
    setMaskBlob(null);
    try {
      const compressed = await compressImageForInput(file);
      setUploadedFile(compressed);
      setUploadedImage(URL.createObjectURL(compressed));
      setFileName(file.name);
    } catch {
      // 압축 실패 시 원본 사용
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setUploadedFile(file);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsImageLoading(false);
    }
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
      if (file && ACCEPTED_TYPES.includes(file.type)) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setFileName(null);
    setMaskDataUrl(null);
    setMaskBlob(null);
    prevSampleIdRef.current = null;
  }, []);

  const handleMaskSave = useCallback((dataUrl: string | null, blob: Blob | null) => {
    setMaskDataUrl(dataUrl);
    setMaskBlob(blob);
  }, []);


  /* Cmd+Enter 단축키 */
  const handleGenerate = useCallback(async () => {
    if (!hasImage) {
      toast(dict.common.errors.uploadRequired, "warning");
      return;
    }
    if (!hasMask) {
      toast(dict.tools.faceEdit.selectArea, "warning");
      return;
    }
    if (isGenerating) return;
    if (isImageLoading) {
      toast(dict.common.errors.imageProcessing, "warning");
      return;
    }

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

    if (cachedCredits && cachedCredits.balance.total < CREDIT_COST) {
      toast(dict.common.errors.insufficientCredits, "error", 5000, {
        label: dict.common.errors.viewPlans,
        onClick: () => { window.location.href = `/${locale}/pricing`; },
      });
      return;
    }

    setIsGenerating(true);

    // 쿨다운 타이머 즉시 시작 (낙관적 업데이트)
    if (cachedCredits && cachedCredits.plan.cooldownSeconds > 0) {
      const updated = { ...cachedCredits, lastGenerationAt: new Date().toISOString() };
      queryClient.setQueryData(queryKeys.credits.balance, updated);
      setCooldownLeft(cachedCredits.plan.cooldownSeconds);
    }

    const tempId = crypto.randomUUID();
    prependHistoryItem(queryClient, "face-edit", {
      id: tempId,
      model_id: "flux-fill-pro",
      prompt: "",
      credits_used: CREDIT_COST,
      metadata: { gender, strength, scale },
      status: "pending",
      input_urls: uploadedImage ? [uploadedImage] : [],
    });
    onSubmit?.(uploadedImage, scale);
    window.dispatchEvent(
      new CustomEvent("credits-updated", { detail: { delta: -CREDIT_COST } })
    );

    try {
      const fd = new FormData();
      fd.append("gender", gender);
      fd.append("strength", String(strength));
      fd.append("scale", String(scale));

      if (uploadedFile) {
        fd.append("image", uploadedFile);
      } else if (uploadedImage?.startsWith("http")) {
        fd.append("image", uploadedImage);
      } else if (uploadedImage?.startsWith("/")) {
        const r = await fetch(uploadedImage);
        const blob = await r.blob();
        const ext = blob.type.split("/")[1] || "png";
        fd.append("image", new File([blob], `input.${ext}`, { type: blob.type }));
      } else if (uploadedImage?.startsWith("data:")) {
        const r = await fetch(uploadedImage);
        const blob = await r.blob();
        fd.append("image", new File([blob], "input.png", { type: blob.type }));
      }

      if (maskBlob) {
        fd.append("mask", new File([maskBlob], "mask.png", { type: "image/png" }));
      }

      const res = await fetch("/api/face-edit/generate", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(getApiErrorMessage(data.error, dict));
      }

      replaceHistoryId(queryClient, "face-edit", tempId, data.data.historyId);
      onPendingStart?.(data.data.historyId);

      if (data.data.balanceAfter != null) {
        window.dispatchEvent(
          new CustomEvent("credits-updated", { detail: { total: data.data.balanceAfter } })
        );
      }
    } catch (err) {
      removeHistoryItem(queryClient, "face-edit", tempId);
      onSubmitError?.();
      // 실패 시 타이머 초기화
      setCooldownLeft(0);
      window.dispatchEvent(
        new CustomEvent("credits-updated", { detail: { delta: CREDIT_COST } })
      );
      toast(
        err instanceof Error ? err.message : dict.common.errors.generationFailed,
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [gender, strength, scale, hasImage, hasMask, isGenerating, isGeneratingExternal, uploadedImage, uploadedFile, maskBlob, onSubmit, onSubmitError, onPendingStart, toast, queryClient]);

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
    <>
      <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[49px] shrink-0 border-b border-border">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
            <Paintbrush className="w-4 h-4 text-muted-foreground" />
            {dict.tools.faceEdit.header}
          </h2>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col gap-4 px-4 py-4 min-h-0 overflow-y-auto">
          {/* Image Upload */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              ref={imgContainerRef}
              onClick={() => !hasImage && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={imgMaxH ? { maxHeight: imgMaxH } : undefined}
              className={cn(
                "relative flex-1 min-h-[200px] rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all",
                hasImage
                  ? "border-border bg-muted/20"
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
                  <div className="relative max-h-full max-w-full p-2">
                    <img
                      src={uploadedImage!}
                      alt={dict.tools.faceEdit.uploadedAlt}
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
                          alt={dict.tools.faceEdit.maskAlt}
                          className="max-h-full max-w-full object-contain rounded-lg opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  {/* 가이드 오버레이 — 마스크 없을 때 */}
                  {!hasMask && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-xl">
                      <p className="text-sm text-white/80 font-semibold mb-3">
                        {dict.tools.faceEdit.selectAreaOverlay}
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
                        {dict.tools.faceEdit.selectAreaButton}
                      </button>
                    </div>
                  )}
                  {/* 상단 컨트롤 */}
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
                      {dict.tools.faceEdit.replaceButton}
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
                      {dict.tools.faceEdit.deleteButton}
                    </button>
                  </div>
                  {/* 마스크 수정 버튼 — 마스크 있을 때만 */}
                  {hasMask && (
                    <div className="absolute bottom-2 right-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaskEditorOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-sm border transition-colors cursor-pointer text-[#A5B4FC] bg-black/60 border-white/[0.1] hover:bg-black/80"
                      >
                        <Paintbrush className="w-3 h-3" />
                        {dict.tools.faceEdit.editMaskButton}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground/70 dark:text-muted-foreground/50" />
                  <p className="text-[15px] font-extrabold text-card-foreground">
                    {dict.tools.faceEdit.uploadPrompt}
                  </p>
                  <p className="text-[15px] text-muted-foreground">
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
                    {dict.tools.faceEdit.guideButton}
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              aria-label={dict.tools.faceEdit.uploadedAlt}
            />
          </div>

          <hr className="border-border" />

          {/* 추가 설정 */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{dict.tools.faceEdit.extraSettings}</h3>
              <button
                type="button"
                onClick={() => {
                  setGender("female");
                  setStrength(1);
                  setScale("auto");
                }}
                className="p-1 text-muted-foreground/70 dark:text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                title={dict.tools.faceEdit.resetSettings}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 성별 선택 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">{dict.tools.faceEdit.genderLabel}</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value as "female" | "male")}
                    className={cn(
                      "flex items-center justify-center py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border",
                      gender === opt.value
                        ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-card-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 변화 강도 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">{dict.tools.faceEdit.strengthLabel}</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                aria-label={dict.tools.faceEdit.strengthLabel}
                className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)}
              />
              <span className="text-sm font-bold text-[#A5B4FC] shrink-0 w-8 text-right">{strength.toFixed(1)}</span>
            </div>

            {/* 해상도 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">{dict.tools.faceEdit.upscaleLabel}</span>
              <Dropdown
                options={SCALE_OPTIONS}
                value={String(scale)}
                onChange={(v) => setScale(v)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-4 py-2.5 border-t border-border">
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => cooldownLeft > 0 ? setShowCooldownModal(true) : requireAuth(handleGenerate)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-[15px] font-extrabold rounded-xl transition-all duration-300 cursor-pointer tracking-wide",
                isGenerating
                  ? "text-white/50 bg-gradient-to-r from-primary to-secondary opacity-40 cursor-not-allowed"
                  : cooldownLeft > 0
                    ? "text-white/50 bg-gradient-to-r from-primary to-secondary opacity-40 cursor-not-allowed"
                    : !(hasImage && hasMask)
                      ? "text-white bg-gradient-to-r from-primary to-secondary opacity-60"
                      : "text-white bg-gradient-to-r from-primary to-secondary shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:brightness-110 hover:scale-[1.03]"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {dict.tools.faceEdit.generatingButton}
                </>
              ) : cooldownLeft > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {`${Math.floor(cooldownLeft / 60)}:${String(cooldownLeft % 60).padStart(2, "0")}`}
                </>
              ) : (
                <>
                  {dict.tools.faceEdit.generateButton}
                  <span className="ml-1.5 inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                    <Zap className="w-2.5 h-2.5" />
                    {CREDIT_COST}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mask Editor Modal */}
      {uploadedImage && (
        <FaceEditMaskEditor
          isOpen={maskEditorOpen}
          onClose={() => setMaskEditorOpen(false)}
          onSave={handleMaskSave}
          imageSrc={uploadedImage}
          initialMaskDataUrl={maskDataUrl}
        />
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.55)] p-5 space-y-3 max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-card-foreground">{dict.tools.faceEdit.guideTitle}</p>
            <ul className="space-y-1.5 text-[12px] text-card-foreground/80 leading-relaxed">
              {dict.tools.faceEdit.guideItems.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-primary hover:bg-[#818CF8] transition-colors cursor-pointer"
            >
              {dict.tools.faceEdit.guideConfirm}
            </button>
          </div>
        </div>
      )}
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
        cancelLabel={dict.common.cooldownModal.waitButton.replace("{remaining}", `${Math.floor(cooldownLeft / 60)}:${String(cooldownLeft % 60).padStart(2, "0")}`)}
      />
      {loginModal}
</>
  );
});
