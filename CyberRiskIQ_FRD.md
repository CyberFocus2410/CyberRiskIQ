## **FUNCTIONAL REQUIREMENTS DOCUMENT** 

**CyberRiskIQ** _AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform_ 

Version 1.0  |  Draft for Review Companion to CyberRiskIQ_PRD.docx 

# 1. Purpose & Scope 

This Functional Requirements Document (FRD) specifies the exact functional behavior, inputs, outputs, business rules, and data schema for each module of CyberRiskIQ, as scoped in the companion PRD (Section 6). It is written at a level sufficient for engineering to build the MVP's 10 screens and underlying risk engine. 

# 2. System Modules Overview 

|**Module**|**Corresponding Workflow Step(s)**|
|---|---|
|FR-1 Organization Setup|Step 1|
|FR-2 Asset Inventory & Dependency Map|Step 2|
|FR-3 Security Data Ingestion|Step 3|
|FR-4 Data Normalization Engine|Step 4|
|FR-5 Threat & Vulnerability Correlation|Step 5|
|FR-6 Asset Criticality & Business Impact Model|Step 6|
|FR-7 Control Effectiveness Evaluation|Step 7|
|FR-8 Continuous Risk Quantification Engine|Step 8|
|FR-9 Financial Loss Estimation (EAL)|Step 9|
|FR-10 Enterprise Risk Roll-Up|Step 9 (aggregation)|
|FR-11 AI Risk Analyst|Step 10|
|FR-12 AI Mitigation Recommendations|Step 11|
|FR-13 What-if Scenario Simulator|Step 12|
|FR-14 Security Investment Optimizer|Step 13|
|FR-15 Investment vs Risk Reduction Curve|Step 13 (visualization)|
|FR-16 Compliance & Framework Mapping|Step 14|
|FR-17 Reporting Engine|Step 15|
|FR-18 Strix Integration Connector|Cross-cutting (Step 3 / evidence source)|



# 3. Detailed Functional Requirements 

### FR-1 Organization Setup 

_Creates the workspace and organizational profile that all downstream financial-risk calculations reference._ 

#### Inputs 

- Organization Name 

- Industry 

- Number of Employees 

- Annual Revenue (₹) 

- Geography 

- Regulatory Environment 

- Business Units (one or more) 

- Risk Appetite (Low / Medium-Low / Medium / Medium-High / High) 

- Security Budget (₹) 

#### Functional Behavior 

- System creates a workspace record on submission and redirects to Asset Inventory setup. 

- Business Units entered here become selectable dimensions throughout the platform (asset tagging, risk roll-up, reporting). 

#### Outputs / UI Elements 

- Organization profile card, editable from Settings at any time. 

- Confirmation state showing workspace successfully created. 

#### Business Rules / Validation 

- Organization Name, Industry, Annual Revenue, and Security Budget are mandatory. 

- Annual Revenue and Security Budget must be positive numeric values. 

- At least one Business Unit must be defined before Asset Inventory can be accessed. 

### FR-2 Asset Inventory & Dependency Map 

_Builds the centralized, dependency-aware register of everything that can carry risk._ 

#### Inputs 

- Manual entry or bulk CSV/JSON import of assets: applications, APIs, databases, servers, endpoints, cloud resources, network devices, identities, business services. 

#### Functional Behavior 

- Each asset record stores: Asset ID (system-generated), Name, Type, Owner, Business Unit, Criticality (Low/Medium/High/Critical), Data Sensitivity, Internet Exposure (Yes/No), Dependencies (list of other Asset IDs), Business Service. 

- Dependency edges render as a graph (asset → dependency → business service) so an analyst can trace blast radius from any single asset. 

- Assets can be grouped/filtered by Business Unit, Criticality, or Internet Exposure. 

#### Outputs / UI Elements 

- Asset Inventory table view (sortable/filterable). 

- Dependency Map graph view. 

- Asset detail panel showing linked findings once ingestion has run. 

#### Business Rules / Validation 

- Asset ID is immutable once generated. 

- An asset marked Internet Exposure = Yes and Criticality = Critical is flagged for priority review in the Executive Dashboard. 

- Circular dependencies must be detected and rejected on save. 

### FR-3 Security Data Ingestion 

_Accepts security telemetry from multiple sources and stages it for normalization._ 

#### Inputs 

