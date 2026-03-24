"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const samples = [
  { id: "sample1" },
  { id: "sample2" },
  { id: "sample3" },
  { id: "sample4" },
  { id: "sample5" },
  { id: "sample6" },
];

const availableOptions = [
  { label: "성별", values: "여성 · 남성" },
  { label: "변화 강도", values: "0.5 ~ 1.0" },
  { label: "분위기", values: "내추럴 · 시크 · 프렌들리" },
];

export function FaceSwap() {
  const [selected, setSelected] = useState("sample1");

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

        {/* Sample tabs */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                "relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer",
                selected === s.id
                  ? "border-primary shadow-[0_0_8px_rgba(99,102,241,0.4)] scale-110"
                  : "border-white/20 opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={`/images/face-edit/${s.id}/thumbnail.webp`}
                alt="얼굴 변경 샘플"
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            </button>
          ))}
        </motion.div>

        {/* Main content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 p-5 md:p-8 shadow-card-light dark:shadow-card-dark">
              {/* Visual: Original → Result */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6 mb-6">
                {/* Original */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border">
                  <Image
                    src={`/images/face-edit/${selected}/before.webp`}
                    alt="원본 이미지"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 250px"
                    unoptimized
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm rounded-md">
                    원본
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />

                {/* Result */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary/20">
                  <Image
                    src={`/images/face-edit/${selected}/after.webp`}
                    alt="얼굴 변경 결과"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 250px"
                    unoptimized
                  />
                  <Badge
                    variant="primary"
                    className="absolute top-2 right-2 md:top-3 md:right-3 text-[10px] bg-black/50 backdrop-blur-sm border border-white/20 text-white"
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
        </AnimatePresence>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href="/face-edit"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-sm transition-colors group"
          >
            얼굴 변경 시작하기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
