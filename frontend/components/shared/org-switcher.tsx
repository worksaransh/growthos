"use client";

/**
 * OrgSwitcher — top-level organization switcher.
 * Shows only when user belongs to 2+ orgs.
 */

import { useState } from "react";
import { useTenantStore } from "@/lib/store-tenant";
import { AppIcon } from "./app-icon";

const ORG_ROLE_BADGE: Record<string, string> = {
  owner: "text-primary bg-primary/10",
  admin: "text-blue-400 bg-blue-400/10",
  billing_admin: "text-amber-400 bg-amber-400/10",
  member: "text-on-surface-variant bg-surface-container",
  viewer: "text-outline bg-surface-container",
};

interface OrgSwitcherProps {
  className?: string;
}

export function OrgSwitcher({ className = "" }: OrgSwitcherProps) {
  const { orgs, activeOrgId, setActiveOrg, loading } = useTenantStore();
  const [open, setOpen] = useState(false);

  const active = orgs.find((o) => o.id === activeOrgId);

  // Only render if user has multiple orgs
  if (loading || orgs.length <= 1) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-outline-variant/20 hover:border-primary/30 bg-surface-container-lowest/60 transition-all text-sm"
      >
        <div className="w-5 h-5 rounded-md bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
          <AppIcon name="corporate_fare" size={12} className="text-[#a78bfa]" />
        </div>
        <span className="text-[12px] font-medium text-on-surface truncate max-w-[80px]">
          {active?.display_name ?? "Organisation"}
        </span>
        <AppIcon name="expand_more" size={13} className="text-outline flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-60 glass-card rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant/10">
              <p className="text-[10px] text-outline uppercase tracking-wider font-bold">Switch Organisation</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {orgs.map((org) => {
                const isActive = org.id === activeOrgId;
                const badgeClass = ORG_ROLE_BADGE[org.my_role] ?? ORG_ROLE_BADGE.member;
                return (
                  <button
                    key={org.id}
                    onClick={() => { setActiveOrg(org.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-container-high/40 transition-all ${isActive ? "bg-[#7c3aed]/5" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#a78bfa] text-sm font-bold flex-shrink-0">
                      {org.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isActive ? "text-[#a78bfa]" : "text-on-surface"}`}>
                        {org.display_name}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeClass}`}>
                        {org.my_role}
                      </span>
                    </div>
                    {isActive && <AppIcon name="check" size={14} className="text-[#a78bfa] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