- MVP: CSV upload, JSON upload, REST API push, Strix output (see FR-18), built-in Demo Data Generator. 

- Future (out of MVP scope): Nessus, Qualys, Tenable, Splunk, Microsoft Sentinel, Elastic, Microsoft Defender, CrowdStrike, Azure AD/Entra, Okta, AWS/Azure/GCP, CVE feeds, CISA KEV. 

#### Functional Behavior 

- Each upload/API push is logged as an Ingestion Batch with source, timestamp, record count, and status (Success / Partial / Failed). 

- Failed rows are quarantined with a reason code and surfaced to the user rather than silently dropped. 

- The Demo Data Generator produces a realistic synthetic dataset spanning multiple assets, severities, and business units for MVP demonstration. 

#### Outputs / UI Elements 

- Ingestion Batch history log. 

- Per-batch success/failure/quarantine counts. 

- Quarantined-record review screen with reason codes. 

#### Business Rules / Validation 

- Only CSV/JSON files under a defined size limit are accepted in MVP (system default: 25 MB). 

- Every ingested record must map to an existing or auto-created Asset ID; unmappable records are quarantined. 

### FR-4 Data Normalization Engine 

_Maps every ingested source into one common internal Finding schema so downstream modules never need sourcespecific logic._ 

#### Inputs 

- Raw records from FR-3 (any accepted source format). 

#### Functional Behavior 

- Each raw record is transformed into the canonical Finding object (see schema below). 

- Source-specific severity/CVSS scales are mapped to a common internal severity scale. 

- Duplicate findings (same vulnerability + same asset + open status) from multiple sources are merged into one Finding with multiple source references, not duplicated. 

#### Outputs / UI Elements 

- Normalized Finding records available to FR-5 onward. 

- Normalization audit trail showing source → canonical field mapping used. 

#### Canonical Finding Schema 

Finding ├── finding_id ├── source ├── asset_id ├── vulnerability ├── severity ├── cvss ├── exploitability ├── exploit_available ├── internet_exposed ├── evidence ├── control_state ├── discovered_at └── status 

### FR-5 Threat & Vulnerability Correlation 

_Ensures vulnerabilities are not treated as equally risky purely on CVSS score; correlates severity with real-world exploitability, exposure, and existing controls._ 

#### Inputs 

- Normalized Finding (FR-4) 

- Asset record incl. Internet Exposure, Dependencies (FR-2) 

- Control Effectiveness scores (FR-7) 

- Threat intelligence signals (exploit availability, known active exploitation) 

#### Functional Behavior 

- System computes a Correlated Risk Indicator per finding combining: CVSS, Exploitability, Exploit Available (bool), Internet Exposed (bool), Business Criticality (from FR-6), and Control State (from FR-7). 

- A finding with lower CVSS but higher real-world correlated risk (internet-exposed, actively exploited, weak controls, critical service) must rank above a higher-CVSS finding that is internal, unexploitable, and wellcontrolled. 

#### Outputs / UI Elements 

- Correlated Risk Indicator per finding, visible on the Findings screen alongside raw CVSS for comparison. 

- Sortable Findings table defaulting to Correlated Risk Indicator, not raw CVSS. 

#### Business Rules / Validation 

- Correlation logic must be inspectable — the UI must show which factors drove a finding's correlated rank, not just the final number (supports the AI Analyst's explanations in FR-11). 

### FR-6 Asset Criticality & Business Impact Modeling 

_Quantifies, per asset/business service, the monetary consequence of an incident across five impact categories._ 

#### Inputs 

- Availability: Downtime cost/hour 

- Data: Records exposed, Data sensitivity, Cost per record 

- Regulatory: Potential penalty, Legal cost, Notification cost 

- Recovery: Incident response cost, Forensics cost, Restoration cost, Engineering effort 

- Reputation: Configurable qualitative-to-monetary factor 

#### Functional Behavior 

- Values are user-entered/configurable per asset or business service, not derived automatically — the system must present these as estimated monetary factors, not claimed-precise measurements. 

- A default benchmark library (editable) is provided so users are not required to estimate every field from zero. 

#### Outputs / UI Elements 

- Business Impact worksheet per asset/business service. 

- Aggregated impact-by-category breakdown feeding FR-9. 

#### Business Rules / Validation 

- All monetary fields must be non-negative. 

