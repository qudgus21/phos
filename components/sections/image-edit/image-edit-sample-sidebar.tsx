"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SAMPLES } from "@/lib/constants/samples";

const TABS = [
  { id: "samples", label: "샘플" },
  { id: "favorites", label: "즐겨찾기" },
];

export function ImageEditSampleSidebar() {
  const [activeTab, setActiveTab] = useState("samples");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("sample_id");

  const handleSelect = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (selectedId === id) {
        params.delete("sample_id");
      } else {
        params.set("sample_id", id);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/image-edit", { scroll: false });
    },
    [router, searchParams, selectedId]
  );

  return (
    <aside className="hidden lg:flex flex-col w-[100px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-col p-2 gap-0.5 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full text-center px-3 py-2 text-[13px] font-medium rounded-md transition-all cursor-pointer",
              tab.id === activeTab
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
        {activeTab === "samples" &&
          SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelect(sample.id)}
              className={cn(
                "w-full aspect-square rounded-lg overflow-hidden border transition-colors cursor-pointer",
                selectedId === sample.id
                  ? "border-indigo-500 ring-1 ring-indigo-500/50"
                  : "border-white/10 hover:border-white/25"
              )}
            >
              <Image
                src={sample.thumbnail}
                alt={sample.alt}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}

        {activeTab === "favorites" && (
          <p className="text-[11px] text-muted-foreground text-center pt-4">
            저장된 항목 없음
          </p>
        )}
      </div>
    </aside>
  );
}
