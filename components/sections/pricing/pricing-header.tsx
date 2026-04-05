"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/lib/i18n/dictionary-context";

type PricingTab = "monthly" | "onetime";

interface PricingHeaderProps {
  activeTab: PricingTab;
  onTabChange: (tab: PricingTab) => void;
}

export function PricingHeader({ activeTab, onTabChange }: PricingHeaderProps) {
  const dict = useDictionary();

  return (
    <div className="pt-32 pb-10 text-center">
      <h2
        className="text-[43px] font-extrabold text-foreground font-display mb-8"
      >
        {dict.pricing.title}
      </h2>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="inline-flex gap-0"
      >
        <button
          onClick={() => onTabChange("monthly")}
          className={cn(
            "px-10 py-3.5 text-lg font-bold rounded-full transition-all cursor-pointer",
            activeTab === "monthly"
              ? "bg-indigo-600 text-white shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          {dict.pricing.tabs.monthly}
        </button>
        <button
          onClick={() => onTabChange("onetime")}
          className={cn(
            "px-10 py-3.5 text-lg font-bold rounded-full transition-all cursor-pointer",
            activeTab === "onetime"
              ? "bg-indigo-600 text-white shadow-glow-indigo-sm"
              : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          {dict.pricing.tabs.onetime}
        </button>
      </motion.div>
    </div>
  );
}
