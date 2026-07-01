"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/hooks";
import { ToastProvider } from "@/components/ui/toast";
import { ToastContainer } from "@/components/shared/toast";
import { Toaster } from "sonner";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#171f33", border: "1px solid #464554", color: "#dbe2fd" },
        }}
        richColors
      />
    </QueryClientProvider>
  );
}
