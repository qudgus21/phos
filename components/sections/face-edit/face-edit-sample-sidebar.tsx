"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Sample {
  id: string;
  gender: "female" | "male";
  label: string;
}

const SAMPLES: Sample[] = [
  { id: "f1", gender: "female", label: "여성" },
  { id: "m1", gender: "male", label: "남성" },
  { id: "f2", gender: "female", label: "여성" },
  { id: "f3", gender: "female", label: "여성" },
  { id: "f4", gender: "female", label: "여성" },
];

const genderEmoji: Record<string, string> = {
  female: "👩",
  male: "👨",
};

const gradientPlaceholders = [
  "from-rose-300 via-amber-200 to-pink-300",
  "from-slate-300 via-stone-200 to-zinc-300",
  "from-amber-200 via-rose-200 to-pink-200",
  "from-rose-200 via-pink-200 to-fuchsia-200",
  "from-amber-100 via-rose-200 to-pink-300",
];

export function FaceEditSampleSidebar() {
  const [selected, setSelected] = useState<string | null>(null);

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
            onClick={() => setSelected(sample.id)}
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
            {/* Gender Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full",
                "bg-primary/15 text-[#A5B4FC]"
              )}
            >
              {genderEmoji[sample.gender]} {sample.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
