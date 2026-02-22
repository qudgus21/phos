"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ImagePlus, Wand2, Camera } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const useCases = [
  {
    id: "reference",
    icon: ImagePlus,
    tag: "레퍼런스 합성",
    title: "이미지를 조합해 새로운 결과물",
    desc: "모델 사진과 상품 사진을 넣고, 자연스럽게 합성된 결과를 받아보세요.",
    prompt: "figure 1의 모델에 figure 2와 동일한 선글라스를 착용시켜줘. 스타일은 모던하게 유지.",
    inputs: ["모델 사진", "상품 사진"],
    resultLabel: "합성 결과",
  },
  {
    id: "concept",
    icon: Camera,
    tag: "제품 컨셉 촬영",
    title: "제품 하나로 상업용 컷 완성",
    desc: "제품 사진 한 장과 프롬프트만으로 스튜디오 촬영 수준의 컨셉 이미지를 생성합니다.",
    prompt: "투명 블루 아크릴 위에 제품을 올리고, 위에서 물이 쏟아지는 하이스피드 촬영 컷. 깔끔한 스카이블루 배경, 8K 제품 촬영.",
    inputs: ["제품 사진"],
    resultLabel: "컨셉 결과",
  },
  {
    id: "modify",
    icon: Wand2,
    tag: "연출 수정",
    title: "포즈, 배경, 스타일을 자유롭게",
    desc: "기존 촬영 이미지의 포즈를 바꾸거나 배경과 소품을 수정할 수 있습니다.",
    prompt: "같은 제품을 화이트 세라믹 접시 위에 배치, 레스토랑 테이블 연출. 따뜻한 조명, 에디토리얼 스틸라이프 무드.",
    inputs: ["원본 사진"],
    resultLabel: "수정 결과",
  },
];

export function ImageEdit() {
  const [selected, setSelected] = useState("reference");
  const current = useCases.find((u) => u.id === selected)!;

  return (
    <SectionWrapper className="!py-10 md:!py-14">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
            사진과 프롬프트만으로{" "}
            <span className="gradient-text">새로운 이미지</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            촬영 없이, 원하는 컨셉의 상업용 이미지를 만들어보세요.
          </p>
        </motion.div>

        {/* Use case tabs */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {useCases.map((u) => {
            const Icon = u.icon;
            return (
              <button
                key={u.id}
                onClick={() => setSelected(u.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm md:text-base font-bold rounded-xl border transition-all cursor-pointer",
                  selected === u.id
                    ? "bg-foreground text-background border-foreground shadow-lg"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:text-foreground hover:border-foreground/30"
                )}
              >
                <Icon className="w-4 h-4" />
                {u.tag}
              </button>
            );
          })}
        </motion.div>

        {/* Selected use case content */}
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 p-5 md:p-8 shadow-card-light dark:shadow-card-dark">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
                {current.title}
              </h3>
              <p className="text-sm text-muted-foreground">{current.desc}</p>
            </div>

            {/* Visual: input → result */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6 mb-6">
              {/* Input images */}
              <div className={cn(
                "grid gap-3",
                current.inputs.length > 1 ? "grid-cols-2" : "grid-cols-1"
              )}>
                {current.inputs.map((label) => (
                  <div key={label}>
                    <div className="aspect-square rounded-xl border border-border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <div className="text-center">
                        <ImagePlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground/50">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <ArrowRight className="w-6 h-6 text-primary shrink-0" />

              {/* Result */}
              <div className="aspect-square rounded-xl border-2 border-primary/20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 flex items-center justify-center">
                <div className="text-center">
                  <Wand2 className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                  <p className="text-sm text-primary/50 font-bold">{current.resultLabel}</p>
                </div>
              </div>
            </div>

            {/* Prompt preview */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px]">
                  프롬프트 예시
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                &ldquo;{current.prompt}&rdquo;
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href="/image-edit"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-sm transition-colors group"
          >
            이미지 편집 시작하기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
