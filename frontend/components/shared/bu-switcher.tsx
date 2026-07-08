"use client";

/**
 * BUSwitcher — Business Unit context picker.
 * Shown in the top bar when the active workspace has multiple BUs.
 */

import { useState } from "react";
import { useTenantStore } from "@/lib/store-tenant";
import { AppIcon } from "./app-icon";

interface BUSwitcherProps {
  className?: string;
}

export function BUSwitcher({ className = "" }: BUSwitcherProps) {
  const { businessUnits, activeBUId, setActiveBU } = useTenantStore();
  const [open, setOpen] = useState(false);

  const active = businessUnits.find((b) => b.id === activeBUId);

  if (businessUnits.length <= 1) {
    if (!active) return null;
    return (
      <div className={`flex items-center gap-1.5 text-[12px] text-on-surface-variant ${className}`}>
        <AppIcon name="store_mall_directory" size={13} className="text-outline" />
        <span className="truncate max-w-[100px]">{active.name}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-outline-variant/20 hover:border-primary/30 bg-surface-container-lowest/40 transition-all"
      >
        <AppIcon name="store_mall_directory" size={13} className="text-outline" />
        <span className="text-[12px] text-on-surface font-medium truncate max-w-[80px]">
          {active?.name ?? "Business Unit"}
        </span>
        <AppIcon name="expand_more" size={12} className="text-outline" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-52 glass-card rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant/10">
              <p className="text-[10px] text-outline uppercase tracking-wider font-bold">Business Unit</p>
            </div>
            <div className="py-1 max-h-60 overflow-y-auto">
              {businessUnits.map((bu) => {
                const isActive = bu.id === activeBUId;
                return (
                  <button
                    key={bu.id}
                    onClick={() => { setActiveBU(bu.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface-container-high/40 transition-all ${isActive ? "bg-primary/5" : ""}`}
                  >
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isActive ? "border-primary/40 bg-primary/10 text-primary" : "border-outline-variant/20 bg-surface-container text-on-surface-variant"
                    }`}>
                      {bu.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${isActive ? "text-primary" : "text-on-surface"}`}>
                        {bu.name}
                      </p>
                      {bu.is_default && (
                        <p className="text-[9px] text-outline uppercase tracking-wider">Default</p>
                      )}
                    </div>
                    {isActive && <AppIcon name="check" size={13} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
