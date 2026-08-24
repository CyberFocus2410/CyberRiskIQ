// src/components/FinancialDrilldownModal.jsx
// Interactive Financial Explainability & Traceability Modal
// Provides itemized loss breakdown, probability calculations, primary drivers, and full traceability.

import React from 'react';
import Modal from './Modal';
import { 
  Landmark, 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Clock,
  Database,
  Scale,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function FinancialDrilldownModal({ isOpen, onClose, asset, org, ealData, onNavigateToAsset }) {
  if (!isOpen || !asset) return null;

  // Format currency helper
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const revenueScaler = (org?.annualRevenue || 500000000) / 500000000;
  const employeeScaler = (org?.employees || 1200) / 1200;

  const downtimeCost = Math.round((asset.downtimeCostPerHour || 50000) * revenueScaler * 4);
  const dataBreachCost = Math.round((asset.recordsExposed || 5000) * employeeScaler * (asset.costPerRecord || 150));
  const regulatoryCost = Math.round((asset.regulatoryPenalty || 500000) * revenueScaler);
  const recoveryCost = Math.round((asset.recoveryCost || 300000) * employeeScaler);
  const reputationCost = Math.round((asset.reputationFactor || 500000) * revenueScaler);
  const totalPotentialLoss = downtimeCost + dataBreachCost + regulatoryCost + recoveryCost + reputationCost;

  const riskScore = ealData?.riskScore || 50;
  const probability = ealData?.probability || (0.01 + (riskScore - 10) * (0.34 / 90));
  const eal = ealData?.eal || Math.round(probability * totalPotentialLoss);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Risk Explainability & Traceability"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
        {/* Header Summary Card */}
        <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider block">
              Asset Target: {asset.id} • {asset.businessUnit}
            </span>
            <h2 className="text-xl font-black text-zinc-950 dark:text-zinc-50">{asset.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{asset.businessService}</p>
          </div>

          <div className="flex items-baseline gap-4">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Expected Annual Loss (EAL)</span>
              <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(eal)}
              </span>
            </div>
          </div>
        </div>

        {/* Calculation Formula Banner */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Deterministic Formula Breakdown
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs md:text-sm font-semibold">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg">
              <span className="text-zinc-400 text-[10px] block font-sans">Incident Probability (P)</span>
              <span className="text-blue-600 dark:text-blue-400">{(probability * 100).toFixed(1)}% / yr</span>
            </div>
            <span className="text-zinc-400 font-bold text-lg">×</span>
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg">
              <span className="text-zinc-400 text-[10px] block font-sans">Potential Loss (L)</span>
              <span className="text-amber-600 dark:text-amber-400">{formatCurrency(totalPotentialLoss)}</span>
            </div>
            <span className="text-zinc-400 font-bold text-lg">=</span>
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-lg">
              <span className="text-rose-500 text-[10px] block font-sans">Expected Annual Loss (EAL)</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(eal)}</span>
            </div>
          </div>
        </div>

        {/* Itemized Financial Loss Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-blue-500" /> Itemized Potential Loss Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Downtime (Availability)
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(downtimeCost)}</div>
              <p className="text-[10px] text-zinc-500 font-sans">4h outage @ {formatCurrency(asset.downtimeCostPerHour)}/hr</p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[11px]">
                <Database className="w-3.5 h-3.5 text-purple-500" /> Data Breach Liability
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(dataBreachCost)}</div>
              <p className="text-[10px] text-zinc-500 font-sans">{(asset.recordsExposed || 0).toLocaleString()} recs @ ₹{asset.costPerRecord}/rec</p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[11px]">
                <Scale className="w-3.5 h-3.5 text-rose-500" /> Regulatory Penalties
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(regulatoryCost)}</div>
              <p className="text-[10px] text-zinc-500 font-sans">Statutory RBI/SEBI/DPDP liability</p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[11px]">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" /> Incident Recovery & Forensics
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(recoveryCost)}</div>
              <p className="text-[10px] text-zinc-500 font-sans">Technical restoration & vendor support</p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1 md:col-span-2">
              <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-500" /> Brand & Reputation Disruption
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(reputationCost)}</div>
              <p className="text-[10px] text-zinc-500 font-sans">Customer churn and market valuation impact</p>
            </div>
          </div>
        </div>

        {/* Primary Risk Drivers & Controls Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Primary Risk Drivers</span>
            <ul className="text-xs space-y-1.5 text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${asset.internetExposure === 'Yes' ? 'bg-rose-500' : 'bg-zinc-400'}`} />
                <span>Internet Exposure: <b>{asset.internetExposure === 'Yes' ? 'Direct Public Surface' : 'Internal Boundary'}</b></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Criticality Tier: <b>{asset.criticality}</b> ({asset.dataSensitivity} Data Sensitivity)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Upstream Dependencies: <b>{asset.dependencies?.length || 0} Connected Services</b></span>
              </li>
            </ul>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Control Coverage</span>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {asset.controls && Object.entries(asset.controls).map(([k, val]) => (
                <div key={k} className="bg-white dark:bg-zinc-950 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="uppercase text-[9px] text-zinc-400 block font-sans">{k}</span>
                  <span className={`font-bold ${val >= 70 ? 'text-emerald-500' : val >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {val}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Traceability Flow Path */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Connected Traceability Chain (Spec Section 21)
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
              {formatCurrency(eal)} EAL
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{asset.businessUnit}</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{asset.name}</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
              Score: {riskScore}/100
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
              Knapsack Portfolio
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </Modal>
  );
}
