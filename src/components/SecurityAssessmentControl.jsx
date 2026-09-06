// src/components/SecurityAssessmentControl.jsx
// CyberRiskIQ AI Security Assessment Engine — Real-Time Attack Graph & Telemetry Control

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRisk } from '../context/RiskContext';
import Modal from './Modal';
import { 
  ShieldAlert, 
  Terminal, 
  Download, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Cpu,
  Network,
  Share2,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Radio
} from 'lucide-react';

export default function SecurityAssessmentControl() {
  const { ingestAssessmentFindings } = useRisk();
  const [target, setTarget] = useState('./src');
  const [assessmentMode, setAssessmentMode] = useState('demo'); // 'demo' | 'live'
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'scanning' | 'done' | 'error'
  const [log, setLog] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('graph'); // 'graph' | 'terminal'
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  
  // Real-time graph state
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('Standby');
  const [progressPct, setProgressPct] = useState(0);

  const logBottomRef = useRef(null);
  const eventSourceRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (showConsoleModal && logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log, showConsoleModal, activeModalTab]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const resetGraph = (initialTarget) => {
    setGraphNodes([
      {
        id: 'node-target-root',
        label: initialTarget,
        type: 'target',
        status: 'active',
        x: 400,
        y: 220,
        details: 'Initial Assessment Scope Target Root'
      }
    ]);
    setGraphEdges([]);
    setSelectedNode(null);
    setProgressPct(5);
    setCurrentPhase('Initializing Target');
  };

  const handleAssessmentEvent = (event) => {
    if (!event) return;

    if (event.progress !== undefined) {
      setProgressPct(event.progress);
    }
    if (event.phase) {
      setCurrentPhase(event.phase.replace(':', ' - ').toUpperCase());
    }

    if (event.message) {
      setLog(prev => prev + event.message + '\n');
    }

    // Add or update node
    if (event.node) {
      setGraphNodes(prev => {
        const existingIdx = prev.findIndex(n => n.id === event.node.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...event.node };
          return updated;
        }

        // Layout algorithm based on node type and count
        const count = prev.length;
        let x = 400;
        let y = 220;

        if (event.node.type === 'probe') {
          x = 400;
          y = 70;
        } else if (event.node.type === 'service') {
          const angle = (count * 1.2) + Math.PI;
          x = 400 + Math.cos(angle) * 160;
          y = 220 + Math.sin(angle) * 90;
        } else if (event.node.type === 'endpoint') {
          const angle = (count * 0.9) + 0.3;
          x = 400 + Math.cos(angle) * 220;
          y = 220 + Math.sin(angle) * 120;
        } else if (event.node.type === 'vulnerability') {
          x = 220 + (count % 3) * 180;
          y = 350 + (count % 2) * 40;
        } else if (event.node.type === 'loss') {
          x = 650;
          y = 350;
        } else if (event.node.type === 'error') {
          x = 400;
          y = 360;
        }

        return [...prev, { ...event.node, x, y }];
      });
    }

    // Add edge
    if (event.edge) {
      setGraphEdges(prev => {
        if (prev.some(e => e.id === event.edge.id)) {
          return prev.map(e => e.id === event.edge.id ? { ...e, ...event.edge } : e);
        }
        return [...prev, event.edge];
      });
    }

    // Handle terminal status
    if (event.status === 'completed') {
      setStatus('done');
      if (event.results && ingestAssessmentFindings) {
        ingestAssessmentFindings(event.results);
      }
    } else if (event.status === 'failed') {
      setStatus('error');
      setErrorMessage(event.error || event.message || 'Assessment failed on target.');
    }
  };

  const startScan = () => {
    setShowConsent(true);
  };

  const confirmConsent = async () => {
    if (!consentAcknowledged) return;
    setShowConsent(false);
    setStatus('scanning');
    setErrorMessage('');
    resetGraph(target);
    setShowConsoleModal(true);
    setActiveModalTab('graph');

    try {
      const resp = await fetch('/api/assessment/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          mode: assessmentMode,
          authorized: true
        })
      });
      
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || data.detail || 'Security assessment failed to start');
      }

      const activeRunId = data.runId;
      setRunId(activeRunId);

      // Connect to real-time Server-Sent Events (SSE)
      if (eventSourceRef.current) eventSourceRef.current.close();

      const sseUrl = `/api/assessment/events/${activeRunId}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const parsedEvent = JSON.parse(e.data);
          handleAssessmentEvent(parsedEvent);
        } catch (_) {}
      };

      es.onerror = () => {
        // Fallback polling if SSE disconnects
        fetchFallbackResults(activeRunId);
      };

    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Security assessment initialization error occurred');
      setStatus('error');
    }
  };

  const fetchFallbackResults = async (activeRunId) => {
    try {
      const resultResp = await fetch(`/api/assessment/result/${activeRunId}`);
      if (resultResp.ok) {
        const res = await resultResp.json();
        if (res.success && res.results) {
          if (ingestAssessmentFindings) ingestAssessmentFindings(res.results);
          setStatus('done');
        } else if (res.status === 'failed') {
          setStatus('error');
          setErrorMessage(res.error || 'Live security assessment failed on target.');
        }
      }
    } catch (_) {}
  };

  const handleDownloadPdf = () => {
    if (!runId) return;
    window.open(`/api/assessment/report/${runId}`, '_blank');
  };

  const getNodeColor = (node) => {
    if (node.type === 'target') return '#00F0FF';
    if (node.type === 'probe') return '#6366F1';
    if (node.type === 'service') return '#3B82F6';
    if (node.type === 'endpoint') return '#10B981';
    if (node.type === 'vulnerability') {
      return node.severity === 'Critical' ? '#EF4444' : '#F59E0B';
    }
    if (node.type === 'loss') return '#EC4899';
    if (node.type === 'error') return '#EF4444';
    return '#94A3B8';
  };

  return (
    <div className="bg-white dark:bg-[#0D1117] p-4 rounded-xl border border-zinc-200 dark:border-[#1E2638] space-y-3.5 shadow-sm transition-theme">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 text-cyan-600 dark:text-[#00F0FF] rounded-lg border border-cyan-500/20">
            <Radio className={`w-4 h-4 ${status === 'scanning' ? 'animate-pulse text-[#00F0FF]' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-bold font-display text-zinc-950 dark:text-zinc-50 block tracking-tight">AI Security Engine</span>
            <span className="text-[10px] text-zinc-400 font-mono block">Real-Time Event Graph</span>
          </div>
        </div>

        {status === 'scanning' && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-bold font-mono animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            PROBING
          </span>
        )}
        {status === 'done' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 font-bold font-mono">
            <CheckCircle2 className="w-3 h-3" />
            READY
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500 font-bold font-mono">
            <AlertTriangle className="w-3 h-3" />
            FAILED
          </span>
        )}
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-[#08090D] border border-zinc-200 dark:border-[#1C2333] rounded-lg text-[10px] font-semibold">
        <button
          type="button"
          disabled={status === 'scanning'}
          onClick={() => setAssessmentMode('demo')}
          className={`py-1.5 rounded transition-all cursor-pointer text-center ${
            assessmentMode === 'demo'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Demo Mode
        </button>
        <button
          type="button"
          disabled={status === 'scanning'}
          onClick={() => setAssessmentMode('live')}
          className={`py-1.5 rounded transition-all cursor-pointer text-center ${
            assessmentMode === 'live'
              ? 'bg-indigo-600 text-white font-bold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Live Mode
        </button>
      </div>

      {/* Target input */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block font-mono">
          Target Scope (URL / Path)
        </label>
        <input
          type="text"
          value={target}
          disabled={status === 'scanning'}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="./src or https://api.finsecure.internal"
          className="w-full text-xs px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#08090D] border border-zinc-200 dark:border-[#1E2638] text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors disabled:opacity-60"
        />
      </div>

      {/* Launch Action */}
      <div className="space-y-2 pt-0.5">
        <button
          onClick={startScan}
          disabled={status === 'scanning'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold font-display shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {status === 'scanning' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Assessment ({progressPct}%)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Assessment</span>
            </>
          )}
        </button>

        {/* Secondary options when active or completed */}
        {(status === 'done' || status === 'scanning' || runId || log) && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => {
                setShowConsoleModal(true);
                setActiveModalTab('graph');
              }}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 dark:bg-[#161B26] hover:bg-zinc-200 dark:hover:bg-[#1E2638] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#26324B] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attack Graph</span>
            </button>

            <button
              onClick={() => {
                setShowConsoleModal(true);
                setActiveModalTab('terminal');
              }}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 dark:bg-[#161B26] hover:bg-zinc-200 dark:hover:bg-[#1E2638] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#26324B] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Terminal</span>
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
          {errorMessage}
        </div>
      )}

      {/* Consent Modal */}
      {showConsent && (
        <Modal
          isOpen={showConsent}
          onClose={() => setShowConsent(false)}
          title="Security Assessment Authorization"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold font-display block text-sm">
                  {assessmentMode === 'live' ? 'Active Target Security Assessment' : 'Demonstration Security Assessment'}
                </span>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90 font-mono">
                  Target: <span className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-bold">{target}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              By proceeding, you confirm that you have explicit, documented authorization to test the specified scope and that this assessment complies with organizational risk policy.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] cursor-pointer">
              <input
                type="checkbox"
                checked={consentAcknowledged}
                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                I am authorized to test this target and agree to execute the security assessment.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConsent(false);
                  setConsentAcknowledged(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!consentAcknowledged}
                onClick={confirmConsent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold font-display shadow-md transition-all cursor-pointer"
              >
                Authorize & Start Scan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Real-Time Attack Graph & Live Console Modal */}
      {showConsoleModal && (
        <Modal
          isOpen={showConsoleModal}
          onClose={() => setShowConsoleModal(false)}
          title="CyberRiskIQ Security Engine Telemetry"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Header controls & stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-100 dark:bg-[#08090D] border border-zinc-200 dark:border-[#1C2333] rounded-xl text-xs">
              <div className="flex items-center gap-3 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Session:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{runId || 'INITIALIZING'}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-sans text-[10px] font-bold uppercase">
                  {assessmentMode.toUpperCase()} MODE
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">
                  {currentPhase}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {runId && status === 'done' && (
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-display bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                )}

                {/* Tab Switcher */}
                <div className="flex items-center bg-white dark:bg-[#161B26] p-0.5 rounded-lg border border-zinc-200 dark:border-[#26324B]">
                  <button
                    onClick={() => setActiveModalTab('graph')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeModalTab === 'graph'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Attack Graph
                  </button>
                  <button
                    onClick={() => setActiveModalTab('terminal')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeModalTab === 'terminal'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Terminal Logs
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Phase: {currentPhase}</span>
                <span className="font-bold text-zinc-200">{progressPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-[#1C2333] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    status === 'error' 
                      ? 'bg-rose-500' 
                      : status === 'done' 
                        ? 'bg-emerald-500' 
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Main Visual Content Area */}
            {activeModalTab === 'graph' ? (
              <div className="relative w-full h-[420px] bg-[#08090D] border border-[#1C2333] rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                {/* SVG Real-Time Node-Link Graph */}
                <svg className="w-full h-full" viewBox="0 0 800 420">
                  <defs>
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#00F0FF" />
                    </marker>
                    <marker id="arrow-danger" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                    </marker>
                    <marker id="arrow-safe" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                    </marker>
                  </defs>

                  {/* Render Edges */}
                  {graphEdges.map((edge) => {
                    const sourceNode = graphNodes.find(n => n.id === edge.source);
                    const targetNode = graphNodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const isCompromised = edge.status === 'compromised';
                    const isActive = edge.status === 'active';
                    const strokeColor = isCompromised ? '#EF4444' : isActive ? '#00F0FF' : '#26324B';
                    const markerUrl = isCompromised ? 'url(#arrow-danger)' : isActive ? 'url(#arrow-active)' : 'url(#arrow-safe)';

                    return (
                      <g key={edge.id}>
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={strokeColor}
                          strokeWidth={isCompromised ? 2.5 : 1.5}
                          className={isActive || isCompromised ? 'animate-data-flow' : ''}
                          markerEnd={markerUrl}
                        />
                      </g>
                    );
                  })}

                  {/* Render Nodes */}
                  {graphNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const nodeColor = getNodeColor(node);
                    const isVulnerability = node.type === 'vulnerability';

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer transition-transform duration-300 hover:scale-110"
                        onClick={() => setSelectedNode(node)}
                      >
                        {/* Pulsing ring for target root or active probe */}
                        {(node.type === 'target' || node.type === 'probe' || isVulnerability) && (
                          <circle
                            r={isVulnerability ? 24 : 28}
                            fill="none"
                            stroke={nodeColor}
                            strokeWidth="1.5"
                            opacity="0.4"
                            className="animate-ping"
                          />
                        )}

                        <circle
                          r={node.type === 'target' ? 22 : isVulnerability ? 18 : 14}
                          fill={nodeColor}
                          stroke={isSelected ? '#FFFFFF' : '#08090D'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          className="shadow-lg"
                        />

                        {/* Node Label */}
                        <text
                          y={node.type === 'target' ? 34 : 26}
                          textAnchor="middle"
                          fill="#E2E8F0"
                          className="text-[10px] font-bold font-mono tracking-tight pointer-events-none drop-shadow"
                        >
                          {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Node Detail Overlay Card */}
                {selectedNode && (
                  <div className="absolute bottom-4 left-4 bg-[#0D1117]/95 border border-[#26324B] p-3.5 rounded-xl shadow-2xl w-80 text-xs space-y-2 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                          Type: {selectedNode.type}
                        </span>
                        <h4 className="font-bold text-zinc-100 font-display text-sm">{selectedNode.label}</h4>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-zinc-400 hover:text-zinc-200 text-base font-bold"
                      >
                        &times;
                      </button>
                    </div>

                    {selectedNode.severity && (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          selectedNode.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {selectedNode.severity} Severity
                        </span>
                        {selectedNode.cvss && (
                          <span className="font-mono text-[10px] text-zinc-300">
                            CVSS: <strong className="text-rose-400">{selectedNode.cvss}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {selectedNode.details && (
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-mono bg-[#08090D] p-2 rounded-lg border border-[#1E2638]">
                        {selectedNode.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Terminal View */
              <div className="bg-[#08090D] border border-[#1C2333] rounded-xl p-4 font-mono text-xs text-zinc-200 overflow-y-auto max-h-[420px] leading-relaxed shadow-inner">
                <pre className="whitespace-pre-wrap">{log || 'Waiting for assessment engine telemetry output...'}</pre>
                <div ref={logBottomRef} />
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-[#1E2638] text-xs text-zinc-400 font-mono">
              <span>Status: <strong className="uppercase text-zinc-200">{status}</strong></span>
              <button
                onClick={() => setShowConsoleModal(false)}
                className="px-4 py-2 bg-zinc-900 dark:bg-[#161B26] hover:bg-zinc-800 dark:hover:bg-[#26324B] text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Console
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
