"use client";

import { Sparkles, PenLine, ImagePlus, Zap } from "lucide-react";

const WORKFLOW_STEPS = [
  { icon: PenLine, label: "프롬프트 입력" },
  { icon: ImagePlus, label: "참조 이미지" },
  { icon: Zap, label: "실행" },
];

export function ImageEditResultPanel() {
  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-secondary" />
          결과
        </h2>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-semibold text-foreground">AI 생성 결과</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            프롬프트를 입력하고 실행하면
            <br />
            결과가 여기에 표시됩니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <span className="text-muted-foreground/30 text-xs mb-5">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
