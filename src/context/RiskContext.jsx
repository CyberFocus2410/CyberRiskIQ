import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const RiskContext = createContext();

// Business Units for FinSecure Bank
const DEFAULT_BUSINESS_UNITS = [
  'Retail Banking',
  'Corporate Banking',
  'Payments & Settlement',
  'Digital Banking',
  'Core IT & Infrastructure',
  'Human Resources & Legal'
];

// Rich Enterprise Asset Dataset: FinSecure Bank (52 structured assets)
const BASE_INITIAL_ASSETS = [
  {
    id: 'AST-001',
    name: 'Payment Gateway API',
    type: 'API',
    owner: 'Priya Sharma (Head of Payments)',
    businessUnit: 'Payments & Settlement',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: ['AST-003', 'AST-006'],
    businessService: 'Checkout & Real-Time Card Processing',
    downtimeCostPerHour: 450000,
    recordsExposed: 85000,
    costPerRecord: 350,
    regulatoryPenalty: 6000000,
    recoveryCost: 1800000,
    reputationFactor: 4000000,
    controls: { mfa: 35, patching: 60, edr: 85, segmentation: 25, monitoring: 70, backup: 90 }
  },
  {
    id: 'AST-002',
    name: 'Retail Internet Banking Portal',
    type: 'Application',
    owner: 'Amit Patel (Retail Ops VP)',
    businessUnit: 'Retail Banking',
    criticality: 'High',
    dataSensitivity: 'Medium',
    internetExposure: 'Yes',
    dependencies: ['AST-001', 'AST-004'],
    businessService: 'Customer Web Portal & Account View',
    downtimeCostPerHour: 250000,
    recordsExposed: 150000,
    costPerRecord: 180,
    regulatoryPenalty: 2500000,
    recoveryCost: 950000,
    reputationFactor: 2000000,
    controls: { mfa: 90, patching: 40, edr: 55, segmentation: 50, monitoring: 65, backup: 95 }
  },
  {
    id: 'AST-003',
    name: 'Core Transaction Ledger DB (PostgreSQL)',
    type: 'Database',
    owner: 'Sanjay Kumar (Chief DBA)',
    businessUnit: 'Payments & Settlement',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'No',
    dependencies: [],
    businessService: 'Financial Ledger & Account Balances',
    downtimeCostPerHour: 650000,
    recordsExposed: 250000,
    costPerRecord: 450,
    regulatoryPenalty: 15000000,
    recoveryCost: 3500000,
    reputationFactor: 9000000,
    controls: { mfa: 45, patching: 75, edr: 90, segmentation: 80, monitoring: 85, backup: 99 }
  },
  {
    id: 'AST-004',
    name: 'Corporate Active Directory & IAM Server',
    type: 'Identity Provider',
    owner: 'Rajesh Nair (IT Security Lead)',
    businessUnit: 'Core IT & Infrastructure',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'No',
    dependencies: [],
    businessService: 'Single Sign-On & Employee Access Control',
    downtimeCostPerHour: 150000,
    recordsExposed: 6500,
    costPerRecord: 150,
    regulatoryPenalty: 800000,
    recoveryCost: 500000,
    reputationFactor: 750000,
    controls: { mfa: 80, patching: 70, edr: 65, segmentation: 40, monitoring: 55, backup: 85 }
  },
  {
    id: 'AST-005',
    name: 'DevSecOps CI/CD & Code Repository',
    type: 'Application',
    owner: 'Vikram Mehta (VP Engineering)',
    businessUnit: 'Core IT & Infrastructure',
    criticality: 'Medium',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: [],
    businessService: 'Proprietary Algorithm Repository & Automated Builds',
    downtimeCostPerHour: 75000,
    recordsExposed: 1200,
    costPerRecord: 1200,
    regulatoryPenalty: 1200000,
    recoveryCost: 600000,
    reputationFactor: 2500000,
    controls: { mfa: 95, patching: 35, edr: 30, segmentation: 20, monitoring: 45, backup: 90 }
  },
  {
    id: 'AST-006',
    name: 'UPI & Instant Payment Switch Node',
    type: 'Server',
    owner: 'Priya Sharma (Head of Payments)',
    businessUnit: 'Payments & Settlement',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'No',
    dependencies: ['AST-003'],
    businessService: 'National Instant Settlement Switch',
    downtimeCostPerHour: 500000,
    recordsExposed: 120000,
    costPerRecord: 300,
    regulatoryPenalty: 10000000,
    recoveryCost: 2500000,
    reputationFactor: 7000000,
    controls: { mfa: 50, patching: 65, edr: 80, segmentation: 75, monitoring: 85, backup: 95 }
  },
  {
    id: 'AST-007',
    name: 'Mobile Banking iOS & Android API Gateway',
    type: 'API',
    owner: 'Neha Gupta (Digital Channels Lead)',
    businessUnit: 'Digital Banking',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: ['AST-001', 'AST-003'],
    businessService: 'Mobile Banking Application Backend',
    downtimeCostPerHour: 350000,
    recordsExposed: 180000,
    costPerRecord: 220,
    regulatoryPenalty: 5500000,
    recoveryCost: 1500000,
    reputationFactor: 4500000,
    controls: { mfa: 85, patching: 50, edr: 70, segmentation: 45, monitoring: 75, backup: 90 }
  },
  {
    id: 'AST-008',
    name: 'SWIFT Corporate Wire Transfer Terminal',
    type: 'Server',
    owner: 'Karan Malhotra (Corporate Banking Head)',
    businessUnit: 'Corporate Banking',
    criticality: 'Critical',
    dataSensitivity: 'High',
    internetExposure: 'No',
    dependencies: ['AST-003', 'AST-004'],
    businessService: 'Cross-Border Commercial Remittances',
    downtimeCostPerHour: 800000,
    recordsExposed: 15000,
    costPerRecord: 1500,
    regulatoryPenalty: 20000000,
    recoveryCost: 5000000,
    reputationFactor: 15000000,
    controls: { mfa: 90, patching: 80, edr: 95, segmentation: 90, monitoring: 90, backup: 99 }
  },
  {
    id: 'AST-009',
    name: 'Trade Finance & Letter of Credit Engine',
    type: 'Application',
    owner: 'Karan Malhotra (Corporate Banking Head)',
    businessUnit: 'Corporate Banking',
    criticality: 'High',
    dataSensitivity: 'Medium',
    internetExposure: 'No',
    dependencies: ['AST-008'],
    businessService: 'Commercial Trade Credit Validation',
    downtimeCostPerHour: 180000,
    recordsExposed: 8000,
    costPerRecord: 500,
    regulatoryPenalty: 1500000,
    recoveryCost: 700000,
    reputationFactor: 1800000,
    controls: { mfa: 75, patching: 60, edr: 60, segmentation: 50, monitoring: 60, backup: 85 }
  },
  {
    id: 'AST-010',
    name: 'HR Employee Payroll & Benefits Portal',
    type: 'Application',
    owner: 'Ananya Sen (CHRO)',
    businessUnit: 'Human Resources & Legal',
    criticality: 'Medium',
    dataSensitivity: 'High',
    internetExposure: 'Yes',
    dependencies: ['AST-004'],
    businessService: 'Employee Payroll & Tax Disclosures',
    downtimeCostPerHour: 40000,
    recordsExposed: 4500,
    costPerRecord: 200,
    regulatoryPenalty: 750000,
    recoveryCost: 300000,
    reputationFactor: 600000,
    controls: { mfa: 85, patching: 55, edr: 40, segmentation: 30, monitoring: 40, backup: 85 }
  }
];

