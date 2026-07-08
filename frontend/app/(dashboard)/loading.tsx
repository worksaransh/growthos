export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-[#0b1326]">
      {/* Sidebar skeleton */}
      <div className="w-64 h-full bg-[#131b2e]/80 border-r border-white/10 p-4 flex-shrink-0 animate-pulse">
        <div className="h-9 w-9 rounded-xl bg-white/10 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-white/[0.05]" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-white/10 bg-[#0b1326]/85 px-6 flex items-center gap-4 animate-pulse">
          <div className="h-6 w-40 rounded-lg bg-white/10" />
          <div className="flex-1" />
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="h-8 w-24 rounded-lg bg-white/10" />
        </div>
        <div className="flex-1 p-7 animate-pulse">
          <div className="grid grid-cols-4 gap-5 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 h-72 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="h-72 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}
