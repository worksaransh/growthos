"use client"

import { useState } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

type NodeType = "trigger" | "condition" | "action" | "delay" | "split"

interface WorkflowNode {
  id: string
  type: NodeType
  title: string
  subtitle: string
  icon: string
  color: string
  x: number
  y: number
  config: Record<string, string | number>
}

interface WorkflowEdge {
  id: string
  fromId: string
  toId: string
  label?: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// ── Templates ──────────────────────────────────────────────────────────────

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "roas_guard",
    name: "ROAS Guard",
    description: "Auto-pause campaigns when ROAS drops",
    icon: "shield",
    nodes: [
      { id: "t1", type: "trigger", title: "ROAS Drops", subtitle: "Below 2.5x threshold", icon: "trending_down", color: "#ffb4ab", x: 100, y: 200, config: { threshold: 2.5 } },
      { id: "c1", type: "condition", title: "Check Duration", subtitle: "For more than 2 hours", icon: "schedule", color: "#fb923c", x: 350, y: 200, config: { hours: 2 } },
      { id: "a1", type: "action", title: "Pause Campaign", subtitle: "Via Meta Ads API", icon: "pause_circle", color: "#7bd0ff", x: 600, y: 160, config: {} },
      { id: "a2", type: "action", title: "Send Alert", subtitle: "WhatsApp + Email", icon: "notifications", color: "#ddb7ff", x: 600, y: 260, config: {} },
    ],
    edges: [
      { id: "e1", fromId: "t1", toId: "c1" },
      { id: "e2", fromId: "c1", toId: "a1" },
      { id: "e3", fromId: "c1", toId: "a2" },
    ],
  },
  {
    id: "cart_recovery",
    name: "Cart Recovery",
    description: "Recover abandoned carts via WhatsApp",
    icon: "shopping_cart",
    nodes: [
      { id: "t1", type: "trigger", title: "Cart Abandoned", subtitle: "After 30 minutes", icon: "shopping_cart", color: "#c0c1ff", x: 100, y: 200, config: { minutes: 30 } },
      { id: "d1", type: "delay", title: "Wait 1 Hour", subtitle: "Before first message", icon: "timer", color: "#464554", x: 350, y: 200, config: { hours: 1 } },
      { id: "a1", type: "action", title: "WhatsApp Message", subtitle: "Cart recovery template", icon: "chat", color: "#4ade80", x: 600, y: 200, config: { template: "cart_recovery" } },
      { id: "c1", type: "condition", title: "Did They Buy?", subtitle: "Check order in 24h", icon: "check_circle", color: "#fb923c", x: 850, y: 200, config: { hours: 24 } },
      { id: "a2", type: "action", title: "Send Discount", subtitle: "10% off coupon", icon: "local_offer", color: "#ddb7ff", x: 1100, y: 200, config: { discount: 10 } },
    ],
    edges: [
      { id: "e1", fromId: "t1", toId: "d1" },
      { id: "e2", fromId: "d1", toId: "a1" },
      { id: "e3", fromId: "a1", toId: "c1" },
      { id: "e4", fromId: "c1", toId: "a2", label: "No" },
    ],
  },
  {
    id: "inventory_alert",
    name: "Low Inventory Alert",
    description: "Alert team when stock runs low",
    icon: "inventory",
    nodes: [
      { id: "t1", type: "trigger", title: "Low Stock", subtitle: "Below 10 units", icon: "inventory_2", color: "#ffb4ab", x: 100, y: 200, config: { threshold: 10 } },
      { id: "a1", type: "action", title: "Notify Team", subtitle: "WhatsApp alert", icon: "group", color: "#7bd0ff", x: 350, y: 160, config: {} },
      { id: "a2", type: "action", title: "Create PO", subtitle: "Draft purchase order", icon: "description", color: "#ddb7ff", x: 350, y: 260, config: {} },
    ],
    edges: [
      { id: "e1", fromId: "t1", toId: "a1" },
      { id: "e2", fromId: "t1", toId: "a2" },
    ],
  },
  {
    id: "win_back",
    name: "Win-Back Campaign",
    description: "Re-engage customers inactive 60+ days",
    icon: "replay",
    nodes: [
      { id: "t1", type: "trigger", title: "Customer Inactive", subtitle: "60+ days no order", icon: "person_off", color: "#c0c1ff", x: 100, y: 200, config: { days: 60 } },
      { id: "a1", type: "action", title: "Win-Back Email", subtitle: "Personalised template", icon: "email", color: "#7bd0ff", x: 350, y: 200, config: {} },
      { id: "d1", type: "delay", title: "Wait 3 Days", subtitle: "", icon: "timer", color: "#464554", x: 600, y: 200, config: { days: 3 } },
      { id: "a2", type: "action", title: "WhatsApp Offer", subtitle: "15% discount coupon", icon: "local_offer", color: "#4ade80", x: 850, y: 200, config: { discount: 15 } },
    ],
    edges: [
      { id: "e1", fromId: "t1", toId: "a1" },
      { id: "e2", fromId: "a1", toId: "d1" },
      { id: "e3", fromId: "d1", toId: "a2" },
    ],
  },
]

