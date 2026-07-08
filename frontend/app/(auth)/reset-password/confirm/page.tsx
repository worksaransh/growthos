"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "#4ade80"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

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
    setTimeout(() => router.push("/login"), 3000);
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
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(ellipse, #ddb7ff 0%, transparent 70%)" }} />
      </div>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #c0c1ff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#0b1326] text-lg" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>G</div>
          <span className="text-[#dbe2fd] font-bold text-xl tracking-tight">GrowthOS</span>
        </Link>

        {success ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(74,222,128,0.08) 100%)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <AppIcon name="check_circle" size={31} className="text-[#4ade80]" />
            </div>
            <h1 className="text-[#dbe2fd] text-2xl font-black mb-2">Password updated!</h1>
            <p className="text-[#c7c4d7] text-sm leading-relaxed mb-6">
              Your password has been changed successfully. Redirecting you to sign in...
            </p>
            <div className="flex items-center justify-center gap-2 text-[#464554] text-xs">
              <span className="w-3 h-3 border border-[#464554] border-t-transparent rounded-full animate-spin" />
              Redirecting to login
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(192,193,255,0.12) 0%, rgba(221,183,255,0.12) 100%)", border: "1px solid rgba(192,193,255,0.2)" }}>
                <AppIcon name="key" size={26} className="text-[#c0c1ff]" />
              </div>
              <h1 className="text-[#dbe2fd] text-2xl font-black mb-2">Set new password</h1>
              <p className="text-[#464554] text-sm">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">New password</label>
                <div className="relative">
                  <AppIcon name="lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/50 focus:bg-white/[0.07] transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#c7c4d7] transition-colors">
                    <AppIcon name={showPassword ? "visibility_off" : "visibility"} size={16} />
                  </button>
                </div>
                {/* Strength bar */}
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

              {/* Confirm password */}
              <div>
                <label className="block text-[#c7c4d7] text-xs font-semibold uppercase tracking-widest mb-2">Confirm password</label>
                <div className="relative">
                  <AppIcon name="lock_open" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464554]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.05] border text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:bg-white/[0.07] transition-all ${
                      passwordsMismatch
                        ? "border-red-500/40 focus:border-red-500/60"
                        : passwordsMatch
                        ? "border-[#4ade80]/40 focus:border-[#4ade80]/60"
                        : "border-white/10 focus:border-[#c0c1ff]/50"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#c7c4d7] transition-colors">
                    <AppIcon name={showConfirm ? "visibility_off" : "visibility"} size={16} />
                  </button>
                  {/* Match indicator */}
                  {passwordsMatch && (
                    <AppIcon name="check_circle" size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-[#4ade80]" />
                  )}
                </div>
                {passwordsMismatch && (
                  <p className="text-red-400 text-xs mt-1.5">Passwords don&apos;t match</p>
                )}
              </div>

              {/* Requirements */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                {[
                  { ok: password.length >= 8, text: "At least 8 characters" },
                  { ok: /[A-Z]/.test(password), text: "One uppercase letter" },
                  { ok: /[0-9]/.test(password), text: "One number" },
                ].map((r) => (
                  <div key={r.text} className="flex items-center gap-2">
                    <AppIcon name={r.ok ? "check_circle" : "circle"} size={14} className={`transition-colors ${r.ok ? "text-[#4ade80]" : "text-[#464554]"}`} />
                    <span className={`text-xs transition-colors ${r.ok ? "text-[#c7c4d7]" : "text-[#464554]"}`}>{r.text}</span>
                  </div>
                ))}
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
                disabled={loading || password.length < 8 || password !== confirm}
                className="w-full py-3.5 rounded-xl font-bold text-[#0b1326] text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>Update password <AppIcon name="lock_reset" size={16} /></>
                )}
              </button>
            </form>
          </>
        )}

        {/* Back to login */}
        {!success && (
          <div className="text-center mt-8">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-[#464554] text-sm hover:text-[#c7c4d7] transition-colors">
              <AppIcon name="arrow_forward" size={15} className="rotate-180" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
