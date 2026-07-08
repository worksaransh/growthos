"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

type Metric = { label: string; value: string; period: string };

type CaseStudy = {
  id: string;
  brand: string;
  category: string;
  logo: string;
  logoColor?: string;
  logo_color?: string;
  tagline: string;
  description: string;
  hero_metric: string;
  hero_label: string;
  metrics: Metric[];
  tags: string[];
  results: string[];
  quote?: string;
  quoteName?: string;
  quoteRole?: string;
  quote_name?: string;
  quote_role?: string;
  gmv?: string;
  image?: string;
  image_alt?: string;
  imageAlt?: string;
};

const FALLBACK_CASE_STUDIES: CaseStudy[] = [
  {
    id: "glow-naturals",
    brand: "Glow Naturals",
    category: "Skincare",
    logo: "spa",
    logoColor: "#ddb7ff",
    tagline: "From 2.1x to 4.8x ROAS in 90 days",
    description:
      "Glow Naturals was scaling fast but bleeding margin. Meta spend had grown 3x while ROAS was declining. GrowthOS gave the team SKU-level profit visibility and AI-powered ad optimisation.",
    hero_metric: "4.8x",
    hero_label: "ROAS",
    gmv: "Rs8Cr",
    metrics: [
      { label: "Revenue Growth", value: "+68%", period: "in 90 days" },
      { label: "ROAS Improvement", value: "2.1x to 4.8x", period: "blended" },
      { label: "CAC Reduction", value: "-34%", period: "vs prev quarter" },
      { label: "Net Margin", value: "+6.2pp", period: "improvement" },
    ],
    tags: ["Skincare", "Meta Ads", "Profit Engine"],
    results: [
      "Identified 3 loss-making SKUs hidden by blended revenue reporting",
      "Paused Rs4.2L/month in unprofitable ad spend within week 1",
      "Launched UGC-first creative strategy recommended by Ads AI",
      "Reduced return rate from 18% to 11% via WhatsApp post-purchase flow",
    ],
    quote:
      "GrowthOS showed me I was paying Rs840 to acquire a customer worth Rs620. We fixed that in 3 weeks.",
    quoteName: "Priya Mehta",
    quoteRole: "Founder, Glow Naturals",
  },
  {
    id: "apex-footwear",
    brand: "Apex Footwear",
    category: "Fashion",
    logo: "steps",
    logoColor: "#7bd0ff",
    tagline: "Rs2.4Cr revenue recovered from abandoned carts",
    description:
      "Apex Footwear had a 76% cart abandonment rate with no automated recovery. GrowthOS's WhatsApp automation and AI-driven segmentation turned their biggest revenue leak into a growth channel.",
    hero_metric: "Rs2.4Cr",
    hero_label: "Recovered",
    gmv: "Rs15Cr",
    metrics: [
      { label: "Cart Recovery Rate", value: "28%", period: "from 0%" },
      { label: "WhatsApp ROAS", value: "11.2x", period: "on recovery" },
      { label: "Repeat Purchase Rate", value: "+42%", period: "via RFM" },
      { label: "Revenue Recovered", value: "Rs2.4Cr", period: "in 6 months" },
    ],
    tags: ["Fashion", "WhatsApp", "RFM Segments"],
    results: [
      "Built a 3-step WhatsApp cart recovery sequence in 20 minutes with AI",
      "Identified 1,200 VIP customers for exclusive drops",
      "Predicted stockouts 3 weeks early and avoided lost sales",
      "Dropped Shiprocket RTO rate from 22% to 9% with COD verification",
    ],
    quote:
      "We were leaving Rs40L on the table every month. GrowthOS automated recovery and now WhatsApp is our highest-ROAS channel.",
    quoteName: "Rohan Kapoor",
    quoteRole: "Co-Founder, Apex Footwear",
  },
  {
    id: "pure-origins",
    brand: "Pure Origins",
    category: "Health & Nutrition",
    logo: "eco",
    logoColor: "#4ade80",
    tagline: "Scaled from Rs50L to Rs3Cr MRR in 12 months",
    description:
      "Pure Origins was a bootstrapped supplement brand with great products but zero data infrastructure. GrowthOS became their analytics team, CFO, and growth advisor in one place.",
    hero_metric: "6x",
    hero_label: "Revenue Growth",
    gmv: "Rs36Cr",
    metrics: [
      { label: "MRR Growth", value: "Rs50L to Rs3Cr", period: "12 months" },
      { label: "Gross Margin", value: "68%", period: "maintained" },
      { label: "LTV:CAC Ratio", value: "7.2x", period: "avg across channels" },
      { label: "Team Size", value: "3 people", period: "no extra hires" },
    ],
    tags: ["Health", "Founder AI", "Finance"],
    results: [
      "Replaced dedicated analyst work with Founder AI for operating questions",
      "Found protein powder had 3x the margin of lower-performing supplements",
      "Scaled Google Ads to Rs80L/month at 3.9x ROAS",
      "Prevented 4 major stockout events with automated reorder alerts",
    ],
    quote:
      "I'm a 3-person team competing with companies 10x our size. GrowthOS is how we punch above our weight.",
    quoteName: "Aisha Patel",
    quoteRole: "Founder, Pure Origins",
  },
  {
    id: "urban-thread",
    brand: "Urban Thread Co",
    category: "Apparel",
    logo: "checkroom",
    logoColor: "#fb923c",
    tagline: "Google Ads efficiency improved 3.8x in 60 days",
    description:
      "Urban Thread Co was spending Rs25L/month on Google Ads with declining returns. SEO & Ads AI found their winning keywords, killed waste, and rebuilt campaign structure.",
    hero_metric: "3.8x",
    hero_label: "Efficiency Gain",
    gmv: "Rs22Cr",
    metrics: [
      { label: "Google Ads ROAS", value: "1.4x to 3.8x", period: "60 days" },
      { label: "Wasted Spend Eliminated", value: "Rs8.4L/mo", period: "identified" },
      { label: "Organic Traffic", value: "+210%", period: "via SEO AI" },
      { label: "Revenue per Visitor", value: "+67%", period: "improvement" },
    ],
    tags: ["Apparel", "Google Ads", "SEO"],
    results: [
      "Identified 34 high-intent keywords competitors were missing",
      "Rebuilt search campaigns around product-level profitability",
      "Lifted Shopping feed CTR from 1.2% to 3.8%",
      "Saved Rs3L/month through attribution-led budget reallocation",
    ],
    quote:
      "Our Google agency couldn't explain why ROAS was dropping. GrowthOS diagnosed it in 4 minutes and fixed it in a week.",
    quoteName: "Vikram Nair",
    quoteRole: "CMO, Urban Thread Co",
  },
  {
    id: "bloom-co",
    brand: "Bloom & Co",
    category: "Home Decor",
    logo: "local_florist",
    logoColor: "#c0c1ff",
    tagline: "RTO rate cut from 31% to 8% in 45 days",
    description:
      "Bloom & Co was losing Rs12L/month to return-to-origin shipments. GrowthOS's RTO prediction model and WhatsApp COD verification transformed operations.",
    hero_metric: "8%",
    hero_label: "RTO Rate",
    gmv: "Rs9Cr",
    metrics: [
      { label: "RTO Reduction", value: "31% to 8%", period: "45 days" },
      { label: "Savings per Month", value: "Rs12L", period: "reverse logistics" },
      { label: "COD Verification Rate", value: "94%", period: "via WhatsApp" },
      { label: "NPS Improvement", value: "+28 points", period: "post-delivery" },
    ],
    tags: ["Home Decor", "RTO", "WhatsApp", "Shiprocket"],
    results: [
      "Flagged high-RTO pincodes and restricted COD automatically",
      "Reduced fake orders by 78% with WhatsApp COD confirmation",
      "Shifted courier routing to top-performing partners by pincode",
      "Resolved 60% of delivery exceptions without manual intervention",
    ],
    quote:
      "RTO was eating us alive. GrowthOS didn't just show us the problem - it automated the solution.",
    quoteName: "Neha Sharma",
    quoteRole: "Operations Head, Bloom & Co",
  },
  {
    id: "zest-beverages",
    brand: "Zest Beverages",
    category: "F&B",
    logo: "local_bar",
    logoColor: "#fbbf24",
    tagline: "Subscription revenue grew 4x with AI cohort analysis",
    description:
      "Zest Beverages had high subscription churn. GrowthOS's cohort analysis and retention AI identified exactly when customers churned and why.",
    hero_metric: "4x",
    hero_label: "Subscription Growth",
    gmv: "Rs6Cr",
    metrics: [
      { label: "Subscription Revenue", value: "4x", period: "in 8 months" },
      { label: "Churn Rate", value: "18% to 6%", period: "monthly" },
      { label: "LTV Increase", value: "+Rs2,400", period: "per customer" },
      { label: "Win-back Rate", value: "34%", period: "of churned customers" },
    ],
    tags: ["F&B", "Retention", "Cohort Analysis"],
    results: [
      "Found 87% of churn happened at day 47 post-signup",
      "Reduced churn by 62% with a day-40 WhatsApp check-in",
      "Recovered 34% of churned subscribers with a win-back campaign",
      "Increased average order value by Rs380 through bundle recommendations",
    ],
    quote:
      "We thought we had a product problem. GrowthOS showed us it was a communication gap at a very specific moment.",
    quoteName: "Arjun Singh",
    quoteRole: "CEO, Zest Beverages",
  },
];

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

