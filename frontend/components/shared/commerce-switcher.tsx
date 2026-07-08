"use client";

/**
 * CommerceSwitcher — Commerce Account context picker.
 * Key component for multi-store brands. Filters all data in the dashboard
 * to the selected commerce account (Shopify store, ad account, etc.)
 */

import { useState } from "react";
import { useTenantStore } from "@/lib/store-tenant";
import { AppIcon } from "./app-icon";
import { UpgradeModal } from "./upgrade-modal";

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  shopify: "shopping_cart",
  woocommerce: "shopping_cart",
  amazon: "inventory",
  meta_ads: "campaign",
  google_ads: "ads_click",
  tiktok_ads: "play_circle",
  google_analytics: "analytics",
  stripe: "credit_card",
  razorpay: "credit_card",
  whatsapp: "chat",
  klaviyo: "email",
  mailchimp: "email",
  custom: "hub",
};

const HEALTH_DOT: Record<string, string> = {
  healthy: "bg-green-400",
  degraded: "bg-amber-400",
  down: "bg-red-400",
  unknown: "bg-outline/40",
};

interface CommerceSwitcherProps {
  className?: string;
}

export function CommerceSwitcher({ className = "" }: CommerceSwitcherProps) {
  const {
    commerceAccounts,
    activeCommerceAccountId,
    setActiveCommerceAccount,
    channels,
  } = useTenantStore();
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const active = commerceAccounts.find((a) => a.id === activeCommerceAccountId);

  // Count channels per account
  const channelCount = channels.length;

  if (commerceAccounts.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-outline-variant/20 hover:border-primary/30 bg-surface-container-lowest/40 transition-all group"
      >
        <div className="w-6 h-6 rounded-lg bg-[#059669]/15 flex items-center justify-center flex-shrink-0">
          <AppIcon name="storefront" size={13} className="text-[#059669]" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-medium text-on-surface truncate max-w-[100px]">
            {active?.name ?? "Commerce"}
          </p>
          {channelCount > 0 && (
            <p className="text-[9px] text-outline">{channelCount} channel{channelCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        <AppIcon name="expand_more" size={13} className="text-outline group-hover:text-on-surface-variant transition-colors" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 glass-card rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant/10">
              <p className="text-[10px] text-outline uppercase tracking-wider font-bold">Commerce Accounts</p>
            </div>

            <div className="py-1 max-h-72 overflow-y-auto">
              {commerceAccounts.map((account) => {
                const isActive = account.id === activeCommerceAccountId;
                // Find channels belonging to this account
                const accountChannels = channels.filter((c) =>
                  // channels are already filtered by activeCommerceAccountId; show only for active
                  isActive
                );

                return (
                  <div key={account.id}>
                    <button
                      onClick={() => { setActiveCommerceAccount(account.id); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-container-high/40 transition-all ${isActive ? "bg-[#059669]/5" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isActive
                          ? "border-[#059669]/30 bg-[#059669]/10 text-[#059669]"
                          : "border-outline-variant/20 bg-surface-container text-on-surface-variant"
                      }`}>
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${isActive ? "text-[#059669]" : "text-on-surface"}`}>
                          {account.name}
                        </p>
                        <p className="text-[10px] text-outline">{account.currency}</p>
                      </div>
                      {isActive && <AppIcon name="check" size={14} className="text-[#059669] flex-shrink-0" />}
                    </button>

                    {/* Channel list under active account */}
                    {isActive && accountChannels.length > 0 && (
                      <div className="pl-11 pr-3 pb-1">
                        {accountChannels.map((ch) => (
                          <div
                            key={ch.id}
                            className="flex items-center gap-2 py-1.5 text-[11px] text-on-surface-variant"
                          >
                            <AppIcon
                              name={CHANNEL_TYPE_ICONS[ch.channel_type] ?? "hub"}
                              size={12}
                              className="text-outline"
                            />
                            <span className="flex-1 truncate">{ch.display_name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${HEALTH_DOT[ch.health_status] ?? HEALTH_DOT.unknown}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer: new account CTA → upgrade if at limit */}
            <div className="px-3 py-2 border-t border-outline-variant/10">
              <button
                onClick={() => { setOpen(false); setShowUpgrade(true); }}
                className="w-full flex items-center gap-2 text-[11px] text-outline hover:text-primary transition-colors"
              >
                <AppIcon name="add_circle" size={13} />
                <span>Add brand / upgrade plan</span>
              </button>
            </div>
          </div>
        </>
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          reason="Add another brand to your account by upgrading your plan."
        />
      )}
    </div>
  );
}
