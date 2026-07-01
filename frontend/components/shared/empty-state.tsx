"use client"

import Link from "next/link"

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}: EmptyStateProps) {
  const iconSize = compact ? 32 : 48
  const padding = compact ? "py-8 px-6" : "py-16 px-8"
  const iconContainerSize = compact ? "w-12 h-12" : "w-16 h-16"
  const titleSize = compact ? "text-sm font-semibold" : "text-base font-semibold"
  const descSize = compact ? "text-xs" : "text-sm"

  return (
    <div className={`flex flex-col items-center justify-center text-center ${padding} gap-4 max-w-sm mx-auto`}>
      <div
        className={`${iconContainerSize} rounded-full flex items-center justify-center`}
        style={{ background: "rgba(192,193,255,0.12)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: iconSize, color: "var(--color-primary)" }}
        >
          {icon}
        </span>
      </div>

      <div className="space-y-2">
        <p className={`${titleSize} text-on-surface`}>{title}</p>
        <p className={`${descSize} text-[#8A95B0] leading-relaxed`}>{description}</p>
      </div>

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-col gap-2 w-full mt-2">
          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                className="primary-gradient inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-[#0b1326] transition-opacity hover:opacity-90"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                onClick={onAction}
                className="primary-gradient inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-[#0b1326] transition-opacity hover:opacity-90"
              >
                {actionLabel}
              </button>
            )
          )}
          {secondaryLabel && (
            <button
              onClick={onSecondary}
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-[#8A95B0] border border-[#1E2737] hover:border-[#2E3747] hover:text-on-surface transition-colors"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
