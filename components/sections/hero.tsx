"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
const tags = ["이미지 편집", "피부 리터칭", "얼굴 변경", "업스케일"];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background base */}
      <div className="absolute inset-0 bg-[#090A14]" />

      {/* Ambient glow particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/[0.07] blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "10%", left: "-5%" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-violet-500/[0.05] blur-[100px]"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "20%", left: "10%" }}
        />
      </div>

      {/* Model image — right side */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[65%] z-0">
        <Image
          src="/images/home/hero/hero-model.webp"
          alt="AI로 보정된 고해상도 뷰티 이미지"
          fill
          className="object-cover object-top"
          priority
          unoptimized
        />
        {/* Left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b2e] from-5% via-[#1a1b2e]/40 via-30% to-transparent to-60%" />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-32 pb-24"
      >
        <div className="max-w-xl">
          {/* Keyword tags — D */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* Headline — A */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 font-display leading-[1.1] tracking-tight"
          >
            편집, 보정, 생성
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              스튜디오 퀄리티를
              <br />
              누구나
            </span>
          </motion.h1>

          {/* Subtitle — A */}
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed"
          >
            이미지 편집 · 피부 보정 · 얼굴 변경
            <br className="hidden md:block" />
            하이엔드 실사 이미지, <span className="text-white/80">클릭 한 번</span>이면 충분합니다
          </motion.p>

          {/* CTA — E */}
          <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-8">
            <Link
              href="/image-edit"
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl btn-glow transition-all duration-300 ease-out hover:scale-[1.06] hover:brightness-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              무료로 시작하기
            </Link>
            <span className="text-sm text-white/50">
              카드 등록 없이 · 무료 체험
            </span>
          </motion.div>

          {/* Trust Bar */}
          <motion.div variants={fadeInUp}>
            <p className="text-[11px] text-white/35 leading-relaxed">
              포토그래퍼 · 디자이너 · 마케터 · 인플루언서 · 셀러를 위한 AI 이미지 도구
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
