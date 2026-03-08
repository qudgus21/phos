"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, PenLine, X, GripVertical, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SAMPLES } from "@/lib/constants/samples";
import { IMAGE_EDIT_MODELS } from "@/lib/services/ai/models";

interface UploadedImage {
  file: File | null;
  previewUrl: string;
}

const MODEL_OPTIONS = [
  { value: "nano-banana", label: "Nano Banana" },
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
  { value: "seedream-5.0", label: "Seedream 5.0" },
  { value: "seedream-4.5", label: "Seedream 4.5" },
  { value: "flux-pro-1.1", label: "Flux Pro 1.1" },
  { value: "grok", label: "Grok Imagine" },
];

const ALL_SIZE_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

const RATIO_OPTIONS = [
  { value: "AUTO", label: "AUTO" },
  { value: "21:9", label: "21:9" },
  { value: "16:9", label: "16:9" },
  { value: "3:2", label: "3:2" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "2:3", label: "2:3" },
  { value: "9:16", label: "9:16" },
];

const DEFAULT_maxImages = 14;

/* ── 디자인 시스템 기반 공통 스타일 ── */
const fieldBase =
  "rounded-lg border border-white/[0.15] bg-white/[0.12] text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors";
const sliderThumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export interface ImageEditInputPanelHandle {
  addImageFromUrl: (url: string) => Promise<void>;
}

interface ImageEditInputPanelProps {
  onGenerate?: (outputUrls: string[], prompt: string) => void;
  onGenerateStart?: (imageCount: number, firstImageUrl: string | null) => void;
  onGenerateEnd?: () => void;
}

