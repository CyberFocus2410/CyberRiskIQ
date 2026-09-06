// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { Building2, Key, ShieldCheck, ArrowRight, X, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { tenantId, switchTenant } = useRisk();
  const [inputTenantId, setInputTenantId] = useState(tenantId);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const handleSwitch = async (e) => {
    e.preventDefault();
    if (!inputTenantId.trim()) return;
    setIsSwitching(true);
    try {
      await switchTenant(inputTenantId.trim());
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateNewOrg = async () => {
    const newId = `org-${Math.random().toString(36).substring(2, 9)}`;
    setIsSwitching(true);
    try {
      await switchTenant(newId);
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#26324B] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-zinc-950 dark:text-zinc-50">Tenant & Workspace Session</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Switch workspace tenants or spin up an isolated new organization.</p>
        </div>

        <form onSubmit={handleSwitch} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-zinc-400 uppercase mb-1.5">Active Organization ID</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. org-demo-finsecure"
                className="w-full bg-zinc-50 dark:bg-[#121824] border border-zinc-200 dark:border-[#26324B] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                value={inputTenantId}
                onChange={e => setInputTenantId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSwitching}
              className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Key className="w-4 h-4" /> {isSwitching ? 'Switching...' : 'Switch Workspace'}
            </button>
          </div>
        </form>

        <div className="border-t border-zinc-200 dark:border-[#1E2638] pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setInputTenantId('org-demo-finsecure');
            }}
            className="w-full py-2 bg-zinc-100 dark:bg-[#121824] hover:bg-zinc-200 dark:hover:bg-[#1E2638] border border-zinc-200 dark:border-[#1E2638] text-zinc-700 dark:text-zinc-300 text-xs font-mono font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> Default Demo (FinSecure Bank)
          </button>

          <button
            type="button"
            onClick={handleCreateNewOrg}
            disabled={isSwitching}
            className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> Create Brand-New Blank Organization
          </button>
        </div>
      </div>
    </div>
  );
}
