import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black mb-4" style={{ background: "linear-gradient(135deg, #c0c1ff, #ddb7ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          404
        </div>
        <h1 className="text-2xl font-bold text-[#dbe2fd] mb-3">Page not found</h1>
        <p className="text-[#c7c4d7] text-sm mb-8">The page you are looking for does not exist or has been moved.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[#0b1326] font-semibold text-sm transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #c0c1ff, #ddb7ff)" }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
