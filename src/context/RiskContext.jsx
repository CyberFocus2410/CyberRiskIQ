import React, { createContext, useState, useEffect, useContext } from 'react';

const RiskContext = createContext();

// Initial Business Units
const DEFAULT_BUSINESS_UNITS = [
  'E-Commerce & Retail',
  'Core Banking & Payments',
  'Corporate IT & HR',
  'Research & Development'
];

// Initial Assets
const INITIAL_ASSETS = [
  {
    id: 'AST-001',
    name: 'Payment Gateway API',
    type: 'API',
    owner: 'Priya Sharma (Payments Lead)',
    businessUnit: 'Core Banking & Payments',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: ['AST-003'], // Depends on Customer DB
    businessService: 'Checkout & Transaction Processing',
    downtimeCostPerHour: 450000, // ₹4.5 Lakh
    recordsExposed: 50000,
    costPerRecord: 250, // ₹250
    regulatoryPenalty: 5000000, // ₹50 Lakh
    recoveryCost: 1500000, // ₹15 Lakh
    reputationFactor: 3000000, // ₹30 Lakh
    controls: {
      mfa: 30, // 30% effective
      patching: 60,
      edr: 85,
      segmentation: 20,
      monitoring: 70,
      backup: 90
    }
  },
  {
    id: 'AST-002',
    name: 'E-Commerce Frontend Web App',
    type: 'Application',
    owner: 'Amit Patel (Retail Ops)',
    businessUnit: 'E-Commerce & Retail',
    criticality: 'High',
    dataSensitivity: 'Medium',
    internetExposure: 'Yes',
    dependencies: ['AST-001'], // Depends on Payment API
    businessService: 'Online Customer Shopping Portal',
    downtimeCostPerHour: 200000, // ₹2 Lakh
    recordsExposed: 120000,
    costPerRecord: 120, // ₹120
    regulatoryPenalty: 2000000, // ₹20 Lakh
    recoveryCost: 800000, // ₹8 Lakh
    reputationFactor: 1500000, // ₹15 Lakh
    controls: {
      mfa: 90,
      patching: 40,
      edr: 50,
      segmentation: 50,
      monitoring: 60,
      backup: 95
    }
  },
  {
    id: 'AST-003',
    name: 'Customer Transaction Database',
    type: 'Database',
    owner: 'Sanjay Kumar (DB Admin)',
    businessUnit: 'Core Banking & Payments',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'No',
    dependencies: [],
    businessService: 'Transaction Ledger & Customer Profiles',
    downtimeCostPerHour: 600000, // ₹6 Lakh
    recordsExposed: 200000,
    costPerRecord: 400, // ₹400
    regulatoryPenalty: 12000000, // ₹1.2 Cr
    recoveryCost: 3000000, // ₹30 Lakh
    reputationFactor: 8000000, // ₹80 Lakh
    controls: {
      mfa: 40,
      patching: 75,
      edr: 90,
      segmentation: 80,
      monitoring: 85,
      backup: 99
    }
  },
  {
    id: 'AST-004',
    name: 'Corporate Active Directory Server',
    type: 'Identity Provider',
    owner: 'Rajesh Nair (IT Operations)',
    businessUnit: 'Corporate IT & HR',
    criticality: 'High',
    dataSensitivity: 'Medium',
    internetExposure: 'No',
    dependencies: [],
    businessService: 'Employee Access & SSO',
    downtimeCostPerHour: 100000, // ₹1 Lakh
    recordsExposed: 5000,
    costPerRecord: 100, // ₹100
    regulatoryPenalty: 500000, // ₹5 Lakh
    recoveryCost: 400000, // ₹4 Lakh
    reputationFactor: 500000, // ₹5 Lakh
    controls: {
      mfa: 80,
      patching: 80,
      edr: 70,
      segmentation: 40,
      monitoring: 50,
      backup: 85
    }
  },
  {
    id: 'AST-005',
    name: 'R&D Code Repository (GitHub Enterprise)',
    type: 'Application',
    owner: 'Vikram Mehta (VP Engineering)',
    businessUnit: 'Research & Development',
    criticality: 'Medium',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: [],
    businessService: 'Intellectual Property & Code Storage',
    downtimeCostPerHour: 50000, // ₹50k
    recordsExposed: 500,
    costPerRecord: 1000, // ₹1000 (IP heavy)
    regulatoryPenalty: 1000000, // ₹10 Lakh
    recoveryCost: 500000, // ₹5 Lakh
    reputationFactor: 2000000, // ₹20 Lakh
    controls: {
      mfa: 95,
      patching: 30,
      edr: 20,
      segmentation: 10,
      monitoring: 40,
      backup: 90
    }
  }
];

