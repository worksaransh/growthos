import Image from "next/image";

import { cn } from "@/lib/utils";
import { AppIcon } from "./app-icon";

type VisualAsset = "founder" | "ai" | "warehouse" | "marketing";
type VisualKind = "dashboard" | "ai" | "commerce" | "operations" | "security";

interface PageVisual {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  asset: VisualAsset;
  kind: VisualKind;
  cta: string;
  chips: string[];
}

const ASSET_SRC: Record<VisualAsset, string> = {
  founder: "/visuals/founder-workspace.png",
  ai: "/visuals/ai-operating-system.png",
  warehouse: "/visuals/inventory-warehouse.png",
  marketing: "/visuals/marketing-command-desk.png",
};

const ASSET_ALT: Record<VisualAsset, string> = {
  founder: "Founder workspace with GrowthOS analytics dashboard on laptop and ecommerce orders on phone",
  ai: "AI-native operating system illustration with connected analytics and automation cards",
  warehouse: "Modern ecommerce warehouse workstation with inventory dashboard and shipping parcels",
  marketing: "Marketing command desk with ad analytics, customer messages, and ecommerce devices",
};

export const PAGE_VISUALS: Record<string, PageVisual> = {
  overview: {
    eyebrow: "Founder Command Center",
    title: "A clear read on revenue, spend, profit, and live orders.",
    description: "A compact executive layer pairs KPIs with channel movement so founders can spot what changed and act quickly.",
    icon: "space_dashboard",
    asset: "founder",
    kind: "dashboard",
    cta: "Review today's growth",
    chips: ["Live KPIs", "Profit Signals", "Order Feed"],
  },
  "founder-ai": {
    eyebrow: "AI Co-Founder",
    title: "Ask the business a plain-English question and get the next move.",
    description: "Founder AI keeps recommendations close to revenue, margin, ads, products, and customers instead of generic chat.",
    icon: "auto_awesome",
    asset: "ai",
    kind: "ai",
    cta: "Ask a growth question",
    chips: ["Reasoned Answers", "Action Plans", "Data Context"],
  },
  profit: {
    eyebrow: "Profit Control",
    title: "Expose the margin story behind every rupee of revenue.",
    description: "Visual cues highlight contribution margin, fee drag, and product-level profitability so growth does not hide losses.",
    icon: "payments",
    asset: "founder",
    kind: "dashboard",
    cta: "Find margin leaks",
    chips: ["Gross Profit", "COGS", "Channel Margin"],
  },
  finance: {
    eyebrow: "Finance Intelligence",
    title: "Turn P&L, cash, and expense signals into founder-ready decisions.",
    description: "The finance visual layer keeps cash flow, expense mix, and net margin legible for fast operating reviews.",
    icon: "account_balance",
    asset: "founder",
    kind: "dashboard",
    cta: "Review P&L",
    chips: ["Cash Flow", "Expense Mix", "Net Margin"],
  },
  ads: {
    eyebrow: "Marketing Command",
    title: "See which campaigns, channels, and creatives deserve more budget.",
    description: "Campaign visuals pair spend allocation with ROAS and creative previews for faster performance decisions.",
    icon: "campaign",
    asset: "marketing",
    kind: "commerce",
    cta: "Optimize spend",
    chips: ["ROAS", "Creative Score", "Audience Health"],
  },
  products: {
    eyebrow: "Product Intelligence",
    title: "Connect SKU performance with inventory, margin, and demand.",
    description: "Warehouse and catalog visuals help teams understand where stock, bundles, and product economics need attention.",
    icon: "inventory_2",
    asset: "warehouse",
    kind: "operations",
    cta: "Review SKUs",
    chips: ["Inventory", "Bundles", "Margin"],
  },
  customers: {
    eyebrow: "Customer Intelligence",
    title: "Make customer segments easier to recognize and act on.",
    description: "Customer visuals emphasize cohorts, LTV, repeat behavior, and the segments most likely to compound growth.",
    icon: "group",
    asset: "marketing",
    kind: "commerce",
    cta: "Find top segments",
    chips: ["LTV", "Cohorts", "Segments"],
  },
  analytics: {
    eyebrow: "RFM & Cohorts",
    title: "Bring retention, loyalty, and segment movement into one view.",
    description: "Contextual cards make customer lifecycle patterns more scannable without overwhelming the analytical surface.",
    icon: "bubble_chart",
    asset: "marketing",
    kind: "commerce",
    cta: "Inspect retention",
    chips: ["RFM", "Retention", "LTV"],
  },
  forecast: {
    eyebrow: "Forecast Engine",
    title: "Preview likely revenue, orders, and inventory pressure.",
    description: "Forecast visuals are tuned for scenarios, confidence bands, and trend shifts that require an operating decision.",
    icon: "query_stats",
    asset: "ai",
    kind: "dashboard",
    cta: "Model scenarios",
    chips: ["Trend Lines", "Confidence", "Demand"],
  },
  attribution: {
    eyebrow: "Attribution",
    title: "Explain which touchpoints are actually earning credit.",
    description: "Journey visuals connect channel contribution with conversions so the model reads like a business story.",
    icon: "hub",
    asset: "marketing",
    kind: "commerce",
    cta: "Compare models",
    chips: ["First Touch", "Linear", "Data-Driven"],
  },
  "creative-analytics": {
    eyebrow: "Creative Analytics",
    title: "Turn ad creative performance into reusable learnings.",
    description: "Creative previews and score signals support faster iterations across images, videos, and carousel concepts.",
    icon: "auto_awesome_mosaic",
    asset: "marketing",
    kind: "commerce",
    cta: "Study winners",
    chips: ["Hooks", "Formats", "Fatigue"],
  },
  "budget-optimizer": {
    eyebrow: "Budget Optimizer",
    title: "Move spend toward the channels with the strongest return.",
    description: "Allocation visuals make budget shifts feel deliberate, showing what to increase, reduce, or watch.",
    icon: "tune",
    asset: "marketing",
    kind: "dashboard",
    cta: "Rebalance budget",
    chips: ["Spend Mix", "Lift", "Risk"],
  },
  "customer-journey": {
    eyebrow: "Journey Map",
    title: "See the touchpoints that move shoppers from first visit to purchase.",
    description: "Journey graphics clarify channel paths, delays, and conversion points for better lifecycle planning.",
    icon: "route",
    asset: "marketing",
    kind: "commerce",
    cta: "Trace paths",
    chips: ["Touchpoints", "Drop-Off", "Conversion"],
  },
  "vip-customers": {
    eyebrow: "VIP Customers",
    title: "Recognize your highest-value customers and the moments to retain them.",
    description: "Premium customer visuals support loyalty actions, concierge outreach, and high-LTV retention strategy.",
    icon: "star",
    asset: "marketing",
    kind: "commerce",
    cta: "Nurture VIPs",
    chips: ["LTV Score", "Repeat Rate", "Offers"],
  },
  operations: {
    eyebrow: "Operations",
    title: "Track fulfillment, returns, and logistics health before they hit margin.",
    description: "Operations imagery anchors RTO, shipping, COD, and warehouse metrics in the real work behind every order.",
    icon: "local_shipping",
    asset: "warehouse",
    kind: "operations",
    cta: "Check operations",
    chips: ["RTO", "Returns", "Shipping"],
  },
  crm: {
    eyebrow: "CRM Pipeline",
    title: "Keep leads, customers, and follow-ups moving with visible momentum.",
    description: "Pipeline visuals make next actions and relationship quality easier to read at a glance.",
    icon: "contacts",
    asset: "marketing",
    kind: "commerce",
    cta: "Review pipeline",
    chips: ["Leads", "Deals", "Follow-Up"],
  },
  automation: {
    eyebrow: "Automation",
    title: "Show every rule, trigger, and action as a reliable operating system.",
    description: "Automation illustrations make workflow health, saved time, and triggered actions easier to trust.",
    icon: "bolt",
    asset: "ai",
    kind: "ai",
    cta: "Create a rule",
    chips: ["Triggers", "Actions", "Guardrails"],
  },
  ai: {
    eyebrow: "AI Engine",
    title: "Generate insights and creative outputs without leaving the dashboard.",
    description: "The AI surface is designed to feel like a capable business analyst, not a blank chatbot.",
    icon: "psychology",
    asset: "ai",
    kind: "ai",
    cta: "Run AI analysis",
    chips: ["Insights", "Copy", "Recommendations"],
  },
  content: {
    eyebrow: "Content Studio",
    title: "Create campaign copy, product content, and customer messages faster.",
    description: "Marketing visuals give content generation a clear business context across ads, email, WhatsApp, and SEO.",
    icon: "edit_note",
    asset: "marketing",
    kind: "commerce",
    cta: "Generate content",
    chips: ["Ads", "Email", "WhatsApp"],
  },
  seo: {
    eyebrow: "SEO Intelligence",
    title: "Prioritize search work by business opportunity, not keyword noise.",
    description: "SEO visuals highlight rankings, technical health, and content gaps with a clean growth lens.",
    icon: "travel_explore",
    asset: "marketing",
    kind: "dashboard",
    cta: "Find opportunities",
    chips: ["Keywords", "Pages", "Technical"],
  },
  reports: {
    eyebrow: "Reports",
    title: "Package performance into board-ready reports and exports.",
    description: "Report visuals make scheduled decks, summaries, and exports feel polished before they leave the product.",
    icon: "bar_chart_4_bars",
    asset: "founder",
    kind: "dashboard",
    cta: "Prepare report",
    chips: ["PDF", "Schedule", "Executive"],
  },
  integrations: {
    eyebrow: "Integrations",
    title: "Connect the commerce, marketing, and finance sources that power the OS.",
    description: "Integration visuals reinforce trust, sync state, and setup progress for every connected data source.",
    icon: "hub",
    asset: "ai",
    kind: "security",
    cta: "Connect source",
    chips: ["Shopify", "Meta", "Google"],
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Prioritize alerts that deserve attention and soften the rest.",
    description: "Alert visuals help distinguish urgent action from routine system activity without creating noise.",
    icon: "notifications",
    asset: "ai",
    kind: "security",
    cta: "Review alerts",
    chips: ["Alerts", "Sync", "Activity"],
  },
  settings: {
    eyebrow: "Workspace Settings",
    title: "Keep brand, team, and notification preferences consistent.",
    description: "Settings visuals reinforce enterprise trust while keeping admin workflows calm and readable.",
    icon: "settings",
    asset: "founder",
    kind: "security",
    cta: "Tune workspace",
    chips: ["Profile", "Team", "Preferences"],
  },
  "ads-ai": {
    eyebrow: "Ads AI",
    title: "Ask for spend, audience, and creative recommendations in context.",
    description: "Ads AI visuals frame the assistant around campaign diagnosis and budget decisions.",
    icon: "smart_toy",
    asset: "ai",
    kind: "ai",
    cta: "Ask Ads AI",
    chips: ["ROAS", "CPM", "Creative"],
  },
  "seo-ai": {
    eyebrow: "SEO AI",
    title: "Turn rankings, competitors, and content gaps into clear SEO tasks.",
    description: "SEO AI connects organic opportunity with practical recommendations for D2C teams.",
    icon: "travel_explore",
    asset: "ai",
    kind: "ai",
    cta: "Ask SEO AI",
    chips: ["Keywords", "Content", "Links"],
  },
  "product-ai": {
    eyebrow: "Product AI",
    title: "Get product, pricing, and inventory recommendations from live signals.",
    description: "Product AI visuals keep assortment decisions tied to margin, sell-through, and demand.",
    icon: "inventory_2",
    asset: "warehouse",
    kind: "ai",
    cta: "Ask Product AI",
    chips: ["SKUs", "Bundles", "Stock"],
  },
  "finance-ai": {
    eyebrow: "Finance AI",
    title: "Translate financial movement into next-best operating actions.",
    description: "Finance AI emphasizes margin, expenses, cash, and scenario planning with a calm expert feel.",
    icon: "account_balance",
    asset: "ai",
    kind: "ai",
    cta: "Ask Finance AI",
    chips: ["P&L", "Cash", "Costs"],
  },
  "pricing-ai": {
    eyebrow: "Pricing AI",
    title: "Find pricing moves that protect margin and conversion.",
    description: "Pricing visuals connect product economics with bundles, discounting, and competitive pressure.",
    icon: "sell",
    asset: "ai",
    kind: "ai",
    cta: "Ask Pricing AI",
    chips: ["Price Tests", "Bundles", "Discounts"],
  },
  "automation-ai": {
    eyebrow: "Automation AI",
    title: "Design rules that save time without losing control.",
    description: "Automation AI visuals explain triggers, conditions, and actions before a rule goes live.",
    icon: "bolt",
    asset: "ai",
    kind: "ai",
    cta: "Ask Automation AI",
    chips: ["Rules", "Approvals", "Savings"],
  },
  "decision-ai": {
    eyebrow: "Decision AI",
    title: "Compare options with evidence, tradeoffs, and confidence.",
    description: "Decision visuals help founders move from scattered inputs to a clear recommendation.",
    icon: "psychology",
    asset: "ai",
    kind: "ai",
    cta: "Ask Decision AI",
    chips: ["Tradeoffs", "Confidence", "Impact"],
  },
  "forecast-ai": {
    eyebrow: "Forecast AI",
    title: "Explain the future curve before the business commits to it.",
    description: "Forecast AI visuals support scenarios, risk, and demand signals with a premium planning language.",
    icon: "query_stats",
    asset: "ai",
    kind: "ai",
    cta: "Ask Forecast AI",
    chips: ["Scenarios", "Demand", "Risk"],
  },
  billing: {
    eyebrow: "Billing",
    title: "Make plan, invoice, and usage state feel transparent.",
    description: "Billing visuals clarify plan value, limits, and account health without turning into a sales page.",
    icon: "credit_card",
    asset: "founder",
    kind: "security",
    cta: "Review plan",
    chips: ["Plan", "Usage", "Invoices"],
  },
  security: {
    eyebrow: "Security",
    title: "Surface trust, access, and data controls without anxiety.",
    description: "Security visuals help users understand sessions, 2FA, permissions, and data controls at a glance.",
    icon: "security",
    asset: "ai",
    kind: "security",
    cta: "Review controls",
    chips: ["2FA", "Sessions", "Access"],
  },
  "audit-logs": {
    eyebrow: "Audit Logs",
    title: "Make every sensitive action traceable and easy to investigate.",
    description: "Audit visuals support compliance-grade review while keeping the table focused and scannable.",
    icon: "manage_search",
    asset: "ai",
    kind: "security",
    cta: "Review activity",
    chips: ["Events", "Users", "Exports"],
  },
  "white-label": {
    eyebrow: "White Label",
    title: "Preview the branded workspace before customers ever see it.",
    description: "Brand visuals help agencies and operators validate logos, colors, domains, and client-facing reports.",
    icon: "palette",
    asset: "founder",
    kind: "dashboard",
    cta: "Tune brand",
    chips: ["Logo", "Domain", "Reports"],
  },
};

