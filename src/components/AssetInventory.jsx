import React, { useState } from 'react';
import { useRisk } from '../context/RiskContext';
import { Table, Network, ShieldCheck, ArrowRight, Eye, Play, Plus } from 'lucide-react';

export default function AssetInventory() {
  const { assets, calculateAssetRiskScore, calculateAssetFinancialImpact, addAsset, org } = useRisk();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or map
  const [filterBu, setFilterBu] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Application',
    owner: '',
    businessUnit: org.businessUnits[0] || 'Core Banking & Payments',
    criticality: 'Medium',
    dataSensitivity: 'Medium',
    internetExposure: 'No',
    downtimeCostPerHour: 50000,
    recordsExposed: 1000,
    costPerRecord: 100,
    regulatoryPenalty: 500000,
    recoveryCost: 200000,
    reputationFactor: 500000,
    dependencies: []
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addAsset({
      ...newAsset,
      downtimeCostPerHour: Number(newAsset.downtimeCostPerHour),
      recordsExposed: Number(newAsset.recordsExposed),
      costPerRecord: Number(newAsset.costPerRecord),
      regulatoryPenalty: Number(newAsset.regulatoryPenalty),
      recoveryCost: Number(newAsset.recoveryCost),
      reputationFactor: Number(newAsset.reputationFactor)
    });
    setShowAddForm(false);
    setNewAsset({
      name: '',
      type: 'Application',
      owner: '',
      businessUnit: org.businessUnits[0] || 'Core Banking & Payments',
      criticality: 'Medium',
      dataSensitivity: 'Medium',
      internetExposure: 'No',
      downtimeCostPerHour: 50000,
      recordsExposed: 1000,
      costPerRecord: 100,
      regulatoryPenalty: 500000,
      recoveryCost: 200000,
      reputationFactor: 500000,
      dependencies: []
    });
  };

  const businessUnits = ['All', ...new Set(assets.map(a => a.businessUnit))];

  const filteredAssets = assets.filter(a => {
    if (filterBu === 'All') return true;
    return a.businessUnit === filterBu;
  });

  const getCriticalityBadge = (level) => {
    const classes = {
      Critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
      High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50',
      Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50',
      Low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${classes[level] || classes.Low}`}>{level}</span>;
  };

  const getProgressColor = (score) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 40) return 'bg-orange-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Asset Inventory & Dependency Map</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Central registry of systems, servers, applications, and upstream/downstream flow.</p>
        </div>

        <div className="flex gap-2 bg-zinc-100 dark:bg-[#0c0c0f] p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Table Register
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'map' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Dependency Map
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Table Panel */}
          <div className={`transition-all duration-300 ${selectedAsset ? 'w-full lg:w-2/3' : 'w-full'} space-y-4`}>
            {/* Filters bar */}
            <div className="flex justify-between items-center bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Business Unit Filter:</span>
                <div className="flex flex-wrap gap-1">
                  {businessUnits.map((bu, i) => (
                    <button
                      key={i}
                      onClick={() => setFilterBu(bu)}
                      className={`text-xs px-3 py-1 rounded-md border transition-all cursor-pointer ${
                        filterBu === bu
                          ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 font-semibold'
                          : 'bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {bu}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <Plus className="w-3.5 h-3.5" /> Add Asset
              </button>
            </div>

            {/* Add Asset Form Card */}
            {showAddForm && (
              <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 transition-theme animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Add New IT Asset</h3>
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)} 
                    className="text-zinc-400 hover:text-rose-500 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Asset Name *</label>
                    <input 
                      type="text" required 
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.name}
                      onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Asset Type</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.type}
                      onChange={e => setNewAsset({...newAsset, type: e.target.value})}
                    >
                      {['Application', 'API', 'Database', 'Server', 'Endpoint', 'Identity Provider', 'Network Device', 'Cloud Resource', 'Business Service'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Owner / Custodian</label>
                    <input 
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.owner}
                      onChange={e => setNewAsset({...newAsset, owner: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Business Unit</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.businessUnit}
                      onChange={e => setNewAsset({...newAsset, businessUnit: e.target.value})}
                    >
                      {org.businessUnits.map(bu => (
                        <option key={bu} value={bu}>{bu}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Criticality</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.criticality}
                      onChange={e => setNewAsset({...newAsset, criticality: e.target.value})}
                    >
                      {['Critical', 'High', 'Medium', 'Low'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Internet Exposure</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.internetExposure}
                      onChange={e => setNewAsset({...newAsset, internetExposure: e.target.value})}
                    >
                      <option value="No">No (Internal Only)</option>
                      <option value="Yes">Yes (Exposed)</option>
                    </select>
                  </div>
                  
                  {/* Financial Factors */}
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Downtime Cost / Hour (₹)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.downtimeCostPerHour}
                      onChange={e => setNewAsset({...newAsset, downtimeCostPerHour: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Records Exposed (Qty)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.recordsExposed}
                      onChange={e => setNewAsset({...newAsset, recordsExposed: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Cost Per Record (₹)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.costPerRecord}
                      onChange={e => setNewAsset({...newAsset, costPerRecord: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Regulatory Penalty (₹)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.regulatoryPenalty}
                      onChange={e => setNewAsset({...newAsset, regulatoryPenalty: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Incident Recovery Cost (₹)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.recoveryCost}
                      onChange={e => setNewAsset({...newAsset, recoveryCost: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold uppercase">Reputation Impact (₹)</label>
                    <input 
                      type="number" min="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-zinc-950 dark:text-zinc-50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newAsset.reputationFactor}
                      onChange={e => setNewAsset({...newAsset, reputationFactor: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded px-4 py-1.5 shadow transition-colors cursor-pointer"
                    >
                      Save Asset
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                      <th className="p-4">ID</th>
                      <th className="p-4">Asset Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Business Unit</th>
                      <th className="p-4 text-center">Criticality</th>
                      <th className="p-4 text-center">Exposure</th>
                      <th className="p-4 text-right">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {filteredAssets.map(asset => {
                      const risk = calculateAssetRiskScore(asset);
                      const isSelected = selectedAsset?.id === asset.id;
                      return (
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="p-4 font-mono text-zinc-500 text-xs">{asset.id}</td>
                          <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{asset.name}</td>
                          <td className="p-4 text-xs text-zinc-500 dark:text-zinc-400">{asset.type}</td>
                          <td className="p-4 text-xs text-zinc-500 dark:text-zinc-400">{asset.businessUnit}</td>
                          <td className="p-4 text-center">{getCriticalityBadge(asset.criticality)}</td>
                          <td className="p-4 text-center text-xs">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              asset.internetExposure === 'Yes' 
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {asset.internetExposure === 'Yes' ? 'Internet' : 'Internal'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-xs">{risk}</span>
                              <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${getProgressColor(risk)}`} style={{ width: `${risk}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Details Sidebar Panel */}
          {selectedAsset && (
            <div className="w-full lg:w-1/3 bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-zinc-400">{selectedAsset.id}</span>
                    <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">{selectedAsset.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg font-bold"
                  >
                    &times;
                  </button>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-1">Asset Owner</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedAsset.owner}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Business Service</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedAsset.businessService}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Impact Potential</span>
                    <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                      ₹{(calculateAssetFinancialImpact(selectedAsset) / 100000).toFixed(1)} Lakh
                    </span>
                  </div>
                  {selectedAsset.dependencies.length > 0 && (
                    <div>
                      <span className="text-zinc-400 block mb-1">Upstream Dependencies</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedAsset.dependencies.map(depId => {
                          const depAsset = assets.find(a => a.id === depId);
                          return (
                            <span key={depId} className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 px-2.5 py-0.5 rounded font-mono text-[10px]">
                              {depAsset ? depAsset.name : depId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <h3 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 mb-2 uppercase tracking-wide">Controls Status</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedAsset.controls).map(([key, val]) => (
                    <div key={key} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-2 rounded-lg flex justify-between items-center">
                      <span className="uppercase text-[9px] text-zinc-400 font-bold">{key}</span>
                      <span className={`font-mono font-bold ${val >= 75 ? 'text-emerald-500' : val >= 45 ? 'text-orange-400' : 'text-rose-500'}`}>
                        {val}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Dependency Map Graph View */
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex flex-col items-center">
          <div className="max-w-xl text-center space-y-2 mb-6">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Infrastructure Flow & Blast Radius</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Click a node to inspect linkages. Connected lines indicate critical data flows.</p>
          </div>

          <div className="relative w-full max-w-4xl h-[450px] border border-zinc-100 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
            {/* Simple SVG Graph */}
            <svg className="w-full h-full" viewBox="0 0 800 450">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
                </marker>
              </defs>

              {/* Connections */}
              <line x1="200" y1="225" x2="400" y2="125" stroke="#71717a" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrow)" />
              <line x1="400" y1="125" x2="600" y2="225" stroke="#71717a" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="400" y1="325" x2="200" y2="225" stroke="#71717a" strokeWidth="2" markerEnd="url(#arrow)" />

              {/* Node 1: E-Commerce Frontend */}
              <g transform="translate(200, 225)" className="cursor-pointer group" onClick={() => setSelectedAsset(assets[1])}>
                <circle r="30" fill="#0284c7" className="group-hover:fill-blue-500 transition-colors shadow" />
                <text y="5" textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold font-mono">AST-002</text>
                <text y="48" textAnchor="middle" fill="currentColor" className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300">Web Frontend</text>
              </g>

              {/* Node 2: Payment Gateway API */}
              <g transform="translate(400, 125)" className="cursor-pointer group" onClick={() => setSelectedAsset(assets[0])}>
                <circle r="35" fill="#e11d48" className="group-hover:fill-rose-500 transition-colors shadow" />
                <text y="5" textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold font-mono">AST-001</text>
                <text y="52" textAnchor="middle" fill="currentColor" className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300">Payment Gateway API</text>
              </g>

              {/* Node 3: Customer DB */}
              <g transform="translate(600, 225)" className="cursor-pointer group" onClick={() => setSelectedAsset(assets[2])}>
                <circle r="40" fill="#db2777" className="group-hover:fill-pink-500 transition-colors shadow animate-pulse" />
                <text y="5" textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold font-mono">AST-003</text>
                <text y="56" textAnchor="middle" fill="currentColor" className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300">Customer DB</text>
              </g>

              {/* Node 4: Active Directory */}
              <g transform="translate(400, 325)" className="cursor-pointer group" onClick={() => setSelectedAsset(assets[3])}>
                <circle r="30" fill="#4f46e5" className="group-hover:fill-indigo-500 transition-colors shadow" />
                <text y="5" textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold font-mono">AST-004</text>
                <text y="48" textAnchor="middle" fill="currentColor" className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300">Active Directory</text>
              </g>
            </svg>
            
            {/* Quick overlay card */}
            {selectedAsset && (
              <div className="absolute bottom-4 right-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-lg w-72 text-xs space-y-1.5 transition-all">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-950 dark:text-zinc-50">{selectedAsset.name}</span>
                  <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[9px]">{selectedAsset.id}</span>
                </div>
                <div>Criticality: <span className="font-bold text-amber-600">{selectedAsset.criticality}</span></div>
                <div>Service: <span className="font-medium text-zinc-500">{selectedAsset.businessService}</span></div>
                <div className="pt-1 flex justify-between items-center">
                  <span className="text-zinc-400 font-mono">EAL: ₹{(calculateAssetFinancialImpact(selectedAsset)/100000).toFixed(0)}L</span>
                  <button onClick={() => setSelectedAsset(null)} className="text-blue-500 hover:underline">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
