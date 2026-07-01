"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/shared/app-icon";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
}

const QUICK_ACTIONS = [
  { id: "ad_copy", label: "Ad Copy Generator", icon: "ad_copy", desc: "High-converting Meta/Google ad copy" },
  { id: "email", label: "Email Campaign", icon: "email", desc: "Promotional email template" },
  { id: "whatsapp", label: "WhatsApp Message", icon: "whatsapp", desc: "D2C WhatsApp broadcast copy" },
  { id: "caption", label: "Instagram Caption", icon: "caption", desc: "Engaging IG post captions" },
];

const MOCK_RESPONSES: Record<string, string> = {
  roas: "Your blended ROAS is currently 4.45x - above the 3.8x D2C fashion benchmark. Meta is performing strongest at 4.82x. I'd recommend scaling your Retargeting - 7 Day Visitors campaign by 20-30% because it is showing 7.2x ROAS with room to grow before audience saturation.",
  cac: "Your current CAC is Rs.847, down 6.2% from last period. Meta campaigns are contributing the most to efficient acquisition, especially your lookalike audiences. To reduce CAC further, focus on landing page conversion rate and test UGC-style creatives.",
  profit: "Net profit for the last 30 days is Rs.7.2L on Rs.48.2L revenue - a 14.9% net margin. This is healthy for a D2C brand at your stage. Your biggest cost after COGS is ad spend at Rs.10.8L. Optimizing contribution margin with lower-spend, high-intent audiences could add 2-3% to net margin.",
  default: "I'm your Founder AI assistant for GrowthOS. I can analyze your revenue trends, campaign performance, customer segments, and profit data. Ask me anything about your business - try 'What's my ROAS?', 'How can I reduce CAC?', or 'Which products should I scale?'",
};

function getMockResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("roas")) return MOCK_RESPONSES.roas;
  if (q.includes("cac") || q.includes("acquisition")) return MOCK_RESPONSES.cac;
  if (q.includes("profit") || q.includes("margin")) return MOCK_RESPONSES.profit;
  return `Based on your GrowthOS data: "${query}" - I'm analyzing your metrics. For your D2C brand, I see revenue of Rs.48.2L in the last 30 days with a blended ROAS of 4.45x. Your top opportunity right now is scaling the retargeting campaign and improving product margins on your top-10 SKUs. Would you like a deeper analysis on any specific area?`;
}

const MOCK_AD_COPY = `Hook: "Why 40,000 Indians switched their entire wardrobe this summer"

Primary text:
"Most people spend Rs.5,000 on basics that fade after 3 washes. We obsessed over every stitch so you don't have to. Classic Fit Tee Pack - 3 premium tees, one unbeatable price. Join 40,000+ happy customers.

- 180-day quality guarantee
- Free shipping above Rs.499
- Easy 7-day returns

Shop now"

Headline: Premium Basics. Honest Price.
Description: 3 Classic Fit Tees starting at Rs.899. Limited stock.`;

const MOCK_EMAIL = `Subject: Your summer wardrobe is incomplete without this

Hi [First Name],

We noticed you haven't restocked yet - and summer is heating up.

Our bestselling Classic Fit Tee Pack is back with 3 premium cotton tees in our most-loved colors. 40,000+ customers can't be wrong.

Why they love it:
- Preshrunk and colorfast - stays perfect after 50 washes
- Breathable cotton - ideal for 40C Indian summers
- Fits true to size (see our size guide)

For the next 48 hours, use code SUMMER15 for 15% off your order.

[Shop Now]

Stay cool,
The [Brand] Team`;

const MOCK_WHATSAPP = `Hi [Name],

Your wishlist item is back.

Classic Fit Tee Pack (Pack of 3) is now available in your size.

- Premium cotton
- Free delivery
- 7-day easy return

Price: Rs.899 (was Rs.1,199)

Order here: [link]

Reply STOP to unsubscribe.`;

