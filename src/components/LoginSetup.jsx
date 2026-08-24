import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { Building2, IndianRupee, Users, ShieldAlert, Award, Save, Check } from 'lucide-react';

export default function LoginSetup() {
  const { org, setOrg } = useRisk();
  const [formData, setFormData] = useState({ ...org });
  const [newBu, setNewBu] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setOrg({
      ...formData,
      annualRevenue: Number(formData.annualRevenue),
      budget: Number(formData.budget),
      employees: Number(formData.employees)
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddBu = () => {
    if (newBu.trim() && !formData.businessUnits.includes(newBu.trim())) {
      setFormData(prev => ({
        ...prev,
        businessUnits: [...prev.businessUnits, newBu.trim()]
      }));
      setNewBu('');
    }
  };

  const handleRemoveBu = (bu) => {
    setFormData(prev => ({
      ...prev,
      businessUnits: prev.businessUnits.filter(b => b !== bu)
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Organization Setup & Profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Configure workspace variables, business context, and global risk parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6 bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> Organizational Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase">Organization Name *</label>
              <input
                type="text"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase">Industry *</label>
              <input
                type="text"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Total Employees
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.employees}
                onChange={e => setFormData({ ...formData, employees: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Annual Revenue (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                value={formData.annualRevenue}
                onChange={e => setFormData({ ...formData, annualRevenue: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Cybersecurity Budget (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Risk Appetite
              </label>
              <select
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.riskAppetite}
                onChange={e => setFormData({ ...formData, riskAppetite: e.target.value })}
              >
                <option value="Low">Low - Strict Compliance, Minimal Exposure</option>
                <option value="Medium">Medium - Balanced Risk-Reward</option>
                <option value="High">High - Aggressive Growth, High Tolerance</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {success && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-pulse">
                <Check className="w-4 h-4" /> Workspace updated successfully
              </span>
            )}
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" /> Business Units
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Business Unit..."
                  className="flex-1 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBu}
                  onChange={e => setNewBu(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBu())}
                />
                <button
                  type="button"
                  onClick={handleAddBu}
                  className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.businessUnits.map((bu, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 text-xs px-2.5 py-1 rounded-full"
                  >
                    {bu}
                    {formData.businessUnits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBu(bu)}
                        className="text-zinc-400 hover:text-rose-500 font-bold ml-1"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
