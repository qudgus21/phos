"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export function useCountUp({
  end,
  duration = 2000,
  suffix = "",
  decimals = 0,
}: UseCountUpOptions) {
  const [value, setValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * end;

            if (decimals > 0) {
              setValue(current.toFixed(decimals));
            } else {
              setValue(Math.floor(current).toLocaleString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              if (decimals > 0) {
                setValue(end.toFixed(decimals));
              } else {
                setValue(end.toLocaleString());
              }
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals]);

  return { ref, value: value + suffix };
}
