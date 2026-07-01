"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";

const ICON = ({ name, size = 20, fill = 1 }: { name: string; size?: number; fill?: number }) => (
  <AppIcon name={name} size={size} strokeWidth={fill ? 2.15 : 1.8} />
);

const MOCK_KPIS = [
  { label: "Avg Touchpoints to Convert", value: "3.4",       icon: "touch_app",     color: "text-primary" },
  { label: "Avg Days to Convert",         value: "6.2 days",  icon: "schedule",      color: "text-on-surface" },
  { label: "Multi-Channel %",             value: "68.4%",     icon: "hub",           color: "text-success-accent" },
  { label: "Top First Touch Channel",     value: "Meta Ads",  icon: "ads_click",     color: "text-tertiary" },
];

// Sankey-style nodes
const AWARENESS_NODES = [
  { id: "meta",    label: "Meta Ad",       pct: 48, color: "#1877F2" },
  { id: "gsearch", label: "Google Search", pct: 31, color: "#FFAD3B" },
  { id: "organic", label: "Organic",       pct: 21, color: "#00E5A0" },
];
const CONSIDERATION_NODES = [
  { id: "pdp",    label: "Product Page",   pct: 52, color: "#3B9EFF" },
  { id: "retarg", label: "Retargeting Ad", pct: 29, color: "#A78BFA" },
  { id: "email",  label: "Email",          pct: 19, color: "#25D366" },
];
const CONVERSION_NODES = [
  { id: "purchase", label: "Purchase", pct: 100, color: "#00E5A0" },
];

// Paths between awareness -> consideration
const A_TO_C_PATHS = [
  { from: "meta",    to: "pdp",    pct: 38 },
  { from: "meta",    to: "retarg", pct: 24 },
  { from: "meta",    to: "email",  pct: 14 },
  { from: "gsearch", to: "pdp",    pct: 28 },
  { from: "gsearch", to: "retarg", pct: 12 },
  { from: "organic", to: "pdp",    pct: 18 },
  { from: "organic", to: "email",  pct: 10 },
];

// Paths between consideration -> conversion
const C_TO_CONV_PATHS = [
  { from: "pdp",    pct: 62 },
  { from: "retarg", pct: 24 },
  { from: "email",  pct: 14 },
];

const MOCK_PATHS = [
  { path: "Meta Ad → Product Page → Purchase",                customers: 342, aov: 4200, cvr: 3.2 },
  { path: "Google Search → Product Page → Purchase",          customers: 218, aov: 3800, cvr: 2.8 },
  { path: "Organic → Product Page → Email → Purchase",        customers: 184, aov: 5100, cvr: 4.1 },
  { path: "Meta Ad → Retargeting Ad → Purchase",              customers: 156, aov: 3600, cvr: 5.8 },
  { path: "Google Search → Retargeting Ad → Purchase",        customers: 98,  aov: 4100, cvr: 3.9 },
  { path: "Meta Ad → Email → Purchase",                       customers: 87,  aov: 4800, cvr: 6.2 },
  { path: "Organic → Product Page → Purchase",                customers: 72,  aov: 4400, cvr: 2.1 },
];

function fmt(v: number) {
  return `₹${v.toLocaleString()}`;
}

