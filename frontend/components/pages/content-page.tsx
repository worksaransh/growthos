"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/shared/app-icon";

interface Tool {
  id: string;
  label: string;
  icon: string;
  desc: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const TOOLS: Tool[] = [
  {
    id: "ad_copy", label: "Ad Copy", icon: "ad_copy", desc: "Meta & Google",
    fields: [
      { key: "product", label: "Product Name", placeholder: "Classic Fit Tee Pack" },
      { key: "benefits", label: "Key Benefits", placeholder: "Premium cotton, colorfast, 3 tees for Rs.899" },
      { key: "audience", label: "Target Audience", placeholder: "Men 25-40, urban India" },
    ]
  },
  {
    id: "email", label: "Email", icon: "email", desc: "Promo template",
    fields: [
      { key: "product", label: "Product / Offer", placeholder: "Summer Sale - 20% off all tees" },
      { key: "benefits", label: "Why they should care", placeholder: "Limited stock, free shipping, best price" },
      { key: "cta", label: "Call to Action", placeholder: "Shop Now" },
    ]
  },
  {
    id: "whatsapp", label: "WhatsApp", icon: "whatsapp", desc: "Broadcast copy",
    fields: [
      { key: "product", label: "Product", placeholder: "Classic Fit Tee" },
      { key: "offer", label: "Offer / Discount", placeholder: "15% off - code SUMMER15" },
    ]
  },
  {
    id: "blog", label: "Blog Post", icon: "blog", desc: "SEO article",
    fields: [
      { key: "topic", label: "Topic", placeholder: "How to build a minimal wardrobe in India" },
      { key: "audience", label: "Target Reader", placeholder: "Urban men who care about style" },
    ]
  },
  {
    id: "caption", label: "IG Caption", icon: "caption", desc: "Instagram",
    fields: [
      { key: "product", label: "Product / Theme", placeholder: "Oversized Hoodie - winter drop" },
      { key: "tone", label: "Tone", placeholder: "Cool, confident, minimalist" },
    ]
  },
  {
    id: "product_desc", label: "Product Desc", icon: "product_desc", desc: "Shopify listing",
    fields: [
      { key: "product", label: "Product Name", placeholder: "Oversized Hoodie - Charcoal" },
      { key: "features", label: "Key Features", placeholder: "400gsm cotton fleece, dropped shoulders, kangaroo pocket" },
    ]
  },
  {
    id: "video_script", label: "Video Script", icon: "video_script", desc: "Reels / TikTok",
    fields: [
      { key: "product", label: "Product", placeholder: "Classic Fit Tee Pack" },
      { key: "hook", label: "Hook angle", placeholder: "Before/after wardrobe transformation" },
    ]
  },
  {
    id: "ugc_hook", label: "UGC Hook", icon: "ugc_hook", desc: "Creator briefs",
    fields: [
      { key: "product", label: "Product", placeholder: "Cargo Pants - Olive" },
      { key: "creator_type", label: "Creator type", placeholder: "Fashion influencer, men 20-35" },
    ]
  },
];

const MOCK_OUTPUTS: Record<string, string> = {
  ad_copy: `Hook: "I threw out my entire wardrobe for this"

Primary Text:
3 tees. Infinite outfits. Zero regrets.

After testing 40+ basics brands, we obsessed over one thing: cotton that actually lasts. Our Classic Fit Pack is preshrunk, colorfast, and built for Indian summers.

- 3 premium tees in our bestselling colors
- Free shipping on every order
- 7-day easy returns, no questions asked

40,000+ happy customers can't be wrong.

Headline: Premium Basics Done Right
Description: 3 Classic Fit Tees | Free shipping | Starting at Rs.899`,

  email: `Subject line: Your summer wardrobe upgrade is here

Preheader: For the next 48 hours only - 20% off everything

Hi [First Name],

Summer is here and your wardrobe needs one thing: basics that actually work.

Our [Product] is designed for one purpose - to look great without trying. Premium cotton. Perfect fit. Seriously affordable.

Here's what you're getting:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

For the next 48 hours, use code SUMMER20 for 20% off your order.

[Shop Now]

Sold out last time in under 3 days. Don't wait.

Stay stylish,
The Team`,

  whatsapp: `Hi [Name],

Quick update from [Brand].

Your favourite [Product] now has a special offer - 15% off with code SUMMER15. Only valid for the next 24 hours.

- [Benefit 1]
- Free delivery above Rs.499
- Easy returns

Order here: [link]

Reply STOP to opt out.`,

  blog: `# How to Build a Minimal Wardrobe in India (That Actually Works)

Most Indian men have 30+ pieces of clothing but nothing to wear. Here's the fix.

## The Problem with "Lots of Clothes"

Buying more rarely solves the wardrobe problem. The answer is buying *better* - fewer pieces that work harder.

## The Indian Minimal Wardrobe Formula

### The Basics (Must-haves)
- 5-6 quality basic tees (white, grey, black, navy, olive)
- 2-3 chinos (khaki, navy, olive)
- 1 great pair of dark denim
- 1 linen shirt (white or light blue)

### Why Quality Basics Beat Fast Fashion
Quality basics in India need to survive 40C summers, 95% humidity monsoons, and 50+ washes. Cheap basics shrink, fade, and pill. Premium basics get better with wear.

## Where to Start

The single best investment for your minimal wardrobe: a pack of premium classic fit tees. When the basics are right, everything else falls into place.

*The goal isn't an empty wardrobe - it's a wardrobe where every piece earns its place.*`,

  caption: `That "I have nothing to wear" feeling? Solved.

Built for the guy who wants to look put-together without overthinking it.

Our [Product] is the definition of effortless - [key feature], [key feature], and [key feature]. Dressed up or kept simple, it works every time.

Link in bio.

#MensFashion #MinimalStyle #IndianMensFashion #OOTD #BasicsDoneRight #WardrobeEssentials`,

  product_desc: `**The only [product type] you'll need this season.**

We spent 8 months developing this. We tested 12 different cotton blends, 6 different weights, and 4 different constructions before we landed on what you're looking at now.

**What makes it different:**
- [Feature 1] - [brief explanation]
- [Feature 2] - [brief explanation]
- [Feature 3] - [brief explanation]

**The specs:**
Material: [material details]
Fit: [fit description]
Care: [care instructions]

**Our promise:** If it doesn't live up to the description, we'll sort it. No forms, no back-and-forth - just reach out.

Size up if you're between sizes.`,

  video_script: `[HOOK - 0:00-0:03]
*Close up on a pile of clothes*
"I had 40 pieces of clothing and nothing to wear."
*Swipe away the pile*

[PROBLEM - 0:03-0:08]
"Every morning: open wardrobe, stare, get frustrated. Sound familiar?"
*Show relatable wardrobe chaos*

[SOLUTION - 0:08-0:18]
"Then I tried [Product] and it changed everything."
*Show unboxing / product reveal*
"[Key benefit 1]. [Key benefit 2]. [Key benefit 3]."
*Show product in use / outfit*

[SOCIAL PROOF - 0:18-0:22]
"40,000 people switched. Here's why:"
*Quick montage of product shots / testimonials*

[CTA - 0:22-0:30]
"Link in bio - [Offer if applicable]"
*End card with product + logo*`,

  ugc_hook: `**Creator Brief - [Product]**

**Hook options to test:**
1. "I stopped buying [common alternative] after trying this"
2. "POV: You finally found basics worth buying"
3. "Rating every basic tee I own (spoiler: only one survived)"

**Key messages to land:**
- [Product benefit 1] (demonstrate, don't just say it)
- [Product benefit 2] (show real use, not studio)
- Price point / value (casual mention, not salesy)

**Deliverables:** 1x Reel (15-30s), raw footage, 3 static options

**Tone:** Authentic, conversational, not scripted-sounding

**What NOT to do:** Don't read off benefits like an ad. Just react naturally.`,
};

interface HistoryItem {
  id: string;
  tool: string;
  preview: string;
  ts: string;
}

export function ContentPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const tool = TOOLS.find(t => t.id === activeTool);