// Generate assets up to 52 across units
const generateEnterpriseAssets = () => {
  const assetTypes = ['Application', 'API', 'Database', 'Server', 'Endpoint', 'Cloud Resource', 'Network Device'];
  const fullList = [...BASE_INITIAL_ASSETS];
  for (let i = 11; i <= 52; i++) {
    const bu = DEFAULT_BUSINESS_UNITS[(i - 11) % DEFAULT_BUSINESS_UNITS.length];
    const atype = assetTypes[(i - 11) % assetTypes.length];
    const isCrit = i % 7 === 0 ? 'Critical' : i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Medium' : 'Low';
    const isExp = i % 4 === 0 ? 'Yes' : 'No';

    fullList.push({
      id: `AST-${String(i).padStart(3, '0')}`,
      name: `${bu} ${atype} Instance ${i}`,
      type: atype,
      owner: `Unit Lead (${bu})`,
      businessUnit: bu,
      criticality: isCrit,
      dataSensitivity: isCrit === 'Critical' || isCrit === 'High' ? 'High' : 'Medium',
      internetExposure: isExp,
      dependencies: i % 3 === 0 ? [`AST-${String(i - 1).padStart(3, '0')}`] : [],
      businessService: `${bu} Operations Module ${i}`,
      downtimeCostPerHour: 30000 * (isCrit === 'Critical' ? 4 : isCrit === 'High' ? 2 : 1),
      recordsExposed: 1500 * i,
      costPerRecord: 150,
      regulatoryPenalty: 300000 * (isCrit === 'Critical' ? 5 : isCrit === 'High' ? 2 : 1),
      recoveryCost: 150000 * (isCrit === 'Critical' ? 3 : 1),
      reputationFactor: 250000 * (isCrit === 'Critical' ? 4 : 1),
      controls: {
        mfa: 40 + (i % 50),
        patching: 35 + (i % 45),
        edr: 50 + (i % 40),
        segmentation: 30 + (i % 60),
        monitoring: 45 + (i % 45),
        backup: 80 + (i % 18)
      }
    });
  }
  return fullList;
};

