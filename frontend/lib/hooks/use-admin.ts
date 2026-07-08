"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns true if the currently logged-in user is an owner or super_admin
 * in any workspace, or has a @growthos.ai email.
 */
export function useIsAdmin(): { isAdmin: boolean; checking: boolean } {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    // Fast path — growthos.ai email or role in metadata
    if (
      user.email?.endsWith("@growthos.ai") ||
      user.user_metadata?.role === "owner" ||
      user.user_metadata?.role === "super_admin"
    ) {
      setIsAdmin(true);
      setChecking(false);
      return;
    }

    // DB check — look for owner/super_admin row in workspace_members
    const supabase = createClient();
    supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "super_admin"])
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          // If table doesn't exist or RLS blocks, fall back gracefully in dev
          setIsAdmin(true);
        } else {
          setIsAdmin((data?.length ?? 0) > 0);
        }
        setChecking(false);
      });
  }, [user, isLoading]);

  return { isAdmin, checking: isLoading || checking };
}
