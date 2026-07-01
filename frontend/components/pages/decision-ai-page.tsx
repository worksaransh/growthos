"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppIcon } from "@/components/shared/app-icon";

const ACCENT = "#c0c1ff";

const CONTEXT_CHIPS = [
  { label: "Pending Decisions", value: "3", color: "#f97316" },
  { label: "Avg Decision Impact", value: "₹2.4L", color: "#c0c1ff" },
  { label: "Decisions This Month", value: "8", color: "#8A95B0" },
  { label: "Accuracy Score", value: "87%", color: "#4ade80" },
];

const QUICK_PROMPTS = [
  "Should I increase my ad budget this week?",
  "Is now a good time to launch a new product?",
  "Should I hire a second warehouse?",
  "Analyse risk of entering a new category",
  "Compare: discount vs bundle strategy",
  "What's my biggest growth lever right now?",
];

const MOCK_RESPONSES = [
  "Based on your current metrics, increasing ad budget by ₹5L this week is MODERATE RISK. Your ROAS has been declining (4.8x → 4.45x over 3 weeks), suggesting audience saturation before adding spend. Recommendation: Refresh top 3 creatives first (takes 3-4 days), then scale. Expected ROAS at new budget with fresh creatives: 4.2-4.6x, generating ₹21-23L additional revenue.",
  "Current market conditions for new product launch: PROCEED WITH CAUTION. Your existing SKU portfolio is already showing inventory stress (14 low-stock items). Launching now would split your capital and operational focus. Recommended: Stabilize inventory for top 20 SKUs first (est. 3 weeks), then launch. New product launch in Q4 window (Oct-Nov) would benefit from festive demand +40%.",
  "Second warehouse analysis: Break-even in 14 months at current growth rate (28% MoM). Current single warehouse is at 78% capacity — you'll hit 100% in 6-8 weeks. RECOMMENDATION: Start negotiating leases now for a 3PL partnership rather than owned warehouse — lower capex (₹0 vs ₹8L setup), flexible scaling, operational from week 3.",
  "New category risk assessment: Based on your brand equity analysis, entering 'Sports Equipment' would be HIGH RISK (brand stretch too far from supplements). Entering 'Healthy Snacks' would be MEDIUM RISK with high upside — 68% of your customers already buy snacks, AOV would increase from ₹1,847 to ₹2,300. Recommend 3 test SKUs with ₹2L investment.",
  "Discount vs Bundle strategy analysis for your slow movers: BUNDLE WINS by 2.3x. Discounting 'Casein Protein' 20% → margin drops from 38% to 18%, sells 45 extra units, net gain ₹12K. Bundling 'Casein + Shaker + Vitamin D' at ₹1,799 (15% savings) → margin stays at 32%, perceived value higher, sells 28 bundles, net gain ₹28K. Recommend: Test both for 2 weeks.",
];

const PENDING_DECISIONS = [
  {
    id: "1",
    title: "Increase Meta budget by ₹5L?",
    risk: "Medium" as const,
    riskColor: "#f59e0b",
    impact: "₹8.2L projected",
    prompt: "Analyse the decision: Should I increase my Meta ad budget by ₹5L given current ROAS trends?",
  },
  {
    id: "2",
    title: "Launch new protein SKU?",
    risk: "High" as const,
    riskColor: "#ef4444",
    impact: "₹15L projected",
    prompt: "Analyse the risk of launching a new protein SKU right now given current inventory and market conditions",
  },
  {
    id: "3",
    title: "15% discount on slow movers?",
    risk: "Low" as const,
    riskColor: "#4ade80",
    impact: "₹2.1L projected",
    prompt: "Should I run a 15% discount on slow-moving SKUs or would a bundle strategy work better?",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function DecisionAiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello! I'm your Decision AI. I analyse your business data to help you make confident, data-backed decisions. You have 3 pending decisions awaiting analysis. What would you like to explore?",
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
            <AppIcon name="psychology" size={24} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F4FF]">Decision AI</h1>
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

      {/* Main content: left chat + right decisions panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Quick prompts */}
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-left text-[11px] text-[#8A95B0] bg-[#0F1520] border border-[#1E2737] hover:border-[#c0c1ff]/40 hover:text-[#F0F4FF] rounded-lg px-3 py-2 transition-all leading-tight"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat glass-card */}
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
                      <AppIcon name="psychology" size={14} style={{ color: ACCENT }} />
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
                    <AppIcon name="psychology" size={14} style={{ color: ACCENT }} />
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
                placeholder="Ask about a business decision..."
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

        {/* Right: Pending Decisions panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="glass-card p-4 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon name="pending_actions" className="text-[#f97316]" size={19} />
              <h3 className="text-sm font-bold text-[#F0F4FF]">
                Pending Decisions
              </h3>
              <span className="ml-auto text-xs bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded-full font-mono">
                3
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {PENDING_DECISIONS.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#0F1520] border border-[#1E2737] rounded-xl p-3"
                >
                  <div className="text-xs text-[#F0F4FF] font-medium mb-2">
                    {d.title}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: d.riskColor,
                        background: d.riskColor + "20",
                      }}
                    >
                      Risk: {d.risk}
                    </span>
                    <span className="text-[10px] text-[#8A95B0]">
                      {d.impact}
                    </span>
                  </div>
                  <button
                    onClick={() => sendMessage(d.prompt)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-medium transition-all border border-[#c0c1ff]/30 text-[#c0c1ff] hover:bg-[#c0c1ff]/10"
                  >
                    Analyse with AI
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
