"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

// ── Data ──────────────────────────────────────────────────────────────────

const CASE_STUDIES_FALLBACK = [
  {
    id: "glow-naturals",
    brand: "Glow Naturals",
    category: "Skincare",
    logo: "spa",
    logoColor: "#ddb7ff",
    tagline: "From 2.1x to 4.8x ROAS in 90 days",
    description:
      "Glow Naturals was scaling fast but bleeding margin. Meta spend had grown 3x but ROAS was declining. GrowthOS gave them SKU-level profit visibility and AI-powered ad optimisation that transformed their unit economics.",
    hero_metric: "4.8x",
    hero_label: "ROAS",
    metrics: [
      { label: "Revenue Growth", value: "+68%", period: "in 90 days" },
      { label: "ROAS Improvement", value: "2.1x → 4.8x", period: "blended" },
      { label: "CAC Reduction", value: "-34%", period: "vs prev quarter" },
      { label: "Net Margin", value: "+6.2pp", period: "improvement" },
    ],
    tags: ["Skincare", "Meta Ads", "Profit Engine"],
    results: [
      "Identified 3 loss-making SKUs hidden by blended revenue reporting",
      "Paused ₹4.2L/month in unprofitable ad spend within week 1",
      "Launched UGC-first creative strategy recommended by Ads AI",
      "Reduced return rate from 18% to 11% via WhatsApp post-purchase flow",
    ],
    quote:
      "GrowthOS showed me I was paying ₹840 to acquire a customer worth ₹620. We fixed that in 3 weeks.",
    quoteName: "Priya Mehta",
    quoteRole: "Founder, Glow Naturals",
    gmv: "₹8Cr",
    featured: true,
  },
  {
    id: "apex-footwear",
    brand: "Apex Footwear",
    category: "Fashion",
    logo: "steps",
    logoColor: "#7bd0ff",
    tagline: "₹2.4Cr revenue recovered from abandoned carts",
    description:
      "Apex Footwear had a 76% cart abandonment rate with no automated recovery. GrowthOS's WhatsApp automation and AI-driven segmentation turned their biggest revenue leak into a growth channel.",
    hero_metric: "₹2.4Cr",
    hero_label: "Recovered",
    metrics: [
      { label: "Cart Recovery Rate", value: "28%", period: "from 0%" },
      { label: "WhatsApp ROAS", value: "11.2x", period: "on recovery" },
      { label: "Repeat Purchase Rate", value: "+42%", period: "via RFM" },
      { label: "Revenue Recovered", value: "₹2.4Cr", period: "in 6 months" },
    ],
    tags: ["Fashion", "WhatsApp", "RFM Segments"],
    results: [
      "3-step WhatsApp cart recovery sequence built in 20 minutes with AI",
      "RFM segmentation identified 1,200 VIP customers for exclusive drops",
      "Forecast Engine predicted stockouts 3 weeks early — zero lost sales",
      "Shiprocket RTO rate dropped from 22% to 9% with COD verification flow",
    ],
    quote:
      "We were leaving ₹40L on the table every month. GrowthOS automated recovery and now WhatsApp is our highest-ROAS channel.",
    quoteName: "Rohan Kapoor",
    quoteRole: "Co-Founder, Apex Footwear",
    gmv: "₹15Cr",
    featured: true,
  },
  {
    id: "pure-origins",
    brand: "Pure Origins",
    category: "Health & Nutrition",
    logo: "eco",
    logoColor: "#4ade80",
    tagline: "Scaled from ₹50L to ₹3Cr MRR in 12 months",
    description:
      "Pure Origins was a bootstrapped supplement brand with great products but zero data infrastructure. GrowthOS became their analytics team, CFO, and growth advisor — all in one platform.",
    hero_metric: "6x",
    hero_label: "Revenue Growth",
    metrics: [
      { label: "MRR Growth", value: "₹50L → ₹3Cr", period: "12 months" },
      { label: "Gross Margin", value: "68%", period: "maintained" },
      { label: "LTV:CAC Ratio", value: "7.2x", period: "avg across channels" },
      { label: "Team Size", value: "3 people", period: "no extra hires" },
    ],
    tags: ["Health", "Founder AI", "Finance"],
    results: [
      "Founder AI replaced the need for a dedicated analyst for 12 months",
      "P&L per SKU revealed protein powder had 3x the margin of supplements",
      "Google Ads scaled to ₹80L/month spend at 3.9x ROAS with AI guidance",
      "Automated reorder alerts prevented 4 major stockout events",
    ],
    quote:
      "I'm a 3-person team competing with companies 10x our size. GrowthOS is how we punch above our weight.",
    quoteName: "Aisha Patel",
    quoteRole: "Founder, Pure Origins",
    gmv: "₹36Cr",
    featured: false,
  },
  {
    id: "urban-thread",
    brand: "Urban Thread Co",
    category: "Apparel",
    logo: "checkroom",
    logoColor: "#fb923c",
    tagline: "Google Ads efficiency improved 3.8x in 60 days",
    description:
      "Urban Thread Co was spending ₹25L/month on Google Ads with declining returns. The SEO & Ads AI found their winning keywords, killed waste, and rebuilt their campaign structure from scratch.",
    hero_metric: "3.8x",
    hero_label: "Efficiency Gain",
    metrics: [
      { label: "Google Ads ROAS", value: "1.4x → 3.8x", period: "60 days" },
      { label: "Wasted Spend Eliminated", value: "₹8.4L/mo", period: "identified" },
      { label: "Organic Traffic", value: "+210%", period: "via SEO AI" },
      { label: "Revenue per Visitor", value: "+67%", period: "improvement" },
    ],
    tags: ["Apparel", "Google Ads", "SEO"],
    results: [
      "SEO AI identified 34 high-intent keywords competitors were missing",
      "Google Search campaign restructured around product-level profitability",
      "Shopping feed optimisation lifted CTR from 1.2% to 3.8%",
      "Attribution model switched from last-click to data-driven — budget reallocation saved ₹3L/month",
    ],
    quote:
      "Our Google agency couldn't explain why ROAS was dropping. GrowthOS diagnosed it in 4 minutes and fixed it in a week.",
    quoteName: "Vikram Nair",
    quoteRole: "CMO, Urban Thread Co",
    gmv: "₹22Cr",
    featured: false,
  },
  {
    id: "bloom-co",
    brand: "Bloom & Co",
    category: "Home Decor",
    logo: "local_florist",
    logoColor: "#c0c1ff",
    tagline: "RTO rate cut from 31% to 8% in 45 days",
    description:
      "Bloom & Co was losing ₹12L/month to return-to-origin shipments — the hidden killer of D2C margins. GrowthOS's RTO prediction model and WhatsApp COD verification transformed their operations.",
    hero_metric: "8%",
    hero_label: "RTO Rate",
    metrics: [
      { label: "RTO Reduction", value: "31% → 8%", period: "45 days" },
      { label: "Savings per Month", value: "₹12L", period: "in reverse logistics" },
      { label: "COD Verification Rate", value: "94%", period: "via WhatsApp" },
      { label: "NPS Improvement", value: "+28 points", period: "post-delivery" },
    ],
    tags: ["Home Decor", "RTO", "WhatsApp", "Shiprocket"],
    results: [
      "AI flagged high-RTO pincodes and restricted COD automatically",
      "WhatsApp COD confirmation flow reduced fake orders by 78%",
      "Shiprocket courier performance scoring switched to top-performing partners",
      "NDR automation resolved 60% of delivery exceptions without human intervention",
    ],
    quote:
      "RTO was eating us alive. GrowthOS didn't just show us the problem — it automated the solution.",
    quoteName: "Neha Sharma",
    quoteRole: "Operations Head, Bloom & Co",
    gmv: "₹9Cr",
    featured: false,
  },
  {
    id: "zest-beverages",
    brand: "Zest Beverages",
    category: "F&B",
    logo: "local_bar",
    logoColor: "#fbbf24",
    tagline: "Subscription revenue grew 4x with AI cohort analysis",
    description:
      "Zest Beverages was struggling with high churn on their subscription boxes. GrowthOS's cohort analysis and retention AI identified exactly when customers churned and why — enabling surgical intervention.",
    hero_metric: "4x",
    hero_label: "Subscription Growth",
    metrics: [
      { label: "Subscription Revenue", value: "4x", period: "in 8 months" },
      { label: "Churn Rate", value: "18% → 6%", period: "monthly" },
      { label: "LTV Increase", value: "+₹2,400", period: "per customer" },
      { label: "Win-back Rate", value: "34%", period: "of churned customers" },
    ],
    tags: ["F&B", "Retention", "Cohort Analysis"],
    results: [
      "Cohort analysis revealed 87% of churn happened at day 47 post-signup",
      "Personalised WhatsApp check-in at day 40 reduced churn by 62%",
      "Win-back campaign with 15% discount recovered 34% of churned subscribers",
      "Bundle recommendations increased average order value by ₹380",
    ],
    quote:
      "We thought we had a product problem. GrowthOS showed us it was a communication gap at a very specific moment in the customer journey.",
    quoteName: "Arjun Singh",
    quoteRole: "CEO, Zest Beverages",
    gmv: "₹6Cr",
    featured: false,
  },
];