// Initial Findings Schema
const INITIAL_FINDINGS = [
  {
    id: 'FND-001',
    source: 'CyberRiskIQ AI Security Assessment',
    assetId: 'AST-001',
    vulnerability: 'Broken Object Level Authorization (BOLA) in /api/v1/payments/charge',
    severity: 'Critical',
    cvss: 9.8,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Exploited BOLA via customized Authorization header parameters to pull other customer payment tokens. Response: HTTP 200 OK with sensitive JSON payload containing Card Holder details.',
    controlState: 'Weak input sanitization and inadequate endpoint auth verification.',
    remediation: 'Implement server-side object-level permission verification and tenant scoping on all payment endpoints.',
    discoveredAt: '2026-08-24T14:30:00Z',
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
    remediation: 'Upgrade Apache HTTP Server to version 2.4.59+.',
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
    remediation: 'Enforce automated AES-256 / GPG encryption on database export pipelines.',
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
    remediation: 'Rotate service account passwords to 32+ character keys and migrate to gMSA.',
    discoveredAt: '2026-08-23T11:45:00Z',
    status: 'Open',
    pocAttached: false
  },
  {
    id: 'FND-005',
    source: 'CyberRiskIQ AI Security Assessment',
    assetId: 'AST-005',
    vulnerability: 'Hardcoded GitHub Access Token in CI/CD pipeline scripts',
    severity: 'Critical',
    cvss: 9.3,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Extracted active PAT token from actions workflow logs. Token has admin permissions on the main code repositories.',
    controlState: 'Pipeline secrets not configured in Github Secrets manager.',
    remediation: 'Revoke token and configure GitHub Secrets Store.',
    discoveredAt: '2026-08-24T02:00:00Z',
    status: 'Open',
    pocAttached: true
  },
  {
    id: 'FND-006',
    source: 'CyberRiskIQ AI Security Assessment',
    assetId: 'AST-007',
    vulnerability: 'Insecure Direct Object Reference (IDOR) on Mobile Statement API',
    severity: 'Critical',
    cvss: 9.1,
    exploitAvailable: true,
    internetExposed: true,
    evidence: 'Manipulating account_num in GET /api/v2/statements returned unauthorized financial ledgers.',
    controlState: 'Downstream microservice omitted tenant boundary check.',
    remediation: 'Enforce strict session-bound customer context in statement service.',
    discoveredAt: '2026-08-24T16:00:00Z',
    status: 'Open',
    pocAttached: true
  }
];

