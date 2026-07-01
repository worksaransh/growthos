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
  "Your domain has strong topical authority for 'D2C supplements' but is missing coverage for high-intent transactional keywords. Top 5 opportunities with difficulty < 40: 'protein powder subscription' (Vol: 2,400, KD: 28), 'best whey protein India' (Vol: 8,100, KD: 35), 'creatine monohydrate online' (Vol: 5,400, KD: 31), 'pre-workout India' (Vol: 6,200, KD: 38), 'collagen powder benefits' (Vol: 3,300, KD: 22).",
  "Top 5 blog topics projected to drive the most traffic: 1) 'Complete Guide to Protein Powder for Beginners' (est. 800 visits/mo), 2) 'Creatine vs Pre-Workout: Which is Right for You?' (est. 650/mo), 3) 'Best Supplements for Weight Loss India 2024' (est. 1,200/mo), 4) 'How to Read Supplement Labels' (est. 450/mo), 5) 'Whey Protein for Women: Myths Debunked' (est. 900/mo).",
  "Organic traffic declined 12% over the last 30 days. Root causes identified: 1) Core update impact — 8 pages dropped average 6 positions, 2) 3 high-traffic pages have thin content (< 600 words), 3) Page speed degraded (LCP: 4.2s, target < 2.5s). Priority fixes: Expand content on top 3 declining pages, compress hero images, add FAQ schema markup.",
  "Competitor analysis for top D2C supplement brand: They rank for 1,847 keywords vs your 247. Their content strategy focuses on 'vs' comparison pages (142 indexed) and 'best X for Y' formats. They have 3.2x more backlinks from fitness blogs. Quick wins: Create 10 comparison pages for your hero products and guest post on 5 fitness publications.",
  "30-day content calendar (Week 1): Mon — 'Benefits of Whey Protein' (informational, 2,400 searches), Wed — 'Protein Powder vs Whole Food' (comparison, 1,800 searches), Fri — 'Best Post-Workout Nutrition' (guide, 3,100 searches). Week 2 focuses on creatine content cluster. Total projected traffic increase: +2,400 visits/month by day 90.",
];

const QUICK_PROMPTS = [
  "What keywords should I target this month?",
  "Which blog posts would drive most traffic?",
  "Why is my organic traffic declining?",
  "Analyze my top competitor's SEO strategy",
  "Generate a content calendar for 30 days",
  "What are my best ranking opportunities?",
];

const ACCENT = "#4ade80";

export function SeoAiPage() {
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
      const idx = messages.length % MOCK_RESPONSES.length;
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
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}1a` }}
          >
            <AppIcon name="travel_explore" size={24} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0F4FF]">SEO AI</h1>
            <p className="text-xs text-[#8A95B0]">
              Specialist AI · Powered by Claude AI
            </p>
          </div>
        </div>
        <span className="text-xs bg-[#1E2737] text-[#8A95B0] px-3 py-1 rounded-full font-mono border border-[#1E2737]">
          Powered by Claude AI
        </span>
      </div>

      {/* Context Panel */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Domain Authority - warning */}
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Domain Authority</span>
            <span className="badge-warning text-sm font-bold">34</span>
          </div>
          {/* Organic Traffic - success */}
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Organic Traffic</span>
            <span className="badge-success text-sm font-bold">12,400/mo</span>
          </div>
          {/* Keywords Ranking - neutral */}
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Keywords Ranking</span>
            <span className="text-sm font-bold text-[#F0F4FF]">247</span>
          </div>
          {/* Avg Position - warning */}
          <div className="flex items-center gap-2 bg-[#0F1520] border border-[#1E2737] rounded-lg px-3 py-2">
            <span className="text-xs text-[#8A95B0]">Avg Position</span>
            <span className="badge-warning text-sm font-bold">18.4</span>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="text-left text-xs text-[#8A95B0] hover:text-[#F0F4FF] bg-[#0F1520] hover:bg-[#1E2737] border border-[#1E2737] px-3 py-2.5 rounded-lg transition-all"
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = `${ACCENT}4d`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#1E2737")
            }
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${ACCENT}1a` }}
              >
                <AppIcon name="travel_explore" size={38} style={{ color: ACCENT }} />
              </div>
              <p className="text-[#F0F4FF] font-semibold mb-1">
                Ask SEO AI anything
              </p>
              <p className="text-xs text-[#48566E] max-w-xs">
                Get keyword research, content strategy, competitor analysis,
                and ranking opportunities powered by your live SEO data.
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
                  style={{ backgroundColor: `${ACCENT}1a` }}
                >
                  <AppIcon name="travel_explore" size={14} style={{ color: ACCENT }} />
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
                      size={14}
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
                style={{ backgroundColor: `${ACCENT}1a` }}
              >
                <AppIcon name="travel_explore" size={14} style={{ color: ACCENT }} />
              </div>
              <div className="bg-[#0F1520] border border-[#1E2737] rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: ACCENT,
                    animationDelay: "0ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: ACCENT,
                    animationDelay: "150ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: ACCENT,
                    animationDelay: "300ms",
                  }}
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
            placeholder="Ask about your SEO strategy..."
            className="flex-1 bg-[#0F1520] border border-[#1E2737] rounded-full px-4 py-2 text-sm text-[#F0F4FF] placeholder-[#48566E] outline-none transition-colors"
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = `${ACCENT}66`)
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2737")}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
          >
            <AppIcon name="send" className="text-white" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
