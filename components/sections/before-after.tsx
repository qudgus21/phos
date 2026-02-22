"use client";

import { motion, useInView } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { useSlider } from "@/hooks/use-slider";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BeforeAfter() {
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
  }, [isInView, hasInteracted, setSliderPos]);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  return (
    <SectionWrapper className="py-10 md:py-14">
      <div ref={sweepRef}>
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-h2 font-black text-foreground mb-4 font-display">
            같은 사진, 다른 퀄리티
          </h2>
          <p className="text-lg md:text-2xl text-muted-foreground">
            깨진 픽셀, 뭉개진 디테일까지{" "}
            <span className="font-black text-primary">AI</span>가 복원합니다.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp}>
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
            className="relative max-w-2xl mx-auto aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none border border-border shadow-card-light dark:shadow-card-dark"
            style={{ touchAction: "none" }}
          >
            {/* 업스케일 배율 배지 */}
            <div className="absolute top-4 right-4 z-30">
              <Badge
                variant="primary"
                className="backdrop-blur-md bg-black/50 border border-white/20 text-white"
              >
                4x 업스케일
              </Badge>
            </div>

            {/* After */}
            <Image
              src="/images/before-after/after.png"
              alt="보정 후"
              fill
              className="object-cover"
              draggable={false}
              sizes="(max-width: 672px) 100vw, 672px"
              priority
            />

            {/* Before */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image
                src="/images/before-after/before.png"
                alt="보정 전"
                fill
                className="object-cover blur-[1px]"
                draggable={false}
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>

            {/* 디바이더 */}
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-primary z-10"
              style={{ left: `${sliderPos}%` }}
            >
              {/* 핸들 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/20 flex items-center justify-center">
                <div className="flex gap-1.5 text-white drop-shadow-md">
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path
                      d="M5 1L1 6L5 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path
                      d="M1 1L5 6L1 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 라벨 */}
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

        {/* 마이크로 CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-6 space-y-3">
          <p className="text-muted-foreground text-base md:text-lg font-semibold">
            보정 전후 비교
          </p>
          <Link
            href="#pricing"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-sm transition-colors group"
          >
            무료로 보정해 보기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
