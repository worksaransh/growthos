"use client";

import { useState } from "react";

export function WhiteLabelPage() {
  const [brandName, setBrandName] = useState("LuxorOS");
  const [primaryColor, setPrimaryColor] = useState("#3B9EFF");
  const [customDomain, setCustomDomain] = useState("analytics.luxoroffice.com");
  const [senderName, setSenderName] = useState("LuxorOS Reports");
  const [fromEmail, setFromEmail] = useState("reports@luxoroffice.com");
  const [removeBranding, setRemoveBranding] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-7 flex flex-col gap-6">
      <div>
        <h2 className="font-syne text-base font-bold text-on-surface">White Label</h2>
        <p className="text-xs text-on-surface-variant font-mono mt-0.5">Customize branding for your enterprise deployment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Live preview */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <h3 className="font-syne font-bold text-on-surface text-sm">Live Preview</h3>
          <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant" style={{ minHeight: 360 }}>
            <div className="flex h-full" style={{ minHeight: 360 }}>
              <div className="w-48 bg-surface-container-high flex flex-col p-4 gap-4 border-r border-outline-variant">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>
                    {brandName.charAt(0)}
                  </div>
                  <span className="font-syne font-bold text-on-surface text-sm">{brandName}</span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {["Dashboard", "Revenue", "Ads", "Products", "Reports"].map((item, i) => (
                    <div key={item} className={`text-xs px-3 py-2 rounded-lg font-mono transition-colors ${i === 0 ? "text-white" : "text-on-surface-variant hover:text-on-surface"}`} style={i === 0 ? { backgroundColor: primaryColor } : {}}>
                      {item}
                    </div>
                  ))}
                </div>
                {!removeBranding && (
                  <div className="mt-auto text-[9px] text-on-surface-variant font-mono opacity-50">Powered by GrowthOS</div>
                )}
              </div>
              <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="text-sm font-syne font-bold text-on-surface">Dashboard</div>
                <div className="grid grid-cols-2 gap-2">
                  {["Revenue", "Orders", "ROAS", "Profit"].map((k) => (
                    <div key={k} className="bg-surface-container-high rounded-lg p-3">
                      <div className="text-[9px] font-mono text-on-surface-variant uppercase">{k}</div>
                      <div className="text-xs font-bold text-on-surface mt-1" style={{ color: primaryColor }}>—</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings form */}
        <div className="glass-card p-5 flex flex-col gap-5">
          <h3 className="font-syne font-bold text-on-surface text-sm">Brand Settings</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Brand Name</label>
            <input className="input-base" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Logo</label>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <div className="text-on-surface-variant text-xs">Click or drag logo here</div>
              <div className="text-[10px] text-on-surface-variant font-mono mt-1">PNG, SVG · Max 2MB · Recommended 200×50px</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer bg-transparent" />
              <input className="input-base flex-1 font-mono" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#3B9EFF" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Custom Domain</label>
            <input className="input-base font-mono" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="analytics.mybrand.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Sender Name</label>
              <input className="input-base" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">From Address</label>
              <input className="input-base" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <div>
              <div className="text-sm text-on-surface font-medium">Remove GrowthOS Branding</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-xs text-on-surface-variant">Hide "Powered by GrowthOS" footer</div>
                <span className="badge-secondary text-[9px]">Enterprise only</span>
              </div>
            </div>
            <button
              onClick={() => setRemoveBranding((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${removeBranding ? "bg-primary" : "bg-surface-container"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${removeBranding ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="primary-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            {saved ? "Saved!" : "Save White Label Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
