"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Gender = "female" | "male";

export interface SampleData {
  id: string;
  gender: Gender;
  label: string;
  image: string;
}

const SAMPLES: SampleData[] = [
  { id: "f1", gender: "female", label: "여성", image: "" },
  { id: "m1", gender: "male", label: "남성", image: "" },
  { id: "f2", gender: "female", label: "여성", image: "" },
  { id: "f3", gender: "female", label: "여성", image: "" },
  { id: "f4", gender: "female", label: "여성", image: "" },
];

const gradientPlaceholders = [
  "from-rose-300 via-amber-200 to-pink-300",
  "from-slate-300 via-stone-200 to-zinc-300",
  "from-amber-200 via-rose-200 to-pink-200",
  "from-rose-200 via-pink-200 to-fuchsia-200",
  "from-amber-100 via-rose-200 to-pink-300",
];

interface FaceEditSampleSidebarProps {
  onSampleSelect?: (sample: SampleData) => void;
}

export function FaceEditSampleSidebar({
  onSampleSelect,
}: FaceEditSampleSidebarProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (sample: SampleData) => {
    setSelected(sample.id);
    onSampleSelect?.(sample);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[140px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[15px] font-bold text-foreground">샘플</h2>
      </div>

      {/* Sample List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {SAMPLES.map((sample, idx) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSelect(sample)}
            className={cn(
              "w-full flex flex-col items-center gap-1.5 cursor-pointer group"
            )}
          >
            {/* Image Placeholder */}
            <div
              className={cn(
                "w-full aspect-square rounded-lg bg-gradient-to-br overflow-hidden border-2 transition-all",
                gradientPlaceholders[idx % gradientPlaceholders.length],
                selected === sample.id
                  ? "border-primary shadow-glow-indigo-sm"
                  : "border-transparent group-hover:border-white/20"
              )}
            />
            {/* Gender Badge — D: 이모지 제거 */}
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full",
                "bg-primary/15 text-[#A5B4FC]"
              )}
            >
              {sample.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
