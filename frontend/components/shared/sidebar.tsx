"use client";

import { useAuth } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "./app-icon";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: boolean;
  notifKey?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: "overview",    label: "Dashboard",        icon: "space_dashboard" },
      { id: "founder-ai",  label: "Founder AI",       icon: "auto_awesome" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { id: "profit",             label: "Profit Engine",      icon: "payments" },
      { id: "finance",            label: "Finance & P&L",      icon: "account_balance" },
      { id: "ads",                label: "Ads Intelligence",   icon: "campaign" },
      { id: "products",           label: "Product Intel",      icon: "inventory_2" },
      { id: "customers",          label: "Customer Intel",     icon: "group" },
      { id: "analytics",          label: "RFM & Cohorts",      icon: "bubble_chart" },
      { id: "forecast",           label: "Forecast Engine",    icon: "query_stats" },
      { id: "attribution",        label: "Attribution",        icon: "hub" },
      { id: "creative-analytics", label: "Creative Analytics", icon: "auto_awesome_mosaic" },
      { id: "budget-optimizer",   label: "Budget Optimizer",   icon: "tune" },
    ],
  },
  {
    label: "CUSTOMERS",
    items: [
      { id: "customer-journey", label: "Customer Journey", icon: "route" },
      { id: "vip-customers",    label: "VIP Customers",    icon: "star" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { id: "operations", label: "Operations",  icon: "local_shipping" },
      { id: "crm",        label: "CRM",         icon: "contacts" },
      { id: "automation", label: "Automation",  icon: "bolt" },
      { id: "workflow-builder", label: "Workflow Builder", icon: "account_tree" },
    ],
  },
  {
    label: "AI GROWTH",
    items: [
      { id: "ai",      label: "AI Engine",   icon: "psychology" },
      { id: "content", label: "Content AI",  icon: "edit_note" },
      { id: "seo",     label: "SEO",         icon: "travel_explore" },
      { id: "reports", label: "Reports",     icon: "bar_chart_4_bars" },
    ],
  },
  {
    label: "AI MODULES",
    items: [
      { id: "ads-ai",        label: "Ads AI",        icon: "smart_toy" },
      { id: "seo-ai",        label: "SEO AI",         icon: "travel_explore" },
      { id: "product-ai",    label: "Product AI",     icon: "inventory_2" },
      { id: "finance-ai",    label: "Finance AI",     icon: "account_balance" },
      { id: "pricing-ai",    label: "Pricing AI",     icon: "sell" },
      { id: "automation-ai", label: "Automation AI",  icon: "bolt" },
      { id: "decision-ai",   label: "Decision AI",    icon: "psychology" },
      { id: "forecast-ai",   label: "Forecast AI",    icon: "query_stats" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { id: "integrations",  label: "Integrations",  icon: "hub",           badge: true },
      { id: "notifications", label: "Notifications", icon: "notifications", notifKey: true },
      { id: "billing",       label: "Billing",       icon: "credit_card" },
      { id: "security",      label: "Security",      icon: "security" },
      { id: "alerts",        label: "Alerts",         icon: "notifications_active" },
      { id: "audit-logs",    label: "Audit Logs",    icon: "manage_search" },
      { id: "white-label",   label: "White Label",   icon: "palette" },
      { id: "settings",      label: "Settings",      icon: "settings" },
    ],
  },
];

interface SidebarProps {
  active: string;
  onNav: (id: string) => void;
  unreadNotifications?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ active, onNav, unreadNotifications = 0, isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();

  const { data: workspace } = useQuery({
    queryKey: ["settings", "workspace"],
    queryFn: () => api.getWorkspace(),
    staleTime: 60_000,
  });

  const brandName = workspace?.brand_name || "mybrand.co";
  const userInitial = (user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar-glass h-screen w-64 fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            {/* Gradient logo mark */}
            <div className="w-9 h-9 rounded-xl primary-gradient flex items-center justify-center inner-glow flex-shrink-0">
              <span className="text-white font-bold text-sm tracking-tight">G</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-primary leading-tight" style={{ fontFamily: "Inter" }}>
                GrowthOS
              </h1>
              <p className="text-tiny-tracking text-on-surface-variant/70 uppercase tracking-widest mt-0.5">
                Enterprise Tier
              </p>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high/50 transition-all flex-shrink-0"
              aria-label="Close sidebar"
            >
              <AppIcon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* ── Search hint ────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-outline-variant/10">
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full bg-surface-container-lowest/80 border border-outline-variant/20 text-on-surface-variant hover:border-primary/30 hover:text-on-surface transition-all text-sm"
            title="Press ⌘K to search"
          >
            <AppIcon name="search" className="text-on-surface-variant/60" size={16} />
            <span className="flex-1 text-left text-[12px] font-label-md">Search anything...</span>
            <kbd className="text-[10px] font-mono bg-surface-container-high border border-outline-variant/30 px-1.5 py-0.5 rounded text-on-surface-variant/50">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-3">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-3" : ""}>
              {section.label && (
                <div className="px-3 py-1.5">
                  <span className="text-tiny-tracking text-on-surface-variant/40 uppercase tracking-widest font-label-sm">
                    {section.label}
                  </span>
                </div>
              )}
              {section.items.map((item) => {
                const isActive = active === item.id;
                const showBadge = item.notifKey && unreadNotifications > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNav(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150 text-sm ${
                      isActive ? "nav-active" : "nav-item"
                    }`}
                  >
                    <AppIcon
                      name={item.icon}
                      className={isActive ? "text-primary" : "text-on-surface-variant/70"}
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className={`flex-1 font-label-md text-[13px] ${isActive ? "font-medium" : ""}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-warning-accent animate-pulse-soft flex-shrink-0" />
                    )}
                    {showBadge && (
                      <span className="badge-primary text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Upgrade CTA ─────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-outline-variant/15">
          <div className="bento-card p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-on-surface-variant/40 uppercase tracking-wider">Enterprise</span>
              <span className="badge-primary text-[9px] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
            </div>
            <div className="text-[11px] text-on-surface-variant/50 font-mono leading-relaxed">
              All modules unlocked · Unlimited data
            </div>
          </div>

          {/* ── User profile ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-high/30 transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-full primary-gradient inner-glow flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-on-surface font-medium truncate">{userName}</div>
              <div className="text-[10px] text-on-surface-variant/50 font-mono truncate">{brandName}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-surface-container-high/50"
              title="Sign out"
            >
              <AppIcon name="logout" className="text-on-surface-variant/60" size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
