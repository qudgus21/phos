"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { useSlider } from "@/hooks/use-slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getBlur } from "@/lib/constants/blur-placeholders";
import type { Dictionary } from "@/lib/i18n";

interface SkinRetouchProps {
  dict: Dictionary;
  locale: string;
}

const samples = [
  { id: "sample6" },
  { id: "sample3" },
  { id: "sample4" },
  { id: "sample1" },
  { id: "sample2" },
  { id: "sample5" },
];

function getSampleImages(id: string) {
  return {
    before: `/images/retouching/${id}/before.webp`,
    after: `/images/retouching/${id}/after.webp`,
    thumbnail: `/images/retouching/${id}/${id === "sample1" || id === "sample2" || id === "sample3" ? "thumbnail" : "thumb"}.webp`,
  };
}

export function SkinRetouch({ dict, locale }: SkinRetouchProps) {
  const [selected, setSelected] = useState("sample6");
  const { sliderPos, setSliderPos, sliderProps } = useSlider(70);
  const [hasInteracted, setHasInteracted] = useState(false);
  const sweepRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sweepRef, { once: true, margin: "-100px" });
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

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
  }, [isInView, hasInteracted, setSliderPos]);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleZoomMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(15, Math.min(85, x)), y: Math.max(15, Math.min(85, y)) });
  }, []);

  const images = getSampleImages(selected);

  return (
    <SectionWrapper className="pt-16 md:pt-20 bg-zinc-100 dark:bg-zinc-950/80">
      <div ref={sweepRef}>
      <motion.div variants={fadeInUp} className="text-center mb-6">
        <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
          {dict.features.skinRetouch.title} <span className="gradient-text">{dict.features.skinRetouch.titleAccent}</span>
        </h2>
        <p className="text-lg text-muted-foreground">
          {dict.features.skinRetouch.subtitle}
        </p>
      </motion.div>

      {/* Tab buttons with thumbnails */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap justify-center gap-2 mb-6"
      >
        {samples.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelected(s.id); setSliderPos(50); setHasInteracted(false); }}
            className={cn(
              "relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer",
              selected === s.id
                ? "border-primary shadow-[0_0_8px_rgba(99,102,241,0.4)] scale-110"
                : "border-border opacity-60 hover:opacity-100"
            )}
          >
            <Image
              src={getSampleImages(s.id).thumbnail}
              alt={dict.features.skinRetouch.sampleAlt}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </button>
        ))}
      </motion.div>

      {/* Slider + Zoom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3"
        >
          {/* Slider */}
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
            onMouseMove={(e) => {
              sliderProps.onMouseMove(e);
              handleZoomMove(e);
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              sliderProps.onMouseLeave();
              setIsHovering(false);
            }}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none border border-border shadow-card-light dark:shadow-card-dark"
            style={{ touchAction: "none" }}
          >
            {/* After */}
            <Image
              src={images.after}
              alt={dict.features.skinRetouch.after}
              fill
              className="object-cover"
              draggable={false}
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized
              {...(getBlur(images.after) ? { placeholder: "blur" as const, blurDataURL: getBlur(images.after) } : {})}
            />

            {/* Before (clipped) */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image
                src={images.before}
                alt={dict.features.skinRetouch.before}
                fill
                className="object-cover"
                draggable={false}
                sizes="(max-width: 768px) 100vw, 560px"
                unoptimized
                {...(getBlur(images.before) ? { placeholder: "blur" as const, blurDataURL: getBlur(images.before) } : {})}
              />
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-primary z-10"
              style={{ left: `${sliderPos}%` }}
            >
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
              {dict.features.skinRetouch.before}
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-bold transition-opacity duration-200"
              style={{ right: "3%", opacity: sliderPos < 85 ? 1 : 0 }}
            >
              {dict.features.skinRetouch.after}
            </div>
          </div>

          {/* Zoom panels — desktop only, always visible */}
          <div className="hidden md:flex flex-col gap-3">
            <div className={cn(
              "relative flex-1 rounded-xl overflow-hidden border border-border transition-all duration-300",
              isHovering ? "border-primary/30" : ""
            )}>
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="outline" className="text-[10px] bg-black/50 text-white border-white/20 backdrop-blur-sm">
                  {dict.features.skinRetouch.before}
                </Badge>
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${images.before})`,
                  backgroundSize: "400%",
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              />
            </div>
            <div className={cn(
              "relative flex-1 rounded-xl overflow-hidden border border-border transition-all duration-300",
              isHovering ? "border-primary/30" : ""
            )}>
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="outline" className="text-[10px] bg-black/50 text-white border-white/20 backdrop-blur-sm">
                  {dict.features.skinRetouch.after}
                </Badge>
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${images.after})`,
                  backgroundSize: "400%",
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              />
            </div>
            <p className={cn(
              "text-xs text-center transition-colors duration-300",
              isHovering ? "text-primary" : "text-muted-foreground"
            )}>
              {isHovering ? dict.features.skinRetouch.hoverHint : dict.features.skinRetouch.sliderHint}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Micro CTA */}
      <motion.div variants={fadeInUp} className="text-center mt-6">
        <Link
          href={`/${locale}/retouching`}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
        >
          {dict.features.skinRetouch.cta}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      </div>
    </SectionWrapper>
  );
}
