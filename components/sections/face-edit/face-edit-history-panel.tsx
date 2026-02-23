import { Clock } from "lucide-react";

export function FaceEditHistoryPanel() {
  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="text-[15px] font-bold text-foreground">히스토리</h2>
      </div>

      {/* Empty State */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col items-center justify-center pt-12 gap-2">
          <Clock className="w-6 h-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
