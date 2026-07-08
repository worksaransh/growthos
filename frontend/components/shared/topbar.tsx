"use client";

import { useGrowthOS, useUnreadCount } from "@/lib/store";
import { DateRangeFilter } from "./date-range-filter";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { CommerceSwitcher } from "./commerce-switcher";
import type { DatePreset } from "@/lib/hooks";
import { AppIcon } from "./app-icon";

interface TopBarProps {
  page: string;
  dateRange: DatePreset;
  onDateChange: (preset: DatePreset) => void;
  onSearchOpen?: () => void;
  unreadNotifications?: number;
  onNav?: (page: string) => void;
  onMenuOpen?: () => void;
}

const PAGE_META: Record<string, { title: string; icon: string; desc?: string }> = {
  overview:     { title: "Dashboard",        icon: "space_dashboard",  desc: "Your command center" },
  "founder-ai": { title: "Founder AI",       icon: "auto_awesome",     desc: "Ask your AI co-founder anything" },
  profit:       { title: "Profit Engine",    icon: "payments",         desc: "Revenue · Margins · Net profit" },
  finance:      { title: "Finance & P&L",   icon: "account_balance",  desc: "P&L · Cash flow · Expenses" },
  ads:          { title: "Ads Intelligence", icon: "campaign",         desc: "Meta · Google · ROAS" },
  products:     { title: "Product Intel",   icon: "inventory_2",      desc: "SKU performance · Inventory" },
  customers:    { title: "Customer Intel",  icon: "group",            desc: "Segments · Behaviour · LTV" },
  analytics:    { title: "RFM & Cohorts",   icon: "bubble_chart",     desc: "RFM segments · Retention" },
  forecast:     { title: "Forecast Engine", icon: "query_stats",      desc: "Revenue · Orders · Growth" },
  operations:   { title: "Operations",      icon: "local_shipping",   desc: "RTO · COD · Returns · Shipping" },
  crm:          { title: "CRM",             icon: "contacts",         desc: "Leads · Pipeline · Deals" },
  automation:   { title: "Automation",      icon: "bolt",             desc: "Rules · Triggers · Workflows" },
  ai:           { title: "AI Engine",       icon: "psychology",       desc: "Insights · Recommendations" },
  content:      { title: "Content AI",      icon: "edit_note",        desc: "Copy · Creative · Campaigns" },
  seo:          { title: "SEO",             icon: "travel_explore",   desc: "Keywords · Rankings · Traffic" },
  reports:      { title: "Reports",         icon: "bar_chart_4_bars", desc: "Export · PDF · Scheduled" },
  integrations:        { title: "Integrations",      icon: "hub",                desc: "Shopify · Meta · Google Ads" },
  notifications:       { title: "Notifications",     icon: "notifications",      desc: "Alerts · Activity · Updates" },
  settings:            { title: "Settings",           icon: "settings",           desc: "Profile · Workspace · Billing" },
  attribution:         { title: "Attribution",        icon: "hub",                desc: "Multi-touch · Channel credit · Journeys" },
  "creative-analytics":{ title: "Creative Analytics", icon: "auto_awesome_mosaic",desc: "Ad creatives · Visual performance" },
  "budget-optimizer":  { title: "Budget Optimizer",   icon: "tune",               desc: "Spend allocation · ROI optimisation" },
  "customer-journey":  { title: "Customer Journey",   icon: "route",              desc: "Funnel · Touchpoints · Drop-off" },
  "vip-customers":     { title: "VIP Customers",      icon: "star",               desc: "High-value · Loyal · Retention" },
  "ads-ai":            { title: "Ads AI",             icon: "smart_toy",          desc: "AI-powered ad optimisation" },
  "seo-ai":            { title: "SEO AI",             icon: "travel_explore",     desc: "AI-powered SEO recommendations" },
  "product-ai":        { title: "Product AI",         icon: "inventory_2",        desc: "AI-powered product intelligence" },
  "finance-ai":        { title: "Finance AI",         icon: "account_balance",    desc: "AI-powered financial insights" },
  "pricing-ai":        { title: "Pricing AI",         icon: "sell",               desc: "AI-powered pricing strategies" },
  "automation-ai":     { title: "Automation AI",      icon: "bolt",               desc: "AI-powered workflow automation" },
  "decision-ai":       { title: "Decision AI",        icon: "psychology",         desc: "AI-powered business decisions" },
  "forecast-ai":       { title: "Forecast AI",        icon: "query_stats",        desc: "AI-powered growth forecasting" },
  billing:             { title: "Billing",             icon: "credit_card",        desc: "Plan · Subscription · Invoices" },
  security:            { title: "Security",            icon: "security",           desc: "2FA · Permissions · Access control" },
  "audit-logs":        { title: "Audit Logs",          icon: "manage_search",      desc: "Activity · Audit trail · Compliance" },
  "white-label":       { title: "White Label",         icon: "palette",            desc: "Branding · Custom domain · Styling" },
  "features-docs":     { title: "Feature Docs",        icon: "menu_book",          desc: "All 38 modules · Features · Benefits · USP" },
};

