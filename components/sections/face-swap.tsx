"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Sparkles } from "lucide-react";
import Link from "next/link";

const availableOptions = [
  { label: "성별", values: "여성 · 남성" },
  { label: "변화 강도", values: "숫자 입력 (0~100)" },
  { label: "분위기", values: "내추럴 · 시크 · 프렌들리" },
];

export function FaceSwap() {
  return (
    <SectionWrapper>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Headline */}
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
            모델 없이 완성하는{" "}
            <span className="gradient-text">새로운 얼굴</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            사진 한 장과 옵션 선택만으로 상업용 모델 이미지를 생성합니다.
          </p>
        </motion.div>

        {/* Main content card */}
        <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 p-5 md:p-8 shadow-card-light dark:shadow-card-dark">
            {/* Visual: Original → Result */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6 mb-6">
              {/* Original */}
              <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center gap-2 group hover:border-primary/30 transition-colors">
                <Upload className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                <div className="text-center px-2">
                  <p className="text-xs md:text-sm font-bold text-muted-foreground/50">
                    원본 이미지
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />

              {/* Result */}
              <div className="aspect-[3/4] rounded-xl border-2 border-primary/20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary/30 relative z-10" />
                <p className="text-xs md:text-sm font-bold text-primary/50 relative z-10">
                  생성 결과
                </p>
                <Badge
                  variant="primary"
                  className="absolute top-2 right-2 md:top-3 md:right-3 text-[10px]"
                >
                  AI Generated
                </Badge>
              </div>
            </div>

            {/* Available options — static info */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-[10px]">
                  조절 가능한 옵션
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {availableOptions.map((opt) => (
                  <div key={opt.label}>
                    <p className="text-xs font-bold text-muted-foreground mb-1">
                      {opt.label}
                    </p>
                    <p className="text-sm text-foreground">{opt.values}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href="#pricing"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-sm transition-colors group"
          >
            모델 생성하기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
