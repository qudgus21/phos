"use client";

import { Clock, Upload, SlidersHorizontal, Play } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-context";

export function RetouchingHistoryPanel() {
  const dict = useDictionary();
  const GUIDE_STEPS = [
    { icon: Upload, label: dict.tools.history.retouchingSteps[0] },
    { icon: SlidersHorizontal, label: dict.tools.history.retouchingSteps[1] },
    { icon: Play, label: dict.tools.history.retouchingSteps[2] },
  ];
  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {dict.tools.history.retouchingHistory}
        </h2>
      </div>

      {/* Empty State */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center pt-8 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-muted-foreground/60 dark:text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-card-foreground">
              {dict.tools.history.retouchingEmpty}
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {dict.tools.history.retouchingEmptyHint}
            </p>
          </div>

          {/* Mini guide */}
          <div className="flex flex-col gap-2.5 mt-2 w-full">
            {GUIDE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                  <step.icon className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {i + 1}. {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
