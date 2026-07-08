"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────
type PlatformStatus = { connected: boolean; [key: string]: unknown };
type SaveState = "idle" | "saving" | "saved" | "error";
type Category = "all" | "ecommerce" | "advertising" | "payments" | "marketing" | "shipping";

interface Credentials {
  shopify: PlatformStatus;
  meta: PlatformStatus;
  google: PlatformStatus;
  razorpay: PlatformStatus;
  whatsapp: PlatformStatus;
  klaviyo: PlatformStatus;
  shiprocket: PlatformStatus;
  woocommerce: PlatformStatus;
}

// ── API helper ────────────────────────────────────────────────────────────────
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
async function apiFetch(path: string, opts?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Shared UI components ──────────────────────────────────────────────────────
function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
        connected
          ? "bg-[#00E5A018] text-[#00E5A0]"
          : "bg-[#FF5B6B18] text-[#FF5B6B]"
      }`}
    >
      {connected ? "● LIVE" : "○ OFFLINE"}
    </span>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono text-[#8A95B0] flex items-center gap-1">
        {label}
        {required && <span className="text-[#00E5A0]">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2.5 text-[13px] font-mono text-[#F0F4FF] placeholder:text-[#48566E] focus:outline-none focus:border-[#00E5A040] transition-colors pr-16"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48566E] hover:text-[#8A95B0] text-[10px] font-mono"
          >
            {show ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-[#48566E]">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono text-[#8A95B0] flex items-center gap-1">
        {label}
        {required && <span className="text-[#00E5A0]">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2.5 text-[13px] font-mono text-[#F0F4FF] focus:outline-none focus:border-[#00E5A040] transition-colors appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[10px] text-[#48566E]">{hint}</p>}
    </div>
  );
}

function SaveBtn({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={state === "saving"}
      className={`px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold transition-all ${
        state === "saved"
          ? "bg-[#00E5A020] text-[#00E5A0] border border-[#00E5A040]"
          : state === "error"
          ? "bg-[#FF5B6B20] text-[#FF5B6B] border border-[#FF5B6B40]"
          : "bg-[#00E5A0] text-[#0A0C0F] hover:bg-[#00CC8E]"
      }`}
    >
      {state === "saving"
        ? "Saving..."
        : state === "saved"
        ? "Saved"
        : state === "error"
        ? "Error"
        : "Save Credentials"}
    </button>
  );
}

function Steps({
  items,
  docsUrl,
  docsLabel,
}: {
  items: string[];
  docsUrl: string;
  docsLabel: string;
}) {
  return (
    <div className="bg-[#0D1117] rounded-xl p-4 mb-5 text-[11px] font-mono text-[#48566E] space-y-1">
      <p className="text-[#8A95B0] font-bold mb-2">Setup steps:</p>
      {items.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00E5A0] hover:underline block mt-2"
      >
        {docsLabel} ↗
      </a>
    </div>
  );
}

function PlatformHeader({
  iconBg,
  iconColor,
  iconLetter,
  name,
  connected,
  onDisconnect,
}: {
  iconBg: string;
  iconColor: string;
  iconLetter: string;
  name: string;
  connected: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-syne font-bold text-sm"
          style={{ background: iconBg, color: iconColor }}
        >
          {iconLetter}
        </div>
        <div>
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">{name}</h3>
          <p className="text-[11px] font-mono text-[#48566E] mt-0.5">
            {connected ? "Connected & Active" : "Not connected"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge connected={connected} />
        {connected && (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#FF5B6B] border border-[#FF5B6B30] hover:bg-[#FF5B6B10]"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

function ComingSoonCard({
  iconBg,
  iconColor,
  iconLetter,
  name,
  description,
}: {
  iconBg: string;
  iconColor: string;
  iconLetter: string;
  name: string;
  description: string;
}) {
  return (
    <Card className="p-5 opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-syne font-bold text-sm grayscale"
            style={{ background: iconBg, color: iconColor }}
          >
            {iconLetter}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-syne text-sm font-bold text-[#8A95B0]">{name}</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1E2737] text-[#48566E] tracking-widest">
                SOON
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#48566E] mt-0.5">{description}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-[11px] font-mono font-bold text-[#48566E] tracking-widest uppercase">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#1E2737]" />
    </div>
  );
}

// ── Platform Panels ───────────────────────────────────────────────────────────

// Shopify
function ShopifyPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [storeUrl, setStoreUrl] = useState(
    (initial.store_url as string) ?? "yourstore.myshopify.com"
  );
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
        method: "POST",
        body: JSON.stringify({
          shopify_store_url: storeUrl,
          shopify_access_token: accessToken || undefined,
          shopify_api_key: apiKey || undefined,
          shopify_api_secret: apiSecret || undefined,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = (await apiFetch("/api/v1/integrations/shopify/connect", {
        method: "POST",
        body: JSON.stringify({ store_url: storeUrl }),
      })) as { auth_url: string };
      window.location.href = d.auth_url;
    } catch (e: unknown) {
      alert((e as Error).message);
      setOLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Shopify? Historical data will remain.")) return;
    await apiFetch("/api/v1/settings/api-keys/shopify", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#00E5A018"
        iconColor="#00E5A0"
        iconLetter="S"
        name="Shopify"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Shopify Admin → Settings → Apps → Develop apps",
          "2. Create app → configure Admin API scopes (orders, products, customers)",
          "3. Install → copy the Admin API Access Token",
          "4. Paste the token below and click Save",
        ]}
        docsUrl="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
        docsLabel="Shopify Custom Apps docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field
            label="STORE URL"
            value={storeUrl}
            onChange={setStoreUrl}
            placeholder="mybrand.myshopify.com"
            hint="Your Shopify store domain"
            required
          />
        </div>
        <Field
          label="ADMIN API ACCESS TOKEN"
          type="password"
          value={accessToken}
          onChange={setAccessToken}
          placeholder="shpat_••••••••••••••••"
          hint="From: Apps → Develop apps → API credentials"
        />
        <div className="grid gap-3">
          <Field
            label="API KEY (OAuth only)"
            value={apiKey}
            onChange={setApiKey}
            placeholder="Optional — for OAuth flow"
          />
          <Field
            label="API SECRET (OAuth only)"
            type="password"
            value={apiSecret}
            onChange={setApiSecret}
            placeholder="Optional — for OAuth flow"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        {storeUrl && (
          <button
            onClick={startOAuth}
            disabled={oLoading}
            className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#151921] border border-[#1E2737] text-[#F0F4FF] hover:border-[#00E5A040] transition-all"
          >
            {oLoading ? "Redirecting..." : "OAuth Connect"}
          </button>
        )}
        <span className="text-[10px] text-[#48566E] ml-auto">
          Scopes: read_orders, read_products, read_customers, write_price_rules
        </span>
      </div>
    </Card>
  );
}

// WooCommerce
function WooCommercePanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [siteUrl, setSiteUrl] = useState((initial.site_url as string) ?? "");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    if (!siteUrl || !consumerKey || !consumerSecret) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/woocommerce/connect", {
        method: "POST",
        body: JSON.stringify({
          site_url: siteUrl,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect WooCommerce? Historical data will remain.")) return;
    await apiFetch("/api/v1/woocommerce/disconnect", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#7F54B318"
        iconColor="#7F54B3"
        iconLetter="W"
        name="WooCommerce"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. WooCommerce → Settings → Advanced → REST API",
          "2. Add Key → set permissions to Read/Write",
          "3. Copy Consumer Key and Consumer Secret",
          "4. Enter your site URL and keys below",
        ]}
        docsUrl="https://woocommerce.github.io/woocommerce-rest-api-docs/"
        docsLabel="WooCommerce REST API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field
            label="SITE URL"
            value={siteUrl}
            onChange={setSiteUrl}
            placeholder="mystore.com"
            hint="Your WooCommerce store domain"
            required
          />
        </div>
        <Field
          label="CONSUMER KEY"
          type="password"
          value={consumerKey}
          onChange={setConsumerKey}
          placeholder="ck_••••••••••••••••"
          hint="WooCommerce → Settings → Advanced → REST API"
          required
        />
        <Field
          label="CONSUMER SECRET"
          type="password"
          value={consumerSecret}
          onChange={setConsumerSecret}
          placeholder="cs_••••••••••••••••"
          hint="Generated alongside Consumer Key"
          required
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <span className="text-[10px] text-[#48566E] ml-auto">
          Permissions: Read/Write
        </span>
      </div>
    </Card>
  );
}

// Meta Ads
function MetaPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [appId, setAppId] = useState((initial.app_id as string) ?? "");
  const [appSecret, setAppSecret] = useState("");
  const [adAccountId, setAdAccountId] = useState(
    (initial.ad_account_id as string) ?? ""
  );
  const [pixelId, setPixelId] = useState((initial.pixel_id as string) ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const [oLoading, setOLoading] = useState(false);

  const save = async () => {
    if (!appId) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/meta", {
        method: "POST",
        body: JSON.stringify({
          meta_app_id: appId,
          meta_app_secret: appSecret || undefined,
          meta_pixel_id: pixelId || undefined,
          meta_ad_account_id: adAccountId || undefined,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = (await apiFetch("/api/v1/integrations/meta/connect", {
        method: "POST",
      })) as { auth_url: string };
      window.location.href = d.auth_url;
    } catch (e: unknown) {
      alert((e as Error).message);
      setOLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Meta Ads? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/meta", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#1877F218"
        iconColor="#1877F2"
        iconLetter="M"
        name="Meta Ads (Facebook / Instagram)"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. developers.facebook.com → My Apps → Create App (Business type)",
          "2. Add Marketing API product",
          "3. Copy App ID & App Secret from App Settings → Basic",
          "4. Enter Ad Account ID (act_XXXXXXXXXX) from Ads Manager",
        ]}
        docsUrl="https://developers.facebook.com/docs/marketing-api/get-started"
        docsLabel="Meta Marketing API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="APP ID"
          value={appId}
          onChange={setAppId}
          placeholder="1234567890"
          hint="App Settings → Basic → App ID"
          required
        />
        <Field
          label="APP SECRET"
          type="password"
          value={appSecret}
          onChange={setAppSecret}
          placeholder="Leave blank to keep existing"
          hint="App Settings → Basic → App Secret"
        />
        <Field
          label="AD ACCOUNT ID"
          value={adAccountId}
          onChange={setAdAccountId}
          placeholder="act_123456789"
          hint="Meta Ads Manager → top-left account selector"
        />
        <Field
          label="PIXEL ID"
          value={pixelId}
          onChange={setPixelId}
          placeholder="1234567890"
          hint="Events Manager → your pixel → Settings"
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <button
          onClick={startOAuth}
          disabled={oLoading}
          className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#1877F215] border border-[#1877F230] text-[#5899F5] hover:bg-[#1877F225] transition-all"
        >
          {oLoading ? "Redirecting..." : "OAuth Connect to Meta"}
        </button>
        <span className="text-[10px] text-[#48566E] ml-auto">
          Scopes: ads_read, ads_management, read_insights
        </span>
      </div>
    </Card>
  );
}

// Google Ads
function GooglePanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [clientId, setClientId] = useState(
    (initial.client_id as string) ?? ""
  );
  const [clientSecret, setClientSecret] = useState("");
  const [devToken, setDevToken] = useState("");
  const [customerId, setCustomerId] = useState(
    (initial.customer_id as string) ?? ""
  );
  const [state, setState] = useState<SaveState>("idle");
  const [oLoading, setOLoading] = useState(false);

  const save = async () => {
    if (!clientId || !devToken) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/google", {
        method: "POST",
        body: JSON.stringify({
          google_client_id: clientId,
          google_client_secret: clientSecret || undefined,
          google_developer_token: devToken,
          google_customer_id: customerId || undefined,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const startOAuth = async () => {
    setOLoading(true);
    try {
      const d = (await apiFetch("/api/v1/integrations/google/connect", {
        method: "POST",
      })) as { auth_url: string };
      window.location.href = d.auth_url;
    } catch (e: unknown) {
      alert((e as Error).message);
      setOLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Ads? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/google", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#FFAD3B18"
        iconColor="#FFAD3B"
        iconLetter="G"
        name="Google Ads"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Enable Google Ads API at console.cloud.google.com → APIs & Services",
          "2. Create OAuth 2.0 credentials → Web Application",
          "3. Apply for Developer Token: Google Ads → Tools → API Center",
          "4. Save credentials → click OAuth Connect to authorize",
        ]}
        docsUrl="https://developers.google.com/google-ads/api/docs/get-started/introduction"
        docsLabel="Google Ads API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="CLIENT ID"
          value={clientId}
          onChange={setClientId}
          placeholder="123456789-abc.apps.googleusercontent.com"
          hint="Google Cloud Console → Credentials → OAuth 2.0"
          required
        />
        <Field
          label="CLIENT SECRET"
          type="password"
          value={clientSecret}
          onChange={setClientSecret}
          placeholder="Leave blank to keep existing"
          hint="Google Cloud Console → Credentials → OAuth 2.0"
        />
        <Field
          label="DEVELOPER TOKEN"
          type="password"
          value={devToken}
          onChange={setDevToken}
          placeholder="Your developer token"
          hint="Google Ads → Tools & Settings → API Center"
          required
        />
        <Field
          label="CUSTOMER ID"
          value={customerId}
          onChange={setCustomerId}
          placeholder="123-456-7890"
          hint="Your Google Ads account ID (dashes optional)"
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <button
          onClick={startOAuth}
          disabled={oLoading}
          className="px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold bg-[#FFAD3B15] border border-[#FFAD3B30] text-[#FFAD3B] hover:bg-[#FFAD3B25] transition-all"
        >
          {oLoading ? "Redirecting..." : "OAuth Connect to Google"}
        </button>
        <span className="text-[10px] text-[#48566E] ml-auto">
          Scope: https://www.googleapis.com/auth/adwords
        </span>
      </div>
    </Card>
  );
}

// Razorpay
function RazorpayPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [keyId, setKeyId] = useState((initial.key_id as string) ?? "");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    if (!keyId) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/razorpay", {
        method: "POST",
        body: JSON.stringify({
          razorpay_key_id: keyId,
          razorpay_key_secret: keySecret || undefined,
          razorpay_webhook_secret: webhookSecret || undefined,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Razorpay? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/razorpay", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#072DEA18"
        iconColor="#4F6EF7"
        iconLetter="R"
        name="Razorpay"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Log in to Razorpay Dashboard → Settings → API Keys",
          "2. Generate Live Mode keys (rzp_live_...)",
          "3. For webhooks: Settings → Webhooks → Add New Webhook → copy secret",
          "4. Paste Key ID, Key Secret, and Webhook Secret below",
        ]}
        docsUrl="https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/"
        docsLabel="Razorpay API Keys docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="KEY ID"
          value={keyId}
          onChange={setKeyId}
          placeholder="rzp_live_••••••••••••••••"
          hint="Razorpay Dashboard → Settings → API Keys"
          required
        />
        <Field
          label="KEY SECRET"
          type="password"
          value={keySecret}
          onChange={setKeySecret}
          placeholder="Leave blank to keep existing"
          hint="Generated alongside Key ID"
        />
        <div className="col-span-2">
          <Field
            label="WEBHOOK SECRET"
            type="password"
            value={webhookSecret}
            onChange={setWebhookSecret}
            placeholder="Webhook signing secret"
            hint="Dashboard → Settings → Webhooks → secret for signature verification"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <span className="text-[10px] text-[#48566E] ml-auto">
          Use Live Mode keys for production
        </span>
      </div>
    </Card>
  );
}

// WhatsApp Business
const BSP_OPTIONS = [
  { value: "interakt", label: "Interakt" },
  { value: "wati", label: "Wati" },
  { value: "gupshup", label: "Gupshup" },
  { value: "direct", label: "Direct (Meta Cloud API)" },
];

function WhatsAppPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [phoneNumberId, setPhoneNumberId] = useState(
    (initial.phone_number_id as string) ?? ""
  );
  const [accessToken, setAccessToken] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(
    (initial.webhook_verify_token as string) ?? ""
  );
  const [bsp, setBsp] = useState((initial.bsp as string) ?? "direct");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    if (!phoneNumberId) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          whatsapp_phone_number_id: phoneNumberId,
          whatsapp_access_token: accessToken || undefined,
          whatsapp_webhook_verify_token: webhookVerifyToken || undefined,
          whatsapp_bsp: bsp,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect WhatsApp Business? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/whatsapp", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#25D36618"
        iconColor="#25D366"
        iconLetter="WA"
        name="WhatsApp Business"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Meta for Developers → create a WhatsApp Business app",
          "2. Go to WhatsApp → Getting Started → copy Phone Number ID",
          "3. Generate a Permanent Access Token (System User with admin rights)",
          "4. Set a Webhook Verify Token (any string you choose)",
          "5. Or connect via your BSP: Interakt / Wati / Gupshup",
        ]}
        docsUrl="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
        docsLabel="WhatsApp Cloud API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="PHONE NUMBER ID"
          value={phoneNumberId}
          onChange={setPhoneNumberId}
          placeholder="1234567890123"
          hint="Meta App → WhatsApp → Getting Started → Phone Number ID"
          required
        />
        <Field
          label="ACCESS TOKEN"
          type="password"
          value={accessToken}
          onChange={setAccessToken}
          placeholder="Leave blank to keep existing"
          hint="Permanent system user token from Meta Business Suite"
        />
        <Field
          label="WEBHOOK VERIFY TOKEN"
          value={webhookVerifyToken}
          onChange={setWebhookVerifyToken}
          placeholder="my_secure_verify_token"
          hint="Any string — must match what you set in the Meta webhook config"
        />
        <SelectField
          label="BSP (Business Solution Provider)"
          value={bsp}
          onChange={setBsp}
          options={BSP_OPTIONS}
          hint="Select your WhatsApp BSP or use Direct (Meta Cloud API)"
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <span className="text-[10px] text-[#48566E] ml-auto">
          Messages via Cloud API or BSP
        </span>
      </div>
    </Card>
  );
}

// Klaviyo
function KlaviyoPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [privateKey, setPrivateKey] = useState("");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    if (!privateKey) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/klaviyo/connect", {
        method: "POST",
        body: JSON.stringify({ klaviyo_private_api_key: privateKey }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Klaviyo? Historical data remains.")) return;
    await apiFetch("/api/v1/klaviyo/disconnect", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#000AFF18"
        iconColor="#5B70FF"
        iconLetter="K"
        name="Klaviyo"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Log in to Klaviyo → Account → Settings → API Keys",
          "2. Create a Private API Key with Full Access or specific scopes",
          "3. Copy the key (it starts with pk_) and paste below",
        ]}
        docsUrl="https://help.klaviyo.com/hc/en-us/articles/7423954176283"
        docsLabel="Klaviyo API Keys docs"
      />
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="PRIVATE API KEY"
          type="password"
          value={privateKey}
          onChange={setPrivateKey}
          placeholder="pk_••••••••••••••••"
          hint="Klaviyo → Account → Settings → API Keys → Private API Key"
          required
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <span className="text-[10px] text-[#48566E] ml-auto">
          Scopes: lists, profiles, events, campaigns
        </span>
      </div>
    </Card>
  );
}

// Shiprocket
function ShiprocketPanel({
  initial,
  onRefresh,
}: {
  initial: PlatformStatus;
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState((initial.email as string) ?? "");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    if (!email || !password) return;
    setState("saving");
    try {
      await apiFetch("/api/v1/settings/api-keys/shiprocket", {
        method: "POST",
        body: JSON.stringify({
          shiprocket_email: email,
          shiprocket_password: password,
        }),
      });
      setState("saved");
      setTimeout(() => {
        setState("idle");
        onRefresh();
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Shiprocket? Historical data remains.")) return;
    await apiFetch("/api/v1/settings/api-keys/shiprocket", { method: "DELETE" });
    onRefresh();
  };

  return (
    <Card className="p-6">
      <PlatformHeader
        iconBg="#FF6B3518"
        iconColor="#FF6B35"
        iconLetter="SR"
        name="Shiprocket"
        connected={initial.connected}
        onDisconnect={disconnect}
      />
      <Steps
        items={[
          "1. Create a Shiprocket account at app.shiprocket.in",
          "2. Use your Shiprocket login email and password",
          "3. GrowthOS will generate API tokens automatically on save",
          "4. Tokens are refreshed every 9 days as per Shiprocket policy",
        ]}
        docsUrl="https://apidocs.shiprocket.in/"
        docsLabel="Shiprocket API docs"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="EMAIL"
          value={email}
          onChange={setEmail}
          placeholder="you@yourstore.com"
          hint="Your Shiprocket account email"
          required
        />
        <Field
          label="PASSWORD"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••••••"
          hint="Your Shiprocket account password"
          required
        />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <SaveBtn state={state} onClick={save} />
        <span className="text-[10px] text-[#48566E] ml-auto">
          Token auto-refreshed every 9 days
        </span>
      </div>
    </Card>
  );
}

// ── Category filter tabs ───────────────────────────────────────────────────────
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "advertising", label: "Advertising" },
  { value: "payments", label: "Payments" },
  { value: "marketing", label: "Marketing" },
  { value: "shipping", label: "Shipping" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const fetchCreds = useCallback(async () => {
    try {
      const base = (await apiFetch("/api/v1/settings/api-keys")) as Record<
        string,
        PlatformStatus
      >;
      // Merge in defaults for platforms not yet returned by the endpoint
      setCreds({
        shopify: base.shopify ?? { connected: false },
        meta: base.meta ?? { connected: false },
        google: base.google ?? { connected: false },
        razorpay: base.razorpay ?? { connected: false },
        whatsapp: base.whatsapp ?? { connected: false },
        klaviyo: base.klaviyo ?? { connected: false },
        shiprocket: base.shiprocket ?? { connected: false },
        woocommerce: base.woocommerce ?? { connected: false },
      });
    } catch {
      setCreds({
        shopify: { connected: false },
        meta: { connected: false },
        google: { connected: false },
        razorpay: { connected: false },
        whatsapp: { connected: false },
        klaviyo: { connected: false },
        shiprocket: { connected: false },
        woocommerce: { connected: false },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreds();
  }, [fetchCreds]);

  if (loading) {
    return (
      <div className="p-7 flex items-center justify-center h-64">
        <span className="text-[#48566E] font-mono text-sm animate-pulse">
          Loading integrations...
        </span>
      </div>
    );
  }

  const s = creds!;

  const show = (cat: Category) =>
    activeCategory === "all" || activeCategory === cat;

  return (
    <div className="p-7 flex flex-col gap-5 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="font-syne text-lg font-bold text-[#F0F4FF]">
          Integrations & API Keys
        </h2>
        <p className="text-sm text-[#8A95B0] mt-1">
          Connect your ad platforms, ecommerce store, and marketing tools.
          All credentials are stored securely per workspace.
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-[11px] font-mono font-bold transition-all ${
              activeCategory === cat.value
                ? "bg-[#00E5A0] text-[#0A0C0F]"
                : "bg-[#151921] border border-[#1E2737] text-[#8A95B0] hover:border-[#00E5A040] hover:text-[#F0F4FF]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: E-commerce ── */}
      {show("ecommerce") && (
        <>
          <SectionHeader label="E-commerce" />
          <ShopifyPanel initial={s.shopify} onRefresh={fetchCreds} />
          <WooCommercePanel initial={s.woocommerce} onRefresh={fetchCreds} />
        </>
      )}

      {/* ── SECTION 2: Advertising ── */}
      {show("advertising") && (
        <>
          <SectionHeader label="Advertising" />
          <MetaPanel initial={s.meta} onRefresh={fetchCreds} />
          <GooglePanel initial={s.google} onRefresh={fetchCreds} />
          <ComingSoonCard
            iconBg="#00F2EA18"
            iconColor="#00F2EA"
            iconLetter="TT"
            name="TikTok Ads"
            description="Connect TikTok Ads Manager for campaign analytics and attribution"
          />
          <ComingSoonCard
            iconBg="#FFFC0018"
            iconColor="#FFDD00"
            iconLetter="SC"
            name="Snapchat Ads"
            description="Sync Snapchat Ads data for cross-channel performance reporting"
          />
          <ComingSoonCard
            iconBg="#008EF318"
            iconColor="#008EF3"
            iconLetter="Bing"
            name="Bing / Microsoft Ads"
            description="Pull Microsoft Advertising data for search campaign insights"
          />
        </>
      )}

      {/* ── SECTION 3: Payments ── */}
      {show("payments") && (
        <>
          <SectionHeader label="Payments" />
          <RazorpayPanel initial={s.razorpay} onRefresh={fetchCreds} />
          <ComingSoonCard
            iconBg="#1E6BEF18"
            iconColor="#1E6BEF"
            iconLetter="CF"
            name="Cashfree"
            description="Connect Cashfree Payments for order revenue reconciliation"
          />
        </>
      )}

      {/* ── SECTION 4: Marketing & CRM ── */}
      {show("marketing") && (
        <>
          <SectionHeader label="Marketing & CRM" />
          <WhatsAppPanel initial={s.whatsapp} onRefresh={fetchCreds} />
          <KlaviyoPanel initial={s.klaviyo} onRefresh={fetchCreds} />
        </>
      )}

      {/* ── SECTION 5: Shipping & Logistics ── */}
      {show("shipping") && (
        <>
          <SectionHeader label="Shipping & Logistics" />
          <ShiprocketPanel initial={s.shiprocket} onRefresh={fetchCreds} />
          <ComingSoonCard
            iconBg="#FF990018"
            iconColor="#FF9900"
            iconLetter="AMZ"
            name="Amazon Ads"
            description="Connect Amazon Advertising for sponsored product campaign data"
          />
        </>
      )}
    </div>
  );
}
