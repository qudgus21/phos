"use client";

import { useState, useRef, useCallback } from "react";
import { ImageEditSampleSidebar } from "@/components/sections/image-edit/image-edit-sample-sidebar";
import { ImageEditInputPanel, type ImageEditInputPanelHandle } from "@/components/sections/image-edit/image-edit-input-panel";
import { ImageEditResultPanel } from "@/components/sections/image-edit/image-edit-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { ImageEditMobileTabs } from "@/components/sections/image-edit/image-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function ImageEditPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [generatingScale, setGeneratingScale] = useState(0);
  const inputPanelRef = useRef<ImageEditInputPanelHandle>(null);

  const addOutputToInput = useCallback((src: string) => {
    inputPanelRef.current?.addImageFromUrl(src);
  }, []);

  const handleGenerate = useCallback((outputUrls: string[]) => {
    // 생성 직후에는 임시 URL을 display로 표시 (Lambda가 WebP 처리 완료하면 히스토리에서 갱신됨)
    setDisplayUrls(outputUrls);
    setOriginalUrls(outputUrls);
    setMobileTab("result");
  }, []);

  const handleSampleSelect = useCallback((id: string | null) => {
    setSampleId(id);
    // 샘플 선택 시 히스토리 결과 초기화 → 샘플 before/after로 전환
    setDisplayUrls([]);
    setOriginalUrls([]);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      {/* GNB offset — nav py-4(16*2) + logo h-10(40) + progress 2px ≈ 74px */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <ImageEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 p-2.5 min-h-0">
        <ImageEditSampleSidebar
          inputPanelRef={inputPanelRef}
          selectedSampleId={sampleId}
          onSelectSample={handleSampleSelect}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr_200px] gap-2.5 min-h-0">
          <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
            <ImageEditInputPanel
              ref={inputPanelRef}
              sampleId={sampleId}
              onGenerate={handleGenerate}
              onGenerateStart={(count, firstImageUrl, scale) => {
                setIsGenerating(true);
                setGeneratingCount(count);
                setGeneratingInputImage(firstImageUrl);
                setGeneratingScale(scale ?? 0);
              }}
              onGenerateEnd={() => {
                setIsGenerating(false);
              }}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <ImageEditResultPanel
              sampleId={sampleId}
              onAddToInput={addOutputToInput}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              isGenerating={isGenerating}
              generatingCount={generatingCount}
              generatingInputImage={generatingInputImage}
              generatingScale={generatingScale}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="image-edit"
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
