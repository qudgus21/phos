"use client";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface FaceEditMobileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isGenerating?: boolean;
}

export function FaceEditMobileTabs({
  activeTab,
  onTabChange,
  isGenerating,
}: FaceEditMobileTabsProps) {
  const dict = useDictionary();
  const MOBILE_TABS = [
    { id: "input", label: dict.common.tabs.input },
    { id: "result", label: dict.common.tabs.result },
    { id: "history", label: dict.common.tabs.history },
  ];
  return (
    <div className="flex lg:hidden border-b border-border bg-card/80 shrink-0">
      {MOBILE_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const showDot = tab.id === "result" && isGenerating && !isActive;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex-1 py-2.5 text-[15px] font-semibold transition-colors cursor-pointer",
              isActive
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {showDot && (
              <span className="absolute top-1.5 right-[calc(50%-16px)] w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
