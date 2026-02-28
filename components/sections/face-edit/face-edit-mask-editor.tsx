"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Paintbrush,
  Eraser,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaskCanvas, MaskMode } from "@/hooks/use-mask-canvas";

interface FaceEditMaskEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string, blob: Blob) => void;
  imageSrc: string;
  initialMaskDataUrl?: string | null;
}

const TOOLS: { mode: MaskMode; label: string; icon: typeof Paintbrush; shortcut: string }[] = [
  { mode: "draw", label: "브러시", icon: Paintbrush, shortcut: "B" },
  { mode: "erase", label: "지우개", icon: Eraser, shortcut: "E" },
  { mode: "rect", label: "사각형", icon: Square, shortcut: "R" },
];

export function FaceEditMaskEditor({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  initialMaskDataUrl,
}: FaceEditMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [canvasCss, setCanvasCss] = useState({ width: 0, height: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  /* 이미지 실제 렌더링 크기를 측정하여 캔버스 CSS에 적용
     offsetWidth/Height: transform 영향 없는 레이아웃 크기 (scale 애니메이션 무시) */
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imgSize.width) return;
    const measure = () => {
      setCanvasCss({ width: img.offsetWidth, height: img.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    return () => observer.disconnect();
  }, [imgSize]);

  const {
    mode,
    setMode,
    brushSize,
    setBrushSize,
    clearCanvas,
    exportMask,
    isEmpty,
    isDirty,
    undo,
    redo,
    canvasProps,
    MIN_BRUSH,
    MAX_BRUSH,
  } = useMaskCanvas({
    canvasRef,
    displayWidth: canvasCss.width,
    displayHeight: canvasCss.height,
    initialMaskDataUrl,
  });

  /* ── 저장 ── */
  const handleSave = useCallback(async () => {
    if (isEmpty()) { onClose(); return; }
    const result = await exportMask();
    if (result) onSave(result.dataUrl, result.blob);
    onClose();
  }, [exportMask, isEmpty, onSave, onClose]);

  /* ── 닫기 시 변경사항 확인 ── */
  const handleClose = useCallback(() => {
    if (isDirty()) {
      setConfirmOpen(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  /* 확인 다이얼로그 액션 */
  const handleConfirmSave = useCallback(() => {
    setConfirmOpen(false);
    handleSave();
  }, [handleSave]);

  const handleConfirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (confirmOpen) return;
      if (e.key === "Escape") { handleClose(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "b" || e.key === "B") setMode("draw");
        if (e.key === "e" || e.key === "E") setMode("erase");
        if (e.key === "r" || e.key === "R") setMode("rect");
        if (e.key === "[") setBrushSize((s) => Math.max(MIN_BRUSH, s - 4));
        if (e.key === "]") setBrushSize((s) => Math.min(MAX_BRUSH, s + 4));
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, confirmOpen, handleClose, undo, redo, setMode, setBrushSize, MIN_BRUSH, MAX_BRUSH]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mask-editor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={handleClose}
        >
          {/* 에디터 카드 */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="마스크 편집"
            className="flex flex-col bg-[#1a1a1a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
            style={{ maxWidth: 720, maxHeight: "85vh", width: "calc(100vw - 48px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white/90">마스크 편집</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-lg bg-primary hover:bg-primary/80 transition-colors cursor-pointer"
                >
                  저장
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center min-h-0 p-3">
              <div className="relative max-w-full max-h-full">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="원본"
                  className="block max-w-full max-h-[calc(85vh-8rem)] rounded-lg select-none"
                  draggable={false}
                  onLoad={handleImageLoad}
                />
                {imgSize.width > 0 && canvasCss.width > 0 && (
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: canvasCss.width,
                      height: canvasCss.height,
                      filter: "drop-shadow(0 0 2px rgba(130,160,255,1)) drop-shadow(0 0 6px rgba(100,140,255,0.5))",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      {...canvasProps}
                      className="w-full h-full rounded-lg opacity-60"
                      style={canvasProps.style}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.06] overflow-x-auto">
              {TOOLS.map(({ mode: m, label, icon: Icon, shortcut }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                    mode === m
                      ? "bg-white/[0.12] text-white"
                      : "text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  <kbd className="text-[9px] text-white/20">{shortcut}</kbd>
                </button>
              ))}

              <div className="w-px h-4 bg-white/[0.06] shrink-0" />

              <button
                type="button"
                onClick={undo}
                title="실행 취소 (⌘Z)"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                title="다시 실행 (⌘⇧Z)"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-white/[0.06] shrink-0" />

              <div className="shrink-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBrushSize((s) => Math.max(MIN_BRUSH, s - 4))}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min={MIN_BRUSH}
                  max={MAX_BRUSH}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  aria-label="브러시 크기"
                  className={cn(
                    "w-16 h-1 rounded-full appearance-none cursor-pointer bg-white/15",
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer",
                    "[&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setBrushSize((s) => Math.min(MAX_BRUSH, s + 4))}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-white/25 w-5 tabular-nums text-right">{brushSize}</span>
              </div>

              <div className="flex-1" />

              <button
                type="button"
                onClick={clearCanvas}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                초기화
              </button>
            </div>

            {/* ── 저장 확인 다이얼로그 ── */}
            <AnimatePresence>
              {confirmOpen && (
                <motion.div
                  key="confirm-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center gap-4 px-6 py-5 bg-[#222] rounded-xl border border-white/[0.1] shadow-2xl max-w-[280px] w-full"
                  >
                    <p className="text-sm font-semibold text-white/90 text-center">
                      변경사항을 저장하시겠습니까?
                    </p>
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={handleConfirmDiscard}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-white/50 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] hover:text-white/70 transition-colors cursor-pointer"
                      >
                        저장 안 함
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSave}
                        className="flex-1 px-3 py-2 text-xs font-bold text-white rounded-lg bg-primary hover:bg-primary/80 transition-colors cursor-pointer"
                      >
                        저장
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
