"use client";

interface ChannelData {
  name: string;
  spend: number;
  roas: number;
  color: string;
}

interface ChannelBreakdownProps {
  channels: ChannelData[];
}

export function ChannelBreakdown({ channels }: ChannelBreakdownProps) {
  const total = channels.reduce((s, c) => s + c.spend, 0);

  return (
    <div className="flex flex-col gap-3.5">
      {channels.map((ch) => {
        const pct = (ch.spend / total) * 100;
        return (
          <div key={ch.name}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-3.5 rounded"
                  style={{ background: ch.color }}
                />
                <span className="text-xs text-[#8A95B0]">{ch.name}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-mono text-xs text-[#F0F4FF]">
                  ₹{ch.spend.toLocaleString("en-IN")}
                </span>
                <span className="font-mono text-[11px] text-[#00E5A0]">
                  {ch.roas.toFixed(2)}x
                </span>
              </div>
            </div>
            <div className="h-1 bg-[#1C2230] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: ch.color,
                  opacity: 0.85,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-[#48566E]">
                {pct.toFixed(1)}% of spend
              </span>
              <span className="font-mono text-[10px] text-[#48566E]">ROAS</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
