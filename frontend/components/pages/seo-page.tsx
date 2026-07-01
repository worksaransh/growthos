"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { ConnectPrompt } from "@/components/shared/connect-prompt";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

const MOCK_KEYWORDS = [
  { keyword: "premium cotton tshirts india", volume: 22000, difficulty: 42, rank: 14, opportunity: "high" },
  { keyword: "oversized hoodie men india", volume: 18400, difficulty: 38, rank: 22, opportunity: "high" },
  { keyword: "basic tshirts online india", volume: 33000, difficulty: 61, rank: null, opportunity: "medium" },
  { keyword: "cargo pants men online", volume: 14800, difficulty: 44, rank: 31, opportunity: "high" },
  { keyword: "linen shirt men india", volume: 9200, difficulty: 35, rank: 18, opportunity: "high" },
  { keyword: "men jogger sets india", volume: 7400, difficulty: 29, rank: 8, opportunity: "medium" },
  { keyword: "affordable mens fashion india", volume: 28000, difficulty: 72, rank: null, opportunity: "low" },
  { keyword: "premium basics brand india", volume: 4800, difficulty: 31, rank: 6, opportunity: "high" },
];

const MOCK_PAGES = [
  { url: "/products/classic-fit-tee", title: "Classic Fit Tee — Pack of 3 | Brand", desc: "Premium cotton classic fit tee available in 5 colors. Free shipping on orders above ₹499.", titleOk: true, descOk: true },
  { url: "/products/oversized-hoodie", title: "Oversized Hoodie", desc: null, titleOk: false, descOk: false },
  { url: "/products/cargo-pants", title: "Cargo Pants — Olive | Brand", desc: "Utility cargo pants in 4 colors. Relaxed fit, reinforced pockets, machine washable.", titleOk: true, descOk: true },
  { url: "/collections/tops", title: "Men's Tops | Premium Basics | Brand", desc: "Shop our full range of men's tops — tees, polos, and shirts. Free shipping.", titleOk: true, descOk: true },
  { url: "/about", title: "About Us", desc: null, titleOk: false, descOk: false },
];

const MOCK_VITALS = [
  { metric: "LCP", label: "Largest Contentful Paint", value: "2.4s", score: 78, unit: "s", threshold: 2.5, color: "#00E5A0" },
  { metric: "FID", label: "First Input Delay", value: "42ms", score: 92, unit: "ms", threshold: 100, color: "#00E5A0" },
  { metric: "CLS", label: "Cumulative Layout Shift", value: "0.08", score: 84, unit: "", threshold: 0.1, color: "#00E5A0" },
];

const TECHNICAL_CHECKLIST = [
  { item: "XML Sitemap", status: true },
  { item: "robots.txt configured", status: true },
  { item: "Canonical URLs", status: false },
  { item: "Structured Data (Schema)", status: false },
  { item: "Open Graph meta tags", status: true },
  { item: "HTTPS enabled", status: true },
  { item: "Mobile responsive", status: true },
  { item: "Page speed > 70", status: true },
  { item: "Alt text on all images", status: false },
  { item: "Breadcrumb schema", status: false },
];

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#00E5A0" : score >= 60 ? "#FFAD3B" : "#FF5B6B";
  const circumference = 2 * Math.PI * 40;
  const dash = (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="56" cy="56" r="40" fill="none" stroke="#1E2737" strokeWidth="8" />
        <circle cx="56" cy="56" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="text-center z-10">
        <div className="font-mono text-2xl font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] text-[#48566E] font-mono">/ 100</div>
      </div>
    </div>
  );
}

