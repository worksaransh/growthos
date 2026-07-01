"use client";

import { cn } from "@/lib/utils";

interface SyncDotProps {
  status: "active" | "warning" | "error" | "syncing" | "disconnected";
}

export function SyncDot({ status }: SyncDotProps) {
  const colors = {
    active: "bg-[#00E5A0] shadow-[0_0_6px_#00E5A0]",
    syncing: "bg-[#3B9EFF] shadow-[0_0_6px_#3B9EFF] animate-pulse",
    warning: "bg-[#FFAD3B] shadow-[0_0_6px_#FFAD3B]",
    error: "bg-[#FF5B6B] shadow-[0_0_6px_#FF5B6B]",
    disconnected: "bg-[#48566E] shadow-[0_0_6px_#48566E]",
  };

  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full",
        colors[status]
      )}
    />
  );
}
