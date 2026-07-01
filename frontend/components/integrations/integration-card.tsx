"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { SyncDot } from "@/components/shared/sync-dot";

interface IntegrationCardProps {
  name: string;
  status: "active" | "warning" | "error" | "disconnected";
  lastSync: string;
  icon: string;
  color: string;
  account: string;
  onSync: () => void;
  onDisconnect: () => void;
}

export function IntegrationCard({
  name,
  status,
  lastSync,
  icon,
  color,
  account,
  onSync,
  onDisconnect,
}: IntegrationCardProps) {
  const statusColor = {
    active: "#00E5A0",
    warning: "#FFAD3B",
    error: "#FF5B6B",
    disconnected: "#48566E",
  };

  return (
    <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] p-5 relative overflow-hidden transition-all hover:border-primary/25 hover:bg-[#121722]">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: statusColor[status] }}
      />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-lg border flex items-center justify-center"
            style={{ backgroundColor: `${color}14`, borderColor: `${color}33`, color }}
          >
            <AppIcon name={icon} size={20} />
          </div>
          <div>
            <div className="font-syne text-sm font-bold text-[#F0F4FF]">{name}</div>
            <div className="font-mono text-[10px] text-[#48566E]">{account}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <SyncDot status={status} />
          <span
            className="font-mono text-[11px] capitalize"
            style={{ color: statusColor[status] }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#151921] rounded-lg p-2.5">
          <div className="text-[10px] text-[#48566E] font-mono uppercase mb-1">
            Last Sync
          </div>
          <div className="font-mono text-xs text-[#F0F4FF]">{lastSync}</div>
        </div>
        <div className="bg-[#151921] rounded-lg p-2.5">
          <div className="text-[10px] text-[#48566E] font-mono uppercase mb-1">
            Status
          </div>
          <div className="font-mono text-xs text-[#F0F4FF]">
            {status === "active" ? "Healthy" : "Check needed"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSync}
          className="flex-1 py-2 rounded-lg text-xs font-mono bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.18)] text-[#00E5A0] hover:bg-[rgba(0,229,160,0.12)] transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <AppIcon name="refreshccw" size={13} />
          Sync Now
        </button>
        <button
          onClick={onDisconnect}
          className="px-3.5 py-2 rounded-lg text-xs font-mono bg-[#151921] border border-[#1E2737] text-[#8A95B0] hover:bg-[#1C2230] transition-colors"
          aria-label={`Manage ${name} integration`}
        >
          <AppIcon name="settings" size={14} />
        </button>
      </div>
    </div>
  );
}
