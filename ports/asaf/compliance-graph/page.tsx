'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Search, Settings } from 'lucide-react'

import { PolicyEditor } from './policy-editor'
import { StagingGate } from './staging-gate'
import { EvidenceExport } from './evidence-export'
import { EnrollmentWizard } from './enrollment-wizard'

// ─── DAG demo data — real ASAF scan output ──────────────────────────────────
const DEMO_DAG = {
  meta: { tool_calls: 7, attestations: 7, findings: 4, controls_mapped: 12, session_id: 'asaf-demo-2026' },
  nodes: [
    { id:'p1', label:'ASAF Baseline Scan', type:'prompt', val:22, desc:'AdinKhepra ASAF initiated full Phase 4 assessment', ts:'02:43:01' },
    { id:'t1', label:'ert_scan', type:'tool', val:14, desc:'Enterprise Risk & Threat — STIG + NIST + CMMC', ts:'02:43:02', tool_args:{ target:'/etc', frameworks:['STIG','NIST800-53','CMMC'], output_format:'godfather' } },
    { id:'t2', label:'pqc_stig', type:'tool', val:12, desc:'PQC-01-STIG-V1R1 post-quantum readiness scan', ts:'02:43:04', tool_args:{ scan_path:'/etc', profile:'full' } },
    { id:'t3', label:'nist_map', type:'tool', val:10, desc:'Map findings → NIST 800-53 Rev 5 controls', ts:'02:43:05' },
    { id:'t4', label:'godfather_report', type:'tool', val:11, desc:'Godfather Report — dollar-denominated business impact', ts:'02:43:07' },
    { id:'t5', label:'cmmc_assess', type:'tool', val:10, desc:'CMMC Level 2 — 110 practice assessment', ts:'02:43:06' },
    { id:'f1', label:'RHEL-09-212030', type:'finding', severity:'CAT_I', val:18, desc:'No FIPS-validated crypto — exposed to Harvest-Now-Decrypt-Later', ts:'02:43:03', impact:'$2,400,000', remediation_cost:'$800', roi:'3000x', control: 'AC-17' },
    { id:'f2', label:'RHEL-09-431030', type:'finding', severity:'CAT_II', val:12, desc:'Audit logs not centrally collected — AU-2 FAIL', ts:'02:43:03', impact:'$420,000', remediation_cost:'$200', roi:'2100x', control: 'AU-2' },
    { id:'f3', label:'PQC-01-000010', type:'finding', severity:'CAT_I', val:16, desc:'ML-DSA-65 not implemented — CNSA 2.0 non-compliant', ts:'02:43:05', impact:'$3,800,000', remediation_cost:'$12,000', roi:'317x', control: 'SC-13' },
    { id:'f4', label:'PQC-01-000040', type:'finding', severity:'CAT_II', val:10, desc:'No hybrid classical/PQC key exchange during transition period', ts:'02:43:05', impact:'$890,000', remediation_cost:'$4,000', roi:'222x', control: 'SC-8' },
    { id:'c1', label:'NIST AC-17', type:'control', val:8, desc:'Remote Access controls', framework:'NIST 800-53 Rev 5' },
    { id:'c2', label:'NIST AU-2', type:'control', val:8, desc:'Audit Events — continuous monitoring', framework:'NIST 800-53 Rev 5' },
    { id:'c3', label:'NIST SC-13', type:'control', val:8, desc:'Cryptographic Protection — CNSA 2.0', framework:'NIST 800-53 Rev 5' },
    { id:'c4', label:'CMMC CA.2.158', type:'control', val:7, desc:'Periodically assess security controls', framework:'CMMC Level 2' },
    { id:'c5', label:'CNSA 2.0 ML-DSA', type:'control', val:9, desc:'NSA CNSA 2.0 — ML-DSA-65 required by 2030', framework:'NSA CNSA 2.0' },
    { id:'c6', label:'FIPS 204', type:'control', val:8, desc:'Module-Lattice Digital Signature Standard', framework:'NIST FIPS 204' },
    { id:'c7', label:'NIST SC-8', type:'control', val:7, desc:'Transmission Confidentiality and Integrity', framework:'NIST 800-53 Rev 5' },
    { id:'a1', label:'ML-DSA-65 · ert_scan', type:'attest', val:6, desc:'Attestation on ert_scan', sig:'3d7f2a9b1e4c8f0a6b2d5e8f1a3c7b9d2e5f8a1b4c6d9e2f', ts:'02:43:02' },
    { id:'a2', label:'ML-DSA-65 · pqc_stig', type:'attest', val:6, desc:'Attestation on pqc_stig', sig:'8f1a3c7b9d2e5f8a1b3d7f2a9b1e4c8f0a6b2d5e8c1f3a7', ts:'02:43:04' },
    { id:'a3', label:'ML-DSA-65 · godfather', type:'attest', val:6, desc:'Attestation on Godfather Report', sig:'1b3d7f2a9b1e4c8f0a6b2d5e8f1a3c7b9d2e5f8a4c7b2e9', ts:'02:43:07' },
  ],
  links: [
    { source:'p1', target:'t1', w:3 }, { source:'p1', target:'t2', w:2 },
    { source:'t1', target:'f1', w:2 }, { source:'t1', target:'f2', w:2 },
    { source:'t2', target:'f3', w:2 }, { source:'t2', target:'f4', w:2 },
    { source:'t1', target:'t3', w:1 }, { source:'t3', target:'c1', w:1 },
    { source:'t3', target:'c2', w:1 }, { source:'t3', target:'c7', w:1 },
    { source:'t2', target:'c3', w:2 }, { source:'t2', target:'c5', w:2 },
    { source:'t2', target:'c6', w:2 }, { source:'f1', target:'c1', w:1 },
    { source:'f2', target:'c2', w:1 }, { source:'f3', target:'c5', w:2 },
    { source:'f4', target:'c3', w:1 }, { source:'t4', target:'f1', w:1 },
    { source:'t4', target:'f2', w:1 }, { source:'t4', target:'f3', w:1 },
    { source:'t1', target:'t4', w:1 }, { source:'t5', target:'c4', w:1 },
    { source:'t1', target:'a1', w:1 }, { source:'t2', target:'a2', w:1 },
    { source:'t4', target:'a3', w:1 }, { source:'f3', target:'c6', w:1 },
  ]
}

