"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { Navigation } from "@/components/sections/navigation";
import { ImageEditSampleSidebar } from "@/components/sections/image-edit/image-edit-sample-sidebar";
import { ImageEditInputPanel, type ImageEditInputPanelHandle } from "@/components/sections/image-edit/image-edit-input-panel";
import { ImageEditResultPanel } from "@/components/sections/image-edit/image-edit-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { ImageEditMobileTabs } from "@/components/sections/image-edit/image-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function ImageEditPage() {
  const [mobileTab, setMobileTab] = useState("input");
  const inputPanelRef = useRef<ImageEditInputPanelHandle>(null);

  const addOutputToInput = useCallback((src: string) => {
    inputPanelRef.current?.addImageFromUrl(src);
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <Navigation />

      {/* GNB offset — nav py-4(16*2) + logo h-10(40) + progress 2px ≈ 74px */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <ImageEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 p-2.5 min-h-0">
        <Suspense>
          <ImageEditSampleSidebar />
        </Suspense>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr_200px] gap-2.5 min-h-0">
          <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
            <Suspense>
              <ImageEditInputPanel ref={inputPanelRef} />
            </Suspense>
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <Suspense>
              <ImageEditResultPanel onAddToInput={addOutputToInput} />
            </Suspense>
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel />
          </div>
        </div>
      </div>

    </div>
  );
}
