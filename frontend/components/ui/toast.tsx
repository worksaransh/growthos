"use client";
import { useState, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; type: ToastType; title: string; message?: string; }

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);
  const colors = { success: "#00E5A0", error: "#FF5B6B", warning: "#FFAD3B", info: "#3B9EFF" };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div key={t.id} style={{ borderColor: colors[t.type] }}
            className="bg-[#0F1217] border rounded-xl p-4 shadow-2xl">
            <div style={{ color: colors[t.type] }} className="text-xs font-mono font-medium uppercase mb-0.5">{t.type}</div>
            <div className="text-sm text-[#F0F4FF] font-medium">{t.title}</div>
            {t.message && <div className="text-xs text-[#8A95B0] mt-1">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
