import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { ShieldCheck, Percent, HelpCircle, Edit3 } from 'lucide-react';

export default function RiskQuantification() {
  const { assets, setAssets, calculateAssetRiskScore } = useRisk();
  const [editingAsset, setEditingAsset] = useState(null);

  const getScoreColorText = (score) => {
    if (score >= 70) return 'text-rose-600 dark:text-rose-400';
    if (score >= 40) return 'text-orange-500';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const handleControlChange = (controlKey, value) => {
    const numericVal = Math.min(100, Math.max(0, Number(value) || 0));
    setAssets(prev => prev.map(a => {
      if (a.id === editingAsset.id) {
        return {
          ...a,
          controls: {
            ...a.controls,
            [controlKey]: numericVal
          }
        };
      }
      return a;
    }));
    setEditingAsset(prev => ({
      ...prev,
      controls: {
        ...prev.controls,
        [controlKey]: numericVal
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Continuous Risk Quantification</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
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
              return (
                <div 
                  key={asset.id} 
                  className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 transition-theme"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-zinc-400 block">{asset.id}</span>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{asset.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold">Risk Rating</span>
                      <span className={`text-xl font-extrabold font-mono ${getScoreColorText(risk)}`}>
                        {risk}/100
                      </span>
                    </div>
                  </div>

                  {/* Short summary of controls */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">Controls Coverage</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      <div>MFA: <span className="font-mono font-bold">{asset.controls.mfa}%</span></div>
                      <div>Patch: <span className="font-mono font-bold">{asset.controls.patching}%</span></div>
                      <div>EDR: <span className="font-mono font-bold">{asset.controls.edr}%</span></div>
                      <div>Seg: <span className="font-mono font-bold">{asset.controls.segmentation}%</span></div>
                      <div>SOC: <span className="font-mono font-bold">{asset.controls.monitoring}%</span></div>
                      <div>Backup: <span className="font-mono font-bold">{asset.controls.backup}%</span></div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Adjust Control Efficacy
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
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6 transition-theme">
              <div>
                <span className="font-mono text-xs text-zinc-400">{editingAsset.id}</span>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{editingAsset.name}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Fine-tune evidence levels or control effectiveness (0-100%).</p>
              </div>

              <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <h3 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Control Effectiveness Rates
                </h3>

                <div className="space-y-3.5 text-xs font-medium">
                  {Object.entries(editingAsset.controls).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="uppercase text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{key}</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={val}
                            onChange={e => handleControlChange(key, e.target.value)}
                          />
                          <span className="text-zinc-400">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        value={val}
                        onChange={e => handleControlChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
                >
                  Done Adjusting
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 text-center space-y-3 transition-theme">
              <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Control Tuner</h3>
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
