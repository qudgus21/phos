"use client";

import { useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RETOUCHING_SAMPLES } from "@/lib/constants/retouching-samples";

interface RetouchingSampleSidebarProps {
  selectedSampleId: string | null;
  onSelectSample: (id: string | null) => void;
}

export function RetouchingSampleSidebar({
  selectedSampleId,
  onSelectSample,
}: RetouchingSampleSidebarProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelectSample(selectedSampleId === id ? null : id);
    },
    [onSelectSample, selectedSampleId]
  );

  return (
    <aside className="hidden lg:flex flex-col w-[100px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="p-2 shrink-0">
        <div className="w-full text-center px-3 py-2 text-[13px] font-medium text-foreground bg-muted rounded-md">
          샘플
        </div>
      </div>

      {/* Sample List */}
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
        {RETOUCHING_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSelect(sample.id)}
            className={cn(
              "w-full rounded-lg overflow-hidden border transition-colors cursor-pointer",
              selectedSampleId === sample.id
                ? "border-indigo-500 ring-1 ring-indigo-500/50"
                : "border-white/10 hover:border-white/25"
            )}
          >
            <Image
              src={sample.thumbnail}
              alt={sample.label}
              width={200}
              height={200}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </aside>
  );
}
