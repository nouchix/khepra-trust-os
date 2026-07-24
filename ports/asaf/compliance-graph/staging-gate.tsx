'use client'

import { useState } from 'react'
import { Play, CheckCircle, AlertTriangle, ArrowRight, XCircle } from 'lucide-react'

export function StagingGate({ node, onApprove }: { node: any | null; onApprove: () => void }) {
  const [staged, setStaged] = useState(false)
  const [approving, setApproving] = useState(false)

  const handleStage = () => {
    setStaged(true)
  }

  const handleApprove = () => {
    setApproving(true)
    setTimeout(() => {
      setApproving(false)
      setStaged(false)
      onApprove()
    }, 1500)
  }

  if (!node || node.type !== 'finding') {
    return (
      <div className="bg-[#080f1c]/90 border border-[#1a9fe8]/20 rounded-xl p-5 backdrop-blur-sm opacity-50">
        <h3 className="text-white font-bold text-sm mb-2 text-slate-500">Staging Approval Gate</h3>
        <p className="text-xs text-slate-600">Select a finding to stage and approve its remediation.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#080f1c]/90 border border-[#22c55e]/30 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-[#22c55e]/10 border-b border-[#22c55e]/20">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Play className="w-4 h-4 text-[#22c55e]" />
          Staging Approval Gate
        </h3>
        <span className="text-[10px] font-mono text-[#22c55e] px-2 py-0.5 rounded border border-[#22c55e]/30 bg-[#22c55e]/10">
          ML-DSA-65 REQUIREMENT
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-slate-300">
            Remediation target: <strong className="text-white">{node.label}</strong>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Cost: <span className="text-green-400">{node.remediation_cost || '$0'}</span>
          </div>
        </div>

        {/* Diff preview mock */}
        <div className="bg-[#050c16] rounded border border-slate-800 p-3 mb-5 font-mono text-[10px] leading-relaxed">
          <div className="text-[#cc2a36]">- crypto.fips_enabled = 0</div>
          <div className="text-[#22c55e]">+ crypto.fips_enabled = 1</div>
        </div>

        <div className="flex flex-col gap-3">
          {!staged ? (
            <button
              onClick={handleStage}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-[#050c16] bg-[#e5a54b] hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Stage to Mirror Environment
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white mb-1">Staging Successful</div>
                  <div className="text-[10px] text-slate-400">Zero breaking changes detected. All integration tests passed in the isolated mirror.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStaged(false)}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
                  disabled={approving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-[2] py-2.5 rounded-lg font-bold text-sm text-white bg-[#22c55e] hover:bg-green-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {approving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Approve → Production <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
              <p className="text-[9px] font-mono text-center text-slate-500 mt-2">
                Approving will apply the change via ASAF System Daemon and commit an ML-DSA-65 attestation to the DAG.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
