"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
      "120 크레딧",
      "회원가입 시 120 크레딧 지급",
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
      "2,000 크레딧",
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
      "4,400 크레딧",
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
      "7,100 크레딧",
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

interface CreditPack {
  price: number;
  credits: string;
}

const onetimePacks: CreditPack[] = [
  { price: 5, credits: "700" },
  { price: 10, credits: "1,500" },
  { price: 15, credits: "2,400" },
  { price: 20, credits: "3,300" },
  { price: 30, credits: "5,100" },
];

interface PricingCardsProps {
  activeTab: PricingTab;
}

export function PricingCards({ activeTab }: PricingCardsProps) {
  const { requireAuth, loginModal } = useRequireAuth();

  const handlePurchase = () => {
    requireAuth(() => {
      // TODO: 결제 플로우
    });
  };

  if (activeTab === "onetime") {
    return (
      <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        key="onetime"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-[1000px] mx-auto px-4"
      >
        {onetimePacks.map((pack) => (
          <motion.div
            key={pack.price}
            variants={fadeInUp}
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 lg:p-7 opacity-90 hover:opacity-100 transition-opacity"
          >
            <p className="text-4xl font-black text-primary tabular-nums leading-tight mb-3">
              ${pack.price}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {pack.credits} 크레딧
            </p>
            <button
              onClick={handlePurchase}
              className="w-full py-3 rounded-xl text-base font-bold transition-all cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110 btn-glow"
            >
              구매하기
            </button>
          </motion.div>
        ))}
      </motion.div>
      {loginModal}
      </>
    );
  }

  return (
    <>
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      key="monthly"
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1200px] mx-auto px-4"
    >
      {monthlyPlans.map((plan) => (
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
                className="flex items-start gap-2 text-foreground"
              >
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA 버튼 */}
          <button
            disabled={plan.disabled}
            onClick={plan.disabled ? undefined : handlePurchase}
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
    {loginModal}
    </>
  );
}
