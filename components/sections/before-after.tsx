"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { useSlider } from "@/hooks/use-slider";

export function BeforeAfter() {
  const { sliderPos, sliderProps } = useSlider();

  return (
    <SectionWrapper>
      <motion.div variants={fadeInUp} className="text-center mb-12">
        <h2 className="text-3xl md:text-h2 font-black text-foreground mb-4 font-display">
          모든 이미지를 다 쓸 수 있는 이미지로
        </h2>
        <p className="text-lg md:text-2xl text-muted-foreground">
          깨진 픽셀까지 <span className="font-black text-primary">AI 보정</span>으로
          복원합니다.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div
          {...sliderProps}
          className="relative max-w-2xl mx-auto aspect-[3/4] rounded-2xl overflow-hidden cursor-col-resize select-none border border-border shadow-card-light dark:shadow-card-dark"
        >
          {/* After (full background) */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 dark:from-pink-900/40 dark:via-rose-900/30 dark:to-pink-800/40" />

          {/* Before (clipped) — more muted/grayish to show "before" quality */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-stone-300 via-stone-200 to-stone-400 dark:from-stone-700 dark:via-stone-600 dark:to-stone-800"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            {/* Noise-like dots to simulate lower quality */}
            <div className="absolute inset-0 opacity-20 dark:opacity-30" style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "8px 8px",
            }} />
          </div>

          {/* Slider line — blue like original */}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-primary z-10"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-transparent border-[3px] border-primary shadow-lg flex items-center justify-center text-primary">
              <div className="flex gap-1">
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                  <path d="M5 1L1 6L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                  <path d="M1 1L5 6L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Labels — positioned at left/right center vertically */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 px-4 py-2 bg-black/50 text-white text-sm"
            style={{ left: "5%" }}
          >
            Before
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 px-4 py-2 bg-black/50 text-white text-sm"
            style={{ right: "5%" }}
          >
            After
          </div>
        </div>
      </motion.div>

      <motion.p
        variants={fadeInUp}
        className="text-center text-muted-foreground mt-6 text-base md:text-lg font-semibold"
      >
        메이크업 예시 결과물
      </motion.p>
    </SectionWrapper>
  );
}
