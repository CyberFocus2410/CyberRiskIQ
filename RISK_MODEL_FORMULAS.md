# CyberRiskIQ Mathematical Risk & Valuation Models Specification

**Document Version**: 2.0.0 (Authoritative Backend Reference)  
**Author**: CyberRiskIQ Core Engineering Team  
**Status**: Production Standard (Ported to Python FastAPI Backend)  

---

## Executive Summary & Model Philosophy

CyberRiskIQ translates technical security telemetry (CVSS base scores, exploit availability, attack surface exposure, control gaps) into standardized financial metrics (Value at Risk, Expected Annual Loss, ROSI) to support capital allocation and board-level governance.

> [!IMPORTANT]
> **Transparency & Calibration Disclosure**:  
> These formulas implement transparent, deterministic, and bounded decision-support models. Wherever possible, coefficients are calibrated against published industry benchmarks (FIRST CVSS v3.1, FIRST EPSS, CISA KEV, Verizon DBIR, IBM/Ponemon Cost of a Data Breach, Cyentia IRIS). Where exact statistical parameters do not exist in academic literature, weights are declared as explicit, configurable constants with transparent engineering rationales.

---

## Formula 1: Correlated Risk Indicator (Finding Severity)

### 1.1 Purpose
Quantifies the contextualized threat severity of an individual security finding by augmenting its baseline vulnerability score with exploit weaponization intelligence and exposure topology.

### 1.2 Mathematical Formulation

$$\text{Correlated Risk Indicator} = \min\left(10.0, \; \text{CVSS}_{\text{Base}} + W_{\text{exploit}} \cdot [\text{Exploit Available}] + W_{\text{exposure}} \cdot [\text{Internet Exposed}]\right)$$

Where:
- $\text{CVSS}_{\text{Base}} \in [0.0, 10.0]$: Base vulnerability severity score (CVSS v3.1).
- $[\text{Exploit Available}] \in \{0, 1\}$: Binary flag indicating active in-the-wild exploit or public PoC existence.
- $[\text{Internet Exposed}] \in \{0, 1\}$: Binary flag indicating internet routability of the parent asset.
- $W_{\text{exploit}} = 1.2$: Configurable exploit weight.
  - *Benchmark Citation*: Grounded in FIRST EPSS and CISA Known Exploited Vulnerabilities (KEV) catalogue data, which indicates weaponized vulnerabilities exhibit a 10–30x increase in attack volume.
- $W_{\text{exposure}} = 1.5$: Configurable network exposure weight.
  - *Benchmark Citation*: Grounded in Verizon DBIR findings that externally reachable assets account for $>70\%$ of external perimeter breach entries.
- $\min(10.0, \dots)$: Boundary invariant enforcing an absolute upper bound of $10.0$.

### 1.3 Worked Numerical Example (FinSecure Bank `AST-001`)
- **Target Finding**: `FND-001` (Broken Object Level Authorization on Payment Gateway API)
- **Inputs**:
  - $\text{CVSS}_{\text{Base}} = 9.8$
  - $\text{Exploit Available} = \text{True} \; (1)$
  - $\text{Internet Exposed} = \text{True} \; (1)$
- **Calculation**:
  $$\text{Raw Score} = 9.8 + (1.2 \times 1) + (1.5 \times 1) = 9.8 + 1.2 + 1.5 = 12.5$$
  $$\text{Correlated Indicator} = \min(10.0, 12.5) = \mathbf{10.00 / 10.0}$$

---

## Formula 2: Asset Risk Rating (Composite Threat Score)

### 2.1 Purpose
Aggregates technical finding severity, business criticality, defensive control deficiencies, and organizational risk tolerance into a single normalized $[0, 100]$ score.

### 2.2 Mathematical Formulation

$$\text{Raw Rating} = \left( W_{\text{threat}} \cdot \mathcal{T} + W_{\text{crit}} \cdot \mathcal{C} + W_{\text{gap}} \cdot \mathcal{G} \right) \times 100$$

$$\text{Asset Risk Rating} = \text{clamp}\left(0, 100, \; \text{round}\left(\text{Raw Rating} \times \mathcal{M}_{\text{appetite}}\right)\right)$$

Where:
- $\mathcal{T} \in [0.0, 1.0]$: Threat Likelihood, defined as $\frac{\max(\text{Correlated Risk Indicators on Asset})}{10.0}$ (defaults to $0.20$ if no findings).
- $\mathcal{C} \in [0.25, 1.0]$: Asset Business Criticality tier weight:
  - $\text{Low} = 0.25, \; \text{Medium} = 0.50, \; \text{High} = 0.75, \; \text{Critical} = 1.00$.
