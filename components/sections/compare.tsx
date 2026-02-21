"use client";

import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { useSlider } from "@/hooks/use-slider";
import { cn } from "@/lib/utils";
import { useState } from "react";

const samples = [
  { id: "korean-female", label: "한국인 여성 (기본)" },
  { id: "korean-makeup", label: "한국인 여성 (메이크업)" },
  { id: "western-male", label: "서양인 남성" },
  { id: "western-female", label: "서양인 여성 (메이크업)" },
];

const sampleColors: Record<string, { before: string; after: string }> = {
  "korean-female": {
    before: "from-amber-200 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40",
    after: "from-rose-200 to-pink-200 dark:from-rose-900/40 dark:to-pink-900/40",
  },
  "korean-makeup": {
    before: "from-stone-200 to-zinc-300 dark:from-stone-800/40 dark:to-zinc-700/40",
    after: "from-fuchsia-200 to-pink-200 dark:from-fuchsia-900/40 dark:to-pink-900/40",
  },
  "western-male": {
    before: "from-slate-200 to-gray-300 dark:from-slate-800/40 dark:to-gray-700/40",
    after: "from-sky-200 to-blue-200 dark:from-sky-900/40 dark:to-blue-900/40",
  },
  "western-female": {
    before: "from-neutral-200 to-stone-300 dark:from-neutral-800/40 dark:to-stone-700/40",
    after: "from-violet-200 to-purple-200 dark:from-violet-900/40 dark:to-purple-900/40",
  },
};

export function Compare() {
  const [selected, setSelected] = useState("korean-female");
  const { sliderPos, setSliderPos, sliderProps } = useSlider();

  const colors = sampleColors[selected];

  return (
    <SectionWrapper className="bg-zinc-100 dark:bg-zinc-950/80">
      <motion.div variants={fadeInUp} className="text-center mb-10">
        <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
          차이를 직접 확인해보세요
        </h2>
        <p className="text-lg text-muted-foreground">
          AI 업스케일 전/후를 비교해보세요.
        </p>
      </motion.div>

      {/* Tab buttons */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap justify-center gap-2 mb-10"
      >
        {samples.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelected(s.id); setSliderPos(50); }}
            className={cn(
              "px-5 py-2.5 text-sm md:text-base font-bold rounded-xl border transition-all cursor-pointer",
              selected === s.id
                ? "bg-foreground text-background border-foreground shadow-lg"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {s.label}
          </button>
        ))}
      </motion.div>

      {/* Before/After slider comparison */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <div
            {...sliderProps}
            className="relative aspect-[2/3] rounded-2xl overflow-hidden cursor-col-resize select-none border border-border"
          >
            {/* After (full background) */}
            <div className={cn("absolute inset-0 bg-gradient-to-br", colors.after)} />

            {/* Before (clipped) */}
            <div
              className={cn("absolute inset-0 bg-gradient-to-br", colors.before)}
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            />

            {/* Slider line — white like original */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-transparent border-2 border-white shadow-lg flex items-center justify-center">
                <div className="flex gap-1">
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path d="M5 1L1 6L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path d="M1 1L5 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Labels — center of each half */}
            <div
              className="absolute top-1/2 -translate-y-1/2 px-4 py-2 rounded bg-black/50 text-white text-sm font-medium z-20"
              style={{ left: `${sliderPos / 4}%`, transform: `translate(-50%, -50%)`, top: "50%" }}
            >
              Before
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 px-4 py-2 rounded bg-black/50 text-white text-sm font-medium z-20"
              style={{ right: `${(100 - sliderPos) / 4}%`, transform: `translate(50%, -50%)`, top: "50%" }}
            >
              After
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Labels at far left / far right */}
      <motion.div
        variants={fadeInUp}
        className="flex justify-between max-w-xl mx-auto mt-4 px-2"
      >
        <span className="text-base font-bold text-muted-foreground">원본 이미지</span>
        <span className="text-base font-bold text-muted-foreground">AI 업스케일</span>
      </motion.div>
    </SectionWrapper>
  );
}
