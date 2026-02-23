"use client";

import { useState, useCallback } from "react";
import { Navigation } from "@/components/sections/navigation";
import {
  FaceEditSampleSidebar,
  type SampleData,
} from "@/components/sections/face-edit/face-edit-sample-sidebar";
import { FaceEditEditorPanel } from "@/components/sections/face-edit/face-edit-editor-panel";
import { FaceEditHistoryPanel } from "@/components/sections/face-edit/face-edit-history-panel";
import { FaceEditMobileTabs } from "@/components/sections/face-edit/face-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function FaceEditPage() {
  const [mobileTab, setMobileTab] = useState("editor");
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [sampleGender, setSampleGender] = useState<
    "female" | "male" | null
  >(null);

  const handleSampleSelect = useCallback((sample: SampleData) => {
    /* 실제 이미지 URL이 있으면 사용, 없으면 gradient placeholder 대신
       샘플 ID를 marker로 전달 (추후 실제 이미지로 교체) */
    setSampleImage(sample.image || `sample:${sample.id}`);
    setSampleGender(sample.gender);
  }, []);

  const handleSampleConsumed = useCallback(() => {
    /* 에디터가 샘플을 소비하면 리셋 (중복 전달 방지) */
    setSampleImage(null);
    setSampleGender(null);
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <Navigation />

      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <FaceEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 px-6 lg:px-12 xl:px-20 py-2.5 min-h-0 max-w-[1400px] mx-auto w-full">
        <FaceEditSampleSidebar onSampleSelect={handleSampleSelect} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2.5 min-h-0">
          <div
            className={cn(
              "min-h-0 min-w-0",
              mobileTab !== "editor" && "hidden lg:block"
            )}
          >
            <FaceEditEditorPanel
              sampleImage={sampleImage}
              sampleGender={sampleGender}
              onSampleConsumed={handleSampleConsumed}
            />
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
