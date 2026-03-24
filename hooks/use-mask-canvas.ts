"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

export type MaskMode = "draw" | "erase" | "rect";

/* 불투명 색 — 캔버스 자체를 CSS opacity로 반투명 표시 */
const MASK_COLOR = "rgb(59, 130, 246)";
const MIN_BRUSH = 2;
const MAX_BRUSH = 80;
const DEFAULT_BRUSH = 24;
const MAX_HISTORY = 30;

function makeBrushCursor(size: number, isErasing: boolean): string {
  const display = Math.min(size, 64);
  const r = Math.max(display / 2 - 1, 1);
  const svgSize = display + 2;
  const c = svgSize / 2;
  const color = isErasing ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.85)";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${svgSize}' height='${svgSize}'><circle cx='${c}' cy='${c}' r='${r}' fill='none' stroke='${color}' stroke-width='1.5'/><circle cx='${c}' cy='${c}' r='1' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, crosshair`;
}

interface UseMaskCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** CSS 표시 크기 — 캔버스 해상도를 이 값으로 설정 */
  displayWidth: number;
  displayHeight: number;
  initialMaskDataUrl?: string | null;
}

export function useMaskCanvas({
  canvasRef,
  displayWidth,
  displayHeight,
  initialMaskDataUrl,
}: UseMaskCanvasOptions) {
  const [mode, setMode] = useState<MaskMode>("draw");
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const rectStart = useRef<{ x: number; y: number } | null>(null);
  const rectSnapshot = useRef<ImageData | null>(null);
  const activeErasing = useRef(false);
  const dirty = useRef(false);

  /* ── Undo history ── */
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);

  const pushHistory = useCallback(() => {
    dirty.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(snap);
    if (history.current.length > MAX_HISTORY) history.current.shift();
    historyIndex.current = history.current.length - 1;
  }, [canvasRef]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || historyIndex.current <= 0) return;
    historyIndex.current--;
    ctx.putImageData(history.current[historyIndex.current], 0, 0);
  }, [canvasRef]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || historyIndex.current >= history.current.length - 1) return;
    historyIndex.current++;
    ctx.putImageData(history.current[historyIndex.current], 0, 0);
  }, [canvasRef]);

  /* ── 캔버스 초기화: 해상도 = CSS 표시 크기 ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayWidth || !displayHeight) return;

    const w = Math.round(displayWidth);
    const h = Math.round(displayHeight);

    /* 실제 캔버스 DOM 크기로 비교 — 새 요소(300×150)는 항상 초기화됨 */
    if (canvas.width === w && canvas.height === h) return;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const initHistory = () => {
      history.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      historyIndex.current = 0;
      dirty.current = false;
    };

    if (initialMaskDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        initHistory();
      };
      img.src = initialMaskDataUrl;
    } else {
      initHistory();
    }
  }, [canvasRef, displayWidth, displayHeight, initialMaskDataUrl]);

  /* ── 좌표 변환 (1:1이라 거의 pass-through이지만 안전하게) ── */
  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    },
    [canvasRef]
  );

  /* ── Stroke 셋업 ── */
  const setupCtx = useCallback(
    (ctx: CanvasRenderingContext2D, erasing: boolean) => {
      ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
      ctx.strokeStyle = erasing ? "rgba(0,0,0,1)" : MASK_COLOR;
      ctx.fillStyle = erasing ? "rgba(0,0,0,1)" : MASK_COLOR;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [brushSize]
  );

  /* ── Pointer down ── */
  const handlePointerDown = useCallback(
    (clientX: number, clientY: number, isRightClick: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      isDrawing.current = true;
      const pos = toCanvasCoords(clientX, clientY);
      lastPoint.current = pos;
      const erasing = isRightClick || mode === "erase";
      activeErasing.current = erasing;

      if (mode === "rect" && !isRightClick) {
        rectStart.current = pos;
        rectSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        setupCtx(ctx, erasing);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [canvasRef, toCanvasCoords, mode, setupCtx, brushSize]
  );

  /* ── Pointer move ── */
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = toCanvasCoords(clientX, clientY);
      const erasing = activeErasing.current;

      if (mode === "rect" && !erasing) {
        if (!rectStart.current || !rectSnapshot.current) return;
        ctx.putImageData(rectSnapshot.current, 0, 0);
        const x = Math.min(rectStart.current.x, pos.x);
        const y = Math.min(rectStart.current.y, pos.y);
        const w = Math.abs(pos.x - rectStart.current.x);
        const h = Math.abs(pos.y - rectStart.current.y);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = MASK_COLOR;
        ctx.fillRect(x, y, w, h);
      } else if (lastPoint.current) {
        setupCtx(ctx, erasing);
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPoint.current = pos;
      }
    },
    [canvasRef, toCanvasCoords, mode, setupCtx]
  );

  /* ── Pointer up ── */
  const handlePointerUp = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      pushHistory();
    }
    lastPoint.current = null;
    rectStart.current = null;
    rectSnapshot.current = null;
  }, [pushHistory]);

  /* ── Mouse events ── */
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handlePointerDown(e.clientX, e.clientY, e.button === 2);
    },
    [handlePointerDown]
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY),
    [handlePointerMove]
  );
  const onMouseUp = useCallback(() => handlePointerUp(), [handlePointerUp]);
  const onContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  /* ── Touch events ── */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, false);
    },
    [handlePointerDown]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handlePointerMove]
  );
  const onTouchEnd = useCallback(() => handlePointerUp(), [handlePointerUp]);

  /* ── Clear ── */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  }, [canvasRef, pushHistory]);

  /* ── Export ── */
  /**
   * 마스크를 내보낸다.
   * - dataUrl: 프리뷰용 (투명 배경 + 원본 색상 — UI 오버레이용)
   * - blob: API용 흑백 PNG (흰색=변경, 검정=보존), targetWidth/Height로 리사이즈
   */
  const exportMask = useCallback((targetWidth?: number, targetHeight?: number): Promise<{ dataUrl: string; blob: Blob } | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);

    // 프리뷰용 dataUrl — 원본 캔버스 그대로 (투명 배경 + 파란색)
    const dataUrl = canvas.toDataURL("image/png");

    // API용 흑백 마스크 — 리사이즈 + 색상 변환
    const w = targetWidth || canvas.width;
    const h = targetHeight || canvas.height;

    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const ctx = tmp.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    // 1) 마스크를 원본 크기로 리사이즈
    ctx.drawImage(canvas, 0, 0, w, h);

    // 2) 경계 페더링 — blur 적용 후 재그리기로 부드러운 마스크 경계 생성
    //    (hard edge → 검은 선 아티팩트 방지)
    const feather = Math.max(Math.round(Math.min(w, h) * 0.008), 2);
    const blurred = document.createElement("canvas");
    blurred.width = w;
    blurred.height = h;
    const bCtx = blurred.getContext("2d")!;
    bCtx.filter = `blur(${feather}px)`;
    bCtx.drawImage(tmp, 0, 0);

    // 3) 블러된 결과에서 흑백 이진화
    const imageData = bCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // 블러 후 alpha가 부드럽게 변하므로 threshold를 약간 올려줌
      if (data[i + 3] > 20) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      tmp.toBlob((blob) => resolve(blob ? { dataUrl, blob } : null), "image/png");
    });
  }, [canvasRef]);

  /* ── Empty check ── */
  const isEmpty = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return false;
    }
    return true;
  }, [canvasRef]);

  const cursor = useMemo(
    () => (mode === "rect" ? "crosshair" : makeBrushCursor(brushSize, mode === "erase")),
    [mode, brushSize]
  );

  const canvasProps = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onContextMenu,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    style: { cursor, touchAction: "none" as const },
  };

  const isDirty = useCallback(() => dirty.current, []);

  return {
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
  };
}
