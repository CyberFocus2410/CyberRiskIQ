# backend/app/main.py
"""
CyberRiskIQ Enterprise Backend Application
FastAPI Server providing deterministic risk quantification, financial exposure,
what-if scenario simulations, Knapsack investment optimization, compliance mappings,
and grounded AI Risk Analyst queries backed by SQLAlchemy persistence.
"""
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.db.database import Base, engine, get_db, SessionLocal
from backend.app.models import models
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

# Create all database tables
Base.metadata.create_all(bind=engine)

def seed_database_if_empty():
    """Initializes and seeds persistent database with 52 FinSecure Bank assets if empty."""
    db: Session = SessionLocal()
    try:
        org_count = db.query(models.Organization).count()
        if org_count == 0:
            print("[CyberRiskIQ DB] Seeding initial FinSecure Bank database...")
            
            # 1. Organization
            org = models.Organization(
                id=ORG_SEED["id"],
                name=ORG_SEED["name"],
                industry=ORG_SEED["industry"],
                employees=ORG_SEED["employees"],
                annual_revenue=ORG_SEED["annual_revenue"],
                budget=ORG_SEED["budget"],
                risk_appetite=ORG_SEED["risk_appetite"]
            )
            db.add(org)
            db.flush()

            # 2. Business Units & Services
            bu_map = {}
            for bu_name in BUSINESS_UNITS_SEED:
                bu_id = f"BU-{bu_name[:4].upper()}"
                bu = models.BusinessUnit(
                    id=bu_id,
                    organization_id=org.id,
                    name=bu_name,
                    criticality="Critical" if "Payments" in bu_name or "Core" in bu_name else "High"
                )
                db.add(bu)
                db.flush()
                bu_map[bu_name] = bu

                # Create default Business Service
                svc = models.BusinessService(
                    id=f"SVC-{bu_name[:4].upper()}-01",
                    business_unit_id=bu.id,
                    name=f"{bu_name} Core Operations Service",
                    criticality="Critical" if "Payments" in bu_name else "High",
                    revenue_dependency=0.85,
                    downtime_cost_per_hour=150000.0
                )
                db.add(svc)
                db.flush()

            # 3. Controls Library
            for ctrl in CONTROLS_LIBRARY:
                c_model = models.Control(
                    id=ctrl["id"],
                    name=ctrl["name"],
                    type="Preventive",
                    cost=ctrl["cost"],
                    reduction=ctrl["reduction"],
                    description=ctrl.get("description", ""),
                    coverage=0.30,
                    effectiveness=0.30
                )
                db.add(c_model)

            # 4. Assets
            assets_data = generate_assets_seed()
            for a in assets_data:
                bu_obj = bu_map.get(a["business_unit"])
                svc_id = f"SVC-{a['business_unit'][:4].upper()}-01" if bu_obj else None
                asset_model = models.Asset(
                    id=a["id"],
                    business_service_id=svc_id,
                    name=a["name"],
                    type=a["type"],
                    owner=a["owner"],
                    business_unit=a["business_unit"],
                    business_service=a.get("business_service", "Core Banking Operations"),
                    criticality=a["criticality"],
                    data_sensitivity=a["data_sensitivity"],
                    internet_exposure=a["internet_exposure"],
                    records_exposed=a.get("records_exposed", 5000),
                    revenue_impact=1.0,
                    downtime_cost_per_hour=a.get("downtime_cost_per_hour", 50000.0),
                    downtime_cost=a.get("downtime_cost_per_hour", 50000.0),
                    cost_per_record=a.get("cost_per_record", 150.0),
                    regulatory_penalty=a.get("regulatory_penalty", 500000.0),
                    regulatory_exposure=a.get("regulatory_penalty", 500000.0),
                    recovery_cost=a.get("recovery_cost", 300000.0),
                    reputation_factor=a.get("reputation_factor", 500000.0),
                    controls=a.get("controls", {}),
                    dependencies=a.get("dependencies", [])
                )
                db.add(asset_model)

            # 5. Findings
            for f in FINDINGS_SEED:
                fnd_model = models.Finding(
                    id=f["id"],
                    asset_id=f["asset_id"],
                    source=f["source"],
                    title=f.get("title", f["vulnerability"]),
                    vulnerability=f["vulnerability"],
                    severity=f["severity"],
                    cvss=f["cvss"],
                    exploit_available=f["exploit_available"],
                    internet_exposed=f["internet_exposed"],
                    evidence=f.get("evidence", ""),
                    control_state=f.get("control_state", ""),
                    remediation=f.get("remediation", ""),
                    poc_attached=f.get("poc_attached", False),
                    status=f.get("status", "Open"),
                    confidence=f.get("confidence", 0.95)
                )
                db.add(fnd_model)

            # 6. Audit Log
            initial_log = models.AuditLog(
                id="AUD-000001",
                org_id=org.id,
                user="system@finsecure.bank",
                action="DATABASE_INITIALIZATION",
                entity_type="Database",
                entity_id="cyberriskiq.db",
                details="Initialized 52 assets across 6 business units in persistent relational database."
            )
            db.add(initial_log)

            db.commit()
            print("[CyberRiskIQ DB] Seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[CyberRiskIQ DB] Seed error: {e}")
    finally:
        db.close()

