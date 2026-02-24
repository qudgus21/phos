"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, PenLine, X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { SAMPLES } from "@/lib/constants/samples";

interface UploadedImage {
  file: File | null;
  previewUrl: string;
}

const MODEL_OPTIONS = [
  { value: "seedream-4.5", label: "Seedream 4.5" },
  { value: "grok", label: "Grok (xAI) - 1K" },
  { value: "nano-banana", label: "🍌 Nano Banana (Pro)" },
];

const SIZE_OPTIONS = [
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

const MAX_IMAGES = 14;

/* ── 디자인 시스템 기반 공통 스타일 ── */
const fieldBase =
  "rounded-lg border border-white/[0.15] bg-white/[0.12] text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors";
const sliderThumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ImageEditInputPanel() {
  const searchParams = useSearchParams();
  const sampleId = searchParams.get("sample_id");
  const activeSample = SAMPLES.find((s) => s.id === sampleId);

  const [model, setModel] = useState("nano-banana");
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("2K");
  const [ratio, setRatio] = useState("AUTO");
  const [width, setWidth] = useState(2048);
  const [height, setHeight] = useState(2048);
  const [scale, setScale] = useState(0);
  const [imageCount, setImageCount] = useState(1);
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
      const remaining = MAX_IMAGES - images.length;
      const toAdd = validFiles.slice(0, remaining).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      if (toAdd.length > 0) setImages((prev) => [...prev, ...toAdd]);
    },
    [images.length]
  );

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
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 min-h-0">
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
            <span className="text-sm text-card-foreground">참조 이미지 ({images.length}/{MAX_IMAGES})</span>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={images.length >= MAX_IMAGES}
              className="px-3 py-1.5 text-xs font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              이미지 추가
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-x-auto min-h-[60px] rounded-lg transition-colors",
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
              {images.length < MAX_IMAGES &&
                Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
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

          <p className="text-xs text-white/50 shrink-0">드래그 앤 드롭 또는 이미지 추가 버튼 클릭</p>
        </div>

        <hr className="border-border" />

        {/* Additional Settings */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">추가 설정</h3>

          <div className="space-y-3">
            {/* Image Size */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-card-foreground">이미지 크기</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Dropdown options={SIZE_OPTIONS} value={imageSize} onChange={setImageSize} className="w-[70px]" />
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
                          const scale = Math.min(maxDim / Math.max(w, h), 1);
                          setWidth(Math.round(w * scale));
                          setHeight(Math.round(h * scale));
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

              {/* Image Count */}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
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
              className="px-3.5 py-1.5 text-sm font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] transition-all duration-200 cursor-pointer"
            >
              리셋
            </button>
            <button type="button" disabled className="px-3.5 py-1.5 text-sm font-semibold text-primary-foreground rounded-lg bg-primary hover:bg-[#818CF8] hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
              실행 / {creditCost * imageCount} 크레딧
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
