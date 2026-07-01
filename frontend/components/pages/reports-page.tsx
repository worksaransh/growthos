"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppIcon } from "@/components/shared/app-icon";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

const TABS = ["Reports", "Schedule", "AI Summary", "Export"] as const;
type Tab = (typeof TABS)[number];

const REPORT_CARDS = [
  { icon: "bar_chart", title: "Weekly Performance Report", description: "Revenue, orders, ROAS and top SKUs for the last 7 days." },
  { icon: "calendar_month", title: "Monthly Business Review", description: "End-to-end monthly P&L, channel mix and growth trends." },
  { icon: "summarize", title: "Executive Summary", description: "One-page snapshot for leadership — KPIs + key alerts." },
  { icon: "insights", title: "Investor Report", description: "GMV, unit economics and cohort data formatted for investors." },
  { icon: "campaign", title: "Campaign Report", description: "Per-campaign ROAS, CPA, CPM and creative performance breakdown." },
  { icon: "tune", title: "Custom Report", description: "Build your own report from any combination of modules." },
];

const SCHEDULED_REPORTS = [
  { name: "Weekly Performance", frequency: "Every Monday 8:00 AM", recipients: "saransh@luxoroffice.com, riya@luxoroffice.com", nextRun: "Jul 7, 2026", status: "Active" },
  { name: "Monthly Business Review", frequency: "1st of month", recipients: "founders@luxoroffice.com", nextRun: "Aug 1, 2026", status: "Active" },
  { name: "Daily Ad Spend Alert", frequency: "Daily 9:00 AM", recipients: "saransh@luxoroffice.com", nextRun: "Jul 1, 2026", status: "Paused" },
];

const RECENT_EXPORTS = [
  { name: "revenue-june-2026.pdf", date: "Jun 29, 2026", format: "PDF" },
  { name: "orders-q2-2026.xlsx", date: "Jun 15, 2026", format: "Excel" },
  { name: "customers-may-2026.csv", date: "May 31, 2026", format: "CSV" },
];

const EXPORT_MODULES = ["Revenue", "Ads", "Products", "Customers", "Finance", "Operations"];

