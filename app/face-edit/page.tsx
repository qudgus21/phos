"use client";

import { useState, useRef, useCallback } from "react";
import { FaceEditSampleSidebar } from "@/components/sections/face-edit/face-edit-sample-sidebar";
import { FaceEditInputPanel, type FaceEditInputPanelHandle } from "@/components/sections/face-edit/face-edit-input-panel";
import { FaceEditResultPanel } from "@/components/sections/face-edit/face-edit-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { FaceEditMobileTabs } from "@/components/sections/face-edit/face-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function FaceEditPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [generatingScale, setGeneratingScale] = useState<string>("auto");
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const inputPanelRef = useRef<FaceEditInputPanelHandle>(null);

  const handleGenerate = useCallback((outputUrls: string[]) => {
    setDisplayUrls(outputUrls);
    setOriginalUrls(outputUrls);
    setMobileTab("result");
  }, []);

  const handleSampleSelect = useCallback((id: string | null) => {
    setSampleId(id);
    // 샘플 선택 시 히스토리 결과 초기화 → 샘플 before/after로 전환
    setDisplayUrls([]);
    setOriginalUrls([]);
    setBeforeImage(null);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[], inputUrls?: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setBeforeImage(inputUrls?.[0] ?? null);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <FaceEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 p-2.5 min-h-0">
        <FaceEditSampleSidebar
          inputPanelRef={inputPanelRef}
          selectedSampleId={sampleId}
          onSelectSample={handleSampleSelect}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr_200px] gap-2.5 min-h-0">
          <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
            <FaceEditInputPanel
              ref={inputPanelRef}
              sampleId={sampleId}
              onGenerate={handleGenerate}
              onGenerateStart={(inputImage, scale) => {
                setIsGenerating(true);
                setGeneratingInputImage(inputImage);
                setGeneratingScale(scale ?? "auto");
              }}
              onGenerateEnd={() => {
                setIsGenerating(false);
              }}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <FaceEditResultPanel
              sampleId={sampleId}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              isGenerating={isGenerating}
              generatingInputImage={generatingInputImage}
              generatingScale={generatingScale}
              historyBeforeImage={beforeImage}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="face-edit"
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
