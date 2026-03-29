"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Paintbrush, Upload, RefreshCw, Trash2, Zap, Loader2, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { FaceEditMaskEditor } from "./face-edit-mask-editor";
import { FACE_EDIT_SAMPLES } from "./face-edit-sample-sidebar";
import { prependHistoryItem } from "@/hooks/use-history";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { createClient } from "@/lib/supabase/client";
import { compressImageForFavorite } from "@/lib/utils/compress-image";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const SCALE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "1", label: "1K" },
  { value: "2", label: "2K" },
  { value: "3", label: "3K" },
  { value: "4", label: "4K" },
];

const CREDIT_COST = 40;

const sliderThumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

export interface FaceEditInputPanelHandle {
  loadSample: (sampleId: string) => void;
  loadFavorite: (fav: {
    metadata: Record<string, unknown>;
    scale: number;
    reference_image_urls: string[];
  }) => void;
  getCurrentSettings: () => {
    gender: "female" | "male";
    strength: number;
    scale: string;
    image: File | string | null;
    maskBlob: Blob | null;
  };
}

interface FaceEditInputPanelProps {
  sampleId?: string | null;
  onGenerate?: (outputUrls: string[]) => void;
  onGenerateStart?: (inputImage: string | null, scale?: string) => void;
  onGenerateEnd?: () => void;
}