// Simple SVG Sankey-style flow diagram
function JourneyFlow() {
  const W = 700;
  const H = 340;
  const nodeW = 110;
  const nodeH = 36;
  const rowY = [40, 160, 290];

  // Position nodes
  const awPos = AWARENESS_NODES.map((n, i) => ({
    ...n,
    x: 60 + i * 190,
    y: rowY[0],
  }));
  const coPos = CONSIDERATION_NODES.map((n, i) => ({
    ...n,
    x: 60 + i * 190,
    y: rowY[1],
  }));
  const cvPos = [{ ...CONVERSION_NODES[0], x: W / 2 - nodeW / 2, y: rowY[2] }];

  const nodeMap: Record<string, { x: number; y: number }> = {};
  [...awPos, ...coPos, ...cvPos].forEach(n => { nodeMap[n.id] = { x: n.x, y: n.y }; });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      {/* Row labels */}
      {[
        { label: "Awareness",     y: rowY[0] + nodeH / 2 + 1 },
        { label: "Consideration", y: rowY[1] + nodeH / 2 + 1 },
        { label: "Conversion",    y: rowY[2] + nodeH / 2 + 1 },
      ].map(r => (
        <text key={r.label} x={-10} y={r.y} textAnchor="end" fontSize={9} fill="#48566E" fontFamily="monospace" alignmentBaseline="middle">
          {r.label}
        </text>
      ))}

      {/* Awareness → Consideration paths */}
      {A_TO_C_PATHS.map((p, i) => {
        const from = nodeMap[p.from];
        const to   = nodeMap[p.to];
        if (!from || !to) return null;
        const x1 = from.x + nodeW / 2;
        const y1 = from.y + nodeH;
        const x2 = to.x + nodeW / 2;
        const y2 = to.y;
        const my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke="#1E2737" strokeWidth={Math.max(1, p.pct / 8)} strokeOpacity={0.7} />
            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} textAnchor="middle" fontSize={8} fill="#48566E" fontFamily="monospace">{p.pct}%</text>
          </g>
        );
      })}

      {/* Consideration → Conversion paths */}
      {C_TO_CONV_PATHS.map((p, i) => {
        const from = nodeMap[p.from];
        const to   = nodeMap["purchase"];
        if (!from || !to) return null;
        const x1 = from.x + nodeW / 2;
        const y1 = from.y + nodeH;
        const x2 = to.x + nodeW / 2;
        const y2 = to.y;
        const my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke="#1E2737" strokeWidth={Math.max(1, p.pct / 8)} strokeOpacity={0.7} />
            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} textAnchor="middle" fontSize={8} fill="#48566E" fontFamily="monospace">{p.pct}%</text>
          </g>
        );
      })}

      {/* Awareness nodes */}
      {awPos.map(n => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={nodeW} height={nodeH} rx={6} fill={n.color} fillOpacity={0.12} stroke={n.color} strokeOpacity={0.4} strokeWidth={1} />
          <text x={n.x + nodeW / 2} y={n.y + 14} textAnchor="middle" fontSize={9} fill={n.color} fontFamily="monospace" fontWeight="600">{n.label}</text>
          <text x={n.x + nodeW / 2} y={n.y + 27} textAnchor="middle" fontSize={9} fill="#8A95B0" fontFamily="monospace">{n.pct}% entry</text>
        </g>
      ))}

      {/* Consideration nodes */}
      {coPos.map(n => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={nodeW} height={nodeH} rx={6} fill={n.color} fillOpacity={0.12} stroke={n.color} strokeOpacity={0.4} strokeWidth={1} />
          <text x={n.x + nodeW / 2} y={n.y + 14} textAnchor="middle" fontSize={9} fill={n.color} fontFamily="monospace" fontWeight="600">{n.label}</text>
          <text x={n.x + nodeW / 2} y={n.y + 27} textAnchor="middle" fontSize={9} fill="#8A95B0" fontFamily="monospace">{n.pct}% share</text>
        </g>
      ))}

      {/* Conversion node */}
      {cvPos.map(n => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={nodeW} height={nodeH} rx={6} fill="#00E5A0" fillOpacity={0.15} stroke="#00E5A0" strokeOpacity={0.6} strokeWidth={1.5} />
          <text x={n.x + nodeW / 2} y={n.y + 14} textAnchor="middle" fontSize={10} fill="#00E5A0" fontFamily="monospace" fontWeight="700">{n.label}</text>
          <text x={n.x + nodeW / 2} y={n.y + 27} textAnchor="middle" fontSize={9} fill="#8A95B0" fontFamily="monospace">100% goal</text>
        </g>
      ))}
    </svg>
  );
}

export function CustomerJourneyPage() {
  useQuery({
    queryKey: ["customer-journey"],
    queryFn: () => api.get("/attribution/journey"),
    enabled: false,
  });

  return (
    <div className="p-4 lg:p-7 flex flex-col gap-5">
      {/* Demo badge */}
      <div className="flex items-center gap-2">
        <span className="badge-info text-[10px] px-2 py-0.5 flex items-center gap-1">
          <ICON name="science" size={12} /> Demo Data
        </span>
        <span className="text-[11px] text-on-surface-variant font-mono">Customer touchpoint journey visualization</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_KPIS.map((k, i) => (
          <div key={i} className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <ICON name={k.icon} size={16} />
              <span className="text-[10px] font-mono uppercase tracking-wider">{k.label}</span>
            </div>
            <div className={`font-mono text-xl font-medium ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Journey Flow */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-on-surface mb-1">Customer Journey Flow</h3>
        <p className="text-[11px] text-on-surface-variant font-mono mb-5">Sankey-style visualization of touchpoints leading to purchase</p>
        <div className="overflow-x-auto">
          <div className="min-w-[500px] pl-8">
            <JourneyFlow />
          </div>
        </div>
        {/* Channel legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-outline-variant">
          {[...AWARENESS_NODES, ...CONSIDERATION_NODES].map(n => (
            <div key={n.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
              <span className="text-[10px] font-mono text-on-surface-variant">{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Paths Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="text-sm font-bold text-on-surface">Top Paths to Purchase</h3>
          <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Most common journeys leading to conversion</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[580px]">
            <div className="grid grid-cols-[3fr_0.8fr_1fr_0.8fr] px-5 py-3 border-b border-outline-variant gap-3">
              {["Journey Path", "Customers", "Avg Order Value", "Conv. Rate"].map(h => (
                <span key={h} className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {MOCK_PATHS.map((p, i) => (
              <div key={i} className="grid grid-cols-[3fr_0.8fr_1fr_0.8fr] px-5 py-3.5 gap-3 hover:bg-surface-container-high/30 transition-colors border-b border-outline-variant last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-on-surface-variant w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <span className="text-xs text-on-surface">{p.path}</span>
                </div>
                <span className="font-mono text-xs text-on-surface-variant">{p.customers.toLocaleString()}</span>
                <span className="font-mono text-xs text-on-surface">{fmt(p.aov)}</span>
                <span className="font-mono text-xs text-success-accent">{p.cvr}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