export function PageVisualIntro({ page, className }: { page: string; className?: string }) {
  const visual = PAGE_VISUALS[page] || PAGE_VISUALS.overview;

  return (
    <section className={cn("px-4 pt-4 sm:px-7 sm:pt-7", className)} aria-label={`${visual.eyebrow} visual summary`}>
      <div className="glass-card-high overflow-hidden rounded-xl">
        <div className="grid min-h-[212px] grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="relative z-10 flex flex-col justify-between gap-5 p-5 sm:p-6">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <AppIcon name={visual.icon} size={20} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
                    {visual.eyebrow}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-on-surface-variant/55">
                    Premium visual layer active
                  </p>
                </div>
              </div>
              <h2 className="max-w-2xl text-[22px] font-semibold leading-tight text-on-surface sm:text-[26px]">
                {visual.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant/75">
                {visual.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <AppIcon name="sparkles" size={14} />
                {visual.cta}
              </span>
              {visual.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-outline-variant/30 bg-surface-container-lowest/60 px-3 py-1.5 font-mono text-[11px] text-on-surface-variant/70"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden border-t border-outline-variant/20 lg:border-l lg:border-t-0">
            <Image
              src={ASSET_SRC[visual.asset]}
              alt={ASSET_ALT[visual.asset]}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover opacity-80"
              priority={page === "overview"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container/40 via-transparent to-surface-container-lowest/30" />
            <div className="absolute inset-x-4 bottom-4">
              <VisualOverlay kind={visual.kind} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualOverlay({ kind }: { kind: VisualKind }) {
  const rows = {
    dashboard: ["Revenue +18%", "Profit +22%", "CAC -6%"],
    ai: ["Insight ready", "3 actions", "Confidence 91%"],
    commerce: ["ROAS 4.45x", "Segment lift", "Creative winner"],
    operations: ["96% SLA", "Stock healthy", "RTO watch"],
    security: ["Sync healthy", "2FA active", "Audit ready"],
  }[kind];

  return (
    <div className="rounded-lg border border-white/10 bg-surface-container-lowest/70 p-3 shadow-glass backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success-accent shadow-[0_0_14px_rgba(74,222,128,0.65)]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant/70">
            Live system preview
          </span>
        </div>
        <AppIcon name={kind === "operations" ? "warehouse" : kind === "security" ? "shieldcheck" : "linechart"} size={15} className="text-primary" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map((row, index) => (
          <div key={row} className="rounded-md border border-outline-variant/20 bg-surface-container/70 p-2">
            <div className="mb-2 h-1 rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${64 + index * 12}%` }}
              />
            </div>
            <p className="truncate font-mono text-[10px] text-on-surface">{row}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function VisualEmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/40 px-5 py-10 text-center", className)}>
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <div className="absolute inset-2 rounded-xl border border-primary/10" />
        <AppIcon name={icon} size={28} />
      </div>
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-on-surface-variant/65">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-all hover:border-primary/50 hover:bg-primary/15"
        >
          <AppIcon name="arrow_forward" size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function VisualSkeletonGrid({ cards = 4, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden rounded-xl p-4">
          <div className="mb-4 h-8 w-8 animate-pulse rounded-lg bg-primary/10" />
          <div className="mb-2 h-3 w-24 animate-pulse rounded bg-surface-container-high" />
          <div className="mb-4 h-7 w-32 animate-pulse rounded bg-surface-container-high/80" />
          <div className="h-2 w-full animate-pulse rounded bg-surface-container-high/60" />
        </div>
      ))}
    </div>
  );
}
