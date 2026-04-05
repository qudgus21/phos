"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { getBlur } from "@/lib/constants/blur-placeholders";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Scan, Layers, Sun, Sparkles, SlidersHorizontal, Palette } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import type { Dictionary } from "@/lib/i18n";

interface SkinRealismProps {
  dict: Dictionary;
  locale: string;
}

const featureIcons = [Scan, Layers, Sun, Sparkles, SlidersHorizontal, Palette];

export function SkinRealism({ dict, locale }: SkinRealismProps) {
  const features = dict.features.skinRealism.features.map((f, i) => ({
    icon: featureIcons[i],
    title: f.title,
    desc: f.desc,
  }));

  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    []
  );

  return (
    <SectionWrapper id="skin-realism">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl border border-indigo-500/20 bg-zinc-100 dark:bg-zinc-950 p-6 md:p-12 shadow-[0_0_60px_rgba(99,102,241,0.08)] dark:shadow-[0_0_60px_rgba(99,102,241,0.12)]"
      >
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Image with interactive magnifier */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div
              ref={containerRef}
              className="relative aspect-[4/5] rounded-2xl bg-gradient-to-br from-rose-200 via-amber-100 to-pink-200 dark:from-rose-900/30 dark:via-amber-900/20 dark:to-pink-900/30 border border-border overflow-hidden shadow-card-dark cursor-crosshair"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src="/images/retouching/sample1/after.webp"
                alt={dict.features.skinRealism.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"

                placeholder="blur"
                blurDataURL={getBlur("/images/retouching/sample1/after.webp")}
              />

              {/* Magnifier lens */}
              <div
                className="hidden md:block absolute w-36 h-36 rounded-full pointer-events-none z-10 overflow-hidden"
                style={{
                  left: `${mousePos.x}%`,
                  top: `${mousePos.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: isHovering ? 1 : 0,
                  transition: "opacity 0.2s ease",
                  border: "2px solid rgba(255,255,255,0.25)",
                  boxShadow:
                    "0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.1), inset 0 0 20px rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "url(/images/retouching/sample1/after.webp)",
                    backgroundSize: "400%",
                    backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                  }}
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-white tracking-wide">
                    4x
                  </span>
                </div>
              </div>

              {/* Hover hint */}
              <div
                className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                style={{
                  opacity: isHovering ? 0 : 0.6,
                  transition: "opacity 0.3s ease",
                }}
              >
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  {dict.features.skinRealism.hoverHint}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-5">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-500/20">
                <span>✨</span>
                {dict.features.skinRealism.badge}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-h3 font-black text-foreground mb-4 font-display"
            >
              {dict.features.skinRealism.title}{" "}
              <span className="gradient-text">{dict.features.skinRealism.titleAccent}</span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              {dict.features.skinRealism.description}
            </motion.p>

            {/* Feature grid — Lucide icons + premium cards */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
            >
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    variants={fadeInUp}
                    className="group/card flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-200"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/15 dark:to-violet-500/15 border border-indigo-500/10 dark:border-indigo-500/15 flex items-center justify-center transition-colors duration-200 group-hover/card:border-indigo-500/25">
                      <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-0.5">
                        {f.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Link
                href={`/${locale}/retouching`}
                className="inline-flex items-center px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl btn-glow transition-all hover:scale-105 hover:brightness-110"
              >
                {dict.features.skinRealism.cta}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