const NO_DATE_FILTER_PAGES = ["founder-ai", "settings", "notifications", "integrations", "crm", "automation"];

export function TopBar({ page, dateRange, onDateChange, onSearchOpen, unreadNotifications = 0, onNav, onMenuOpen }: TopBarProps) {
  const meta = PAGE_META[page] || { title: page, icon: "circle", desc: "" };
  const showDateFilter = !NO_DATE_FILTER_PAGES.includes(page);
  const { ui, setNotificationsOpen } = useGrowthOS();
  const storeUnreadCount = useUnreadCount();

  return (
    <header className="header-glass fixed top-0 right-0 left-0 lg:left-64 h-16 z-40 flex items-center justify-between px-4 lg:px-6 gap-3">
      {/* ── Hamburger (mobile only) ──────────────────────────────────────── */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/50 transition-all flex-shrink-0"
        aria-label="Open navigation menu"
      >
        <AppIcon name="menu" size={22} />
      </button>

      {/* ── Left: page identity ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center flex-shrink-0">
          <AppIcon name={meta.icon} className="text-primary" size={18} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-on-surface leading-tight truncate" style={{ fontFamily: "Inter" }}>
            {meta.title}
          </h2>
          {meta.desc && (
            <p className="text-[11px] text-on-surface-variant/60 font-mono hidden sm:block truncate">
              {meta.desc}
            </p>
          )}
        </div>
      </div>

      {/* ── Center: search bar ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-sm hidden md:block">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-lowest/60 border border-outline-variant/20 text-on-surface-variant hover:border-primary/30 transition-all text-sm"
        >
          <AppIcon name="search" className="text-on-surface-variant/50" size={16} />
          <span className="flex-1 text-left text-[13px]">Ask GrowthOS anything...</span>
          <kbd className="text-[10px] font-mono bg-surface-container-high border border-outline-variant/30 px-1.5 py-0.5 rounded text-on-surface-variant/40">
            Cmd K
          </kbd>
        </button>
      </div>

      {/* ── Right: actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Context switchers (hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-1.5">
          <WorkspaceSwitcher />
          <CommerceSwitcher />
        </div>
        <div className="hidden lg:block w-px h-5 bg-outline-variant/20" />
        {/* Notification bell */}
        <button
          onClick={() => setNotificationsOpen(!ui.notificationsOpen)}
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-all"
          aria-label="Notifications"
        >
          <AppIcon name="notifications" className={storeUnreadCount > 0 ? "text-primary" : ""} />
          {storeUnreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
              {storeUnreadCount > 9 ? "9+" : storeUnreadCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Date range filter */}
        {showDateFilter && (
          <DateRangeFilter selected={dateRange} onChange={onDateChange} />
        )}
      </div>
    </header>
  );
}
