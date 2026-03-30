"use client";

import { useState, useRef, useCallback } from "react";
import { ImageEditSampleSidebar } from "@/components/sections/image-edit/image-edit-sample-sidebar";
import { ImageEditInputPanel, type ImageEditInputPanelHandle } from "@/components/sections/image-edit/image-edit-input-panel";
import { ImageEditResultPanel } from "@/components/sections/image-edit/image-edit-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { ImageEditMobileTabs } from "@/components/sections/image-edit/image-edit-mobile-tabs";
import { useGenerationRealtime } from "@/hooks/use-generation-realtime";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function ImageEditPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [showResultLoading, setShowResultLoading] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [generatingScale, setGeneratingScale] = useState(0);
  const inputPanelRef = useRef<ImageEditInputPanelHandle>(null);
  const { toast } = useToast();

  const { isGenerating, trackGeneration } = useGenerationRealtime("image-edit", {
    onCompleted: (row) => {
      setShowResultLoading(false);
      setDisplayUrls(row.display_urls);
      setOriginalUrls(row.original_urls);
      setMobileTab("result");
    },
    onFailed: (row) => {
      setShowResultLoading(false);
      toast(row.error_message ?? "생성에 실패했습니다", "error");
      window.dispatchEvent(
        new CustomEvent("credits-updated", { detail: { refresh: true } })
      );
    },
  });

  const addOutputToInput = useCallback((src: string) => {
    inputPanelRef.current?.addImageFromUrl(src);
  }, []);

  const handleSampleSelect = useCallback((id: string | null) => {
    setSampleId(id);
    setDisplayUrls([]);
    setOriginalUrls([]);
    setShowResultLoading(false);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setShowResultLoading(false);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <div className="h-[74px] shrink-0" />

      <ImageEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

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
              isGenerating={isGenerating}
              onSubmit={(count, firstImageUrl, scale) => {
                setShowResultLoading(true);
                setGeneratingCount(count);
                setGeneratingInputImage(firstImageUrl);
                setGeneratingScale(scale ?? 0);
                setMobileTab("result");
              }}
              onSubmitError={() => setShowResultLoading(false)}
              onPendingStart={(historyId) => {
                trackGeneration(historyId);
              }}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <ImageEditResultPanel
              sampleId={sampleId}
              onAddToInput={addOutputToInput}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              isGenerating={showResultLoading}
              generatingCount={generatingCount}
              generatingInputImage={generatingInputImage}
              generatingScale={generatingScale}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="image-edit"
              onSelect={handleHistorySelect}
              onSelectPending={(inputUrls) => {
                setShowResultLoading(true);
                setGeneratingInputImage(inputUrls[0] ?? null);
                setMobileTab("result");
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
