"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const GENDER_LABELS: Record<string, string> = { female: "여성", male: "남성" };

interface FaceEditFavoriteSaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  currentCount: number;
  maxCount: number;
  preview: {
    gender: string;
    strength: number;
    scale: string;
    hasImage: boolean;
    hasMask: boolean;
  };
}

export function FaceEditFavoriteSaveModal({
  open,
  onClose,
  onSave,
  currentCount,
  maxCount,
  preview,
}: FaceEditFavoriteSaveModalProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("이름을 입력해주세요");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(trimmed);
      setName("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
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
            <h3 className="text-base font-bold text-foreground">즐겨찾기 저장</h3>
            <p className="text-xs text-white/40">{currentCount}/{maxCount} 사용 중</p>
          </div>
        </div>

        {/* Name Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="즐겨찾기 이름 (최대 30자)"
          className="w-full px-3 py-2 mb-3 rounded-lg border border-white/[0.15] bg-white/[0.08] text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors placeholder:text-white/30"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSaving) handleSave();
          }}
        />

        {/* Settings Preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge>{GENDER_LABELS[preview.gender] ?? preview.gender}</Badge>
          <Badge>강도 {preview.strength.toFixed(1)}</Badge>
          <Badge>{preview.scale === "auto" ? "Auto" : `${preview.scale}K`}</Badge>
          {preview.hasImage && <Badge>참조이미지</Badge>}
          {preview.hasMask && <Badge>마스크</Badge>}
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
            className="flex-1 py-2 text-sm font-semibold text-white/70 rounded-lg border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer disabled:opacity-50"
          >
            취소
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
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-medium text-white/60 bg-white/[0.08] border border-white/[0.1] rounded-md">
      {children}
    </span>
  );
}
