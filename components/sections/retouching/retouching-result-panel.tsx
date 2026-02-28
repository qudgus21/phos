"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ZoomIn, Download, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const SAMPLE_RESULT = "/images/retouching/sample-after.png";

/* ── 확대 모달 (라이트박스) ── */
function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filename = src.split("/").pop() || "image.png";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/75"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <motion.img
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          src={src}
          alt="확대 보기"
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={src}
            download
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {filename}
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export function RetouchingResultPanel() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = SAMPLE_RESULT;
    link.download = SAMPLE_RESULT.split("/").pop() || "result.png";
    link.click();
  };

  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center px-4 py-3 shrink-0">
        <span className="text-sm font-semibold text-card-foreground bg-card/80 px-3 py-1 rounded-lg border border-border">
          샘플 결과
        </span>
      </div>

      {/* Result image — single, original aspect ratio */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <img
          src={SAMPLE_RESULT}
          alt="Retouching result"
          className="max-h-full max-w-full object-contain rounded-xl"
        />
      </div>

      {/* Floating action buttons */}
      <div className="absolute right-3 top-16 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setLightboxSrc(SAMPLE_RESULT)}
          className="w-10 h-10 rounded-xl bg-card/80 border border-border flex items-center justify-center text-card-foreground hover:bg-card transition-colors cursor-pointer"
          title="확대 보기"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="w-10 h-10 rounded-xl bg-card/80 border border-border flex items-center justify-center text-card-foreground hover:bg-card transition-colors cursor-pointer"
          title="다운로드"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
