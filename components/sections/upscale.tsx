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

export function Upscale() {
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
    <SectionWrapper>
      <div ref={sweepRef}>
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-h2 font-black text-foreground mb-4 font-display">
            흐릿한 이미지, 선명하게
          </h2>
          <p className="text-lg md:text-2xl text-muted-foreground">
            최대{" "}
            <span className="font-black text-primary">4x 업스케일</span>로
            디테일을 복원합니다
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
            className="relative max-w-2xl mx-auto aspect-[3/2] rounded-2xl overflow-hidden cursor-col-resize select-none border border-border shadow-card-light dark:shadow-card-dark"
            style={{ touchAction: "none" }}
          >
            {/* 업스케일 배율 배지 */}
            <div className="absolute top-4 right-4 z-30">
              <Badge
                variant="primary"
                className="backdrop-blur-md bg-black/50 border border-primary/10 text-white"
              >
                4x 업스케일
              </Badge>
            </div>

            {/* After */}
            <Image
              src="/images/home/hero/hero-after.webp"
              alt="업스케일 후"
              fill
              className="object-cover"
              style={{ objectPosition: "center 25%" }}
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
                src="/images/home/hero/hero-before.webp"
                alt="업스케일 전"
                fill
                className="object-cover blur-[1px]"
                style={{ objectPosition: "center 25%" }}
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
        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href="/image-edit"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
          >
            이미지 편집 시작하기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
