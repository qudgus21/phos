"use client";

import { useState, useCallback } from "react";
import { RetouchingInputPanel } from "@/components/sections/retouching/retouching-input-panel";
import { RetouchingResultPanel } from "@/components/sections/retouching/retouching-result-panel";
import { RetouchingSampleSidebar } from "@/components/sections/retouching/retouching-sample-sidebar";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { RetouchingMobileTabs } from "@/components/sections/retouching/retouching-mobile-tabs";
import { cn } from "@/lib/utils";

export default function RetouchingPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [externalImageUrl, setExternalImageUrl] = useState<string | null>(null);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);

  const handleGenerate = useCallback((outputUrls: string[], inputImageUrl?: string | null) => {
    setDisplayUrls(outputUrls);
    setOriginalUrls(outputUrls);
    setBeforeImageUrl(inputImageUrl ?? null);
    setSampleId(null);
    setMobileTab("result");
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[], histInputUrls?: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setBeforeImageUrl(histInputUrls?.[0] ?? null);
    setSampleId(null);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <RetouchingMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

      {/* Main Editor */}
      <div className="flex-1 flex gap-2.5 p-2.5 lg:px-16 xl:px-24 min-h-0">
        <RetouchingSampleSidebar
          selectedSampleId={sampleId}
          onSelectSample={setSampleId}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_200px] gap-2.5 min-h-0">
          {/* Left: Input Panel */}
          <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
            <RetouchingInputPanel
              sampleId={sampleId}
              externalImageUrl={externalImageUrl}
              onGenerate={handleGenerate}
              onGenerateStart={(count, inputImage) => {
                setIsGenerating(true);
                setGeneratingCount(count);
                setGeneratingInputImage(inputImage ?? null);
              }}
              onGenerateEnd={() => {
                setIsGenerating(false);
              }}
            />
          </div>

          {/* Center: Result Panel */}
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <RetouchingResultPanel
              sampleId={sampleId}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              beforeImageUrl={beforeImageUrl}
              isGenerating={isGenerating}
              generatingCount={generatingCount}
              generatingInputImage={generatingInputImage}
              onAddToInput={(src) => {
                setExternalImageUrl(`${src}#t=${Date.now()}`);
                setMobileTab("input");
              }}
            />
          </div>

          {/* Right: History Panel */}
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="retouching"
              refreshKey={historyRefreshKey}
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
