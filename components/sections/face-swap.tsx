"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { getBlur } from "@/lib/constants/blur-placeholders";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

interface FaceSwapProps {
  dict: Dictionary;
  locale: string;
}

const samples = [
  { id: "sample1" },
  { id: "sample2" },
  { id: "sample3" },
  { id: "sample4" },
  { id: "sample5" },
  { id: "sample6" },
];

export function FaceSwap({ dict, locale }: FaceSwapProps) {
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
            {dict.features.faceSwap.title}{" "}
            <span className="gradient-text">{dict.features.faceSwap.titleAccent}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {dict.features.faceSwap.subtitle}
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
                  : "border-border opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={`/images/face-edit/${s.id}/thumbnail.webp`}
                alt={dict.features.faceSwap.sampleAlt}
                fill
                className="object-cover"
                sizes="40px"

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
                    alt={dict.features.faceSwap.originalAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 250px"
    
                    {...(getBlur(`/images/face-edit/${selected}/before.webp`) ? { placeholder: "blur" as const, blurDataURL: getBlur(`/images/face-edit/${selected}/before.webp`) } : {})}
                  />
                  <div className="absolute inset-0 mix-blend-multiply opacity-40">
                    <Image
                      src={`/images/face-edit/${selected}/mask.webp`}
                      alt={dict.features.faceSwap.maskAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 40vw, 250px"
      
                      {...(getBlur(`/images/face-edit/${selected}/mask.webp`) ? { placeholder: "blur" as const, blurDataURL: getBlur(`/images/face-edit/${selected}/mask.webp`) } : {})}
                    />
                  </div>
                  <Badge
                    variant="primary"
                    className="absolute top-2 left-2 md:top-3 md:left-3 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                  >
                    {dict.features.faceSwap.maskBadge}
                  </Badge>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />

                {/* Result */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary/20">
                  <Image
                    src={`/images/face-edit/${selected}/after.webp`}
                    alt={dict.features.faceSwap.resultAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 250px"
    
                    {...(getBlur(`/images/face-edit/${selected}/after.webp`) ? { placeholder: "blur" as const, blurDataURL: getBlur(`/images/face-edit/${selected}/after.webp`) } : {})}
                  />
                  <Badge
                    variant="primary"
                    className="absolute top-2 right-2 md:top-3 md:right-3 text-[10px] bg-black/50 backdrop-blur-sm text-white"
                  >
                    {dict.features.faceSwap.aiGenerated}
                  </Badge>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-6">
          <Link
            href={`/${locale}/face-edit`}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/10 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-base transition-all group"
          >
            {dict.features.faceSwap.cta}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
