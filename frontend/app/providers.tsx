"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/hooks";
import { ToastProvider } from "@/components/ui/toast";
import { ToastContainer } from "@/components/shared/toast";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TenantProvider } from "@/components/shared/tenant-provider";
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#171f33", border: "1px solid #464554", color: "#dbe2fd" },
          }}
          richColors
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