// ── Node palette ───────────────────────────────────────────────────────────

const NODE_PALETTE = [
  { type: "trigger" as NodeType, label: "Trigger", icon: "bolt", color: "#c0c1ff" },
  { type: "condition" as NodeType, label: "Condition", icon: "call_split", color: "#fb923c" },
  { type: "action" as NodeType, label: "Action", icon: "play_arrow", color: "#7bd0ff" },
  { type: "delay" as NodeType, label: "Delay", icon: "timer", color: "#464554" },
]

const TRIGGER_OPTIONS = [
  { value: "roas_below", label: "ROAS drops below threshold", icon: "trending_down" },
  { value: "cart_abandoned", label: "Cart abandoned", icon: "shopping_cart" },
  { value: "inventory_low", label: "Inventory below threshold", icon: "inventory_2" },
  { value: "order_created", label: "New order created", icon: "receipt_long" },
  { value: "rto_high", label: "RTO rate exceeds limit", icon: "local_shipping" },
  { value: "customer_inactive", label: "Customer inactive N days", icon: "person_off" },
  { value: "revenue_drop", label: "Daily revenue drops", icon: "trending_down" },
  { value: "new_customer", label: "First order placed", icon: "person_add" },
]

const ACTION_OPTIONS = [
  { value: "pause_campaign", label: "Pause ad campaign", icon: "pause_circle" },
  { value: "increase_budget", label: "Increase budget by %", icon: "trending_up" },
  { value: "send_whatsapp", label: "Send WhatsApp message", icon: "chat" },
  { value: "send_email", label: "Send email", icon: "email" },
  { value: "create_task", label: "Create team task", icon: "task_alt" },
  { value: "apply_tag", label: "Tag customer", icon: "label" },
  { value: "send_coupon", label: "Send discount coupon", icon: "local_offer" },
  { value: "notify_team", label: "Notify team", icon: "group" },
  { value: "create_po", label: "Create purchase order", icon: "description" },
]

// ── Node Card Component ────────────────────────────────────────────────────

