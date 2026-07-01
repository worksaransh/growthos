"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";

const ICON = ({ name, size = 20, fill = 1 }: { name: string; size?: number; fill?: number }) => (
  <AppIcon name={name} size={size} strokeWidth={fill ? 2.15 : 1.8} />
);

const TABS = ["All Creatives", "Images", "Videos", "Carousels"];
type SortKey = "roas" | "ctr" | "spend" | "conversions";
type Platform = "All" | "Meta" | "Google";
type Status = "All" | "Active" | "Paused";
type Fatigue = "All" | "Fresh" | "Slowing" | "Fatigued";

const MOCK_CREATIVES = [
  { id: 1, name: "Summer Sale — Flat 40% Off", headline: "Limited time offer on all products", type: "image",    platform: "Meta",   ctr: 3.84, cvr: 2.41, roas: 7.12, spend: 182400, conversions: 312, frequency: 1.8, status: "Active" },
  { id: 2, name: "Founder Story — Why I Built This", headline: "A personal journey to better products", type: "video",    platform: "Meta",   ctr: 2.91, cvr: 1.82, roas: 5.44, spend: 94200,  conversions: 198, frequency: 3.6, status: "Active" },
  { id: 3, name: "Product Showcase Carousel",        headline: "Swipe to explore the collection",     type: "carousel", platform: "Meta",   ctr: 2.14, cvr: 1.41, roas: 4.21, spend: 78400,  conversions: 142, frequency: 4.9, status: "Active" },
  { id: 4, name: "Testimonial — Priya's Review",     headline: "5-star customer experience",           type: "image",    platform: "Meta",   ctr: 1.22, cvr: 0.84, roas: 2.88, spend: 64100,  conversions: 89,  frequency: 5.8, status: "Active" },
  { id: 5, name: "Google Shopping — Main Catalog",   headline: "All products available now",           type: "image",    platform: "Google", ctr: 1.84, cvr: 3.12, roas: 6.41, spend: 198400, conversions: 412, frequency: 2.1, status: "Active" },
  { id: 6, name: "Brand Awareness Video 30s",        headline: "Discover what makes us different",    type: "video",    platform: "Google", ctr: 0.94, cvr: 0.62, roas: 1.92, spend: 48200,  conversions: 64,  frequency: 5.2, status: "Paused" },
  { id: 7, name: "Retargeting — Cart Abandoners",    headline: "You left something behind!",           type: "image",    platform: "Meta",   ctr: 4.12, cvr: 4.41, roas: 9.22, spend: 38400,  conversions: 284, frequency: 2.4, status: "Active" },
  { id: 8, name: "New Arrivals — Winter Collection",  headline: "Fresh styles just dropped",           type: "carousel", platform: "Google", ctr: 1.62, cvr: 1.84, roas: 3.84, spend: 88200,  conversions: 174, frequency: 1.6, status: "Active" },
  { id: 9, name: "UGC Compilation — Real Customers", headline: "See what real customers say",          type: "video",    platform: "Meta",   ctr: 2.44, cvr: 2.12, roas: 4.92, spend: 124200, conversions: 218, frequency: 4.1, status: "Paused" },
];

function getFatigue(freq: number): { label: string; cls: string } {
  if (freq < 3) return { label: "Fresh",    cls: "badge-success" };
  if (freq < 5) return { label: "Slowing",  cls: "badge-warning" };
  return            { label: "Fatigued", cls: "badge-error"   };
}

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

const TYPE_ICONS: Record<string, string> = { image: "image", video: "play_circle", carousel: "view_carousel" };

