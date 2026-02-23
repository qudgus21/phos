"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Basic",
    description: "기본",
    monthlyPrice: 9,
    yearlyPrice: 7,
    recommended: false,
    cta: "시작하기",
    features: [
      "4,000 크레딧",
      "AI 업스케일링",
      "피부 보정 (기본)",
      "고해상도 변환",
      "실시간 처리",
    ],
  },
  {
    name: "Deluxe",
    description: "전체 기능",
    monthlyPrice: 19,
    yearlyPrice: 15,
    recommended: true,
    cta: "시작하기",
    features: [
      "8,500 크레딧",
      "AI 업스케일링",
      "피부 보정 (기본)",
      "피부 보정 (메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
    ],
  },
  {
    name: "Premium",
    description: "전체 기능 + 베타",
    monthlyPrice: 29,
    yearlyPrice: 23,
    recommended: false,
    cta: "시작하기",
    features: [
      "13,000 크레딧",
      "AI 업스케일링",
      "피부 보정 (기본)",
      "피부 보정 (메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "베타 기능 무료 제공",
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <SectionWrapper id="pricing">
      {/* 섹션 헤더 */}
      <motion.div variants={fadeInUp} className="text-center mb-6">
        <h2 className="text-3xl md:text-h2 font-black text-foreground font-display">
          요금제
        </h2>
      </motion.div>

      {/* 월간/연간 토글 */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-center gap-3 mb-8"
      >
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            !isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          월간
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={cn(
            "relative w-14 h-7 rounded-full transition-colors cursor-pointer",
            isYearly ? "bg-primary" : "bg-muted-foreground/30"
          )}
          aria-label="결제 주기 전환"
        >
          <motion.div
            className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ x: isYearly ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          연간
        </span>
        <Badge
          variant="success"
          className={cn(
            "ml-1 transition-opacity duration-200",
            isYearly ? "opacity-100" : "opacity-0"
          )}
        >
          2개월 무료
        </Badge>
      </motion.div>

      {/* 요금 카드 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 md:p-8 transition-all",
                plan.recommended
                  ? "pricing-recommended bg-card md:scale-[1.03] z-10"
                  : "border-border bg-card opacity-90 hover:opacity-100"
              )}
            >
              {/* E: 추천 카드 상단 그래디언트 스트라이프 + 강화된 배지 */}
              {plan.recommended && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <Badge
                    variant="primary"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white"
                  >
                    추천
                  </Badge>
                </>
              )}

              {/* B: 티어명 + 타겟 설명 */}
              <h3 className="text-h4 font-bold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              {/* A: 가격 + 연간 할인 표시 */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-primary tabular-nums">
                  ${price}
                </span>
                <span className="text-muted-foreground text-sm">/월</span>
                <span
                  className={cn(
                    "text-sm text-muted-foreground line-through transition-opacity duration-200",
                    isYearly ? "opacity-100" : "opacity-0"
                  )}
                >
                  ${plan.monthlyPrice}
                </span>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="block w-full text-center py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110"
              >
                {plan.cta}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* D: 신뢰 시그널 */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" />
          <span>언제든 해지 가능</span>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