function NodeCard({ node, selected, onClick, onDelete }: {
  node: WorkflowNode
  selected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const typeLabels: Record<NodeType, string> = {
    trigger: "TRIGGER", condition: "CONDITION", action: "ACTION", delay: "DELAY", split: "SPLIT"
  }

  return (
    <div
      onClick={onClick}
      className={`absolute cursor-pointer select-none transition-all duration-150 group ${selected ? "scale-105" : ""}`}
      style={{ left: node.x, top: node.y, width: 200 }}
    >
      <div className={`glass-card rounded-2xl p-4 border-2 transition-all ${selected ? "border-[#c0c1ff]/60 shadow-lg shadow-[#c0c1ff]/10" : "border-white/10 hover:border-white/20"}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: node.color + "20" }}>
              <span className="material-symbols-outlined text-sm" style={{ color: node.color, fontVariationSettings: "'FILL' 1" }}>
                {node.icon}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: node.color }}>
              {typeLabels[node.type]}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-[#464554] hover:text-[#ffb4ab] transition-colors opacity-0 group-hover:opacity-100 text-xs"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <p className="text-[#dbe2fd] font-semibold text-sm leading-tight">{node.title}</p>
        <p className="text-[#c7c4d7] text-xs mt-0.5 leading-snug">{node.subtitle}</p>

        {/* Connection dot right */}
        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#464554] border-2 border-[#0b1326] hover:bg-[#c0c1ff] transition-colors" />
        {/* Connection dot left */}
        {node.type !== "trigger" && (
          <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#464554] border-2 border-[#0b1326]" />
        )}
      </div>
    </div>
  )
}

// ── SVG Arrows ────────────────────────────────────────────────────────────

function WorkflowEdges({ nodes, edges }: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#464554" />
        </marker>
      </defs>
      {edges.map(edge => {
        const from = nodeMap[edge.fromId]
        const to = nodeMap[edge.toId]
        if (!from || !to) return null
        const x1 = from.x + 206
        const y1 = from.y + 52
        const x2 = to.x - 6
        const y2 = to.y + 52
        const cx = (x1 + x2) / 2
        return (
          <g key={edge.id}>
            <path
              d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="#464554"
              strokeWidth="1.5"
              strokeDasharray={edge.label ? "5 3" : undefined}
              markerEnd="url(#arrowhead)"
            />
            {edge.label && (
              <text x={cx} y={Math.min(y1,y2) - 4} textAnchor="middle" fill="#c7c4d7" fontSize="10">
                {edge.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState([
    { id: "wf1", name: "ROAS Guard", status: "active", executions: 142, lastRun: "12m ago", template: "roas_guard" },
    { id: "wf2", name: "Cart Recovery", status: "active", executions: 89, lastRun: "3h ago", template: "cart_recovery" },
    { id: "wf3", name: "Low Inventory Alert", status: "paused", executions: 34, lastRun: "2d ago", template: "inventory_alert" },
  ])
  const [view, setView] = useState<"list" | "builder">("list")
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTemplate | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [edges, setEdges] = useState<WorkflowEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState("New Workflow")

  const openTemplate = (templateId: string) => {
    const t = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0]
    setActiveWorkflow(t)
    setNodes(t.nodes)
    setEdges(t.edges)
    setWorkflowName(t.name)
    setView("builder")
  }

  const openNew = () => {
    setActiveWorkflow(null)
    setNodes([{ id: "t1", type: "trigger", title: "Choose Trigger", subtitle: "Click to configure", icon: "bolt", color: "#c0c1ff", x: 100, y: 180, config: {} }])
    setEdges([])
    setWorkflowName("New Workflow")
    setView("builder")
  }

  const deleteNode = (id: string) => {
    setNodes(n => n.filter(x => x.id !== id))
    setEdges(e => e.filter(x => x.fromId !== id && x.toId !== id))
    setSelectedNode(null)
  }

  const addNode = (type: NodeType) => {
    const id = `node_${Date.now()}`
    const newNode: WorkflowNode = {
      id, type,
      title: type === "trigger" ? "New Trigger" : type === "condition" ? "New Condition" : type === "delay" ? "Delay" : "New Action",
      subtitle: "Click to configure",
      icon: type === "trigger" ? "bolt" : type === "condition" ? "call_split" : type === "delay" ? "timer" : "play_arrow",
      color: NODE_PALETTE.find(p => p.type === type)?.color || "#c0c1ff",
      x: 80 + nodes.length * 250,
      y: 180,
      config: {},
    }
    setNodes(n => [...n, newNode])

    // Auto-connect to last node
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1]
      setEdges(e => [...e, { id: `e_${Date.now()}`, fromId: lastNode.id, toId: id }])
    }
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode)

  if (view === "list") {
    return (
      <div className="p-4 lg:p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#dbe2fd]">Automation Workflows</h1>
            <p className="text-[#c7c4d7] text-sm mt-1">Build and manage AI-powered automations for your D2C business</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openNew} className="primary-gradient text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>add</span>
              New Workflow
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#918f9a] mb-4">Templates</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => openTemplate(t.id)} className="glass-card rounded-2xl p-4 text-left hover:border-[#c0c1ff]/30 border border-white/10 transition-all hover:-translate-y-0.5 group">
                <span className="material-symbols-outlined text-[#c0c1ff] mb-3 block" style={{fontVariationSettings:"'FILL' 1"}}>{t.icon}</span>
                <h3 className="text-[#dbe2fd] font-semibold text-sm mb-1">{t.name}</h3>
                <p className="text-[#c7c4d7] text-xs leading-snug">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Active workflows */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#918f9a] mb-4">Active Workflows</h2>
          <div className="space-y-3">
            {workflows.map(wf => (
              <div key={wf.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${wf.status === "active" ? "bg-[#4ade80]" : "bg-[#fb923c]"}`} />
                  <div>
                    <p className="text-[#dbe2fd] font-semibold text-sm">{wf.name}</p>
                    <p className="text-[#c7c4d7] text-xs">{wf.executions} executions · Last run {wf.lastRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${wf.status === "active" ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#fb923c]/10 text-[#fb923c]"}`}>
                    {wf.status.toUpperCase()}
                  </span>
                  <button onClick={() => openTemplate(wf.template)} className="text-[#c0c1ff] hover:text-white text-xs border border-[#c0c1ff]/30 px-3 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setWorkflows(w => w.map(x => x.id === wf.id ? {...x, status: x.status === "active" ? "paused" : "active"} : x))}
                    className="text-[#c7c4d7] hover:text-white text-xs border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    {wf.status === "active" ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Builder view
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Builder toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#464554]/30 bg-[#0b1326]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setView("list")} className="text-[#c7c4d7] hover:text-white flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
          <input
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            className="bg-transparent text-[#dbe2fd] font-semibold text-base border-b border-transparent hover:border-[#464554] focus:border-[#c0c1ff] outline-none px-1 transition-colors"
          />
        </div>

        {/* Node palette */}
        <div className="flex items-center gap-2">
          {NODE_PALETTE.map(p => (
            <button key={p.type} onClick={() => addNode(p.type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#c0c1ff]/30 text-[#c7c4d7] hover:text-white text-xs transition-all">
              <span className="material-symbols-outlined text-sm" style={{ color: p.color, fontVariationSettings:"'FILL' 1" }}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg border border-white/10 text-[#c7c4d7] text-sm hover:text-white transition-colors">
            Test Run
          </button>
          <button
            onClick={() => {
              setWorkflows(w => [...w, { id: `wf${Date.now()}`, name: workflowName, status: "active", executions: 0, lastRun: "Never", template: "custom" }])
              setView("list")
            }}
            className="primary-gradient text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Save & Activate
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-[#060e20]"
          style={{ backgroundImage: "radial-gradient(circle, #464554 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          <div className="relative" style={{ minWidth: 1400, minHeight: 600 }}>
            <WorkflowEdges nodes={nodes} edges={edges} />
            {nodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                selected={selectedNode === node.id}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                onDelete={() => deleteNode(node.id)}
              />
            ))}
          </div>
        </div>

        {/* Properties panel */}
        {selectedNodeData && (
          <div className="w-72 border-l border-[#464554]/30 bg-[#0b1326]/80 backdrop-blur-sm p-4 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#dbe2fd] font-semibold text-sm">Node Properties</h3>
              <button onClick={() => setSelectedNode(null)} className="text-[#c7c4d7] hover:text-white">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Node Type</label>
                <div className="flex items-center gap-2 glass-card rounded-lg p-2">
                  <span className="material-symbols-outlined text-sm" style={{ color: selectedNodeData.color, fontVariationSettings:"'FILL' 1" }}>{selectedNodeData.icon}</span>
                  <span className="text-[#dbe2fd] text-sm capitalize">{selectedNodeData.type}</span>
                </div>
              </div>

              {selectedNodeData.type === "trigger" && (
                <div>
                  <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Trigger Event</label>
                  <select className="w-full input-base text-sm"
                    onChange={e => {
                      const opt = TRIGGER_OPTIONS.find(o => o.value === e.target.value)
                      setNodes(n => n.map(x => x.id === selectedNodeData.id ? { ...x, title: opt?.label || x.title, config: { ...x.config, trigger: e.target.value } } : x))
                    }}>
                    {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}

              {selectedNodeData.type === "action" && (
                <div>
                  <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Action</label>
                  <select className="w-full input-base text-sm"
                    onChange={e => {
                      const opt = ACTION_OPTIONS.find(o => o.value === e.target.value)
                      setNodes(n => n.map(x => x.id === selectedNodeData.id ? { ...x, title: opt?.label || x.title, config: { ...x.config, action: e.target.value } } : x))
                    }}>
                    {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}

              {selectedNodeData.type === "delay" && (
                <div>
                  <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Wait Duration</label>
                  <div className="flex gap-2">
                    <input type="number" defaultValue={1} min={1} className="input-base w-20 text-sm" />
                    <select className="input-base flex-1 text-sm">
                      <option>Minutes</option>
                      <option>Hours</option>
                      <option>Days</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-[#c7c4d7] uppercase tracking-wide mb-1.5 block">Label</label>
                <input
                  className="w-full input-base text-sm"
                  defaultValue={selectedNodeData.title}
                  onChange={e => setNodes(n => n.map(x => x.id === selectedNodeData.id ? { ...x, title: e.target.value } : x))}
                />
              </div>

              <button
                onClick={() => deleteNode(selectedNodeData.id)}
                className="w-full py-2 rounded-lg border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm hover:bg-[#ffb4ab]/10 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
