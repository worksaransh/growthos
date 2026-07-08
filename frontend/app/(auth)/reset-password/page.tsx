"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

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
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });
    if (error) { setError(error.message); setIsLoading(false); return; }
    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center px-4 relative overflow-hidden">
      <Image
        src="/visuals/ai-operating-system.png"
        alt="GrowthOS secure AI operating system workspace"
        fill
        sizes="100vw"
        className="object-cover opacity-[0.12]"
      />
      <div className="absolute inset-0 bg-[#0b1326]/[0.74]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(ellipse, #c0c1ff 0%, transparent 70%)" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #c0c1ff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#0b1326] text-lg" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>G</div>
          <span className="text-[#dbe2fd] font-bold text-xl tracking-tight">GrowthOS</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(192,193,255,0.15) 0%, rgba(221,183,255,0.15) 100%)", border: "1px solid rgba(192,193,255,0.3)" }}>
              <AppIcon name="mark_email_read" size={30} className="text-[#c0c1ff]" />
            </div>
            <h1 className="text-[#dbe2fd] text-2xl font-black mb-2">Check your inbox</h1>
            <p className="text-[#c7c4d7] text-sm leading-relaxed mb-2">We sent a reset link to</p>
            <p className="text-[#c0c1ff] font-semibold text-sm mb-6">{email}</p>
            <p className="text-[#464554] text-xs leading-relaxed mb-8">
              Click the link in the email to set a new password. The link expires in 1 hour.
              Check your spam folder if you don&apos;t see it.
            </p>
            <button onClick={() => { setSent(false); setEmail(""); }} className="text-[#c0c1ff] text-sm hover:underline">
              Use a different email &rarr;
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(192,193,255,0.12) 0%, rgba(221,183,255,0.12) 100%)", border: "1px solid rgba(192,193,255,0.2)" }}>
                <AppIcon name="lock_reset" size={24} className="text-[#c0c1ff]" />
              </div>
              <h1 className="text-[#dbe2fd] text-2xl font-black mb-2">Forgot your password?</h1>
              <p className="text-[#464554] text-sm leading-relaxed max-w-xs mx-auto">
                No worries. Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Email address</label>
                <div className="relative">
                  <AppIcon name="mail" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                  <input
                    type="email"
                    placeholder="arjun@mybrand.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AppIcon name="error" size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3.5 rounded-xl font-bold text-[#0b1326] text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>Send reset link <AppIcon name="send" size={16} /></>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-8">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[#464554] text-sm hover:text-[#c7c4d7] transition-colors">
            <AppIcon name="arrow_forward" size={15} className="rotate-180" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
