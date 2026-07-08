"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

const FEATURES = [
  { icon: "ads_click",      color: "#ddb7ff", text: "Meta & Google Ads intelligence — ROAS, MER, creative fatigue signals" },
  { icon: "payments",       color: "#c0c1ff", text: "Profit Engine — SKU-level margin, contribution margin, true P&L" },
  { icon: "chat",           color: "#7bd0ff", text: "WhatsApp automation — cart recovery, COD verification, re-engagement" },
  { icon: "local_shipping", color: "#4ade80", text: "RTO prediction & NDR automation via Shiprocket & Delhivery" },
  { icon: "psychology",     color: "#fb923c", text: "Founder AI — ask anything about your business, get instant answers" },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, brand_name: brandName } },
    });
    if (error) { setError(error.message); setIsLoading(false); return; }
    if (!data.session) {
      setSignedUpEmail(email);
      setAwaitingVerification(true);
      setIsLoading(false);
      return;
    }
    router.push("/onboarding");
  };

  if (awaitingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1326]">
        <div className="w-full max-w-sm px-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 flex items-center justify-center mx-auto mb-5">
              <span style={{ fontSize: 28 }}>📧</span>
            </div>
            <h2 className="text-xl font-bold text-[#dbe2fd] mb-2">Check your inbox</h2>
            <p className="text-[#c7c4d7] text-sm mb-1">We sent a verification link to</p>
            <p className="text-[#c0c1ff] font-mono text-sm mb-6">{signedUpEmail}</p>
            <p className="text-[#c7c4d7] text-xs mb-6">Click the link in your email to activate your account and get started.</p>
            <a href="/login" className="text-[#c0c1ff] text-sm hover:underline">Back to login</a>
          </div>
        </div>
      </div>
    );
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "#4ade80"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="min-h-screen flex bg-[#0b1326]">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col p-12 overflow-hidden">
        {/* Background layers */}
        <Image
          src="/visuals/founder-workspace.png"
          alt="GrowthOS founder workspace dashboard"
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[#0b1326]/[0.55]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(221,183,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(123,208,255,0.06) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#0b1326] text-lg" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>G</div>
          <span className="text-[#dbe2fd] font-bold text-xl tracking-tight">GrowthOS</span>
        </div>

        <div className="relative my-auto">
          <p className="text-[#c0c1ff] text-xs font-bold uppercase tracking-widest mb-4">Everything in one platform</p>
          <h1 className="text-4xl xl:text-5xl font-black text-[#dbe2fd] leading-tight mb-3">
            Grow faster.<br />
            <span style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 50%, #7bd0ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Spend smarter.
            </span>
          </h1>
          <p className="text-[#c7c4d7] text-base leading-relaxed max-w-md mb-10">
            GrowthOS gives India&apos;s D2C founders a unified command centre from ads to operations to AI.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.icon} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: f.color + "18" }}>
                  <AppIcon name={f.icon} size={14} style={{ color: f.color }} />
                </div>
                <p className="text-[#c7c4d7] text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto pt-8 border-t border-white/5">
          <div className="flex items-center gap-6">
            {[["500+", "D2C brands"], ["200Cr+", "GMV managed"], ["14 days", "Free trial"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-[#c0c1ff] font-black text-lg">{v}</p>
                <p className="text-[#464554] text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-[#0f1a2e] lg:block hidden" />
        <div className="absolute inset-y-0 left-0 w-px bg-white/5 hidden lg:block" />

        <div className="relative w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[#0b1326]" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>G</div>
            <span className="text-[#dbe2fd] font-bold text-lg">GrowthOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[#dbe2fd] text-2xl font-black mb-1.5">Create your workspace</h2>
            <p className="text-[#464554] text-sm">14-day free trial. No credit card required.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Your name</label>
                <input
                  placeholder="Arjun Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
              <div>
                <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Brand name</label>
                <input
                  placeholder="MyBrand Co."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Work email</label>
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

            <div>
              <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <AppIcon name="lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#c7c4d7] transition-colors">
                  <AppIcon name={showPassword ? "visibility_off" : "visibility"} size={16} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: strength >= i ? strengthColors[strength] : "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AppIcon name="error" size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || password.length < 8}
              className="w-full py-3.5 rounded-xl font-bold text-[#0b1326] text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>Start free trial <AppIcon name="arrow_forward" size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[#464554] text-xs mt-5 leading-relaxed">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors">Terms</Link>
            {" & "}
            <Link href="/privacy" className="text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors">Privacy Policy</Link>.
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[#464554] text-xs">already a member?</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <Link
            href="/login"
            className="block w-full py-3 rounded-xl text-center text-[#c7c4d7] text-sm font-semibold border border-white/10 hover:border-[#c0c1ff]/30 hover:text-[#dbe2fd] transition-all"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
