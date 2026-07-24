'use client'

import { Terminal, ShieldAlert, Cpu } from 'lucide-react'

export function PolicyEditor({ node }: { node: any | null }) {
  if (!node || node.type !== 'finding') {
    return (
      <div className="bg-[#080f1c]/90 border border-[#1a9fe8]/20 rounded-xl p-5 backdrop-blur-sm h-full flex flex-col items-center justify-center text-center text-slate-500">
        <Terminal className="w-8 h-8 mb-3 text-slate-600 opacity-50" />
        <p className="text-sm">Select a <span className="text-[#cc2a36] font-bold">failing node</span><br />to edit its ASAF Policy Declaration.</p>
      </div>
    )
  }

  // Generate a mock APDL syntax block for the selected finding
  const frameworkMap: Record<string, string> = {
    'RHEL-09-212030': '@framework(STIG.RHEL9) @tier(Sovereign) @gate(human)',
    'RHEL-09-431030': '@framework(STIG.RHEL9) @tier(Sovereign) @gate(auto)',
    'PQC-01-000010': '@framework(NSA.CNSA2) @tier(Sovereign) @gate(human)',
    'PQC-01-000040': '@framework(NSA.CNSA2) @tier(Sovereign) @gate(human)',
  }
  
  const header = frameworkMap[node.label] || '@framework(CMMC.L2) @tier(Sovereign) @gate(human)'
  const controlRef = node.control || 'AC-2'

  const apdlCode = `${header}
@symbol(Eban)
control ${controlRef} {
  # Auto-generated remediation for ${node.label}
  require: sysctl
  apply: crypto.fips_enabled = 1
  maps: NIST.${controlRef}, CCI-000068
  signature: ML-DSA-65
}`

  return (
    <div className="bg-[#080f1c]/90 border border-[#1a9fe8]/20 rounded-xl flex flex-col h-full backdrop-blur-sm overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a9fe8]/15 bg-[#050c16]">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#e5a54b]" />
          ASAF Policy Editor
        </h3>
        <span className="text-[10px] font-mono text-[#e5a54b] px-2 py-0.5 rounded border border-[#e5a54b]/30 bg-[#e5a54b]/10">
          APDL ENGINE
        </span>
      </div>
      
      <div className="flex-1 p-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-2 pointer-events-none">
          <ShieldAlert className="w-4 h-4 text-[#cc2a36]/50" />
        </div>
        
        {/* Mock Syntax Highlighter textarea */}
        <textarea 
          className="w-full h-full bg-transparent text-[#e0eaf5] p-5 font-mono text-xs leading-loose resize-none focus:outline-none focus:ring-1 focus:ring-[#1a9fe8]/50"
          value={apdlCode}
          readOnly
        />
      </div>
      
      <div className="px-4 py-3 border-t border-[#1a9fe8]/15 bg-[#050c16] flex justify-between items-center">
        <span className="text-[10px] font-mono text-slate-500">APDL v1.2.0 • ML-DSA-65 Validated</span>
        <button className="px-3 py-1.5 text-xs font-bold text-[#050c16] bg-[#1a9fe8] hover:bg-[#4EAEF5] transition-colors rounded">
          Save Declaration
        </button>
      </div>
    </div>
  )
}
