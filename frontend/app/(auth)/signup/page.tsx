"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          brand_name: brandName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C0F] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5A0] to-[#00B87D] text-[#0A0C0F] text-xl font-bold mb-4">
            G
          </div>
          <h1 className="font-syne text-2xl font-bold text-[#F0F4FF]">
            Create your workspace
          </h1>
          <p className="text-sm text-[#8A95B0] mt-1">
            Get started with GrowthOS in minutes
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <Input
                placeholder="Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
                Brand Name
              </label>
              <Input
                placeholder="MyBrand Co."
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
          </div>

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
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-xs text-[#FF5B6B] font-mono bg-[rgba(255,91,107,0.10)] border border-[rgba(255,91,107,0.25)] rounded-lg p-2.5">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating workspace..." : "Create Workspace"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-xs text-[#48566E] font-mono">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00E5A0] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