- At least Downtime Cost/Hour and Cost per Record must be set before an asset can contribute to EAL calculation; otherwise the asset is flagged 'Impact Not Configured' and excluded from EAL roll-up with a visible warning. 

### FR-7 Control Effectiveness Evaluation 

_Scores how effectively each security control is actually operating for a given asset, based on evidence rather than checkbox compliance._ 

#### Inputs 

- Per-asset control list (e.g., MFA, Patch Management, EDR, Network Segmentation, Monitoring, Backup) 

- Supporting evidence: configuration data, telemetry, incident history, compliance status, evidence freshness timestamp 

#### Functional Behavior 

- Each control receives an effectiveness percentage (0–100%) per asset. 

- An overall Control Effectiveness Score is computed per asset as a weighted function of individual control scores. 

- Evidence older than a configurable freshness threshold (default 90 days) visually flags the control score as stale. 

#### Outputs / UI Elements 

- Control Effectiveness panel per asset (e.g., MFA 20%, Patch Management 65%, EDR 80%, Segmentation 30%, Monitoring 70%, Backup 95%). 

- Overall effectiveness score per asset. 

#### Business Rules / Validation 

- A control with no evidence at all defaults to 0% effectiveness rather than being omitted from the score. 

### FR-8 Continuous Risk Quantification Engine 

_The core engine: computes a normalized 0–100 risk score per finding/asset, continuously, as new telemetry arrives._ 

#### Inputs 

- Correlated Risk Indicator (FR-5) 

- Business Impact (FR-6) 

- Control Effectiveness (FR-7) 

- Asset Criticality (FR-2) 

#### Functional Behavior 

- Risk = Threat Likelihood × Business Impact × Exposure × Asset Criticality × Control Gap, normalized to a 0– 100 Risk Score. 

- Recalculation is triggered automatically on: new/updated finding, new ingestion batch, control effectiveness change, or asset criticality change — not on a manual/periodic schedule only. 

- Risk Score history is retained to support trend reporting. 

#### Outputs / UI Elements 

- Risk Score (0–100) per asset and per business service, with a trend sparkline. 

- Recalculation timestamp visible on every risk figure so staleness is never ambiguous. 

#### Business Rules / Validation 

- Risk Score must recalculate within the same user session when any contributing input changes (supports FR-13 Scenario Simulator). 

### FR-9 Financial Loss Estimation (Expected Annual Loss) 

_Converts the normalized risk score into a currency-denominated annual loss expectancy._ 

#### Inputs 

- Risk Score (FR-8) 

- Business Impact monetary factors (FR-6) 

#### Functional Behavior 

- EAL = Probability of Incident × Financial Impact. 

- Probability of Incident is derived from the Risk Score via a configurable mapping (documented and adjustable by an admin, not a hard-coded black box). 

- Example: Probability = 18%, Loss = 1.7 Cr → EAL = 30.6 Lakh/year.₹ ₹ 

#### Outputs / UI Elements 

- EAL figure per asset, business service, business unit, and enterprise-wide. 

- EAL breakdown showing Probability × Impact so the figure is never presented as an unexplained number. 

#### Business Rules / Validation 

- EAL must always be traceable, in the UI, back to the Risk Score and Business Impact inputs that produced it. 

### FR-10 Enterprise Risk Roll-Up 

_Aggregates risk and EAL upward through the organizational hierarchy for board-level reporting._ 

#### Inputs 

- Asset-level Risk Score and EAL (FR-8, FR-9) 

- Asset → Application → Business Service → Business Unit → Enterprise hierarchy (FR-2) 

#### Functional Behavior 

- Roll-up sums/aggregates EAL and computes a weighted enterprise Risk Score at each hierarchy level. 

- Example dashboard output: Enterprise Exposure 4.82 Cr, Expected Annual Loss 1.31 Cr, Risk Score 71/100.₹ ₹ 

#### Outputs / UI Elements 

- Executive Risk Dashboard summary tiles. 

- Drill-down navigation from Enterprise → Business Unit → Business Service → Asset → Finding. 

#### Business Rules / Validation 

- Roll-up must recompute automatically whenever any contributing asset's Risk Score or EAL changes. 

### FR-11 AI Risk Analyst 

_A conversational interface grounded in the platform's structured risk data — not a generic chatbot._ 

#### Inputs 

