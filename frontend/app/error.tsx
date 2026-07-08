"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-[#dbe2fd] mb-2">Something went wrong</h2>
        <p className="text-[#c7c4d7] text-sm mb-2">{error.message || "An unexpected error occurred."}</p>
        {error.digest && <p className="text-[#464554] text-xs font-mono mb-6">Error ID: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="px-5 py-2.5 rounded-xl text-[#0b1326] font-semibold text-sm" style={{ background: "linear-gradient(135deg, #c0c1ff, #ddb7ff)" }}>
            Try again
          </button>
          <a href="/dashboard" className="px-5 py-2.5 rounded-xl border border-white/10 text-[#c7c4d7] text-sm hover:border-white/20 transition-colors">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
