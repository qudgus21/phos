"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "samples", label: "샘플" },
  { id: "favorites", label: "즐겨찾기" },
];

export function ImageEditSampleSidebar() {
  const [activeTab, setActiveTab] = useState("samples");

  return (
    <aside className="hidden lg:flex flex-col w-[100px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      <div className="flex flex-col p-2 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-all cursor-pointer",
              tab.id === activeTab
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2" />
    </aside>
  );
}
