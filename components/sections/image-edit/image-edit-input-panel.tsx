"use client";

import { useState } from "react";
import { Plus, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";

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
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer";

export function ImageEditInputPanel() {
  const [model, setModel] = useState("nano-banana");
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("2K");
  const [ratio, setRatio] = useState("AUTO");
  const [width, setWidth] = useState(2048);
  const [height, setHeight] = useState(2048);
  const [scale, setScale] = useState(0);
  const [imageCount, setImageCount] = useState(1);

  const scaleDisplay = `×${Math.pow(2, scale).toFixed(2)}`;
  const creditCost = imageSize === "4K" ? 150 : 75;

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
          <p className="text-[13px] text-white/50">💡 팁: 장소, 스타일, 조명을 구체적으로 입력하세요</p>
        </div>

        {/* Reference Images */}
        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-sm text-card-foreground">참조 이미지 (0/{MAX_IMAGES})</span>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] transition-all duration-200 cursor-pointer"
            >
              이미지 추가
            </button>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[60px]">
            <div className="flex gap-2 w-max h-full">
              {Array.from({ length: MAX_IMAGES }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex flex-col items-center justify-center gap-1 aspect-square h-full rounded-lg border border-dashed border-white/[0.18] bg-white/[0.16] hover:border-[#818CF8] hover:bg-[#A5B4FC]/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#A5B4FC]" />
                  <span className="text-[10px] text-white/40">Add image</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/50 shrink-0">힌트: 드래그 앤 드롭 또는 이미지 추가 버튼 클릭</p>
        </div>

        <hr className="border-border" />

        {/* Additional Settings */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">Additional Settings</h3>

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
                  <button type="button" disabled className="p-1.5 text-sm rounded-lg border border-border bg-muted text-white/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" title="첫 번째 이미지 비율로 자동 설정">📐</button>
                </div>
              </div>

              {/* Scale */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 shrink-0 w-14">배율</span>
                <input type="range" min={-2} max={2} step={0.05} value={scale} onChange={(e) => setScale(Number(e.target.value))} className={cn("flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/[0.16]", sliderThumb)} />
                <span className="text-sm text-white/50 shrink-0">{scaleDisplay}</span>
              </div>

              {/* Image Count */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 shrink-0 w-14">이미지 수</span>
                <input type="range" min={1} max={4} value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))} className={cn("flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/[0.16]", sliderThumb)} />
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
            <button type="button" className="px-3.5 py-1.5 text-sm font-semibold text-foreground rounded-lg border border-border bg-muted hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 hover:text-[#A5B4FC] transition-all duration-200 cursor-pointer">
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
