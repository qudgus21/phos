"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { getBlur } from "@/lib/constants/blur-placeholders";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ImagePlus, Camera, Wand2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

interface ImageEditProps {
  dict: Dictionary;
  locale: string;
}

const useCasesData = [
  {
    id: "concept",
    icon: Camera,
    inputs: [
      { labelIndex: 0, src: "/images/image-edit/sample1/input1.webp" },
    ],
    outputs: ["/images/image-edit/sample1/output1.webp"],
  },
  {
    id: "reference",
    icon: ImagePlus,
    inputs: [
      { labelIndex: 1, src: "/images/image-edit/sample2/input1.webp" },
      { labelIndex: 2, src: "/images/image-edit/sample2/input2.webp" },
    ],
    outputs: ["/images/image-edit/sample2/output1.webp"],
  },
  {
    id: "modify",
    icon: Wand2,
    inputs: [
      { labelIndex: 3, src: "/images/image-edit/sample4/input1.webp" },
    ],
    outputs: ["/images/image-edit/sample4/output1.webp"],
  },
];

export function ImageEdit({ dict, locale }: ImageEditProps) {
  const [selected, setSelected] = useState("concept");

  const useCases = useCasesData.map((u, i) => ({
    ...u,
    tag: dict.features.imageEdit.useCases[i].tag,
    title: dict.features.imageEdit.useCases[i].title,
    desc: dict.features.imageEdit.useCases[i].desc,
    prompt: dict.features.imageEdit.useCases[i].prompt,
    inputs: u.inputs.map((inp) => ({
      ...inp,
      label: dict.features.imageEdit.inputLabels[inp.labelIndex],
    })),
  }));

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
            {dict.features.imageEdit.title}{" "}
            <span className="gradient-text">{dict.features.imageEdit.titleAccent}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {dict.features.imageEdit.subtitle}
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

                        {...(getBlur(input.src) ? { placeholder: "blur" as const, blurDataURL: getBlur(input.src) } : {})}
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
                  alt={dict.features.imageEdit.aiGenerated}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40vw, 300px"
                  unoptimized
                  {...(getBlur(current.outputs[0]) ? { placeholder: "blur" as const, blurDataURL: getBlur(current.outputs[0]) } : {})}
                />
                <Badge
                  variant="primary"
                  className="absolute top-2 right-2 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                >
                  {dict.features.imageEdit.aiGenerated}
                </Badge>
              </div>
            </div>

            {/* Prompt preview */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px]">
                  {dict.features.imageEdit.promptExample}
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
            href={`/${locale}/image-edit`}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
          >
            {dict.features.imageEdit.cta}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
