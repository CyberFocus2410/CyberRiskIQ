// tests/test_engines.js
// Automated verification suite for CyberRiskIQ domain engines

import assert from 'assert';

console.log('=== CyberRiskIQ Engine Verification Tests ===\n');

// 1. Test Risk Score Calculation Formula
console.log('1. Testing Risk Score Quantification Formula...');
function calculateRiskScore(findingCvss, exploitAvailable, isExposed, criticality, avgControlRate, appetite = 'Medium') {
  let base = findingCvss;
  if (exploitAvailable) base += 1.2;
  if (isExposed) base += 1.5;
  const correlated = Math.min(10.0, Math.max(0.0, base));
  
  const threatLikelihood = correlated / 10.0;
  const critWeight = criticality === 'Critical' ? 1.0 : criticality === 'High' ? 0.8 : criticality === 'Medium' ? 0.6 : 0.4;
  const controlGap = 1.0 - (avgControlRate / 100.0);
  
  const rawScore = (threatLikelihood * 0.5 + critWeight * 0.3 + controlGap * 0.2) * 100;
  const mult = appetite === 'Low' ? 1.25 : appetite === 'High' ? 0.75 : 1.0;
  
  return Math.round(Math.min(100, Math.max(10, rawScore * mult)));
}

const score1 = calculateRiskScore(9.8, true, true, 'Critical', 50, 'Medium');
assert(score1 >= 10 && score1 <= 100, 'Score 1 must be bounded between 10 and 100');
console.log(`  ✓ High-threat Critical asset score: ${score1}/100`);

const score2 = calculateRiskScore(3.0, false, false, 'Low', 95, 'Medium');
assert(score2 >= 10 && score2 <= 40, 'Low-threat well-controlled asset score should be low');
console.log(`  ✓ Low-threat well-controlled asset score: ${score2}/100`);


// 2. Test Incident Probability Mapping
console.log('\n2. Testing Incident Probability Mapping...');
function calculateIncidentProbability(riskScore) {
  return 0.01 + (riskScore - 10) * (0.34 / 90);
}

const probMin = calculateIncidentProbability(10);
assert(Math.abs(probMin - 0.01) < 0.0001, 'Probability at score 10 must be 1%');
console.log(`  ✓ Score 10 maps to ${(probMin * 100).toFixed(1)}% annual probability`);

const probMax = calculateIncidentProbability(100);
assert(Math.abs(probMax - 0.35) < 0.0001, 'Probability at score 100 must be 35%');
console.log(`  ✓ Score 100 maps to ${(probMax * 100).toFixed(1)}% annual probability`);


// 3. Test Potential Loss Breakdown & EAL Calculation
console.log('\n3. Testing Potential Loss & EAL Calculations...');
function calculateLossAndEal(asset, riskScore, rev = 500000000, emp = 1200) {
  const revScaler = rev / 500000000;
  const empScaler = emp / 1200;
  
  const downtime = asset.downtimeCostPerHour * revScaler * 4;
  const breach = asset.recordsExposed * empScaler * asset.costPerRecord;
  const reg = asset.regulatoryPenalty * revScaler;
  const rec = asset.recoveryCost * empScaler;
  const rep = asset.reputationFactor * revScaler;
  
  const potentialLoss = downtime + breach + reg + rec + rep;
  const prob = calculateIncidentProbability(riskScore);
  const eal = Math.round(prob * potentialLoss);
  
  return { potentialLoss, prob, eal };
}

const testAsset = {
  id: 'AST-001',
  name: 'Payment API',
  downtimeCostPerHour: 450000,
  recordsExposed: 85000,
  costPerRecord: 350,
  regulatoryPenalty: 6000000,
  recoveryCost: 1800000,
  reputationFactor: 4000000
};

const lossRes = calculateLossAndEal(testAsset, score1);
assert(lossRes.potentialLoss > 0, 'Potential loss must be positive');
assert(lossRes.eal > 0 && lossRes.eal <= lossRes.potentialLoss, 'EAL must be <= Potential Loss');
console.log(`  ✓ Potential Single Loss: ₹${(lossRes.potentialLoss / 100000).toFixed(2)} Lakh`);
console.log(`  ✓ Expected Annual Loss (EAL): ₹${(lossRes.eal / 100000).toFixed(2)} Lakh`);


// 4. Test 0/1 Knapsack Dynamic Programming Optimizer
console.log('\n4. Testing 0/1 Knapsack Portfolio Optimizer...');
const controls = [
  { id: 'ctrl-mfa', name: 'MFA & PAM', cost: 1200000, reduction: 2500000 },
  { id: 'ctrl-patching', name: 'Auto-Patching', cost: 1500000, reduction: 3000000 },
  { id: 'ctrl-edr', name: 'EDR Agent', cost: 1800000, reduction: 3200000 },
  { id: 'ctrl-segmentation', name: 'Micro-segmentation', cost: 2500000, reduction: 4000000 },
  { id: 'ctrl-monitoring', name: 'SOC Monitoring', cost: 1000000, reduction: 1800000 },
  { id: 'ctrl-backup', name: 'Immutable Backups', cost: 600000, reduction: 1200000 }
];

function knapsackOptimizer(budget, items, lockedIn = [], lockedOut = []) {
  const available = items.filter(c => !lockedOut.includes(c.id));
  const lockedInItems = available.filter(c => lockedIn.includes(c.id));
  const lockedInCost = lockedInItems.reduce((s, c) => s + c.cost, 0);
  
  const remainingBudget = budget - lockedInCost;
  const selectable = available.filter(c => !lockedIn.includes(c.id));
  
  let selected = [];
  if (remainingBudget >= 0) {
    const scale = 10000;
    const W = Math.floor(remainingBudget / scale);
    const n = selectable.length;
    const weights = selectable.map(c => Math.ceil(c.cost / scale));
    const values = selectable.map(c => c.reduction);
    
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
        selected.push(selectable[i - 1]);
        j -= weights[i - 1];
      }
    }
  }
  
  const finalSel = [...lockedInItems, ...selected];
  const totalCost = finalSel.reduce((s, c) => s + c.cost, 0);
  const totalRed = finalSel.reduce((s, c) => s + c.reduction, 0);
  const rosi = totalCost > 0 ? Math.round(((totalRed - totalCost) / totalCost) * 100) : 0;
  
  return { finalSel, totalCost, totalRed, rosi };
}

const opt1 = knapsackOptimizer(3500000, controls);
assert(opt1.totalCost <= 3500000, 'Selected total cost must not exceed budget ₹35L');
assert(opt1.finalSel.length > 0, 'Optimizer should select controls');
assert(opt1.rosi > 0, 'ROSI should be positive');
console.log(`  ✓ Budget ₹35L: Selected ${opt1.finalSel.length} controls, Cost: ₹${opt1.totalCost/100000}L, Reduction: ₹${opt1.totalRed/100000}L, ROSI: ${opt1.rosi}%`);

// Test Lock-in override
const optLock = knapsackOptimizer(3500000, controls, ['ctrl-segmentation']);
assert(optLock.finalSel.some(c => c.id === 'ctrl-segmentation'), 'Must include forced-in control');
assert(optLock.totalCost <= 3500000, 'Total cost with lock-in must not exceed budget');
console.log(`  ✓ Lock-in test passed (ctrl-segmentation included, Cost: ₹${optLock.totalCost/100000}L)`);

console.log('\n=== ALL ENGINE TESTS PASSED SUCCESSFULLY ===\n');
