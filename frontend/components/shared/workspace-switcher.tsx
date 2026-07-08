"use client";

/**
 * WorkspaceSwitcher — lets a user switch between workspaces they belong to.
 * Designed for the top bar or sidebar header.
 * On switch: updates Zustand store → clears downstream BU/account/channel context.
 */

import { useState } from "react";
import { useTenantStore } from "@/lib/store-tenant";
import { AppIcon } from "./app-icon";

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className = "" }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, loading } = useTenantStore();
  const [open, setOpen] = useState(false);

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  if (workspaces.length === 0 && !loading) return null;
  if (workspaces.length <= 1 && active) {
    // Single workspace — show name, no dropdown
    return (
      <div className={`flex items-center gap-2 text-sm text-on-surface-variant ${className}`}>
        <div className="w-6 h-6 rounded-md primary-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(active.brand_name ?? "?").charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-on-surface text-[13px] truncate max-w-[120px]">{active.brand_name}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-high/40 transition-all text-sm"
      >
        {active ? (
          <>
            <div className="w-6 h-6 rounded-md primary-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {active.brand_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-on-surface text-[13px] truncate max-w-[100px]">{active.brand_name}</span>
          </>
        ) : (
          <span className="text-on-surface-variant text-[13px]">Select workspace…</span>
        )}
        <AppIcon name="unfold_more" size={14} className="text-outline flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-56 glass-card rounded-xl border border-outline-variant/20 shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant/10">
              <p className="text-[10px] text-outline uppercase tracking-wider font-bold">Switch Workspace</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-container-high/40 transition-all ${
                      isActive ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {ws.brand_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isActive ? "text-primary" : "text-on-surface"}`}>
                        {ws.brand_name}
                      </p>
                      <p className="text-[10px] text-outline font-mono truncate">{ws.id.slice(0, 8)}…</p>
                    </div>
                    {isActive && <AppIcon name="check" size={14} className="text-primary flex-shrink-0" />}
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
