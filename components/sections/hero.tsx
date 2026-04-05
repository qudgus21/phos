"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { getBlur } from "@/lib/constants/blur-placeholders";
import type { Dictionary } from "@/lib/i18n";

interface HeroProps {
  dict: Dictionary;
  locale: string;
}

export function Hero({ dict, locale }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background base */}
      <div className="absolute inset-0 bg-background dark:bg-[#090A14]" />

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
          alt={dict.hero.heroImageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 65vw"
          className="object-cover object-top"
          priority
          placeholder="blur"
          blurDataURL={getBlur("/images/home/hero/hero-model.webp")}
        />
        {/* Left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-white from-5% via-white/40 via-30% to-transparent to-60% dark:from-[#1a1b2e] dark:via-[#1a1b2e]/40 dark:to-transparent" />
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
            {dict.hero.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 rounded-full dark:text-indigo-300"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* Headline — A (no animation for LCP optimization) */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 font-display leading-[1.1] tracking-tight"
          >
            <span className="whitespace-nowrap">{dict.hero.headline}</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent whitespace-pre-line">
              {dict.hero.headlineAccent}
            </span>
          </h1>

          {/* Subtitle — A (no animation for LCP optimization) */}
          <p
            className="text-lg md:text-xl text-foreground/70 mb-12 leading-relaxed"
          >
            {dict.hero.subtitle}
            <br className="hidden md:block" />
            {dict.hero.subtitleHighlight}
          </p>

          {/* CTA — E */}
          <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-8">
            <Link
              href={`/${locale}/image-edit`}
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl btn-glow transition-all duration-300 ease-out hover:scale-[1.06] hover:brightness-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              {dict.hero.cta}
            </Link>
            <span className="text-sm text-muted-foreground">
              {dict.hero.ctaHelper}
            </span>
          </motion.div>

          {/* Trust Bar */}
          <motion.div variants={fadeInUp}>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {dict.hero.trustBar}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
