// src/components/SettingsView.jsx
import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { 
  Building2, 
  IndianRupee, 
  Users, 
  Save, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';

export default function SettingsView() {
  const { org, updateOrg, loadDemoData, resetOrganization, loading } = useRisk();
  const [formData, setFormData] = useState({
    name: org.name || 'My Organization',
    industry: org.industry || 'Banking & Financial Services',
    employees: org.employees || 1200,
    annual_revenue: org.annual_revenue || org.annualRevenue || 500000000,
    budget: org.budget || 3500000,
    risk_appetite: org.risk_appetite || org.riskAppetite || 'Medium'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrg({
        name: formData.name,
        industry: formData.industry,
        employees: Number(formData.employees),
        annual_revenue: Number(formData.annual_revenue),
        budget: Number(formData.budget),
        risk_appetite: formData.risk_appetite
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your organization data? This will clear custom assets and findings.')) {
      await resetOrganization();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-zinc-200 dark:border-[#1E2638] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            TENANT CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Workspace & Organization Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Manage tenant parameters, financial baseline scaling, and demo data presets.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Organization settings saved successfully to the database.</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>Organization data reset to un-onboarded state.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-display font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-cyan-400" /> Organization Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase">Organization Name</label>
            <input
              type="text"
              required
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase">Industry Sector</label>
            <input
              type="text"
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
              value={formData.industry}
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Total Employees
            </label>
            <input
              type="number"
              min="1"
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
              value={formData.employees}
              onChange={e => setFormData({ ...formData, employees: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-cyan-400" /> Annual Revenue (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
              value={formData.annual_revenue}
              onChange={e => setFormData({ ...formData, annual_revenue: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-cyan-400" /> Security Budget (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 mb-1.5 uppercase">Risk Appetite</label>
            <select
              className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
              value={formData.risk_appetite}
              onChange={e => setFormData({ ...formData, risk_appetite: e.target.value })}
            >
              <option value="Low">Low (1.25x Multiplier)</option>
              <option value="Medium">Medium (1.0x Multiplier)</option>
              <option value="High">High (0.75x Multiplier)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-[#1E2638]">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Demo Preset & Danger Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-display font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Demo Dataset Preset
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
            Load the 52-asset FinSecure Bank dataset including retail banking, payment switches, databases, and CVE security findings.
          </p>
          <button
            type="button"
            onClick={loadDemoData}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4" /> Reload FinSecure Bank Demo
          </button>
        </div>

        <div className="bg-white dark:bg-[#0D1117] border border-rose-500/30 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-display font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Danger Zone
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
            Reset all organization assets and findings. This returns the workspace to the initial setup wizard.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black border border-rose-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset Organization Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