- $\mathcal{G} \in [0.0, 1.0]$: Defensive Control Gap, defined as:
  $$\mathcal{G} = 1.0 - \frac{1}{N} \sum_{k=1}^{N} \frac{\text{Effectiveness}_k}{100}$$
  Across the standard 6 core controls: MFA, Patching, EDR, Network Segmentation, SOC Monitoring, Immutable Backup.
- $W_{\text{threat}} = 0.50$: Threat likelihood component weight *(Heuristic estimate: prioritized for operational risk)*.
- $W_{\text{crit}} = 0.30$: Asset impact / business tier weight *(Heuristic estimate)*.
- $W_{\text{gap}} = 0.20$: Defensive control posture gap weight *(Heuristic estimate)*.
  *(Note: $\sum W = 0.50 + 0.30 + 0.20 = 1.00$).*
- $\mathcal{M}_{\text{appetite}}$: Risk appetite tolerance scaling factor:
  - $\text{Low Risk Tolerance (Conservative)} = 1.25$
  - $\text{Moderate Risk Tolerance (Balanced)} = 1.00$
  - $\text{High Risk Tolerance (Aggressive)} = 0.75$

### 2.3 Worked Numerical Example (FinSecure Bank `AST-001`)
- **Asset**: `AST-001` (Payment Gateway API)
- **Inputs**:
  - $\mathcal{T} = \frac{10.0}{10.0} = 1.00$ (from `FND-001`)
  - $\mathcal{C} = 1.00$ (Critical Tier)
  - Controls: MFA ($35\%$), Patching ($60\%$), EDR ($85\%$), Segmentation ($25\%$), Monitoring ($70\%$), Backup ($90\%$)
    $$\bar{E} = \frac{35 + 60 + 85 + 25 + 70 + 90}{6} = \frac{365}{6} = 60.8333\% = 0.608333$$
    $$\mathcal{G} = 1.0 - 0.608333 = 0.391667$$
  - Risk Appetite: Moderate ($\mathcal{M}_{\text{appetite}} = 1.00$)
- **Calculation**:
  $$\text{Raw Rating} = (0.50 \times 1.00 + 0.30 \times 1.00 + 0.20 \times 0.391667) \times 100$$
  $$\text{Raw Rating} = (0.50 + 0.30 + 0.078333) \times 100 = 87.8333$$
  $$\text{Asset Risk Rating} = \text{clamp}(0, 100, \text{round}(87.8333 \times 1.0)) = \mathbf{88 / 100}$$

---

## Formula 3: Annual Incident Probability ($P$)

### 3.1 Purpose
Calibrates the discrete $[0, 100]$ asset risk score into a continuous annualized probability of a material security compromise ($P \in [0.01, 0.35]$).

### 3.2 Mathematical Formulation

$$P = P_{\min} + (\text{Score}_{\text{Asset}} - S_{\text{min}}) \times \left( \frac{P_{\max} - P_{\min}}{S_{\max} - S_{\min}} \right)$$

$$P = \text{clamp}\left(P_{\min}, P_{\max}, \; 0.01 + (\text{Score}_{\text{Asset}} - 10) \times \frac{0.34}{90}\right)$$

Where:
- $S_{\min} = 10, \; S_{\max} = 100$: Risk score anchor range.
- $P_{\min} = 0.01 \; (1.0\% \text{ annual baseline compromise rate})$:
  - *Benchmark Citation*: Cyentia Information Risk Insights Study (IRIS) baseline annual probability for hardened enterprise environments with baseline hygiene.
- $P_{\max} = 0.35 \; (35.0\% \text{ upper annualized limit})$:
  - *Benchmark Citation*: Verizon DBIR and Cyentia IRIS empirical breach rates for severely degraded, internet-facing assets with weaponized exploits.

### 3.3 Worked Numerical Example (FinSecure Bank `AST-001`)
- **Input**: $\text{Score} = 88$
- **Calculation**:
  $$P = 0.01 + (88 - 10) \times \left(\frac{0.34}{90}\right) = 0.01 + 78 \times 0.00377778 = 0.01 + 0.294667 = \mathbf{0.304667} \; (\mathbf{30.47\%})$$

---

## Formula 4: Asset Potential Loss ($L$) / Value at Risk

### 4.1 Purpose
Computes the single-event financial exposure (Worst-Case Value at Risk) across 5 standard corporate loss categories if the asset suffers a full compromise.

### 4.2 Mathematical Formulation

$$\text{Potential Loss } (L) = L_{\text{downtime}} + L_{\text{breach}} + L_{\text{regulatory}} + L_{\text{recovery}} + L_{\text{reputation}}$$

