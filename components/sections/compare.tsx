"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { useSlider } from "@/hooks/use-slider";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const samples = [
  { id: "asian-female", label: "동양인 여성" },
  { id: "asian-male", label: "동양인 남성" },
  { id: "western-female", label: "서양인 여성" },
  { id: "western-male", label: "서양인 남성" },
];

const sampleImages: Record<string, { before?: string; after?: string }> = {
  "asian-female": {
    before: "/images/compare/asian-before.png",
    after: "/images/compare/asian-after.png",
  },
};

const sampleColors: Record<string, { before: string; after: string }> = {
  "asian-female": {
    before: "",
    after: "",
  },
  "asian-male": {
    before: "from-stone-200 to-zinc-300 dark:from-stone-800/40 dark:to-zinc-700/40",
    after: "from-sky-200 to-blue-200 dark:from-sky-900/40 dark:to-blue-900/40",
  },
  "western-female": {
    before: "from-neutral-200 to-stone-300 dark:from-neutral-800/40 dark:to-stone-700/40",
    after: "from-fuchsia-200 to-pink-200 dark:from-fuchsia-900/40 dark:to-pink-900/40",
  },
  "western-male": {
    before: "from-slate-200 to-gray-300 dark:from-slate-800/40 dark:to-gray-700/40",
    after: "from-violet-200 to-purple-200 dark:from-violet-900/40 dark:to-purple-900/40",
  },
};

export function Compare() {
  const [selected, setSelected] = useState("asian-female");
  const { sliderPos, setSliderPos, sliderProps } = useSlider(70);
  const [hasInteracted, setHasInteracted] = useState(false);
  const sweepRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sweepRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView || hasInteracted) return;

    const keyframes = [
      { from: 70, to: 20, duration: 800 },
      { from: 20, to: 50, duration: 800 },
    ];
    let currentKeyframe = 0;
    let animationId: number;
    let startTime = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const { from, to, duration } = keyframes[currentKeyframe];
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      setSliderPos(from + (to - from) * eased);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        currentKeyframe++;
        if (currentKeyframe < keyframes.length) {
          startTime = 0;
          animationId = requestAnimationFrame(animate);
        }
      }
    };

    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 600);

    return () => {
      clearTimeout(timeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isInView, hasInteracted, setSliderPos, selected]);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const colors = sampleColors[selected];
  const images = sampleImages[selected];
  const hasImages = !!images;

  return (
    <SectionWrapper className="!py-10 md:!py-14 bg-zinc-100 dark:bg-zinc-950/80">
      <div ref={sweepRef}>
      <motion.div variants={fadeInUp} className="text-center mb-10">
        <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
          차이를 직접 확인해보세요
        </h2>
        <p className="text-lg text-muted-foreground">
          메이크업 보정부터 업스케일까지, AI 보정 전후를 비교해보세요.
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
            onClick={() => { setSelected(s.id); setSliderPos(50); setHasInteracted(false); }}
            className={cn(
              "px-5 py-2.5 text-sm md:text-base font-bold rounded-xl border transition-all cursor-pointer",
              selected === s.id
                ? "bg-foreground text-background border-foreground shadow-lg"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:text-foreground hover:border-foreground/30"
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
          className="max-w-2xl mx-auto"
        >
          <div
            {...sliderProps}
            onMouseDown={() => {
              handleInteraction();
              sliderProps.onMouseDown();
            }}
            onTouchStart={(e) => {
              handleInteraction();
              sliderProps.onTouchStart(e);
            }}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none border border-border shadow-card-light dark:shadow-card-dark"
            style={{ touchAction: "none" }}
          >
            {/* After (full background) */}
            {hasImages ? (
              <Image
                src={images.after!}
                alt="보정 후"
                fill
                className="object-cover"
                draggable={false}
                sizes="(max-width: 672px) 100vw, 672px"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", colors.after)} />
            )}

            {/* Before (clipped) */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              {hasImages ? (
                <Image
                  src={images.before!}
                  alt="보정 전"
                  fill
                  className="object-cover"
                  draggable={false}
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", colors.before)} />
              )}
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-primary z-10"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/20 flex items-center justify-center">
                <div className="flex gap-1.5 text-white drop-shadow-md">
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path d="M5 1L1 6L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path d="M1 1L5 6L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-bold transition-opacity duration-200"
              style={{ left: "3%", opacity: sliderPos > 15 ? 1 : 0 }}
            >
              Before
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-bold transition-opacity duration-200"
              style={{ right: "3%", opacity: sliderPos < 85 ? 1 : 0 }}
            >
              After
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      </div>
    </SectionWrapper>
  );
}
