export type FormatType = "inr" | "x" | "num" | "pct" | "inr_compact";

export function fmt(v: number, type: FormatType): string {
  switch (type) {
    case "inr":
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
      return `₹${v.toLocaleString("en-IN")}`;
    case "inr_compact":
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
      return `₹${v.toLocaleString("en-IN")}`;
    case "x":
      return `${v.toFixed(2)}x`;
    case "num":
      return v.toLocaleString("en-IN");
    case "pct":
      return `${v.toFixed(1)}%`;
    default:
      return `${v}`;
  }
}

export function deltaPercent(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? 100 : null;
  return ((current - prior) / prior) * 100;
}

export function formatDate(date: Date | string, format: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "short") {
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
