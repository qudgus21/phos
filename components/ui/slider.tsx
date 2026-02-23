"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  valueDisplay?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueDisplay, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3 w-full">
        {label && (
          <span className="text-sm text-slate-300 shrink-0">{label}</span>
        )}
        <input
          ref={ref}
          type="range"
          className={cn(
            "flex-1 h-1.5 rounded-full appearance-none cursor-pointer",
            "bg-slate-700",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer",
            className
          )}
          {...props}
        />
        {valueDisplay && (
          <span className="text-sm text-slate-300 shrink-0">{valueDisplay}</span>
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";