function getCaseVisual(cs: CaseStudy) {
  return {
    src: cs.image || CASE_VISUAL_BY_ID[cs.id] || CASE_VISUAL_BY_CATEGORY[cs.category] || "/visuals/founder-workspace.png",
    alt: cs.image_alt || cs.imageAlt || `${cs.brand} GrowthOS case study visual`,
  };
}

export default function CaseStudyDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const fallback = FALLBACK_CASE_STUDIES.find((study) => study.id === id);
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(fallback ? normalizeCaseStudy(fallback) : null);
  const [loading, setLoading] = useState(!fallback);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    async function loadCaseStudy() {
      const { data } = await supabase
        .from("case_studies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (data) {
        setCaseStudy(normalizeCaseStudy(data as CaseStudy));
      } else {
        setCaseStudy(fallback ? normalizeCaseStudy(fallback) : null);
      }

      if (active) setLoading(false);
    }

    loadCaseStudy().catch(() => {
      if (active) {
        setCaseStudy(fallback ? normalizeCaseStudy(fallback) : null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [fallback, id, supabase]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setCaseStudy(null);
    }
  }, [id]);

  if (!caseStudy && !loading) {
    return (
      <div className="min-h-screen bg-[#0b1326] px-4 pt-28">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0f1729] p-10 text-center">
          <AppIcon name="search_off" size={44} className="mx-auto mb-4 text-[#464554]" />
          <h1 className="mb-2 text-2xl font-black text-[#dbe2fd]">Case study not found</h1>
          <p className="mb-6 text-sm text-[#c7c4d7]">This story is not available yet.</p>
          <Link href="/case-studies" className="text-sm font-semibold text-[#c0c1ff] hover:text-white">
            Back to case studies
          </Link>
        </div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="min-h-screen bg-[#0b1326] px-4 pt-28">
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl border border-white/10 bg-[#0f1729] p-10">
          <div className="mb-6 h-72 rounded-2xl bg-white/[0.04]" />
          <div className="h-8 w-2/3 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  const visual = getCaseVisual(caseStudy);

  return (
    <div className="min-h-screen bg-[#0b1326]">
      <section className="relative overflow-hidden px-4 pb-14 pt-24">
        <Image
          src={visual.src}
          alt={visual.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.24]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1326]/[0.82] via-[#0b1326]/[0.86] to-[#0b1326]" />

        <div className="relative mx-auto max-w-6xl">
          <Link href="/case-studies" className="mb-8 inline-flex items-center gap-1.5 text-sm text-[#c0c1ff] transition-colors hover:text-white">
            <AppIcon name="arrow_forward" size={15} className="rotate-180" />
            Back to case studies
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1326]/70 p-3 backdrop-blur-md"
                  style={{ color: caseStudy.logoColor }}
                >
                  <AppIcon name={caseStudy.logo} size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">{caseStudy.category}</p>
                  <p className="text-sm font-semibold text-[#dbe2fd]">{caseStudy.gmv || "GrowthOS customer"}</p>
                </div>
              </div>

              <h1 className="mb-5 max-w-3xl text-4xl font-black leading-tight text-[#dbe2fd] lg:text-6xl">
                {caseStudy.tagline}
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-[#c7c4d7]">{caseStudy.description}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0f1729]/[0.78] p-8 backdrop-blur-xl">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">{caseStudy.brand}</p>
              <p className="text-6xl font-black" style={{ color: caseStudy.logoColor }}>
                {caseStudy.hero_metric}
              </p>
              <p className="mb-6 text-xs uppercase tracking-widest text-[#c7c4d7]">{caseStudy.hero_label}</p>
              <div className="flex flex-wrap gap-2">
                {caseStudy.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#c7c4d7]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0f1729] p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#464554]">Key metrics</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {caseStudy.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xl font-black text-[#dbe2fd]">{metric.value}</p>
                    <p className="mt-1 text-xs text-[#c7c4d7]">{metric.label}</p>
                    <p className="text-[10px] text-[#464554]">{metric.period}</p>
                  </div>
                ))}
              </div>
            </div>

            {caseStudy.quote && (
              <div className="rounded-3xl border border-[#c0c1ff]/20 bg-[#c0c1ff]/[0.06] p-6">
                <AppIcon name="star" size={18} className="mb-3 text-[#c0c1ff]" />
                <p className="text-sm italic leading-relaxed text-[#dbe2fd]">&ldquo;{caseStudy.quote}&rdquo;</p>
                <p className="mt-4 text-xs font-semibold text-[#c7c4d7]">{caseStudy.quoteName}</p>
                <p className="text-[10px] text-[#464554]">{caseStudy.quoteRole}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0f1729] p-7">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-[#464554]">What changed</p>
            <div className="space-y-4">
              {caseStudy.results.map((result, index) => (
                <div key={result} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-[#0b1326]"
                    style={{ backgroundColor: caseStudy.logoColor }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-[#c7c4d7]">{result}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#0b1326] transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
              >
                Start your story
                <AppIcon name="arrow_forward" size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-bold text-[#dbe2fd] transition-colors hover:border-[#c0c1ff]/40"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