type CaseStudy = (typeof CASE_STUDIES_FALLBACK)[0] & {
  image?: string;
  image_alt?: string;
  imageAlt?: string;
  logo_color?: string;
  quote_name?: string;
  quote_role?: string;
};

const CATEGORIES = ["All", "Skincare", "Fashion", "Health", "Health & Nutrition", "Apparel", "Home Decor", "F&B", "Beauty", "Sports", "Electronics"];

const CASE_VISUAL_BY_ID: Record<string, string> = {
  "glow-naturals": "/visuals/marketing-command-desk.png",
  "apex-footwear": "/visuals/marketing-command-desk.png",
  "pure-origins": "/visuals/ai-operating-system.png",
  "urban-thread": "/visuals/marketing-command-desk.png",
  "bloom-co": "/visuals/inventory-warehouse.png",
  "zest-beverages": "/visuals/founder-workspace.png",
};

const CASE_VISUAL_BY_CATEGORY: Record<string, string> = {
  Apparel: "/visuals/marketing-command-desk.png",
  Beauty: "/visuals/marketing-command-desk.png",
  "F&B": "/visuals/founder-workspace.png",
  Fashion: "/visuals/marketing-command-desk.png",
  Health: "/visuals/ai-operating-system.png",
  "Health & Nutrition": "/visuals/ai-operating-system.png",
  "Home Decor": "/visuals/inventory-warehouse.png",
  Skincare: "/visuals/marketing-command-desk.png",
};

