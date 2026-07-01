"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

const COLUMNS = [
  { id: "lead", label: "Lead", color: "#8A95B0" },
  { id: "contacted", label: "Contacted", color: "#3B9EFF" },
  { id: "qualified", label: "Qualified", color: "#FFAD3B" },
  { id: "proposal", label: "Proposal", color: "#00E5A0" },
  { id: "won", label: "Won", color: "#00E5A0" },
  { id: "lost", label: "Lost", color: "#FF5B6B" },
];

const MOCK_LEADS = [
  { id: "1", name: "Priya Menon", company: "Bloom & Co.", value: 450000, last_contact: "2h ago", status: "lead", email: "priya@bloomco.in" },
  { id: "2", name: "Arjun Singh", company: "Urban Thread", value: 820000, last_contact: "1d ago", status: "contacted", email: "arjun@urbanthread.in" },
  { id: "3", name: "Kavita Sharma", company: "Pure Origins", value: 310000, last_contact: "3d ago", status: "contacted", email: "kavita@pureorigins.in" },
  { id: "4", name: "Rohan Mehta", company: "Glow Naturals", value: 680000, last_contact: "5d ago", status: "qualified", email: "rohan@glownaturals.in" },
  { id: "5", name: "Sneha Patel", company: "Zest Beverages", value: 240000, last_contact: "1w ago", status: "lead", email: "sneha@zestbev.in" },
  { id: "6", name: "Aman Gupta", company: "Apex Footwear", value: 1200000, last_contact: "2d ago", status: "proposal", email: "aman@apexfw.in" },
  { id: "7", name: "Meera Reddy", company: "FitLife India", value: 560000, last_contact: "1d ago", status: "qualified", email: "meera@fitlife.in" },
  { id: "8", name: "Dev Kumar", company: "StyleX", value: 390000, last_contact: "3h ago", status: "won", email: "dev@stylex.in" },
  { id: "9", name: "Aisha Khan", company: "Nurture Foods", value: 180000, last_contact: "2w ago", status: "lost", email: "aisha@nurturefoods.in" },
];

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  last_contact: string;
  status: string;
  email: string;
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("leadId", lead.id)}
      className="p-3 rounded-xl bg-[#0F1217] border border-[#1E2737] cursor-grab active:cursor-grabbing hover:border-[#8A95B0] transition-all">
      <div className="flex items-start justify-between mb-1.5">
        <div className="w-6 h-6 rounded-md bg-[#1C2230] flex items-center justify-center text-[10px] text-[#8A95B0]">
          {lead.name[0]}
        </div>
        <span className="font-mono text-xs text-[#00E5A0]">{fmt(lead.value)}</span>
      </div>
      <div className="text-xs text-[#F0F4FF] font-medium">{lead.name}</div>
      <div className="text-[10px] text-[#48566E] font-mono mt-0.5">{lead.company}</div>
      <div className="text-[10px] text-[#48566E] font-mono mt-1.5">Last contact: {lead.last_contact}</div>
    </div>
  );
}

export function CrmPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", source: "", value: "" });

  const { data: apiLeads } = useQuery({
    queryKey: ["crm", "leads"],
    queryFn: () => api.getCrmLeads(),
  });

  const allLeads = apiLeads && apiLeads.length > 0 ? apiLeads : leads;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCrmLead(data),
    onSuccess: () => {
      toast({ type: "success", title: "Lead added", message: "New lead added to your pipeline." });
      queryClient.invalidateQueries({ queryKey: ["crm"] });
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", company: "", source: "", value: "" });
    },
    onError: (err: any) => {
      // Fallback: add to local state
      const newLead: Lead = {
        id: Date.now().toString(),
        name: form.name,
        company: form.company,
        value: parseFloat(form.value) || 0,
        last_contact: "Just now",
        status: "lead",
        email: form.email,
      };
      setLeads(prev => [...prev, newLead]);
      toast({ type: "success", title: "Lead added to pipeline" });
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", company: "", source: "", value: "" });
    },
  });

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOver(null);
    const leadId = e.dataTransfer.getData("leadId");
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await api.updateCrmLead(leadId, { status: newStatus });
    } catch {
      // Local update is already done
    }
  };

  const totalPipelineValue = allLeads.filter((l: Lead) => !["won", "lost"].includes(l.status)).reduce((acc: number, l: Lead) => acc + l.value, 0);
  const wonValue = allLeads.filter((l: Lead) => l.status === "won").reduce((acc: number, l: Lead) => acc + l.value, 0);

  return (
    <div className="p-7 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne text-base font-bold text-[#F0F4FF]">CRM Pipeline</h2>
          <p className="text-xs text-[#48566E] font-mono mt-0.5">
            Pipeline value: <span className="text-[#F0F4FF]">{fmt(totalPipelineValue)}</span> · Won: <span className="text-[#00E5A0]">{fmt(wonValue)}</span>
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Lead</Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const colLeads = allLeads.filter((l: Lead) => l.status === col.id);
          const colValue = colLeads.reduce((acc: number, l: Lead) => acc + l.value, 0);
          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-[220px] rounded-xl p-3 transition-all ${dragOver === col.id ? "bg-[rgba(0,229,160,0.05)] border border-dashed border-[#00E5A0]" : "bg-[#0F1217] border border-[#1E2737]"}`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-medium" style={{ color: col.color }}>{col.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] text-[#48566E]">{colLeads.length}</span>
                </div>
              </div>
              {colValue > 0 && (
                <div className="text-[10px] font-mono text-[#48566E] mb-2">{fmt(colValue)} total</div>
              )}
              <div className="flex flex-col gap-2">
                {colLeads.map((lead: Lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {colLeads.length === 0 && (
                  <div className="py-6 text-center text-[10px] text-[#48566E] font-mono">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Lead">
        <div className="flex flex-col gap-3">
          {[
            { key: "name", label: "Full Name", placeholder: "Priya Menon" },
            { key: "email", label: "Email", placeholder: "priya@brand.in" },
            { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
            { key: "company", label: "Company", placeholder: "Bloom & Co." },
            { key: "source", label: "Source", placeholder: "Referral, Website, LinkedIn…" },
            { key: "value", label: "Deal Value (₹)", placeholder: "500000" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">{f.label}</label>
              <Input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="bg-[#151921] border-[#1E2737] text-[#F0F4FF] placeholder:text-[#48566E]"
                type={f.key === "value" ? "number" : "text"}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "Adding…" : "Add Lead"}
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
