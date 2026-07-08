"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

const METRICS = [
  { icon: "trending_up", color: "#c0c1ff", label: "Avg ROAS lift", value: "3.8x" },
  { icon: "local_shipping", color: "#7bd0ff", label: "RTO reduction", value: "62%" },
  { icon: "payments", color: "#ddb7ff", label: "Revenue recovered", value: "₹2.4Cr" },
  { icon: "group", color: "#4ade80", label: "Brands growing", value: "500+" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Parse Supabase error — message may be raw JSON in some GoTrue versions
        let msg = error.message ?? "Login failed";
        if (msg.startsWith("{")) {
          try { msg = (JSON.parse(msg) as { msg?: string; message?: string }).msg ?? (JSON.parse(msg) as { msg?: string; message?: string }).message ?? "Invalid login credentials"; } catch { msg = "Invalid login credentials"; }
        }
        setError(msg);
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[#0b1326]">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col p-12 overflow-hidden">
        {/* Background layers */}
        <Image
          src="/visuals/marketing-command-desk.png"
          alt="GrowthOS marketing command desk with ad analytics and ecommerce growth dashboards"
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[#0b1326]/[0.55]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(192,193,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(221,183,255,0.06) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#0b1326] text-lg" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>
            G
          </div>
          <span className="text-[#dbe2fd] font-bold text-xl tracking-tight">GrowthOS</span>
        </div>

        {/* Hero text */}
        <div className="relative my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 text-[#c0c1ff] text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] animate-pulse" />
            Trusted by 500+ Indian D2C brands
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-[#dbe2fd] leading-tight mb-4">
            The operating system<br />
            <span style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 50%, #7bd0ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              for D2C growth
            </span>
          </h1>
          <p className="text-[#c7c4d7] text-lg leading-relaxed max-w-md mb-10">
            One platform for ads, finance, operations, and AI — built for India&apos;s fastest-growing brands.
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.color + "20" }}>
                    <AppIcon name={m.icon} size={15} style={{ color: m.color }} />
                  </div>
                </div>
                <p className="text-[#dbe2fd] font-black text-2xl">{m.value}</p>
                <p className="text-[#464554] text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative mt-auto pt-8 border-t border-white/5">
          <p className="text-[#c7c4d7] text-sm italic leading-relaxed mb-3">
            &ldquo;GrowthOS replaced 4 tools and 2 analysts. Our ROAS went from 2.1x to 4.8x in 90 days.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-[#0b1326]" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>PM</div>
            <div>
              <p className="text-[#dbe2fd] text-xs font-semibold">Priya Mehta</p>
              <p className="text-[#464554] text-[10px]">Founder, Glow Naturals</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel / form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-[#0f1a2e] lg:block hidden" />
        <div className="absolute inset-y-0 left-0 w-px bg-white/5 hidden lg:block" />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[#0b1326]" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>G</div>
            <span className="text-[#dbe2fd] font-bold text-lg">GrowthOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[#dbe2fd] text-2xl font-black mb-1.5">Welcome back</h2>
            <p className="text-[#464554] text-sm">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <AppIcon name="mail" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                <input
                  type="email"
                  placeholder="arjun@mybrand.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest">Password</label>
                <Link href="/reset-password" className="text-[#464554] text-xs hover:text-[#c0c1ff] transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <AppIcon name="lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#c7c4d7] transition-colors">
                  <AppIcon name={showPassword ? "visibility_off" : "visibility"} size={16} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AppIcon name="error" size={16} className="mt-0.5 text-red-400" />
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-[#0b1326] text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <AppIcon name="arrow_forward" size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[#464554] text-xs">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Demo hint */}
          <div className="p-3.5 rounded-xl bg-[#c0c1ff]/5 border border-[#c0c1ff]/15 mb-6">
            <p className="text-[#464554] text-xs">Sign up free or contact us for a guided demo.</p>
          </div>
          <p className="text-center text-[#464554] text-sm">
            No account?{" "}
            <Link href="/signup" className="text-[#c0c1ff] font-semibold hover:underline">Create workspace</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