function getCaseVisual(cs: CaseStudy) {
  return {
    src: cs.image || CASE_VISUAL_BY_ID[cs.id] || CASE_VISUAL_BY_CATEGORY[cs.category] || "/visuals/founder-workspace.png",
    alt: cs.image_alt || cs.imageAlt || `${cs.brand} GrowthOS case study visual`,
  };
}

function normalizeCaseStudy(row: CaseStudy): CaseStudy {
  return {
    ...row,
    logoColor: row.logoColor || row.logo_color || "#c0c1ff",
    quoteName: row.quoteName || row.quote_name || "",
    quoteRole: row.quoteRole || row.quote_role || "",
    metrics: Array.isArray(row.metrics) ? row.metrics : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    results: Array.isArray(row.results) ? row.results : [],
  };
}

// ── Components ────────────────────────────────────────────────────────────

function StatBar({ total }: { total: number }) {
  const stats = [
    { value: "₹200Cr+", label: "GMV managed on platform" },
    { value: "3.8x", label: "Average ROAS improvement" },
    { value: "47%", label: "Average CAC reduction" },
    { value: `${total}+`, label: "Brands growing with us" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-16">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#0b1326] px-6 py-6 text-center">
          <p className="text-3xl font-bold text-[#c0c1ff] mb-1">{s.value}</p>
          <p className="text-[#c7c4d7] text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  );
}


function FeaturedCard({ cs }: { cs: CaseStudy }) {
  const visual = getCaseVisual(cs);

  return (
    <Link href={`/case-studies/${cs.id}`} className="group block">
      <div className="relative rounded-3xl border border-white/10 bg-[#0f1729] overflow-hidden hover:border-[#c0c1ff]/30 transition-all duration-300 hover:-translate-y-1">
        {/* Top accent */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${cs.logoColor}, transparent)`,
          }}
        />

        <div className="relative h-56 overflow-hidden">
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/30 to-transparent" />
          <div className="absolute bottom-5 left-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1326]/75 backdrop-blur-md"
              style={{ color: cs.logoColor }}
            >
              <AppIcon name={cs.logo} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">{cs.category}</p>
              <p className="text-sm font-semibold text-[#dbe2fd]">{cs.gmv} GMV</p>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: cs.logoColor + "15" }}
              >
                <AppIcon name={cs.logo} size={22} style={{ color: cs.logoColor }} />
              </div>
              <div>
                <p className="text-[#dbe2fd] font-bold text-lg">{cs.brand}</p>
                <p className="text-[#c7c4d7] text-sm">{cs.category} · {cs.gmv} GMV</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-4xl font-black"
                style={{ color: cs.logoColor }}
              >
                {cs.hero_metric}
              </p>
              <p className="text-[#c7c4d7] text-xs uppercase tracking-widest">
                {cs.hero_label}
              </p>
            </div>
          </div>

          <h3 className="text-[#dbe2fd] text-xl font-bold mb-2 group-hover:text-white transition-colors">
            {cs.tagline}
          </h3>
          <p className="text-[#c7c4d7] text-sm leading-relaxed mb-6">
            {cs.description}
          </p>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {cs.metrics.map((m) => (
              <div
                key={m.label}
                className="bg-white/[0.03] rounded-xl px-4 py-3"
              >
                <p className="text-[#dbe2fd] font-bold text-base">{m.value}</p>
                <p className="text-[#c7c4d7] text-xs mt-0.5">
                  {m.label} · {m.period}
                </p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="border-l-2 border-[#c0c1ff]/30 pl-4 mb-6">
            <p className="text-[#dbe2fd] text-sm italic leading-relaxed">
              &ldquo;{cs.quote}&rdquo;
            </p>
            <p className="text-[#c7c4d7] text-xs mt-2">
              — {cs.quoteName}, {cs.quoteRole}
            </p>
          </div>

          {/* Tags + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {cs.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-[#c7c4d7] uppercase tracking-wide"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="text-[#c0c1ff] text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
              Read more →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompactCard({ cs }: { cs: CaseStudy }) {
  const visual = getCaseVisual(cs);

  return (
    <Link href={`/case-studies/${cs.id}`} className="group block">
      <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6 hover:border-[#c0c1ff]/30 transition-all duration-300 hover:-translate-y-0.5 h-full overflow-hidden">
        <div className="-mx-6 -mt-6 mb-5 h-32 relative overflow-hidden">
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/30 to-transparent" />
          <div
            className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0b1326]/75 backdrop-blur-md"
            style={{ color: cs.logoColor }}
          >
            <AppIcon name={cs.logo} size={19} />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cs.logoColor + "15" }}
          >
            <AppIcon name={cs.logo} size={18} style={{ color: cs.logoColor }} />
          </div>
          <div>
            <p className="text-[#dbe2fd] font-semibold text-sm">{cs.brand}</p>
            <p className="text-[#c7c4d7] text-xs">{cs.category}</p>
          </div>
          <div className="ml-auto text-right">
            <p
              className="text-xl font-black"
              style={{ color: cs.logoColor }}
            >
              {cs.hero_metric}
            </p>
            <p className="text-[#464554] text-[9px] uppercase tracking-widest">
              {cs.hero_label}
            </p>
          </div>
        </div>

        <h3 className="text-[#dbe2fd] font-bold text-sm mb-2 group-hover:text-white transition-colors">
          {cs.tagline}
        </h3>
        <p className="text-[#c7c4d7] text-xs leading-relaxed mb-4 line-clamp-3">
          {cs.description}
        </p>

        <div className="border-l-2 border-white/10 pl-3 mb-4">
          <p className="text-[#c7c4d7] text-xs italic line-clamp-2">
            &ldquo;{cs.quote}&rdquo;
          </p>
          <p className="text-[#464554] text-[10px] mt-1">— {cs.quoteName}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {cs.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#c7c4d7] uppercase tracking-wide"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="text-[#c0c1ff] text-xs font-medium group-hover:translate-x-1 transition-transform inline-block">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}

// CaseCard — alias for grid use (featured uses FeaturedCard, rest uses CompactCard)
const CaseCard = CompactCard;

// ── Page ──────────────────────────────────────────────────────────────────

export default function CaseStudiesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activeCategory, setActiveCategory] = useState("All");
  const [allCases, setAllCases] = useState<CaseStudy[]>(CASE_STUDIES_FALLBACK);

  useEffect(() => {
    supabase
      .from("case_studies")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setAllCases((data as CaseStudy[]).map(normalizeCaseStudy));
      });
  }, [supabase]);

  const filtered =
    activeCategory === "All"
      ? allCases
      : allCases.filter((cs) =>
          cs.tags.some((t) =>
            t.toLowerCase().includes(activeCategory.toLowerCase())
          ) || cs.category === activeCategory || cs.category.toLowerCase().includes(activeCategory.toLowerCase())
        );

  const featured = filtered.filter((cs) => cs.featured);
  const rest = filtered.filter((cs) => !cs.featured);

  return (
    <div className="min-h-screen bg-[#0b1326]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <Image
          src="/visuals/founder-workspace.png"
          alt="GrowthOS customer success workspace with dashboards and ecommerce performance data"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-[#0b1326]/[0.78]" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 text-[#c0c1ff] text-sm font-medium mb-6">
            <AppIcon name="verified" size={15} />
            Real results from real brands
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-[#dbe2fd] mb-6 leading-tight">
            Brands that scaled
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 50%, #7bd0ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              profitably with GrowthOS
            </span>
          </h1>

          <p className="text-[#c7c4d7] text-xl max-w-2xl mx-auto mb-10">
            From recovering ₹2.4Cr in abandoned carts to cutting RTO from 31%
            to 8% — see how India&apos;s fastest-growing D2C brands use
            GrowthOS to win.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-[#0b1326] text-base transition-all hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)",
            }}
          >
            Start your story
            <AppIcon name="arrow_forward" size={16} />
          </Link>
        </div>
      </section>

      {/* Aggregate stats */}
      <section className="px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <StatBar total={allCases.length} />
        </div>
      </section>

      {/* Category filter */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-[#c0c1ff]/15 border border-[#c0c1ff]/30 text-[#c0c1ff]"
                    : "bg-white/[0.03] border border-white/10 text-[#464554] hover:text-[#c7c4d7] hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured case studies */}
      {featured.length > 0 && (
        <section className="px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-5">Featured</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((cs) => <CaseCard key={cs.id} cs={cs} />)}
            </div>
          </div>
        </section>
      )}

      {/* All other case studies */}
      {rest.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {featured.length > 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-5">More Stories</p>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((cs) => <CaseCard key={cs.id} cs={cs} />)}
            </div>
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24">
          <p className="text-[#464554] text-sm">No case studies in this category yet.</p>
        </div>
      )}

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-[#c0c1ff]/20 bg-[#c0c1ff]/5 p-12">
            <h2 className="text-3xl font-black text-[#dbe2fd] mb-4">
              Ready to write your success story?
            </h2>
            <p className="text-[#c7c4d7] text-lg mb-8">
              Join 500+ brands already scaling profitably with GrowthOS.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-[#0b1326] text-base transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
            >
              Start free trial
              <AppIcon name="arrow_forward" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
