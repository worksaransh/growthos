"use client"

import { useEffect, useState, useCallback } from "react"
import { toastEmitter, type ToastMessage, type ToastType } from "@/lib/toast"

const TYPE_CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: "check_circle", color: "#00E5A0", bg: "rgba(0,229,160,0.10)", border: "rgba(0,229,160,0.25)" },
  error: { icon: "error", color: "#FF5B6B", bg: "rgba(255,91,107,0.10)", border: "rgba(255,91,107,0.25)" },
  warning: { icon: "warning", color: "#FFAD3B", bg: "rgba(255,173,59,0.10)", border: "rgba(255,173,59,0.25)" },
  info: { icon: "info", color: "#c0c1ff", bg: "rgba(192,193,255,0.10)", border: "rgba(192,193,255,0.25)" },
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const config = TYPE_CONFIG[toast.type]

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10)
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration)
    return () => { clearTimeout(showTimer); clearTimeout(dismissTimer) }
  }, [toast.id, toast.duration, onDismiss])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[360px] transition-all duration-300"
      style={{
        background: "rgba(15,18,23,0.97)",
        border: `1px solid ${config.border}`,
        backdropFilter: "blur(12px)",
        transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
        opacity: visible ? 1 : 0,
      }}
    >
      <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontSize: 18, color: config.color }}>
        {config.icon}
      </span>
      <p className="flex-1 text-sm text-[#F0F4FF] leading-snug">{toast.message}</p>
      <button onClick={handleClose} className="shrink-0 text-[#48566E] hover:text-[#8A95B0] transition-colors mt-0.5">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((event: Event) => {
    const detail = (event as CustomEvent<ToastMessage>).detail
    setToasts((prev) => [...prev, detail])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    toastEmitter.addEventListener("toast", addToast)
    return () => toastEmitter.removeEventListener("toast", addToast)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  )
}
