// src/components/OnboardingWizard.jsx
import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { 
  Building2, 
  Layers, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  IndianRupee,
  Users,
  AlertTriangle
} from 'lucide-react';

const INITIAL_STEPS = [
  { id: 1, label: 'Org Profile', icon: Building2 },
  { id: 2, label: 'Business Units', icon: Layers },
  { id: 3, label: 'Asset Inventory', icon: Database },
  { id: 4, label: 'Defensive Controls', icon: ShieldCheck }
];

export default function OnboardingWizard({ onComplete }) {
  const { completeOnboarding, loadDemoData, loading } = useRisk();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Org Profile
  const [orgData, setOrgData] = useState({
    name: '',
    industry: 'Banking & Financial Services',
    employees: 1200,
    annual_revenue: 500000000,
    budget: 3500000,
    risk_appetite: 'Medium'
  });

  // Step 2: Business Units
  const [businessUnits, setBusinessUnits] = useState([
    'Retail Banking',
    'Corporate Banking',
    'Payments & Settlement',
    'Core IT & Infrastructure'
  ]);
  const [newBuInput, setNewBuInput] = useState('');

  // Step 3: Assets & Business Impact
  const [assetsList, setAssetsList] = useState([
    {
      name: 'Primary API Gateway',
      type: 'API',
      business_unit: 'Payments & Settlement',
      criticality: 'Critical',
      data_sensitivity: 'High',
      internet_exposure: 'Yes',
      records_exposed: 50000,
      downtime_cost_per_hour: 250000,
      cost_per_record: 250,
      regulatory_penalty: 5000000,
      recovery_cost: 1500000,
      reputation_factor: 3000000
    }
  ]);

  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Application',
    business_unit: 'Retail Banking',
    criticality: 'High',
    data_sensitivity: 'Medium',
    internet_exposure: 'No',
    records_exposed: 5000,
    downtime_cost_per_hour: 50000,
    cost_per_record: 150,
    regulatory_penalty: 500000,
    recovery_cost: 300000,
    reputation_factor: 500000
  });

  // Step 4: Control Sliders
  const [initialControls, setInitialControls] = useState({
    mfa: 40,
    patching: 50,
    edr: 60,
    segmentation: 35,
    monitoring: 55,
    backup: 75
  });

  const handleAddBu = () => {
    if (newBuInput.trim() && !businessUnits.includes(newBuInput.trim())) {
      setBusinessUnits([...businessUnits, newBuInput.trim()]);
      setNewBuInput('');
    }
  };

  const handleRemoveBu = (bu) => {
    if (businessUnits.length > 1) {
      setBusinessUnits(businessUnits.filter(b => b !== bu));
    }
  };

  const handleAddAsset = () => {
    if (!newAsset.name.trim()) return;
    setAssetsList([...assetsList, { ...newAsset }]);
    setNewAsset({
      name: '',
      type: 'Application',
      business_unit: businessUnits[0] || 'General',
      criticality: 'High',
      data_sensitivity: 'Medium',
      internet_exposure: 'No',
      records_exposed: 5000,
      downtime_cost_per_hour: 50000,
      cost_per_record: 150,
      regulatory_penalty: 500000,
      recovery_cost: 300000,
      reputation_factor: 500000
    });
  };

  const handleRemoveAsset = (idx) => {
    setAssetsList(assetsList.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setAssetsList(prev => [...prev, ...parsed]);
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const imported = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (cols.length >= 2) {
              imported.push({
                name: cols[0] || `Imported Asset ${i}`,
                type: cols[1] || 'Application',
                business_unit: cols[2] || businessUnits[0] || 'Retail Banking',
                criticality: cols[3] || 'Medium',
                data_sensitivity: cols[4] || 'Medium',
                internet_exposure: cols[5] || 'No',
                records_exposed: parseInt(cols[6]) || 5000,
                downtime_cost_per_hour: parseFloat(cols[7]) || 50000,
                cost_per_record: parseFloat(cols[8]) || 150,
                regulatory_penalty: parseFloat(cols[9]) || 500000,
                recovery_cost: parseFloat(cols[10]) || 300000,
                reputation_factor: parseFloat(cols[11]) || 500000
              });
            }
          }
          if (imported.length > 0) {
            setAssetsList(prev => [...prev, ...imported]);
          }
        }
      } catch (err) {
        setErrorMsg('Failed to parse uploaded file. Please ensure valid CSV/JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleFinishOnboarding = async () => {
    if (!orgData.name.trim()) {
      setErrorMsg('Organization name is required.');
      setCurrentStep(1);
      return;
    }
    if (assetsList.length === 0) {
      setErrorMsg('Please add at least one asset to your inventory.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        organization: {
          name: orgData.name,
          industry: orgData.industry,
          employees: Number(orgData.employees),
          annual_revenue: Number(orgData.annual_revenue),
          budget: Number(orgData.budget),
          risk_appetite: orgData.risk_appetite
        },
        business_units: businessUnits,
        assets: assetsList.map(a => ({
          name: a.name,
          type: a.type,
          business_unit: a.business_unit,
          criticality: a.criticality,
          data_sensitivity: a.data_sensitivity,
          internet_exposure: a.internet_exposure,
          records_exposed: Number(a.records_exposed),
          downtime_cost_per_hour: Number(a.downtime_cost_per_hour),
          cost_per_record: Number(a.cost_per_record),
          regulatory_penalty: Number(a.regulatory_penalty),
          recovery_cost: Number(a.recovery_cost),
          reputation_factor: Number(a.reputation_factor),
          controls: initialControls
        })),
        initial_controls: initialControls
      };

      await completeOnboarding(payload);
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    setErrorMsg('');
    try {
      await loadDemoData();
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load demo data.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 animate-fade-in">
      {/* Top Banner & Demo Shortcut */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Setup Wizard
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Configure Your CyberRiskIQ Workspace</h1>
          <p className="text-zinc-300 text-xs mt-1">Set up your organization's business context, asset registry, and baseline defense posture.</p>
        </div>
        <button
          onClick={handleLoadDemo}
          disabled={demoLoading}
          className="flex-shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {demoLoading ? 'Seeding Demo...' : 'Load FinSecure Bank Demo (52 Assets)'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Indicator Header */}
      <div className="grid grid-cols-4 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {INITIAL_STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                isActive 
                  ? 'bg-blue-600/10 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold shadow-sm' 
                  : isDone
                  ? 'text-emerald-500 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500 opacity-60'
              }`}
            >
              <div className={`p-2 rounded-lg text-xs ${
                isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-600/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Step {s.id}</span>
                <span className="text-xs truncate block">{s.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: ORGANIZATION PROFILE */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Step 1: Organization Profile & Financial Baseline
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">These parameters scale the deterministic Expected Annual Loss (EAL) calculations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase">Organization Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Financial Services"
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.name}
                onChange={e => setOrgData({ ...orgData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase">Industry Sector</label>
              <select
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.industry}
                onChange={e => setOrgData({ ...orgData, industry: e.target.value })}
              >
                <option value="Banking & Financial Services">Banking & Financial Services</option>
                <option value="Fintech & Payments">Fintech & Payments</option>
                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
                <option value="Manufacturing & Energy">Manufacturing & Energy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Total Employees
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.employees}
                onChange={e => setOrgData({ ...orgData, employees: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Annual Revenue (₹)
              </label>
              <input
                type="number"
                min="0"
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.annual_revenue}
                onChange={e => setOrgData({ ...orgData, annual_revenue: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Security Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.budget}
                onChange={e => setOrgData({ ...orgData, budget: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase">Risk Appetite</label>
              <select
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orgData.risk_appetite}
                onChange={e => setOrgData({ ...orgData, risk_appetite: e.target.value })}
              >
                <option value="Low">Low (Conservative, 1.25x Risk Multiplier)</option>
                <option value="Medium">Medium (Balanced, 1.0x Multiplier)</option>
                <option value="High">High (Aggressive, 0.75x Multiplier)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                if (!orgData.name.trim()) {
                  setErrorMsg('Organization name is required.');
                  return;
                }
                setErrorMsg('');
                setCurrentStep(2);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Continue to Business Units <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUSINESS UNITS */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" /> Step 2: Define Business Units & Divisions
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Assets roll up to these operational units for financial and risk aggregation.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Digital Banking, Wealth Management"
              className="flex-1 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newBuInput}
              onChange={e => setNewBuInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBu())}
            />
            <button
              type="button"
              onClick={handleAddBu}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Unit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {businessUnits.map((bu) => (
              <div
                key={bu}
                className="p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{bu}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBu(bu)}
                  disabled={businessUnits.length <= 1}
                  className="p-1 text-zinc-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              Continue to Asset Inventory <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ASSET INVENTORY & IMPACT */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" /> Step 3: Asset Inventory & Business Impact
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Enter enterprise assets manually or bulk upload CSV/JSON files.</p>
            </div>
            <div>
              <label className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-blue-500" /> Bulk CSV / JSON Upload
                <input type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* Quick Add Form */}
          <div className="p-4 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Add New Asset</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Core Banking DB"
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Asset Type</label>
                <select
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  value={newAsset.type}
                  onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                >
                  <option value="Application">Application</option>
                  <option value="API">API</option>
                  <option value="Database">Database</option>
                  <option value="Server">Server</option>
                  <option value="Endpoint">Endpoint</option>
                  <option value="Identity Provider">Identity Provider</option>
                  <option value="Network Device">Network Device</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Business Unit</label>
                <select
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  value={newAsset.business_unit}
                  onChange={e => setNewAsset({ ...newAsset, business_unit: e.target.value })}
                >
                  {businessUnits.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Criticality</label>
                <select
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  value={newAsset.criticality}
                  onChange={e => setNewAsset({ ...newAsset, criticality: e.target.value })}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Internet Exposed</label>
                <select
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  value={newAsset.internet_exposure}
                  onChange={e => setNewAsset({ ...newAsset, internet_exposure: e.target.value })}
                >
                  <option value="No">No (Internal)</option>
                  <option value="Yes">Yes (Public Facing)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Downtime Cost / Hr (₹)</label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  value={newAsset.downtime_cost_per_hour}
                  onChange={e => setNewAsset({ ...newAsset, downtime_cost_per_hour: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Records Exposed</label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  value={newAsset.records_exposed}
                  onChange={e => setNewAsset({ ...newAsset, records_exposed: e.target.value })}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAsset}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Asset to Registry
            </button>
          </div>

          {/* Asset List Preview Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-500">Configured Assets ({assetsList.length})</span>
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800">
              {assetsList.map((a, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-[#0c0c0f] flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">{a.name}</span>
                    <span className="text-[10px] text-zinc-400 block">{a.type} • {a.business_unit} • {a.criticality} Criticality • {a.internet_exposure === 'Yes' ? 'Internet Exposed' : 'Internal'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-zinc-500">₹{(a.downtime_cost_per_hour * 4 / 100000).toFixed(1)}L loss</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(idx)}
                      className="text-zinc-400 hover:text-red-500 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              Continue to Defensive Controls <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INITIAL CONTROLS POSTURE */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> Step 4: Baseline Control Effectiveness Posture
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Set your organization's initial defensive effectiveness percentages (0% - 100%).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: 'mfa', label: 'MFA & PAM Access Enforcement', desc: 'Reduces credential compromise likelihood.' },
              { key: 'patching', label: 'Automated Patch Management', desc: 'Closes known CVE vulnerabilities.' },
              { key: 'edr', label: 'Endpoint Detection & Response', desc: 'Rapid automated containment of host breaches.' },
              { key: 'segmentation', label: 'Micro-segmentation & Zero Trust', desc: 'Restricts horizontal blast radius between apps.' },
              { key: 'monitoring', label: '24/7 SOC & SIEM Telemetry', desc: 'Early incident detection and alert triage.' },
              { key: 'backup', label: 'Immutable Encrypted Backups', desc: 'Reduces recovery and restoration expense by 70%.' }
            ].map(ctrl => (
              <div key={ctrl.key} className="p-4 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ctrl.label}</span>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{initialControls[ctrl.key]}%</span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{ctrl.desc}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={initialControls[ctrl.key]}
                  onChange={e => setInitialControls({ ...initialControls, [ctrl.key]: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving to Database...' : 'Complete Setup & Launch Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
