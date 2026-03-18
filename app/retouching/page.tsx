"use client";

import { useState, useCallback } from "react";
import { RetouchingInputPanel } from "@/components/sections/retouching/retouching-input-panel";
import { RetouchingResultPanel } from "@/components/sections/retouching/retouching-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { RetouchingMobileTabs } from "@/components/sections/retouching/retouching-mobile-tabs";
import { cn } from "@/lib/utils";

export default function RetouchingPage() {
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [externalImageUrl, setExternalImageUrl] = useState<string | null>(null);

  const handleGenerate = useCallback((outputUrls: string[]) => {
    setDisplayUrls(outputUrls);
    setOriginalUrls(outputUrls);
    setMobileTab("result");
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      {/* GNB offset */}
      <div className="h-[74px] shrink-0" />

      {/* Mobile Tabs */}
      <RetouchingMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

      {/* Main Editor — grid layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr_200px] gap-2.5 p-2.5 lg:px-16 xl:px-24 min-h-0">
        {/* Left: Input Panel */}
        <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
          <RetouchingInputPanel
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
            displayUrls={displayUrls}
            originalUrls={originalUrls}
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
  );
}