  const selectTool = (id: string) => {
    setActiveTool(id);
    setOutput("");
    setFields({});
  };

  const generate = async () => {
    if (!activeTool) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    const out = MOCK_OUTPUTS[activeTool] || "Content generated successfully. Here is your AI-crafted copy based on the inputs provided. Edit as needed for your brand voice.";
    setOutput(out);
    setGenerating(false);
    setHistory(prev => [{
      id: Date.now().toString(),
      tool: tool?.label || activeTool,
      preview: out.slice(0, 60) + "...",
      ts: "Just now"
    }, ...prev.slice(0, 4)]);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ type: "success", title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Tool Grid */}
      <div>
        <h2 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Content AI</h2>
        <p className="text-[11px] text-[#48566E] font-mono mb-4">Select a tool to generate content instantly</p>
        <div className="grid grid-cols-8 gap-2">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => selectTool(t.id)}
              className={`p-3 rounded-xl text-left transition-all border ${activeTool === t.id ? "bg-[rgba(0,229,160,0.08)] border-[#00E5A0]" : "bg-[#0F1217] border-[#1E2737] hover:border-[#8A95B0]"}`}>
              <AppIcon name={t.icon} className="mb-2 text-primary" size={20} />
              <div className="text-[11px] text-[#F0F4FF] font-medium">{t.label}</div>
              <div className="text-[10px] text-[#48566E] font-mono">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {tool && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          {/* Form */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <AppIcon name={tool.icon} className="text-primary" size={20} />
              <div>
                <div className="font-syne text-sm font-bold text-[#F0F4FF]">{tool.label}</div>
                <div className="text-[10px] text-[#48566E] font-mono">{tool.desc}</div>
              </div>
            </div>
            {tool.fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">{f.label}</label>
                <Input
                  value={fields[f.key] || ""}
                  onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="bg-[#151921] border-[#1E2737] text-[#F0F4FF] placeholder:text-[#48566E]"
                />
              </div>
            ))}
            <Button onClick={generate} disabled={generating} className="mt-1">
              {generating ? (
                "Generating..."
              ) : (
                <>
                  <AppIcon name="auto_awesome" size={16} />
                  Generate
                </>
              )}
            </Button>
          </Card>

          {/* Output */}
          <Card className="p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Output</h3>
              {output && (
                <button onClick={copy} className="text-[10px] font-mono text-[#00E5A0] hover:text-[#F0F4FF] transition-colors">
                  {copied ? "Copied!" : "Copy all"}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {generating ? (
                <div className="flex items-center gap-3 py-8">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 rounded-full bg-[#00E5A0] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-[#48566E] font-mono">Generating your content...</span>
                </div>
              ) : output ? (
                <pre className="text-sm text-[#8A95B0] whitespace-pre-wrap font-mono leading-relaxed">{output}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <AppIcon name={tool.icon} className="mb-3 text-primary" size={34} />
                  <div className="text-sm text-[#48566E] font-mono">Fill in the form and click Generate</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-3">Recent Generations</h3>
          <div className="flex flex-col gap-1.5">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-[#151921] hover:bg-[#1C2230] transition-colors">
                <div>
                  <div className="text-xs text-[#F0F4FF] font-medium">{h.tool}</div>
                  <div className="text-[10px] text-[#48566E] font-mono mt-0.5">{h.preview}</div>
                </div>
                <span className="text-[10px] text-[#48566E] font-mono">{h.ts}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
