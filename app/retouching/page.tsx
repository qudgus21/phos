"use client";

import { useState } from "react";
import { Navigation } from "@/components/sections/navigation";
import { RetouchingInputPanel } from "@/components/sections/retouching/retouching-input-panel";
import { RetouchingResultPanel } from "@/components/sections/retouching/retouching-result-panel";
import { RetouchingHistoryPanel } from "@/components/sections/retouching/retouching-history-panel";
import { RetouchingMobileTabs } from "@/components/sections/retouching/retouching-mobile-tabs";
import { cn } from "@/lib/utils";

export default function RetouchingPage() {
  const [mobileTab, setMobileTab] = useState("input");

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <Navigation />

      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <RetouchingMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Main Editor — 3 column layout */}
      <div className="flex-1 flex gap-2.5 p-2.5 min-h-0">
        {/* Left: Input Panel */}
        <div
          className={cn(
            "w-[420px] shrink-0 min-h-0",
            mobileTab !== "input" && "hidden lg:block"
          )}
        >
          <RetouchingInputPanel />
        </div>

        {/* Center: Result Panel */}
        <div
          className={cn(
            "flex-1 min-h-0 min-w-0",
            mobileTab !== "result" && "hidden lg:block"
          )}
        >
          <RetouchingResultPanel />
        </div>

        {/* Right: History Panel */}
        <div
          className={cn(
            "w-[220px] shrink-0 min-h-0",
            mobileTab !== "history" && "hidden lg:block"
          )}
        >
          <RetouchingHistoryPanel />
        </div>
      </div>
    </div>
  );
}