- Natural-language question from the user (e.g., "What is our biggest financial cyber risk?") 

- Structured risk data: Findings, Assets, EAL, Risk Score, Control Effectiveness 

#### Functional Behavior 

- System retrieves the relevant structured data for the query scope (e.g., top EAL contributor) and generates a natural-language answer citing specific figures and drivers. 

- Example: "Payment Infrastructure currently contributes approximately 31 lakh to Expected Annual Loss. The ₹ largest risk drivers are an internet-facing critical vulnerability, inadequate segmentation, and privileged accounts without MFA." 

- Every answer must be traceable to the underlying data it cites — no unsupported figures. 

#### Outputs / UI Elements 

- Chat-style Q&A panel accessible from the Executive Dashboard and Findings screen. 

- Suggested starter questions for first-time users. 

#### Business Rules / Validation 

- The AI Analyst must not fabricate figures; if underlying data is insufficient to answer, it must say so rather than guess. 

### FR-12 AI Mitigation Recommendations 

_Recommends specific actions ranked by financial value, not severity alone._ 

#### Inputs 

- Findings with correlated risk (FR-5) 

- Current control effectiveness (FR-7) 

- Cost estimates per candidate control action 

#### Functional Behavior 

- For each significant risk driver, the system proposes a mitigation action with an estimated Cost and estimated EAL Reduction. 

- Example table: Patch critical vulnerability 2.5L → 14L reduction; Enable MFA 1.2L → 9L; Network ₹ ₹ ₹ ₹ segmentation 4L → 11L; Enhanced monitoring 1L → 4L.₹ ₹ ₹ ₹ 