// Initial Findings (includes standard and Strix validated findings)
const INITIAL_FINDINGS = [
  {
    id: 'FND-001',
    source: 'Strix AI Pentest',
    assetId: 'AST-001',
    vulnerability: 'Broken Object Level Authorization (BOLA) in /api/v1/payments/charge',
    severity: 'Critical',
    cvss: 9.8,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Exploited BOLA via customized Authorization header parameters to pull other customer payment tokens. Response: HTTP 200 OK with sensitive JSON payload containing Card Holder details.',
    controlState: 'Weak input sanitization and inadequate endpoint auth verification.',
    discoveredAt: '2026-08-22T14:30:00Z',
    status: 'Open',
    pocAttached: true
  },
  {
    id: 'FND-002',
    source: 'Internal Vulnerability Scanner',
    assetId: 'AST-002',
    vulnerability: 'Outdated Apache Web Server Package (CVE-2023-45678)',
    severity: 'High',
    cvss: 7.5,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Apache version 2.4.56 detected. Version is vulnerable to Denial of Service and potential remote code execution.',
    controlState: 'Patch cycle delay - pending monthly remediation window.',
    discoveredAt: '2026-08-20T08:15:00Z',
    status: 'Open',
    pocAttached: false
  },
  {
    id: 'FND-003',
    source: 'Internal Vulnerability Scanner',
    assetId: 'AST-003',
    vulnerability: 'Unencrypted Database Backups on Local Drive',
    severity: 'High',
    cvss: 8.1,
    exploitAvailable: false,
    internetExposed: false,
    evidence: 'Found standard .sql dumps on directory /var/backup/ without password-protected gzip compression or KMS encryption.',
    controlState: 'Backup policy violation - local control failed to enforce encryption key.',
    discoveredAt: '2026-08-18T10:00:00Z',
    status: 'Open',
    pocAttached: false
  },
  {
    id: 'FND-004',
    source: 'Active Directory Auditor',
    assetId: 'AST-004',
    vulnerability: 'Kerberoasting Vulnerability in Admin Service Accounts',
    severity: 'Medium',
    cvss: 6.5,
    exploitAvailable: true,
    internetExposed: false,
    evidence: 'Found 4 service accounts with high privileges using weak SPN encryption keys, allowing offline brute-force cracking.',
    controlState: 'MFA active for normal users, but service accounts are bypassed.',
    discoveredAt: '2026-08-23T11:45:00Z',
    status: 'Open',
    pocAttached: false
  },
  {
    id: 'FND-005',
    source: 'Strix AI Pentest',
    assetId: 'AST-005',
    vulnerability: 'Hardcoded Github Access Token in CI/CD pipeline scripts',
    severity: 'Critical',
    cvss: 9.3,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Extracted active PAT token from actions workflow logs. Token has admin permissions on the main code repositories.',
    controlState: 'Pipeline secrets not configured in Github Secrets manager.',
    discoveredAt: '2026-08-24T02:00:00Z',
    status: 'Open',
    pocAttached: true
  }
];

// Security Controls Library with costs and projected risk reduction percentages
const CONTROLS_LIBRARY = [
  { id: 'ctrl-mfa', name: 'Enforce Strong MFA & PAM', cost: 1200000, reduction: 0.25, description: 'Reduces Threat Likelihood for access breaches' }, // ₹12 Lakh
  { id: 'ctrl-patching', name: 'Continuous Automated Patching', cost: 1500000, reduction: 0.30, description: 'Lowers exploitability scores on all systems' }, // ₹15 Lakh
  { id: 'ctrl-edr', name: 'Deploy Next-Gen EDR Agent', cost: 1800000, reduction: 0.35, description: 'Improves response times and host security' }, // ₹18 Lakh
  { id: 'ctrl-segmentation', name: 'Micro-segmentation & Zero Trust Network', cost: 2500000, reduction: 0.40, description: 'Minimizes horizontal blast radius on databases' }, // ₹25 Lakh
  { id: 'ctrl-monitoring', name: '24/7 SOC & SIEM Monitoring', cost: 1000000, reduction: 0.20, description: 'Improves detection and incident responsiveness' }, // ₹10 Lakh
  { id: 'ctrl-backup', name: 'Immutable Encrypted Cloud Backups', cost: 600000, reduction: 0.15, description: 'Drastically lowers data recovery and restoration costs' } // ₹6 Lakh
];

