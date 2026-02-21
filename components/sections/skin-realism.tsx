"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const features = [
  { emoji: "🔍", title: "정체성 보존", desc: "고유한 특성을 유지하면서 선명도 극대화" },
  { emoji: "📸", title: "실제 질감", desc: "실제 피부처럼 미세한 표면 패턴" },
  { emoji: "🌓", title: "3D 음영", desc: "깊이감 있는 조명과 그림자" },
  { emoji: "💡", title: "자연스러운 하이라이트", desc: "사실적인 빛 산란과 반사" },
];

export function SkinRealism() {
  return (
    <section className="py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Dark container card with glow border */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-indigo-500/20 bg-zinc-100 dark:bg-zinc-950 p-6 md:p-12 shadow-[0_0_60px_rgba(99,102,241,0.08)] dark:shadow-[0_0_60px_rgba(99,102,241,0.12)]"
        >
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-rose-200 via-amber-100 to-pink-200 dark:from-rose-900/30 dark:via-amber-900/20 dark:to-pink-900/30 border border-border overflow-hidden flex items-center justify-center shadow-card-dark"
            >
              <div className="text-8xl opacity-30">🧑</div>
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
                  ULTRA SKIN ENHANCEMENT
                </span>
              </motion.div>

              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-h3 font-black text-foreground mb-4 font-display"
              >
                차원이 다른{" "}
                <span className="gradient-text">피부 리얼리즘</span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed"
              >
                AI 이미지를 섬세한 피부 질감과 사실적인 디테일로 생생한 결과물로
                변환합니다.
              </motion.p>

              {/* Feature grid — horizontal layout: icon left, text right */}
              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
              >
                {features.map((f) => (
                  <motion.div
                    key={f.title}
                    variants={fadeInUp}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06]"
                  >
                    <div className="text-xl shrink-0 mt-0.5 opacity-80">{f.emoji}</div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-0.5">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Link
                  href="/upscale"
                  className="inline-flex items-center px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-xl btn-glow transition-all hover:scale-105 hover:brightness-110"
                >
                  지금 체험하기
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
