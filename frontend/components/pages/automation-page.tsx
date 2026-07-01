"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { VisualEmptyState, VisualSkeletonGrid } from "@/components/shared/visual-system";
import { api } from "@/lib/api-client";

const MOCK_RULES = [
  { id: "1", name: "ROAS Alert", trigger: "roas_drops_below", threshold: 3.0, action: "send_notification", enabled: true, last_triggered: "2 days ago" },
  { id: "2", name: "Overspend Guard", trigger: "spend_exceeds", threshold: 50000, action: "pause_campaign", enabled: true, last_triggered: "5 days ago" },
  { id: "3", name: "High CAC Alert", trigger: "cac_above", threshold: 1200, action: "send_email", enabled: false, last_triggered: "1 week ago" },
  { id: "4", name: "Weekly Budget Check", trigger: "schedule", threshold: 0, action: "send_notification", enabled: true, last_triggered: "Yesterday" },
];

const TRIGGERS = [
  { value: "roas_drops_below", label: "ROAS drops below" },
  { value: "spend_exceeds", label: "Spend exceeds (₹)" },
  { value: "cac_above", label: "CAC goes above (₹)" },
  { value: "schedule", label: "On schedule (weekly)" },
];

const ACTIONS = [
  { value: "send_notification", label: "Send notification" },
  { value: "pause_campaign", label: "Pause campaign" },
  { value: "increase_budget", label: "Increase budget by 20%" },
  { value: "send_email", label: "Send email alert" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-all relative ${enabled ? "bg-[#00E5A0]" : "bg-[#1E2737]"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export function AutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "roas_drops_below", threshold: "", action: "send_notification" });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation", "rules"],
    queryFn: () => api.getAutomationRules(),
  });

  const allRules = rules && rules.length > 0 ? rules : MOCK_RULES;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createAutomationRule(data),
    onSuccess: () => {
      toast({ type: "success", title: "Rule created", message: "Your automation rule is now active." });
      queryClient.invalidateQueries({ queryKey: ["automation"] });
      setShowModal(false);
      setForm({ name: "", trigger: "roas_drops_below", threshold: "", action: "send_notification" });
    },
    onError: (err: any) => toast({ type: "error", title: "Failed to create rule", message: err.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleAutomationRule(id),
    onSuccess: () => {
      toast({ type: "info", title: "Rule updated" });
      queryClient.invalidateQueries({ queryKey: ["automation"] });
    },
    onError: (err: any) => toast({ type: "error", title: "Failed to toggle rule", message: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAutomationRule(id),
    onSuccess: () => {
      toast({ type: "success", title: "Rule deleted" });
      queryClient.invalidateQueries({ queryKey: ["automation"] });
    },
    onError: (err: any) => toast({ type: "error", title: "Failed to delete rule", message: err.message }),
  });

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ type: "warning", title: "Please enter a rule name" }); return; }
    createMutation.mutate({ ...form, threshold: parseFloat(form.threshold) || 0 });
  };

  const triggerLabel = (v: string) => TRIGGERS.find(t => t.value === v)?.label || v;
  const actionLabel = (v: string) => ACTIONS.find(a => a.value === v)?.label || v;

  if (isLoading) return (
    <div className="p-7">
      <VisualSkeletonGrid cards={4} />
    </div>
  );

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne text-base font-bold text-[#F0F4FF]">Automation Rules</h2>
          <p className="text-xs text-[#48566E] font-mono mt-0.5">{allRules.filter((r: any) => r.enabled).length} active rules</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Create Rule</Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Rules", value: String(allRules.length), color: "#F0F4FF" },
          { label: "Active", value: String(allRules.filter((r: any) => r.enabled).length), color: "#00E5A0" },
          { label: "Paused", value: String(allRules.filter((r: any) => !r.enabled).length), color: "#FFAD3B" },
          { label: "Triggered (7d)", value: "3", color: "#3B9EFF" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{s.label}</div>
            <div className="font-mono text-[22px] font-medium" style={{ color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-3">
        {allRules.map((rule: any) => (
          <Card key={rule.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Toggle enabled={rule.enabled} onToggle={() => toggleMutation.mutate(rule.id)} />
                <div>
                  <div className="text-sm text-[#F0F4FF] font-medium">{rule.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#48566E]">
                      IF {triggerLabel(rule.trigger)}{rule.threshold ? ` ${rule.threshold}` : ""}
                    </span>
                    <span className="text-[#48566E]">→</span>
                    <span className="text-[10px] font-mono text-[#3B9EFF]">{actionLabel(rule.action)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-[#48566E] font-mono">Last triggered</div>
                  <div className="text-xs text-[#8A95B0] font-mono">{rule.last_triggered || "Never"}</div>
                </div>
                <button onClick={() => deleteMutation.mutate(rule.id)}
                  className="text-[#48566E] hover:text-[#FF5B6B] transition-colors text-xs font-mono">
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {allRules.length === 0 && (
        <VisualEmptyState
          icon="bolt"
          title="No automation rules yet."
          description="Create a first rule to protect ROAS, flag expensive CAC, or trigger a weekly performance digest."
          actionLabel="Create rule"
          onAction={() => setShowModal(true)}
        />
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Automation Rule">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1.5">Rule Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. ROAS Protection" className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1.5">Trigger</label>
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#151921] border border-[#1E2737] text-[#F0F4FF] text-sm font-mono outline-none focus:border-[#00E5A0] transition-colors">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {form.trigger !== "schedule" && (
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1.5">Threshold</label>
              <Input value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                placeholder="e.g. 3.0 for ROAS, 50000 for spend" className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" type="number" />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1.5">Action</label>
            <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#151921] border border-[#1E2737] text-[#F0F4FF] text-sm font-mono outline-none focus:border-[#00E5A0] transition-colors">
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "Creating…" : "Create Rule"}
            </Button>
            <Button onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-[#1E2737] text-[#8A95B0] hover:text-[#F0F4FF]">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
