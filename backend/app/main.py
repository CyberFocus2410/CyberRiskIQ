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

# In-memory working cache initialized from persistent seed
in_memory_state = {
    "org": copy.deepcopy(ORG_SEED),
    "assets": generate_assets_seed(),
    "findings": copy.deepcopy(FINDINGS_SEED),
    "simulated_controls": {
        "mfa": False, "patching": False, "edr": False,
        "segmentation": False, "monitoring": False, "backup": False
    },
    "simulated_exposure": {},
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
    source: str = "Manual Ingestion"
    severity: str = "Medium"
    cvss: float = 5.0
    exploit_available: bool = False
    internet_exposed: bool = False
    evidence: Optional[str] = ""
    control_state: Optional[str] = ""
    remediation: Optional[str] = ""
    poc_attached: bool = False

class ScenarioSimulateRequest(BaseModel):
    controls_override: Dict[str, bool] = {}
    exposure_override: Dict[str, Any] = {}

class OptimizationRequest(BaseModel):
    budget: Optional[float] = None
    locked_in: List[str] = []
    locked_out: List[str] = []

class AIQueryRequest(BaseModel):
    query: str


# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CyberRiskIQ Platform Engine",
        "timestamp": datetime.utcnow().isoformat()
    }

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
    
    # Audit log
    in_memory_state["audit_logs"].insert(0, {
        "id": f"AUD-{datetime.utcnow().strftime('%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat(),
        "user": "operator@finsecure.bank",
        "action": "ASSET_CREATED",
        "entity": new_id,
        "details": f"Created asset {req.name} ({new_id})"
    })
    return asset_dict

@app.get("/api/v1/findings")
def list_findings():
    return in_memory_state["findings"]

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

    # Audit log
    in_memory_state["audit_logs"].insert(0, {
        "id": f"AUD-{datetime.utcnow().strftime('%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat(),
        "user": "operator@finsecure.bank",
        "action": "FINDING_INGESTED",
        "entity": new_id,
        "details": f"Ingested {req.vulnerability} on {req.asset_id}"
    })
    return finding_dict

@app.post("/api/v1/scenarios/simulate")
def run_scenario(req: ScenarioSimulateRequest):
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

@app.get("/api/v1/compliance")
def get_compliance():
    assets = in_memory_state["assets"]
    sim_ctrls = in_memory_state["simulated_controls"]
    return calculate_framework_posture(assets, sim_ctrls)

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

@app.get("/api/v1/audit-logs")
def get_audit_logs():
    return in_memory_state["audit_logs"]
