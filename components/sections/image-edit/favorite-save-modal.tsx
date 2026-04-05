"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface FavoriteSaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  currentCount: number;
  maxCount: number;
  /** 저장할 설정 미리보기 */
  preview: {
    model: string;
    ratio: string;
    imageSize: string;
    scale: number;
    imageCount: number;
    imageCountRef: number;
  };
}

export function FavoriteSaveModal({
  open,
  onClose,
  onSave,
  currentCount,
  maxCount,
  preview,
}: FavoriteSaveModalProps) {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(dict.tools.favorites.nameRequired);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(trimmed);
      setName("");
      onClose();
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = code === "MAX_FAVORITES"
        ? dict.tools.favorites.maxFavoritesReached.replace("{max}", String(maxCount))
        : code === "AUTH_REQUIRED"
          ? dict.common.errors.authRequired
          : dict.tools.favorites.saveFailed;
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setName("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className="flex flex-col pt-2 pb-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{dict.tools.favorites.saveTitle}</h3>
            <p className="text-xs text-muted-foreground">{dict.tools.favorites.usage.replace("{current}", String(currentCount)).replace("{max}", String(maxCount))}</p>
          </div>
        </div>

        {/* Name Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder={dict.tools.favorites.namePlaceholder}
          className="w-full px-3 py-2 mb-3 rounded-lg border border-border bg-muted text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors placeholder:text-muted-foreground/70 dark:placeholder:text-muted-foreground/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSaving) handleSave();
          }}
        />

        {/* Settings Preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge>{preview.model}</Badge>
          <Badge>{preview.ratio}</Badge>
          <Badge>{preview.imageSize}</Badge>
          {preview.scale > 1 && <Badge>{preview.scale}x</Badge>}
          <Badge>{preview.imageCount}{dict.tools.imageEdit.countUnit}</Badge>
          {preview.imageCountRef > 0 && (
            <Badge>{dict.tools.favorites.refImages.replace("{count}", String(preview.imageCountRef))}</Badge>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 py-2 text-sm font-semibold text-muted-foreground rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            {dict.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-primary to-secondary shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:brightness-110 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {dict.common.saving}
              </>
            ) : (
              dict.common.save
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded-md">
      {children}
    </span>
  );
}
