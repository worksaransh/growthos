"use client";

import { DeltaBadge } from "@/components/shared/delta-badge";
import { AppIcon } from "@/components/shared/app-icon";
import { fmt, type FormatType } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  delta: number | null;
  format: FormatType;
  invertDelta?: boolean;
  animClass?: string;
  icon?: string;
}

export function KPICard({
  label,
  value,
  delta,
  format,
  invertDelta = false,
  animClass = "",
  icon,
}: KPICardProps) {
  const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0;

  return (
    <div className={`glass-card p-5 relative overflow-hidden group hover:border-primary/20 transition-all ${animClass}`}>
      {/* Top shimmer line */}
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Inner glow on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(192,193,255,0.04) 0%, transparent 70%)" }} />

      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-on-surface-variant/50 font-mono uppercase tracking-wider">
          {label}
        </div>
        {icon && (
          <div className="w-7 h-7 rounded-lg glass-card-high flex items-center justify-center">
            <AppIcon name={icon} size={15} className="text-primary" />
          </div>
        )}
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="font-mono text-[26px] font-medium text-on-surface leading-none tracking-tight">
            {fmt(value, format)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <DeltaBadge delta={delta ?? 0} inverted={invertDelta} />
            <span className="text-[11px] text-on-surface-variant/40 font-mono">vs last period</span>
          </div>
        </div>
        <MiniSparkline positive={positive} />
      </div>
    </div>
  );
}

function MiniSparkline({ positive }: { positive: boolean }) {
  const pts = positive
    ? "0,28 10,22 20,24 30,16 40,18 50,10 60,8 70,4"
    : "0,4 10,8 20,6 30,14 40,12 50,20 60,18 70,28";

  // Stitch palette: primary lavender for positive, error-red for negative
  const color = positive ? "#c0c1ff" : "#ffb4ab";

  return (
    <svg width={70} height={32} className="flex-shrink-0 opacity-70" viewBox="0 0 70 32">
      <defs>
        <linearGradient id={`sg_${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,28 ${pts} 70,32 0,32`}
        fill={`url(#sg_${positive})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
