"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PricingTab = "monthly" | "onetime";

const monthlyPlans = [
  {
    name: "Basic",
    description: "기본",
    price: 9,
    recommended: false,
    features: [
      "2,000 크레딧",
      "업스케일링",
      "피부 보정 (기본)",
      "고해상도 변환",
      "실시간 처리",
    ],
  },
  {
    name: "Pro",
    description: "전체 기능",
    price: 19,
    recommended: true,
    features: [
      "4,400 크레딧",
      "업스케일링",
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
    price: 29,
    recommended: false,
    features: [
      "7,100 크레딧",
      "업스케일링",
      "피부 보정 (기본)",
      "피부 보정 (메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "베타 기능 무료 제공",
    ],
  },
];

const onetimePacks = [
  { price: 5, credits: "700" },
  { price: 10, credits: "1,500" },
  { price: 15, credits: "2,400" },
  { price: 20, credits: "3,300" },
  { price: 30, credits: "5,100" },
];

export function Pricing() {
  const [activeTab, setActiveTab] = useState<PricingTab>("monthly");

  return (
    <SectionWrapper id="pricing">
      {/* 섹션 헤더 */}
      <motion.div variants={fadeInUp} className="text-center mb-6">
        <h2 className="text-3xl md:text-h2 font-black text-foreground font-display">
          요금제
        </h2>
      </motion.div>

      {/* 월 구독 / 단건구매 탭 */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-center gap-0 mb-8"
      >
        <button
          onClick={() => setActiveTab("monthly")}
          className={cn(
            "px-8 py-3 text-sm font-semibold rounded-full transition-all cursor-pointer",
            activeTab === "monthly"
              ? "bg-primary text-primary-foreground shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          월 구독
        </button>
        <button
          onClick={() => setActiveTab("onetime")}
          className={cn(
            "px-8 py-3 text-sm font-semibold rounded-full transition-all cursor-pointer",
            activeTab === "onetime"
              ? "bg-primary text-primary-foreground shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          단건구매
        </button>
      </motion.div>

      {activeTab === "monthly" ? (
        /* 월 구독 카드 */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          key="monthly"
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {monthlyPlans.map((plan) => (
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

              <h3 className="text-h4 font-bold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-primary tabular-nums">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground text-sm">/월</span>
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
                시작하기
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* 단건구매 크레딧팩 */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key="onetime"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto"
        >
          {onetimePacks.map((pack) => (
            <motion.div
              key={pack.price}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 opacity-90 hover:opacity-100 transition-all"
            >
              <p className="text-4xl font-black text-primary tabular-nums leading-tight mb-3">
                ${pack.price}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {pack.credits} 크레딧
              </p>
              <Link
                href="/pricing"
                className="w-full text-center py-3 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110"
              >
                구매하기
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

    </SectionWrapper>
  );
}
