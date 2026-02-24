"use client";

import { cn } from "@/lib/utils";

interface RetouchingMobileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MOBILE_TABS = [
  { id: "input", label: "설정" },
  { id: "result", label: "결과" },
  { id: "history", label: "히스토리" },
];

export function RetouchingMobileTabs({
  activeTab,
  onTabChange,
}: RetouchingMobileTabsProps) {
  return (
    <div className="flex lg:hidden border-b border-border bg-card/80 shrink-0">
      {MOBILE_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-[15px] font-semibold transition-colors cursor-pointer",
              isActive
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
