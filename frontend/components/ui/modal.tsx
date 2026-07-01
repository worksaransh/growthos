"use client";
import { useEffect } from "react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card-high rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 0 40px rgba(192,193,255,0.06), 0 20px 40px rgba(0,0,0,0.6)" }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Inter" }}>{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant/40 hover:text-on-surface transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high/50">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
