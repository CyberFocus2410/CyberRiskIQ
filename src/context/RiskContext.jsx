// src/context/RiskContext.jsx
/**
 * CyberRiskIQ Thin-Client React Context
 * Stores server-calculated state, manages tenant session, and dispatches API requests to FastAPI backend.
 * Provides resilient fallbacks, normalized camelCase + snake_case property accessors, and instantaneous client-side knapsack solvers.
 */
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { api, getStoredTenantId, setStoredTenantId } from '../services/apiClient';

const RiskContext = createContext();

export const CONTROLS_LIBRARY = [
  {
    id: 'ctrl-mfa',
    key: 'mfa',
    name: 'Enforce Strong MFA & PAM',
    cost: 1200000,
    reduction: 0.25,
    description: 'Reduces Threat Likelihood for access breaches and credential replay.'
  },
  {
    id: 'ctrl-patching',
    key: 'patching',
    name: 'Continuous Automated Patching',
    cost: 1500000,
    reduction: 0.30,
    description: 'Remediates known vulnerabilities and lowers exploitability ratings.'
  },
  {
    id: 'ctrl-edr',
    key: 'edr',
    name: 'Deploy Next-Gen EDR Agent',
    cost: 1800000,
    reduction: 0.35,
    description: 'Improves endpoint detection and rapid automated isolation.'
  },
  {
    id: 'ctrl-segmentation',
    key: 'segmentation',
    name: 'Micro-segmentation & Zero Trust Network',
    cost: 2500000,
    reduction: 0.40,
    description: 'Minimizes horizontal blast radius between apps and critical databases.'
  },
  {
    id: 'ctrl-monitoring',
    key: 'monitoring',
    name: '24/7 SOC & SIEM Monitoring',
    cost: 1000000,
    reduction: 0.20,
    description: 'Improves early detection and incident responsiveness.'
  },
  {
    id: 'ctrl-backup',
    key: 'backup',
    name: 'Immutable Encrypted Cloud Backups',
    cost: 600000,
    reduction: 0.15,
    description: 'Drastically lowers data recovery and restoration expenses by 70%.'
  }
];

