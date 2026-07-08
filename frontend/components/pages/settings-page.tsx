"use client"

import { useState, useMemo } from "react"
import { notify } from "@/lib/toast-sonner"
import { useAuth } from "@/lib/hooks"

// ── Types ──────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member" | "viewer"
  avatar?: string
  status: "active" | "pending"
  joinedAt: string
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  owner: { bg: "#c0c1ff20", text: "#c0c1ff" },
  admin: { bg: "#ddb7ff20", text: "#ddb7ff" },
  member: { bg: "#7bd0ff20", text: "#7bd0ff" },
  viewer: { bg: "#46455420", text: "#c7c4d7" },
}

const TABS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "workspace", label: "Workspace", icon: "business" },
  { id: "team", label: "Team", icon: "group" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "security", label: "Security", icon: "security" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "api", label: "API Keys", icon: "key" },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function SaveButton({ loading = false, label = "Save Changes", onClick }: { loading?: boolean; label?: string; onClick?: () => void }) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      className="primary-gradient text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {label}
    </button>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-[#dbe2fd] font-semibold text-sm">{title}</h3>
        {description && <p className="text-[#c7c4d7] text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function InputField({ label, type = "text", value, onChange, placeholder, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full input-base"
      />
      {hint && <p className="text-[#918f9a] text-xs mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22 }}
      className={`relative rounded-full transition-colors flex-shrink-0 ${checked ? "bg-[#c0c1ff]" : "bg-[#464554]"}`}
    >
      <span
        style={{ width: 18, height: 18, top: 2, left: 2, transform: checked ? "translateX(18px)" : "translateX(0)" }}
        className="absolute bg-white rounded-full shadow transition-transform"
      />
    </button>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth()
  const realName  = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const realEmail = user?.email || ""
  const initials  = realName
    ? realName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : realEmail.slice(0, 2).toUpperCase()

  const [name, setName] = useState(realName)
  const [email, setEmail] = useState(realEmail)
  const [phone, setPhone] = useState("")
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [saving, setSaving] = useState(false)

  // Sync when auth loads
  useMemo(() => {
    if (realName && !name) setName(realName)
    if (realEmail && !email) setEmail(realEmail)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realName, realEmail])

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    notify.success("Profile updated")
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" description="Update your name, email and contact details">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-2xl font-bold text-[#0b1326]">
            {initials}
          </div>
          <div>
            <button className="text-[#c0c1ff] text-sm font-medium hover:text-white transition-colors">Change avatar</button>
            <p className="text-[#c7c4d7] text-xs mt-0.5">JPG, PNG or GIF · Max 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Full Name" value={name} onChange={setName} />
          <InputField label="Email" type="email" value={email} onChange={setEmail} />
          <InputField label="Phone" type="tel" value={phone} onChange={setPhone} />
          <div>
            <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Timezone</label>
            <select className="w-full input-base" value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option value="Asia/Kolkata">IST — Asia/Kolkata (UTC+5:30)</option>
              <option value="America/New_York">EST — America/New_York</option>
              <option value="Europe/London">GMT — Europe/London</option>
              <option value="Asia/Singapore">SGT — Asia/Singapore</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton loading={saving} onClick={save} />
        </div>
      </SectionCard>

      <SectionCard title="Change Password" description="Update your account password">
        <div className="space-y-3">
          <InputField label="Current Password" type="password" value="" onChange={() => {}} placeholder="••••••••" />
          <InputField label="New Password" type="password" value="" onChange={() => {}} placeholder="Min. 12 characters" />
          <InputField label="Confirm New Password" type="password" value="" onChange={() => {}} placeholder="••••••••" />
        </div>
        <div className="flex justify-end pt-2">
          <button className="primary-gradient text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            Update Password
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Workspace Tab ──────────────────────────────────────────────────────────

function WorkspaceTab() {
  const { user } = useAuth()
  // Derive a default workspace name from the user's email domain or metadata
  const defaultWsName = user?.user_metadata?.workspace_name
    || user?.user_metadata?.company
    || (user?.email ? user.email.split("@")[1]?.split(".")[0] || "" : "")
  const defaultSlug = defaultWsName.toLowerCase().replace(/\s+/g, "-")

  const [wsName, setWsName] = useState(defaultWsName)
  const [slug, setSlug] = useState(defaultSlug)
  const [currency, setCurrency] = useState("INR")
  const [fiscal, setFiscal] = useState("april")

  return (
    <div className="space-y-5">
      <SectionCard title="Workspace Settings" description="Configure your brand and business details">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Workspace Name" value={wsName} onChange={setWsName} />
          <InputField label="Slug" value={slug} onChange={setSlug} hint="Used in API calls and URLs" />
          <div>
            <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Currency</label>
            <select className="w-full input-base" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="INR">INR — Indian Rupee ₹</option>
              <option value="USD">USD — US Dollar $</option>
              <option value="GBP">GBP — British Pound £</option>
              <option value="EUR">EUR — Euro €</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Fiscal Year Start</label>
            <select className="w-full input-base" value={fiscal} onChange={e => setFiscal(e.target.value)}>
              <option value="april">April (India standard)</option>
              <option value="january">January</option>
              <option value="july">July</option>
              <option value="october">October</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton label="Save Workspace" onClick={() => notify.success("Workspace settings saved")} />
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" description="Irreversible and destructive actions">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#ffb4ab]/20 bg-[#ffb4ab]/5">
          <div>
            <p className="text-[#dbe2fd] text-sm font-medium">Delete Workspace</p>
            <p className="text-[#c7c4d7] text-xs mt-0.5">All data will be permanently deleted. This cannot be undone.</p>
          </div>
          <button className="px-4 py-2 rounded-xl border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm hover:bg-[#ffb4ab]/10 transition-colors">
            Delete
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Team Tab ───────────────────────────────────────────────────────────────

function TeamTab() {
  const { user } = useAuth()

  // Build the team list from real auth — current user is always the owner
  const ownerName  = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You"
  const ownerEmail = user?.email || ""
  const ownerInitials = ownerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
  const todayStr = new Date().toISOString().split("T")[0]

  const ownerMember: TeamMember = {
    id: user?.id || "owner",
    name: ownerName,
    email: ownerEmail,
    role: "owner",
    status: "active",
    joinedAt: user?.created_at?.split("T")[0] || todayStr,
  }

  const [team, setTeam] = useState<TeamMember[]>([ownerMember])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)

  const invite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    await new Promise(r => setTimeout(r, 800))
    // Add the invited member to the local list as "pending"
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole as TeamMember["role"],
      status: "pending",
      joinedAt: todayStr,
    }
    setTeam(t => [...t, newMember])
    setInviting(false)
    setInviteEmail("")
    notify.success(`Invite sent to ${inviteEmail}`)
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Invite Team Member">
        <div className="flex gap-3">
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="input-base flex-1"
            type="email"
          />
          <select className="input-base w-36" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            onClick={invite}
            disabled={inviting}
            className="primary-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {inviting ? "Sending…" : "Send Invite"}
          </button>
        </div>
        <div className="text-xs text-[#c7c4d7] flex gap-6">
          <span><strong className="text-[#dbe2fd]">Admin</strong> — full access except billing</span>
          <span><strong className="text-[#dbe2fd]">Member</strong> — read &amp; write, no settings</span>
          <span><strong className="text-[#dbe2fd]">Viewer</strong> — read only</span>
        </div>
      </SectionCard>

      <SectionCard title="Team Members" description={`${team.length} members`}>
        <div className="space-y-2">
          {team.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-sm font-bold text-[#0b1326]">
                  {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || member.email.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[#dbe2fd] text-sm font-medium">{member.name}</p>
                    {member.id === (user?.id || "owner") && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#c0c1ff]/10 text-[#c0c1ff]/70">You</span>
                    )}
                  </div>
                  <p className="text-[#c7c4d7] text-xs">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {member.status === "pending" && (
                  <span className="text-[10px] bg-[#fb923c]/10 text-[#fb923c] px-2 py-0.5 rounded-full font-bold">PENDING</span>
                )}
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                  style={{ backgroundColor: ROLE_COLORS[member.role].bg, color: ROLE_COLORS[member.role].text }}
                >
                  {member.role}
                </span>
                {member.role !== "owner" && (
                  <button
                    onClick={() => setTeam(t => t.filter(x => x.id !== member.id))}
                    className="text-[#464554] hover:text-[#ffb4ab] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">person_remove</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ── Billing Tab ────────────────────────────────────────────────────────────

function BillingTab() {
  const PLANS = [
    {
      id: "starter", name: "Starter", price: "₹4,999", period: "/mo",
      features: ["1 Shopify store", "5 team members", "30-day data", "Basic AI insights", "Email support"],
      color: "#7bd0ff", current: false,
    },
    {
      id: "growth", name: "Growth", price: "₹14,999", period: "/mo",
      features: ["3 Shopify stores", "15 team members", "90-day data", "All AI modules", "WhatsApp automation", "Priority support"],
      color: "#c0c1ff", current: true,
    },
    {
      id: "enterprise", name: "Enterprise", price: "Custom", period: "",
      features: ["Unlimited stores", "Unlimited team", "365-day data", "Custom AI agents", "White-label", "Dedicated CSM"],
      color: "#ddb7ff", current: false,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Current plan banner */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[#c7c4d7] text-xs uppercase tracking-widest mb-1">Current Plan</p>
          <p className="text-[#dbe2fd] text-xl font-bold">Growth Plan</p>
          <p className="text-[#c7c4d7] text-sm mt-1">₹14,999/month · Renews August 1, 2026</p>
        </div>
        <div className="text-right">
          <span className="bg-[#4ade80]/10 text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full">ACTIVE</span>
          <p className="text-[#c7c4d7] text-xs mt-2">Next invoice: ₹14,999</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`glass-card rounded-2xl p-5 border-2 transition-all ${plan.current ? "border-[#c0c1ff]/40" : "border-white/10"}`}
          >
            {plan.current && (
              <div className="text-[10px] font-bold text-[#c0c1ff] uppercase tracking-widest mb-3">Current Plan</div>
            )}
            <h3 className="text-[#dbe2fd] font-bold text-lg">{plan.name}</h3>
            <div className="flex items-baseline gap-0.5 mt-1 mb-4">
              <span className="text-2xl font-bold" style={{ color: plan.color }}>{plan.price}</span>
              <span className="text-[#c7c4d7] text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-[#c7c4d7]">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: plan.color, fontVariationSettings: "'FILL' 1" }}
                  >check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.current}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                plan.current
                  ? "bg-white/5 text-[#c7c4d7] cursor-default"
                  : "border border-white/20 text-[#dbe2fd] hover:border-[#c0c1ff]/40 hover:bg-white/5"
              }`}
            >
              {plan.current ? "Current Plan" : plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <SectionCard title="Payment Method">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gradient-to-br from-[#1a1f35] to-[#252b45] rounded-lg border border-white/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#dbe2fd]">VISA</span>
            </div>
            <div>
              <p className="text-[#dbe2fd] text-sm font-medium">Visa ending in 4242</p>
              <p className="text-[#c7c4d7] text-xs">Expires 04/2027</p>
            </div>
          </div>
          <button className="text-[#c0c1ff] text-sm hover:text-white transition-colors">Update</button>
        </div>
      </SectionCard>

      {/* Invoice history */}
      <SectionCard title="Invoice History">
        <div className="space-y-2">
          {[
            { date: "Jul 1, 2026", amount: "₹14,999", status: "Paid", inv: "INV-00024" },
            { date: "Jun 1, 2026", amount: "₹14,999", status: "Paid", inv: "INV-00023" },
            { date: "May 1, 2026", amount: "₹14,999", status: "Paid", inv: "INV-00022" },
          ].map(inv => (
            <div key={inv.inv} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
              <div>
                <p className="text-[#dbe2fd] text-sm">{inv.date}</p>
                <p className="text-[#c7c4d7] text-xs">{inv.inv}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#dbe2fd] font-semibold">{inv.amount}</span>
                <span className="text-[10px] bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-full font-bold">{inv.status}</span>
                <button className="text-[#c7c4d7] hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ── Security Tab ───────────────────────────────────────────────────────────

function SecurityTab() {
  const [twoFa, setTwoFa] = useState(false)

  return (
    <div className="space-y-5">
      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#dbe2fd] text-sm font-medium">Authenticator App (TOTP)</p>
            <p className="text-[#c7c4d7] text-xs mt-0.5">Use Google Authenticator or Authy</p>
          </div>
          <Toggle checked={twoFa} onChange={v => { setTwoFa(v); notify.success(v ? "2FA enabled" : "2FA disabled") }} />
        </div>
      </SectionCard>

      <SectionCard title="Sessions" description="Manage active sessions across devices">
        <div className="space-y-2">
          {[
            { device: "MacBook Pro — Chrome", location: "Mumbai, IN", active: true, lastSeen: "Now" },
            { device: "iPhone 15 — Safari", location: "Mumbai, IN", active: false, lastSeen: "2h ago" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[#c7c4d7]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {s.device.includes("iPhone") ? "smartphone" : "laptop_mac"}
                </span>
                <div>
                  <p className="text-[#dbe2fd] text-sm">{s.device}</p>
                  <p className="text-[#c7c4d7] text-xs">{s.location} · {s.lastSeen}</p>
                </div>
              </div>
              {s.active ? (
                <span className="text-[10px] bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-full font-bold">CURRENT</span>
              ) : (
                <button className="text-[#ffb4ab] text-xs hover:underline">Revoke</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => notify.success("All other sessions revoked")}
            className="text-[#ffb4ab] text-sm hover:text-white transition-colors"
          >
            Revoke all other sessions
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Audit Log" description="Recent account activity">
        <div className="space-y-2">
          {[
            { event: "Login", detail: "Chrome · Mumbai", time: "2 minutes ago", icon: "login" },
            { event: "Settings saved", detail: "Workspace name updated", time: "1 hour ago", icon: "settings" },
            { event: "Team invite sent", detail: "ananya@luxoroffice.com", time: "3 hours ago", icon: "person_add" },
            { event: "Integration connected", detail: "Meta Ads connected", time: "Yesterday", icon: "link" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03]">
              <span
                className="material-symbols-outlined text-sm text-[#c7c4d7]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >{log.icon}</span>
              <div className="flex-1">
                <p className="text-[#dbe2fd] text-sm">{log.event}</p>
                <p className="text-[#c7c4d7] text-xs">{log.detail}</p>
              </div>
              <span className="text-[#464554] text-xs">{log.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ── Notifications Tab ──────────────────────────────────────────────────────

interface NotifSettings {
  email_daily: boolean
  email_alerts: boolean
  email_reports: boolean
  whatsapp_alerts: boolean
  whatsapp_orders: boolean
  roas_threshold: string
  spend_threshold: string
  inventory_threshold: string
  rto_threshold: string
}

function NotificationsTab() {
  const [settings, setSettings] = useState<NotifSettings>({
    email_daily: true,
    email_alerts: true,
    email_reports: false,
    whatsapp_alerts: true,
    whatsapp_orders: false,
    roas_threshold: "2.5",
    spend_threshold: "5000",
    inventory_threshold: "10",
    rto_threshold: "20",
  })

  const toggleBool = (k: keyof NotifSettings) => {
    setSettings(s => ({ ...s, [k]: !s[k] }))
  }

  const setStr = (k: keyof NotifSettings, v: string) => {
    setSettings(s => ({ ...s, [k]: v }))
  }

  const CHANNEL_TOGGLES: Array<{ key: keyof NotifSettings; label: string; desc: string }> = [
    { key: "email_daily", label: "Daily Summary Email", desc: "8 AM digest of key metrics" },
    { key: "email_alerts", label: "Email Alerts", desc: "Threshold breach notifications" },
    { key: "email_reports", label: "Weekly Report Email", desc: "Monday performance review" },
    { key: "whatsapp_alerts", label: "WhatsApp Alerts", desc: "Critical alerts via WhatsApp Business" },
    { key: "whatsapp_orders", label: "WhatsApp Order Updates", desc: "New order notifications" },
  ]

  const THRESHOLDS: Array<{ key: keyof NotifSettings; label: string; suffix: string }> = [
    { key: "roas_threshold", label: "ROAS Alert Below", suffix: "x" },
    { key: "spend_threshold", label: "Spend Alert Above", suffix: "₹" },
    { key: "inventory_threshold", label: "Inventory Alert Below", suffix: "units" },
    { key: "rto_threshold", label: "RTO Alert Above", suffix: "%" },
  ]

  return (
    <div className="space-y-5">
      <SectionCard title="Channels" description="Choose how you receive notifications">
        {CHANNEL_TOGGLES.map(item => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-[#dbe2fd] text-sm">{item.label}</p>
              <p className="text-[#c7c4d7] text-xs mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              checked={settings[item.key] as boolean}
              onChange={() => toggleBool(item.key)}
            />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Alert Thresholds" description="Set custom thresholds for performance alerts">
        <div className="grid grid-cols-2 gap-4">
          {THRESHOLDS.map(item => (
            <div key={item.key}>
              <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">{item.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings[item.key] as string}
                  onChange={e => setStr(item.key, e.target.value)}
                  className="input-base flex-1"
                />
                <span className="text-[#c7c4d7] text-sm">{item.suffix}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton label="Save Thresholds" onClick={() => notify.success("Alert thresholds saved")} />
        </div>
      </SectionCard>
    </div>
  )
}

// ── API Tab ────────────────────────────────────────────────────────────────

function ApiTab() {
  const [keys] = useState([
    { id: "1", name: "Production", key: "go_live_sk_••••••••••••••••ab3f", created: "Jan 15, 2026", lastUsed: "1 minute ago", status: "active" },
    { id: "2", name: "Development", key: "go_dev_sk_••••••••••••••••2c91", created: "Mar 5, 2026", lastUsed: "2 days ago", status: "active" },
  ])
  const [copied, setCopied] = useState("")

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
    notify.success("API key copied")
  }

  return (
    <div className="space-y-5">
      <SectionCard title="API Keys" description="Use these keys to authenticate with the GrowthOS API">
        <div className="p-3 rounded-xl bg-[#7bd0ff]/5 border border-[#7bd0ff]/20 flex items-start gap-2">
          <span
            className="material-symbols-outlined text-[#7bd0ff] text-sm flex-shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >info</span>
          <p className="text-[#c7c4d7] text-xs">
            API keys grant full access to your workspace. Never share them publicly or commit to version control.
          </p>
        </div>
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="p-4 rounded-xl bg-white/[0.03] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[#dbe2fd] font-semibold text-sm">{k.name}</p>
                <span className="text-[10px] bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#060e20] text-[#7bd0ff] text-xs px-3 py-2 rounded-lg font-mono">{k.key}</code>
                <button
                  onClick={() => copy(k.key, k.id)}
                  className="text-[#c0c1ff] hover:text-white p-2 rounded-lg bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">{copied === k.id ? "check" : "content_copy"}</span>
                </button>
              </div>
              <p className="text-[#464554] text-[10px]">Created {k.created} · Last used {k.lastUsed}</p>
            </div>
          ))}
        </div>
        <button className="w-full border border-dashed border-[#464554] hover:border-[#c0c1ff]/40 rounded-xl py-3 text-[#c7c4d7] hover:text-[#c0c1ff] text-sm transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          Generate New API Key
        </button>
      </SectionCard>

      <SectionCard title="API Documentation" description="Learn how to use the GrowthOS API">
        <div className="flex gap-3">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex-1 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-center"
          >
            <span
              className="material-symbols-outlined text-[#c0c1ff] block mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >api</span>
            <p className="text-[#dbe2fd] text-sm font-medium">Swagger UI</p>
            <p className="text-[#c7c4d7] text-xs">Interactive API explorer</p>
          </a>
          <a
            href="http://localhost:8000/redoc"
            target="_blank"
            rel="noreferrer"
            className="flex-1 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-center"
          >
            <span
              className="material-symbols-outlined text-[#7bd0ff] block mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >description</span>
            <p className="text-[#dbe2fd] text-sm font-medium">ReDoc</p>
            <p className="text-[#c7c4d7] text-xs">Full API reference</p>
          </a>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  const tabContent: Record<string, React.ReactNode> = {
    profile: <ProfileTab />,
    workspace: <WorkspaceTab />,
    team: <TeamTab />,
    billing: <BillingTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    api: <ApiTab />,
  }

  return (
    <div className="flex gap-6 p-4 lg:p-7 h-full">
      {/* Sidebar tabs */}
      <div className="w-52 flex-shrink-0">
        <h1 className="text-lg font-bold text-[#dbe2fd] mb-5">Settings</h1>
        <nav className="space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                activeTab === tab.id
                  ? "bg-[#c0c1ff]/10 text-[#c0c1ff] font-medium"
                  : "text-[#c7c4d7] hover:text-[#dbe2fd] hover:bg-white/[0.03]"
              }`}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
              >{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tabContent[activeTab]}
      </div>
    </div>
  )
}
