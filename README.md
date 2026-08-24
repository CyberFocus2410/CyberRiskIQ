# CyberRiskIQ: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization

CyberRiskIQ is a cutting-edge platform designed to translate complex, low-level technical cybersecurity telemetry (vulnerabilities, scanner outputs, and validated pentest results) into clear, currency-denominated business metrics (Expected Annual Loss - EAL, and Enterprise Financial Exposure) and optimize defense budgets mathematically.

---

## 1. The Problem We Address & Platform Innovation

### The Problems
1. **The Language Barrier**: Security analysts report threats using CVE numbers and CVSS scores, while board executives make decisions based on monetary exposure and service impact. This mismatch leads to misallocated budgets.
2. **Stale Assessments**: Traditional risk registers are point-in-time spreadsheets updated quarterly or annually. They become obsolete within days as systems shift and new exploits emerge.
3. **Suboptimal Spend Allocation**: Cybersecurity tools are often purchased based on vendor claims or isolated severity tags, rather than evaluating which combination of controls yields the maximum financial risk reduction for the business.

### The Innovation
* **Continuous Risk Engine**: CyberRiskIQ processes telemetry live, continuously updating risk ratings and Expected Annual Loss (EAL) without requiring manual refresh schedules.
* **Deterministic Budget Optimizer**: Formulates budget allocation as a classic **Knapsack Optimization** problem, allowing CISOs to find the mathematically optimal control portfolio to buy for a given budget limit.
* **Interactive Risk Sandbox**: An upfront interactive sandbox allowing organizations to adjust variables (endpoints, industry factors, current maturity) and immediately view the impact on their Annualized Loss Expectancy (ALE).

---

## 2. Technical Approach & Architecture

The application is built on a modern, high-performance web architecture:
* **Frontend Core**: Built with React, Vite, and Tailwind CSS v4 for lightning-fast loads and rendering.
* **Immersive Visual Aesthetics**:
  - A responsive GLSL WebGL background shader rendering flowing data waves with mouse-hover glowing ripples.
  - A Three.js wireframe icosahedron "Cyber Eye Core" rendering tori orbits and an 800-particle threat vector system.
* **Data Visualization**: Structured interactive charts powered by ECharts to render Spend Optimization curves and Business Unit EAL allocations.
* **Global State Management**: React Context (`RiskContext`) to manage organization configurations, assets, ingested findings, and simulation parameters, ensuring state changes propagate instantly across all components.

---

## 3. Mathematical & Risk Modeling Approach

### Risk Score Calculation (0-100)
For each asset, the risk score is computed dynamically based on the following formula:
$$\text{Risk Score} = \text{Threat Likelihood} \times \text{Business Criticality} \times \text{Control Gap}$$
Where:
* **Threat Likelihood**: Derived from the highest CVSS score of active findings, boosted if a working exploit is publicly available or the asset is internet-facing.
* **Control Gap**: The inverse of the asset's average control effectiveness ($1.0 - \text{Control Effectiveness}$).
* **Risk Appetite Scaling**: Multiplies the raw risk score by a factor corresponding to the organization's appetite (`Low` appetite scales the score up by **1.25x**; `High` appetite scales it down to **0.75x**).

### Financial Impact Model
Financial impact sums the losses across five categories:
$$\text{Financial Impact} = \text{Downtime Loss} + \text{Data Exposure Loss} + \text{Regulatory Penalties} + \text{Recovery Costs} + \text{Reputation Impact}$$
These values are scaled proportionally to the company's **Annual Revenue** (relative to a ₹50 Crore baseline) and **Employee Count** (relative to a 1200 employees baseline).

### Expected Annual Loss (EAL)
$$\text{EAL} = \text{Annual Probability of Breach} \times \text{Financial Impact}$$
Where the **Annual Probability** maps dynamically to the asset's risk score (ranging from 1% at a risk score of 10, up to 35% at a risk score of 100).

### Budget Optimization (Knapsack Solver)
Maximizes EAL reduction subject to the budget constraint:
$$\text{Maximize } \sum (c_i \cdot \text{EAL Reduction}_i) \text{ subject to } \sum \text{Cost}_i \le \text{Budget}$$
Using dynamic programming, the solver outputs the exact recommended controls, expected risk reduction, and Return on Security Investment (ROSI).

---

## 4. Feasibility, Impact & Benefits

### Technical Feasibility
* **Low Computational Overhead**: Dynamic programming for knapsack portfolios (6 baseline controls) computes in milliseconds, allowing instant scenario simulator previews without taxing server performance.
* **Interoperable Ingestion**: Uses a canonical JSON/CSV finding schema, making it compatible with outputs from scanners, SIEM tools, and pentest tools (like Strix).

### Impact & Benefits
* **Board-Level Clarity**: Translates security metrics into currency terms, allowing CISOs to justify budgets with quantitative ROI metrics (ROSI).
* **Agility**: Enables What-if simulations (e.g. *"What happens if we delay patching R&D by 30 days?"* or *"What is our ROI if we deploy MFA org-wide?"*) before spending resources.
* **Continuous Compliance**: Automatically maps control coverages to recognized frameworks (NIST CSF, ISO 27001, SEBI CSCRF, RBI CSF) as a direct byproduct of the risk engine.

---

## 5. Research & References

1. **CVSS v3.1/v4.0 Scoring Guidelines**: Used as the baseline for raw threat scoring.
2. **CISA Known Exploited Vulnerabilities (KEV) Catalog**: Grounded the threat correlation engine's logic that verified exploit availability must boost threat likelihood.
3. **NIST Special Publication 800-30**: Guide for Conducting Information Security Risk Assessments, which inspired the Threat-Asset-Impact mapping chain.
4. **Knapsack Problem & Optimization Algorithms**: Standard dynamic programming algorithms used for constraint optimization.
