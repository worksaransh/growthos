"use client";

import { cn } from "@/lib/utils";

interface DeltaBadgeProps {
  delta: number;
  inverted?: boolean;
}

export function DeltaBadge({ delta, inverted = false }: DeltaBadgeProps) {
  const positive = inverted ? delta < 0 : delta > 0;
  const isZero = delta === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-medium",
        isZero
          ? "bg-[#1C2230] text-[#48566E]"
          : positive
          ? "bg-[rgba(0,229,160,0.08)] text-[#00E5A0]"
          : "bg-[rgba(255,91,107,0.10)] text-[#FF5B6B]"
      )}
    >
      <span>{delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}</span>
      <span>{Math.abs(delta).toFixed(1)}%</span>
    </span>
  );
}