Where:
1. **Downtime Loss** ($L_{\text{downtime}}$):
   $$L_{\text{downtime}} = \text{Hourly Downtime Cost} \times T_{\text{outage}}$$
   - $T_{\text{outage}} = 4.0 \text{ hours}$ default. *(Grounded in Gartner enterprise server outage duration statistics).*
2. **Data Breach Loss** ($L_{\text{breach}}$):
   $$L_{\text{breach}} = \text{Records Exposed} \times \text{Cost per Record}$$
   - *Benchmark Citation*: IBM Security / Ponemon Institute *Cost of a Data Breach Report* (calibrated to industry averages, e.g. ₹150–₹450 / record in financial services).
3. **Regulatory Penalties** ($L_{\text{regulatory}}$):
   Statutory non-compliance fines (e.g. DPDP Act 2023, RBI Master Direction, SEBI CSCRF penalties).
4. **Incident Recovery & Forensics** ($L_{\text{recovery}}$):
   Direct DFIR engagement, external legal counsel, and system restoration costs.
5. **Reputation / Customer Churn Impact** ($L_{\text{reputation}}$):
   Actuarial estimate of brand damage and lost recurring transaction volume.

### 4.3 Worked Numerical Example (FinSecure Bank `AST-001`)
- **Asset**: `AST-001` (Payment Gateway API)
- **Inputs**:
  - Hourly Downtime Cost: ₹450,000 / hr ($T_{\text{outage}} = 4.0\text{h} \implies L_{\text{downtime}} = ₹1,800,000$)
  - Records Exposed: 85,000 records @ ₹350 / record $\implies L_{\text{breach}} = ₹29,750,000$
  - Regulatory Penalty: $L_{\text{regulatory}} = ₹6,000,000$
  - Recovery / Forensics: $L_{\text{recovery}} = ₹1,800,000$
  - Reputation Impact: $L_{\text{reputation}} = ₹4,000,000$
- **Calculation**:
  $$L = 1,800,000 + 29,750,000 + 6,000,000 + 1,800,000 + 4,000,000 = \mathbf{₹43,350,000} \; (\mathbf{₹4.335 \text{ Crore}})$$

---

## Formula 5: Expected Annual Loss (EAL)

### 5.1 Purpose
Quantifies the actuarial expected financial loss per year for an individual asset and aggregates to enterprise business units.

### 5.2 Mathematical Formulation

$$\text{EAL} = \min\left( L, \; P \times L \right)$$

$$\text{Enterprise EAL} = \sum_{j=1}^{M} \text{EAL}_j = \sum_{\text{BU}} \text{EAL}_{\text{BU}}$$

Where:
- $P \in [0.01, 0.35]$: Annualized incident probability.
- $L$: Asset potential loss.
- $\min(L, \dots)$: Boundary invariant guaranteeing that EAL never exceeds single-event potential loss under any parameter perturbation.

### 5.3 Worked Numerical Example (FinSecure Bank `AST-001`)
- **Inputs**:
  - $P = 0.304667$
  - $L = ₹43,350,000$
- **Calculation**:
  $$\text{EAL} = \min(43,350,000, \; 0.304667 \times 43,350,000) = \mathbf{₹13,207,300} \; (\mathbf{₹1.32 \text{ Crore / year}})$$

---

## Formula 6: Return on Security Investment (ROSI)

### 6.1 Purpose
Evaluates the capital efficiency of deploying a defensive security control initiative relative to its annualized loss reduction.

### 6.2 Mathematical Formulation

$$\text{ROSI } (\%) = \left[ \frac{\Delta \text{EAL}_{\text{mitigated}} - \text{Cost}_{\text{implementation}}}{\text{Cost}_{\text{implementation}}} \right] \times 100$$

Where:
- $\Delta \text{EAL}_{\text{mitigated}} = \text{EAL}_{\text{baseline}} - \text{EAL}_{\text{post-mitigation}}$: Annual monetary risk reduction achieved across affected assets.
- $\text{Cost}_{\text{implementation}}$: Total implementation, licensing, and operational cost of the initiative.

### 6.3 Worked Numerical Example (Enterprise MFA Deployment)
- **Initiative**: Global Privileged Multi-Factor Authentication
- **Inputs**:
  - Implementation Cost: ₹450,000
  - Projected Enterprise EAL Reduction: ₹1,850,000
- **Calculation**:
  $$\text{ROSI} = \left[ \frac{1,850,000 - 450,000}{450,000} \right] \times 100 = \left[ \frac{1,400,000}{450,000} \right] \times 100 = \mathbf{311.11\%}$$

