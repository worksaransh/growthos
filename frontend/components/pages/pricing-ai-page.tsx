"use client";
import { useState, useRef, useEffect } from "react";
import { AppIcon } from "@/components/shared/app-icon";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES = [
  "Price elasticity analysis shows 4 products where you're leaving money on the table. 'Premium Whey 1kg' at ₹1,899 has strong demand inelasticity — a 12% price increase to ₹2,129 would reduce volume by only 4% but increase revenue by 7.5% and improve gross margin by 2.3 points.",
  "Optimal price for your bestseller 'Premium Whey 1kg' based on price-demand curve: ₹2,149. Current price: ₹1,899. At ₹2,149, you maximize revenue per unit while staying 31% below competitor average (₹3,120). Projected revenue impact: +₹4.2L/month at current volume minus expected 6% volume decline.",
  "Simulating a 10% price increase across all products: Volume impact: -7% estimated (elasticity coefficient 0.73). Revenue impact: +2.3% net positive. Margin impact: +3.1 percentage points. Best candidates for 10% increase with lowest volume sensitivity: Collagen Booster (elasticity 0.4), Vitamin D3 (elasticity 0.35), Omega-3 Softgels (elasticity 0.51).",
  "Competitor price matching recommendations: 1) Your Creatine Monohydrate at ₹899 vs competitor ₹749 — you're 20% above, consider ₹799 to be competitive. 2) Your Pre-Workout at ₹1,499 vs competitor ₹1,699 — you're underpriced, increase to ₹1,599. Net impact of both changes: +₹1.2L revenue/month.",
  "Optimal discount strategy by product tier: Premium SKUs (margin > 45%): max 20% discount, 3-day flash sales. Mid-tier (margin 30-45%): max 15%, bundle discounts preferred. Entry-level (margin < 30%): max 10%, only for first-time buyer acquisition. Recommended timing: Thursday-Saturday drives highest conversion for your customer base. Never discount top 3 SKUs by repeat purchase rate.",
];

const QUICK_PROMPTS = [
  "Which products are priced too low?",
  "What's the optimal price for my bestseller?",
  "How will a 10% price increase affect volume?",
  "Which competitor prices should I match?",
  "Suggest a dynamic pricing strategy",
  "What discount depth maximizes profit?",
];

const ACCENT = "#ddb7ff";

export function PricingAiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => {
      const idx = Date.now() % MOCK_RESPONSES.length;
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: MOCK_RESPONSES[idx],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: ACCENT + "20" }}
          >
            <AppIcon name="sell" size={24} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F4FF]">Pricing AI</h1>
            <p className="text-xs text-[#8A95B0]">
              Specialist AI · Powered by Claude AI
            </p>
          </div>
        </div>
        <span className="text-xs bg-[#0F1520] border border-[#1E2737] text-[#8A95B0] px-3 py-1 rounded-full font-mono">
          Powered by Claude AI
        </span>
      </div>

      {/* Context Panel */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Avg Price</span>
            <span className="text-sm font-bold text-[#F0F4FF]">₹2,847</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Price Elasticity</span>
            <span className="text-sm font-bold" style={{ color: ACCENT }}>
              0.73
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Competitor Avg</span>
            <span className="text-sm font-bold text-[#8A95B0]">₹3,120</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Price Win Rate</span>
            <span className="text-sm font-bold text-[#4ade80]">62%</span>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="text-left text-xs text-[#8A95B0] hover:text-[#F0F4FF] bg-[#0F1520] hover:bg-[#1E2737] border border-[#1E2737] px-3 py-2.5 rounded-lg transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat */}
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
                  <AppIcon name="sell" size={14} style={{ color: ACCENT }} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 text-sm relative group ${
                  msg.role === "user"
                    ? "bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 text-[#F0F4FF] rounded-br-sm"
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
                <AppIcon name="sell" size={14} style={{ color: ACCENT }} />
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
            placeholder="Ask about pricing..."
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
