"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { MultiLineChart } from "@/components/charts";

const ACCENT = "#7bd0ff";

const FORECAST_CHART_DATA = [
  { month: "Jan", actual: 38200000 },
  { month: "Feb", actual: 41100000 },
  { month: "Mar", actual: 44800000 },
  { month: "Apr", actual: 46100000 },
  { month: "May", actual: 48200000 },
  { month: "Jun", actual: 50400000 },
  { month: "Jul F", forecast: 52400000 },
  { month: "Aug F", forecast: 55100000 },
  { month: "Sep F", forecast: 59800000 },
];

const CONTEXT_CHIPS = [
  { label: "Next 30D Forecast", value: "₹52.4L", color: "#7bd0ff" },
  { label: "Confidence", value: "84%", color: "#4ade80" },
  { label: "MoM Growth", value: "+18%", color: "#4ade80" },
  { label: "Seasonal Adjustment", value: "+12%", color: "#ddb7ff" },
];

const QUICK_PROMPTS = [
  "What's my revenue forecast for next quarter?",
  "How accurate are your previous forecasts?",
  "Model a scenario with 30% budget increase",
  "When is my next peak season?",
  "Forecast impact of launching in new category",
  "What's my 12-month revenue trajectory?",
];

const MOCK_RESPONSES = [
  "Q3 revenue forecast (Jul-Sep): ₹1.62Cr with 81% confidence interval ₹1.45-1.82Cr. Key drivers: festive pre-loading in September (+22% uplift expected), Meta campaign scaling planned, and new SKU launch contribution (+₹8.2L). Risk factors: monsoon logistics delays typically reduce July revenue by 8-12% for your delivery zones.",
  "Forecast accuracy over last 6 months: January: actual ₹38.2L vs forecast ₹36.8L (96.3% accurate), February: ₹41.1L vs ₹42.0L (97.9% accurate), March: ₹44.8L vs ₹43.2L (96.4% accurate), April: ₹46.1L vs ₹47.8L (96.4% accurate), May: ₹48.2L vs ₹46.5L (96.5% accurate). Average accuracy: 96.7%. Errors are typically due to sudden platform outages or viral social media events.",
  "Scenario: 30% budget increase from ₹10.8L to ₹14.04L/month. Projected revenue impact at current ROAS efficiency: +₹11.2L/month additional revenue. New monthly total: ₹59.4L. ROAS efficiency expected to decline slightly (4.45x → 4.1x) due to audience expansion. Break-even on extra spend: 2.3 months. Recommended: Increase in 10% increments monthly to maintain efficiency.",
  "Peak season analysis based on your 18 months of data: Primary peak: October 15 - November 15 (Diwali/gifting, +65% above baseline). Secondary peak: January 1-31 (New Year fitness resolutions, +38%). Minor peak: June (pre-monsoon, +18%). Recommended action: Start inventory buildout 6 weeks before primary peak (by Sep 1) and increase ad budgets 4 weeks before (by Sep 15).",
  "12-month revenue trajectory (Jul 2025 - Jun 2026): Jul ₹50.2L → Aug ₹52.1L → Sep ₹58.4L → Oct ₹72.3L (Diwali peak) → Nov ₹65.1L → Dec ₹54.2L → Jan ₹71.8L (NY resolutions) → Feb ₹58.9L → Mar ₹62.4L → Apr ₹63.1L → May ₹65.8L → Jun ₹68.2L. Total 12-month forecast: ₹7.42Cr. Confidence: 79%.",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ForecastAiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello! I'm your Forecast AI. I use historical data, seasonality patterns, and market signals to project your revenue with high accuracy. Your next 30-day forecast is ₹52.4L with 84% confidence. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback((text?: string) => {
    const content = text ?? input;
    if (!content.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const idx = Date.now() % MOCK_RESPONSES.length;
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: MOCK_RESPONSES[idx],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1400);
  }, [input, loading]);

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: ACCENT + "20" }}
          >
            <AppIcon name="query_stats" size={24} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F4FF]">Forecast AI</h1>
            <p className="text-xs text-[#8A95B0]">
              Specialist AI · Powered by Claude AI
            </p>
          </div>
        </div>
        <span className="text-xs bg-[#0F1520] border border-[#1E2737] text-[#8A95B0] px-3 py-1 rounded-full font-mono">
          Powered by Claude AI
        </span>
      </div>

      {/* Context chips */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {CONTEXT_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2"
            >
              <span className="text-xs text-[#8A95B0]">{chip.label}</span>
              <span
                className="text-sm font-bold font-mono"
                style={{ color: chip.color }}
              >
                {chip.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Forecast Chart */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#F0F4FF]">Revenue Forecast</h3>
          <div className="flex items-center gap-3 text-[10px] text-[#8A95B0] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#7bd0ff] inline-block"></span>
              Actual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 border-t-2 border-dashed border-[#ddb7ff] inline-block"></span>
              Forecast
            </span>
          </div>
        </div>
        <MultiLineChart
          data={FORECAST_CHART_DATA}
          xKey="month"
          lines={[
            { key: "actual", color: "#7bd0ff", name: "Actual" },
            { key: "forecast", color: "#ddb7ff", name: "Forecast", dashed: true },
          ]}
          height={120}
        />
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="text-left text-[11px] text-[#8A95B0] bg-[#0F1520] border border-[#1E2737] hover:border-[#7bd0ff]/40 hover:text-[#F0F4FF] rounded-lg px-3 py-2 transition-all leading-tight"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: ACCENT + "20" }}
                >
                  <AppIcon name="query_stats" size={14} style={{ color: ACCENT }} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 text-sm relative group ${
                  msg.role === "user"
                    ? "bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 text-[#F0F4FF] rounded-br-sm"
                    : "bg-[#0F1520] border border-[#1E2737] text-[#C8D0E0] rounded-bl-sm"
                }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => copyMessage(msg.content, msg.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AppIcon
                      name={copied === msg.id ? "check" : "content_copy"}
                      className="text-[#48566E] hover:text-[#8A95B0]"
                      size={16}
                    />
                  </button>
                )}
                <div className="text-[10px] text-[#48566E] mt-1">
                  {msg.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: ACCENT + "20" }}
              >
                <AppIcon name="query_stats" size={14} style={{ color: ACCENT }} />
              </div>
              <div className="bg-[#0F1520] border border-[#1E2737] rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: ACCENT, animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: ACCENT, animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: ACCENT, animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-[#1E2737] flex gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about forecasts..."
            className="flex-1 bg-[#0F1520] border border-[#1E2737] rounded-full px-4 py-2 text-sm text-[#F0F4FF] placeholder-[#48566E] outline-none transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <AppIcon name="send" className="text-white" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
