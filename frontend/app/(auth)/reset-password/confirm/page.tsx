"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5A0] to-[#00B87D] flex items-center justify-center text-[#0A0C0F] text-lg font-bold">G</div>
          <span className="font-syne text-xl font-bold text-[#F0F4FF]">GrowthOS</span>
        </div>

        <div className="bg-[#0F1217] border border-[#1E2737] rounded-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,229,160,0.1)] border border-[#00E5A0] flex items-center justify-center mx-auto mb-4 text-[#00E5A0]">
                <AppIcon name="check_circle" size={27} />
              </div>
              <h2 className="font-syne text-lg font-bold text-[#F0F4FF] mb-2">Password Updated</h2>
              <p className="text-sm text-[#8A95B0]">Your password has been updated successfully. Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-syne text-xl font-bold text-[#F0F4FF] mb-1">Set new password</h1>
                <p className="text-sm text-[#8A95B0]">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">New Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-[#151921] border-[#1E2737] text-[#F0F4FF] placeholder:text-[#48566E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="bg-[#151921] border-[#1E2737] text-[#F0F4FF] placeholder:text-[#48566E]"
                    required
                  />
                </div>
                {error && <p className="text-xs text-[#FF5B6B] font-mono">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full mt-1">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
