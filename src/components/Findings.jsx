import React, { useState, useRef, useEffect } from 'react';
import { useRisk } from '../context/RiskContext';
import { Terminal, Upload, AlertCircle, Play, CheckCircle, Plus } from 'lucide-react';

export default function Findings() {
  const { 
    findings, 
    assets, 
    calculateCorrelatedRiskIndicator, 
    ingestSecurityData, 
    ingestionHistory,
    addFinding
  } = useRisk();

  const [selectedFinding, setSelectedFinding] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newFinding, setNewFinding] = useState({
    assetId: assets[0]?.id || '',
    vulnerability: '',
    severity: 'Medium',
    cvss: 5.0,
    exploitAvailable: false,
    internetExposed: false,
    evidence: '',
    controlState: '',
    pocAttached: false,
    source: 'Manual Data Entry'
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addFinding({
      ...newFinding,
      cvss: Number(newFinding.cvss),
      exploitAvailable: newFinding.exploitAvailable === 'Yes' || newFinding.exploitAvailable === true,
      internetExposed: newFinding.internetExposed === 'Yes' || newFinding.internetExposed === true,
      pocAttached: newFinding.pocAttached === 'Yes' || newFinding.pocAttached === true
    });
    setShowAddForm(false);
    setNewFinding({
      assetId: assets[0]?.id || '',
      vulnerability: '',
      severity: 'Medium',
      cvss: 5.0,
      exploitAvailable: false,
      internetExposed: false,
      evidence: '',
      controlState: '',
      pocAttached: false,
      source: 'Manual Data Entry'
    });
  };
  
  const fileInputRef = useRef(null);

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const sources = ['All', 'Strix AI Pentest', 'Internal Vulnerability Scanner', 'Active Directory Auditor'];

  const filteredFindings = findings.filter(f => {
    const sevMatch = filterSeverity === 'All' || f.severity === filterSeverity;
    const srcMatch = filterSource === 'All' || f.source === filterSource;
    return sevMatch && srcMatch;
  });

  const getSeverityBadgeColor = (severity) => {
    const colors = {
      Critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
      High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50',
      Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50',
      Low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
    };
    return colors[severity] || colors.Low;
  };

  // Demo Data Generator
  const runDemoDataGenerator = () => {
    const demoRecords = [
      {
        assetId: 'AST-003',
        vulnerability: 'SQL Injection on Customer Profiles API',
        severity: 'Critical',
        cvss: 9.6,
        exploitAvailable: 'Yes',
        internetExposed: 'No',
        pocAttached: 'Yes',
        evidence: 'Exploited parameter \'?id=1\' OR 1=1 to extract schemas and record tables from the Postgres instance.',
        controlState: 'WAF active but in bypass-only learning mode.'
      },
      {
        assetId: 'AST-004',
        vulnerability: 'Missing Security Patch on Domain Controller (MS17-010 / EternalBlue)',
        severity: 'Critical',
        cvss: 9.8,
        exploitAvailable: 'Yes',
        internetExposed: 'No',
        pocAttached: 'No',
        evidence: 'Scanned SMB port 445 on directory server and identified lack of patch package KB4013389.',
        controlState: 'Host firewall enabled but port open locally.'
      },
      {
        assetId: 'AST-002',
        vulnerability: 'Cross-Site Scripting (XSS) in Retail Comments portal',
        severity: 'Medium',
        cvss: 5.4,
        exploitAvailable: 'Yes',
        internetExposed: 'Yes',
        pocAttached: 'Yes',
        evidence: 'Injected script <script>alert(document.cookie)</script> into feedback form and executed script context in browser.',
        controlState: 'Input encoding library missing on client-side router.'
      }
    ];

    ingestSecurityData('Strix AI Pentest (Demo Ingestion)', demoRecords);
    setUploadMessage({ type: 'success', text: 'Demo Ingestion Batch executed: Ingested 3 new findings and recalculated Risk Scores!' });
    setTimeout(() => setUploadMessage(null), 5000);
  };

  // Handle Drag and Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let parsedData = [];
        
        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // simple csv parsing
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const cols = lines[i].split(',').map(c => c.trim());
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = cols[idx];
            });
            parsedData.push(obj);
          }
        } else {
          throw new Error('Unsupported format. Only CSV or JSON accepted.');
        }

        ingestSecurityData('User Uploaded Ingestion', parsedData);
        setUploadMessage({ type: 'success', text: `Success: Uploaded '${file.name}' containing ${parsedData.length} records.` });
      } catch (err) {
        setUploadMessage({ type: 'error', text: `Upload Error: ${err.message}` });
      }
      setTimeout(() => setUploadMessage(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Security & Strix Findings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Normalized vulnerability data compiled from penetration tests, active probes, and static scans.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Finding
          </button>
          <button
            onClick={runDemoDataGenerator}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" /> Trigger Seed Generator
          </button>
        </div>
      </div>

      {/* Add Finding Form Card */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 transition-theme animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Add New Security Finding</h3>
            <button 
              type="button"
              onClick={() => setShowAddForm(false)} 
              className="text-zinc-400 hover:text-rose-500 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Affected Asset *</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.assetId}
                onChange={e => setNewFinding({...newFinding, assetId: e.target.value})}
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Vulnerability *</label>
              <input 
                type="text" required 
                placeholder="e.g. SQL Injection in /api/v1/users"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.vulnerability}
                onChange={e => setNewFinding({...newFinding, vulnerability: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Severity</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.severity}
                onChange={e => setNewFinding({...newFinding, severity: e.target.value})}
              >
                {['Critical', 'High', 'Medium', 'Low'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">CVSS Score (0.0 - 10.0) *</label>
              <input 
                type="number" step="0.1" min="0" max="10" required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.cvss}
                onChange={e => setNewFinding({...newFinding, cvss: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Exploit Available?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.exploitAvailable}
                onChange={e => setNewFinding({...newFinding, exploitAvailable: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Internet Exposed?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.internetExposed}
                onChange={e => setNewFinding({...newFinding, internetExposed: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">PoC Attached?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.pocAttached}
                onChange={e => setNewFinding({...newFinding, pocAttached: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Source Tool Name</label>
              <input 
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.source}
                onChange={e => setNewFinding({...newFinding, source: e.target.value})}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Technical Evidence / Logs</label>
              <textarea 
                rows="2"
                placeholder="Proof of concept details..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.evidence}
                onChange={e => setNewFinding({...newFinding, evidence: e.target.value})}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-zinc-400 mb-1 font-semibold uppercase">Control State / Remediation Notes</label>
              <textarea 
                rows="2"
                placeholder="Current state of defensive controls..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFinding.controlState}
                onChange={e => setNewFinding({...newFinding, controlState: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded px-4 py-1.5 shadow transition-colors cursor-pointer"
              >
                Save Finding
              </button>
            </div>
          </form>
        </div>
      )}

      {uploadMessage && (
        <div className={`p-4 rounded-xl border flex gap-3 text-xs font-semibold ${
          uploadMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'
        }`}>
          {uploadMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {/* Main split: Ingestion & findings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: upload & batch log */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" /> Ingest Security Data
            </h2>
            <p className="text-xs text-zinc-400 mb-4">Upload CSV or JSON findings mapped to existing Asset IDs.</p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              <Upload className="w-8 h-8 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Drag & Drop files here, or browse</span>
              <span className="text-[10px] text-zinc-400">Supports .json or .csv</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json,.csv"
                onChange={handleFileInput}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme">
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mb-3">Batch Ingestion History</h2>
            <div className="space-y-3 font-mono text-xs">
              {ingestionHistory.map(batch => (
                <div key={batch.id} className="border-b border-zinc-100 dark:border-zinc-800 pb-2 flex justify-between items-center last:border-0 last:pb-0">
                  <div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{batch.source}</div>
                    <div className="text-[10px] text-zinc-400">{new Date(batch.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-500 font-bold">{batch.count} recs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 columns: findings table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap justify-between items-center bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-semibold uppercase">Severity:</span>
                <select 
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none"
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                >
                  {severities.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-semibold uppercase">Source:</span>
                <select 
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                >
                  {sources.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                    <th className="p-4">Vulnerability</th>
                    <th className="p-4">Asset ID</th>
                    <th className="p-4">Source</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                  {filteredFindings.map(f => {
                    const asset = assets.find(a => a.id === f.assetId);
                    const correlatedScore = calculateCorrelatedRiskIndicator(f, asset);
                    return (
                      <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4 max-w-sm">
                          <div className="space-y-1">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {f.vulnerability}
                              {f.pocAttached && (
                                <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">
                                  <Terminal className="w-2.5 h-2.5" /> PoC Proof
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">Discovered {new Date(f.discoveredAt).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-500 text-xs">{f.assetId}</td>
                        <td className="p-4 text-xs text-zinc-500 dark:text-zinc-400">{f.source}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono ${getSeverityBadgeColor(f.severity)}`}>
                            {f.cvss.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedFinding(f)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Modal Overlay */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-zinc-400 uppercase">Finding Trace Analysis</span>
                <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">{selectedFinding.vulnerability}</h2>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1">Source Agent</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedFinding.source}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1">Raw CVSS</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedFinding.cvss.toFixed(1)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1">Exploit Code</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedFinding.exploitAvailable ? 'Available (Public)' : 'None'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide">Validation Evidence</h3>
              <div className="bg-zinc-900 text-zinc-200 font-mono text-xs p-4 rounded-lg overflow-x-auto border border-zinc-800/80 leading-relaxed max-h-48">
                {selectedFinding.evidence}
              </div>
            </div>

            <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/60 text-xs">
              <span className="font-bold text-zinc-900 dark:text-zinc-50">Control Verification State</span>
              <p className="text-zinc-500 dark:text-zinc-400">{selectedFinding.controlState}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedFinding(null)}
                className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