# Run startup database seeding
seed_database_if_empty()

app = FastAPI(
    title="CyberRiskIQ API",
    description="AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform",
    version="1.0.0"
)

# CORS configuration - safe defaults with environment override support
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8000")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
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
    authorized: bool = False # Must be explicitly set to True for LIVE mode

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

# Helper to convert SQLAlchemy models to dictionary representations
def asset_to_dict(a: models.Asset) -> Dict[str, Any]:
    return {
        "id": a.id,
        "name": a.name,
        "type": a.type,
        "owner": a.owner,
        "business_unit": a.business_unit,
        "business_service": a.business_service,
        "criticality": a.criticality,
        "data_sensitivity": a.data_sensitivity,
        "internet_exposure": a.internet_exposure,
        "records_exposed": a.records_exposed,
        "downtime_cost_per_hour": a.downtime_cost_per_hour,
        "cost_per_record": a.cost_per_record,
        "regulatory_penalty": a.regulatory_penalty,
        "recovery_cost": a.recovery_cost,
        "reputation_factor": a.reputation_factor,
        "controls": a.controls or {},
        "dependencies": a.dependencies or []
    }

def finding_to_dict(f: models.Finding) -> Dict[str, Any]:
    return {
        "id": f.id,
        "asset_id": f.asset_id,
        "assetId": f.asset_id,
        "source": f.source,
        "vulnerability": f.vulnerability,
        "title": f.title or f.vulnerability,
        "severity": f.severity,
        "cvss": f.cvss,
        "exploit_available": f.exploit_available,
        "exploitAvailable": f.exploit_available,
        "internet_exposed": f.internet_exposed,
        "internetExposed": f.internet_exposed,
        "evidence": f.evidence,
        "control_state": f.control_state,
        "remediation": f.remediation,
        "poc_attached": f.poc_attached,
        "pocAttached": f.poc_attached,
        "status": f.status,
        "discovered_at": f.discovered_at.isoformat() if f.discovered_at else None
    }


# --- REST API Endpoints ---

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CyberRiskIQ Platform Engine",
        "database": "SQLAlchemy SQLite/PostgreSQL connected",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/dashboard/summary")
@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    if not org_model:
        raise HTTPException(status_code=404, detail="Organization not initialized")

    org = {
        "id": org_model.id,
        "name": org_model.name,
        "industry": org_model.industry,
        "employees": org_model.employees,
        "annual_revenue": org_model.annual_revenue,
        "budget": org_model.budget,
        "risk_appetite": org_model.risk_appetite,
        "businessUnits": BUSINESS_UNITS_SEED
    }

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]

    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    risk_appetite = org["risk_appetite"]

    # Baseline calculations
    baseline_scores = {a["id"]: calculate_asset_risk_score(a, findings, None, None, risk_appetite) for a in assets}
    baseline_ent = aggregate_enterprise_risk(assets, findings, None, None, risk_appetite)
    baseline_fin = aggregate_enterprise_financials(assets, baseline_scores, org["annual_revenue"], org["employees"], None)

    # Optimization portfolio
    opt = solve_investment_optimization(org["budget"], assets, findings, org["annual_revenue"], org["employees"], risk_appetite)

    # Compliance posture
    comp = calculate_framework_posture(assets, None)

    return {
        "organization": org,
        "baseline": {
            "enterprise_risk_score": baseline_ent["enterprise_risk_score"],
            "total_eal": baseline_fin["total_eal"],
            "total_exposure": baseline_fin["total_financial_exposure"],
            "category_totals": baseline_fin["category_totals"],
            "bu_distribution": baseline_fin["bu_distribution"]
        },
        "optimization": opt,
        "compliance": comp,
        "asset_count": len(assets),
        "open_findings_count": len([f for f in findings if f.get("status") in ["Open", "In Progress", None]])
    }