const MOCK_CAPTION = `That "I have nothing to wear" feeling? Solved.

3 tees. Infinite outfits. One solid decision.

Our Classic Fit Pack gives you the basics done right - preshrunk, colorfast, and built to last through 50+ washes. No fading. No shrinking. Just clean, effortless style.

Link in bio to shop. Use code BASICS15 for 15% off your first order.

#D2CFashion #ClassicFits #MensBasics #IndianFashion #WardrobeEssentials #OOTDIndia`;

const QUICK_OUTPUT: Record<string, string> = {
  ad_copy: MOCK_AD_COPY,
  email: MOCK_EMAIL,
  whatsapp: MOCK_WHATSAPP,
  caption: MOCK_CAPTION,
};

export function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: MOCK_RESPONSES.default, ts: "Just now" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, ts: "Just now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getMockResponse(userMsg.content),
      ts: "Just now"
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const runAction = async (actionId: string) => {
    setActiveAction(actionId);
    setActionOutput("");
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setActionOutput(QUICK_OUTPUT[actionId] || "");
    setActionLoading(false);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(actionOutput);
    setCopied(true);
    toast({ type: "success", title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-7 flex gap-5 h-full">
      {/* Chat */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="p-4 border-b border-[#1E2737] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5A0] to-[#3B9EFF] flex items-center justify-center text-[#0A0C0F]">
              <AppIcon name="smart_toy" size={16} strokeWidth={2.4} />
            </div>
            <div>
              <div className="font-syne text-sm font-bold text-[#F0F4FF]">Founder AI</div>
              <div className="text-[10px] text-[#48566E] font-mono">Your D2C growth advisor | Powered by GrowthOS</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                  ? "bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.2)] text-[#F0F4FF]"
                  : "bg-[#151921] border border-[#1E2737] text-[#F0F4FF]"}`}>
                  {msg.role === "assistant" && (
                    <div className="text-[10px] text-[#00E5A0] font-mono mb-1.5">Founder AI</div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-[10px] text-[#48566E] font-mono mt-1.5 text-right">{msg.ts}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#151921] border border-[#1E2737] rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[#1E2737] flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about your business... (e.g. 'Why is my ROAS dropping?')"
              className="flex-1 bg-[#151921] border-[#1E2737] text-[#F0F4FF] placeholder:text-[#48566E]"
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>Send</Button>
          </div>
        </Card>

        {/* Starter prompts */}
        <div className="flex gap-2 flex-wrap">
          {["What's my ROAS?", "How can I reduce CAC?", "Which products should I scale?", "Analyze my Meta campaigns"].map(p => (
            <button key={p} onClick={() => { setInput(p); }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#8A95B0] bg-[#0F1217] border border-[#1E2737] hover:border-[#00E5A0] hover:text-[#00E5A0] transition-all">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
        <Card className="p-4">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Quick AI Actions</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-3">Generate content instantly</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(action => (
              <button key={action.id} onClick={() => runAction(action.id)}
                className={`p-3 rounded-xl text-left transition-all border ${activeAction === action.id ? "bg-[rgba(0,229,160,0.08)] border-[#00E5A0]" : "bg-[#151921] border-[#1E2737] hover:border-[#8A95B0]"}`}>
                <AppIcon name={action.icon} className="mb-2 text-primary" size={20} />
                <div className="text-xs text-[#F0F4FF] font-medium">{action.label}</div>
                <div className="text-[10px] text-[#48566E] font-mono mt-0.5">{action.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {activeAction && (
          <Card className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-syne text-xs font-bold text-[#F0F4FF]">
                {QUICK_ACTIONS.find(a => a.id === activeAction)?.label} Output
              </h3>
              {actionOutput && (
                <button onClick={copyOutput} className="text-[10px] font-mono text-[#00E5A0] hover:text-[#F0F4FF] transition-colors">
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            {actionLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full bg-[#00E5A0] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <pre className="text-xs text-[#8A95B0] whitespace-pre-wrap font-mono leading-relaxed">{actionOutput}</pre>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
