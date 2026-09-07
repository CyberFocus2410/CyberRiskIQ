import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { ShieldCheck, Percent, HelpCircle, Edit3, Sliders } from 'lucide-react';

export default function RiskQuantification() {
  const { assets, setAssets, calculateAssetRiskScore } = useRisk();
  const [editingAsset, setEditingAsset] = useState(null);

  const getScoreColorText = (score) => {
    if (score >= 70) return 'text-rose-500 dark:text-rose-400';
    if (score >= 40) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  const handleControlChange = (controlKey, value) => {
    const numericVal = Math.min(100, Math.max(0, Number(value) || 0));
    setAssets(prev => prev.map(a => {
      if (a.id === editingAsset.id) {
        return {
          ...a,
          controls: {
            ...(a.controls || {}),
            [controlKey]: numericVal
          }
        };
      }
      return a;
    }));
    setEditingAsset(prev => ({
      ...prev,
      controls: {
        ...(prev?.controls || {}),
        [controlKey]: numericVal
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-[#1E2638] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              TELEMETRY CALIBRATION
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Continuous Risk Quantification
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Risk scores computed continuously based on threat likelihood, business impact, exposure, and control effectiveness.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assets Risk Grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map(asset => {
              const risk = calculateAssetRiskScore(asset);
              const isSelected = editingAsset?.id === asset.id;
              return (
                <div 
                  key={asset.id} 
                  className={`bg-white dark:bg-[#0D1117] border rounded-xl p-5 shadow-sm space-y-4 transition-all ${
                    isSelected 
                      ? 'border-cyan-500 dark:border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                      : 'border-zinc-200 dark:border-[#1E2638] hover:border-zinc-300 dark:hover:border-[#26324B]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider">{asset.id}</span>
                      <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-zinc-100">{asset.name}</h3>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{asset.businessUnit} • {asset.tier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase font-mono tracking-wider font-semibold">Risk Rating</span>
                      <span className={`text-2xl font-extrabold font-mono ${getScoreColorText(risk)}`}>
                        {risk}<span className="text-xs text-zinc-500 dark:text-zinc-600 font-normal">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Controls summary */}
                  <div className="border-t border-zinc-100 dark:border-[#1E2638] pt-3">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider font-bold block mb-2">Controls Coverage</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">MFA: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.mfa ?? 0}%</span></div>
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">Patch: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.patching ?? 0}%</span></div>
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">EDR: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.edr ?? 0}%</span></div>
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">Seg: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.segmentation ?? 0}%</span></div>
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">SOC: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.monitoring ?? 0}%</span></div>
                      <div className="bg-zinc-50 dark:bg-[#121824] px-2 py-1 rounded border border-zinc-100 dark:border-[#1E2638]">Backup: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{asset.controls?.backup ?? 0}%</span></div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 flex items-center gap-1.5 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-cyan-500/10 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Adjust Control Efficacy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adjustments Editor Sidebar */}
        <div className="space-y-6">
          {editingAsset ? (
            <div className="bg-white dark:bg-[#0D1117] border border-cyan-500/40 dark:border-cyan-500/30 rounded-xl p-6 shadow-sm space-y-6 transition-all ring-1 ring-cyan-500/20">
              <div>
                <span className="font-mono text-xs text-cyan-500 dark:text-cyan-400 font-semibold uppercase tracking-wider">{editingAsset.id}</span>
                <h2 className="text-lg font-display font-bold text-zinc-950 dark:text-zinc-50">{editingAsset.name}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Fine-tune evidence levels or control effectiveness (0-100%).</p>
              </div>

              <div className="space-y-4 border-t border-zinc-100 dark:border-[#1E2638] pt-4">
                <h3 className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Control Effectiveness Rates
                </h3>

                <div className="space-y-3.5 text-xs font-medium">
                  {Object.entries(editingAsset.controls || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1.5 bg-zinc-50 dark:bg-[#121824] p-3 rounded-lg border border-zinc-100 dark:border-[#1E2638]">
                      <div className="flex justify-between items-center">
                        <label className="uppercase text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">{key}</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-12 bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#26324B] rounded px-1.5 py-0.5 text-center font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                            value={val}
                            onChange={e => handleControlChange(key, e.target.value)}
                          />
                          <span className="text-zinc-400 font-mono">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="w-full h-1.5 bg-zinc-200 dark:bg-[#1E2638] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        value={val}
                        onChange={e => handleControlChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-[#1E2638]">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
                >
                  Apply Calibration
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] rounded-xl p-6 text-center space-y-3 transition-theme">
              <HelpCircle className="w-8 h-8 text-cyan-400/60 mx-auto" />
              <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-zinc-50">Control Tuner</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Select an asset from the list to adjust the operating effectiveness rates of its local controls. Adjustments trigger instantaneous EAL updates across the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
