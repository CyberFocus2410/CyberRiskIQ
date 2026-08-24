## **PRODUCT REQUIREMENTS DOCUMENT** 

**CyberRiskIQ** _AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform_ 

Version 1.0  |  Draft for Review Prepared for Smart India Hackathon (SIH) MVP Scope 

# 1. Document Control 

|**Field**|**Detail**|
|---|---|
|Product Name|CyberRiskIQ (working name)|
|Document Type|Product Requirements Document (PRD)|
|Version|1.0|
|Status|Draft|
|Companion Document|Functional Requirements Document (FRD) — CyberRiskIQ_FRD.docx|



# 2. Executive Summary 

CyberRiskIQ is a platform that continuously converts technical cybersecurity telemetry — vulnerabilities, scan results, validated penetration-test findings — into quantified financial exposure, and recommends the most costeffective combination of security investments to reduce that exposure. 

Security teams today report risk in technical language (CVE numbers, CVSS scores). Executives and boards need to know financial exposure in currency terms. CyberRiskIQ closes this gap by running every finding through a continuous risk-quantification pipeline that ends in a single, defensible number: Expected Annual Loss (EAL). 

The platform's core differentiator is the Investment Optimizer: given a fixed security budget, it computes the combination of controls that produces the greatest reduction in financial risk — reframing the CISO's question from "what tools should we buy" to "which combination of controls minimizes  risk for a given  budget."₹ ₹ 

# 3. Problem Statement 

#### 3.1 Technical risk doesn't translate into money 

Security teams report findings as CVE IDs and CVSS scores. Executives need potential financial impact, expected annual loss, and the business service affected. Without translation, security spend decisions are made on severity labels rather than business risk. 

#### 3.2 Risk assessments go stale 

Most organizations assess risk periodically (quarterly/annual) while vulnerabilities, infrastructure, applications, controls, and threat activity change continuously. A point-in-time assessment is out of date within days. 

#### 3.3 Security spending isn't optimized 

Budget decisions are typically made tool-by-tool rather than by asking: "which combination of controls produces the maximum reduction in financial cyber risk for a given budget?" This is the central business problem CyberRiskIQ solves. 

# 4. Goals & Objectives 

- Provide a continuous (not point-in-time) pipeline that converts security telemetry into financial risk. 

- Give every stakeholder — CISO, Risk Officer, Analyst, Compliance Officer, Board — a role-appropriate view of the same underlying risk data. 

- Recommend and simulate mitigations with explicit cost, EAL-reduction, and ROSI figures. 

- Optimize a fixed security budget across competing controls for maximum enterprise risk reduction. 

- Map every risk and control to recognized compliance frameworks (NIST CSF, ISO/IEC 27001, CIS Controls, RBI CSF, SEBI CSCRF) without a disconnected compliance module. 

- Demonstrate one unbroken, explainable chain from a single finding to a board-level ROSI figure. 

# 5. Target Users & Personas 

|**Persona**|**Primary Needs**|
|---|---|
|CISO / Chief Security Officer|Overall exposure, major risks, investment recommendations, ROSI, trend<br>lines|
|Risk Officer|Risk calculations, risk registers, scenarios, business impact, framework<br>mappings|
|Security Analyst|Vulnerabilities, assets, attack paths, findings, remediation detail|
|Compliance Officer|Framework coverage, evidence, control gaps, audit-ready reports|
|Executive / Board|Financial exposure, risk reduction, investment efficiency, concise<br>recommendations|



# 6. Product Scope 

### 6.1 In Scope — MVP 

The MVP is locked to 10 screens, chosen to demonstrate the complete problem-to-decision chain without becoming an unfinishable enterprise platform: 

- Login / Organization Setup 

- Executive Risk Dashboard 

- Asset Inventory & Dependency Map 

- Security Findings / Strix Findings 

- Risk Quantification 

- Financial Risk Analysis 

- AI Cyber Risk Analyst 

- What-if Scenario Simulator 

- Security Investment Optimizer 

- Compliance & Reports 

### 6.2 Ingestion Scope — MVP 

