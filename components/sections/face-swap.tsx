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
            영역을 지정하고, 새로운 얼굴을 만들어보세요.
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
                {/* Original + Mask overlay */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border">
                  <Image
                    src={`/images/face-edit/${selected}/before.webp`}
                    alt="원본 이미지"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 250px"
                    unoptimized
                  />
                  <div className="absolute inset-0 mix-blend-multiply opacity-40">
                    <Image
                      src={`/images/face-edit/${selected}/mask.webp`}
                      alt="마스크 영역"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 40vw, 250px"
                      unoptimized
                    />
                  </div>
                  <Badge
                    variant="primary"
                    className="absolute top-2 left-2 md:top-3 md:left-3 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                  >
                    마스크 지정
                  </Badge>
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
                    className="absolute top-2 right-2 md:top-3 md:right-3 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                  >
                    AI 생성
                  </Badge>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href="/face-edit"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
          >
            얼굴 변경 시작하기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