export const RiskProvider = ({ children }) => {
  const [org, setOrg] = useState({
    name: 'FinSafe Digital Solutions',
    industry: 'Financial Technology',
    employees: 1200,
    annualRevenue: 500000000, // ₹50 Crore
    budget: 3500000, // ₹35 Lakh
    riskAppetite: 'Medium',
    businessUnits: DEFAULT_BUSINESS_UNITS
  });

  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [findings, setFindings] = useState(INITIAL_FINDINGS);
  const [darkMode, setDarkMode] = useState(true);
  const [ingestionHistory, setIngestionHistory] = useState([
    { id: 'BCH-001', source: 'Strix AI Pentest', timestamp: '2026-08-24T02:00:00Z', count: 2, status: 'Success' },
    { id: 'BCH-002', source: 'Internal Scanner', timestamp: '2026-08-20T08:15:00Z', count: 3, status: 'Success' }
  ]);

  // Scenario Simulator Overlays (contains simulated changes to controls/exposures)
  // For each control, we store if it is simulated as 'enabled' organization-wide
  const [simulatedControls, setSimulatedControls] = useState({
    mfa: false,
    patching: false,
    edr: false,
    segmentation: false,
    monitoring: false,
    backup: false
  });
  
  const [simulatedExposure, setSimulatedExposure] = useState({}); // assetId -> { internetExposure, criticality } overrides

  // Continuous Risk Engine Calculations
  const calculateCorrelatedRiskIndicator = (finding, asset, exposureOverride = null) => {
    let base = finding.cvss;
    
    // Boost for availability of working exploit code
    if (finding.exploitAvailable) base += 1.2;
    
    // Boost if asset is exposed to the internet
    const expOverride = exposureOverride || simulatedExposure;
    const isExposed = expOverride[finding.assetId]?.internetExposure !== undefined
      ? expOverride[finding.assetId].internetExposure === 'Yes'
      : asset?.internetExposure === 'Yes';

    if (isExposed) base += 1.5;
    
    // Cap CVSS correlation at 10.0
    return Math.min(10.0, base);
  };

  const getAssetOverallControlsEffectiveness = (asset, controlsOverride = null) => {
    let score = 0;
    const keys = Object.keys(asset.controls);
    const ctrlOverride = controlsOverride || simulatedControls;
    keys.forEach(k => {
      // If control is simulated organization-wide, boost effectiveness to 95%
      const simulatedVal = ctrlOverride[k] ? 95 : asset.controls[k];
      score += simulatedVal;
    });
    return Math.round(score / keys.length);
  };

  const calculateAssetRiskScore = (asset, controlsOverride = null, exposureOverride = null) => {
    // Find all open findings for this asset
    const assetFindings = findings.filter(f => f.assetId === asset.id && f.status === 'Open');
    if (assetFindings.length === 0) return 10; // baseline risk score

    const maxCorrelated = Math.max(...assetFindings.map(f => calculateCorrelatedRiskIndicator(f, asset, exposureOverride)));
    const avgCorrelated = assetFindings.reduce((sum, f) => sum + calculateCorrelatedRiskIndicator(f, asset, exposureOverride), 0) / assetFindings.length;
    
    const threatLikelihood = (maxCorrelated * 0.7 + avgCorrelated * 0.3) / 10.0; // scale 0 to 1
    
    const expOverride = exposureOverride || simulatedExposure;
    const criticalityVal = expOverride[asset.id]?.criticality !== undefined
      ? expOverride[asset.id].criticality
      : asset.criticality;

    const criticalityWeight = criticalityVal === 'Critical' ? 1.0 : criticalityVal === 'High' ? 0.8 : criticalityVal === 'Medium' ? 0.6 : 0.4;
    
    const controlsEffectiveness = getAssetOverallControlsEffectiveness(asset, controlsOverride) / 100.0;
    const controlGap = 1.0 - controlsEffectiveness;

    // Risk score out of 100
    const rawScore = (threatLikelihood * 0.5 + criticalityWeight * 0.3 + controlGap * 0.2) * 100;
    return Math.round(Math.min(100, Math.max(10, rawScore)));
  };

  const calculateAssetFinancialImpact = (asset) => {
    // Availability impact (Downtime 4 hours average incident length)
    const downtimeImpact = asset.downtimeCostPerHour * 4;
    // Data impact
    const dataImpact = asset.recordsExposed * asset.costPerRecord;
    // Sum all categories
    return downtimeImpact + dataImpact + asset.regulatoryPenalty + asset.recoveryCost + asset.reputationFactor;
  };

  const calculateAssetEAL = (asset, controlsOverride = null, exposureOverride = null) => {
    const riskScore = calculateAssetRiskScore(asset, controlsOverride, exposureOverride);
    
    // Mapped Probability: Risk Score 10 -> 1% probability, 100 -> 35% annual probability
    const probability = 0.01 + (riskScore - 10) * (0.34 / 90);
    const financialImpact = calculateAssetFinancialImpact(asset);
    
    // Apply simulated backup reductions (immutable backups lower recovery costs by 70%)
    const ctrlOverride = controlsOverride || simulatedControls;
    let recoveryCostSimulated = asset.recoveryCost;
    if (ctrlOverride.backup) {
      recoveryCostSimulated = asset.recoveryCost * 0.3;
    }
    const adjustedFinancialImpact = financialImpact - (asset.recoveryCost - recoveryCostSimulated);

    return Math.round(probability * adjustedFinancialImpact);
  };

  // Roll Up calculations (can be active or simulated based on overlays)
  const getEnterpriseStats = () => {
    let totalEal = 0;
    let totalExposure = 0;
    let weightedRiskSum = 0;
    let totalAssetsWithWeights = 0;

    assets.forEach(asset => {
      const eal = calculateAssetEAL(asset);
      const riskScore = calculateAssetRiskScore(asset);
      const impact = calculateAssetFinancialImpact(asset);

      const criticalityVal = simulatedExposure[asset.id]?.criticality !== undefined
        ? simulatedExposure[asset.id].criticality
        : asset.criticality;

      const weight = criticalityVal === 'Critical' ? 4 : criticalityVal === 'High' ? 3 : criticalityVal === 'Medium' ? 2 : 1;

      totalEal += eal;
      totalExposure += impact;
      weightedRiskSum += riskScore * weight;
      totalAssetsWithWeights += weight;
    });

    const averageRiskScore = Math.round(weightedRiskSum / totalAssetsWithWeights);

    return {
      eal: totalEal,
      exposure: totalExposure,
      riskScore: averageRiskScore
    };
  };

  // Standard (non-simulated) stats - completely stateless to avoid rendering updates loop
  const getActiveStats = () => {
    const baselineControls = {
      mfa: false, patching: false, edr: false, segmentation: false, monitoring: false, backup: false
    };
    const baselineExposure = {};

    let totalEal = 0;
    let totalExposure = 0;
    let weightedRiskSum = 0;
    let totalAssetsWithWeights = 0;

    assets.forEach(asset => {
      const eal = calculateAssetEAL(asset, baselineControls, baselineExposure);
      const riskScore = calculateAssetRiskScore(asset, baselineControls, baselineExposure);
      const impact = calculateAssetFinancialImpact(asset);
      const weight = asset.criticality === 'Critical' ? 4 : asset.criticality === 'High' ? 3 : asset.criticality === 'Medium' ? 2 : 1;

      totalEal += eal;
      totalExposure += impact;
      weightedRiskSum += riskScore * weight;
      totalAssetsWithWeights += weight;
    });

    return {
      eal: totalEal,
      exposure: totalExposure,
      riskScore: Math.round(weightedRiskSum / totalAssetsWithWeights)
    };
  };

  // Knapsack Budget Optimizer Solver
  // Maximize EAL reduction subject to sum(cost) <= budget
  const solveOptimization = (customBudget = org.budget, lockedIn = [], lockedOut = []) => {
    // Filter controls by locked out status
    let availableOptions = CONTROLS_LIBRARY.filter(c => !lockedOut.includes(c.id));
    
    // Pre-calculate individual control impact on EAL
    // We compute EAL reduction for each control option
    const baseStats = getActiveStats();
    
    const optionsWithEalReduction = availableOptions.map(c => {
      // Simulate just this one control
      const tempControls = {
        mfa: false, patching: false, edr: false, segmentation: false, monitoring: false, backup: false
      };
      
      const key = c.id.replace('ctrl-', '');
      tempControls[key] = true;
      
      // Calculate EAL under this single control simulation
      const currentSim = { ...simulatedControls };
      setSimulatedControls(tempControls);
      
      let tempEal = 0;
      assets.forEach(asset => {
        tempEal += calculateAssetEAL(asset);
      });
      
      setSimulatedControls(currentSim); // restore
      
      const ealReduction = baseStats.eal - tempEal;
      
      return {
        ...c,
        ealReduction: Math.max(0, ealReduction),
        key
      };
    });

    // Separate locked in controls
    const lockedInControls = optionsWithEalReduction.filter(c => lockedIn.includes(c.id));
    const lockedInCost = lockedInControls.reduce((sum, c) => sum + c.cost, 0);
    
    // Remaining options to solve with remaining budget
    const remainingBudget = customBudget - lockedInCost;
    const selectableOptions = optionsWithEalReduction.filter(c => !lockedIn.includes(c.id));

    let selectedList = [];
    if (remainingBudget >= 0) {
      // Solve DP Knapsack on remaining items
      const n = selectableOptions.length;
      // Convert currency values into tens of thousands to make DP array sizing memory efficient
      // (Budget & Cost are rounded to nearest 10,000)
      const scale = 10000;
      const W = Math.floor(remainingBudget / scale);
      
      const weights = selectableOptions.map(o => Math.ceil(o.cost / scale));
      const values = selectableOptions.map(o => o.ealReduction);
      
      // DP Table
      const dp = Array(n + 1).fill().map(() => Array(W + 1).fill(0));
      
      for (let i = 1; i <= n; i++) {
        const w = weights[i - 1];
        const v = values[i - 1];
        for (let j = 0; j <= W; j++) {
          if (w <= j) {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
          } else {
            dp[i][j] = dp[i - 1][j];
          }
        }
      }
      
      // Traceback
      let j = W;
      for (let i = n; i > 0; i--) {
        if (dp[i][j] !== dp[i - 1][j]) {
          selectedList.push(selectableOptions[i - 1]);
          j -= weights[i - 1];
        }
      }
    }

    // Merge locked in controls back in
    const finalSelection = [...lockedInControls, ...selectedList];
    const totalCost = finalSelection.reduce((sum, c) => sum + c.cost, 0);
    const totalReduction = finalSelection.reduce((sum, c) => sum + c.ealReduction, 0);
    const rosi = totalCost > 0 ? Math.round(((totalReduction - totalCost) / totalCost) * 100) : 0;

    return {
      selection: finalSelection,
      totalCost,
      totalReduction,
      rosi
    };
  };

  // Ingestion parsing
  const ingestSecurityData = (sourceName, rawRecords) => {
    let parsedCount = 0;
    const newFindings = [];
    
    rawRecords.forEach((record, index) => {
      // Normalize finding matching canonical schema
      const assetExists = assets.some(a => a.id === record.assetId);
      if (assetExists && record.vulnerability) {
        newFindings.push({
          id: `FND-${Date.now()}-${index}`,
          source: sourceName,
          assetId: record.assetId,
          vulnerability: record.vulnerability,
          severity: record.severity || 'Medium',
          cvss: parseFloat(record.cvss) || 5.0,
          exploitAvailable: record.exploitAvailable === 'Yes' || record.exploitAvailable === true,
          internetExposed: record.internetExposed === 'Yes' || record.internetExposed === true,
          evidence: record.evidence || 'No additional telemetry attached.',
          controlState: record.controlState || 'Evaluation pending.',
          discoveredAt: new Date().toISOString(),
          status: 'Open',
          pocAttached: record.pocAttached === true || record.pocAttached === 'Yes'
        });
        parsedCount++;
      }
    });

    if (newFindings.length > 0) {
      setFindings(prev => [...newFindings, ...prev]);
      setIngestionHistory(prev => [
        {
          id: `BCH-${Date.now().toString().slice(-4)}`,
          source: sourceName,
          timestamp: new Date().toISOString(),
          count: parsedCount,
          status: 'Success'
        },
        ...prev
      ]);
    }
  };

  // Compliance calculations
  const getCompliancePosture = () => {
    // NIST CSF Category Map
    // Identify control weights matching functions
    const nistMapping = {
      'Identify (ID.AM)': ['mfa', 'patching'],
      'Protect (PR.AC)': ['mfa', 'segmentation'],
      'Protect (PR.DS)': ['backup'],
      'Detect (DE.AE)': ['monitoring'],
      'Respond (RS.RP)': ['edr', 'monitoring'],
      'Recover (RC.RP)': ['backup']
    };

    // ISO 27001 Mapping
    const isoMapping = {
      'A.9 Access Control': ['mfa'],
      'A.12 Operations Security': ['patching', 'monitoring'],
      'A.14 System Acquisition/Dev': ['segmentation'],
      'A.17 Information Security Continuity': ['backup'],
      'A.18 Compliance': ['monitoring', 'patching']
    };

    // RBI CSF Mapping
    const rbiMapping = {
      'G-1: User Access Control': ['mfa'],
      'G-3: Vulnerability Management': ['patching'],
      'G-5: Cyber Security Operations (SOC)': ['monitoring'],
      'G-8: Incident Response & Recovery': ['edr', 'backup'],
      'G-11: Network Security & Segmentation': ['segmentation']
    };

    // SEBI CSCRF Mapping
    const sebiMapping = {
      'Sec 3.1: Identification & Asset Management': ['patching'],
      'Sec 3.2: Protection & Identity Management': ['mfa'],
      'Sec 3.3: Network Segmentation': ['segmentation'],
      'Sec 3.4: Monitoring & Detection': ['monitoring'],
      'Sec 3.5: Response & Endpoint Protection': ['edr'],
      'Sec 3.6: Recovery & Backups': ['backup']
    };

    const calculateFrameworkCoverage = (mapping) => {
      let totalItems = 0;
      let totalEffectiveSum = 0;

      Object.keys(mapping).forEach(category => {
        const controlsAssociated = mapping[category];
        controlsAssociated.forEach(ctrl => {
          assets.forEach(asset => {
            const effectiveness = simulatedControls[ctrl] ? 95 : asset.controls[ctrl];
            totalEffectiveSum += effectiveness;
            totalItems += 100;
          });
        });
      });

      return Math.round((totalEffectiveSum / totalItems) * 100);
    };

    return {
      nist: calculateFrameworkCoverage(nistMapping),
      iso: calculateFrameworkCoverage(isoMapping),
      rbi: calculateFrameworkCoverage(rbiMapping),
      sebi: calculateFrameworkCoverage(sebiMapping)
    };
  };

  const addAsset = (newAsset) => {
    setAssets(prev => [...prev, {
      ...newAsset,
      id: `AST-${String(prev.length + 1).padStart(3, '0')}`,
      controls: newAsset.controls || { mfa: 30, patching: 30, edr: 30, segmentation: 30, monitoring: 30, backup: 30 }
    }]);
  };

  const addFinding = (newFinding) => {
    setFindings(prev => [{
      ...newFinding,
      id: `FND-${String(prev.length + 1).padStart(3, '0')}`,
      discoveredAt: new Date().toISOString(),
      status: 'Open'
    }, ...prev]);
  };

  return (
    <RiskContext.Provider
      value={{
        org,
        setOrg,
        assets,
        setAssets,
        findings,
        setFindings,
        ingestionHistory,
        setIngestionHistory,
        simulatedControls,
        setSimulatedControls,
        simulatedExposure,
        setSimulatedExposure,
        calculateCorrelatedRiskIndicator,
        calculateAssetRiskScore,
        calculateAssetFinancialImpact,
        calculateAssetEAL,
        getEnterpriseStats,
        getActiveStats,
        solveOptimization,
        ingestSecurityData,
        getCompliancePosture,
        controlsLibrary: CONTROLS_LIBRARY,
        addAsset,
        addFinding,
        darkMode,
        setDarkMode
      }}
    >
      {children}
    </RiskContext.Provider>
  );
};

export const useRisk = () => useContext(RiskContext);
