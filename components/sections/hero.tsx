"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useCountUp } from "@/hooks/use-count-up";
import { useSlider } from "@/hooks/use-slider";

const tags = ["저화질 복원", "피부 리터칭", "대량 보정", "상업용 퀄리티"];

interface StatConfig {
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const statConfigs: StatConfig[] = [
  { end: 100000, suffix: "+", label: "보정 완료", decimals: 0 },
  { end: 99, suffix: "%", label: "만족도", decimals: 0 },
  { end: 300000, suffix: "+", label: "다운로드", decimals: 0 },
];

const trustAudiences = ["이커머스 셀러", "포토그래퍼", "디자이너", "마케터"];

function CountUpStat({ config }: { config: StatConfig }) {
  const { ref, value } = useCountUp({
    end: config.end,
    suffix: config.suffix,
    duration: 2200,
    decimals: config.decimals,
  });

  const display =
    config.end >= 10000
      ? value.replace(/,/g, "").replace(/(\d+)\+?/, (_, num) => {
          const n = parseInt(num);
          if (n >= 10000) return Math.floor(n / 10000) + "만+";
          return num + (config.suffix === "+" ? "+" : config.suffix);
        })
      : value;

  return (
    <div ref={ref} className="min-w-[5rem]">
      <p className="relative -left-px text-2xl md:text-3xl font-bold text-white">
        {display}
      </p>
      <p className="text-xs text-white/40 mt-1">{config.label}</p>
    </div>
  );
}

function BeforeAfterPreview() {
  const { sliderPos, sliderProps } = useSlider(40);

  return (
    <div className="relative">
      <div
        {...sliderProps}
        className="relative w-full aspect-[3/2] rounded-xl overflow-hidden cursor-col-resize select-none border border-white/10 shadow-2xl"
      >
        {/* After (enhanced) */}
        <Image
          src="/hero-after.jpg"
          alt="AI 보정 후"
          fill
          className="object-cover"
        />

        {/* Before (degraded) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <Image
            src="/hero-before.jpg"
            alt="보정 전"
            fill
            className="object-cover"
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
            <div className="flex gap-[2px]">
              <svg width="4" height="8" viewBox="0 0 4 8" fill="none">
                <path
                  d="M3 1L1 4L3 7"
                  stroke="#1a1b2e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg width="4" height="8" viewBox="0 0 4 8" fill="none">
                <path
                  d="M1 1L3 4L1 7"
                  stroke="#1a1b2e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute bottom-2 left-2 text-[10px] font-medium text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
          Before
        </span>
        <span className="absolute bottom-2 right-2 text-[10px] font-medium text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
          After
        </span>
      </div>

      <p className="text-[11px] text-white/30 mt-2 text-center">
        드래그하여 비교
      </p>
    </div>
  );
}

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
          alt="AI로 보정된 고해상도 뷰티 이미지"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b2e] from-5% via-[#1a1b2e]/40 via-30% to-transparent to-60%" />
      </div>

      {/* Desktop Before/After Preview — B */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 right-6 md:bottom-12 md:right-12 z-20 hidden md:block w-[350px]"
      >
        <BeforeAfterPreview />
      </motion.div>

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
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 font-display leading-[1.1] tracking-tight"
          >
            흐릿한 이미지를
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              실사 퀄리티로
            </span>
          </motion.h1>

          {/* Subtitle — A */}
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed"
          >
            SNS, 상세페이지, 룩북, 광고 소재까지
            <br className="hidden md:block" />
            <span className="text-white/80">디테일</span>의 차이가 압도적인
            차이를 만듭니다
          </motion.p>

          {/* CTA — E */}
          <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-16">
            <Link
              href="/upscale"
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl btn-glow transition-all duration-300 ease-out hover:scale-[1.06] hover:brightness-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              무료로 보정하기
            </Link>
            <span className="text-sm text-white/50">
              카드 등록 없이 · 3장 무료
            </span>
          </motion.div>

          {/* Mobile Before/After Preview — B */}
          <motion.div
            variants={fadeInUp}
            className="block md:hidden max-w-[300px] mb-12"
          >
            <BeforeAfterPreview />
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeInUp} className="flex gap-8 mb-10">
            {statConfigs.map((config) => (
              <CountUpStat key={config.label} config={config} />
            ))}
          </motion.div>

          {/* Trust Bar — C */}
          <motion.div variants={fadeInUp}>
            <p className="text-[11px] text-white/25 mb-3 uppercase tracking-widest">
              다양한 전문가가 선택한 AI 보정
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {trustAudiences.map((audience) => (
                <span
                  key={audience}
                  className="px-3 py-1 text-[11px] font-medium text-white/30 border border-white/10 rounded-full"
                >
                  {audience}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
