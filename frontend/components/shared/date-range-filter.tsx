"use client";

import { cn } from "@/lib/utils";
import type { DatePreset } from "@/lib/hooks";

const PRESETS: DatePreset[] = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
];

interface DateRangeFilterProps {
  selected: DatePreset;
  onChange: (preset: DatePreset) => void;
}

export function DateRangeFilter({ selected, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/60 p-0.5">
      {PRESETS.map((preset) => (
        <button
          key={preset}
          onClick={() => onChange(preset)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-[11px] font-mono transition-all duration-150 whitespace-nowrap",
            selected === preset
              ? "bg-primary/15 border border-primary/25 text-primary"
              : "border border-transparent text-on-surface-variant/50 hover:text-on-surface-variant"
          )}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
