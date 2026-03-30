"use client";

import { useState, useRef, useCallback } from "react";
import { FaceEditSampleSidebar } from "@/components/sections/face-edit/face-edit-sample-sidebar";
import { FaceEditInputPanel, type FaceEditInputPanelHandle } from "@/components/sections/face-edit/face-edit-input-panel";
import { FaceEditResultPanel } from "@/components/sections/face-edit/face-edit-result-panel";
import { ImageEditHistoryPanel } from "@/components/sections/image-edit/image-edit-history-panel";
import { FaceEditMobileTabs } from "@/components/sections/face-edit/face-edit-mobile-tabs";
import { useGenerationRealtime } from "@/hooks/use-generation-realtime";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function FaceEditPage() {
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("input");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [showResultLoading, setShowResultLoading] = useState(false);
  const [generatingInputImage, setGeneratingInputImage] = useState<string | null>(null);
  const [generatingScale, setGeneratingScale] = useState<string>("auto");
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const inputPanelRef = useRef<FaceEditInputPanelHandle>(null);
  const { toast } = useToast();

  const { isGenerating, trackGeneration } = useGenerationRealtime("face-edit", {
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

  const handleSampleSelect = useCallback((id: string | null) => {
    setSampleId(id);
    setDisplayUrls([]);
    setOriginalUrls([]);
    setBeforeImage(null);
    setGeneratingInputImage(null);
    setShowResultLoading(false);
  }, []);

  const handleHistorySelect = useCallback((histDisplayUrls: string[], histOriginalUrls: string[], inputUrls?: string[]) => {
    setDisplayUrls(histDisplayUrls);
    setOriginalUrls(histOriginalUrls);
    setBeforeImage(inputUrls?.[0] ?? null);
    setGeneratingInputImage(null);
    setShowResultLoading(false);
    setMobileTab("result");
  }, []);

  const handleAddToInput = useCallback((src: string) => {
    inputPanelRef.current?.addImageFromUrl(src);
  }, []);

  return (
    <div className="editor-theme h-screen overflow-hidden bg-background flex flex-col">
      <div className="h-[74px] shrink-0" />

      <FaceEditMobileTabs activeTab={mobileTab} onTabChange={setMobileTab} isGenerating={isGenerating} />

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
              isGenerating={isGenerating}
              onSubmit={(inputImage, scale) => {
                setShowResultLoading(true);
                setGeneratingInputImage(inputImage);
                setGeneratingScale(scale ?? "auto");
                setMobileTab("result");
              }}
              onSubmitError={() => setShowResultLoading(false)}
              onPendingStart={(historyId) => {
                trackGeneration(historyId);
              }}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "result" && "hidden lg:block")}>
            <FaceEditResultPanel
              sampleId={sampleId}
              displayUrls={displayUrls}
              originalUrls={originalUrls}
              isGenerating={showResultLoading}
              generatingInputImage={generatingInputImage}
              generatingScale={generatingScale}
              historyBeforeImage={beforeImage}
              onAddToInput={handleAddToInput}
            />
          </div>
          <div className={cn("min-h-0", mobileTab !== "history" && "hidden lg:block")}>
            <ImageEditHistoryPanel
              featureType="face-edit"
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
