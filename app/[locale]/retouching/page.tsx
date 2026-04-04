"use client";

import { useState, useRef, useCallback } from "react";
import { RetouchingInputPanel, type RetouchingInputPanelHandle } from "@/components/sections/retouching/retouching-input-panel";
import { RetouchingResultPanel } from "@/components/sections/retouching/retouching-result-panel";
import { RetouchingSampleSidebar } from "@/components/sections/retouching/retouching-sample-sidebar";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { RetouchingMobileTabs } from "@/components/sections/retouching/retouching-mobile-tabs";
import { useGenerationRealtime } from "@/hooks/use-generation-realtime";
import { useToast } from "@/components/ui/toast";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import { cn } from "@/lib/utils";

export default function RetouchingPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [showResultLoading, setShowResultLoading] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [generatingScale, setGeneratingScale] = useState(0);
  const [externalImageUrl, setExternalImageUrl] = useState<string | null>(null);
  const inputPanelRef = useRef<RetouchingInputPanelHandle>(null);
  const { toast } = useToast();
  const dict = useDictionary();

  const { isGenerating, trackGeneration } = useGenerationRealtime("retouching", {
    onCompleted: (row) => {
      setShowResultLoading(false);
      setDisplayUrls(row.display_urls);
      setOriginalUrls(row.original_urls);
      setSampleId(null);
      setMobileTab("result");
    },
    onFailed: (row) => {
      setShowResultLoading(false);
      toast(row.error_message ?? dict.common.errors.generationFailed, "error");
      window.dispatchEvent(
        new CustomEvent("credits-updated", { detail: { refresh: true } })
      );
    },
  });

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setSampleId(null);
    setShowResultLoading(false);
    setMobileTab("result");
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <div className="h-[74px] shrink-0" />

      <RetouchingMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

      <div className="flex-1 flex gap-2.5 p-2.5 lg:px-16 xl:px-24 min-h-0">
        <RetouchingSampleSidebar
          inputPanelRef={inputPanelRef}
          selectedSampleId={sampleId}
          onSelectSample={setSampleId}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_200px] gap-2.5 min-h-0">
          <div className={cn("min-h-0 min-w-0", mobileTab !== "input" && "hidden lg:block")}>
            <RetouchingInputPanel
              ref={inputPanelRef}
              sampleId={sampleId}
              externalImageUrl={externalImageUrl}
              isGenerating={isGenerating}
              onSubmit={(inputImage, scale) => {
                setShowResultLoading(true);
                setGeneratingCount(1);
                setGeneratingInputImage(inputImage ?? null);
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
            <RetouchingResultPanel
              sampleId={sampleId}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              isGenerating={showResultLoading}
              generatingCount={generatingCount}
              generatingInputImage={generatingInputImage}
              generatingScale={generatingScale}
              onAddToInput={(src) => {
                setExternalImageUrl(`${src}#t=${Date.now()}`);
                setMobileTab("input");
              }}
            />
          </div>

          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="retouching"
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
