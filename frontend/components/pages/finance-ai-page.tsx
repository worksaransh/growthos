"use client";
import { useState, useRef, useEffect } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { api } from "@/lib/api-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ACCENT = "#c0c1ff";

const QUICK_PROMPTS = [
  "Where am I losing the most margin?",
  "What's my break-even order volume?",
  "How can I improve EBITDA by 5%?",
  "Which expense categories are growing fastest?",
  "Forecast my cash position in 90 days",
  "What's my customer acquisition payback period?",
];

export function FinanceAiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
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
    try {
      const { response } = await api.specialistChat("finance", msg);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, AI is temporarily unavailable.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
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
            style={{ background: `${ACCENT}20` }}
          >
            <AppIcon name="account_balance" size={24} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F4FF]">Finance AI</h1>
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
            <span className="text-xs text-[#8A95B0]">Net Revenue</span>
            <span className="text-sm font-bold" style={{ color: "#4ade80" }}>
              ₹48.2L
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Gross Margin</span>
            <span className="text-sm font-bold" style={{ color: "#4ade80" }}>
              42%
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">EBITDA</span>
            <span className="text-sm font-bold" style={{ color: "#c0c1ff" }}>
              ₹8.4L
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Burn Rate</span>
            <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>
              ₹12.1L/mo
            </span>
          </div>
        </div>
      </div>

      {/* Quick Prompts 2x3 grid */}
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

      {/* Chat Interface */}
      <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `${ACCENT}15` }}
              >
                <AppIcon name="account_balance" size={38} style={{ color: ACCENT }} />
              </div>
              <p className="text-[#8A95B0] text-sm max-w-xs">
                Ask me anything about your revenue, margins, EBITDA, cash flow,
                or financial forecasts.
              </p>
            </div>
          )}
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
                  style={{ background: `${ACCENT}15` }}
                >
                  <AppIcon name="account_balance" size={14} style={{ color: ACCENT }} />
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
                style={{ background: `${ACCENT}15` }}
              >
                <AppIcon name="account_balance" size={14} style={{ color: ACCENT }} />
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

        {/* Input bar */}
        <div className="p-4 border-t border-[#1E2737] flex gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about your finances..."
            className="flex-1 bg-[#0F1520] border border-[#1E2737] rounded-full px-4 py-2 text-sm text-[#F0F4FF] placeholder-[#48566E] outline-none transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
          >
            <AppIcon name="send" className="text-white" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
