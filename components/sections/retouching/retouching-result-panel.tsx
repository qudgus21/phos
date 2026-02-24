"use client";

import { Search, Download } from "lucide-react";

export function RetouchingResultPanel() {
  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden relative">
      {/* Header labels */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-semibold text-card-foreground bg-card/80 px-3 py-1 rounded-lg border border-border">
          샘플 결과
        </span>
        <span className="text-sm font-semibold text-card-foreground bg-card/80 px-3 py-1 rounded-lg border border-border">
          미리보기
        </span>
      </div>

      {/* Empty result area */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          이미지를 업로드하고 생성하기 버튼을 눌러주세요.
        </p>
      </div>

      {/* Floating action buttons */}
      <div className="absolute right-3 top-16 flex flex-col gap-2">
        <button
          type="button"
          className="w-10 h-10 rounded-xl bg-card/80 border border-border flex items-center justify-center text-card-foreground hover:bg-card transition-colors cursor-pointer"
          title="확대 보기"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-xl bg-card/80 border border-border flex items-center justify-center text-card-foreground hover:bg-card transition-colors cursor-pointer"
          title="다운로드"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
