"use client"

import Link from "next/link"

interface ConnectPromptProps {
  platform: 'shopify' | 'meta' | 'google' | 'all'
  pageName: string
}

const PLATFORM_CONFIG = {
  shopify: {
    icon: "storefront",
    label: "Shopify",
    color: "#95BF47",
    bgColor: "rgba(149,191,71,0.12)",
    borderColor: "rgba(149,191,71,0.25)",
  },
  meta: {
    icon: "campaign",
    label: "Meta Ads",
    color: "#1877F2",
    bgColor: "rgba(24,119,242,0.12)",
    borderColor: "rgba(24,119,242,0.25)",
  },
  google: {
    icon: "travel_explore",
    label: "Google Ads",
    color: "#FFAD3B",
    bgColor: "rgba(255,173,59,0.12)",
    borderColor: "rgba(255,173,59,0.25)",
  },
  all: {
    icon: "hub",
    label: "your data sources",
    color: "#c0c1ff",
    bgColor: "rgba(192,193,255,0.12)",
    borderColor: "rgba(192,193,255,0.25)",
  },
}

export function ConnectPrompt({ platform, pageName }: ConnectPromptProps) {
  const config = PLATFORM_CONFIG[platform]

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 gap-5 max-w-sm mx-auto">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: config.bgColor, border: `1.5px solid ${config.borderColor}` }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: config.color }}
        >
          {config.icon}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-base font-semibold text-on-surface">
          Connect {config.label}
        </p>
        <p className="text-sm text-[#8A95B0] leading-relaxed">
          Connect {config.label} to see your {pageName} data here.
        </p>
      </div>

      <Link
        href="/onboarding"
        className="primary-gradient inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-[#0b1326] transition-opacity hover:opacity-90"
      >
        Connect Now
        <span className="material-symbols-outlined text-base" style={{ fontSize: 16 }}>arrow_forward</span>
      </Link>
    </div>
  )
}