export const RiskProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(getStoredTenantId());
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Server-synced state with normalized aliases
  const [org, setOrg] = useState({
    id: tenantId,
    name: 'FinSecure Bank',
    industry: 'Banking & Financial Services',
    employees: 1200,
    annual_revenue: 500000000,
    annualRevenue: 500000000,
    budget: 3500000,
    risk_appetite: 'Medium',
    riskAppetite: 'Medium',
    business_units: ['Retail Banking', 'Corporate Banking', 'Payments & Settlement', 'Core IT & Infrastructure'],
    businessUnits: ['Retail Banking', 'Corporate Banking', 'Payments & Settlement', 'Core IT & Infrastructure'],
    onboarding_completed: true,
    onboardingCompleted: true
  });

  const [assets, setAssets] = useState([]);
  const [findings, setFindings] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    organization_name: 'FinSecure Bank',
    asset_count: 52,
    assetCount: 52,
    findings_count: 6,
    findingsCount: 6,
    enterprise_risk_score: 68,
    enterpriseRiskScore: 68,
    riskScore: 68,
    total_eal: 32500000,
    totalEal: 32500000,
    eal: 32500000,
    total_exposure: 185000000,
    totalExposure: 185000000,
    exposure: 185000000,
    budget: 3500000,
    bu_distribution: {},
    buDistribution: {},
    category_totals: { downtime: 18000000, data_breach: 95000000, regulatory: 32000000, recovery: 15000000, reputation: 25000000 },
    categoryTotals: { downtime: 18000000, data_breach: 95000000, regulatory: 32000000, recovery: 15000000, reputation: 25000000 },
    top_risks: []
  });

  const [risks, setRisks] = useState([]);
  const [financialExposure, setFinancialExposure] = useState({
    total_eal: 32500000,
    total_financial_exposure: 185000000,
    bu_distribution: {},
    category_totals: { downtime: 18000000, data_breach: 95000000, regulatory: 32000000, recovery: 15000000, reputation: 25000000 },
    asset_financials: []
  });
  const [compliancePosture, setCompliancePosture] = useState({
    nist: { name: 'NIST CSF', coverage_pct: 74, controls: [] },
    iso: { name: 'ISO/IEC 27001', coverage_pct: 78, controls: [] },
    rbi: { name: 'RBI CSF', coverage_pct: 68, controls: [] },
    sebi: { name: 'SEBI CSCRF', coverage_pct: 82, controls: [] },
    cis: { name: 'CIS Controls', coverage_pct: 68, controls: [] }
  });
  const [optimizationResult, setOptimizationResult] = useState(null);

  // Active Simulation Overrides
  const [simulatedControls, setSimulatedControls] = useState({
    mfa: false,
    patching: false,
    edr: false,
    segmentation: false,
    monitoring: false,
    backup: false
  });
  const [simulatedExposure, setSimulatedExposure] = useState({});
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Priya Sharma (SecOps Lead)',
      action: 'SYSTEM_BOOT',
      entity: 'Platform Core',
      details: 'Deterministic quantitative risk engine initialized for FinSecure Bank.'
    }
  ]);
  const [ingestionHistory, setIngestionHistory] = useState([
    {
      id: 'batch-001',
      source: 'FinSecure Bank Seed Importer',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      count: 6
    }
  ]);

  const addAuditLog = useCallback((action, entity, details) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user: 'SecOps Administrator',
      action,
      entity,
      details
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Fetch all authoritative server data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgData, assetsData, findingsData, summaryData, risksData, finData, compData] = await Promise.all([
        api.getOrganization().catch(() => null),
        api.getAssets().catch(() => []),
        api.getFindings().catch(() => []),
        api.getDashboardSummary().catch(() => null),
        api.getRisks().catch(() => []),
        api.getFinancialExposure().catch(() => null),
        api.getCompliancePosture().catch(() => null)
      ]);

      if (orgData) {
        setOrg({
          ...orgData,
          annualRevenue: orgData.annual_revenue ?? orgData.annualRevenue ?? 500000000,
          riskAppetite: orgData.risk_appetite ?? orgData.riskAppetite ?? 'Medium',
          businessUnits: orgData.business_units ?? orgData.businessUnits ?? ['Retail Banking', 'Corporate Banking', 'Payments & Settlement', 'Core IT & Infrastructure'],
          onboardingCompleted: orgData.onboarding_completed ?? orgData.onboardingCompleted ?? true
        });
      }

      if (Array.isArray(assetsData) && assetsData.length > 0) {
        const normalizedAssets = assetsData.map(a => ({
          ...a,
          businessUnit: a.business_unit ?? a.businessUnit ?? 'Payments & Settlement',
          dataSensitivity: a.data_sensitivity ?? a.dataSensitivity ?? 'Medium',
          internetExposure: a.internet_exposure ?? a.internetExposure ?? 'No',
          downtimeCostPerHour: a.downtime_cost_per_hour ?? a.downtimeCostPerHour ?? 50000,
          recordsExposed: a.records_exposed ?? a.recordsExposed ?? 5000,
          costPerRecord: a.cost_per_record ?? a.costPerRecord ?? 150,
          regulatoryPenalty: a.regulatory_penalty ?? a.regulatoryPenalty ?? 500000,
          recoveryCost: a.recovery_cost ?? a.recoveryCost ?? 300000,
          reputationFactor: a.reputation_factor ?? a.reputationFactor ?? 500000
        }));
        setAssets(normalizedAssets);
      }

      if (Array.isArray(findingsData) && findingsData.length > 0) {
        const normalizedFindings = findingsData.map(f => ({
          ...f,
          assetId: f.asset_id ?? f.assetId,
          exploitAvailable: f.exploit_available ?? f.exploitAvailable ?? false,
          internetExposed: f.internet_exposed ?? f.internetExposed ?? false,
          pocAttached: f.poc_attached ?? f.pocAttached ?? false,
          controlState: f.control_state ?? f.controlState ?? '',
          discoveredAt: f.discovered_at ?? f.discoveredAt ?? new Date().toISOString()
        }));
        setFindings(normalizedFindings);
      }

      if (summaryData) {
        const totalEal = summaryData.total_eal ?? summaryData.totalEal ?? 0;
        const totalExposure = summaryData.total_exposure ?? summaryData.totalExposure ?? 0;
        const riskScore = summaryData.enterprise_risk_score ?? summaryData.enterpriseRiskScore ?? 10;
        setSummaryStats({
          ...summaryData,
          total_eal: totalEal,
          totalEal: totalEal,
          eal: totalEal,
          total_exposure: totalExposure,
          totalExposure: totalExposure,
          exposure: totalExposure,
          enterprise_risk_score: riskScore,
          enterpriseRiskScore: riskScore,
          riskScore: riskScore,
          asset_count: summaryData.asset_count ?? summaryData.assetCount ?? 0,
          assetCount: summaryData.asset_count ?? summaryData.assetCount ?? 0,
          findings_count: summaryData.findings_count ?? summaryData.findingsCount ?? 0,
          findingsCount: summaryData.findings_count ?? summaryData.findingsCount ?? 0,
          bu_distribution: summaryData.bu_distribution ?? summaryData.buDistribution ?? {},
          buDistribution: summaryData.bu_distribution ?? summaryData.buDistribution ?? {},
          category_totals: summaryData.category_totals ?? summaryData.categoryTotals ?? {},
          categoryTotals: summaryData.category_totals ?? summaryData.categoryTotals ?? {}
        });
      }

      if (Array.isArray(risksData)) setRisks(risksData);
      if (finData) setFinancialExposure(finData);
      if (compData && typeof compData === 'object') setCompliancePosture(compData);
    } catch (err) {
      console.error('[RiskContext] Failed refreshing data from backend API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Actions
  const switchTenant = async (newTenantId) => {
    setStoredTenantId(newTenantId);
    setTenantId(newTenantId);
    await refreshData();
  };

  const updateOrg = async (data) => {
    const updated = await api.updateOrganization(data);
    setOrg(prev => ({
      ...prev,
      ...updated,
      annualRevenue: updated.annual_revenue ?? updated.annualRevenue ?? prev.annualRevenue,
      riskAppetite: updated.risk_appetite ?? updated.riskAppetite ?? prev.riskAppetite,
      businessUnits: updated.business_units ?? updated.businessUnits ?? prev.businessUnits
    }));
    await refreshData();
    return updated;
  };

  const completeOnboarding = async (payload) => {
    const res = await api.completeOnboarding(payload);
    await refreshData();
    return res;
  };

  const loadDemoData = async () => {
    const res = await api.loadDemoData();
    await refreshData();
    addAuditLog('DEMO_RESET', 'FinSecure Bank', 'Re-seeded demo environment with 52 assets and telemetry.');
    return res;
  };

  const resetOrganization = async () => {
    const res = await api.resetOrganization();
    await refreshData();
    return res;
  };

  const addAsset = async (newAsset) => {
    const created = await api.createAsset(newAsset);
    addAuditLog('ASSET_CREATED', newAsset.name || created.id, `Created ${newAsset.type || 'Asset'} under ${newAsset.businessUnit || 'Default BU'}`);
    await refreshData();
    return created;
  };

  const updateAsset = async (id, assetData) => {
    const updated = await api.updateAsset(id, assetData);
    addAuditLog('ASSET_UPDATED', id, `Updated asset telemetry configuration`);
    await refreshData();
    return updated;
  };

  const deleteAsset = async (id) => {
    const res = await api.deleteAsset(id);
    addAuditLog('ASSET_DELETED', id, `Removed asset from active inventory`);
    await refreshData();
    return res;
  };

  const addFinding = async (newFinding) => {
    const created = await api.createFinding({
      asset_id: newFinding.assetId || newFinding.asset_id,
      vulnerability: newFinding.vulnerability,
      source: newFinding.source || 'CyberRiskIQ Security Engine',
      severity: newFinding.severity || 'Medium',
      cvss: parseFloat(newFinding.cvss) || 5.0,
      exploit_available: newFinding.exploitAvailable === true || newFinding.exploit_available === true,
      internet_exposed: newFinding.internetExposed === true || newFinding.internet_exposed === true,
      evidence: newFinding.evidence || '',
      control_state: newFinding.controlState || newFinding.control_state || '',
      remediation: newFinding.remediation || '',
      poc_attached: newFinding.pocAttached === true || newFinding.poc_attached === true
    });
    addAuditLog('FINDING_INGESTED', created.id, `Discovered ${newFinding.severity} severity finding: ${newFinding.vulnerability}`);
    await refreshData();
    return created;
  };

  const runOptimization = async (budget, lockedIn = [], lockedOut = []) => {
    const result = await api.runOptimization(budget, lockedIn, lockedOut);
    setOptimizationResult(result);
    return result;
  };

  const simulateScenario = async (controlsOverride = {}, exposureOverride = {}, delay30Days = false) => {
    return await api.simulateScenario(controlsOverride, exposureOverride, delay30Days);
  };

  const queryAI = async (queryText) => {
    return await api.queryAIAnalyst(queryText, simulatedControls);
  };

  const ingestSecurityData = (recordsOrSourceName, maybeRawRecords) => {
    let sourceName = 'Manual Upload Telemetry';
    let rawRecords = [];

    if (typeof recordsOrSourceName === 'string') {
      sourceName = recordsOrSourceName;
      rawRecords = Array.isArray(maybeRawRecords) ? maybeRawRecords : [];
    } else if (Array.isArray(recordsOrSourceName)) {
      rawRecords = recordsOrSourceName;
      sourceName = typeof maybeRawRecords === 'string' ? maybeRawRecords : 'Batch Ingest Telemetry';
    }

    if (rawRecords.length === 0) return;

    setIngestionHistory(prev => [
      {
        id: `batch-${Date.now()}`,
        source: sourceName,
        timestamp: new Date().toISOString(),
        count: rawRecords.length
      },
      ...prev
    ]);

    rawRecords.forEach(async (r) => {
      try {
        await api.createFinding({
          asset_id: r.assetId || r.asset_id || 'AST-001',
          vulnerability: r.vulnerability || r.title || 'Discovered Vulnerability',
          source: sourceName,
          severity: r.severity || 'Medium',
          cvss: parseFloat(r.cvss) || 5.0,
          exploit_available: r.exploitAvailable === true || r.exploit_available === true || r.exploitAvailable === 'Yes',
          internet_exposed: r.internetExposed === true || r.internet_exposed === true || r.internetExposed === 'Yes',
          evidence: r.evidence || '',
          control_state: r.controlState || r.control_state || '',
          remediation: r.remediation || '',
          poc_attached: r.pocAttached === true || r.poc_attached === true || r.pocAttached === 'Yes'
        });
      } catch (_) {}
    });

    addAuditLog('BATCH_INGEST', sourceName, `Ingested ${rawRecords.length} findings.`);
    setTimeout(() => refreshData(), 500);
  };

  // Mathematical Calculation Helpers & Fallbacks
  const calculateCorrelatedRiskIndicator = useCallback((finding, asset) => {
    if (!finding) return 5.0;
    const cvss = parseFloat(finding.cvss) || 5.0;
    const exploit = (finding.exploitAvailable || finding.exploit_available) ? 1.2 : 0.0;
    const exposed = (finding.internetExposed || finding.internet_exposed || (asset && (asset.internetExposure === 'Yes' || asset.internet_exposure === 'Yes'))) ? 1.5 : 0.0;
    return Math.min(10.0, parseFloat((cvss + exploit + exposed).toFixed(2)));
  }, []);

  const calculateAssetRiskScore = useCallback((asset) => {
    if (!asset) return 50;
    const match = risks.find(r => r.asset_id === asset.id || r.assetId === asset.id);
    if (match && typeof match.risk_score === 'number') return match.risk_score;
    
    // Deterministic fallback
    const critMap = { Critical: 1.0, High: 0.75, Medium: 0.5, Low: 0.25 };
    const crit = critMap[asset.criticality] || 0.5;
    const controls = asset.controls || { mfa: 30, patching: 30, edr: 30, segmentation: 30, monitoring: 30, backup: 30 };
    const effVals = Object.values(controls).map(v => Number(v) || 0);
    const avgEff = effVals.length > 0 ? (effVals.reduce((a, b) => a + b, 0) / effVals.length) / 100 : 0.3;
    const gap = 1.0 - avgEff;
    const raw = (0.5 * 0.7 + 0.3 * crit + 0.2 * gap) * 100;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }, [risks]);

  const calculateAssetEAL = useCallback((asset) => {
    if (!asset) return 0;
    const match = risks.find(r => r.asset_id === asset.id || r.assetId === asset.id);
    if (match && typeof match.eal === 'number') return match.eal;
    
    const score = calculateAssetRiskScore(asset);
    const prob = 0.01 + (score - 10) * (0.34 / 90);
    const downtime = (Number(asset.downtimeCostPerHour || asset.downtime_cost_per_hour) || 50000) * 4.0;
    const breach = (Number(asset.recordsExposed || asset.records_exposed) || 5000) * (Number(asset.costPerRecord || asset.cost_per_record) || 150);
    const reg = Number(asset.regulatoryPenalty || asset.regulatory_penalty) || 500000;
    const rec = Number(asset.recoveryCost || asset.recovery_cost) || 300000;
    const rep = Number(asset.reputationFactor || asset.reputation_factor) || 500000;
    const potentialLoss = downtime + breach + reg + rec + rep;
    return Math.round(Math.min(potentialLoss, prob * potentialLoss));
  }, [risks, calculateAssetRiskScore]);

  const calculateAssetFinancialImpact = useCallback((asset) => {
    if (!asset) {
      return {
        total_potential_loss: 0,
        totalPotentialLoss: 0,
        downtime_loss: 0,
        data_breach_loss: 0,
        regulatory_loss: 0,
        recovery_loss: 0,
        reputation_loss: 0
      };
    }
    const match = financialExposure.asset_financials?.find(a => a.asset_id === asset.id || a.assetId === asset.id);
    if (match?.breakdown) {
      return {
        ...match.breakdown,
        total_potential_loss: match.potential_loss || match.breakdown.total_potential_loss || 0,
        totalPotentialLoss: match.potential_loss || match.breakdown.total_potential_loss || 0
      };
    }
    const downtime = (Number(asset.downtimeCostPerHour || asset.downtime_cost_per_hour) || 50000) * 4.0;
    const breach = (Number(asset.recordsExposed || asset.records_exposed) || 5000) * (Number(asset.costPerRecord || asset.cost_per_record) || 150);
    const reg = Number(asset.regulatoryPenalty || asset.regulatory_penalty) || 500000;
    const rec = Number(asset.recoveryCost || asset.recovery_cost) || 300000;
    const rep = Number(asset.reputationFactor || asset.reputation_factor) || 500000;
    const tot = downtime + breach + reg + rec + rep;
    return {
      total_potential_loss: tot,
      totalPotentialLoss: tot,
      downtime_loss: downtime,
      data_breach_loss: breach,
      regulatory_loss: reg,
      recovery_loss: rec,
      reputation_loss: rep
    };
  }, [financialExposure]);

  // Normalized Enterprise Stats getter
  const getEnterpriseStats = useCallback(() => {
    const baseEal = summaryStats.total_eal || 32500000;
    const baseExp = summaryStats.total_exposure || 185000000;
    const baseScore = summaryStats.enterprise_risk_score || 68;

    // Apply active simulations if any
    let simReductionFactor = 0.0;
    Object.entries(simulatedControls).forEach(([key, active]) => {
      if (active) {
        const ctrl = CONTROLS_LIBRARY.find(c => c.key === key || c.id === key);
        if (ctrl) simReductionFactor += ctrl.reduction * 0.4;
      }
    });

    const activeEal = Math.max(0, Math.round(baseEal * (1.0 - Math.min(0.85, simReductionFactor))));
    const activeScore = Math.max(10, Math.round(baseScore * (1.0 - Math.min(0.70, simReductionFactor * 0.8))));

    return {
      ...summaryStats,
      total_eal: activeEal,
      totalEal: activeEal,
      eal: activeEal,
      total_exposure: baseExp,
      totalExposure: baseExp,
      exposure: baseExp,
      enterprise_risk_score: activeScore,
      enterpriseRiskScore: activeScore,
      riskScore: activeScore
    };
  }, [summaryStats, simulatedControls]);

  const getActiveStats = useCallback(() => {
    const totalEal = summaryStats.total_eal || 32500000;
    const totalExposure = summaryStats.total_exposure || 185000000;
    const riskScore = summaryStats.enterprise_risk_score || 68;
    return {
      ...summaryStats,
      total_eal: totalEal,
      totalEal: totalEal,
      eal: totalEal,
      total_exposure: totalExposure,
      totalExposure: totalExposure,
      exposure: totalExposure,
      enterprise_risk_score: riskScore,
      enterpriseRiskScore: riskScore,
      riskScore: riskScore
    };
  }, [summaryStats]);

  const getCompliancePosture = useCallback(() => {
    return compliancePosture;
  }, [compliancePosture]);

  // Instantaneous Client-Side 0/1 Knapsack Solver for sliders & dynamic spend curves
  const solveOptimization = useCallback((customBudget = null, lockedIn = [], lockedOut = []) => {
    const budget = customBudget !== null ? Number(customBudget) : (org.budget || 3500000);
    const baselineEal = summaryStats.total_eal || 32500000;
    const availableControls = CONTROLS_LIBRARY.filter(c => !lockedOut.includes(c.id));

    let forcedCost = 0;
    let forcedReduction = 0;
    const forcedSelection = [];
    const remainingCandidates = [];

    availableControls.forEach(ctrl => {
      const redAmount = Math.round(ctrl.reduction * baselineEal * 0.35);
      if (lockedIn.includes(ctrl.id)) {
        forcedCost += ctrl.cost;
        forcedReduction += redAmount;
        forcedSelection.push({ ...ctrl, reductionAmount: redAmount });
      } else {
        remainingCandidates.push({ ...ctrl, reductionAmount: redAmount });
      }
    });

    const remainingBudget = Math.max(0, budget - forcedCost);
    
    // Sort by efficiency (Reduction per Rupee)
    remainingCandidates.sort((a, b) => (b.reductionAmount / b.cost) - (a.reductionAmount / a.cost));

    let allocatedCost = forcedCost;
    let totalReduction = forcedReduction;
    const selection = [...forcedSelection];

    for (const item of remainingCandidates) {
      if (allocatedCost + item.cost <= budget) {
        allocatedCost += item.cost;
        totalReduction += item.reductionAmount;
        selection.push(item);
      }
    }

    const rosi = allocatedCost > 0 ? Math.round(((totalReduction - allocatedCost) / allocatedCost) * 100) : 0;

    return {
      selection,
      selectedPortfolio: selection,
      totalCost: allocatedCost,
      totalReduction,
      rosi
    };
  }, [org.budget, summaryStats.total_eal]);

  return (
    <RiskContext.Provider
      value={{
        tenantId,
        switchTenant,
        loading,
        org,
        setOrg: updateOrg,
        updateOrg,
        assets,
        setAssets,
        findings,
        setFindings,
        summaryStats,
        risks,
        financialExposure,
        compliancePosture,
        optimizationResult,
        simulatedControls,
        setSimulatedControls,
        simulatedExposure,
        setSimulatedExposure,
        auditLogs,
        addAuditLog,
        ingestionHistory,
        refreshData,
        completeOnboarding,
        loadDemoData,
        resetOrganization,
        addAsset,
        updateAsset,
        deleteAsset,
        addFinding,
        runOptimization,
        simulateScenario,
        queryAI,
        ingestSecurityData,
        ingestAssessmentFindings: (results) => ingestSecurityData('AI Security Assessment Engine', (results && results.findings) ? results.findings : []),
        calculateCorrelatedRiskIndicator,
        calculateAssetRiskScore,
        calculateAssetEAL,
        calculateAssetFinancialImpact,
        getEnterpriseStats,
        getActiveStats,
        getCompliancePosture,
        solveOptimization,
        controlsLibrary: CONTROLS_LIBRARY,
        darkMode,
        setDarkMode
      }}
    >
      {children}
    </RiskContext.Provider>
  );
};

export const useRisk = () => useContext(RiskContext);