// Defensive Controls Library
const CONTROLS_LIBRARY = [
  { id: 'ctrl-mfa', name: 'Enforce Strong MFA & PAM', cost: 1200000, reduction: 0.25, description: 'Reduces Threat Likelihood for access breaches' }, // ₹12 Lakh
  { id: 'ctrl-patching', name: 'Continuous Automated Patching', cost: 1500000, reduction: 0.30, description: 'Lowers exploitability scores on all systems' }, // ₹15 Lakh
  { id: 'ctrl-edr', name: 'Deploy Next-Gen EDR Agent', cost: 1800000, reduction: 0.35, description: 'Improves response times and host security' }, // ₹18 Lakh
  { id: 'ctrl-segmentation', name: 'Micro-segmentation & Zero Trust Network', cost: 2500000, reduction: 0.40, description: 'Minimizes horizontal blast radius on databases' }, // ₹25 Lakh
  { id: 'ctrl-monitoring', name: '24/7 SOC & SIEM Monitoring', cost: 1000000, reduction: 0.20, description: 'Improves detection and incident responsiveness' }, // ₹10 Lakh
  { id: 'ctrl-backup', name: 'Immutable Encrypted Cloud Backups', cost: 600000, reduction: 0.15, description: 'Drastically lowers data recovery and restoration costs by 70%' } // ₹6 Lakh
];