- Each recommendation includes a plain-language rationale referencing the specific factors driving it (feeds from FR-5's inspectable correlation). 

#### Outputs / UI Elements 

- Ranked Recommendations table (Recommendation / Cost / EAL Reduction) on the Findings and Executive Dashboard screens. 

- Rationale text per recommendation. 

#### Business Rules / Validation 

- Recommendations must be re-ranked automatically whenever underlying risk data changes. 

### FR-13 What-if Scenario Simulator 

_Lets a user modify the environment virtually and see the recalculated EAL/exposure before committing to any real change._ 

#### Inputs 

- Selection of a hypothetical change: e.g., enable a control organization-wide, delay a remediation by N days, change an asset's exposure state. 

#### Functional Behavior 

- System clones current state, applies the hypothetical change, and re-runs FR-8/FR-9/FR-10 in-memory without altering production data. 

- Before/after comparison is computed and displayed side-by-side. 

- Example 1: Enable MFA for all privileged accounts — EAL 1.31 Cr → 1.22 Cr (₹ ₹ ₹9L reduction). Example 2: Delay critical patch by 30 days — Exposure 4.82 Cr → 5.06 Cr (₹ ₹ ₹24L increase). 

#### Outputs / UI Elements 

- Before/After comparison cards (Risk Score, EAL, Enterprise Exposure). 

- 'Apply this scenario' action that, if confirmed, commits the change to production data (distinct from the simulation-only default). 

#### Business Rules / Validation 

- Simulated changes must never persist to production data unless the user explicitly confirms an 'Apply' action. 

- Multiple scenarios may be compared side-by-side in the same session. 

### FR-14 Security Investment Optimizer 

_Given a fixed budget, selects the combination of controls that maximizes annual risk reduction. The platform's signature capability._ 

#### Inputs 

- Available Budget (₹) 

- Candidate controls with cost and estimated EAL-reduction (from FR-12), e.g., MFA, EDR, Segmentation, Patch Management, SOC Monitoring, Backup, IAM/PAM, Cloud Security 

#### Functional Behavior 

- System solves a budget-constrained selection problem (knapsack-style: maximize total EAL reduction subject to sum of selected control costs ≤ budget). 

- Example output: Recommended Portfolio — MFA 4L, Patch Program 5L, Segmentation 8L, EDR 7L; ₹ ₹ ₹ ₹ Total 24L; Expected Risk Reduction 78L/year; ROSI 225%.₹ ₹ 

- ROSI = (EAL Reduction − Investment Cost) / Investment Cost × 100%. 

#### Outputs / UI Elements 

- Recommended Portfolio table (control, cost). 

- Total cost (must be ≤ entered budget), Expected Risk Reduction, ROSI %. 

- Option to manually override/lock specific controls in or out and re-solve. 

#### Business Rules / Validation 

- Optimizer output must never exceed the entered budget. 

- Optimizer must be deterministic/reproducible for the same inputs (supports FRD Section on success metrics in the PRD). 

### FR-15 Investment vs. Risk Reduction Curve 

_Visualizes the point of diminishing returns on security spend._ 

#### Inputs 

- Series of (cumulative investment, resulting risk level) points generated by incrementally solving FR-14 at increasing budget levels. 

#### Functional Behavior 

- System plots a curve of Risk (Y-axis, descending) vs. Investment (X-axis, ascending) and marks the 'Optimal Zone' where marginal risk reduction per rupee drops sharply. 

#### Outputs / UI Elements 

- Line/area chart with an annotated Optimal Zone region. 

- Tooltip on hover showing exact risk-reduction-per-rupee at that point. 

### FR-16 Compliance & Framework Mapping 

_Maps risks and controls to recognized frameworks as a derived view of the Risk → Control chain, not a disconnected module._ 

#### Inputs 

- Control Effectiveness data (FR-7) 

- Framework-to-control mapping reference tables: NIST CSF, ISO/IEC 27001, CIS Controls, RBI Cyber Security Framework, SEBI Cybersecurity and Cyber Resilience Framework 

#### Functional Behavior 

- System follows the chain Risk → Control → Framework → Compliance Gap → Financial Risk → Remediation, so every compliance gap is expressed with its associated  risk, and every control maps to the ₹ specific framework clauses it satisfies. 

- MVP ships with at least 2 frameworks fully mapped (recommended: NIST CSF, ISO/IEC 27001); remaining frameworks are stubbed for Phase 2. 

#### Outputs / UI Elements 

- Compliance Posture screen: per-framework coverage %, gap list, each gap linked to its financial risk figure. 

- Framework selector. 

#### Business Rules / Validation 

- A control cannot be marked 'compliant' for a framework clause without linked evidence (from FR-7). 

### FR-17 Reporting Engine 

_Generates role-specific, exportable reports from the shared underlying data model._ 

#### Inputs 

- Report type selection: Executive / Technical / Compliance 

- Date range / scope (business unit, all) 

#### Functional Behavior 

- Executive report: Enterprise cyber exposure, EAL, Top 10 risks, Top investment recommendations, ROSI, trend, compliance posture summary. 

- Technical report: Assets, Vulnerabilities, Findings, Attack paths, Controls, Remediation detail. 

- Compliance report: Framework, Control, Status, Evidence, Gap, Remediation. 

- All three report types are generated from the same data model — no report-specific data entry. 

#### Outputs / UI Elements 

- Report preview in-app. 

- Export to PDF (MVP); DOCX/PPTX export is a Phase 2 candidate. 

#### Business Rules / Validation 

- Every figure in a generated report must match the live dashboard figure for the same scope at generation time. 

### FR-18 Strix Integration Connector 

_Ingests validated, evidence-backed findings from Strix AI pentesting as a specific, higher-trust evidence source._ 

#### Inputs 

- Strix output for a target: local target, GitHub repository, web application, API, multiple targets, or CI/CD pipeline run. 

#### Functional Behavior 

- Flow: Target Application → Strix (Reconnaissance → AI Pentesting → Validated Finding → PoC/Evidence) → CyberRiskIQ Ingestion API (FR-3) → Risk Engine (FR-4 onward). 

- Findings sourced from Strix are tagged with an 'AI-Validated / PoC Evidence Attached' badge and are NOT rescored by raw scanner severity alone — the PoC evidence is factored into the Correlated Risk Indicator (FR-5) as a higher-confidence signal. 

- Strix is explicitly excluded from performing: enterprise financial loss calculation, EAL/VaR, investment optimization, asset criticality, board dashboards, budget allocation, compliance scoring, ROSI, and enterprise risk aggregation — these remain CyberRiskIQ's own computation (see PRD Section 7). 

#### Outputs / UI Elements 

- Strix-sourced findings visible in the Findings screen with source badge and linked PoC evidence. 

- Ingestion Batch log entry per Strix run (FR-3). 

#### Business Rules / Validation 

- A Strix finding without attached PoC evidence is treated as an unvalidated finding and follows the standard (non-boosted) correlation path. 

# 4. End-to-End User Journey (Master Flow) 

This is the master flow every module above must support without a break in the chain: 

LOGIN → CREATE ORGANIZATION → DEFINE BUSINESS UNITS → IMPORT/DISCOVER ASSETS → ASSIGN ASSET CRITICALITY → CONNECT SECURITY SOURCES → INGEST SECURITY TELEMETRY → RUN STRIX SECURITY ASSESSMENT → NORMALIZE FINDINGS → CORRELATE THREATS + VULNERABILITIES + ASSETS → EVALUATE CONTROL EFFECTIVENESS → CALCULATE INCIDENT LIKELIHOOD → CALCULATE BUSINESS IMPACT → CALCULATE EXPECTED ANNUAL LOSS → AGGREGATE ENTERPRISE 

RISK → IDENTIFY TOP RISK DRIVERS → AI ANALYST EXPLAINS RISKS → AI GENERATES MITIGATION OPTIONS → USER OPENS SCENARIO SIMULATOR → TESTS "WHAT IF?" CONDITIONS → USER ENTERS CYBERSECURITY BUDGET → INVESTMENT OPTIMIZER SELECTS BEST CONTROLS → CALCULATE ROSI → SHOW RISK VS INVESTMENT CURVE → MAP CONTROLS TO FRAMEWORKS → GENERATE EXECUTIVE / TECHNICAL / COMPLIANCE REPORT 

# 5. Screen-to-Module Traceability Matrix 

|**MVP Screen**|**Modules Used**|
|---|---|
|Login / Organization Setup|FR-1|
|Executive Risk Dashboard|FR-10, FR-11, FR-15|
|Asset Inventory & Dependency Map|FR-2|
|Security Findings / Strix Findings|FR-3, FR-4, FR-5, FR-18|
|Risk Quantification|FR-6, FR-7, FR-8|
|Financial Risk Analysis|FR-9, FR-10|
|AI Cyber Risk Analyst|FR-11|
|What-if Scenario Simulator|FR-13|
|Security Investment Optimizer|FR-14, FR-15|
|Compliance & Reports|FR-16, FR-17|



# 6. Non-Functional Requirements 

|**Category**|**Requirement**|
|---|---|
|Performance|Risk Score / EAL recalculation for a single asset change must complete within<br>the same user session (target: <3s for demo-scale data).|
|Auditability|Every EAL, Risk Score, and ROSI figure must be traceable to its contributing<br>findings and inputs — no black-box numbers.|
|Data Integrity|Scenario simulation (FR-13) must never mutate production data unless explicitly<br>applied.|
|Extensibility|Ingestion layer (FR-3/FR-4) must accept new source types via schema mapping<br>configuration, not code changes, to support Phase 2 connectors.|
|Usability|Each of the 5 personas (PRD Section 5) must find their priority data within 2<br>clicks of login.|
|Security|Ingested findings and PoC evidence (esp. from Strix) are sensitive security data<br>and must be access-controlled by role and business unit.|



# 7. Acceptance Criteria (MVP Demo) 

- A single seeded finding can be traced live, on-screen, through the full 11-node chain in PRD Section 12. 

- Enabling a control in the Scenario Simulator visibly reduces EAL by a plausible, formula-consistent amount. 

- Entering a budget in the Investment Optimizer returns a control portfolio whose total cost does not exceed the entered budget, with a computed ROSI. 

- At least one Strix-sourced finding is visible in the Findings screen with its PoC evidence badge and reflected in the Correlated Risk Indicator. 

- At least 2 compliance frameworks show coverage % derived from live control-effectiveness data, not static text. 

- Executive, Technical, and Compliance reports can each be generated and reflect the same underlying figures. 

# 8. Glossary 

|**Term**|**Definition**|
|---|---|
|EAL|Expected Annual Loss — Probability of Incident × Financial Impact|
|ROSI|Return on Security Investment — (EAL Reduction − Investment Cost) /<br>Investment Cost × 100%|
|Risk Score|Normalized 0–100 score = f(Threat Likelihood, Business Impact, Exposure,<br>Asset Criticality, Control Gap)|
|Correlated Risk Indicator|Finding-level risk rank combining CVSS with exploitability, exposure, criticality,<br>and control state|
|PoC|Proof of Concept — validated exploitation evidence attached to a Strix finding|



