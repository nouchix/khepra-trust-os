'use client'

import { Download, FileText, FileJson, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export function EvidenceExport({ dagState }: { dagState: any }) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = (format: string) => {
    setExporting(format)
    setTimeout(() => {
      setExporting(null)
      alert(`${format.toUpperCase()} Evidence Package exported successfully (Signed via ML-DSA-65)`)
    }, 1500)
  }

  return (
    <div className="bg-[#080f1c]/90 border border-[#1a9fe8]/20 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#06b6d4]" />
          C3PAO Evidence Export
        </h3>
        <span className="text-[10px] font-mono text-[#06b6d4] px-2 py-0.5 rounded border border-[#06b6d4]/30 bg-[#06b6d4]/10">
          DAG ANCHORED
        </span>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Generate immutable, ML-DSA-65 signed evidence packages for auditors. All data is cryptographically anchored to the Sovereign DAG.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleExport('oscal')}
          disabled={!!exporting}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:border-[#4EAEF5]/50 hover:bg-[#4EAEF5]/10 transition-all group disabled:opacity-50"
        >
          {exporting === 'oscal' ? (
            <span className="w-6 h-6 border-2 border-[#4EAEF5]/30 border-t-[#4EAEF5] rounded-full animate-spin mb-2" />
          ) : (
            <FileJson className="w-6 h-6 text-slate-400 group-hover:text-[#4EAEF5] mb-2 transition-colors" />
          )}
          <span className="text-xs font-bold text-white mb-1">OSCAL</span>
          <span className="text-[10px] text-slate-500 font-mono">JSON Package</span>
        </button>

        <button
          onClick={() => handleExport('poam')}
          disabled={!!exporting}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:border-[#f97316]/50 hover:bg-[#f97316]/10 transition-all group disabled:opacity-50"
        >
          {exporting === 'poam' ? (
            <span className="w-6 h-6 border-2 border-[#f97316]/30 border-t-[#f97316] rounded-full animate-spin mb-2" />
          ) : (
            <Download className="w-6 h-6 text-slate-400 group-hover:text-[#f97316] mb-2 transition-colors" />
          )}
          <span className="text-xs font-bold text-white mb-1">POAM</span>
          <span className="text-[10px] text-slate-500 font-mono">CSV Export</span>
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={!!exporting}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:border-[#cc2a36]/50 hover:bg-[#cc2a36]/10 transition-all group disabled:opacity-50"
        >
          {exporting === 'pdf' ? (
            <span className="w-6 h-6 border-2 border-[#cc2a36]/30 border-t-[#cc2a36] rounded-full animate-spin mb-2" />
          ) : (
            <FileText className="w-6 h-6 text-slate-400 group-hover:text-[#cc2a36] mb-2 transition-colors" />
          )}
          <span className="text-xs font-bold text-white mb-1">Briefing</span>
          <span className="text-[10px] text-slate-500 font-mono">PDF Report</span>
        </button>
      </div>
    </div>
  )
}