Full-scale connectors (Nessus, Qualys, Tenable, Splunk, Sentinel, Defender, CrowdStrike, Entra/Okta, AWS/Azure/GCP CSPM) are explicitly out of MVP scope. MVP ingestion is limited to: 

- CSV upload 

- JSON upload 

- REST API 

- Strix (AI pentesting) output 

- A built-in demo data generator for presentation/testing 

### 6.3 Out of Scope (Future Roadmap) 

- Native connectors for SIEM, EDR, IAM, and CSPM tools listed in Step 3 of the workflow 

- Automated evidence collection for compliance audits 

- Multi-tenant MSSP mode 

- Predictive/forecasted risk trending beyond the scenario simulator 

# 7. What Strix Is and Isn't Responsible For 

Strix is an AI-driven penetration-testing tool that performs reconnaissance and produces validated findings with proof-of-concept evidence for local targets, GitHub repositories, web applications, APIs, and CI/CD pipelines. CyberRiskIQ integrates Strix as one evidence source feeding the Risk Engine — it is not the Risk Engine itself. 

#### 7.1 Strix's role 

- Target reconnaissance and AI-driven pentesting 

- Producing validated findings with PoC evidence 

- Feeding CyberRiskIQ's ingestion API as an evidence source 

#### 7.2 Explicitly not Strix's role 

- Enterprise financial loss calculation 

- Expected Annual Loss or Value-at-Risk computation 

- Investment optimization 

- Asset criticality scoring 

- Board dashboards, budget allocation, compliance scoring, or ROSI 

These remain CyberRiskIQ's own intellectual property: "Our platform doesn't blindly trust scanner severity; it consumes validated application-security findings as evidence when calculating risk." 

# 8. Core Product Workflow (15 Steps) 

|**#**|**Stage**|**Purpose**|
|---|---|---|
|1|Organization Setup|Capture org profile, revenue, budget, risk appetite|
|2|Asset Discovery & Inventory|Build a centralized, dependency-aware asset register|
|3|Security Data Ingestion|Accept findings from Strix, scanners, SIEM, IAM, cloud,<br>threat intel|
|4|Data Normalization|Map all sources into one common finding schema|
|5|Threat & Vulnerability Correlation|Combine CVSS with exploitability, exposure, and existing<br>controls|
|6|Asset Criticality & Business Impact<br>Modeling|Quantify downtime, data, regulatory, recovery, and reputation<br>impact|
|7|Control Effectiveness Evaluation|Score each control's real-world effectiveness per asset|
|8|Continuous Risk Quantification|Compute a 0–100 risk score continuously, not periodically|
|9|Financial Loss Estimation|Convert risk score into Expected Annual Loss (EAL)|



|**#**|**Stage**|**Purpose**|
|---|---|---|
|10|AI Risk Analysis|Natural-language explanation of top risk drivers|
|11|Mitigation Recommendations|Ranked actions with cost and EAL-reduction|
|12|What-if Scenario Simulation|Model the EAL impact of hypothetical control changes|
|13|Investment Optimization|Select the control portfolio maximizing risk reduction per<br>rupee|
|14|Compliance & Framework Mapping|Tie every control/risk to NIST, ISO, CIS, RBI, SEBI|
|15|Executive & Technical Reporting|Generate role-specific, exportable reports|



# 9. Key Features (Product-Level) 

### 9.1 Continuous Risk Engine 

Risk is computed as a function of Threat Likelihood, Business Impact, Exposure, Asset Criticality, and Control Gap, normalized to a 0–100 score and simultaneously expressed as a currency-denominated Expected Annual Loss. The engine re-runs continuously as new telemetry arrives, not on a fixed assessment cycle. 

### 9.2 Financial Risk Roll-Up 

Individual asset risk aggregates upward — Asset → Application → Business Service → Business Unit → Enterprise — so a single board figure (Enterprise Exposure, EAL, Risk Score) is always traceable back to the specific findings that drive it. 

### 9.3 AI Risk Analyst 

A conversational layer over the structured risk data that answers questions such as "What is our biggest financial cyber risk?" with a grounded, numeric answer rather than a generic severity statement. 

### 9.4 AI Mitigation Recommendations 