export const RiskProvider = ({ children }) => {
  // Initialize state from persistent localStorage if available
  const [org, setOrg] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberriskiq_org');
      return saved ? JSON.parse(saved) : {
        name: 'FinSecure Bank',
        industry: 'Banking & Financial Services',
        employees: 1200,
        annualRevenue: 500000000, // ₹50 Crore
        budget: 3500000, // ₹35 Lakh
        riskAppetite: 'Medium',
        businessUnits: DEFAULT_BUSINESS_UNITS
      };
    } catch {
      return {
        name: 'FinSecure Bank',
        industry: 'Banking & Financial Services',
        employees: 1200,
        annualRevenue: 500000000,
        budget: 3500000,
        riskAppetite: 'Medium',
        businessUnits: DEFAULT_BUSINESS_UNITS
      };
    }
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberriskiq_assets');
      return saved ? JSON.parse(saved) : generateEnterpriseAssets();
    } catch {
      return generateEnterpriseAssets();
    }
  });

  const [findings, setFindings] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberriskiq_findings');
      return saved ? JSON.parse(saved) : INITIAL_FINDINGS;
    } catch {
      return INITIAL_FINDINGS;
    }
  });

  const [darkMode, setDarkMode] = useState(true);

  const [ingestionHistory, setIngestionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberriskiq_ingestion_history');
      return saved ? JSON.parse(saved) : [
        { id: 'BCH-001', source: 'CyberRiskIQ AI Security Assessment', timestamp: '2026-08-24T14:30:00Z', count: 3, status: 'Success' },
        { id: 'BCH-002', source: 'Internal Scanner', timestamp: '2026-08-20T08:15:00Z', count: 3, status: 'Success' }
      ];
    } catch {
      return [
        { id: 'BCH-001', source: 'CyberRiskIQ AI Security Assessment', timestamp: '2026-08-24T14:30:00Z', count: 3, status: 'Success' }
      ];
    }
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberriskiq_audit_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: 'AUD-001',
          timestamp: new Date().toISOString(),
          user: 'secops@finsecure.bank',
          action: 'PLATFORM_INITIALIZATION',
          entity: 'FinSecure Bank',
          details: 'Initialized 52 assets across 6 business units.'
        }
      ];
    } catch {
      return [
        {
          id: 'AUD-001',
          timestamp: new Date().toISOString(),
          user: 'secops@finsecure.bank',
          action: 'PLATFORM_INITIALIZATION',
          entity: 'FinSecure Bank',
          details: 'Initialized 52 assets across 6 business units.'
        }
      ];
    }
  });

  // Attempt backend synchronization on initial load
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const summaryRes = await fetch('/api/dashboard/summary');
        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          if (summary.organization) {
            setOrg(prev => ({
              ...prev,
              name: summary.organization.name,
              industry: summary.organization.industry,
              employees: summary.organization.employees,
              annualRevenue: summary.organization.annual_revenue || summary.organization.annualRevenue,
              budget: summary.organization.budget,
              riskAppetite: summary.organization.risk_appetite || summary.organization.riskAppetite
            }));
          }
        }

        const assetsRes = await fetch('/api/assets');
        if (assetsRes.ok) {
          const backendAssets = await assetsRes.json();
          if (Array.isArray(backendAssets) && backendAssets.length > 0) {
            setAssets(backendAssets);
          }
        }

        const findingsRes = await fetch('/api/findings');
        if (findingsRes.ok) {
          const backendFindings = await findingsRes.json();
          if (Array.isArray(backendFindings) && backendFindings.length > 0) {
            setFindings(backendFindings);
          }
        }

        const logsRes = await fetch('/api/audit-logs');
        if (logsRes.ok) {
          const backendLogs = await logsRes.json();
          if (Array.isArray(backendLogs) && backendLogs.length > 0) {
            setAuditLogs(backendLogs);
          }
        }
      } catch (err) {
        // Backend not active; continue with local client-side persistence
      }
    };

    syncWithBackend();
  }, []);

  // Persistent storage synchronizer
  useEffect(() => {
    try {
      localStorage.setItem('cyberriskiq_org', JSON.stringify(org));
      localStorage.setItem('cyberriskiq_assets', JSON.stringify(assets));
      localStorage.setItem('cyberriskiq_findings', JSON.stringify(findings));
      localStorage.setItem('cyberriskiq_ingestion_history', JSON.stringify(ingestionHistory));
      localStorage.setItem('cyberriskiq_audit_logs', JSON.stringify(auditLogs));
    } catch (err) {
      console.warn('LocalStorage persistence warning:', err);
    }
  }, [org, assets, findings, ingestionHistory, auditLogs]);

  // Scenario Simulator Overlays
  const [simulatedControls, setSimulatedControls] = useState({
    mfa: false,
    patching: false,
    edr: false,
    segmentation: false,
    monitoring: false,
    backup: false
  });
  
  const [simulatedExposure, setSimulatedExposure] = useState({});

  const addAuditLog = (action, entity, details) => {
    setAuditLogs(prev => [
      {
        id: `AUD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        user: 'admin@finsecure.bank',
        action,
        entity,
        details
      },
      ...prev
    ]);
  };

  // Continuous Risk Engine Calculations
  const calculateCorrelatedRiskIndicator = (finding, asset, exposureOverride = null) => {
    let base = parseFloat(finding.cvss) || 5.0;
    
    if (finding.exploitAvailable || finding.exploit_available) base += 1.2;
    
    const expOverride = exposureOverride || simulatedExposure;
    const isExposed = expOverride[finding.assetId || finding.asset_id]?.internetExposure !== undefined
      ? expOverride[finding.assetId || finding.asset_id].internetExposure === 'Yes'
      : asset?.internetExposure === 'Yes' || asset?.internet_exposure === 'Yes';

    if (isExposed) base += 1.5;
    
    return Math.min(10.0, Math.max(0.0, base));
  };

  const getAssetOverallControlsEffectiveness = (asset, controlsOverride = null) => {
    let score = 0;
    const controls = asset.controls || {};
    const keys = Object.keys(controls);
    if (keys.length === 0) return 30;

    const ctrlOverride = controlsOverride || simulatedControls;
    keys.forEach(k => {
      const simulatedVal = ctrlOverride[k] ? 95 : (controls[k] ?? 30);
      score += simulatedVal;
    });
    return Math.round(score / keys.length);
  };

  const calculateAssetRiskScore = (asset, controlsOverride = null, exposureOverride = null) => {
    const assetFindings = findings.filter(f => (f.assetId === asset.id || f.asset_id === asset.id) && (f.status === 'Open' || f.status === 'In Progress' || !f.status));
    if (assetFindings.length === 0) return 10;

    const correlatedList = assetFindings.map(f => calculateCorrelatedRiskIndicator(f, asset, exposureOverride));
    const maxCorrelated = Math.max(...correlatedList);
    const avgCorrelated = correlatedList.reduce((sum, v) => sum + v, 0) / correlatedList.length;
    
    const threatLikelihood = (maxCorrelated * 0.7 + avgCorrelated * 0.3) / 10.0;
    
    const expOverride = exposureOverride || simulatedExposure;
    const criticalityVal = expOverride[asset.id]?.criticality !== undefined
      ? expOverride[asset.id].criticality
      : asset.criticality;

    const criticalityWeight = criticalityVal === 'Critical' ? 1.0 : criticalityVal === 'High' ? 0.8 : criticalityVal === 'Medium' ? 0.6 : 0.4;
    
    const controlsEffectiveness = getAssetOverallControlsEffectiveness(asset, controlsOverride) / 100.0;
    const controlGap = 1.0 - controlsEffectiveness;

    const rawScore = (threatLikelihood * 0.5 + criticalityWeight * 0.3 + controlGap * 0.2) * 100;

    let appetiteMultiplier = 1.0;
    if (org.riskAppetite === 'Low') appetiteMultiplier = 1.25;
    else if (org.riskAppetite === 'High') appetiteMultiplier = 0.75;

    return Math.round(Math.min(100, Math.max(10, rawScore * appetiteMultiplier)));
  };

  const calculateAssetFinancialImpact = (asset) => {
    const revenueScaler = (org.annualRevenue || 500000000) / 500000000;
    const employeeScaler = (org.employees || 1200) / 1200;

    const downtimeImpact = ((asset.downtimeCostPerHour || asset.downtime_cost_per_hour || 50000) * revenueScaler) * 4;
    const dataImpact = Math.round((asset.recordsExposed || asset.records_exposed || 5000) * employeeScaler) * (asset.costPerRecord || asset.cost_per_record || 150);
    const regulatoryFines = (asset.regulatoryPenalty || asset.regulatory_penalty || 500000) * revenueScaler;
    const recoveryCosts = (asset.recoveryCost || asset.recovery_cost || 300000) * employeeScaler;
    const reputationCosts = (asset.reputationFactor || asset.reputation_factor || 500000) * revenueScaler;

    return Math.round(downtimeImpact + dataImpact + regulatoryFines + recoveryCosts + reputationCosts);
  };

  const calculateAssetEAL = (asset, controlsOverride = null, exposureOverride = null) => {
    const riskScore = calculateAssetRiskScore(asset, controlsOverride, exposureOverride);
    const probability = 0.01 + (riskScore - 10) * (0.34 / 90);
    const financialImpact = calculateAssetFinancialImpact(asset);
    
    const ctrlOverride = controlsOverride || simulatedControls;
    let recoveryCostSimulated = asset.recoveryCost || asset.recovery_cost || 300000;
    if (ctrlOverride.backup) {
      recoveryCostSimulated = (asset.recoveryCost || asset.recovery_cost || 300000) * 0.3;
    }
    const adjustedFinancialImpact = financialImpact - ((asset.recoveryCost || asset.recovery_cost || 300000) - recoveryCostSimulated);

    return Math.round(probability * adjustedFinancialImpact);
  };

  // Roll Up calculations
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

    const averageRiskScore = Math.round(weightedRiskSum / (totalAssetsWithWeights || 1));

    return {
      eal: totalEal,
      exposure: totalExposure,
      riskScore: averageRiskScore
    };
  };

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
      riskScore: Math.round(weightedRiskSum / (totalAssetsWithWeights || 1))
    };
  };

  // Knapsack Optimizer
  const solveOptimization = (customBudget = org.budget, lockedIn = [], lockedOut = []) => {
    let availableOptions = CONTROLS_LIBRARY.filter(c => !lockedOut.includes(c.id));
    const baseStats = getActiveStats();
    
    const optionsWithEalReduction = availableOptions.map(c => {
      const tempControls = {
        mfa: false, patching: false, edr: false, segmentation: false, monitoring: false, backup: false
      };
      
      const key = c.id.replace('ctrl-', '');
      tempControls[key] = true;
      
      let tempEal = 0;
      assets.forEach(asset => {
        tempEal += calculateAssetEAL(asset, tempControls);
      });
      
      const ealReduction = baseStats.eal - tempEal;
      
      return {
        ...c,
        ealReduction: Math.max(0, ealReduction),
        key
      };
    });

    const lockedInControls = optionsWithEalReduction.filter(c => lockedIn.includes(c.id));
    const lockedInCost = lockedInControls.reduce((sum, c) => sum + c.cost, 0);
    
    const remainingBudget = customBudget - lockedInCost;
    const selectableOptions = optionsWithEalReduction.filter(c => !lockedIn.includes(c.id));

    let selectedList = [];
    if (remainingBudget >= 0) {
      const n = selectableOptions.length;
      const scale = 10000;
      const W = Math.floor(remainingBudget / scale);
      
      const weights = selectableOptions.map(o => Math.ceil(o.cost / scale));
      const values = selectableOptions.map(o => o.ealReduction);
      
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
      
      let j = W;
      for (let i = n; i > 0; i--) {
        if (dp[i][j] !== dp[i - 1][j]) {
          selectedList.push(selectableOptions[i - 1]);
          j -= weights[i - 1];
        }
      }
    }

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
      const assetExists = assets.some(a => a.id === record.assetId || a.id === record.asset_id);
      if (assetExists && record.vulnerability) {
        newFindings.push({
          id: `FND-${Date.now()}-${index}`,
          source: sourceName,
          assetId: record.assetId || record.asset_id,
          vulnerability: record.vulnerability,
          severity: record.severity || 'Medium',
          cvss: parseFloat(record.cvss) || 5.0,
          exploitAvailable: record.exploitAvailable === 'Yes' || record.exploitAvailable === true,
          internetExposed: record.internetExposed === 'Yes' || record.internetExposed === true,
          evidence: record.evidence || 'No additional telemetry attached.',
          controlState: record.controlState || 'Evaluation pending.',
          remediation: record.remediation || 'Remediation review required.',
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
      addAuditLog('DATA_INGESTION', sourceName, `Ingested ${parsedCount} vulnerability records.`);
    }
  };

  // Ingest CyberRiskIQ AI Security Assessment Results
  const ingestAssessmentFindings = async (dataOrRunId) => {
    try {
      let findingsList = [];
      if (Array.isArray(dataOrRunId)) {
        findingsList = dataOrRunId;
      } else if (dataOrRunId && Array.isArray(dataOrRunId.findings)) {
        findingsList = dataOrRunId.findings;
      } else if (typeof dataOrRunId === 'string') {
        const res = await fetch(`/api/assessment/result/${dataOrRunId}`);
        if (res.ok) {
          const json = await res.json();
          findingsList = json.results?.findings || json.findings || [];
        }
      }

      if (findingsList.length === 0) return;

      const formatted = findingsList.map((f, idx) => ({
        id: `FND-SEC-${Date.now()}-${idx}`,
        source: 'CyberRiskIQ AI Security Assessment',
        assetId: f.assetId || assets[0]?.id || 'AST-001',
        vulnerability: f.vulnerability || f.title || 'Discovered Security Finding',
        severity: f.severity || 'High',
        cvss: parseFloat(f.cvss) || 7.5,
        exploitAvailable: f.exploitAvailable === true || f.exploitAvailable === 'Yes' || !!f.exploit,
        internetExposed: f.internetExposed === true || f.internetExposed === 'Yes',
        evidence: f.evidence || f.description || 'PoC generated and verified via autonomous assessment agent.',
        controlState: f.controlState || 'Control evasion confirmed during automated penetration test.',
        remediation: f.remediation || 'Remediate according to security guidelines.',
        discoveredAt: new Date().toISOString(),
        status: 'Open',
        pocAttached: true
      }));

      ingestSecurityData('CyberRiskIQ AI Security Assessment', formatted);
    } catch (e) {
      console.error('Failed to ingest security assessment results:', e);
    }
  };

  // Compliance calculations (NIST, ISO, RBI, SEBI, CIS Controls)
  const getCompliancePosture = () => {
    const nistMapping = {
      'Identify (ID.AM)': ['mfa', 'patching'],
      'Protect (PR.AC)': ['mfa', 'segmentation'],
      'Protect (PR.DS)': ['backup'],
      'Detect (DE.AE)': ['monitoring'],
      'Respond (RS.RP)': ['edr', 'monitoring'],
      'Recover (RC.RP)': ['backup']
    };

    const isoMapping = {
      'A.9 Access Control': ['mfa'],
      'A.12 Operations Security': ['patching', 'monitoring'],
      'A.14 System Acquisition/Dev': ['segmentation'],
      'A.17 Information Security Continuity': ['backup'],
      'A.18 Compliance': ['monitoring', 'patching']
    };

    const rbiMapping = {
      'G-1: User Access Control': ['mfa'],
      'G-3: Vulnerability Management': ['patching'],
      'G-5: Cyber Security Operations (SOC)': ['monitoring'],
      'G-8: Incident Response & Recovery': ['edr', 'backup'],
      'G-11: Network Security & Segmentation': ['segmentation']
    };

    const sebiMapping = {
      'Sec 3.1: Identification & Asset Management': ['patching'],
      'Sec 3.2: Protection & Identity Management': ['mfa'],
      'Sec 3.3: Network Segmentation': ['segmentation'],
      'Sec 3.4: Monitoring & Detection': ['monitoring'],
      'Sec 3.5: Response & Endpoint Protection': ['edr'],
      'Sec 3.6: Recovery & Backups': ['backup']
    };

    const cisMapping = {
      'CIS-1: Inventory & Control of Assets': ['patching'],
      'CIS-3: Data Protection & Encryption': ['backup'],
      'CIS-6: Access Control Management': ['mfa'],
      'CIS-7: Continuous Vulnerability Management': ['patching'],
      'CIS-8: Audit Log & SIEM Monitoring': ['monitoring'],
      'CIS-10: Malware Defenses & EDR': ['edr'],
      'CIS-12: Network Infrastructure & Segmentation': ['segmentation'],
      'CIS-17: Incident Response Management': ['edr', 'monitoring']
    };

    const calculateFrameworkCoverage = (mapping) => {
      let totalItems = 0;
      let totalEffectiveSum = 0;

      Object.keys(mapping).forEach(category => {
        const controlsAssociated = mapping[category];
        controlsAssociated.forEach(ctrl => {
          assets.forEach(asset => {
            const controls = asset.controls || {};
            const effectiveness = simulatedControls[ctrl] ? 95 : (controls[ctrl] ?? 30);
            totalEffectiveSum += effectiveness;
            totalItems += 100;
          });
        });
      });

      return Math.round((totalEffectiveSum / (totalItems || 1)) * 100);
    };

    return {
      nist: calculateFrameworkCoverage(nistMapping),
      iso: calculateFrameworkCoverage(isoMapping),
      rbi: calculateFrameworkCoverage(rbiMapping),
      sebi: calculateFrameworkCoverage(sebiMapping),
      cis: calculateFrameworkCoverage(cisMapping)
    };
  };

  const addAsset = async (newAsset) => {
    const assetId = `AST-${String(assets.length + 1).padStart(3, '0')}`;
    const fullAsset = {
      ...newAsset,
      id: assetId,
      controls: newAsset.controls || { mfa: 30, patching: 30, edr: 30, segmentation: 30, monitoring: 30, backup: 30 }
    };
    setAssets(prev => [...prev, fullAsset]);
    addAuditLog('ASSET_ADDED', assetId, `Added asset ${newAsset.name}`);

    // Sync to backend if accessible
    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAsset.name,
          type: newAsset.type || 'Application',
          owner: newAsset.owner || 'IT Operations',
          business_unit: newAsset.businessUnit || 'Retail Banking',
          criticality: newAsset.criticality || 'Medium',
          data_sensitivity: newAsset.dataSensitivity || 'Medium',
          internet_exposure: newAsset.internetExposure || 'No'
        })
      });
    } catch (_) {}
  };

  const addFinding = async (newFinding) => {
    const findingId = `FND-${String(findings.length + 1).padStart(3, '0')}`;
    const fullFinding = {
      ...newFinding,
      id: findingId,
      discoveredAt: new Date().toISOString(),
      status: 'Open'
    };
    setFindings(prev => [fullFinding, ...prev]);
    addAuditLog('FINDING_ADDED', findingId, `Added finding ${newFinding.vulnerability} on ${newFinding.assetId}`);

    // Sync to backend if accessible
    try {
      await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: newFinding.assetId || 'AST-001',
          vulnerability: newFinding.vulnerability,
          severity: newFinding.severity || 'Medium',
          cvss: parseFloat(newFinding.cvss) || 5.0,
          exploit_available: newFinding.exploitAvailable === 'Yes' || newFinding.exploitAvailable === true,
          internet_exposed: newFinding.internetExposed === 'Yes' || newFinding.internetExposed === true
        })
      });
    } catch (_) {}
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
        auditLogs,
        addAuditLog,
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
        ingestAssessmentFindings,
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
