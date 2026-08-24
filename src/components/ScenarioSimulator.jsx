import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { Sparkles, ArrowRight, ShieldCheck, Landmark, ShieldAlert, RotateCcw, TrendingDown, Clock, Layers } from 'lucide-react';

export default function ScenarioSimulator() {
  const { 
    org,
    assets,
    simulatedControls, 
    setSimulatedControls, 
    getEnterpriseStats, 
    getActiveStats,
    addAuditLog
  } = useRisk();

  const [delayedRemediation, setDelayedRemediation] = useState(false);

  const baseline = getActiveStats();
  const simulated = getEnterpriseStats();

  // If delayed remediation is simulated, add 15% to simulated EAL
  const finalSimulatedEal = delayedRemediation ? Math.round(simulated.eal * 1.15) : simulated.eal;
  const finalSimulatedRiskScore = delayedRemediation ? Math.min(100, simulated.riskScore + 6) : simulated.riskScore;

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleToggle = (controlKey) => {
    setSimulatedControls(prev => {
      const nextVal = !prev[controlKey];
      addAuditLog('SCENARIO_TOGGLED', controlKey, `Set hypothesis ${controlKey} to ${nextVal}`);
      return {
        ...prev,
        [controlKey]: nextVal
      };
    });
  };

  const handleReset = () => {
    setSimulatedControls({
      mfa: false, patching: false, edr: false, segmentation: false, monitoring: false, backup: false
    });
    setDelayedRemediation(false);
    addAuditLog('SCENARIO_RESET', 'All Hypotheses', 'Reset what-if overlays to baseline.');
  };

  const ealDelta = baseline.eal - finalSimulatedEal;
  const ealPercent = baseline.eal > 0 ? (ealDelta / baseline.eal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">What-if Scenario Simulator</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Simulate environmental shifts and control deployments against cloned state to evaluate dynamic EAL reductions.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg px-4.5 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Overlays
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Toggles Panel */}
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5 transition-theme">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> Control Hypotheses
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">Enforce Org-Wide MFA & PAM</span>
                <span className="text-[10px] text-zinc-400">Boosts MFA control coverage to 95%</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.mfa}
                onChange={() => handleToggle('mfa')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">Deploy Enterprise EDR</span>
                <span className="text-[10px] text-zinc-400">Boosts Endpoint Detection to 95%</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.edr}
                onChange={() => handleToggle('edr')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">Continuous Auto-Patching</span>
                <span className="text-[10px] text-zinc-400">Lowers exploitability on all nodes</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.patching}
                onChange={() => handleToggle('patching')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">Micro-segmentation Network</span>
                <span className="text-[10px] text-zinc-400">Isolates database horizontal blast radius</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.segmentation}
                onChange={() => handleToggle('segmentation')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">24/7 SOC & SIEM Monitoring</span>
                <span className="text-[10px] text-zinc-400">Enhances alert triage and response</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.monitoring}
                onChange={() => handleToggle('monitoring')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">Immutable Encrypted Backups</span>
                <span className="text-[10px] text-zinc-400">Reduces Recovery/Response costs by 70%</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                checked={simulatedControls.backup}
                onChange={() => handleToggle('backup')}
              />
            </div>

            {/* Adversarial / Operational Delay Toggle */}
            <div className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 mt-4">
              <div>
                <span className="font-bold text-xs text-rose-800 dark:text-rose-300 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Delay Remediation +30 Days
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400">Simulates exposure decay (+15% EAL liability)</span>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                checked={delayedRemediation}
                onChange={() => setDelayedRemediation(!delayedRemediation)}
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            
            {/* Left side: Baseline */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Baseline Posture</span>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Landmark className="w-4 h-4 text-zinc-400" /> Expected Loss (EAL)</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(baseline.eal)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-zinc-400" /> Total Exposure</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(baseline.exposure)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-zinc-400" /> Enterprise Risk Score</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{baseline.riskScore}/100</span>
                </div>
              </div>
            </div>

            {/* Right side: Simulated */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/80 pt-4 md:pt-0 md:pl-8">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Simulated Posture</span>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Landmark className="w-4 h-4 text-blue-500" /> Expected Loss (EAL)</span>
                  <span className={`font-mono text-sm font-bold ${finalSimulatedEal <= baseline.eal ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(finalSimulatedEal)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-blue-500" /> Total Exposure</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(simulated.exposure)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-500" /> Enterprise Risk Score</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{finalSimulatedRiskScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delta stats panel */}
          {ealDelta !== 0 && (
            <div className={`border rounded-xl p-5 flex items-center justify-between transition-theme ${
              ealDelta > 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
            }`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  {ealDelta > 0 ? 'Simulated Loss Reduction (ROI Benefit)' : 'Remediation Delay Penalty'}
                </span>
                <div className="text-xl font-extrabold font-mono">
                  {ealDelta > 0 ? `-${formatCurrency(ealDelta)} / year avoided` : `+${formatCurrency(Math.abs(ealDelta))} / year risk increase`}
                </div>
              </div>
              <div className={`px-3.5 py-1.5 rounded-full font-mono text-sm font-bold ${
                ealDelta > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
              }`}>
                {ealDelta > 0 ? `-${ealPercent.toFixed(1)}% EAL` : `+${Math.abs(ealPercent).toFixed(1)}% EAL`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
