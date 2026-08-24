import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { Award, FileText, Download, CheckCircle, ShieldAlert, History, Clock, Info } from 'lucide-react';

export default function ComplianceReports() {
  const { org, assets, getCompliancePosture, getEnterpriseStats, auditLogs } = useRisk();
  const [activeFramework, setActiveFramework] = useState('nist');
  
  const posture = getCompliancePosture();
  const stats = getEnterpriseStats();

  const handleExport = (reportType) => {
    window.print();
  };

  const nistControls = [
    { code: 'ID.AM-1', name: 'Physical & Cloud systems inventoried', status: 'Compliant', gap: 'None' },
    { code: 'PR.AC-1', name: 'Identities and credentials managed', status: 'Partial', gap: 'MFA not enforced on service accounts' },
    { code: 'PR.DS-1', name: 'Data-at-rest is protected (Encrypted)', status: 'Compliant', gap: 'None' },
    { code: 'DE.AE-1', name: 'Anomalous events detected and analyzed', status: 'Compliant', gap: 'None' },
    { code: 'RS.RP-1', name: 'Response plan executed during incidents', status: 'Partial', gap: 'EDR coverage gaps on R&D endpoints' }
  ];

  const isoControls = [
    { code: 'A.9.1.1', name: 'Access control policy & privileged account enforcement', status: 'Compliant', gap: 'None' },
    { code: 'A.12.6.1', name: 'Management of technical vulnerabilities', status: 'Partial', gap: 'Apache package updates delayed' },
    { code: 'A.14.1.1', name: 'Information security requirements analysis', status: 'Compliant', gap: 'None' },
    { code: 'A.17.1.1', name: 'Planning information security continuity', status: 'Compliant', gap: 'None' }
  ];

  const rbiControls = [
    { code: 'RBI-G-1', name: 'User access control and two-factor authentication (2FA/MFA)', status: 'Partial', gap: 'Access control audit logging missing on legacy nodes' },
    { code: 'RBI-G-3', name: 'Patch and vulnerability management pipeline implementation', status: 'Partial', gap: 'GitHub actions secrets validation missing' },
    { code: 'RBI-G-5', name: 'Establishment of 24/7 Security Operations Center (SOC)', status: 'Compliant', gap: 'None' },
    { code: 'RBI-G-8', name: 'Incident response system and host agent isolation (EDR)', status: 'Partial', gap: 'Endpoint recovery orchestration gaps' },
    { code: 'RBI-G-11', name: 'Network perimeter security and zero-trust segmentation', status: 'Compliant', gap: 'None' }
  ];

  const sebiControls = [
    { code: 'SEBI-3.1', name: 'Identification and asset management register', status: 'Compliant', gap: 'None' },
    { code: 'SEBI-3.2', name: 'Protection, identity provider, and user credentials authentication', status: 'Compliant', gap: 'None' },
    { code: 'SEBI-3.3', name: 'Network segmentation controls and boundary security', status: 'Partial', gap: 'Unsanitized BOLA endpoints' },
    { code: 'SEBI-3.4', name: 'Continuous monitoring, detection alerts, and SOC logs', status: 'Compliant', gap: 'None' },
    { code: 'SEBI-3.5', name: 'Endpoint response agents and endpoint detection capability', status: 'Compliant', gap: 'None' },
    { code: 'SEBI-3.6', name: 'Robust backup management and immutable storage policy', status: 'Compliant', gap: 'None' }
  ];

  const cisControls = [
    { code: 'CIS-1.1', name: 'Establish and Maintain a Detailed Enterprise Asset Inventory', status: 'Compliant', gap: 'None' },
    { code: 'CIS-3.3', name: 'Encrypt Sensitive Data at Rest across all Storage Volumes', status: 'Compliant', gap: 'None' },
    { code: 'CIS-6.3', name: 'Require Multi-Factor Authentication for Privileged Access', status: 'Partial', gap: 'Legacy service accounts omit MFA' },
    { code: 'CIS-7.4', name: 'Automate Remediation and Patch Deployment Pipelines', status: 'Partial', gap: 'Monthly patch cycle window latency' },
    { code: 'CIS-8.2', name: 'Collect and Aggregate Security Event Audit Logs', status: 'Compliant', gap: 'None' },
    { code: 'CIS-10.1', name: 'Deploy and Maintain Centralized Anti-Malware / EDR', status: 'Compliant', gap: 'None' },
    { code: 'CIS-12.2', name: 'Maintain Boundary Segmentation and Zero-Trust Network Controls', status: 'Partial', gap: 'Database segment isolation in progress' }
  ];

  const getControls = () => {
    switch (activeFramework) {
      case 'nist': return nistControls;
      case 'iso': return isoControls;
      case 'rbi': return rbiControls;
      case 'sebi': return sebiControls;
      case 'cis': return cisControls;
      default: return nistControls;
    }
  };

  const currentControls = getControls();

  return (
    <div className="space-y-6 print:p-8 print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Framework Alignment & Audit Trail</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Dynamic regulatory framework alignment (NIST CSF, ISO/IEC 27001, RBI CSF, SEBI CSCRF, CIS Controls) and immutable evidence logs.
          </p>
        </div>
        <div className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg font-mono">
          <Info className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
          <span>Evaluation metric: Control coverage rate across inventoried assets</span>
        </div>
      </div>

      {/* Posture Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-2">
        <div 
          onClick={() => setActiveFramework('nist')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFramework === 'nist' 
              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' 
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">NIST CSF</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{posture.nist}%</span>
            <span className="text-[10px] text-zinc-400">Coverage</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-blue-500" style={{ width: `${posture.nist}%` }} />
          </div>
        </div>

        <div 
          onClick={() => setActiveFramework('iso')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFramework === 'iso' 
              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' 
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">ISO 27001</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{posture.iso}%</span>
            <span className="text-[10px] text-zinc-400">Coverage</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-purple-500" style={{ width: `${posture.iso}%` }} />
          </div>
        </div>

        <div 
          onClick={() => setActiveFramework('rbi')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFramework === 'rbi' 
              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' 
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">RBI CSF</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{posture.rbi}%</span>
            <span className="text-[10px] text-zinc-400">Coverage</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-emerald-500" style={{ width: `${posture.rbi}%` }} />
          </div>
        </div>

        <div 
          onClick={() => setActiveFramework('sebi')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFramework === 'sebi' 
              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' 
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">SEBI CSCRF</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{posture.sebi}%</span>
            <span className="text-[10px] text-zinc-400">Coverage</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-amber-500" style={{ width: `${posture.sebi}%` }} />
          </div>
        </div>

        <div 
          onClick={() => setActiveFramework('cis')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFramework === 'cis' 
              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' 
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">CIS Controls</span>
            <Award className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{posture.cis || 68}%</span>
            <span className="text-[10px] text-zinc-400">Coverage</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-cyan-500" style={{ width: `${posture.cis || 68}%` }} />
          </div>
        </div>
      </div>

      {/* Detailed control grid */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center print:border-b print:pb-2">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">
            {activeFramework === 'nist' && 'NIST CSF Core Mapping Index'}
            {activeFramework === 'iso' && 'ISO/IEC 27001 Annex A Index'}
            {activeFramework === 'rbi' && 'RBI CSF Guidelines Mapping Index'}
            {activeFramework === 'sebi' && 'SEBI CSCRF Sections Mapping Index'}
            {activeFramework === 'cis' && 'CIS Critical Security Controls v8 Index'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                <th className="p-4">Clause ID</th>
                <th className="p-4">Control Objective</th>
                <th className="p-4">Alignment Status</th>
                <th className="p-4 text-right">Identified Controls Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
              {currentControls.map((c, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{c.code}</td>
                  <td className="p-4 text-xs">{c.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'Compliant' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right text-xs text-zinc-500 dark:text-zinc-400">{c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Audit Trail */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" /> Platform Audit Trail & Evidence Log
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono">Persisted Event Records</span>
        </div>
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="p-3 text-zinc-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-semibold">{log.user}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{log.entity}</td>
                  <td className="p-3 text-zinc-500 dark:text-zinc-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Generation Panel */}
      <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme print:hidden">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Export Governance Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Executive Briefing</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">PDF summary of cyber liability factors, budget allocations, and EAL delta indicators tailored for C-Suite board review.</p>
            </div>
            <button 
              onClick={() => handleExport('exec')}
              className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Technical Analysis</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete register of assets, raw and correlated findings (including AI Security Assessment proofs) for security engineering.</p>
            </div>
            <button 
              onClick={() => handleExport('tech')}
              className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Compliance Audit Pack</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Details mapping control operating values to NIST CSF, ISO 27001, RBI CSF, SEBI CSCRF, and CIS Controls v8.</p>
            </div>
            <button 
              onClick={() => handleExport('comp')}
              className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