export const ImageEditInputPanel = forwardRef<ImageEditInputPanelHandle, ImageEditInputPanelProps>(function ImageEditInputPanel({ onGenerate, onGenerateStart, onGenerateEnd }, ref) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const sampleId = searchParams.get("sample_id");
  const activeSample = SAMPLES.find((s) => s.id === sampleId);

  const [model, setModel] = useState("nano-banana");
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("1K");

  const currentModelDef = IMAGE_EDIT_MODELS.find((m) => m.id === model);
  const maxImages = currentModelDef?.maxImages ?? DEFAULT_maxImages;
  // 모든 모델에서 1K/2K/4K 선택 가능 (미지원 크기는 업스케일러가 처리)
  const sizeOptions = ALL_SIZE_OPTIONS;
  // 모델 변경 시 초과 이미지 제거
  useEffect(() => {
    if (images.length > maxImages) {
      setImages((prev) => prev.slice(0, maxImages));
    }
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const [ratio, setRatio] = useState("AUTO");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [scale, setScale] = useState(0);
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
  const prevSampleIdRef = useRef<string | null>(null);

  // 샘플 변경 시 images 상태에 샘플 input 주입
  useEffect(() => {
    if (sampleId === prevSampleIdRef.current) return;
    prevSampleIdRef.current = sampleId;

    // 기존 blob URL 정리
    images.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
    });

    if (activeSample && activeSample.inputs.length > 0) {
      setImages(
        activeSample.inputs.map((src) => ({ file: null, previewUrl: src }))
      );
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

  const scaleDisplay = `×${Math.pow(2, scale).toFixed(2)}`;
  const creditCost = imageSize === "4K" ? 150 : 75;

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
    [images.length]
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
  }), [images.length, addFiles]);

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
          <h3 className="text-base font-bold text-foreground">추가 설정</h3>

          <div className="space-y-3">
            {/* 전체 설정 (nano-banana 제외 모든 모델) */}
            {currentModelDef?.ui.customSize ? (
              <>
                {/* Image Size — 원래 한 줄 레이아웃 */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground">이미지 크기</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Dropdown options={sizeOptions} value={imageSize} onChange={setImageSize} className="w-[70px]" />
                    <Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="w-[80px]" />
                    <input type="number" min={1} max={4096} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={cn(fieldBase, "w-[72px] px-2 py-1.5 text-center")} />
                    <span className="text-sm text-white/50">×</span>
                    <input type="number" min={1} max={4096} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={cn(fieldBase, "w-[72px] px-2 py-1.5 text-center")} />
                    <button
                      type="button"
                      disabled={images.length === 0}
                      onClick={() => {
                        const first = images[0];
                        if (!first) return;
                        const img = new window.Image();
                        img.onload = () => {
                          const w = img.naturalWidth;
                          const h = img.naturalHeight;
                          if (w && h) {
                            const maxDim = imageSize === "4K" ? 4096 : imageSize === "2K" ? 2048 : 1024;
                            const s = Math.min(maxDim / Math.max(w, h), 1);
                            setWidth(Math.round(w * s));
                            setHeight(Math.round(h * s));
                            setRatio("AUTO");
                          }
                        };
                        img.src = first.previewUrl;
                      }}
                      className="p-1.5 text-sm rounded-lg border border-border bg-muted text-white/50 hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-muted disabled:hover:text-white/50 transition-all duration-200 cursor-pointer"
                      title="첫 번째 이미지 비율로 자동 설정"
                    >📐</button>
                  </div>
                </div>

                {/* Scale */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-card-foreground shrink-0 w-14">배율</span>
                  <input type="range" min={-2} max={2} step={0.05} value={scale} onChange={(e) => setScale(Number(e.target.value))} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
                  <span className="text-sm font-bold text-[#A5B4FC] shrink-0">{scaleDisplay}</span>
                </div>
              </>
            ) : (
              <>
                {/* Nano Banana 축소 설정 */}
                <div className="flex items-center gap-4">
                  {currentModelDef?.ui.imageSize && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-card-foreground">이미지 크기</label>
                      <Dropdown options={sizeOptions} value={imageSize} onChange={setImageSize} className="w-[70px]" openDirection="above" />
                    </div>
                  )}
                  {currentModelDef?.ui.ratio && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-card-foreground">비율</label>
                      <Dropdown options={RATIO_OPTIONS} value={ratio} onChange={setRatio} className="w-[100px]" openDirection="above" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Image Count (모든 모델 공통) */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">이미지 수</span>
              <input type="range" min={1} max={4} value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)} />
              <input type="number" min={1} max={4} value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className={cn(fieldBase, "w-12 px-2 py-1 text-center")} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions Footer ── */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">
            {imageSize === "4K" ? "4K: 150 크레딧/장" : "1K/2K: 75 크레딧/장"}
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
              onClick={async () => {
                if (!prompt.trim()) {
                  toast("프롬프트를 입력해주세요", "warning");
                  return;
                }
                setIsGenerating(true);
                onGenerateStart?.(imageCount, images[0]?.previewUrl ?? null);
                try {
                  // 모든 이미지를 base64 data URI 또는 외부 http URL로 변환
                  const toDataUri = async (blob: Blob): Promise<string> => {
                    const buf = await blob.arrayBuffer();
                    const base64 = btoa(
                      new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
                    );
                    return `data:${blob.type || "image/png"};base64,${base64}`;
                  };
                  const imageUrls = await Promise.all(
                    images.map(async (img) => {
                      const url = img.previewUrl;
                      // 외부 http URL → 그대로 (AI 프로바이더가 직접 접근 가능)
                      if (url.startsWith("http") && !url.includes(window.location.host)) return url;
                      // 상대경로(/images/...) → fetch 후 base64 변환
                      if (url.startsWith("/")) {
                        const res = await fetch(url);
                        return toDataUri(await res.blob());
                      }
                      // 로컬 파일 업로드 (blob: URL) → file에서 base64 변환
                      if (img.file) return toDataUri(img.file);
                      return null;
                    })
                  ).then((urls) => urls.filter((u): u is string => u !== null));
                  const res = await fetch("/api/image-edit/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      modelId: model,
                      prompt,
                      images: imageUrls.length > 0 ? imageUrls : undefined,
                      imageSize,
                      ratio,
                      width,
                      height,
                      scale,
                      imageCount,
                    }),
                  });
                  const data = await res.json();
                  if (!data.success) {
                    throw new Error(data.error?.message ?? "생성에 실패했습니다");
                  }
                  onGenerate?.(data.data.outputUrls, prompt);
                  // 크레딧 잔액 낙관적 업데이트
                  if (data.data.balanceAfter != null) {
                    window.dispatchEvent(
                      new CustomEvent("credits-updated", {
                        detail: { total: data.data.balanceAfter },
                      })
                    );
                  }
                } catch (err) {
                  toast(
                    err instanceof Error ? err.message : "생성에 실패했습니다",
                    "error"
                  );
                } finally {
                  setIsGenerating(false);
                  onGenerateEnd?.();
                }
              }}
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
          setImageSize("4K");
          setRatio("AUTO");
          setWidth(2048);
          setHeight(2048);
          setScale(0);
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
