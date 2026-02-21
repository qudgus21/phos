"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const tags = ["피부보정", "얼굴변경", "고화질", "AI 리터칭"];

const stats = [
  { value: "10만+", label: "보정 완료" },
  { value: "98%", label: "만족도" },
  { value: "30만+", label: "다운로드" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background base */}
      <div className="absolute inset-0 bg-[#1a1b2e]" />

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
      <div className="absolute inset-y-0 right-0 w-full md:w-[70%] z-0">
        <Image
          src="/hero-model.png"
          alt="Beauty model"
          fill
          className="object-cover object-top"
          priority
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
          {/* Keyword tags */}
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

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 font-display leading-[1.1] tracking-tight"
          >
            AI 보정 스튜디오
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed"
          >
            흐릿함은 지우고, 퀄리티는 채우세요
            <br className="hidden md:block" />
            <span className="text-white/80">디테일</span>의 차이가 압도적인 차이를 만듭니다
          </motion.p>

          <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-16">
            <Link
              href="/upscale"
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl btn-glow transition-all duration-300 ease-out hover:scale-[1.06] hover:brightness-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              시작하기
            </Link>
            <span className="text-sm text-white/30">무료로 체험해보세요</span>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="flex gap-8"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
