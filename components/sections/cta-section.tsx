"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, slideInLeft, slideInRight } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";

export function CtaSection() {
  return (
    <SectionWrapper>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display leading-tight"
        >
          얼굴이 바뀌는 보정,
          <br />
          픽셀만 늘리는 업스케일에 지치셨나요?
        </motion.h2>
      </motion.div>

      {/* Two large portrait images side by side */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto mb-8"
      >
        <motion.div
          variants={slideInLeft}
          className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-stone-300 via-stone-200 to-stone-400 dark:from-stone-700 dark:via-stone-800 dark:to-stone-900 border border-border overflow-hidden flex items-center justify-center"
        >
          <div className="text-7xl opacity-30">👩</div>
        </motion.div>
        <motion.div
          variants={slideInRight}
          className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-400 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 border border-border overflow-hidden flex items-center justify-center"
        >
          <div className="text-7xl opacity-30">👨</div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground/60 mb-6">
          refinetool에서 보정된 이미지입니다.
        </p>
        <p className="text-base text-muted-foreground mb-1">
          RefineTool은 주변 픽셀을 최신 AI로 분석해
        </p>
        <p className="text-xl md:text-2xl font-black mb-8">
          <span className="text-primary">실사처럼 보정</span>
          <span className="text-muted-foreground font-normal">합니다.</span>
        </p>
        <Link
          href="/upscale"
          className="inline-flex items-center px-12 py-4 text-lg font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl btn-glow transition-all hover:scale-105 hover:brightness-110"
        >
          지금 체험하기
        </Link>
      </motion.div>
    </SectionWrapper>
  );
}