const NODE_COLORS: Record<string, string> = {
  prompt:          '#818cf8',
  tool:            '#e5a54b',
  finding_CAT_I:   '#cc2a36',
  finding_CAT_II:  '#f97316',
  control:         '#22c55e',
  attest:          '#06b6d4',
  default:         '#3d5a78',
}

function nodeColor(n: any) {
  if (n.type === 'finding') return NODE_COLORS['finding_' + n.severity] ?? '#cc2a36'
  return NODE_COLORS[n.type] ?? NODE_COLORS.default
}
function nodeVal(n: any) {
  if (n.type === 'prompt') return 22
  if (n.type === 'finding' && n.severity === 'CAT_I') return 18
  if (n.type === 'finding' && n.severity === 'CAT_II') return 13
  return n.val ?? 6
}

function LiveDAGDemo({ onNodeClick, selectedNode }: { onNodeClick: (n: any) => void, selectedNode: any }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const selectedNodeRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Keep ref in sync without triggering useEffect
  useEffect(() => {
    selectedNodeRef.current = selectedNode
    // Force graph to re-evaluate node colors/sizes
    if (graphRef.current) {
      graphRef.current
        .nodeColor(graphRef.current.nodeColor())
        .nodeVal(graphRef.current.nodeVal())
    }
  }, [selectedNode])

  useEffect(() => {
    let attempts = 0
    const poll = setInterval(() => {
      if ((window as any).ForceGraph3D) { setReady(true); clearInterval(poll) }
      if (++attempts > 40) clearInterval(poll)
    }, 250)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (!ready || !mountRef.current) return
    const FG = (window as any).ForceGraph3D

    const el = mountRef.current
    el.innerHTML = ''

    const g = FG()(el)
      .backgroundColor('rgba(0,0,0,0)')
      .width(el.clientWidth)
      .height(el.clientHeight)
      .graphData({ nodes: DEMO_DAG.nodes, links: DEMO_DAG.links })
      .nodeId('id')
      .nodeLabel((n: any) => {
        const col = nodeColor(n)
        return `<div style="border-left:2px solid ${col};padding-left:8px;font-family:'JetBrains Mono',monospace;background:rgba(8,15,28,0.85);backdrop-filter:blur(4px);padding:8px;border-radius:4px;">
          <div style="color:${col};font-weight:700;font-size:12px">${n.label}</div>
          <div style="color:#6b8aaa;font-size:9px;letter-spacing:1px">${n.type.toUpperCase()}${n.severity ? ' · ' + n.severity : ''}</div>
          <div style="color:#e0eaf5;font-size:11px;margin-top:4px">${n.desc ?? ''}</div>
          ${n.impact ? `<div style="color:#e5a54b;font-size:13px;font-weight:700;margin-top:6px">💥 ${n.impact} exposure</div>` : ''}
        </div>`
      })
      .nodeColor((n: any) => {
        const isSelected = selectedNodeRef.current?.id === n.id
        return isSelected ? '#ffffff' : nodeColor(n)
      })
      .nodeVal((n: any) => {
        const isSelected = selectedNodeRef.current?.id === n.id
        return isSelected ? (nodeVal(n) * 1.5) : nodeVal(n)
      })
      .nodeOpacity(0.95)
      .nodeResolution(18)
      .linkColor(() => '#1a4f7a')
      .linkOpacity(0.40)
      .linkWidth((l: any) => 0.5 + (l.w ?? 1) * 0.5)
      .linkDirectionalParticles((l: any) => (l.w ?? 1) > 1 ? 3 : 1)
      .linkDirectionalParticleColor(() => '#1a9fe8')
      .linkDirectionalParticleWidth(1.2)
      .linkDirectionalParticleSpeed(0.005)
      .onNodeClick((n: any) => {
        onNodeClick(n)
        const dist = 140
        const dr = 1 + dist / Math.hypot(n.x ?? 1, n.y ?? 1, n.z ?? 1)
        g.cameraPosition({ x: (n.x ?? 0) * dr, y: (n.y ?? 0) * dr, z: (n.z ?? 0) * dr }, n, 700)
      })
      .onNodeHover((n: any) => { el.style.cursor = n ? 'pointer' : 'default' })

    g.d3Force('charge')?.strength?.(-120)
    g.d3Force('link')?.distance?.(40)
    setTimeout(() => g.zoomToFit(400, 80), 1200)

    graphRef.current = g

    const onResize = () => { if (graphRef.current) { g.width(el.clientWidth).height(el.clientHeight) } }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); g._destructor?.() }
  }, [ready, onNodeClick])

  return (
    <div ref={mountRef} className="w-full h-full">
      {!ready && (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#4EAEF5]/30 border-t-[#4EAEF5] rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-500">Initializing DAG Engine…</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComplianceGraphPage() {
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const handleApprove = () => {
    // In a real implementation, this would mark the finding as remediated
    // and update the DAG visualization and node colors.
    alert(`Remediation for ${selectedNode?.label} applied to production!`)
  }

  // Calculate total exposure
  const totalExposure = DEMO_DAG.nodes
    .filter(n => n.type === 'finding' && (n as any).impact)
    .reduce((sum, n) => sum + parseInt(((n as any).impact).replace(/\$|,/g, '')), 0)

  return (
    <div className="min-h-screen bg-[#050c16] text-white flex flex-col font-sans">
      <Script
        src="https://unpkg.com/3d-force-graph@1.73.4/dist/3d-force-graph.min.js"
        strategy="afterInteractive"
      />

      {/* Top Navbar */}
      <header className="h-16 border-b border-[#1a9fe8]/20 bg-[#080f1c]/80 backdrop-blur-md flex items-center justify-between px-6 z-30 relative">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-700/50" />
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#1a9fe8]" />
            <h1 className="font-bold text-lg tracking-tight">Compliance Graph UI</h1>
            <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-mono text-[#1a9fe8] border border-[#1a9fe8]/30 bg-[#1a9fe8]/10">
              v1.5
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1a9fe8]/10 hover:bg-[#1a9fe8]/20 border border-[#1a9fe8]/30 transition-colors text-sm font-bold text-[#4EAEF5]"
          >
            <Search className="w-4 h-4" />
            Connect Environment
          </button>
          
          <div className="h-6 w-px bg-slate-700/50 hidden md:block" />

          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Total Exposure</span>
            <span className="font-black text-[#cc2a36]">${totalExposure.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 hidden md:flex">
            <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="font-mono text-xs text-[#22c55e] font-bold">SOVEREIGN DAG</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-[#1a9fe8]/20 bg-[#080f1c]/60 flex flex-col z-20 overflow-y-auto">
          <div className="p-5 flex-1 flex flex-col gap-5">
            <StagingGate node={selectedNode} onApprove={handleApprove} />
            <EvidenceExport dagState={DEMO_DAG} />
          </div>
        </aside>

        {/* Center: 3D Graph */}
        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1c33] via-[#050c16] to-[#050c16]">
          <LiveDAGDemo onNodeClick={setSelectedNode} selectedNode={selectedNode} />
          
          <div className="absolute bottom-6 left-6 pointer-events-none bg-[#050c16]/80 backdrop-blur p-3 rounded-xl border border-slate-800">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Controls Mapped</div>
            <div className="flex items-center gap-2">
              <span className="text-[#06b6d4] font-bold text-lg">{DEMO_DAG.meta.controls_mapped}</span>
              <span className="text-slate-400 text-xs">/ 110 (CMMC L2)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Policy Editor */}
        <aside className="w-[400px] border-l border-[#1a9fe8]/20 bg-[#080f1c]/60 flex flex-col z-20">
          <div className="flex-1 p-5">
            <PolicyEditor node={selectedNode} />
          </div>
        </aside>
      </main>

      {/* Connect Environment Modal - Replaced with Enrollment Wizard */}
      {showConnectModal && (
        <EnrollmentWizard onClose={() => setShowConnectModal(false)} />
      )}
    </div>
  )
}
