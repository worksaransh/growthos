"use client";

import { useState, useEffect, useCallback } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Card } from "@/components/ui/card";

type PlatformStatus = { connected: boolean; [key: string]: unknown };
type Credentials = { shopify: PlatformStatus; meta: PlatformStatus; google: PlatformStatus };
type SaveState = "idle" | "saving" | "saved" | "error";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...opts, credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
      connected ? "bg-[#00E5A018] text-[#00E5A0]" : "bg-[#FF5B6B18] text-[#FF5B6B]"
    }`}>{connected ? "● LIVE" : "○ OFFLINE"}</span>
  );
}

function Field({ label, hint, value, onChange, type = "text", placeholder, required }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono text-[#8A95B0] flex items-center gap-1">
        {label}{required && <span className="text-[#00E5A0]">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2.5 text-[13px] font-mono text-[#F0F4FF] placeholder:text-[#48566E] focus:outline-none focus:border-[#00E5A040] transition-colors pr-16"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48566E] hover:text-[#8A95B0] text-[10px] font-mono">
            {show ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-[#48566E]">{hint}</p>}
    </div>
  );
}

function SaveBtn({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={state === "saving"}
      className={`px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold transition-all ${
        state === "saved" ? "bg-[#00E5A020] text-[#00E5A0] border border-[#00E5A040]"
        : state === "error" ? "bg-[#FF5B6B20] text-[#FF5B6B] border border-[#FF5B6B40]"
        : "bg-[#00E5A0] text-[#0A0C0F] hover:bg-[#00CC8E]"
      }`}>
      {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : state === "error" ? "Error" : "Save Credentials"}
    </button>
  );
}

function Steps({ items, docsUrl, docsLabel }: { items: string[]; docsUrl: string; docsLabel: string }) {
  return (
    <div className="bg-[#0D1117] rounded-xl p-4 mb-5 text-[11px] font-mono text-[#48566E] space-y-1">
      <p className="text-[#8A95B0] font-bold mb-2">Setup steps:</p>
      {items.map((s, i) => <p key={i}>{s}</p>)}
      <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-[#00E5A0] hover:underline block mt-2">{docsLabel} ↗</a>
    </div>
  );
}

// ── Shopify ───────────────────────────────────────────────────────────────────
function ShopifyPanel({ initial, onRefresh }: { initial: PlatformStatus; onRefresh: () => void }) {
  const [storeUrl, setStoreUrl] = useState((initial.store_url as string) ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [oLoading, setOLoading] = useState(false);

  const save = async () => {
    if (!storeUrl) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/shopify", {
        method: "POST", body: JSON.stringify({ shopify_store_url: storeUrl,
          shopify_access_token: accessToken || undefined,
          shopify_api_key: apiKey || undefined,
          shopify_api_secret: apiSecret || undefined }),
      });
      setState("saved"); setTimeout(() => { setState("idle"); onRefresh(); }, 2000);
    } catch { setState("error"); setTimeout(() => setState("idle"), 3000); }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = await apiFetch("/api/v1/integrations/shopify/connect", {
        method: "POST", body: JSON.stringify({ store_url: storeUrl }) });
      window.location.href = d.auth_url;
    } catch (e: unknown) { alert((e as Error).message); setOLoading(false); }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Shopify? Historical data will remain.")) return;
    await apiFetch("/api/v1/settings/api-keys/shopify", { method: "DELETE" }); onRefresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00E5A018] text-[#00E5A0]">
            <AppIcon name="shopify" size={21} />
          </div>
          <div>
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Shopify</h3>
            <p className="text-[11px] font-mono text-[#48566E] mt-0.5">{initial.connected ? "Connected & Active" : "Not connected"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={initial.connected} />
          {initial.connected && <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#FF5B6B] border border-[#FF5B6B30] hover:bg-[#FF5B6B10]">Disconnect</button>}
        </div>
      </div>
      <Steps
        items={["1. Shopify Admin → Settings → Apps → Develop apps","2. Create app → configure Admin API scopes (orders, products, customers)","3. Install → copy the Admin API Access Token","4. Paste the token below and click Save"]}
        docsUrl="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
        docsLabel="Shopify Custom Apps docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="STORE URL" value={storeUrl} onChange={setStoreUrl}
            placeholder="mybrand.myshopify.com"
            hint="Your Shopify store domain" required />
        </div>
        <Field label="ADMIN API ACCESS TOKEN" type="password" value={accessToken} onChange={setAccessToken}
          placeholder="shpat_••••••••••••••••"
          hint="From: Apps → Develop apps → API credentials" />
        <div className="grid gap-3">
          <Field label="API KEY (OAuth only)" value={apiKey} onChange={setApiKey} placeholder="Optional — for OAuth flow" />
          <Field label="API SECRET (OAuth only)" type="password" value={apiSecret} onChange={setApiSecret} placeholder="Optional — for OAuth flow" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        {storeUrl && (
          <button onClick={startOAuth} disabled={oLoading}
            className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#151921] border border-[#1E2737] text-[#F0F4FF] hover:border-[#00E5A040] transition-all">
            {oLoading ? "Redirecting..." : "OAuth Connect"}
          </button>
        )}
        <span className="text-[10px] text-[#48566E] ml-auto">Scopes: read_orders, read_products, read_customers, write_price_rules</span>
      </div>
    </Card>
  );
}

// ── Meta Ads ──────────────────────────────────────────────────────────────────
function MetaPanel({ initial, onRefresh }: { initial: PlatformStatus; onRefresh: () => void }) {
  const [appId, setAppId] = useState((initial.app_id as string) ?? "");
  const [appSecret, setAppSecret] = useState("");
  const [pixelId, setPixelId] = useState((initial.pixel_id as string) ?? "");
  const [adAccountId, setAdAccountId] = useState((initial.ad_account_id as string) ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const [oLoading, setOLoading] = useState(false);

  const save = async () => {
    if (!appId) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/meta", {
        method: "POST", body: JSON.stringify({ meta_app_id: appId,
          meta_app_secret: appSecret || "placeholder",
          meta_pixel_id: pixelId || undefined,
          meta_ad_account_id: adAccountId || undefined }),
      });
      setState("saved"); setTimeout(() => { setState("idle"); onRefresh(); }, 2000);
    } catch { setState("error"); setTimeout(() => setState("idle"), 3000); }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = await apiFetch("/api/v1/integrations/meta/connect", { method: "POST" });
      window.location.href = d.auth_url;
    } catch (e: unknown) { alert((e as Error).message); setOLoading(false); }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Meta Ads? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/meta", { method: "DELETE" }); onRefresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1877F218] text-[#1877F2]">
            <AppIcon name="meta" size={21} />
          </div>
          <div>
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Meta Ads (Facebook / Instagram)</h3>
            <p className="text-[11px] font-mono text-[#48566E] mt-0.5">{initial.connected ? "Connected & Active" : "Not connected"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={initial.connected} />
          {initial.connected && <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#FF5B6B] border border-[#FF5B6B30] hover:bg-[#FF5B6B10]">Disconnect</button>}
        </div>
      </div>
      <Steps
        items={["1. developers.facebook.com → My Apps → Create App (Business type)","2. Add Marketing API product","3. Copy App ID & App Secret from App Settings → Basic","4. Enter Ad Account ID (act_XXXXXXXXXX) from Ads Manager"]}
        docsUrl="https://developers.facebook.com/docs/marketing-api/get-started"
        docsLabel="Meta Marketing API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="APP ID" value={appId} onChange={setAppId} placeholder="1234567890"
          hint="App Settings → Basic → App ID" required />
        <Field label="APP SECRET" type="password" value={appSecret} onChange={setAppSecret}
          placeholder="Leave blank to keep existing" hint="App Settings → Basic → App Secret" />
        <Field label="AD ACCOUNT ID" value={adAccountId} onChange={setAdAccountId}
          placeholder="act_123456789" hint="Meta Ads Manager → top-left account selector" />
        <Field label="PIXEL ID" value={pixelId} onChange={setPixelId}
          placeholder="1234567890" hint="Events Manager → your pixel → Settings" />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <button onClick={startOAuth} disabled={oLoading}
          className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#1877F215] border border-[#1877F230] text-[#5899F5] hover:bg-[#1877F225] transition-all">
          {oLoading ? "Redirecting..." : "OAuth Connect to Meta"}
        </button>
        <span className="text-[10px] text-[#48566E] ml-auto">Scopes: ads_read, ads_management, read_insights</span>
      </div>
    </Card>
  );
}

// ── Google Ads ────────────────────────────────────────────────────────────────
function GooglePanel({ initial, onRefresh }: { initial: PlatformStatus; onRefresh: () => void }) {
  const [clientId, setClientId] = useState((initial.client_id as string) ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [devToken, setDevToken] = useState("");
  const [customerId, setCustomerId] = useState((initial.customer_id as string) ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const [oLoading, setOLoading] = useState(false);

  const save = async () => {
    if (!clientId || !devToken) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/google", {
        method: "POST", body: JSON.stringify({ google_client_id: clientId,
          google_client_secret: clientSecret || undefined,
          google_developer_token: devToken,
          google_customer_id: customerId || undefined }),
      });
      setState("saved"); setTimeout(() => { setState("idle"); onRefresh(); }, 2000);
    } catch { setState("error"); setTimeout(() => setState("idle"), 3000); }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = await apiFetch("/api/v1/integrations/google/connect", { method: "POST" });
      window.location.href = d.auth_url;
    } catch (e: unknown) { alert((e as Error).message); setOLoading(false); }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Ads? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/google", { method: "DELETE" }); onRefresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FFAD3B18] text-[#FFAD3B]">
            <AppIcon name="google" size={21} />
          </div>
          <div>
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Google Ads</h3>
            <p className="text-[11px] font-mono text-[#48566E] mt-0.5">{initial.connected ? "Connected & Active" : "Not connected"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={initial.connected} />
          {initial.connected && <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#FF5B6B] border border-[#FF5B6B30] hover:bg-[#FF5B6B10]">Disconnect</button>}
        </div>
      </div>
      <Steps
        items={["1. Enable Google Ads API at console.cloud.google.com → APIs & Services","2. Create OAuth 2.0 credentials → Web Application","3. Apply for Developer Token: Google Ads → Tools → API Center","4. Save credentials → click OAuth Connect to authorize"]}
        docsUrl="https://developers.google.com/google-ads/api/docs/get-started/introduction"
        docsLabel="Google Ads API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="CLIENT ID" value={clientId} onChange={setClientId}
          placeholder="123456789-abc.apps.googleusercontent.com"
          hint="Google Cloud Console → Credentials → OAuth 2.0" required />
        <Field label="CLIENT SECRET" type="password" value={clientSecret} onChange={setClientSecret}
          placeholder="Leave blank to keep existing"
          hint="Google Cloud Console → Credentials → OAuth 2.0" />
        <Field label="DEVELOPER TOKEN" type="password" value={devToken} onChange={setDevToken}
          placeholder="Your developer token"
          hint="Google Ads → Tools & Settings → API Center" required />
        <Field label="CUSTOMER ID" value={customerId} onChange={setCustomerId}
          placeholder="123-456-7890"
          hint="Your Google Ads account ID (dashes optional)" />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <button onClick={startOAuth} disabled={oLoading}
          className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#FFAD3B15] border border-[#FFAD3B30] text-[#FFAD3B] hover:bg-[#FFAD3B25] transition-all">
          {oLoading ? "Redirecting..." : "OAuth Connect to Google"}
        </button>
        <span className="text-[10px] text-[#48566E] ml-auto">Scope: https://www.googleapis.com/auth/adwords</span>
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreds = useCallback(async () => {
    try {
      setCreds(await apiFetch("/api/v1/settings/api-keys"));
    } catch {
      setCreds({ shopify: { connected: false }, meta: { connected: false }, google: { connected: false } });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCreds(); }, [fetchCreds]);

  if (loading) return (
    <div className="p-7 flex items-center justify-center h-64">
      <span className="text-[#48566E] font-mono text-sm animate-pulse">Loading integrations...</span>
    </div>
  );

  const s = creds!;
  return (
    <div className="p-7 flex flex-col gap-5 max-w-4xl">
      <div>
        <h2 className="font-syne text-lg font-bold text-[#F0F4FF]">Integrations & API Keys</h2>
        <p className="text-sm text-[#8A95B0] mt-1">Connect your ad platforms and ecommerce store. All credentials are stored securely per workspace.</p>
      </div>

      <ShopifyPanel initial={s.shopify} onRefresh={fetchCreds} />
      <MetaPanel    initial={s.meta}    onRefresh={fetchCreds} />
      <GooglePanel  initial={s.google}  onRefresh={fetchCreds} />

      <Card className="p-5">
        <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">More Integrations Coming Soon</h3>
        <p className="text-xs text-[#8A95B0] mb-4">Vote for what you need next</p>
        <div className="flex flex-wrap gap-2">
          {["Amazon Ads","Flipkart","Razorpay","WooCommerce","TikTok Ads","Snapchat Ads","Bing Ads","Klaviyo"].map(p => (
            <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#151921] border border-[#1E2737] text-[#48566E] flex items-center gap-1.5">
              {p}<span className="text-[9px] bg-[#1E2737] px-1 rounded">SOON</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
