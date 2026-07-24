'use client'

import { useState } from 'react'
import { Search, FileText, Monitor, Plus, X, Folder, Play, Check, ShieldAlert } from 'lucide-react'

export function EnrollmentWizard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'subnet' | 'csv' | 'cloud' | 'manual'>('subnet')
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('Ready.')
  const [discoveredHosts, setDiscoveredHosts] = useState<any[]>([])
  const [cidrValue, setCidrValue] = useState('')

  const handleScan = async () => {
    if (!cidrValue) return
    setIsScanning(true)
    setScanStatus(`Initiating SEKHEM Sonar sweep on ${cidrValue} via PQC-WAF...`)
    setDiscoveredHosts([])
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:45444'
      const res = await fetch(`${baseUrl}/api/v1/fleet/enclaves/local/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr: cidrValue }),
      })
      
      const data = await res.json()
      
      if (data.error) {
        setScanStatus(`Scan failed: ${data.error}`)
        return
      }
      
      const mappedHosts = (data.discovered || []).map((host: any) => ({
        id: Math.random().toString(),
        ip: host.ip || host.address || 'Unknown',
        hostname: host.hostname || 'unknown-host',
        os: host.os || 'Unknown',
        stig: host.stig || 'Pending',
        ports: host.ports ? host.ports.join(', ') : 'None',
        selected: true
      }))
      
      setDiscoveredHosts(mappedHosts)
      setScanStatus(`Scan complete. Found ${mappedHosts.length} live host(s). OS Fingerprinting successful.`)
    } catch (e: any) {
      setScanStatus(`Connection error: Could not reach ASAF Daemon on port 45444. (${e.message})`)
    } finally {
      setIsScanning(false)
    }
  }

  const toggleHostSelection = (id: string) => {
    setDiscoveredHosts(hosts => hosts.map(h => 
      h.id === id ? { ...h, selected: !h.selected } : h
    ))
  }

  const handleSelectAll = () => {
    const allSelected = discoveredHosts.every(h => h.selected)
    setDiscoveredHosts(hosts => hosts.map(h => ({ ...h, selected: !allSelected })))
  }

  const handleEnroll = async () => {
    const selectedHosts = discoveredHosts.filter(h => h.selected)
    if (selectedHosts.length === 0) return

    setScanStatus(`Enrolling ${selectedHosts.length} asset(s) to ASAF DAG...`)
    setIsScanning(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:45444'
      const res = await fetch(`${baseUrl}/api/v1/fleet/enclaves/local/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hosts: selectedHosts }),
      })
      
      const data = await res.json()
      
      if (data.error) {
        setScanStatus(`Enrollment failed: ${data.error}`)
      } else {
        setScanStatus(`✅ Successfully enrolled ${data.enrolled} assets to the DAG.`)
      }
    } catch (e: any) {
      setScanStatus(`Connection error during enrollment. (${e.message})`)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#050c16] border border-[#1a9fe8]/30 rounded-xl w-[900px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Title */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#080f1c]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#1a9fe8] rounded-sm flex items-center justify-center shadow-[0_0_8px_rgba(26,159,232,0.5)]">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>
            <span className="text-white text-xs font-semibold">Connect Assets — Enrollment Wizard</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-[#1a9fe8]/40 bg-[#080f1c]">
          <button 
            onClick={() => setActiveTab('subnet')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'subnet' ? 'text-[#4EAEF5] border-[#4EAEF5]' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
          >
            <Search className="w-4 h-4" /> Mode A — Subnet
          </button>
          <button 
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'csv' ? 'text-[#4EAEF5] border-[#4EAEF5]' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
          >
            <FileText className="w-4 h-4" /> Mode B — CSV
          </button>
          <button 
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'cloud' ? 'text-[#4EAEF5] border-[#4EAEF5]' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
          >
            <Monitor className="w-4 h-4" /> Mode C — Cloud
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'manual' ? 'text-[#4EAEF5] border-[#4EAEF5]' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
          >
            <Plus className="w-4 h-4" /> Mode D — Manual
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#050c16]">
          {activeTab === 'subnet' && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg mb-2">Subnet Discovery</h2>
              <p className="text-slate-300 text-sm mb-4">Enter a CIDR range. ASAF will scan for live hosts and identify their OS and STIG profile.</p>
              
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-white shrink-0 text-right">CIDR Range</label>
                  <input 
                    type="text" 
                    value={cidrValue}
                    onChange={(e) => setCidrValue(e.target.value)}
                    placeholder="e.g. 192.168.1.0/24 or 127.0.0.1" 
                    className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-white shrink-0 text-right">Target Enclave</label>
                  <select className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none">
                    <option>Local Enclave</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-white shrink-0 text-right">Port Profile</label>
                  <select className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none">
                    <option>Standard (22, 80, 443, 3389, 5985)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-2">
                <button 
                  onClick={handleScan}
                  disabled={isScanning || !cidrValue}
                  className={`flex items-center gap-2 font-bold py-1.5 px-4 rounded text-sm transition-colors ${
                    isScanning || !cidrValue ? 'bg-[#1a9fe8]/50 text-white/50 cursor-not-allowed' : 'bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white'
                  }`}
                >
                  <Search className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} /> {isScanning ? 'Scanning...' : 'Scan Subnet'}
                </button>
                <button 
                  disabled={!isScanning}
                  className="flex items-center gap-2 bg-transparent text-slate-500 font-bold py-1.5 px-4 rounded text-sm transition-colors hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" /> Stop
                </button>
                <button 
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white font-bold py-1.5 px-4 rounded text-sm transition-colors ml-4"
                >
                  Select All
                </button>
                <button 
                  onClick={handleEnroll}
                  disabled={isScanning || discoveredHosts.filter(h => h.selected).length === 0}
                  className={`flex items-center gap-2 font-bold py-1.5 px-4 rounded text-sm transition-colors ${
                    isScanning || discoveredHosts.filter(h => h.selected).length === 0
                      ? 'bg-transparent text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-transparent text-[#22c55e] border border-[#22c55e] hover:bg-[#22c55e]/10'
                  }`}
                >
                  <Check className="w-4 h-4" /> Enroll Selected
                </button>
              </div>

              <div className="mt-4 text-slate-300 text-sm flex items-center gap-2">
                {isScanning && <div className="w-2 h-2 rounded-full bg-[#1a9fe8] animate-ping"></div>}
                <span className={isScanning ? 'text-[#1a9fe8]' : 'text-slate-400'}>{scanStatus}</span>
              </div>

              <div className="mt-2 border border-slate-800 rounded min-h-[250px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#080f1c]">
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">IP</th>
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">Hostname</th>
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">OS</th>
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">STIG Profile</th>
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">Ports</th>
                      <th className="p-3 text-xs font-bold text-[#4EAEF5]">Enroll?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveredHosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                          {isScanning ? 'Scanning network...' : 'No hosts discovered yet. Enter a CIDR range and scan.'}
                        </td>
                      </tr>
                    ) : (
                      discoveredHosts.map((host) => (
                        <tr key={host.id} className="border-b border-slate-800 hover:bg-[#0a1526] transition-colors">
                          <td className="p-3 text-sm text-white font-mono">{host.ip}</td>
                          <td className="p-3 text-sm text-slate-300">{host.hostname}</td>
                          <td className="p-3 text-sm text-slate-300 flex items-center gap-2">
                            {host.os.includes('Ubuntu') || host.os.includes('Red Hat') ? (
                              <div className="w-2 h-2 rounded-full bg-[#f97316]"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-[#1a9fe8]"></div>
                            )}
                            {host.os}
                          </td>
                          <td className="p-3 text-xs text-slate-400 max-w-[200px] truncate" title={host.stig}>{host.stig}</td>
                          <td className="p-3 text-xs text-slate-400">{host.ports}</td>
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={host.selected}
                              onChange={() => toggleHostSelection(host.id)}
                              className="accent-[#1a9fe8] w-4 h-4 cursor-pointer" 
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg mb-2">CSV Bulk Import</h2>
              <p className="text-slate-300 text-sm mb-4">Import a CSV file with asset inventory. Required: a hostname or IP column. Optional: os, enclave, stig_profile.</p>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white font-bold py-2 px-4 rounded text-sm transition-colors">
                  <Folder className="w-4 h-4" /> Choose CSV File...
                </button>
                <button className="flex items-center gap-2 bg-slate-800 text-slate-500 font-bold py-2 px-4 rounded text-sm cursor-not-allowed">
                  <Check className="w-4 h-4" /> Import Assets
                </button>
              </div>
              <p className="text-slate-300 text-sm mt-4">No file selected.</p>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg mb-1">Cloud Asset Discovery</h2>
              <p className="text-[#22c55e] font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span> Active
              </p>
              
              <div className="bg-[#cc2a36]/10 border border-[#cc2a36]/30 rounded p-4 mb-6 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-[#cc2a36] flex-shrink-0" />
                <div className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">SEKHEM Gateway Encapsulation Required:</strong> All cloud discovery and polymophic API connections are routed exclusively through the PQC-WAF Blackhole-VPN. 
                  No data leaves your perimeter — the connector makes read-only API calls from your sovereign environment using your own credentials.
                </div>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed space-y-3 mb-6">
                <p>The <strong>Omnibus Polymorphic API Connector</strong> is active. Select your target environment below to authenticate. The connector will auto-map instances to enclaves, detect the OS, and assign STIG profiles.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="border border-slate-800 bg-[#0a1526] p-5 rounded flex flex-col">
                  <h3 className="text-white font-bold text-lg mb-1">AWS GovCloud EC2</h3>
                  <p className="text-slate-400 text-xs mb-4">IAM Role — Read Only</p>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Access Key ID</label>
                      <input type="text" placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Secret Access Key</label>
                      <input type="password" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white font-bold py-1.5 rounded text-sm transition-colors">
                    Connect AWS GovCloud
                  </button>
                </div>
                
                <div className="border border-slate-800 bg-[#0a1526] p-5 rounded flex flex-col">
                  <h3 className="text-white font-bold text-lg mb-1">Azure Gov VMs</h3>
                  <p className="text-slate-400 text-xs mb-4">Service Principal — Reader</p>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Tenant ID</label>
                      <input type="text" placeholder="00000000-0000-0000-0000-000000000000" className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Client Secret</label>
                      <input type="password" placeholder="Client secret value" className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white font-bold py-1.5 rounded text-sm transition-colors">
                    Connect Azure Gov
                  </button>
                </div>
                
                <div className="border border-[#cc2a36]/30 bg-[#1a0505] p-5 rounded relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-[#cc2a36] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">CUI RISK</div>
                  <h3 className="text-white font-bold text-lg mb-1">Commercial Cloud</h3>
                  <p className="text-slate-400 text-xs mb-4">Agnostic API Connector</p>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Provider URL / API Endpoint</label>
                      <input type="text" placeholder="https://api.commercial.cloud" className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Bearer Token / API Key</label>
                      <input type="password" placeholder="sk_live_..." className="w-full bg-[#050c16] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4EAEF5]" />
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-[#cc2a36] hover:bg-[#ff3344] text-white font-bold py-1.5 rounded text-sm transition-colors">
                    Connect (High Risk)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg mb-2">Manual Asset Add</h2>
              <p className="text-slate-300 text-sm mb-4">Enter connection details for a single host. Use [Test Connection] to verify reachability before enrolling.</p>
              
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Protocol</label>
                  <div className="flex-1 flex items-center gap-6 text-sm text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="protocol" defaultChecked className="accent-[#1a9fe8]" /> SSH (Linux / Unix)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="protocol" className="accent-[#1a9fe8]" /> WinRM (Windows)
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Host / IP</label>
                  <input type="text" placeholder="hostname or IP address" className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Port</label>
                  <input type="text" defaultValue="22" className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Auth Method</label>
                  <select className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none">
                    <option>Password</option>
                    <option>SSH Key</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Username</label>
                  <input type="text" placeholder="e.g. admin" className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Password / Passphrase</label>
                  <input type="password" placeholder="password or passphrase" className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">SSH Key Path</label>
                  <input type="text" className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none" />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm font-bold text-white shrink-0 text-right">Target Enclave</label>
                  <select className="flex-1 bg-[#0a1526] border border-slate-700 rounded p-2 text-sm text-white focus:border-[#4EAEF5] focus:outline-none">
                    <option>Local Enclave</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <button className="flex items-center gap-2 bg-[#1a9fe8] hover:bg-[#4EAEF5] text-white font-bold py-2 px-5 rounded text-sm transition-colors">
                  <Play className="w-4 h-4 fill-current" /> Test Connection
                </button>
                <button className="flex items-center gap-2 bg-slate-800/80 text-slate-500 font-bold py-2 px-5 rounded text-sm cursor-not-allowed">
                  <Check className="w-4 h-4" /> Enroll Asset
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#050c16] border-t border-slate-800 p-2 text-center text-[10px] text-slate-500 font-mono">
          USPTO #73565085 | SecRed Knowledge Inc.
        </div>
      </div>
    </div>
  )
}
