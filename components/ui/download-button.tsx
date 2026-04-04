"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  downloadImage,
  getLastFormat,
  type ImageFormat,
} from "@/lib/utils/download-image";
import { useToast } from "@/components/ui/toast";
import { useDictionary } from "@/lib/i18n/dictionary-context";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

/** ActionBar 안에서 사용하는 다운로드 버튼 (포맷 선택 팝업 포함) */
export function DownloadButton({ src }: { src: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState<ImageFormat>("png");
  const { toast } = useToast();
  const dict = useDictionary();
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setDefaultFormat(getLastFormat());
  }, []);

  const handleDownload = useCallback(
    async (format: ImageFormat, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isDownloading) return;
      setIsDownloading(true);
      setShowFormats(false);
      try {
        await downloadImage(src, format);
        setDefaultFormat(format);
      } catch {
        toast(dict.common.download.failed, "error");
      } finally {
        setIsDownloading(false);
      }
    },
    [src, isDownloading, toast, dict],
  );

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleDownload(defaultFormat);
    },
    [defaultFormat, handleDownload],
  );

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    setShowFormats(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => setShowFormats(false), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative group/btn w-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence>
        {showFormats && !isDownloading && (
          <motion.div
            initial={{ opacity: 0, y: 4, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 4, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 mb-2 flex items-center gap-1 px-1.5 py-1 bg-black/80 backdrop-blur-md rounded-lg z-20"
          >
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={(e) => handleDownload(value, e)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  value === defaultFormat
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isDownloading}
        aria-label={dict.tools.resultPanel.zoomLabel}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-wait"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Download className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}

/** Lightbox 모달에서 사용하는 다운로드 버튼 (포맷 선택 팝업 포함) */
export function LightboxDownloadButton({ src }: { src: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState<ImageFormat>("png");
  const { toast } = useToast();
  const dict = useDictionary();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setDefaultFormat(getLastFormat());
  }, []);

  const handleDownload = useCallback(
    async (format: ImageFormat, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isDownloading) return;
      setIsDownloading(true);
      setShowFormats(false);
      try {
        await downloadImage(src, format);
        setDefaultFormat(format);
      } catch {
        toast(dict.common.download.failed, "error");
      } finally {
        setIsDownloading(false);
      }
    },
    [src, isDownloading, toast, dict],
  );

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleDownload(defaultFormat);
    },
    [defaultFormat, handleDownload],
  );

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    setShowFormats(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => setShowFormats(false), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  const filename =
    src.split("/").pop()?.split("?")[0]?.replace(/\.\w+$/, "") || "image";

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 포맷 선택 팝업 */}
      <AnimatePresence>
        {showFormats && !isDownloading && (
          <motion.div
            initial={{ opacity: 0, y: 4, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 4, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 mb-2 flex items-center gap-1 px-1.5 py-1 bg-black/80 backdrop-blur-md rounded-lg z-20"
          >
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={(e) => handleDownload(value, e)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  value === defaultFormat
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 버튼 */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isDownloading}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-wait"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isDownloading
          ? dict.tools.resultPanel.downloadingLabel
          : `${filename}.${defaultFormat}`}
      </button>
    </div>
  );
}