Every recommendation is expressed as Cost → EAL Reduction, not a bare severity-based instruction. This is the qualitative difference between "patch it because it's critical" and a defensible, financially-ranked action list. 

### 9.5 What-if Scenario Simulator 

Lets users test hypothetical control changes (e.g., "enable MFA for all privileged accounts" or "delay critical patch remediation by 30 days") and see the before/after EAL and exposure delta instantly. 

### 9.6 Investment Optimizer 

Given an available budget and a set of candidate controls, the optimizer selects the combination that maximizes annual risk reduction, and reports the resulting ROSI (Return on Security Investment) percentage. This is the platform's signature capability. 

### 9.7 Investment vs. Risk Reduction Curve 

A visual curve showing the point of diminishing returns, helping the CISO justify where additional spend stops being worthwhile. 

### 9.8 Compliance Intelligence 

Framework mapping (NIST CSF, ISO/IEC 27001, CIS Controls, RBI Cyber Security Framework, SEBI Cybersecurity and Cyber Resilience Framework) is derived from the same Risk → Control chain rather than maintained as a separate module, so compliance gaps are always tied back to financial risk. 

### 9.9 Role-Based Reporting 

Executive, Technical, and Compliance report templates are generated from the same underlying data model, each surfacing the fields relevant to that audience. 

# 10. Success Metrics 

|**Metric**|**Target for MVP Demo**|
|---|---|
|End-to-end traceability|Every displayed EAL figure must be traceable to source finding(s) in ≤3<br>clicks|
|Ingestion breadth|Successfully normalize findings from at least 2 formats (CSV/JSON) +<br>Strix output|
|Optimizer correctness|Optimizer output must not exceed the entered budget and must be<br>reproducible|
|Scenario responsiveness|Simulated EAL recalculation returns in-session, without manual reload|
|Framework coverage|At least 2 frameworks (e.g., NIST CSF, ISO 27001) mapped end-to-end<br>for demo assets|
|Narrative completeness|The 12-node finding-to-ROSI chain (Section 12) is demonstrable for at<br>least one live example|



# 11. Assumptions & Constraints 

- Business-impact figures (downtime cost/hour, cost per record, penalty exposure) are configurable estimates entered by the organization, not claimed to be precise actuarial measurements. 

- Control effectiveness percentages are evidence-based estimates (configuration, telemetry, incident history, compliance status) rather than guaranteed measured values. 

- MVP ingestion assumes semi-structured input (CSV/JSON/API/Strix) rather than raw tool-native connectors. 

- Currency is INR (₹) for the MVP; multi-currency support is a future consideration. 

- The Investment Optimizer solves a constrained selection problem (budget-limited); it does not model multiyear phased investment in the MVP. 

# 12. The Single Most Important Design Principle 

Every screen in CyberRiskIQ must let a user follow one finding all the way through a single unbroken chain: 

- CVE / Security Finding 

- Affected Asset 

- Business Service 

- Threat Likelihood 

- Potential Financial Impact 

- Expected Annual Loss 

- Recommended Control 

- Cost 

- Risk Reduction 

- ROSI 

- Framework / Compliance Mapping 

This chain is the product. Every feature in this PRD exists to make one or more links in this chain visible, explainable, and defensible. 

# 13. Release Plan (Indicative) 

|**Phase**|**Scope**|
|---|---|
|MVP (Hackathon)|10 screens listed in Section 6.1; CSV/JSON/API/Strix ingestion; demo data<br>generator; 2-framework compliance mapping|
|Phase 2|Native SIEM/EDR/IAM/CSPM connectors; multi-year investment planning;<br>expanded framework library|
|Phase 3|Multi-tenant/MSSP mode; automated compliance evidence collection; predictive<br>risk trending|



# 14. Open Questions 

- What is the authoritative source for business-impact monetary factors — user-entered, benchmark library, or both? 

- Should the AI Risk Analyst be scoped to read-only Q&A for MVP, or also trigger scenario simulations conversationally? 

- Which two frameworks should be prioritized for the MVP compliance demo — likely NIST CSF and ISO/IEC 27001, given judge familiarity? 

