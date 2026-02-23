import { Clock, ImageUp, SlidersHorizontal, Play } from "lucide-react";

const GUIDE_STEPS = [
  { icon: ImageUp, label: "이미지 업로드" },
  { icon: SlidersHorizontal, label: "옵션 설정" },
  { icon: Play, label: "실행" },
];

export function FaceEditHistoryPanel() {
  return (
    <div className="h-full rounded-2xl glass-card shadow-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden lg:block px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          히스토리
        </h2>
      </div>

      {/* Empty State — E: 가이드 추가 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center pt-8 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-card-foreground">
              변경 결과
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              얼굴 변경 결과가
              <br />
              이곳에 표시됩니다
            </p>
          </div>

          {/* Mini guide */}
          <div className="flex flex-col gap-2.5 mt-2 w-full">
            {GUIDE_STEPS.map((step, i) => (
              <div
                key={step.label}
                className="flex items-center gap-2.5"
              >
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
