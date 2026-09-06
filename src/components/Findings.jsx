import React, { useState, useRef, useEffect } from 'react';
import { useRisk } from '../context/RiskContext';
import { Terminal, Upload, AlertCircle, Play, CheckCircle, Plus, ShieldCheck, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
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
    remediation: '',
    pocAttached: false,
    source: 'CyberRiskIQ AI Security Assessment'
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
      remediation: '',
      pocAttached: false,
      source: 'CyberRiskIQ AI Security Assessment'
    });
  };
  
  const fileInputRef = useRef(null);

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const sources = ['All', 'CyberRiskIQ AI Security Assessment', 'Internal Vulnerability Scanner', 'Active Directory Auditor'];

  const findingsList = Array.isArray(findings) ? findings : [];
  const historyList = Array.isArray(ingestionHistory) ? ingestionHistory : [];
  const assetsList = Array.isArray(assets) ? assets : [];

  const filteredFindings = findingsList.filter(f => {
    if (!f) return false;
    const sevMatch = filterSeverity === 'All' || f.severity === filterSeverity;
    const srcMatch = filterSource === 'All' || (f.source && f.source.includes(filterSource.replace('CyberRiskIQ AI Security Assessment', 'Security Assessment')));
    const searchMatch = !searchQuery || 
      (f.vulnerability && f.vulnerability.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.assetId && f.assetId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.asset_id && f.asset_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.source && f.source.toLowerCase().includes(searchQuery.toLowerCase()));
    return sevMatch && srcMatch && searchMatch;
  });

  const getSeverityBadgeColor = (severity) => {
    const colors = {
      Critical: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      High: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
      Low: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
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
        controlState: 'WAF active but in bypass-only learning mode.',
        remediation: 'Implement parameterized SQL queries and object-relational mapping.'
      },
      {
        assetId: 'AST-001',
        vulnerability: 'Broken Object-Level Authorization in /v2/transactions',
        severity: 'High',
        cvss: 8.5,
        exploitAvailable: 'Yes',
        internetExposed: 'Yes',
        pocAttached: 'Yes',
        evidence: 'Subject ID substitution yielded cross-account ledger balances without authorization verification.',
        controlState: 'API Gateway enforcing auth header check only.',
        remediation: 'Implement fine-grained object authorization validations per transaction request.'
      },
      {
        assetId: 'AST-002',
        vulnerability: 'Unrestricted Public S3 Bucket via CloudFront Origin',
        severity: 'Critical',
        cvss: 9.1,
        exploitAvailable: 'Yes',
        internetExposed: 'Yes',
        pocAttached: 'Yes',
        evidence: 'Origin access identity was bypassed exposing complete object catalog and PII blobs.',
        controlState: 'Public read blocked on bucket root, but missing bucket-policy denial on subpaths.',
        remediation: 'Enforce CloudFront Origin Access Control (OAC) and strict S3 bucket policy.'
      },
      {
        assetId: 'AST-005',
        vulnerability: 'Weak Active Directory Password Policy',
        severity: 'Medium',
        cvss: 5.3,
        exploitAvailable: 'No',
        internetExposed: 'No',
        pocAttached: 'No',
        evidence: 'Minimum password length set to 8 characters without complexity or breached-password dictionary checks.',
        controlState: 'Local domain policy applied; Azure AD Password Protection not yet enabled.',
        remediation: 'Deploy Microsoft Entra Password Protection and increase minimum length to 15 chars.'
      }
    ];

    ingestSecurityData(demoRecords, 'AI Security Assessment Seed Generator');
    setUploadMessage({
      type: 'success',
      text: `Successfully injected ${demoRecords.length} normalized security findings into telemetry pipeline.`
    });
    setTimeout(() => setUploadMessage(null), 5000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let records = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          records = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim());
            for (let i = 1; i < lines.length; i++) {
              const vals = lines[i].split(',').map(v => v.trim());
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = vals[idx];
              });
              records.push(obj);
            }
          }
        }

        if (records.length > 0) {
          ingestSecurityData(records, `File Ingest: ${file.name}`);
          setUploadMessage({
            type: 'success',
            text: `Successfully ingested ${records.length} findings from ${file.name}.`
          });
        } else {
          setUploadMessage({
            type: 'error',
            text: 'File appeared empty or unparseable.'
          });
        }
      } catch (err) {
        setUploadMessage({
          type: 'error',
          text: `Failed to parse file: ${err.message}`
        });
      }
      setTimeout(() => setUploadMessage(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-[#1E2638] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              TELEMETRY & INGESTION
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Security Findings & Vulnerability Telemetry
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Correlate technical vulnerabilities against asset tiering, controls, and financial exposure.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Finding
          </button>
          <button
            onClick={runDemoDataGenerator}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-[#26324B] font-mono font-bold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 text-cyan-400" /> Trigger Seed Ingestion
          </button>
        </div>
      </div>

      {/* Add Finding Form Card */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#0D1117] p-6 rounded-xl border border-cyan-500/30 shadow-md space-y-4 transition-theme animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-[#1E2638] pb-3">
            <h3 className="text-sm font-display font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Add Normalized Security Finding</h3>
            <button 
              type="button"
              onClick={() => setShowAddForm(false)} 
              className="text-zinc-400 hover:text-rose-400 font-mono font-bold text-xs"
            >
              [ CANCEL ]
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Affected Asset *</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.assetId}
                onChange={e => setNewFinding({...newFinding, assetId: e.target.value})}
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Vulnerability Name *</label>
              <input 
                type="text" required 
                placeholder="e.g. SQL Injection in /api/v1/users"
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.vulnerability}
                onChange={e => setNewFinding({...newFinding, vulnerability: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Severity</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.severity}
                onChange={e => setNewFinding({...newFinding, severity: e.target.value})}
              >
                {['Critical', 'High', 'Medium', 'Low'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">CVSS Score (0.0 - 10.0) *</label>
              <input 
                type="number" step="0.1" min="0" max="10" required
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.cvss}
                onChange={e => setNewFinding({...newFinding, cvss: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Exploit Available?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.exploitAvailable}
                onChange={e => setNewFinding({...newFinding, exploitAvailable: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Internet Exposed?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.internetExposed}
                onChange={e => setNewFinding({...newFinding, internetExposed: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">PoC Attached?</label>
              <select 
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.pocAttached}
                onChange={e => setNewFinding({...newFinding, pocAttached: e.target.value === 'true'})}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Source Tool Name</label>
              <input 
                type="text"
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.source}
                onChange={e => setNewFinding({...newFinding, source: e.target.value})}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Technical Evidence / Proof-of-Concept</label>
              <textarea 
                rows="2"
                placeholder="Proof of concept details..."
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.evidence}
                onChange={e => setNewFinding({...newFinding, evidence: e.target.value})}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-zinc-400 mb-1 font-mono uppercase text-[10px]">Remediation Guidelines</label>
              <textarea 
                rows="2"
                placeholder="Guidance for engineering team..."
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono text-xs focus:outline-none focus:border-cyan-500"
                value={newFinding.remediation}
                onChange={e => setNewFinding({...newFinding, remediation: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#1E2638]">
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold rounded px-4 py-1.5 shadow transition-colors cursor-pointer"
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
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {uploadMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {/* Main split: Ingestion & findings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: upload & batch log */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white dark:bg-[#0D1117] p-6 rounded-xl border border-zinc-200 dark:border-[#1E2638] shadow-sm transition-theme">
            <h2 className="text-base font-display font-bold text-zinc-950 dark:text-zinc-50 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" /> Ingest Security Data
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
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-zinc-200 dark:border-[#26324B] hover:border-zinc-400 dark:hover:border-cyan-500/50'
              }`}
            >
              <Upload className="w-8 h-8 text-zinc-400 group-hover:text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Drag & Drop files here, or browse</span>
              <span className="text-[10px] font-mono text-zinc-500">Supports .json or .csv</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json,.csv"
                onChange={handleFileInput}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D1117] p-6 rounded-xl border border-zinc-200 dark:border-[#1E2638] shadow-sm transition-theme">
            <h2 className="text-sm font-display font-bold text-zinc-950 dark:text-zinc-50 mb-3 uppercase tracking-wider">Batch Ingestion History</h2>
            <div className="space-y-3 font-mono text-xs">
              {historyList.map(batch => (
                <div key={batch.id} className="border-b border-zinc-100 dark:border-[#1E2638] pb-2 flex justify-between items-center last:border-0 last:pb-0">
                  <div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{batch.source}</div>
                    <div className="text-[10px] text-zinc-500">{new Date(batch.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="bg-zinc-100 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] px-2 py-0.5 rounded text-[10px] text-zinc-400 font-bold">{batch.count} recs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 columns: findings table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap justify-between items-center bg-white dark:bg-[#0D1117] p-4 rounded-xl border border-zinc-200 dark:border-[#1E2638] shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">Severity:</span>
                <select 
                  className="bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                >
                  {severities.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">Source:</span>
                <select 
                  className="bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                >
                  {sources.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search telemetry..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-44 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] rounded-xl shadow-sm overflow-hidden transition-theme">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-[#121824] border-b border-zinc-200 dark:border-[#1E2638] text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="p-4">Vulnerability Finding</th>
                    <th className="p-4">Asset ID</th>
                    <th className="p-4">Source Engine</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#1E2638] text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                  {filteredFindings.map(f => {
                    const asset = assets.find(a => a.id === (f.assetId || f.asset_id));
                    const correlatedScore = calculateCorrelatedRiskIndicator(f, asset);
                    return (
                      <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-[#121824]/50 transition-colors">
                        <td className="p-4 max-w-sm">
                          <div className="space-y-1">
                            <div className="font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs lg:text-sm">
                              {f.vulnerability}
                              {(f.pocAttached || f.poc_attached) && (
                                <span className="inline-flex items-center gap-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                                  <Terminal className="w-2.5 h-2.5" /> PoC Proof
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              Discovered {f.discoveredAt ? new Date(f.discoveredAt).toLocaleDateString() : 'Active'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-400 text-xs">{f.assetId || f.asset_id}</td>
                        <td className="p-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono">{f.source}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${getSeverityBadgeColor(f.severity)}`}>
                            {f.cvss ? Number(f.cvss).toFixed(1) : '5.0'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedFinding(f)}
                            className="text-cyan-500 hover:text-cyan-400 font-mono text-xs font-semibold cursor-pointer hover:underline"
                          >
                            [ Inspect ]
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-zinc-200 dark:border-[#26324B] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest block">Finding Trace Analysis</span>
                <h2 className="text-lg font-display font-bold text-zinc-950 dark:text-zinc-50 mt-1">{selectedFinding.vulnerability}</h2>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-zinc-50 dark:bg-[#121824] p-2.5 rounded-lg border border-zinc-100 dark:border-[#1E2638]">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Source Agent</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedFinding.source}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#121824] p-2.5 rounded-lg border border-zinc-100 dark:border-[#1E2638]">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Raw CVSS</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedFinding.cvss ? Number(selectedFinding.cvss).toFixed(1) : '5.0'}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#121824] p-2.5 rounded-lg border border-zinc-100 dark:border-[#1E2638]">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Exploit Code</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedFinding.exploitAvailable || selectedFinding.exploit_available ? 'Available (Public)' : 'None'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Validation Evidence</h3>
              <div className="bg-black/80 text-zinc-300 font-mono text-xs p-4 rounded-lg overflow-x-auto border border-[#1E2638] leading-relaxed max-h-48">
                {selectedFinding.evidence || 'Telemetry record verified without additional console text.'}
              </div>
            </div>

            <div className="space-y-1 bg-zinc-50 dark:bg-[#121824] p-3 rounded-lg border border-zinc-200 dark:border-[#1E2638] text-xs">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-50 uppercase text-[10px] block text-cyan-400">Remediation Guidelines</span>
              <p className="text-zinc-500 dark:text-zinc-300 font-mono text-[11px]">{selectedFinding.remediation || selectedFinding.controlState || 'Standard security patch lifecycle.'}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-[#1E2638]">
              <button
                onClick={() => setSelectedFinding(null)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
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
