# CyberRiskIQ Model Accuracy & Validation Report

**Execution Timestamp**: 2026-09-06 10:44:01 UTC  
**Validation Suite Version**: 2.0.0 (FastAPI Backend Authoritative Engine)  
**Execution Runtime**: 0.543 seconds  
**Test Suite Status**: PASSED (100%)  

---

## 1. Scope & Disclaimer of Validation

> [!IMPORTANT]
> **WHAT THIS VALIDATION PROVES**:  
> This accuracy report verifies the **internal mathematical precision**, **algebraic correctness**, **boundary invariant preservation**, and **monotonic rank-ordering consistency** of CyberRiskIQ's risk and financial engines.

> [!WARNING]
> **WHAT THIS VALIDATION DOES NOT CLAIM**:  
> This suite **DOES NOT** make predictive actuarial claims against real-world breach frequencies or empirical financial losses for a specific enterprise. Because target organizations do not publish ground-truth historical loss distributions, these deterministic models serve as transparent, mathematically bounded decision-support tooling rather than statistical insurance underwriting.

---

## 2. Test Execution Summary

| Validation Category | Tests Executed | Passed | Failed | Errors | Success Rate |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Rank-Order Consistency** | 2 | 2 | 0 | 0 | **100.0%** |
| **Invariant / Property-Based Bounds** | 4 | 4 | 0 | 0 | **100.0%** |
| **Sensitivity & Monotonicity Analysis** | 4 | 4 | 0 | 0 | **100.0%** |
| **TOTAL** | **10** | **10** | **0** | **0** | **100.0%** |

---

## 3. Structural Invariant Verification (Property-Based Testing)

Automated property tests executed thousands of randomized synthetic permutations to verify that fundamental physical and mathematical invariants hold unconditionally:

| Invariant Property | Invariant Constraint | Trials Tested | Violations Found | Adherence Rate | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Loss Boundedness** | $\text{EAL} \le \text{Potential Loss}$ ($EAL \ge 0$) | 1000 | 0 | **100.0%** | **PASS** |
| **Budget Constraint** | $\sum x_i \cdot \text{Cost}_i \le \text{Budget}$ | 100 | 0 | **100.0%** | **PASS** |
| **Risk Score Bounds** | $\text{Risk Score} \in [0, 100]$ | 1000 | 0 | **100.0%** | **PASS** |
| **Enterprise Conservation** | $\text{Total EAL} = \sum \text{EAL}_i = \sum \text{BU EALs}$ | 50 | 0 | **100.0%** | **PASS** |

---

## 4. Rank-Order Consistency Results

Rank-order consistency tests verify that when asset or finding conditions worsen strictly along a known dimension, the resulting ratings and financial exposures preserve strict ordinal rank:

### 4.1 Threat Correlation Pairwise Ranking
- **Low CVSS Internal** (CVSS 4.0, No Exploit, Internal): **4.00 / 10.0**
- **Medium CVSS Internal** (CVSS 6.5, No Exploit, Internal): **6.50 / 10.0**
- **Medium CVSS Exposed + Exploited** (CVSS 6.5, Exploit $+1.2$, Exposed $+1.5$): **9.20 / 10.0**
- **Critical CVSS Exposed + Exploited** (CVSS 9.0, Exploit $+1.2$, Exposed $+1.5$): **10.00 / 10.0** (Clamped)
- **Monotonic Concordance**: **1.00 (Kendall's $\tau = 1.0$)**

### 4.2 Criticality & Control Posture Ranking
- **Low Criticality + 90% Hardened Controls**: Risk Score **19 / 100**
- **Medium Criticality + 50% Baseline Controls**: Risk Score **55 / 100**
- **Critical Tier + 10% Degraded Controls**: Risk Score **87 / 100**
- **Monotonic Concordance**: **1.00 (Strictly increasing)**

---

## 5. Parametric Sensitivity Analysis

We conducted univariate sensitivity sweeps across all primary engine parameters to verify continuous, monotonic response without unexplainable spikes or mathematical discontinuities:

### 5.1 Defensive Control Effectiveness vs Risk Score
*Target: AST-001 (Critical Asset, CVSS 8.0 Finding)*
- Control Coverage **0%** $\implies$ Risk Score **88 / 100**
- Control Coverage **25%** $\implies$ Risk Score **83 / 100**
- Control Coverage **50%** $\implies$ Risk Score **78 / 100**
- Control Coverage **75%** $\implies$ Risk Score **73 / 100**
- Control Coverage **100%** $\implies$ Risk Score **68 / 100**
- *Observation: Continuous linear mitigation rate of $-0.20$ score per $+1\%$ control coverage ($R^2 = 1.0000$).*

### 5.2 Finding CVSS Base vs Correlated Indicator
- CVSS **0.0** $\implies$ Correlated Score **0.00**
- CVSS **2.5** $\implies$ Correlated Score **2.50**
- CVSS **5.0** $\implies$ Correlated Score **5.00**
- CVSS **7.5** $\implies$ Correlated Score **7.50**
- CVSS **10.0** $\implies$ Correlated Score **10.00**
- *Observation: Exact identity mapping under zero modifiers; smoothly adds $+1.2$ (exploit) and $+1.5$ (exposure).*

### 5.3 Records Exposed vs Potential Loss & EAL
*Target: AST-003 Customer Database (₹150 / record, Score 65 $\implies P = 21.78\%$)*
- **1,000 records** $\implies$ Data Breach Loss: ₹1.5 Lakh $\implies$ Total EAL: ₹4.25 Lakh
- **10,000 records** $\implies$ Data Breach Loss: ₹15.0 Lakh $\implies$ Total EAL: ₹7.19 Lakh
- **100,000 records** $\implies$ Data Breach Loss: ₹1.50 Crore $\implies$ Total EAL: ₹36.59 Lakh
- **1,000,000 records** $\implies$ Data Breach Loss: ₹15.00 Crore $\implies$ Total EAL: ₹3.30 Crore
- *Observation: Strictly monotonic, scaled continuously with organizational headcount and record density.*

---

## 6. Boundary Edge Cases & Safeguards Implemented

During this calibration audit, the following safeguards and bounds checks were formalized in `backend/app/services/`:
1. **Upper-Bound Loss Invariant**: Clamped $EAL = \min(\text{Potential Loss}, P \times \text{Potential Loss})$.
2. **Knapsack Discretization Safety Guard**: Added a post-DP budget verification check to guarantee that fractional rounding never allows portfolio costs to exceed the entered budget.
3. **Appetite Scaling Bounds**: Ensured that conservative or aggressive risk appetite multipliers (Low: $1.25\times$, High: $0.75\times$) stay clamped within $[0, 100]$.
4. **Conservation of Enterprise Roll-Ups**: Verified that enterprise EAL exactly matches the sum of asset EALs and the sum of business unit distributions.

---

## 7. Conclusion

All 10 automated accuracy validation tests passed with zero invariant violations across 1,000 randomized configurations. The platform's mathematical engines are deterministic, rank-order consistent, and bounded.
