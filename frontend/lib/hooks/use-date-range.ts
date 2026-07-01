"use client";

import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export type DatePreset =
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Month"
  | "Last Month"
  | "Custom";

export interface DateRange {
  start: string;
  end: string;
  preset: DatePreset;
}

function getDateRange(preset: DatePreset, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

  switch (preset) {
    case "Today":
      return { start: today, end: today, preset };
    case "Yesterday":
      return { start: yesterday, end: yesterday, preset };
    case "Last 7 Days": {
      const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
      return { start: d7, end: yesterday, preset };
    }
    case "Last 30 Days": {
      const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
      return { start: d30, end: yesterday, preset };
    }
    case "This Month": {
      const sm = startOfMonth(now).toISOString().split("T")[0];
      return { start: sm, end: today, preset };
    }
    case "Last Month": {
      const lm = subMonths(now, 1);
      const lms = startOfMonth(lm).toISOString().split("T")[0];
      const lme = endOfMonth(lm).toISOString().split("T")[0];
      return { start: lms, end: lme, preset };
    }
    case "Custom":
      return {
        start: customStart || yesterday,
        end: customEnd || today,
        preset,
      };
    default:
      return { start: yesterday, end: today, preset: "Last 30 Days" };
  }
}

export function useDateRange() {
  const [preset, setPreset] = useQueryState<DatePreset>("range", {
    defaultValue: "Last 30 Days",
    parse: (v) => v as DatePreset,
    serialize: (v) => v,
  });

  const [customStart, setCustomStart] = useQueryState("start", { defaultValue: "" });
  const [customEnd, setCustomEnd] = useQueryState("end", { defaultValue: "" });

  const dateRange = useMemo(
    () => getDateRange(preset, customStart || undefined, customEnd || undefined),
    [preset, customStart, customEnd]
  );

  const changePreset = (newPreset: DatePreset) => {
    setPreset(newPreset);
    if (newPreset !== "Custom") {
      setCustomStart("");
      setCustomEnd("");
    }
  };

  const setCustom = (start: string, end: string) => {
    setPreset("Custom");
    setCustomStart(start);
    setCustomEnd(end);
  };

  return { dateRange, preset, changePreset, setCustom };
}
