"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

interface SectionWrapperProps {
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function SectionWrapper({ className, children, id }: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeInUp}
      className={cn("py-20 md:py-28 px-4", className)}
    >
      <div className="max-w-6xl mx-auto">{children}</div>
    </motion.section>
  );
}
