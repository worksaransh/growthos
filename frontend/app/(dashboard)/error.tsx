"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-xl">⚠️</span>
        </div>
        <h3 className="text-[#dbe2fd] font-bold text-lg mb-2">Failed to load</h3>
        <p className="text-[#c7c4d7] text-sm mb-6">{error.message || "Something went wrong loading this page."}</p>
        <button onClick={reset} className="px-5 py-2.5 rounded-xl text-[#0b1326] font-semibold text-sm" style={{ background: "linear-gradient(135deg, #c0c1ff, #ddb7ff)" }}>
          Try again
        </button>
      </div>
    </div>
  );
}
