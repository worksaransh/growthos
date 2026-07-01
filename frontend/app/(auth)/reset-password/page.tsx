"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0C0F] p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <AppIcon name="mail" size={26} />
          </div>
          <h1 className="font-syne text-xl font-bold text-[#F0F4FF] mb-2">
            Check your email
          </h1>
          <p className="text-sm text-[#8A95B0]">
            We&apos;ve sent a password reset link to{" "}
            <span className="text-[#F0F4FF]">{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C0F] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-syne text-2xl font-bold text-[#F0F4FF]">
            Reset password
          </h1>
          <p className="text-sm text-[#8A95B0] mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="arjun@mybrand.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-xs text-[#FF5B6B] font-mono bg-[rgba(255,91,107,0.10)] border border-[rgba(255,91,107,0.25)] rounded-lg p-2.5">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
