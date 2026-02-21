"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Full-bleed background */}
      <div className="absolute inset-0 z-0">
        {/* Light mode: clean white */}
        <div className="absolute inset-0 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:via-stone-800 dark:to-zinc-950" />
        {/* Dark mode only: portrait gradient overlays */}
        <div className="absolute top-[5%] right-[-5%] w-[65%] h-[90%] bg-transparent dark:bg-gradient-to-bl dark:from-[#c4a882]/30 dark:via-[#d4b896]/15 dark:to-transparent rounded-full blur-sm" />
        <div className="absolute top-[10%] right-[5%] w-[40%] h-[70%] bg-transparent dark:bg-gradient-to-bl dark:from-[#e8cdb5]/20 dark:via-[#d4b896]/10 dark:to-transparent rounded-full blur-md" />
        {/* Dark mode only: overlay */}
        <div className="absolute inset-0 bg-transparent dark:bg-black/50" />
        {/* Subtle accent light */}
        <div className="absolute top-0 right-[20%] w-[30%] h-[40%] bg-gradient-to-b from-indigo-500/5 to-transparent dark:from-indigo-500/20 blur-2xl" />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto px-4 pt-32 pb-24"
      >
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-hero font-black text-foreground dark:text-white mb-6 font-display"
        >
          Revoa AI
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-lg md:text-xl text-muted-foreground dark:text-zinc-300 max-w-2xl mx-auto mb-2"
        >
          흐릿한 디테일, 클릭 한 번으로 선명하게.
        </motion.p>
        <motion.p
          variants={fadeInUp}
          className="text-base md:text-lg text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto mb-12"
        >
          결국 <span className="text-foreground dark:text-zinc-200 font-semibold">디테일</span>이 전환을 만듭니다.
        </motion.p>

        <motion.div variants={fadeInUp}>
          <Link
            href="/upscale"
            className="inline-flex items-center px-10 py-4 text-xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl btn-glow transition-all hover:scale-105 hover:brightness-110"
          >
            시작하기
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