export const FaceEditInputPanel = forwardRef<FaceEditInputPanelHandle, FaceEditInputPanelProps>(function FaceEditInputPanel({ sampleId, onGenerate, onGenerateStart, onGenerateEnd }, ref) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { requireAuth, loginModal } = useRequireAuth();
  const activeSample = FACE_EDIT_SAMPLES.find((s) => s.id === sampleId);

  const [gender, setGender] = useState<"female" | "male">("female");
  const [strength, setStrength] = useState(1);
  const [scale, setScale] = useState<string>("auto");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imgMaxH, setImgMaxH] = useState<number | undefined>(undefined);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSampleIdRef = useRef<string | null | undefined>(null);

  /* 이미지 영역 max-height = width (1:1 제한) */
  useEffect(() => {
    const el = imgContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setImgMaxH(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 샘플 선택 시 반영 */
  useEffect(() => {
    if (sampleId === prevSampleIdRef.current) return;
    prevSampleIdRef.current = sampleId;

    if (activeSample) {
      setUploadedImage(activeSample.before);
      setUploadedFile(null);
      setFileName("샘플 이미지");
      setGender(activeSample.settings.gender);
      setStrength(activeSample.settings.strength);
      setScale(String(activeSample.settings.scale));

      if (activeSample.mask) {
        fetch(activeSample.mask)
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setMaskDataUrl(reader.result as string);
              setMaskBlob(blob);
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            setMaskDataUrl(null);
            setMaskBlob(null);
          });
      } else {
        setMaskDataUrl(null);
        setMaskBlob(null);
      }
    }
  }, [sampleId, activeSample]);

  const hasImage = !!uploadedImage;
  const hasMask = !!maskDataUrl;

  useImperativeHandle(ref, () => ({
    loadSample: async (id: string) => {
      const sample = FACE_EDIT_SAMPLES.find((s) => s.id === id);
      if (sample) {
        setUploadedImage(sample.before);
        setUploadedFile(null);
        setFileName("샘플 이미지");
        setGender(sample.settings.gender);
        setStrength(sample.settings.strength);
        setScale(String(sample.settings.scale));

        if (sample.mask) {
          try {
            const res = await fetch(sample.mask);
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setMaskDataUrl(dataUrl);
            setMaskBlob(blob);
          } catch {
            setMaskDataUrl(null);
            setMaskBlob(null);
          }
        } else {
          setMaskDataUrl(null);
          setMaskBlob(null);
        }
      }
    },
    loadFavorite: (fav) => {
      const meta = fav.metadata ?? {};
      if (meta.gender === "female" || meta.gender === "male") setGender(meta.gender);
      if (typeof meta.strength === "number") setStrength(meta.strength);
      if (typeof fav.scale === "number" && fav.scale >= 1) setScale(String(fav.scale));
      if (typeof meta.scale === "string") setScale(meta.scale);
      if (fav.reference_image_urls?.length > 0) {
        setUploadedImage(fav.reference_image_urls[0]);
        setUploadedFile(null);
        setFileName("즐겨찾기 이미지");
      }
      setMaskDataUrl(null);
      setMaskBlob(null);
      toast("즐겨찾기 설정을 불러왔습니다", "success");
    },
    getCurrentSettings: () => ({
      gender,
      strength,
      scale,
      image: uploadedFile ?? uploadedImage,
      maskBlob,
    }),
  }), [gender, strength, scale, uploadedFile, uploadedImage, maskBlob, toast]);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadedFile(file);
      setFileName(file.name);
      setMaskDataUrl(null);
      setMaskBlob(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && ACCEPTED_TYPES.includes(file.type)) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setFileName(null);
    setMaskDataUrl(null);
    setMaskBlob(null);
    prevSampleIdRef.current = null;
  }, []);

  const handleMaskSave = useCallback((dataUrl: string | null, blob: Blob | null) => {
    setMaskDataUrl(dataUrl);
    setMaskBlob(blob);
  }, []);

  /* 생성 중 페이지 이탈 경고 */
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  /* Cmd+Enter 단축키 */
  const handleGenerate = useCallback(async () => {
    if (!hasImage) {
      toast("이미지를 업로드해주세요", "warning");
      return;
    }
    if (!hasMask) {
      toast("변경할 영역을 선택해주세요", "warning");
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    onGenerateStart?.(uploadedImage, scale);
    window.dispatchEvent(
      new CustomEvent("credits-updated", { detail: { delta: -CREDIT_COST } })
    );

    try {
      // 입력 이미지를 WebP 압축 → Supabase Storage 영구 업로드
      let permanentInputUrl: string | null = null;
      if (uploadedImage) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const compressed = await compressImageForFavorite(
            uploadedFile ?? uploadedImage
          );
          const path = `inputs/${user.id}/${Date.now()}.webp`;
          const { error: uploadErr } = await supabase.storage
            .from("generation-outputs")
            .upload(path, compressed, { contentType: "image/webp", upsert: false });
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from("generation-outputs")
              .getPublicUrl(path);
            permanentInputUrl = publicUrl;
          }
        }
      }

      const fd = new FormData();
      fd.append("gender", gender);
      fd.append("strength", String(strength));
      fd.append("scale", String(scale));

      // 영구 URL이 있으면 API에도 전달 (히스토리 input_urls에 저장)
      if (permanentInputUrl) {
        fd.append("inputImageUrl", permanentInputUrl);
      }

      // 이미지
      if (uploadedFile) {
        fd.append("image", uploadedFile);
      } else if (uploadedImage?.startsWith("http")) {
        fd.append("image", uploadedImage);
      } else if (uploadedImage?.startsWith("/")) {
        const r = await fetch(uploadedImage);
        const blob = await r.blob();
        const ext = blob.type.split("/")[1] || "png";
        fd.append("image", new File([blob], `input.${ext}`, { type: blob.type }));
      } else if (uploadedImage?.startsWith("data:")) {
        const r = await fetch(uploadedImage);
        const blob = await r.blob();
        fd.append("image", new File([blob], "input.png", { type: blob.type }));
      }

      // 마스크
      if (maskBlob) {
        fd.append("mask", new File([maskBlob], "mask.png", { type: "image/png" }));
      }

      const res = await fetch("/api/face-edit/generate", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? "생성에 실패했습니다");
      }

      const inputUrlForHistory = permanentInputUrl ?? (uploadedImage?.startsWith("http") ? uploadedImage : null);
      prependHistoryItem(queryClient, "face-edit", {
        id: data.data.historyId,
        display_urls: data.data.outputUrls,
        original_urls: data.data.outputUrls,
        input_urls: inputUrlForHistory ? [inputUrlForHistory] : [],
        model_id: "flux-fill-pro",
        prompt: "",
        credits_used: CREDIT_COST,
        metadata: { gender, strength, scale },
      });
      onGenerate?.(data.data.outputUrls);

      if (data.data.balanceAfter != null) {
        window.dispatchEvent(
          new CustomEvent("credits-updated", { detail: { total: data.data.balanceAfter } })
        );
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("credits-updated", { detail: { delta: CREDIT_COST } })
      );
      toast(
        err instanceof Error ? err.message : "생성에 실패했습니다",
        "error"
      );
    } finally {
      setIsGenerating(false);
      onGenerateEnd?.();
    }
  }, [gender, strength, scale, hasImage, hasMask, isGenerating, uploadedImage, uploadedFile, maskBlob, onGenerateStart, onGenerate, onGenerateEnd, toast, queryClient]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  return (
    <>
      <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
            <Paintbrush className="w-4 h-4 text-white/50" />
            얼굴 변경
          </h2>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col gap-4 px-4 py-4 min-h-0 overflow-y-auto">
          {/* Image Upload */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              ref={imgContainerRef}
              onClick={() => !hasImage && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={imgMaxH ? { maxHeight: imgMaxH } : undefined}
              className={cn(
                "relative flex-1 min-h-[200px] rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all",
                hasImage
                  ? "border-white/[0.1] bg-white/[0.02]"
                  : "border-dashed cursor-pointer",
                !hasImage &&
                  (isDragging
                    ? "border-[#818CF8] bg-primary/10"
                    : "border-white/[0.15] bg-white/[0.03] hover:border-[#818CF8] hover:bg-[#A5B4FC]/10")
              )}
            >
              {hasImage ? (
                <>
                  <div className="relative max-h-full max-w-full p-2">
                    <img
                      src={uploadedImage!}
                      alt="업로드된 이미지"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                    {/* 마스크 프리뷰 오버레이 */}
                    {maskDataUrl && (
                      <div
                        className="absolute inset-0 p-2 pointer-events-none"
                        style={{ filter: "drop-shadow(0 0 2px rgba(130,160,255,1)) drop-shadow(0 0 6px rgba(100,140,255,0.5))" }}
                      >
                        <img
                          src={maskDataUrl}
                          alt="마스크"
                          className="max-h-full max-w-full object-contain rounded-lg opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  {/* 가이드 오버레이 — 마스크 없을 때 */}
                  {!hasMask && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-xl">
                      <p className="text-sm text-white/80 font-semibold mb-3">
                        변경할 얼굴 영역을 선택하세요
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaskEditorOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-primary to-[#818CF8] shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all cursor-pointer"
                      >
                        <Paintbrush className="w-4 h-4" />
                        영역 선택하기
                      </button>
                    </div>
                  )}
                  {/* 상단 컨트롤 */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-card-foreground rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      교체
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-400 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  </div>
                  {/* 마스크 수정 버튼 — 마스크 있을 때만 */}
                  {hasMask && (
                    <div className="absolute bottom-2 right-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaskEditorOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-sm border transition-colors cursor-pointer text-[#A5B4FC] bg-black/60 border-white/[0.1] hover:bg-black/80"
                      >
                        <Paintbrush className="w-3 h-3" />
                        마스크 수정
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground/50" />
                  <p className="text-[15px] font-extrabold text-card-foreground">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-[15px] text-muted-foreground">
                    JPG, PNG, WebP
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGuide(true);
                    }}
                    className="text-[12px] font-semibold text-primary hover:text-[#818CF8] transition-colors cursor-pointer mt-1"
                  >
                    생성 이미지 가이드 →
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              aria-label="이미지 파일 선택"
            />
          </div>

          <hr className="border-border" />

          {/* 추가 설정 */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">추가 설정</h3>
              <button
                type="button"
                onClick={() => {
                  setGender("female");
                  setStrength(1);
                  setScale("auto");
                }}
                className="p-1 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                title="설정 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 성별 선택 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">성별</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex items-center justify-center py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border",
                      gender === g
                        ? "border-primary bg-gradient-to-r from-primary to-[#818CF8] text-primary-foreground"
                        : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/[0.15] hover:text-card-foreground"
                    )}
                  >
                    {g === "female" ? "여성" : "남성"}
                  </button>
                ))}
              </div>
            </div>

            {/* 변화 강도 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">변화 강도</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                aria-label="변화 강도"
                className={cn("flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-primary", sliderThumb)}
              />
              <span className="text-sm font-bold text-[#A5B4FC] shrink-0 w-8 text-right">{strength.toFixed(1)}</span>
            </div>

            {/* 해상도 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-card-foreground shrink-0 w-14">업스케일</span>
              <Dropdown
                options={SCALE_OPTIONS}
                value={String(scale)}
                onChange={(v) => setScale(v)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-4 py-2.5 border-t border-border">
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => requireAuth(handleGenerate)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer",
                isGenerating
                  ? "text-white/50 bg-gradient-to-r from-primary to-secondary opacity-40 cursor-not-allowed"
                  : !(hasImage && hasMask)
                    ? "text-white bg-gradient-to-r from-primary to-secondary opacity-60"
                    : "text-white bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:brightness-110"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  생성하기
                  <span className="ml-1.5 inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                    <Zap className="w-2.5 h-2.5" />
                    {CREDIT_COST}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mask Editor Modal */}
      {uploadedImage && (
        <FaceEditMaskEditor
          isOpen={maskEditorOpen}
          onClose={() => setMaskEditorOpen(false)}
          onSave={handleMaskSave}
          imageSrc={uploadedImage}
          initialMaskDataUrl={maskDataUrl}
        />
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.55)] p-5 space-y-3 max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-card-foreground">생성 이미지 가이드</p>
            <ul className="space-y-1.5 text-[12px] text-card-foreground/80 leading-relaxed">
              <li>· 얼굴이 선명하게 보이는 정면 사진을 권장합니다.</li>
              <li>· 최소 512x512 해상도 이상이 좋습니다.</li>
              <li>· 마스크는 변경할 얼굴 영역만 정확히 선택해주세요.</li>
              <li>· 변화 강도가 높을수록 더 큰 변화가 적용됩니다.</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-primary hover:bg-[#818CF8] transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {loginModal}
</>
  );
});
