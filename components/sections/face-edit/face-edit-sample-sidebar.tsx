"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Gender = "female" | "male";

export interface SampleData {
  id: string;
  gender: Gender;
  label: string;
  image: string;
  after: string;
}

export const FACE_EDIT_SAMPLES: SampleData[] = [
  { id: "f1", gender: "female", label: "여성", image: "/images/face-edit/sample-f1.png", after: "/images/face-edit/sample-f1-after.png" },
  { id: "m1", gender: "male", label: "남성", image: "/images/face-edit/sample-m1.png", after: "/images/face-edit/sample-m1-after.png" },
  { id: "f2", gender: "female", label: "여성", image: "/images/face-edit/sample-f2.png", after: "/images/face-edit/sample-f2-after.png" },
  { id: "f3", gender: "female", label: "여성", image: "/images/face-edit/sample-f3.png", after: "/images/face-edit/sample-f3-after.png" },
  { id: "f4", gender: "female", label: "여성", image: "/images/face-edit/sample-f4.png", after: "/images/face-edit/sample-f4-after.png" },
];

export function FaceEditSampleSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("sample_id");

  const handleSelect = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (selectedId === id) {
        params.delete("sample_id");
      } else {
        params.set("sample_id", id);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/face-edit", { scroll: false });
    },
    [router, searchParams, selectedId]
  );

  return (
    <aside className="hidden lg:flex flex-col w-[100px] shrink-0 min-h-0 rounded-2xl glass-card shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[15px] font-bold text-foreground">샘플</h2>
      </div>

      {/* Sample List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {FACE_EDIT_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSelect(sample.id)}
            className={cn(
              "w-full flex flex-col items-center gap-1.5 cursor-pointer group"
            )}
          >
            {/* Image */}
            <div
              className={cn(
                "w-full aspect-square rounded-lg overflow-hidden border-2 transition-all",
                selectedId === sample.id
                  ? "border-primary shadow-glow-indigo-sm"
                  : "border-transparent group-hover:border-white/20"
              )}
            >
              <Image
                src={sample.image}
                alt={sample.label}
                width={200}
                height={200}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Gender Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full",
                "bg-primary/15 text-[#A5B4FC]"
              )}
            >
              {sample.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
