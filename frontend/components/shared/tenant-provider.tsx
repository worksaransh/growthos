"use client";

/**
 * TenantProvider — Loads the full multi-tenant hierarchy on mount.
 * Render this once near the root of the dashboard; children can then
 * read from useTenantStore() anywhere in the tree.
 */

import { useTenantLoader } from "@/lib/hooks/use-tenant";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  useTenantLoader();
  return <>{children}</>;
}
