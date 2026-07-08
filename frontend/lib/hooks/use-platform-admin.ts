"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

/**
 * Returns true if the current user is in the platform_admins table.
 * Used to show/hide the Super Admin sidebar link.
 */
export function useIsPlatformAdmin(): boolean {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) { setIsPlatformAdmin(false); return; }
    const supabase = createClient();
    supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsPlatformAdmin(!!data));
  }, [user?.id]);

  return isPlatformAdmin;
}
