"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ImagePlus, Camera, Wand2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const useCases = [
  {
    id: "concept",
    icon: Camera,
    tag: "제품 컨셉 촬영",
    title: "제품 하나로 상업용 컷 완성",
    desc: "제품 사진 한 장과 설명 한 줄이면 스튜디오 촬영 수준의 컨셉 이미지를 생성합니다.",
    prompt: "프로페셔널 헤어 제품 모델처럼 포즈를 바꿔줘. 배경은 깔끔하고 미니멀하게 유지.",
    inputs: [
      { label: "원본 사진", src: "/images/image-edit/sample1/input1.webp" },
    ],
    outputs: ["/images/image-edit/sample1/output1.webp"],
    resultLabel: "컨셉 결과",
  },
  {
    id: "reference",
    icon: ImagePlus,
    tag: "레퍼런스 합성",
    title: "이미지를 조합해 새로운 결과물",
    desc: "모델 사진과 상품 사진을 넣고, 자연스럽게 합성된 결과를 받아보세요.",
    prompt: "첫 번째 사진의 모델에 두 번째 사진과 동일한 선글라스를 착용시켜줘. 스타일은 모던하게 유지.",
    inputs: [
      { label: "모델 사진", src: "/images/image-edit/sample2/input1.webp" },
      { label: "상품 사진", src: "/images/image-edit/sample2/input2.webp" },
    ],
    outputs: ["/images/image-edit/sample2/output1.webp"],
    resultLabel: "합성 결과",
  },
  {
    id: "modify",
    icon: Wand2,
    tag: "연출 수정",
    title: "포즈, 배경, 스타일을 자유롭게",
    desc: "기존 촬영 이미지의 포즈를 바꾸거나 배경과 소품을 수정할 수 있습니다.",
    prompt: "올리브 리넨 위에 허브와 밀줄기가 담긴 바구니 안에 제품을 배치. 탑뷰 구도, 자연광, 오가닉 웰니스 무드.",
    inputs: [
      { label: "제품 사진", src: "/images/image-edit/sample4/input1.webp" },
    ],
    outputs: ["/images/image-edit/sample4/output1.webp"],
    resultLabel: "수정 결과",
  },
];

export function ImageEdit() {
  const [selected, setSelected] = useState("concept");
  const current = useCases.find((u) => u.id === selected)!;

  return (
    <SectionWrapper className="pt-20 md:pt-28">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-h3 font-black text-foreground mb-3 font-display">
            사진과 설명 한 줄로{" "}
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
                {current.inputs.map((input) => (
                  <div key={input.label}>
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
                      <Image
                        src={input.src}
                        alt={input.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, 200px"
                        unoptimized
                      />
                      <Badge
                        variant="primary"
                        className="absolute top-2 left-2 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                      >
                        {input.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <ArrowRight className="w-6 h-6 text-primary shrink-0" />

              {/* Result */}
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20">
                <Image
                  src={current.outputs[0]}
                  alt={current.resultLabel}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40vw, 300px"
                  unoptimized
                />
                <Badge
                  variant="primary"
                  className="absolute top-2 right-2 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                >
                  AI 생성
                </Badge>
              </div>
            </div>

            {/* Prompt preview */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px]">
                  입력 예시
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
          >
            이미지 편집 시작하기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
