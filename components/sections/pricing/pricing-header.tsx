"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

type PricingTab = "monthly" | "onetime";

interface PricingHeaderProps {
  activeTab: PricingTab;
  onTabChange: (tab: PricingTab) => void;
}

export function PricingHeader({ activeTab, onTabChange }: PricingHeaderProps) {
  return (
    <div className="pt-32 pb-10 text-center">
      <motion.h2
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-[43px] font-extrabold text-foreground font-display mb-8"
      >
        요금제
      </motion.h2>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="inline-flex gap-0"
      >
        <button
          onClick={() => onTabChange("monthly")}
          className={cn(
            "px-10 py-3.5 text-lg font-semibold rounded-full transition-all cursor-pointer",
            activeTab === "monthly"
              ? "bg-primary text-primary-foreground shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          월 구독
        </button>
        <button
          onClick={() => onTabChange("onetime")}
          className={cn(
            "px-10 py-3.5 text-lg font-semibold rounded-full transition-all cursor-pointer",
            activeTab === "onetime"
              ? "bg-primary text-primary-foreground shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          단건구매
        </button>
      </motion.div>
    </div>
  );
}
