"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface FaqItem {
  question: string;
  answer: string;
}

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border transition-colors",
        isOpen ? "bg-card" : "bg-card/60"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-7 py-5 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-[18px] font-semibold text-foreground text-left">
          {item.question}
        </span>
        <span
          className={cn(
            "text-primary text-base font-semibold transition-transform duration-200 shrink-0 ml-4",
            isOpen ? "rotate-180" : ""
          )}
        >
          ▼
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-5 pt-0">
              <p
                className="text-base text-muted-foreground leading-relaxed [&_strong]:text-primary [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  const dict = useDictionary();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="max-w-[720px] mx-auto px-4 py-20"
    >
      <motion.h3
        variants={fadeInUp}
        className="text-[32px] font-bold text-foreground text-center mb-10"
      >
        {dict.pricing.faq.title}
      </motion.h3>

      <motion.div variants={fadeInUp} className="space-y-3">
        {dict.pricing.faq.items.map((item, idx) => (
          <FaqAccordionItem
            key={idx}
            item={item}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? -1 : idx)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