function ReportsTab({ onToast }: { onToast: (msg: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {REPORT_CARDS.map((card) => (
        <div key={card.title} className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AppIcon name={card.icon} className="text-primary" size={24} />
            <div className="flex-1">
              <div className="font-syne font-bold text-on-surface text-sm">{card.title}</div>
              <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">{card.description}</div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-on-surface-variant">Last generated: 2 days ago</div>
          <div className="flex gap-2 mt-auto">
            <button onClick={() => onToast(`Generating ${card.title}...`)} className="primary-gradient text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Generate</button>
            <button onClick={() => onToast(`Downloading ${card.title}...`)} className="text-xs px-4 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Download</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleTab({ onToast }: { onToast: (msg: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFreq, setNewFreq] = useState("weekly");
  const [newEmail, setNewEmail] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card overflow-x-auto">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="font-syne font-bold text-on-surface text-sm">Scheduled Reports</h3>
          <button onClick={() => setShowForm((v) => !v)} className="primary-gradient text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">+ Add Schedule</button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Report Name", "Frequency", "Recipients", "Next Run", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-mono text-on-surface-variant font-normal uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHEDULED_REPORTS.map((r, i) => (
              <tr key={i} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors">
                <td className="px-5 py-3 text-on-surface font-medium">{r.name}</td>
                <td className="px-5 py-3 text-on-surface-variant font-mono">{r.frequency}</td>
                <td className="px-5 py-3 text-on-surface-variant max-w-[180px] truncate">{r.recipients}</td>
                <td className="px-5 py-3 text-on-surface-variant font-mono">{r.nextRun}</td>
                <td className="px-5 py-3">
                  <span className={r.status === "Active" ? "badge-success" : "badge-warning"}>{r.status}</span>
                </td>
                <td className="px-5 py-3 flex gap-2">
                  <button onClick={() => onToast(`Editing ${r.name}...`)} className="text-[11px] text-on-surface-variant hover:text-primary transition-colors">Edit</button>
                  <button onClick={() => onToast(`Deleted ${r.name}`)} className="text-[11px] text-red-400 hover:text-red-300 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-4">
          <h4 className="font-syne font-bold text-on-surface text-sm">New Scheduled Report</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Report Name</label>
              <input className="input-base" placeholder="e.g. Weekly Performance" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Frequency</label>
              <select className="input-base" value={newFreq} onChange={(e) => setNewFreq(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Recipients</label>
              <input className="input-base" placeholder="email@domain.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onToast("Schedule created!"); setShowForm(false); }} className="primary-gradient text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">Save Schedule</button>
            <button onClick={() => setShowForm(false)} className="text-xs px-5 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AiSummaryTab({ onToast }: { onToast: (msg: string) => void }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [loading, setLoading] = useState(false);
  const RANGES: Array<"7d" | "30d" | "90d"> = ["7d", "30d", "90d"];

  const handleRegen = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onToast("Summary regenerated!"); }, 1500);
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AppIcon name="auto_awesome" className="text-primary" size={20} />
          <h3 className="font-syne font-bold text-on-surface">AI-Generated Business Summary</h3>
        </div>
        <div className="flex gap-1 bg-surface-container rounded-lg p-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${range === r ? "primary-gradient text-white" : "text-on-surface-variant hover:text-on-surface"}`}>Last {r}</button>
          ))}
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-5 text-sm text-on-surface-variant leading-relaxed space-y-3 border border-outline-variant">
        <p>Your business had a strong week with <span className="text-on-surface font-semibold">₹12.4L revenue</span> <span className="text-green-400">(+18% vs last week)</span>. Your blended ROAS improved to <span className="text-primary font-semibold">4.45x</span> driven by Meta&apos;s new Advantage+ campaigns.</p>
        <p>Key concern: return rate climbed to <span className="text-amber-400 font-semibold">11.2%</span> on SKU-2847 — recommend investigating product quality or description accuracy.</p>
        <p>Top recommendation: Reallocate <span className="text-on-surface font-semibold">₹1.5L</span> from Google Display <span className="text-red-400">(1.8x ROAS)</span> to Meta Advantage+ <span className="text-green-400">(5.2x ROAS)</span> for projected <span className="text-on-surface font-semibold">₹2.1L</span> revenue increase over the next 14 days.</p>
        <p>CAC improved from ₹912 → ₹847 (−7.1%) while AOV held steady at ₹3,766. Your top SKU &quot;Classic Fit Tee Pack&quot; generated ₹8.9L (34.2% margin). Inventory health is good — 2 SKUs have &lt;7 days of stock remaining.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={handleRegen} disabled={loading} className="primary-gradient text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">{loading ? "Generating..." : "Regenerate Summary"}</button>
        <button onClick={() => onToast("Copied to clipboard!")} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Copy to Clipboard</button>
        <button onClick={() => onToast("Exporting as PDF...")} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Export as PDF</button>
        <button onClick={() => onToast("Email sent to team!")} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Email to Team</button>
      </div>
    </div>
  );
}

function ExportTab({ onToast }: { onToast: (msg: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Revenue", "Ads"]));
  const [format, setFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-06-30");

  const toggle = (mod: string) => {
    const next = new Set(selected);
    if (next.has(mod)) next.delete(mod); else next.add(mod);
    setSelected(next);
  };

  const FORMATS: Array<"PDF" | "Excel" | "CSV"> = ["PDF", "Excel", "CSV"];
  const FORMAT_BADGE: Record<string, string> = { PDF: "badge-error", Excel: "badge-success", CSV: "badge-info" };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card p-5 flex flex-col gap-5">
        <h3 className="font-syne font-bold text-on-surface text-sm">Export Builder</h3>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-3">Modules</label>
          <div className="flex flex-wrap gap-2">
            {EXPORT_MODULES.map((mod) => (
              <button key={mod} onClick={() => toggle(mod)} className={`text-xs px-4 py-2 rounded-lg border transition-all font-mono inline-flex items-center gap-1.5 ${selected.has(mod) ? "border-primary text-primary bg-primary/10" : "border-outline-variant text-on-surface-variant hover:border-primary/50"}`}>
                {selected.has(mod) && <AppIcon name="check" size={12} />}
                {mod}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">From</label>
            <input type="date" className="input-base" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">To</label>
            <input type="date" className="input-base" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-3">Format</label>
          <div className="flex gap-1 bg-surface-container rounded-lg p-1 w-fit">
            {FORMATS.map((f) => (
              <button key={f} onClick={() => setFormat(f)} className={`text-xs px-5 py-2 rounded-md font-mono font-semibold transition-all ${format === f ? "primary-gradient text-white" : "text-on-surface-variant hover:text-on-surface"}`}>{f}</button>
            ))}
          </div>
        </div>
        <button onClick={() => onToast(`Generating ${format} export for ${selected.size} modules...`)} className="primary-gradient text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm w-fit">Generate Export</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h4 className="font-syne font-bold text-on-surface text-sm">Recent Exports</h4>
        </div>
        <div className="divide-y divide-outline-variant">
          {RECENT_EXPORTS.map((ex, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm text-on-surface font-mono">{ex.name}</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">{ex.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={FORMAT_BADGE[ex.format]}>{ex.format}</span>
                <button onClick={() => onToast(`Downloading ${ex.name}...`)} className="text-xs text-primary hover:text-primary/80 transition-colors font-mono">↓ Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Reports");

  const notify = (msg: string) => toast({ type: "success", title: msg, message: "" });

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne text-base font-bold text-on-surface">Reports</h2>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">Generate, schedule and export business reports</p>
        </div>
      </div>
      <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`text-xs px-4 py-2 rounded-lg font-mono font-medium transition-all ${activeTab === tab ? "primary-gradient text-white" : "text-on-surface-variant hover:text-on-surface"}`}>{tab}</button>
        ))}
      </div>
      {activeTab === "Reports" && <ReportsTab onToast={notify} />}
      {activeTab === "Schedule" && <ScheduleTab onToast={notify} />}
      {activeTab === "AI Summary" && <AiSummaryTab onToast={notify} />}
      {activeTab === "Export" && <ExportTab onToast={notify} />}
    </div>
  );
}
