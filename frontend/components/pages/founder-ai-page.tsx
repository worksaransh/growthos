"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { notify } from "@/lib/toast-sonner"

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  module?: string
  thinking?: boolean
}

interface ChatSession {
  id: string
  title: string
  preview: string
  timestamp: string
  module: string
}

interface SpecialistModule {
  id: string
  name: string
  icon: string
  color: string
  description: string
  starterPrompts: string[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const SPECIALISTS: SpecialistModule[] = [
  {
    id: "founder",
    name: "Founder AI",
    icon: "psychology",
    color: "#c0c1ff",
    description: "Strategic advisor with full business context",
    starterPrompts: [
      "Give me a comprehensive health check of my business this month",
      "What are my top 3 growth opportunities right now?",
      "Which products should I scale and which should I cut?",
      "Compare this month's performance to last month",
    ],
  },
  {
    id: "ads",
    name: "Ads Optimizer",
    icon: "ads_click",
    color: "#ddb7ff",
    description: "Meta & Google ads specialist",
    starterPrompts: [
      "Which ad campaigns should I pause immediately?",
      "How can I improve my ROAS from 2.8x to 4x?",
      "Suggest new audience segments to test",
      "Review my creative fatigue across all campaigns",
    ],
  },
  {
    id: "finance",
    name: "Finance CFO",
    icon: "account_balance",
    color: "#7bd0ff",
    description: "P&L, margins and cash flow",
    starterPrompts: [
      "What's my current net profit margin and how do I improve it?",
      "Show me my CAC vs LTV breakdown by channel",
      "Where am I overspending vs industry benchmarks?",
      "Project my cash flow for the next 90 days",
    ],
  },
  {
    id: "seo",
    name: "SEO Expert",
    icon: "search",
    color: "#4ade80",
    description: "Organic growth and content strategy",
    starterPrompts: [
      "What keywords am I losing traffic on?",
      "Give me a content calendar for this month",
      "Which pages have the most conversion potential?",
      "Analyze my technical SEO issues",
    ],
  },
  {
    id: "product",
    name: "Product Manager",
    icon: "inventory_2",
    color: "#fb923c",
    description: "Inventory and product strategy",
    starterPrompts: [
      "Which products are most likely to go out of stock?",
      "Recommend bundle opportunities based on purchase patterns",
      "Which slow-movers should I discount or discontinue?",
      "Analyze my product-level margins",
    ],
  },
  {
    id: "automation",
    name: "Automation AI",
    icon: "smart_toy",
    color: "#ddb7ff",
    description: "Workflow optimization and automation",
    starterPrompts: [
      "What manual processes can I automate immediately?",
      "Design a cart recovery workflow for my store",
      "Build a win-back campaign for churned customers",
      "How do I reduce RTO with automation?",
    ],
  },
]

const MOCK_HISTORY: ChatSession[] = [
  { id: "h1", title: "Business Health Check", preview: "Revenue is up 23% but margins need...", timestamp: "2 hours ago", module: "founder" },
  { id: "h2", title: "Meta Ads ROAS Analysis", preview: "Your top performing campaign is...", timestamp: "Yesterday", module: "ads" },
  { id: "h3", title: "Inventory Forecast Q3", preview: "Based on current sell-through rates...", timestamp: "2 days ago", module: "product" },
  { id: "h4", title: "SEO Content Strategy", preview: "I found 12 high-opportunity keywords...", timestamp: "3 days ago", module: "seo" },
]

// ── Mock AI responses ──────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<string, string[]> = {
  default: [
    `Based on your current data, here's what I'm seeing:\n\n**Revenue Trend**: ₹13.4L this month (+23% MoM). Your growth trajectory is strong, but there are margin concerns.\n\n**Top Opportunities**:\n1. **ROAS Optimization** — Your Meta campaigns are averaging 2.8x but 3 top creatives are at 4.2x. Scaling those could add ₹2-3L revenue at the same spend.\n2. **Cart Recovery** — You're losing ~₹4.2L/month in abandoned carts. A 3-step WhatsApp sequence could recover 15-20%.\n3. **Bundle Strategy** — Products A and B are purchased together 68% of the time. A bundle at ₹599 (vs ₹700 separate) could increase AOV by 18%.\n\nShall I dive deeper into any of these?`,
    `Looking at your unit economics:\n\n**CAC by Channel**:\n- Meta Ads: ₹340/customer\n- Google Search: ₹285/customer\n- Organic/SEO: ₹45/customer\n- WhatsApp: ₹120/customer\n\n**LTV Analysis** (12-month):\n- Average LTV: ₹1,847\n- LTV:CAC ratio: 4.8x (healthy — target is >3x)\n- Top 20% customers: ₹6,200 LTV\n\n**Recommendation**: Increase budget on Google Search by 30% (lowest CAC with strong LTV) and invest more in WhatsApp retention to increase repeat purchase rate from current 28% to 40%.`,
    `Here's your Q2 vs Q1 comparison:\n\n| Metric | Q1 | Q2 | Change |\n|--------|----|----|--------|\n| Revenue | ₹28.5L | ₹34.2L | +20% |\n| Orders | 1,842 | 2,156 | +17% |\n| AOV | ₹1,547 | ₹1,586 | +2.5% |\n| ROAS | 2.4x | 2.8x | +17% |\n| Net Margin | 12.4% | 14.1% | +1.7pp |\n\nStrong quarter! The margin improvement is particularly notable — what drove that was the reduction in RTO rate from 18% to 14%. Want me to analyze what changed operationally?`,
  ],
  ads: [
    `**Campaign Audit — Action Required**\n\nI've analyzed your 12 active campaigns. Here's the verdict:\n\n**Pause Immediately** (ROAS < 1.5x, burning cash):\n- "Summer Sale 18-24" — ROAS 1.2x, spending ₹8,400/day\n- "Retargeting Broad" — ROAS 1.4x, spending ₹4,200/day\n\n**Optimize** (ROAS 1.5-2.5x, room to improve):\n- "Interest Stack 25-45" — needs new creative, CTR declining\n- "Lookalike 1%" — audience saturated, expand to 2-3%\n\n**Scale** (ROAS > 3.5x, high performers):\n- "Carousel UGC v3" — ROAS 4.8x, only ₹3,200/day budget — increase 3x\n- "Retargeting 3-day" — ROAS 5.2x, increase budget by 50%\n\nTaking these actions could improve blended ROAS from 2.8x to 3.8x. Want me to draft the exact budget changes?`,
  ],
}

function getAIResponse(module: string, _message: string): string {
  const responses = DEMO_RESPONSES[module] || DEMO_RESPONSES.default
  return responses[Math.floor(Math.random() * responses.length)]
}

// ── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ msg, specialist }: { msg: Message; specialist: SpecialistModule }) {
  if (msg.thinking) {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: specialist.color + "20" }}>
          <span className="material-symbols-outlined text-sm" style={{ color: specialist.color, fontVariationSettings: "'FILL' 1" }}>{specialist.icon}</span>
        </div>
        <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#c7c4d7] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (msg.role === "user") {
    return (
      <div className="flex justify-end gap-3 mb-4">
        <div className="max-w-[70%] bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-[#dbe2fd] text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-xs font-bold text-[#0b1326]">
          SG
        </div>
      </div>
    )
  }

  // Format markdown-like content
  const formatted = msg.content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, "<br/>")

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: specialist.color + "20" }}>
        <span className="material-symbols-outlined text-sm" style={{ color: specialist.color, fontVariationSettings: "'FILL' 1" }}>{specialist.icon}</span>
      </div>
      <div className="max-w-[80%]">
        <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="text-[#dbe2fd] text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p>${formatted}</p>` }} />
        </div>
        <p className="text-[#464554] text-[10px] mt-1 ml-1">{specialist.name} · {msg.timestamp}</p>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function FounderAiPage() {
  const [activeModule, setActiveModule] = useState("founder")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [showContext, setShowContext] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const specialist = SPECIALISTS.find(s => s.id === activeModule) || SPECIALISTS[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    const thinkingMsg: Message = {
      id: "thinking",
      role: "assistant",
      content: "",
      timestamp: "",
      thinking: true,
    }
    setMessages(m => [...m, userMsg, thinkingMsg])
    setInput("")
    setLoading(true)

    // Simulate AI response (replace with real API call)
    await new Promise<void>(r => setTimeout(r, 1200 + Math.random() * 800))

    const response = getAIResponse(activeModule, text)
    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      module: activeModule,
    }
    setMessages(m => m.filter(x => x.id !== "thinking").concat(aiMsg))
    setLoading(false)
  }, [activeModule, loading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const switchModule = (moduleId: string) => {
    setActiveModule(moduleId)
    setMessages([])
  }

  const newChat = () => {
    setMessages([])
    setInput("")
    notify.success("New chat started")
  }

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left sidebar: history */}
      {showHistory && (
        <div className="w-64 flex-shrink-0 border-r border-[#464554]/30 flex flex-col bg-[#0b1326]/50">
          <div className="p-3 border-b border-[#464554]/30">
            <button onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#c0c1ff]/30 text-[#c0c1ff] hover:bg-[#c0c1ff]/10 transition-colors text-sm font-medium">
              <span className="material-symbols-outlined text-base">add</span>
              New Chat
            </button>
          </div>

          {/* Specialist selector */}
          <div className="p-3 border-b border-[#464554]/30">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-2">AI Specialists</p>
            <div className="space-y-0.5">
              {SPECIALISTS.map(s => (
                <button key={s.id} onClick={() => switchModule(s.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${activeModule === s.id ? "bg-white/[0.08] text-[#dbe2fd]" : "text-[#c7c4d7] hover:bg-white/[0.03] hover:text-[#dbe2fd]"}`}>
                  <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <span className="text-xs font-medium truncate">{s.name}</span>
                  {activeModule === s.id && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-2">Recent</p>
            <div className="space-y-1">
              {MOCK_HISTORY.map(h => (
                <button key={h.id} onClick={() => {}} className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
                  <p className="text-[#dbe2fd] text-xs font-medium truncate group-hover:text-white">{h.title}</p>
                  <p className="text-[#464554] text-[10px] mt-0.5 truncate">{h.preview}</p>
                  <p className="text-[#464554] text-[9px] mt-0.5">{h.timestamp}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#464554]/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)} className="text-[#c7c4d7] hover:text-white p-1.5 rounded-lg hover:bg-white/5">
              <span className="material-symbols-outlined text-base">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: specialist.color + "20" }}>
                <span className="material-symbols-outlined text-sm" style={{ color: specialist.color, fontVariationSettings: "'FILL' 1" }}>{specialist.icon}</span>
              </div>
              <div>
                <p className="text-[#dbe2fd] font-semibold text-sm">{specialist.name}</p>
                <p className="text-[#c7c4d7] text-xs">{specialist.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#4ade80]">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full" />
              Live data connected
            </div>
            <button onClick={() => setShowContext(!showContext)} className="text-[#c7c4d7] hover:text-white p-1.5 rounded-lg hover:bg-white/5">
              <span className="material-symbols-outlined text-base">info</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: specialist.color + "20" }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: specialist.color, fontVariationSettings: "'FILL' 1" }}>{specialist.icon}</span>
              </div>
              <h2 className="text-[#dbe2fd] text-xl font-bold mb-2">{specialist.name}</h2>
              <p className="text-[#c7c4d7] text-sm mb-8">{specialist.description}</p>

              {/* Starter prompts */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {specialist.starterPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => sendMessage(prompt)}
                    className="glass-card rounded-xl p-3 text-left hover:border-[#c0c1ff]/30 border border-white/10 transition-all hover:-translate-y-0.5">
                    <p className="text-[#dbe2fd] text-xs font-medium leading-snug">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} specialist={specialist} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="glass-card rounded-2xl p-3 border border-white/10 focus-within:border-[#c0c1ff]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${specialist.name} anything about your business...`}
              rows={2}
              className="w-full bg-transparent text-[#dbe2fd] text-sm resize-none outline-none placeholder-[#464554]"
              style={{ maxHeight: 120 }}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#464554] text-xs">
                <span className="material-symbols-outlined text-sm">database</span>
                Live data from Shopify, Meta, Google
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#464554] text-[10px]">Shift+Enter for newline</span>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ backgroundColor: specialist.color + "20" }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: specialist.color, fontVariationSettings: "'FILL' 1" }}>
                    {loading ? "more_horiz" : "arrow_upward"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right context panel */}
      {showContext && (
        <div className="w-72 flex-shrink-0 border-l border-[#464554]/30 p-4 overflow-y-auto bg-[#0b1326]/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#dbe2fd] font-semibold text-sm">Business Context</h3>
            <button onClick={() => setShowContext(false)} className="text-[#c7c4d7] hover:text-white">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Live metrics */}
          <div className="space-y-3">
            {[
              { label: "Revenue (30d)", value: "₹13.4L", change: "+23%", positive: true },
              { label: "Orders", value: "847", change: "+17%", positive: true },
              { label: "ROAS (blended)", value: "2.8x", change: "-0.2x", positive: false },
              { label: "RTO Rate", value: "14%", change: "-4%", positive: true },
              { label: "AOV", value: "₹1,586", change: "+2.5%", positive: true },
              { label: "Net Margin", value: "14.1%", change: "+1.7pp", positive: true },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[#c7c4d7] text-xs">{m.label}</span>
                <div className="text-right">
                  <p className="text-[#dbe2fd] text-sm font-semibold">{m.value}</p>
                  <p className={`text-[10px] ${m.positive ? "text-[#4ade80]" : "text-[#ffb4ab]"}`}>{m.change}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-2">Data Sources Active</p>
            <div className="space-y-1.5">
              {[
                { name: "Shopify", icon: "store", connected: true },
                { name: "Meta Ads", icon: "ads_click", connected: true },
                { name: "Google Ads", icon: "search", connected: false },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#c7c4d7]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <span className="text-[#c7c4d7] text-xs">{s.name}</span>
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${s.connected ? "bg-[#4ade80]" : "bg-[#464554]"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