---

## Formula 7: 0/1 Knapsack Security Portfolio Optimizer

### 7.1 Purpose
Solves the combinatorial capital allocation problem to select the optimal portfolio of security initiatives that maximizes enterprise EAL reduction subject to a strict budgetary ceiling.

### 7.2 Mathematical Formulation

$$\max_{x} \sum_{i=1}^{n} x_i \cdot \Delta \text{EAL}_i \quad \text{subject to} \quad \sum_{i=1}^{n} x_i \cdot \text{Cost}_i \le \text{Budget}, \quad x_i \in \{0, 1\}$$

Where:
- $n$: Number of candidate defensive initiatives.
- $x_i \in \{0, 1\}$: Binary decision variable ($1 = \text{fund/deploy}, 0 = \text{defer}$).
- $\Delta \text{EAL}_i$: Financial risk reduction benefit of initiative $i$.
- $\text{Cost}_i$: Implementation cost of initiative $i$.
- $\text{Budget}$: Total cybersecurity capital expenditure budget.

### 7.3 Algorithmic Guarantee
Implemented via dynamic programming with state discretization. Guaranteed boundary invariant:
$$\sum_{i \in \text{Selected}} \text{Cost}_i \le \text{Budget} \quad (\text{Enforced by post-DP safety filter})$$

---

## Formula 8: Compliance Framework Coverage Percentage

### 8.1 Purpose
Measures enterprise compliance posture across international and regulatory frameworks (NIST CSF 2.0, ISO/IEC 27001, RBI Master Direction, SEBI CSCRF, CIS Critical Controls) based on operational control effectiveness.

### 8.2 Mathematical Formulation

$$\text{Coverage } (\%) = \text{round}\left( \frac{\sum_{c \in \mathcal{C}_{\text{fw}}} \sum_{a \in \mathcal{A}} \text{Effectiveness}(a, c)}{100.0 \times |\mathcal{C}_{\text{fw}}| \times |\mathcal{A}|} \times 100 \right)$$

Where:
- $\mathcal{C}_{\text{fw}}$: Set of technical controls mapped to framework $\text{fw}$.
- $\mathcal{A}$: Complete set of enterprise assets.
- $\text{Effectiveness}(a, c) \in [0.0, 100.0]$: Control $c$'s measured percentage effectiveness on asset $a$ (or simulated $95.0\%$ when an initiative is enabled).
- $|\mathcal{C}_{\text{fw}}| \times |\mathcal{A}| \times 100.0$: Maximum theoretical control score.

### 8.3 Worked Numerical Example
- **Framework**: RBI Cyber Security Framework (5 mapped control categories: MFA, Patching, SOC, EDR, Segmentation $\implies |\mathcal{C}_{\text{rbi}}| = 5$).
- Across 52 assets with baseline average control effectiveness of $68.4\%$:
  $$\text{Coverage } \% = \text{round}\left( \frac{52 \times 5 \times 68.4}{52 \times 5 \times 100} \times 100 \right) = \mathbf{68\%}$$

---

## Summary Matrix of Parameters & Sources

| Parameter / Coefficient | Default Value | Classification | Authoritative Source / Benchmark Citation |
|:---|:---:|:---:|:---|
| $W_{\text{exploit}}$ | $1.2$ | Benchmark-Grounded | FIRST EPSS / CISA KEV (10–30x breach likelihood multiplier) |
| $W_{\text{exposure}}$ | $1.5$ | Benchmark-Grounded | Verizon DBIR ($>70\%$ of external intrusions target internet assets) |
| $W_{\text{threat}}$ | $0.50$ | Configurable Estimate | Internal risk engine heuristic (prioritizes active threats) |
| $W_{\text{crit}}$ | $0.30$ | Configurable Estimate | Internal risk engine heuristic (business asset weighting) |
| $W_{\text{gap}}$ | $0.20$ | Configurable Estimate | Internal risk engine heuristic (defensive posture weighting) |
| $P_{\min}$ | $0.01$ (1%) | Benchmark-Grounded | Cyentia IRIS Baseline Enterprise Loss Frequency |
| $P_{\max}$ | $0.35$ (35%) | Benchmark-Grounded | Cyentia IRIS & Verizon DBIR Maximum Degraded Breach Rate |
| $T_{\text{outage}}$ | $4.0 \text{ hrs}$ | Benchmark-Grounded | Gartner Enterprise Outage Analysis |
| Cost / Record | ₹150–₹450 | Benchmark-Grounded | IBM Security / Ponemon Cost of a Data Breach Report |
