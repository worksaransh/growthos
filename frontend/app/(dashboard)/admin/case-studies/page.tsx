"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metric {
  label: string;
  value: string;
  period: string;
}

interface CaseStudy {
  id: string;
  brand: string;
  category: string;
  logo: string;
  logo_color: string;
  tagline: string;
  description: string;
  hero_metric: string;
  hero_label: string;
  gmv: string;
  featured: boolean;
  sort_order: number;
  metrics: Metric[];
  tags: string[];
  results: string[];
  quote: string;
  quote_name: string;
  quote_role: string;
}

const EMPTY_FORM: Omit<CaseStudy, "id"> & { id: string } = {
  id: "",
  brand: "",
  category: "Skincare",
  logo: "star",
  logo_color: "#c0c1ff",
  tagline: "",
  description: "",
  hero_metric: "",
  hero_label: "",
  gmv: "",
  featured: false,
  sort_order: 0,
  metrics: [
    { label: "", value: "", period: "" },
    { label: "", value: "", period: "" },
    { label: "", value: "", period: "" },
    { label: "", value: "", period: "" },
  ],
  tags: [],
  results: [],
  quote: "",
  quote_name: "",
  quote_role: "",
};

const CATEGORIES = ["Skincare", "Fashion", "Health & Nutrition", "Apparel", "Home Decor", "F&B", "Electronics", "Beauty", "Sports", "Other"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CaseCard({ cs, onEdit, onDelete }: { cs: CaseStudy; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-5 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cs.logo_color + "20" }}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: cs.logo_color, fontVariationSettings: "'FILL' 1" }}
            >
              {cs.logo}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#dbe2fd] font-semibold text-sm">{cs.brand}</p>
              {cs.featured && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#c0c1ff]/15 text-[#c0c1ff]">
                  Featured
                </span>
              )}
            </div>
            <p className="text-[#464554] text-xs">{cs.category} · {cs.gmv}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black" style={{ color: cs.logo_color }}>{cs.hero_metric}</p>
          <p className="text-[#464554] text-[10px] uppercase tracking-widest">{cs.hero_label}</p>
        </div>
      </div>

      <p className="text-[#c0c1ff] text-xs font-semibold mb-1 truncate">{cs.tagline}</p>
      <p className="text-[#c7c4d7] text-xs leading-relaxed line-clamp-2 mb-4">{cs.description}</p>

      <div className="flex gap-2 flex-wrap mb-4">
        {cs.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#c7c4d7] uppercase tracking-wide">
            {t}
          </span>
        ))}
      </div>

      <div className="flex gap-2 pt-3 border-t border-white/5">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#c0c1ff]/10 text-[#c0c1ff] text-xs font-semibold hover:bg-[#c0c1ff]/20 transition-all"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[#c7c4d7] text-xs font-semibold mb-1.5 uppercase tracking-wide">{children}</label>;
}

function TextInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/40 transition-colors ${className}`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/40 transition-colors resize-none"
    />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function CaseStudyModal({
  open,
  form,
  setForm,
  onSave,
  onClose,
  saving,
  isEdit,
}: {
  open: boolean;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  if (!open) return null;

  const set = (key: keyof typeof EMPTY_FORM, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setMetric = (i: number, key: keyof Metric, val: string) =>
    setForm((f) => {
      const metrics = [...f.metrics];
      metrics[i] = { ...metrics[i], [key]: val };
      return { ...f, metrics };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl h-screen bg-[#0b1326] border-l border-white/10 overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0b1326] border-b border-white/10">
          <div>
            <h2 className="text-[#dbe2fd] font-bold text-base">{isEdit ? "Edit Case Study" : "New Case Study"}</h2>
            <p className="text-[#464554] text-xs mt-0.5">Fields marked * are required</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-[#464554] hover:text-[#dbe2fd] transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* Brand info */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Brand Info</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <FieldLabel>Brand Name *</FieldLabel>
                <TextInput value={form.brand} onChange={(v) => set("brand", v)} placeholder="e.g. Glow Naturals" />
              </div>
              <div>
                <FieldLabel>Category *</FieldLabel>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] text-sm focus:outline-none focus:border-[#c0c1ff]/40 transition-colors"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <FieldLabel>GMV</FieldLabel>
                <TextInput value={form.gmv} onChange={(v) => set("gmv", v)} placeholder="₹15Cr" />
              </div>
              <div>
                <FieldLabel>Sort Order</FieldLabel>
                <TextInput value={String(form.sort_order)} onChange={(v) => set("sort_order", parseInt(v) || 0)} placeholder="1" />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => set("featured", !form.featured)}
                className={`w-10 h-5 rounded-full transition-colors ${form.featured ? "bg-[#c0c1ff]" : "bg-white/10"} relative flex-shrink-0`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.featured ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-[#c7c4d7] text-sm">Featured (shown large on page)</span>
            </label>
          </div>

          {/* Visual */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Visual</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Icon (Material Symbol) *</FieldLabel>
                <TextInput value={form.logo} onChange={(v) => set("logo", v)} placeholder="spa" />
                <p className="text-[#464554] text-[10px] mt-1">e.g. spa, eco, steps, checkroom</p>
              </div>
              <div>
                <FieldLabel>Icon Color *</FieldLabel>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.logo_color}
                    onChange={(e) => set("logo_color", e.target.value)}
                    className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                  />
                  <TextInput value={form.logo_color} onChange={(v) => set("logo_color", v)} placeholder="#c0c1ff" className="flex-1" />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: form.logo_color + "20" }}>
                <span className="material-symbols-outlined text-lg" style={{ color: form.logo_color, fontVariationSettings: "'FILL' 1" }}>
                  {form.logo || "star"}
                </span>
              </div>
              <span className="text-[#464554] text-xs">Icon preview</span>
            </div>
          </div>

          {/* Copy */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Copy</p>
            <div className="mb-3">
              <FieldLabel>Tagline *</FieldLabel>
              <TextInput value={form.tagline} onChange={(v) => set("tagline", v)} placeholder="From 2.1x to 4.8x ROAS in 90 days" />
            </div>
            <div>
              <FieldLabel>Description *</FieldLabel>
              <TextArea value={form.description} onChange={(v) => set("description", v)} placeholder="Describe what the brand achieved with GrowthOS..." rows={3} />
            </div>
          </div>

          {/* Hero metric */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Hero Metric</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Metric Value *</FieldLabel>
                <TextInput value={form.hero_metric} onChange={(v) => set("hero_metric", v)} placeholder="4.8x" />
              </div>
              <div>
                <FieldLabel>Metric Label *</FieldLabel>
                <TextInput value={form.hero_label} onChange={(v) => set("hero_label", v)} placeholder="ROAS" />
              </div>
            </div>
          </div>

          {/* Stats metrics */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Stats (4 metrics)</p>
            <div className="space-y-2">
              {form.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <TextInput value={m.label} onChange={(v) => setMetric(i, "label", v)} placeholder={`Label ${i+1}`} />
                  <TextInput value={m.value} onChange={(v) => setMetric(i, "value", v)} placeholder="Value" />
                  <TextInput value={m.period} onChange={(v) => setMetric(i, "period", v)} placeholder="Period" />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Tags</p>
            <TextInput
              value={form.tags.join(", ")}
              onChange={(v) => set("tags", v.split(",").map((t) => t.trim()).filter(Boolean))}
              placeholder="Skincare, Meta Ads, Profit Engine"
            />
            <p className="text-[#464554] text-[10px] mt-1">Comma-separated</p>
          </div>

          {/* Results */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Results (one per line)</p>
            <TextArea
              value={form.results.join("\n")}
              onChange={(v) => set("results", v.split("\n").map((r) => r.trim()).filter(Boolean))}
              placeholder={"Identified 3 loss-making SKUs\nPaused unprofitable ad spend"}
              rows={4}
            />
          </div>

          {/* Quote */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[#c0c1ff] text-[10px] font-bold uppercase tracking-widest mb-3">Customer Quote</p>
            <div className="mb-3">
              <FieldLabel>Quote</FieldLabel>
              <TextArea value={form.quote} onChange={(v) => set("quote", v)} placeholder="What did they say about GrowthOS?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Name</FieldLabel>
                <TextInput value={form.quote_name} onChange={(v) => set("quote_name", v)} placeholder="Priya Mehta" />
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <TextInput value={form.quote_role} onChange={(v) => set("quote_role", v)} placeholder="Founder, Glow Naturals" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-[#0b1326] border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[#c7c4d7] text-sm font-semibold hover:bg-white/[0.05] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.brand || !form.tagline}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-[#0b1326] text-sm transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Case Study"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ brand, onConfirm, onCancel }: { brand: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[#0f1729] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-xl">delete_forever</span>
          </div>
          <div>
            <p className="text-[#dbe2fd] font-bold">Delete case study?</p>
            <p className="text-[#464554] text-xs">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-[#c7c4d7] text-sm mb-5">
          <strong className="text-[#dbe2fd]">{brand}</strong> will be permanently removed from the case studies page.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-[#c7c4d7] text-sm font-semibold hover:bg-white/[0.05] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all border border-red-500/20">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCaseStudiesPage() {
  const supabase = createClient();
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("case_studies")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) setError(error.message);
    else setCases(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, metrics: EMPTY_FORM.metrics.map((m) => ({ ...m })) });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (cs: CaseStudy) => {
    const metrics = [...cs.metrics];
    while (metrics.length < 4) metrics.push({ label: "", value: "", period: "" });
    setForm({
      id: cs.id,
      brand: cs.brand,
      category: cs.category,
      logo: cs.logo,
      logo_color: cs.logo_color,
      tagline: cs.tagline,
      description: cs.description,
      hero_metric: cs.hero_metric,
      hero_label: cs.hero_label,
      gmv: cs.gmv,
      featured: cs.featured,
      sort_order: cs.sort_order,
      metrics,
      tags: cs.tags || [],
      results: cs.results || [],
      quote: cs.quote || "",
      quote_name: cs.quote_name || "",
      quote_role: cs.quote_role || "",
    });
    setEditingId(cs.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.brand || !form.tagline) return;
    setSaving(true);

    const id = editingId || slugify(form.brand);
    const payload = { ...form, id, metrics: form.metrics.filter((m) => m.label) };

    let err;
    if (editingId) {
      const { error } = await supabase.from("case_studies").update(payload).eq("id", editingId);
      err = error;
    } else {
      const { error } = await supabase.from("case_studies").insert(payload);
      err = error;
    }

    setSaving(false);
    if (err) {
      showToast(err.message, "error");
    } else {
      setModalOpen(false);
      showToast(editingId ? "Case study updated!" : "Case study added!");
      fetchCases();
    }
  };

  const handleDelete = async (cs: CaseStudy) => {
    const { error } = await supabase.from("case_studies").delete().eq("id", cs.id);
    setDeleteTarget(null);
    if (error) showToast(error.message, "error");
    else { showToast("Deleted."); fetchCases(); }
  };

  const toggleFeatured = async (cs: CaseStudy) => {
    await supabase.from("case_studies").update({ featured: !cs.featured }).eq("id", cs.id);
    fetchCases();
  };

  return (
    <div className="min-h-screen bg-[#0b1326]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-medium border transition-all ${
          toast.type === "success"
            ? "bg-[#0f1729] border-[#c0c1ff]/30 text-[#c0c1ff]"
            : "bg-[#0f1729] border-red-500/30 text-red-400"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#464554] hover:text-[#c7c4d7] transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[#dbe2fd] text-2xl font-black">Case Studies</h1>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#ddb7ff]/15 text-[#ddb7ff] border border-[#ddb7ff]/20">
                  Super Admin
                </span>
              </div>
              <p className="text-[#464554] text-sm">Manage case studies shown on the public marketing page</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[#0b1326] text-sm hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Case Study
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8 mt-6">
          {[
            { label: "Total", value: cases.length, icon: "article" },
            { label: "Featured", value: cases.filter((c) => c.featured).length, icon: "grade" },
            { label: "Categories", value: new Set(cases.map((c) => c.category)).size, icon: "category" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0f1729] rounded-2xl border border-white/10 px-5 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#c0c1ff] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <div>
                <p className="text-[#dbe2fd] font-bold text-xl">{s.value}</p>
                <p className="text-[#464554] text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c0c1ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-3 block">error</span>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-[#464554] text-xs mt-2">Make sure the case_studies table exists in Supabase and the migration has been run.</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-[#464554] mb-3 block">inventory_2</span>
            <p className="text-[#c7c4d7] mb-1">No case studies yet.</p>
            <p className="text-[#464554] text-sm mb-5">Run the migration to seed the initial 6, or add one manually.</p>
            <button onClick={openAdd} className="px-6 py-3 rounded-xl text-sm font-semibold text-[#0b1326]" style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}>
              Add First Case Study
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((cs) => (
              <div key={cs.id} className="group relative">
                {/* Featured toggle chip */}
                <button
                  onClick={() => toggleFeatured(cs)}
                  className={`absolute top-3 right-3 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border transition-all ${
                    cs.featured
                      ? "bg-[#c0c1ff]/20 border-[#c0c1ff]/40 text-[#c0c1ff]"
                      : "bg-white/[0.04] border-white/10 text-[#464554] hover:border-white/20"
                  }`}
                  title={cs.featured ? "Click to unfeature" : "Click to feature"}
                >
                  {cs.featured ? "★ Featured" : "☆ Feature"}
                </button>
                <CaseCard
                  cs={cs}
                  onEdit={() => openEdit(cs)}
                  onDelete={() => setDeleteTarget(cs)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CaseStudyModal
        open={modalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
        isEdit={!!editingId}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          brand={deleteTarget.brand}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
