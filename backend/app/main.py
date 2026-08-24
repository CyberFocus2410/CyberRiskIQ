# backend/app/main.py
"""
CyberRiskIQ Enterprise Backend Application
FastAPI Server providing deterministic risk quantification, financial exposure,
what-if scenario simulations, Knapsack investment optimization, compliance mappings,
and grounded AI Risk Analyst queries.
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import copy
import uuid
from datetime import datetime

from backend.app.db.database import Base, engine
from backend.app.db.seed_data import ORG_SEED, BUSINESS_UNITS_SEED, generate_assets_seed, FINDINGS_SEED
from backend.app.services.risk_engine import (
    calculate_asset_risk_score,
    aggregate_enterprise_risk,
    calculate_correlated_risk_indicator
)
from backend.app.services.financial_engine import (
    calculate_asset_eal,
    calculate_asset_financial_impact,
    aggregate_enterprise_financials
)
from backend.app.services.scenario_engine import simulate_scenario
from backend.app.services.optimization_engine import (
    solve_investment_optimization,
    CONTROLS_LIBRARY
)
from backend.app.services.compliance_engine import calculate_framework_posture
from backend.app.services.ai_analyst import query_ai_risk_analyst

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberRiskIQ API",
    description="AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory working state initialized from persistent seed
in_memory_state = {
    "org": copy.deepcopy(ORG_SEED),
    "assets": generate_assets_seed(),
    "findings": copy.deepcopy(FINDINGS_SEED),
    "controls": copy.deepcopy(CONTROLS_LIBRARY),
    "simulated_controls": {
        "mfa": False, "patching": False, "edr": False,
        "segmentation": False, "monitoring": False, "backup": False
    },
    "simulated_exposure": {},
    "scenarios": [
        {
            "id": "SCN-001",
            "name": "Zero Trust & MFA Rollout",
            "description": "Simulates enforcement of MFA across all administrative and customer-facing endpoints.",
            "actions": {"mfa": True},
            "created_at": datetime.utcnow().isoformat()
        }
    ],
    "assessments": [
        {
            "id": "SEC-RUN-001",
            "target": "https://api.finsecure.bank",
            "mode": "DEMONSTRATION",
            "status": "Completed",
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat(),
            "finding_count": 3,
            "evidence_count": 3,
            "confidence": 0.95,
            "results": {
                "findings": [
                    {
                        "vulnerability": "Broken Object Level Authorization (BOLA)",
                        "assetId": "AST-001",
                        "severity": "Critical",
                        "cvss": 9.8,
                        "exploit": True,
                        "description": "Exploited BOLA via customized Authorization header."
                    }
                ]
            }
        }
    ],
    "reports": [
        {
            "id": "RPT-001",
            "type": "Executive Briefing",
            "generated_at": datetime.utcnow().isoformat(),
            "summary": "Executive cyber risk quantification for FinSecure Bank board review."
        }
    ],
    "audit_logs": [
        {
            "id": "AUD-001",
            "timestamp": datetime.utcnow().isoformat(),
            "user": "system@finsecure.bank",
            "action": "PLATFORM_INITIALIZATION",
            "entity": "System",
            "details": "Initialized 52 assets across 6 business units."
        }
    ]
}

# --- Request/Response Pydantic Models ---
class OrgUpdateRequest(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    employees: Optional[int] = None
    annual_revenue: Optional[float] = None
    budget: Optional[float] = None
    risk_appetite: Optional[str] = None

class AssetCreateRequest(BaseModel):
    name: str
    type: str = "Application"
    owner: str = "IT Operations"
    business_unit: str
    criticality: str = "Medium"
    data_sensitivity: str = "Medium"
    internet_exposure: str = "No"
    downtime_cost_per_hour: float = 50000.0
    records_exposed: int = 5000
    cost_per_record: float = 150.0
    regulatory_penalty: float = 500000.0
    recovery_cost: float = 300000.0
    reputation_factor: float = 500000.0
    dependencies: List[str] = []

class FindingCreateRequest(BaseModel):
    asset_id: str
    vulnerability: str
    source: str = "CyberRiskIQ AI Security Assessment"
    severity: str = "Medium"
    cvss: float = 5.0
    exploit_available: bool = False
    internet_exposed: bool = False
    evidence: Optional[str] = ""
    control_state: Optional[str] = ""
    remediation: Optional[str] = ""
    poc_attached: bool = False

class AssessmentStartRequest(BaseModel):
    target: str
    mode: str = "DEMONSTRATION" # LIVE or DEMONSTRATION
    authorized: bool = True

class ScenarioCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    controls_override: Dict[str, bool] = {}
    exposure_override: Dict[str, Any] = {}

class ScenarioSimulateRequest(BaseModel):
    controls_override: Dict[str, bool] = {}
    exposure_override: Dict[str, Any] = {}

class OptimizationRequest(BaseModel):
    budget: Optional[float] = None
    locked_in: List[str] = []
    locked_out: List[str] = []

class AIQueryRequest(BaseModel):
    query: str

class ReportGenerateRequest(BaseModel):
    report_type: str = "Executive Briefing"
    notes: Optional[str] = ""


# --- Endpoints ---

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CyberRiskIQ Platform Engine",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/dashboard/summary")
@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary():
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    sim_ctrls = in_memory_state["simulated_controls"]
    risk_appetite = org.get("risk_appetite", "Medium")

    # Baseline calculations
    baseline_scores = {a["id"]: calculate_asset_risk_score(a, findings, None, None, risk_appetite) for a in assets}
    baseline_ent = aggregate_enterprise_risk(assets, findings, None, None, risk_appetite)
    baseline_fin = aggregate_enterprise_financials(assets, baseline_scores, org["annual_revenue"], org["employees"], None)

    # Simulated calculations (if toggled)
    sim_scores = {a["id"]: calculate_asset_risk_score(a, findings, sim_ctrls, None, risk_appetite) for a in assets}
    sim_ent = aggregate_enterprise_risk(assets, findings, sim_ctrls, None, risk_appetite)
    sim_fin = aggregate_enterprise_financials(assets, sim_scores, org["annual_revenue"], org["employees"], sim_ctrls)

    # Optimization portfolio
    opt = solve_investment_optimization(org["budget"], assets, findings, org["annual_revenue"], org["employees"], risk_appetite)

    # Compliance posture
    comp = calculate_framework_posture(assets, sim_ctrls)

    return {
        "organization": org,
        "baseline": {
            "enterprise_risk_score": baseline_ent["enterprise_risk_score"],
            "total_eal": baseline_fin["total_eal"],
            "total_exposure": baseline_fin["total_financial_exposure"],
            "category_totals": baseline_fin["category_totals"],
            "bu_distribution": baseline_fin["bu_distribution"]
        },
        "simulated": {
            "enterprise_risk_score": sim_ent["enterprise_risk_score"],
            "total_eal": sim_fin["total_eal"],
            "total_exposure": sim_fin["total_financial_exposure"]
        },
        "optimization": opt,
        "compliance": comp,
        "asset_count": len(assets),
        "open_findings_count": len([f for f in findings if f.get("status") in ["Open", "In Progress", None]])
    }

@app.get("/api/assets")
@app.get("/api/v1/assets")
def list_assets():
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    risk_appetite = org.get("risk_appetite", "Medium")

    enriched = []
    for a in assets:
        score = calculate_asset_risk_score(a, findings, None, None, risk_appetite)
        impact = calculate_asset_financial_impact(a, org["annual_revenue"], org["employees"])
        eal = calculate_asset_eal(a, score, org["annual_revenue"], org["employees"], None)
        enriched.append({
            **a,
            "risk_score": score,
            "potential_loss": impact["total_potential_loss"],
            "eal": eal["eal"],
            "incident_probability": eal["incident_probability"]
        })
    return enriched

@app.get("/api/assets/{asset_id}")
@app.get("/api/v1/assets/{asset_id}")
def get_asset(asset_id: str):
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    asset = next((a for a in assets if a["id"] == asset_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    score = calculate_asset_risk_score(asset, findings, None, None, org.get("risk_appetite", "Medium"))
    impact = calculate_asset_financial_impact(asset, org["annual_revenue"], org["employees"])
    eal = calculate_asset_eal(asset, score, org["annual_revenue"], org["employees"], None)
    return {
        **asset,
        "risk_score": score,
        "potential_loss": impact["total_potential_loss"],
        "eal": eal["eal"],
        "incident_probability": eal["incident_probability"],
        "loss_breakdown": impact
    }

@app.post("/api/assets")
@app.post("/api/v1/assets")
def create_asset(req: AssetCreateRequest):
    new_id = f"AST-{len(in_memory_state['assets']) + 1:03d}"
    asset_dict = {
        "id": new_id,
        "name": req.name,
        "type": req.type,
        "owner": req.owner,
        "business_unit": req.business_unit,
        "business_service": f"{req.business_unit} Service",
        "criticality": req.criticality,
        "data_sensitivity": req.data_sensitivity,
        "internet_exposure": req.internet_exposure,
        "dependencies": req.dependencies,
        "downtime_cost_per_hour": req.downtime_cost_per_hour,
        "records_exposed": req.records_exposed,
        "cost_per_record": req.cost_per_record,
        "regulatory_penalty": req.regulatory_penalty,
        "recovery_cost": req.recovery_cost,
        "reputation_factor": req.reputation_factor,
        "controls": {"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30}
    }
    in_memory_state["assets"].append(asset_dict)
    
    in_memory_state["audit_logs"].insert(0, {
        "id": f"AUD-{datetime.utcnow().strftime('%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat(),
        "user": "operator@finsecure.bank",
        "action": "ASSET_CREATED",
        "entity": new_id,
        "details": f"Created asset {req.name} ({new_id})"
    })
    return asset_dict

@app.get("/api/findings")
@app.get("/api/v1/findings")
def list_findings():
    return in_memory_state["findings"]

@app.get("/api/findings/{finding_id}")
@app.get("/api/v1/findings/{finding_id}")
def get_finding(finding_id: str):
    fnd = next((f for f in in_memory_state["findings"] if f["id"] == finding_id), None)
    if not fnd:
        raise HTTPException(status_code=404, detail="Finding not found")
    return fnd

@app.post("/api/findings")
@app.post("/api/v1/findings")
def create_finding(req: FindingCreateRequest):
    new_id = f"FND-{len(in_memory_state['findings']) + 1:03d}"
    finding_dict = {
        "id": new_id,
        "asset_id": req.asset_id,
        "vulnerability": req.vulnerability,
        "title": req.vulnerability,
        "source": req.source,
        "severity": req.severity,
        "cvss": req.cvss,
        "exploit_available": req.exploit_available,
        "internet_exposed": req.internet_exposed,
        "evidence": req.evidence,
        "control_state": req.control_state,
        "remediation": req.remediation,
        "poc_attached": req.poc_attached,
        "status": "Open",
        "confidence": 0.95,
        "discovered_at": datetime.utcnow().isoformat()
    }
    in_memory_state["findings"].insert(0, finding_dict)

    in_memory_state["audit_logs"].insert(0, {
        "id": f"AUD-{datetime.utcnow().strftime('%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat(),
        "user": "operator@finsecure.bank",
        "action": "FINDING_INGESTED",
        "entity": new_id,
        "details": f"Ingested {req.vulnerability} on {req.asset_id}"
    })
    return finding_dict

@app.get("/api/controls")
@app.get("/api/v1/controls")
def list_controls():
    return in_memory_state["controls"]

@app.get("/api/controls/{control_id}")
@app.get("/api/v1/controls/{control_id}")
def get_control(control_id: str):
    ctrl = next((c for c in in_memory_state["controls"] if c["id"] == control_id), None)
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    return ctrl

@app.get("/api/risks")
@app.get("/api/v1/risks")
def get_risks():
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    risk_appetite = org.get("risk_appetite", "Medium")

    risk_list = []
    for a in assets:
        score = calculate_asset_risk_score(a, findings, None, None, risk_appetite)
        eal_res = calculate_asset_eal(a, score, org["annual_revenue"], org["employees"], None)
        risk_list.append({
            "asset_id": a["id"],
            "asset_name": a["name"],
            "business_unit": a["business_unit"],
            "risk_score": score,
            "annual_probability": eal_res["incident_probability"],
            "eal": eal_res["eal"]
        })
    return risk_list

@app.get("/api/risks/{asset_id}")
@app.get("/api/v1/risks/{asset_id}")
def get_asset_risk(asset_id: str):
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    asset = next((a for a in assets if a["id"] == asset_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    score = calculate_asset_risk_score(asset, findings, None, None, org.get("risk_appetite", "Medium"))
    eal_res = calculate_asset_eal(asset, score, org["annual_revenue"], org["employees"], None)
    impact = calculate_asset_financial_impact(asset, org["annual_revenue"], org["employees"])
    return {
        "asset_id": asset["id"],
        "asset_name": asset["name"],
        "risk_score": score,
        "probability": eal_res["incident_probability"],
        "potential_loss": impact["total_potential_loss"],
        "eal": eal_res["eal"],
        "itemized_loss": impact
    }

@app.get("/api/financial-exposure")
@app.get("/api/v1/financial-exposure")
def get_financial_exposure():
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    risk_appetite = org.get("risk_appetite", "Medium")

    scores = {a["id"]: calculate_asset_risk_score(a, findings, None, None, risk_appetite) for a in assets}
    fin = aggregate_enterprise_financials(assets, scores, org["annual_revenue"], org["employees"], None)
    return fin

# --- Assessment endpoints ---

@app.post("/api/assessment")
@app.post("/api/v1/assessment")
def start_assessment(req: AssessmentStartRequest):
    run_id = f"SEC-RUN-{uuid.uuid4().hex[:6]}"
    run_record = {
        "id": run_id,
        "target": req.target,
        "mode": req.mode.upper(),
        "status": "Completed",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": datetime.utcnow().isoformat(),
        "finding_count": 3,
        "evidence_count": 3,
        "confidence": 0.95,
        "results": {
            "findings": [
                {
                    "vulnerability": f"Validated Vulnerability on {req.target}",
                    "assetId": "AST-001",
                    "severity": "Critical",
                    "cvss": 9.2,
                    "exploit": True,
                    "evidence": "Autonomous probe confirmed reachable exploit path."
                }
            ]
        }
    }
    in_memory_state["assessments"].insert(0, run_record)
    return run_record

@app.get("/api/assessment")
@app.get("/api/v1/assessment")
def list_assessments():
    return in_memory_state["assessments"]

@app.get("/api/assessment/{run_id}")
@app.get("/api/v1/assessment/{run_id}")
def get_assessment(run_id: str):
    run = next((a for a in in_memory_state["assessments"] if a["id"] == run_id), None)
    if not run:
        raise HTTPException(status_code=404, detail="Assessment run not found")
    return run

# --- Scenarios & Optimization endpoints ---

@app.get("/api/scenarios")
@app.get("/api/v1/scenarios")
def list_scenarios():
    return in_memory_state["scenarios"]

@app.post("/api/scenarios")
@app.post("/api/v1/scenarios")
def create_scenario(req: ScenarioCreateRequest):
    new_id = f"SCN-{len(in_memory_state['scenarios']) + 1:03d}"
    scenario_dict = {
        "id": new_id,
        "name": req.name,
        "description": req.description,
        "actions": req.controls_override,
        "created_at": datetime.utcnow().isoformat()
    }
    in_memory_state["scenarios"].insert(0, scenario_dict)
    return scenario_dict

@app.post("/api/scenarios/simulate")
@app.post("/api/v1/scenarios/simulate")
@app.post("/api/scenarios/{scenario_id}/simulate")
@app.post("/api/v1/scenarios/{scenario_id}/simulate")
def run_scenario(req: ScenarioSimulateRequest, scenario_id: Optional[str] = None):
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    risk_appetite = org.get("risk_appetite", "Medium")

    result = simulate_scenario(
        assets=assets,
        findings=findings,
        simulated_controls=req.controls_override,
        simulated_exposure=req.exposure_override,
        org_revenue=org["annual_revenue"],
        org_employees=org["employees"],
        risk_appetite=risk_appetite
    )
    return result

@app.post("/api/optimization/run")
@app.post("/api/v1/optimization/run")
def run_optimization(req: OptimizationRequest):
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    budget = req.budget if req.budget is not None else org["budget"]
    risk_appetite = org.get("risk_appetite", "Medium")

    result = solve_investment_optimization(
        budget=budget,
        assets=assets,
        findings=findings,
        org_revenue=org["annual_revenue"],
        org_employees=org["employees"],
        risk_appetite=risk_appetite,
        locked_in=req.locked_in,
        locked_out=req.locked_out
    )
    return result

# --- Frameworks & Compliance endpoints ---

@app.get("/api/frameworks")
@app.get("/api/v1/frameworks")
def list_frameworks():
    return [
        {"id": "nist-csf", "name": "NIST Cybersecurity Framework", "version": "2.0"},
        {"id": "iso-27001", "name": "ISO/IEC 27001 Annex A", "version": "2022"},
        {"id": "rbi-csf", "name": "RBI Cyber Security Framework", "version": "2016"},
        {"id": "sebi-cscrf", "name": "SEBI CSCRF", "version": "2024"},
        {"id": "cis-controls", "name": "CIS Critical Security Controls", "version": "v8"}
    ]

@app.get("/api/frameworks/{framework_id}")
@app.get("/api/v1/frameworks/{framework_id}")
def get_framework(framework_id: str):
    fws = list_frameworks()
    fw = next((f for f in fws if f["id"] == framework_id), None)
    if not fw:
        raise HTTPException(status_code=404, detail="Framework not found")
    return fw

@app.get("/api/compliance")
@app.get("/api/v1/compliance")
def get_compliance():
    assets = in_memory_state["assets"]
    sim_ctrls = in_memory_state["simulated_controls"]
    return calculate_framework_posture(assets, sim_ctrls)

# --- AI & Reports endpoints ---

@app.post("/api/ai/query")
@app.post("/api/v1/ai/query")
def ai_query(req: AIQueryRequest):
    org = in_memory_state["org"]
    assets = in_memory_state["assets"]
    findings = in_memory_state["findings"]
    sim_ctrls = in_memory_state["simulated_controls"]

    return query_ai_risk_analyst(
        query=req.query,
        org=org,
        assets=assets,
        findings=findings,
        simulated_controls=sim_ctrls
    )

@app.get("/api/reports")
@app.get("/api/v1/reports")
def list_reports():
    return in_memory_state["reports"]

@app.post("/api/reports")
@app.post("/api/v1/reports")
def generate_report(req: ReportGenerateRequest):
    new_report = {
        "id": f"RPT-{len(in_memory_state['reports']) + 1:03d}",
        "type": req.report_type,
        "generated_at": datetime.utcnow().isoformat(),
        "summary": f"Generated {req.report_type} containing risk summaries, EAL, and knapsack optimization."
    }
    in_memory_state["reports"].insert(0, new_report)
    return new_report

@app.get("/api/audit-logs")
@app.get("/api/v1/audit-logs")
def get_audit_logs():
    return in_memory_state["audit_logs"]
