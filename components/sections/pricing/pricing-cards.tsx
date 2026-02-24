"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PricingTab = "monthly" | "onetime";

interface Plan {
  name: string;
  price: number;
  recommended?: boolean;
  features: string[];
  ctaText: string;
  disabled?: boolean;
}

const monthlyPlans: Plan[] = [
  {
    name: "Free",
    price: 0,
    features: [
      "200 크레딧",
      "회원가입 시 200 크레딧 무료",
      "⏱️ 5분당 1회 생성 제한",
      "한 번에 1장 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
    ],
    ctaText: "현재 플랜",
    disabled: true,
  },
  {
    name: "Basic",
    price: 9,
    features: [
      "4,500 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
      "실시간 처리",
    ],
    ctaText: "시작하기",
  },
  {
    name: "Deluxe",
    price: 19,
    recommended: true,
    features: [
      "9,500 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
    ],
    ctaText: "시작하기",
  },
  {
    name: "Premium",
    price: 29,
    features: [
      "14,500 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
      "베타기능(무료)",
    ],
    ctaText: "시작하기",
  },
];

const onetimePlans: Plan[] = [
  {
    name: "Starter",
    price: 5,
    features: [
      "2,000 크레딧",
      "크레딧 영구 보관",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
    ],
    ctaText: "구매하기",
  },
  {
    name: "Basic",
    price: 15,
    features: [
      "7,000 크레딧",
      "크레딧 영구 보관",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
      "실시간 처리",
    ],
    ctaText: "구매하기",
  },
  {
    name: "Pro",
    price: 29,
    recommended: true,
    features: [
      "15,000 크레딧",
      "크레딧 영구 보관",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
    ],
    ctaText: "구매하기",
  },
  {
    name: "Enterprise",
    price: 49,
    features: [
      "30,000 크레딧",
      "크레딧 영구 보관",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
      "베타기능(무료)",
    ],
    ctaText: "구매하기",
  },
];

interface PricingCardsProps {
  activeTab: PricingTab;
}

export function PricingCards({ activeTab }: PricingCardsProps) {
  const plans = activeTab === "monthly" ? monthlyPlans : onetimePlans;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      key={activeTab}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1200px] mx-auto px-4"
    >
      {plans.map((plan) => (
        <motion.div
          key={plan.name}
          variants={fadeInUp}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-card p-6 lg:p-7",
            plan.recommended
              ? "pricing-recommended"
              : "border-border opacity-90 hover:opacity-100"
          )}
        >
          {/* 추천 배지 + 상단 그래디언트 */}
          {plan.recommended && (
            <>
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />
              <Badge
                variant="primary"
                className="absolute -top-3 right-5 bg-primary text-white"
              >
                추천
              </Badge>
            </>
          )}

          {/* 플랜명 */}
          <h3 className="text-h4 font-bold text-foreground mb-3">
            {plan.name}
          </h3>

          {/* 가격 */}
          <p className="text-5xl font-black text-primary tabular-nums leading-tight mb-6">
            ${plan.price}
          </p>

          {/* 기능 목록 */}
          <ul className="flex-1 space-y-3 mb-8">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-muted-foreground"
              >
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA 버튼 */}
          <button
            disabled={plan.disabled}
            className={cn(
              "w-full py-3 rounded-xl text-base font-bold transition-all cursor-pointer",
              plan.disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110 btn-glow"
            )}
          >
            {plan.ctaText}
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
