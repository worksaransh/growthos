"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C0F] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5A0] to-[#00B87D] text-[#0A0C0F] text-xl font-bold mb-4">
            G
          </div>
          <h1 className="font-syne text-2xl font-bold text-[#F0F4FF]">
            Welcome back
          </h1>
          <p className="text-sm text-[#8A95B0] mt-1">
            Sign in to your GrowthOS workspace
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-xs text-[#FF5B6B] font-mono bg-[rgba(255,91,107,0.10)] border border-[rgba(255,91,107,0.25)] rounded-lg p-2.5">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/reset-password"
            className="text-xs text-[#48566E] hover:text-[#8A95B0] font-mono transition-colors"
          >
            Forgot password?
          </Link>
          <div className="text-xs text-[#48566E] font-mono">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#00E5A0] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
