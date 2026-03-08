"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { ImageEditSampleSidebar } from "@/components/sections/image-edit/image-edit-sample-sidebar";
import { ImageEditInputPanel, type ImageEditInputPanelHandle } from "@/components/sections/image-edit/image-edit-input-panel";
import { ImageEditResultPanel } from "@/components/sections/image-edit/image-edit-result-panel";
import { ImageEditHistoryPanel, type PendingHistoryItem } from "@/components/sections/image-edit/image-edit-history-panel";
import { ImageEditMobileTabs } from "@/components/sections/image-edit/image-edit-mobile-tabs";
import { cn } from "@/lib/utils";

export default function ImageEditPage() {
  const [mobileTab, setMobileTab] = useState("input");
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [pendingItem, setPendingItem] = useState<PendingHistoryItem | null>(null);
  const inputPanelRef = useRef<ImageEditInputPanelHandle>(null);

  const addOutputToInput = useCallback((src: string) => {
    inputPanelRef.current?.addImageFromUrl(src);
  }, []);

  const handleGenerate = useCallback((urls: string[], prompt: string) => {
    setGeneratedUrls(urls);
    setMobileTab("result");
    // 낙관적 업데이트: 즉시 히스토리에 pending 항목 추가
    setPendingItem({ prompt, outputUrls: urls });
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const handleHistorySelect = useCallback((urls: string[]) => {
    setGeneratedUrls(urls);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
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
              <ImageEditInputPanel
                ref={inputPanelRef}
                onGenerate={handleGenerate}
                onGenerateStart={(count, firstImageUrl) => {
                  setIsGenerating(true);
                  setGeneratingCount(count);
                  setGeneratingInputImage(firstImageUrl);
                }}
                onGenerateEnd={() => {
                  setIsGenerating(false);
                  // Storage 업로드는 비동기 — 2초 간격으로 최대 5회 폴링
                  let attempts = 0;
                  const poll = setInterval(() => {
                    attempts++;
                    setHistoryRefreshKey((k) => k + 1);
                    if (attempts >= 5) clearInterval(poll);
                  }, 2000);
                }}
              />
            </Suspense>
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <Suspense>
              <ImageEditResultPanel
                onAddToInput={addOutputToInput}
                generatedUrls={generatedUrls}
                isGenerating={isGenerating}
                generatingCount={generatingCount}
                generatingInputImage={generatingInputImage}
              />
            </Suspense>
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="image-edit"
              refreshKey={historyRefreshKey}
              pendingItem={pendingItem}
              onPendingResolved={() => setPendingItem(null)}
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
