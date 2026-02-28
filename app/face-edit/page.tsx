"use client";

import { Suspense, useState } from "react";
import { FaceEditSampleSidebar } from "@/components/sections/face-edit/face-edit-sample-sidebar";
import { FaceEditEditorPanel } from "@/components/sections/face-edit/face-edit-editor-panel";
import { FaceEditHistoryPanel } from "@/components/sections/face-edit/face-edit-history-panel";
import { FaceEditMobileTabs } from "@/components/sections/face-edit/face-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function FaceEditPage() {
  const [mobileTab, setMobileTab] = useState("editor");

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <FaceEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 px-6 lg:px-12 xl:px-20 py-2.5 min-h-0 max-w-[1400px] mx-auto w-full">
        <Suspense>
          <FaceEditSampleSidebar />
        </Suspense>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2.5 min-h-0">
          <div
            className={cn(
              "min-h-0 min-w-0",
              mobileTab !== "editor" && "hidden lg:block"
            )}
          >
            <Suspense>
              <FaceEditEditorPanel />
            </Suspense>
          </div>
          <div
            className={cn(
              "min-h-0",
              mobileTab !== "history" && "hidden lg:block"
            )}
          >
            <FaceEditHistoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
