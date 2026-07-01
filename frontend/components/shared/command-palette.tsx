"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppIcon } from "./app-icon";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onNav: (page: string) => void;
  onClose: () => void;
}

export function CommandPalette({ onNav, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const COMMANDS: CommandItem[] = [
    // Navigation
    { id: "overview",    label: "Dashboard Overview",     category: "Navigate", icon: "space_dashboard", action: () => onNav("overview"),    keywords: ["home", "main", "dashboard"] },
    { id: "founder-ai",  label: "Founder AI",             category: "Navigate", icon: "auto_awesome",    action: () => onNav("founder-ai"),  keywords: ["ai", "chat", "ask", "assistant"] },
    { id: "finance",     label: "Finance & P&L",          category: "Navigate", icon: "account_balance", action: () => onNav("finance"),     keywords: ["pnl", "profit", "loss", "expenses", "cash"] },
    { id: "profit",      label: "Profit Engine",          category: "Navigate", icon: "payments",        action: () => onNav("profit"),      keywords: ["margin", "roi", "earnings"] },
    { id: "ads",         label: "Ads Intelligence",       category: "Navigate", icon: "campaign",        action: () => onNav("ads"),         keywords: ["campaigns", "roas", "meta", "google", "facebook"] },
    { id: "products",    label: "Product Intelligence",   category: "Navigate", icon: "inventory_2",     action: () => onNav("products"),    keywords: ["inventory", "skus", "catalogue"] },
    { id: "customers",   label: "Customer Intelligence",  category: "Navigate", icon: "group",           action: () => onNav("customers"),   keywords: ["crm", "buyers", "users"] },
    { id: "analytics",   label: "RFM & Cohort Analytics", category: "Navigate", icon: "bubble_chart",    action: () => onNav("analytics"),   keywords: ["rfm", "cohort", "ltv", "retention", "segments"] },
    { id: "operations",  label: "Operations",             category: "Navigate", icon: "local_shipping",  action: () => onNav("operations"),  keywords: ["rto", "returns", "cod", "shipping", "logistics"] },
    { id: "forecast",    label: "Forecast Engine",        category: "Navigate", icon: "query_stats",     action: () => onNav("forecast"),    keywords: ["prediction", "future", "projection"] },
    { id: "crm",         label: "CRM",                    category: "Navigate", icon: "contacts",        action: () => onNav("crm"),         keywords: ["leads", "pipeline", "deals"] },
    { id: "automation",  label: "Automation",             category: "Navigate", icon: "bolt",            action: () => onNav("automation"),  keywords: ["rules", "triggers", "workflows"] },
    { id: "content",     label: "Content AI",             category: "Navigate", icon: "edit_note",       action: () => onNav("content"),     keywords: ["copy", "write", "creative"] },
    { id: "seo",         label: "SEO",                    category: "Navigate", icon: "travel_explore",  action: () => onNav("seo"),         keywords: ["keywords", "search", "rankings"] },
    { id: "reports",     label: "Reports",                category: "Navigate", icon: "bar_chart_4_bars",action: () => onNav("reports"),     keywords: ["export", "pdf", "data"] },
    { id: "ai",          label: "AI Engine",              category: "Navigate", icon: "psychology",      action: () => onNav("ai"),          keywords: ["insights", "recommendations"] },
    { id: "integrations",label: "Integrations & API Keys",category: "Navigate", icon: "hub",             action: () => onNav("integrations"),keywords: ["shopify", "meta", "google", "connect"] },
    { id: "notifications",label:"Notifications",          category: "Navigate", icon: "notifications",   action: () => onNav("notifications"),keywords: ["alerts", "messages"] },
    { id: "settings",           label: "Settings",               category: "Navigate",    icon: "settings",           action: () => onNav("settings"),           keywords: ["profile", "workspace", "account"] },
    // Intelligence
    { id: "attribution",        label: "Attribution",            category: "Intelligence", icon: "hub",                action: () => onNav("attribution"),        keywords: ["multi-touch", "channels", "credit"] },
    { id: "creative-analytics", label: "Creative Analytics",     category: "Intelligence", icon: "auto_awesome_mosaic", action: () => onNav("creative-analytics"), keywords: ["creatives", "ads", "visuals"] },
    { id: "budget-optimizer",   label: "Budget Optimizer",       category: "Intelligence", icon: "tune",               action: () => onNav("budget-optimizer"),   keywords: ["budget", "allocation", "spend"] },
    { id: "customer-journey",   label: "Customer Journey",       category: "Intelligence", icon: "route",              action: () => onNav("customer-journey"),   keywords: ["funnel", "touchpoints", "journey"] },
    { id: "vip-customers",      label: "VIP Customers",          category: "Intelligence", icon: "star",               action: () => onNav("vip-customers"),      keywords: ["vip", "high-value", "loyal"] },
    // AI Modules
    { id: "ads-ai",        label: "Ads AI",        category: "AI Modules", icon: "smart_toy",      action: () => onNav("ads-ai"),        keywords: ["ai", "ads", "campaigns"] },
    { id: "seo-ai",        label: "SEO AI",         category: "AI Modules", icon: "travel_explore", action: () => onNav("seo-ai"),        keywords: ["ai", "seo", "keywords"] },
    { id: "product-ai",    label: "Product AI",     category: "AI Modules", icon: "inventory_2",    action: () => onNav("product-ai"),   keywords: ["ai", "products", "catalogue"] },
    { id: "finance-ai",    label: "Finance AI",     category: "AI Modules", icon: "account_balance", action: () => onNav("finance-ai"),  keywords: ["ai", "finance", "pnl"] },
    { id: "pricing-ai",    label: "Pricing AI",     category: "AI Modules", icon: "sell",           action: () => onNav("pricing-ai"),   keywords: ["ai", "pricing", "price"] },
    { id: "automation-ai", label: "Automation AI",  category: "AI Modules", icon: "bolt",           action: () => onNav("automation-ai"),keywords: ["ai", "automation", "workflows"] },
    { id: "decision-ai",   label: "Decision AI",    category: "AI Modules", icon: "psychology",     action: () => onNav("decision-ai"),  keywords: ["ai", "decisions", "recommendations"] },
    { id: "forecast-ai",   label: "Forecast AI",    category: "AI Modules", icon: "query_stats",    action: () => onNav("forecast-ai"),  keywords: ["ai", "forecast", "prediction"] },
    // Enterprise
    { id: "billing",     label: "Billing",     category: "Enterprise", icon: "credit_card",  action: () => onNav("billing"),     keywords: ["plan", "subscription", "invoice"] },
    { id: "security",    label: "Security",    category: "Enterprise", icon: "security",     action: () => onNav("security"),    keywords: ["2fa", "permissions", "access"] },
    { id: "audit-logs",  label: "Audit Logs",  category: "Enterprise", icon: "manage_search",action: () => onNav("audit-logs"),  keywords: ["logs", "audit", "activity"] },
    { id: "white-label", label: "White Label", category: "Enterprise", icon: "palette",      action: () => onNav("white-label"), keywords: ["branding", "custom", "white label"] },
    // Quick Actions
    { id: "ask-ai-revenue",  label: "Ask AI: What's my revenue?",    category: "Quick Action", icon: "auto_awesome", action: () => onNav("founder-ai") },
    { id: "ask-ai-roas",     label: "Ask AI: What's my ROAS today?", category: "Quick Action", icon: "auto_awesome", action: () => onNav("founder-ai") },
    { id: "add-expense",     label: "Add Expense",                    category: "Quick Action", icon: "add_circle",   action: () => onNav("finance"),   keywords: ["cost", "spend"] },
    { id: "log-rto",         label: "Log RTO / Return",               category: "Quick Action", icon: "assignment_return", action: () => onNav("operations"), keywords: ["return", "rto"] },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter(c => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.keywords?.some(k => k.includes(q))
        );
      })
    : COMMANDS;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatItems = filtered;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const execSelected = useCallback(() => {
    if (flatItems[selected]) { flatItems[selected].action(); onClose(); }
  }, [flatItems, selected, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, flatItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); execSelected(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flatItems, execSelected, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  let itemIdx = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(6,14,32,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl glass-card-high rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 0 60px rgba(192,193,255,0.08), 0 25px 50px rgba(0,0,0,0.7)" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20">
          <AppIcon name="search" className="text-on-surface-variant/40" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40 font-mono"
          />
          <kbd className="text-[10px] font-mono bg-surface-container-high border border-outline-variant/30 px-1.5 py-0.5 rounded text-on-surface-variant/50 flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {Object.keys(grouped).length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-on-surface-variant/40">No results found</div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-2 text-[10px] font-mono text-on-surface-variant/40 uppercase tracking-wider bg-surface-container-lowest/30 border-b border-outline-variant/10">
                  {category}
                </div>
                {items.map((item) => {
                  const idx = itemIdx++;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={() => { item.action(); onClose(); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-outline-variant/5 last:border-0 ${
                        selected === idx
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface hover:bg-surface-container-high/40"
                      }`}
                    >
                      <AppIcon
                        name={item.icon}
                        className="flex-shrink-0"
                        size={18}
                        strokeWidth={selected === idx ? 2.25 : 1.85}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-tight">{item.label}</div>
                        {item.description && (
                          <div className="text-[11px] text-on-surface-variant/50 font-mono mt-0.5 truncate">{item.description}</div>
                        )}
                      </div>
                      {selected === idx && (
                        <kbd className="text-[10px] font-mono bg-primary/20 border border-primary/30 px-1.5 py-0.5 rounded text-primary flex-shrink-0">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-surface-container-lowest/20">
          <span className="text-[10px] font-mono text-on-surface-variant/30">↑↓ navigate · ↵ select · ESC close</span>
        </div>
      </div>
    </div>
  );
}