export function CreativeAnalyticsPage() {
  const [tab, setTab]         = useState("All Creatives");
  const [sort, setSort]       = useState<SortKey>("roas");
  const [platform, setPlatform] = useState<Platform>("All");
  const [status, setStatus]   = useState<Status>("All");
  const [fatigue, setFatigue] = useState<Fatigue>("All");

  useQuery({
    queryKey: ["creative-analytics"],
    queryFn: () => api.get("/creatives/performance"),
    enabled: false,
  });

  const filtered = useMemo(() => {
    return MOCK_CREATIVES
      .filter(c => tab === "All Creatives" || c.type === tab.toLowerCase().replace("s", "").replace("carousel", "carousel"))
      .filter(c => {
        if (tab === "Images")   return c.type === "image";
        if (tab === "Videos")   return c.type === "video";
        if (tab === "Carousels") return c.type === "carousel";
        return true;
      })
      .filter(c => platform === "All" || c.platform === platform)
      .filter(c => status === "All" || c.status === status)
      .filter(c => fatigue === "All" || getFatigue(c.frequency).label === fatigue)
      .sort((a, b) => b[sort] - a[sort]);
  }, [tab, sort, platform, status, fatigue]);

  const bestRoas = [...MOCK_CREATIVES].sort((a, b) => b.roas - a.roas)[0];
  const avgCtr = (MOCK_CREATIVES.reduce((s, c) => s + c.ctr, 0) / MOCK_CREATIVES.length).toFixed(2);
  const fatigued = MOCK_CREATIVES.filter(c => getFatigue(c.frequency).label === "Fatigued").length;

  return (
    <div className="p-4 lg:p-7 flex flex-col gap-5">
      {/* Demo badge */}
      <div className="flex items-center gap-2">
        <span className="badge-info text-[10px] px-2 py-0.5 flex items-center gap-1">
          <ICON name="science" size={12} /> Demo Data
        </span>
      </div>

      {/* Summary bar */}
      <div className="glass-card p-4 flex flex-wrap gap-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Best ROAS Creative</span>
          <span className="text-sm text-on-surface font-medium">{bestRoas.name}</span>
          <span className="text-xs text-success-accent font-mono">{bestRoas.roas.toFixed(2)}x ROAS</span>
        </div>
        <div className="w-px bg-outline-variant" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Avg CTR</span>
          <span className="text-xl text-primary font-mono font-medium">{avgCtr}%</span>
        </div>
        <div className="w-px bg-outline-variant" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Fatigued Creatives</span>
          <span className="text-xl font-mono font-medium text-error">{fatigued}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${
              tab === t
                ? "bg-primary/15 border border-primary/25 text-primary"
                : "text-on-surface-variant hover:text-on-surface border border-outline-variant"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sort + Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Sort:</span>
        {(["roas", "ctr", "spend", "conversions"] as SortKey[]).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1 rounded text-[11px] font-mono transition-all ${
              sort === s ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
        <div className="w-px h-4 bg-outline-variant" />
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Platform:</span>
        {(["All", "Meta", "Google"] as Platform[]).map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1 rounded text-[11px] font-mono transition-all ${
              platform === p ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="w-px h-4 bg-outline-variant" />
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Fatigue:</span>
        {(["All", "Fresh", "Slowing", "Fatigued"] as Fatigue[]).map(f => (
          <button
            key={f}
            onClick={() => setFatigue(f)}
            className={`px-3 py-1 rounded text-[11px] font-mono transition-all ${
              fatigue === f ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Creative Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-on-surface-variant">
          <ICON name="search_off" size={40} fill={0} />
          <span className="text-sm">No creatives match the current filters</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const fatigueMeta = getFatigue(c.frequency);
            return (
              <div key={c.id} className="glass-card flex flex-col overflow-hidden">
                {/* Preview area */}
                <div className="h-36 bg-surface-container-high flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                  <ICON name="photo_camera" size={28} fill={0} />
                  <span className="text-[11px] font-mono">Creative Preview</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <ICON name={TYPE_ICONS[c.type]} size={12} />
                    <span className="capitalize">{c.type}</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {/* Name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-on-surface truncate">{c.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{c.headline}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${c.platform === "Meta" ? "badge-primary" : "badge-secondary"}`}>
                        {c.platform}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${c.status === "Active" ? "badge-success" : "badge-warning"}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Micro-metrics */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "CTR",   value: `${c.ctr}%` },
                      { label: "CVR",   value: `${c.cvr}%` },
                      { label: "ROAS",  value: `${c.roas.toFixed(1)}x` },
                      { label: "Spend", value: fmt(c.spend) },
                    ].map(m => (
                      <div key={m.label} className="flex flex-col gap-0.5 bg-surface-container-high/50 rounded p-1.5">
                        <span className="text-[9px] text-on-surface-variant font-mono uppercase">{m.label}</span>
                        <span className="text-[11px] text-on-surface font-mono font-medium">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fatigue indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ICON name="speed" size={14} />
                      <span className="text-[10px] text-on-surface-variant font-mono">Freq: {c.frequency}x</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${fatigueMeta.cls}`}>
                      {fatigueMeta.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
