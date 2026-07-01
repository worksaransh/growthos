"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import { useAuth } from "@/lib/hooks";
import { api } from "@/lib/api-client";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: 1, label: "Account" },
  { num: 2, label: "Shopify" },
  { num: 3, label: "Meta Ads" },
  { num: 4, label: "Google Ads" },
  { num: 5, label: "Sync" },
];

function OnboardingContent() {
  const [step, setStep] = useState<Step>(1);
  const [brandName, setBrandName] = useState("My Brand");
  const [storeUrl, setStoreUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const { user } = useAuth();

  useEffect(() => {
    if (stepParam) {
      const s = parseInt(stepParam);
      if (s >= 1 && s <= 5) {
        setStep(s as Step);
      }
    }
  }, [stepParam]);

  const handleSkipToDashboard = () => {
    router.push("/dashboard");
  };

  const handleContinueStep1 = async () => {
    try {
      await api.initWorkspace(brandName);
    } catch (err) {
      console.error("Workspace init failed or already exists", err);
    }
    setStep(2);
  };

  const handleConnectShopify = async () => {
    try {
      const { authUrl } = await api.connectShopify(storeUrl);
      window.location.href = authUrl;
    } catch (err) {
      alert("Failed to connect Shopify: " + (err as any).message);
    }
  };

  const handleConnectMeta = async () => {
    try {
      const { authUrl } = await api.connectMeta();
      window.location.href = authUrl;
    } catch (err) {
      alert("Failed to connect Meta Ads: " + (err as any).message);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { authUrl } = await api.connectGoogle();
      window.location.href = authUrl;
    } catch (err) {
      alert("Failed to connect Google Ads: " + (err as any).message);
    }
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    try {
      const activeIntgs = await api.getIntegrations();
      for (const intg of activeIntgs) {
        if (intg.status !== "disconnected") {
          await api.triggerSync(intg.platform);
        }
      }
      // Wait 3 seconds for initial sync to fetch some data
      await new Promise((resolve) => setTimeout(resolve, 3000));
      router.push("/dashboard");
    } catch (err) {
      console.error("Initial sync trigger failed", err);
      router.push("/dashboard");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all ${
                  s.num === step
                    ? "bg-[#00E5A0] text-[#0A0C0F]"
                    : s.num < step
                    ? "bg-[rgba(0,229,160,0.15)] text-[#00E5A0] border border-[rgba(0,229,160,0.3)]"
                    : "bg-[#151921] text-[#48566E] border border-[#1E2737]"
                }`}
              >
                {s.num < step ? <AppIcon name="check" size={14} /> : s.num}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    s.num < step ? "bg-[#00E5A0]" : "bg-[#1E2737]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-10">
          <h1 className="font-syne text-2xl font-bold text-[#F0F4FF] mb-2">
            {step === 1 && "Welcome to GrowthOS"}
            {step === 2 && "Connect Shopify"}
            {step === 3 && "Connect Meta Ads"}
            {step === 4 && "Connect Google Ads"}
            {step === 5 && "Start Syncing"}
          </h1>
          <p className="text-sm text-[#8A95B0]">
            {step === 1 && "Connect your data sources to get started"}
            {step === 2 && "Sync your orders and revenue automatically"}
            {step === 3 && "Track your Facebook & Instagram ad performance"}
            {step === 4 && "Monitor your Google Ads campaigns"}
            {step === 5 && "We'll pull your data from all connected platforms"}
          </p>
        </div>

        {/* Step UI */}
        <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#151921] border border-[#1E2737]">
                <div className="text-xs text-[#48566E] font-mono uppercase mb-1">
                  Account
                </div>
                <div className="text-sm text-[#F0F4FF]">{user?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
                  Brand Name
                </label>
                <Input
                  placeholder="My Brand"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <Button onClick={handleContinueStep1} className="w-full">
                Continue
              </Button>
              <button
                onClick={handleSkipToDashboard}
                className="w-full text-xs text-[#48566E] hover:text-[#8A95B0] font-mono transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-[#48566E] uppercase tracking-wider mb-1.5">
                  Shopify Store URL
                </label>
                <Input
                  placeholder="mybrand.myshopify.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleConnectShopify}
                className="w-full"
                disabled={!storeUrl}
              >
                Connect Shopify
              </Button>
              <button
                onClick={() => setStep(3)}
                className="w-full text-xs text-[#48566E] hover:text-[#8A95B0] font-mono transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#151921] border border-[#1E2737] text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/10 text-[#1877F2]">
                  <AppIcon name="meta" size={24} />
                </div>
                <div className="text-sm text-[#F0F4FF] mb-1">
                  Meta Ads Connection
                </div>
                <div className="text-xs text-[#48566E]">
                  Read-only access to your ad account data
                </div>
              </div>
              <Button onClick={handleConnectMeta} className="w-full">
                Connect Meta Ads
              </Button>
              <button
                onClick={() => setStep(4)}
                className="w-full text-xs text-[#48566E] hover:text-[#8A95B0] font-mono transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#151921] border border-[#1E2737] text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#FFAD3B]/30 bg-[#FFAD3B]/10 text-[#FFAD3B]">
                  <AppIcon name="google" size={24} />
                </div>
                <div className="text-sm text-[#F0F4FF] mb-1">
                  Google Ads Connection
                </div>
                <div className="text-xs text-[#48566E]">
                  Track search and display campaign performance
                </div>
              </div>
              <Button onClick={handleConnectGoogle} className="w-full">
                Connect Google Ads
              </Button>
              <button
                onClick={() => setStep(5)}
                className="w-full text-xs text-[#48566E] hover:text-[#8A95B0] font-mono transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              {isSyncing ? (
                <div>
                  <div className="flex justify-center gap-1 mb-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#00E5A0] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-[#F0F4FF] mb-1">
                    Pulling your data...
                  </div>
                  <div className="text-xs text-[#48566E]">
                    This takes about 30 seconds for first-time sync
                  </div>
                </div>
              ) : (
                <Button onClick={handleStartSync} className="w-full">
                  Start Syncing
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <span className="text-xs text-[#48566E] font-mono">
            Step {step} of 5
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0C0F] text-[#F0F4FF] flex items-center justify-center font-mono">Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