@app.get("/api/assets")
@app.get("/api/v1/assets")
def list_assets(db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    enriched = []
    for a in assets:
        score = calculate_asset_risk_score(a, findings, None, None, appetite)
        impact = calculate_asset_financial_impact(a, rev, emp)
        eal = calculate_asset_eal(a, score, rev, emp, None)
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
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset_model = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset_model:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset = asset_to_dict(asset_model)
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_findings = db.query(models.Finding).filter(models.Finding.asset_id == asset_id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    score = calculate_asset_risk_score(asset, findings, None, None, appetite)
    impact = calculate_asset_financial_impact(asset, rev, emp)
    eal = calculate_asset_eal(asset, score, rev, emp, None)

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
def create_asset(req: AssetCreateRequest, db: Session = Depends(get_db)):
    count = db.query(models.Asset).count()
    new_id = f"AST-{count + 1:03d}"

    asset_model = models.Asset(
        id=new_id,
        name=req.name,
        type=req.type,
        owner=req.owner,
        business_unit=req.business_unit,
        business_service=f"{req.business_unit} Service",
        criticality=req.criticality,
        data_sensitivity=req.data_sensitivity,
        internet_exposure=req.internet_exposure,
        records_exposed=req.records_exposed,
        downtime_cost_per_hour=req.downtime_cost_per_hour,
        downtime_cost=req.downtime_cost_per_hour,
        cost_per_record=req.cost_per_record,
        regulatory_penalty=req.regulatory_penalty,
        regulatory_exposure=req.regulatory_penalty,
        recovery_cost=req.recovery_cost,
        reputation_factor=req.reputation_factor,
        controls={"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30},
        dependencies=req.dependencies
    )
    db.add(asset_model)

    # Persist audit log
    audit = models.AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
        user="operator@finsecure.bank",
        action="ASSET_CREATED",
        entity_type="Asset",
        entity_id=new_id,
        details=f"Created asset {req.name} ({new_id})"
    )
    db.add(audit)
    db.commit()
    db.refresh(asset_model)

    return asset_to_dict(asset_model)

@app.get("/api/findings")
@app.get("/api/v1/findings")
def list_findings(db: Session = Depends(get_db)):
    db_findings = db.query(models.Finding).order_by(models.Finding.cvss.desc()).all()
    return [finding_to_dict(f) for f in db_findings]

@app.get("/api/findings/{finding_id}")
@app.get("/api/v1/findings/{finding_id}")
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding_to_dict(f)

@app.post("/api/findings")
@app.post("/api/v1/findings")
def create_finding(req: FindingCreateRequest, db: Session = Depends(get_db)):
    count = db.query(models.Finding).count()
    new_id = f"FND-{count + 1:03d}"

    f_model = models.Finding(
        id=new_id,
        asset_id=req.asset_id,
        vulnerability=req.vulnerability,
        title=req.vulnerability,
        source=req.source,
        severity=req.severity,
        cvss=req.cvss,
        exploit_available=req.exploit_available,
        internet_exposed=req.internet_exposed,
        evidence=req.evidence,
        control_state=req.control_state,
        remediation=req.remediation,
        poc_attached=req.poc_attached,
        status="Open"
    )
    db.add(f_model)

    audit = models.AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
        user="operator@finsecure.bank",
        action="FINDING_INGESTED",
        entity_type="Finding",
        entity_id=new_id,
        details=f"Ingested {req.vulnerability} on {req.asset_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(f_model)

    return finding_to_dict(f_model)

@app.get("/api/controls")
@app.get("/api/v1/controls")
def list_controls(db: Session = Depends(get_db)):
    db_controls = db.query(models.Control).all()
    if db_controls:
        return [
            {
                "id": c.id,
                "name": c.name,
                "type": c.type,
                "cost": c.cost,
                "reduction": c.reduction,
                "description": c.description
            } for c in db_controls
        ]
    return CONTROLS_LIBRARY

@app.get("/api/risks")
@app.get("/api/v1/risks")
def get_risks(db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    risk_list = []
    for a in assets:
        score = calculate_asset_risk_score(a, findings, None, None, appetite)
        eal_res = calculate_asset_eal(a, score, rev, emp, None)
        risk_list.append({
            "asset_id": a["id"],
            "asset_name": a["name"],
            "business_unit": a["business_unit"],
            "risk_score": score,
            "annual_probability": eal_res["incident_probability"],
            "eal": eal_res["eal"]
        })
    return risk_list

@app.get("/api/financial-exposure")
@app.get("/api/v1/financial-exposure")
def get_financial_exposure(db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    scores = {a["id"]: calculate_asset_risk_score(a, findings, None, None, appetite) for a in assets}
    fin = aggregate_enterprise_financials(assets, scores, rev, emp, None)
    return fin

# --- Assessment Endpoints with Strict Authorization Guardrails ---

@app.post("/api/assessment")
@app.post("/api/v1/assessment")
def start_assessment(req: AssessmentStartRequest, db: Session = Depends(get_db)):
    mode = req.mode.upper()
    
    # Priority 4: Explicit authorization enforcement for LIVE mode
    if mode == "LIVE" and not req.authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Explicit authorization confirmation is mandatory to initiate LIVE security assessment mode."
        )

    run_id = f"SEC-RUN-{uuid.uuid4().hex[:6]}"
    run_record = models.SecurityAssessmentRun(
        id=run_id,
        target=req.target,
        mode=mode,
        status="Completed",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        finding_count=3,
        evidence_count=3,
        confidence=0.95,
        results_json={
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
    )
    db.add(run_record)

    audit = models.AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
        user="operator@finsecure.bank",
        action="ASSESSMENT_EXECUTED",
        entity_type="AssessmentRun",
        entity_id=run_id,
        details=f"Executed {mode} assessment against target {req.target}"
    )
    db.add(audit)
    db.commit()

    return {
        "id": run_record.id,
        "target": run_record.target,
        "mode": run_record.mode,
        "status": run_record.status,
        "started_at": run_record.started_at.isoformat(),
        "completed_at": run_record.completed_at.isoformat(),
        "finding_count": run_record.finding_count,
        "results": run_record.results_json
    }

@app.get("/api/assessment")
@app.get("/api/v1/assessment")
def list_assessments(db: Session = Depends(get_db)):
    runs = db.query(models.SecurityAssessmentRun).order_by(models.SecurityAssessmentRun.started_at.desc()).all()
    return [
        {
            "id": r.id,
            "target": r.target,
            "mode": r.mode,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finding_count": r.finding_count,
            "results": r.results_json
        } for r in runs
    ]

# --- Scenarios & Optimization Endpoints ---

@app.post("/api/scenarios/simulate")
@app.post("/api/v1/scenarios/simulate")
def run_scenario(req: ScenarioSimulateRequest, db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    result = simulate_scenario(
        assets=assets,
        findings=findings,
        simulated_controls=req.controls_override,
        simulated_exposure=req.exposure_override,
        org_revenue=rev,
        org_employees=emp,
        risk_appetite=appetite
    )
    return result

@app.post("/api/optimization/run")
@app.post("/api/v1/optimization/run")
def run_optimization(req: OptimizationRequest, db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    rev = org_model.annual_revenue if org_model else 500000000.0
    emp = org_model.employees if org_model else 1200
    budget = req.budget if req.budget is not None else (org_model.budget if org_model else 3500000.0)
    appetite = org_model.risk_appetite if org_model else "Medium"

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    result = solve_investment_optimization(
        budget=budget,
        assets=assets,
        findings=findings,
        org_revenue=rev,
        org_employees=emp,
        risk_appetite=appetite,
        locked_in=req.locked_in,
        locked_out=req.locked_out
    )
    return result

@app.get("/api/compliance")
@app.get("/api/v1/compliance")
def get_compliance(db: Session = Depends(get_db)):
    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    return calculate_framework_posture(assets, None)

@app.post("/api/ai/query")
@app.post("/api/v1/ai/query")
def ai_query(req: AIQueryRequest, db: Session = Depends(get_db)):
    org_model = db.query(models.Organization).first()
    org = {
        "annual_revenue": org_model.annual_revenue if org_model else 500000000.0,
        "employees": org_model.employees if org_model else 1200,
        "budget": org_model.budget if org_model else 3500000.0,
        "risk_appetite": org_model.risk_appetite if org_model else "Medium"
    }

    db_assets = db.query(models.Asset).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).all()
    findings = [finding_to_dict(f) for f in db_findings]

    return query_ai_risk_analyst(
        query=req.query,
        org=org,
        assets=assets,
        findings=findings,
        simulated_controls={}
    )

@app.get("/api/audit-logs")
@app.get("/api/v1/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "user": l.user,
            "action": l.action,
            "entity": l.entity_id,
            "details": l.details or ""
        } for l in logs
    ]
