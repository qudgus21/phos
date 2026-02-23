"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: "default" | "compact";
  className?: string;
}

export function TabGroup({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  className,
}: TabGroupProps) {
  return (
    <div className={cn("flex", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "font-semibold transition-colors cursor-pointer",
              variant === "default" &&
                "px-4 py-2.5 text-[15px]",
              variant === "compact" &&
                "px-3 py-2 text-[13px]",
              isActive
                ? "text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