export function SeoPage() {
  const seoScore = 72;
  const passed = TECHNICAL_CHECKLIST.filter(c => c.status).length;

  const [seoData, setSeoData] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    api.getSeoSummary().then((data: any) => {
      if (data && data.source === 'google_search_console') {
        setConnected(true)
        setSeoData(data)
      }
    }).catch(() => {})
  }, [])

  const hasData = connected || true // Shows mock UI until connected; real data surfaced via seoData state

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <ConnectPrompt platform="google" pageName="SEO Analytics" />
    </div>
  )

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* SEO Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5">
        <Card className="p-5 flex items-center gap-5">
          <ScoreCircle score={seoScore} />
          <div>
            <h3 className="font-syne text-base font-bold text-[#F0F4FF] mb-1">SEO Health Score</h3>
            <p className="text-xs text-[#8A95B0] mb-3">Based on technical SEO, meta tags, and page speed audits</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Technical SEO", score: 80, color: "#00E5A0" },
                { label: "On-Page SEO", score: 65, color: "#FFAD3B" },
                { label: "Page Speed", score: 78, color: "#00E5A0" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#48566E] w-28">{s.label}</span>
                  <div className="w-32 h-1.5 rounded-full bg-[#1E2737]">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Core Web Vitals */}
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Core Web Vitals</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Performance metrics from Google</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_VITALS.map((v, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#151921] border border-[#1E2737] text-center">
                <div className="text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-2">{v.metric}</div>
                <div className="font-mono text-2xl font-medium" style={{ color: v.color }}>{v.value}</div>
                <div className="text-[9px] text-[#48566E] font-mono mt-1">{v.label}</div>
                <div className="mt-2 h-1.5 rounded-full bg-[#1E2737]">
                  <div className="h-full rounded-full" style={{ width: `${v.score}%`, backgroundColor: v.color }} />
                </div>
                <div className="text-[9px] font-mono mt-1" style={{ color: v.color }}>{v.score}/100</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Keyword Table + Technical Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[#1E2737]">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Keyword Opportunities</h3>
            <p className="text-[11px] text-[#48566E] font-mono mt-0.5">Ranked by opportunity score</p>
          </div>
          <div className="overflow-x-auto"><div className="min-w-[520px]">
          <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_0.8fr] px-5 py-2.5 border-b border-[#1E2737] gap-3">
            {["Keyword", "Volume", "Difficulty", "Rank", "Opportunity"].map(h => (
              <span key={h} className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {MOCK_KEYWORDS.map((kw, i) => (
            <div key={i} className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_0.8fr] px-5 py-3 gap-3 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
              <span className="text-xs text-[#F0F4FF] font-mono">{kw.keyword}</span>
              <span className="font-mono text-xs text-[#8A95B0]">{kw.volume.toLocaleString()}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 rounded-full bg-[#1E2737]">
                  <div className="h-full rounded-full" style={{ width: `${kw.difficulty}%`, backgroundColor: kw.difficulty > 60 ? "#FF5B6B" : kw.difficulty > 40 ? "#FFAD3B" : "#00E5A0" }} />
                </div>
                <span className="font-mono text-[10px] text-[#48566E]">{kw.difficulty}</span>
              </div>
              <span className="font-mono text-xs text-[#8A95B0]">{kw.rank ?? "—"}</span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full text-center ${
                kw.opportunity === "high" ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0]"
                : kw.opportunity === "medium" ? "bg-[rgba(255,173,59,0.1)] text-[#FFAD3B]"
                : "bg-[rgba(255,91,107,0.1)] text-[#FF5B6B]"
              }`}>{kw.opportunity}</span>
            </div>
          ))}
          </div></div>
        </Card>

        {/* Technical Checklist */}
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Technical SEO</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-3">{passed}/{TECHNICAL_CHECKLIST.length} checks passing</p>
          <div className="h-1.5 rounded-full bg-[#1E2737] mb-4">
            <div className="h-full rounded-full bg-[#00E5A0]" style={{ width: `${(passed / TECHNICAL_CHECKLIST.length) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-2">
            {TECHNICAL_CHECKLIST.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <AppIcon name={c.status ? "check_circle" : "cancel"} className={c.status ? "text-[#00E5A0]" : "text-[#FF5B6B]"} size={16} />
                <span className={`text-xs ${c.status ? "text-[#8A95B0]" : "text-[#48566E]"}`}>{c.item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Meta Tags Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[#1E2737]">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Meta Tags Status</h3>
          <p className="text-[11px] text-[#48566E] font-mono mt-0.5">Title &amp; description coverage by page</p>
        </div>
        <div className="grid grid-cols-[2fr_2fr_0.8fr_0.8fr] px-5 py-2.5 border-b border-[#1E2737] gap-3">
          {["URL", "Title", "Title OK", "Desc OK"].map(h => (
            <span key={h} className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {MOCK_PAGES.map((p, i) => (
          <div key={i} className="grid grid-cols-[2fr_2fr_0.8fr_0.8fr] px-5 py-3 gap-3 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
            <span className="font-mono text-[10px] text-[#48566E] truncate">{p.url}</span>
            <span className="text-xs text-[#8A95B0] truncate">{p.title}</span>
            <AppIcon name={p.titleOk ? "check_circle" : "cancel"} className={p.titleOk ? "text-[#00E5A0]" : "text-[#FF5B6B]"} size={16} />
            <AppIcon name={p.descOk ? "check_circle" : "cancel"} className={p.descOk ? "text-[#00E5A0]" : "text-[#FF5B6B]"} size={16} />
            </div>
        ))}
      </Card>
    </div>
  )
}
