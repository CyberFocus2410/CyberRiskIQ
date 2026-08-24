// src/components/SecurityAssessmentControl.jsx
// CyberRiskIQ AI Security Assessment Engine Control Interface
// Supports both LIVE automated security scans and DEMONSTRATION / SYNTHETIC assessment runs.

import React, { useState, useRef, useEffect } from 'react';
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
  Layers
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
  const [showLogModal, setShowLogModal] = useState(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);

  const logBottomRef = useRef(null);

  useEffect(() => {
    if (showLogModal && logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log, showLogModal]);

  const startScan = () => {
    setShowConsent(true);
  };

  const confirmConsent = async () => {
    if (!consentAcknowledged) return;
    setShowConsent(false);
    setStatus('scanning');
    setErrorMessage('');
    setLog(`[CYBERRISKIQ-INIT] Initializing AI Security Assessment Engine...\nTarget: ${target}\nMode: ${assessmentMode === 'live' ? 'LIVE ASSESSMENT' : 'DEMONSTRATION / SYNTHETIC ASSESSMENT'}\nConnecting to security execution engine...\n`);
    
    let pollInterval = null;

    try {
      const resp = await fetch('/api/assessment/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, mode: assessmentMode })
      });
      
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Security assessment failed to start');
      }

      const activeRunId = data.runId;
      setRunId(activeRunId);

      // Poll logs & status
      pollInterval = setInterval(async () => {
        try {
          const logResp = await fetch(`/api/assessment/log/${activeRunId}`);
          if (logResp.ok) {
            const logData = await logResp.text();
            setLog(logData);
          }

          const resultResp = await fetch(`/api/assessment/result/${activeRunId}`);
          if (resultResp.ok) {
            const result = await resultResp.json();
            if (result.success && result.results) {
              clearInterval(pollInterval);
              if (ingestAssessmentFindings) {
                await ingestAssessmentFindings(result.results);
              }
              setStatus('done');
            }
          }
        } catch (pollErr) {
          console.warn('Error polling assessment telemetry:', pollErr);
        }
      }, 1500);
    } catch (e) {
      if (pollInterval) clearInterval(pollInterval);
      console.error(e);
      setErrorMessage(e.message || 'Security assessment error occurred');
      setStatus('error');
    }
  };

  const handleDownloadPdf = () => {
    if (!runId) return;
    window.open(`/api/assessment/report/${runId}`, '_blank');
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 block">AI Security Assessment</span>
            <span className="text-[10px] text-zinc-400 font-mono block">Autonomous Probing</span>
          </div>
        </div>

        {status === 'scanning' && (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium animate-pulse font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            ASSESSING
          </span>
        )}
        {status === 'done' && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold font-mono">
            <CheckCircle2 className="w-3 h-3" />
            READY
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold font-mono">
            <AlertTriangle className="w-3 h-3" />
            ERROR
          </span>
        )}
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-semibold">
        <button
          type="button"
          disabled={status === 'scanning'}
          onClick={() => setAssessmentMode('demo')}
          className={`flex-1 py-1 rounded transition-colors cursor-pointer text-center ${
            assessmentMode === 'demo'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Demo Mode
        </button>
        <button
          type="button"
          disabled={status === 'scanning'}
          onClick={() => setAssessmentMode('live')}
          className={`flex-1 py-1 rounded transition-colors cursor-pointer text-center ${
            assessmentMode === 'live'
              ? 'bg-purple-600 text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Live Mode
        </button>
      </div>

      {/* Target input */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
          Target Scope (Path or URL)
        </label>
        <input
          type="text"
          value={target}
          disabled={status === 'scanning'}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="./src or https://api.finsecure.internal"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 font-mono transition-colors disabled:opacity-60"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={startScan}
          disabled={status === 'scanning'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {status === 'scanning' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Assessment...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Launch AI Assessment</span>
            </>
          )}
        </button>

        {/* Secondary options when active or completed */}
        {(status === 'done' || runId || log) && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowLogModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Console</span>
            </button>

            {runId && (
              <button
                onClick={handleDownloadPdf}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>PDF</span>
              </button>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-[11px] text-rose-600 dark:text-rose-400 leading-tight">
          {errorMessage}
        </div>
      )}

      {/* Consent Modal */}
      {showConsent && (
        <Modal
          isOpen={showConsent}
          onClose={() => setShowConsent(false)}
          title="CyberRiskIQ AI Security Assessment Authorization"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">
                  {assessmentMode === 'live' ? 'Active Target Security Assessment' : 'Demonstration Security Assessment'}
                </span>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                  Target: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">{target}</code>.
                  {assessmentMode === 'live'
                    ? ' Autonomous LLM security testing agents will probe endpoints for exploit validation.'
                    : ' High-fidelity synthetic penetration testing scenarios will be simulated and validated.'}
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                By proceeding, you confirm that you have explicit, documented authorization to test the specified scope and that this assessment complies with organizational risk policy.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={consentAcknowledged}
                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
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
                className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!consentAcknowledged}
                onClick={confirmConsent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Authorize & Start Assessment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Live Console Output Modal */}
      {showLogModal && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="CyberRiskIQ AI Security Assessment Telemetry"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono text-zinc-500">
                <span>Session ID:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{runId || 'N/A'}</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-sans text-[10px] font-bold uppercase">
                  {assessmentMode.toUpperCase()} MODE
                </span>
              </div>
              {runId && (
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </button>
              )}
            </div>

            <div className="bg-[#09090d] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 overflow-y-auto max-h-[420px] leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{log || 'Waiting for assessment engine telemetry output...'}</pre>
              <div ref={logBottomRef} />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
              <span>Status: <strong className="uppercase text-zinc-300">{status}</strong></span>
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
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
