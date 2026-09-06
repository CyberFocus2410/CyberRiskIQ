# backend/app/main.py
"""
CyberRiskIQ Enterprise Multi-Tenant Backend Application
FastAPI Server providing authoritative server-side calculation engines,
relational PostgreSQL / SQLite persistence, multi-tenant Row Level Security,
interactive onboarding, 0/1 Knapsack budget optimizer, and grounded AI Analyst.
"""
import os
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

import asyncio
from fastapi import FastAPI, Depends, HTTPException, Query, status, Header, Request, BackgroundTasks, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.db.database import Base, engine, get_db, SessionLocal
from backend.app.models import models
from backend.app.db.seed_data import (
    ORG_SEED, BUSINESS_UNITS_SEED, generate_assets_seed, FINDINGS_SEED,
    seed_organization_demo_data
)
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
from backend.app.services.assessment_engine import (
    start_assessment,
    execute_assessment_run,
    get_run_dir,
    register_event_listener,
    unregister_event_listener,
    get_run_events_history
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberRiskIQ API",
    version="2.0.0",
    description="Enterprise Multi-Tenant Quantitative Cyber Risk & Budget Optimization Platform"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# MULTI-TENANT AUTHENTICATION & CONTEXT RESOLVER
# -------------------------------------------------------------
DEFAULT_DEMO_ORG_ID = "org-demo-finsecure"

def get_current_tenant(
    authorization: Optional[str] = Header(None),
    x_organization_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.Organization:
    """
    Resolves the active organization tenant from headers.
    Supports JWT Bearer tokens or X-Organization-ID header,
    with an automatic fallback/auto-provisioning for demo and test accounts.
    """
    org_id = None

    if x_organization_id:
        org_id = x_organization_id.strip()
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        # In a production Supabase setup with verified JWT:
        # We can extract the 'organization_id' claim or sub/email
        if token.startswith("org-") or len(token) == 36:
            org_id = token
        elif token == "demo-token" or token == "default":
            org_id = DEFAULT_DEMO_ORG_ID

    if not org_id:
        org_id = DEFAULT_DEMO_ORG_ID

    # Look up organization in database
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        # Auto-provision organization record
        org = models.Organization(
            id=org_id,
            name="FinSecure Bank" if org_id == DEFAULT_DEMO_ORG_ID else "My Organization",
            industry="Banking & Financial Services",
            employees=1200,
            annual_revenue=500000000.0,
            budget=3500000.0,
            risk_appetite="Medium",
            onboarding_completed=(org_id == DEFAULT_DEMO_ORG_ID)
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # If it's the demo organization, seed it automatically
        if org_id == DEFAULT_DEMO_ORG_ID:
            seed_organization_demo_data(db, org_id)

    return org

# -------------------------------------------------------------
# HELPER SERIALIZERS
# -------------------------------------------------------------
def asset_to_dict(asset: models.Asset) -> Dict[str, Any]:
    impact = asset.business_impact
    downtime_cost = impact.downtime_cost_per_hour if impact else (asset.downtime_cost_per_hour or 50000.0)
    records_exposed = impact.records_exposed if impact else (asset.records_exposed or 5000)
    cost_per_record = impact.cost_per_record if impact else (asset.cost_per_record or 150.0)
    regulatory_penalty = impact.regulatory_penalty if impact else (asset.regulatory_penalty or 500000.0)
    recovery_cost = impact.recovery_cost if impact else (asset.recovery_cost or 300000.0)
    reputation_factor = impact.reputation_factor if impact else (asset.reputation_factor or 500000.0)

    return {
        "id": asset.id,
        "organization_id": asset.organization_id,
        "name": asset.name,
        "type": asset.type,
        "owner": asset.owner or "Security Operations",
        "business_unit": asset.business_unit,
        "businessUnit": asset.business_unit,
        "business_service": asset.business_service or "Core Operations",
        "businessService": asset.business_service or "Core Operations",
        "criticality": asset.criticality,
        "data_sensitivity": asset.data_sensitivity,
        "dataSensitivity": asset.data_sensitivity,
        "internet_exposure": asset.internet_exposure,
        "internetExposure": asset.internet_exposure,
        "records_exposed": records_exposed,
        "recordsExposed": records_exposed,
        "downtime_cost_per_hour": downtime_cost,
        "downtimeCostPerHour": downtime_cost,
        "cost_per_record": cost_per_record,
        "costPerRecord": cost_per_record,
        "regulatory_penalty": regulatory_penalty,
        "regulatoryPenalty": regulatory_penalty,
        "recovery_cost": recovery_cost,
        "recoveryCost": recovery_cost,
        "reputation_factor": reputation_factor,
        "reputationFactor": reputation_factor,
        "status": asset.status or "Active",
        "controls": asset.controls or {"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30},
        "dependencies": asset.dependencies or []
    }

def finding_to_dict(f: models.Finding) -> Dict[str, Any]:
    return {
        "id": f.id,
        "organization_id": f.organization_id,
        "asset_id": f.asset_id,
        "assetId": f.asset_id,
        "source": f.source,
        "title": f.title or f.vulnerability,
        "vulnerability": f.vulnerability,
        "description": f.description or "",
        "severity": f.severity or "Medium",
        "cvss": float(f.cvss) if f.cvss is not None else 5.0,
        "exploit_available": bool(f.exploit_available),
        "exploitAvailable": bool(f.exploit_available),
        "internet_exposed": bool(f.internet_exposed),
        "internetExposed": bool(f.internet_exposed),
        "evidence": f.evidence or "",
        "control_state": f.control_state or "",
        "controlState": f.control_state or "",
        "remediation": f.remediation or "",
        "poc_attached": bool(f.poc_attached),
        "pocAttached": bool(f.poc_attached),
        "confidence": float(f.confidence) if f.confidence is not None else 0.95,
        "status": f.status or "Open",
        "discovered_at": f.discovered_at.isoformat() if f.discovered_at else datetime.utcnow().isoformat()
    }

# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------
class OrgUpdateRequest(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    employees: Optional[int] = None
    annual_revenue: Optional[float] = None
    budget: Optional[float] = None
    risk_appetite: Optional[str] = None

class AssetCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    type: str = "Application"
    owner: str = "Security Operations"
    business_unit: str = "Retail Banking"
    business_service: str = "Core Operations"
    criticality: str = "Medium"
    data_sensitivity: str = "Medium"
    internet_exposure: str = "No"
    records_exposed: int = 5000
    downtime_cost_per_hour: float = 50000.0
    cost_per_record: float = 150.0
    regulatory_penalty: float = 500000.0
    recovery_cost: float = 300000.0
    reputation_factor: float = 500000.0
    controls: Optional[Dict[str, float]] = None
    dependencies: Optional[List[str]] = None

class BulkAssetImportRequest(BaseModel):
    assets: List[AssetCreateRequest]

class OnboardingCompleteRequest(BaseModel):
    organization: OrgUpdateRequest
    business_units: List[str]
    assets: List[AssetCreateRequest]
    initial_controls: Optional[Dict[str, float]] = None

class FindingCreateRequest(BaseModel):
    asset_id: str
    vulnerability: str
    source: str = "Internal Assessment"
    severity: str = "Medium"
    cvss: float = 5.0
    exploit_available: bool = False
    internet_exposed: bool = False
    evidence: Optional[str] = None
    control_state: Optional[str] = None
    remediation: Optional[str] = None
    poc_attached: bool = False

class OptimizationRequest(BaseModel):
    budget: float = 3500000.0
    locked_in: Optional[List[str]] = None
    locked_out: Optional[List[str]] = None

class ScenarioSimulateRequest(BaseModel):
    controls_override: Optional[Dict[str, bool]] = None
    exposure_override: Optional[Dict[str, Any]] = None
    delay_30_days: bool = False

class AIQueryRequest(BaseModel):
    query: str
    simulated_controls: Optional[Dict[str, bool]] = None

class SecurityAssessmentRequest(BaseModel):
    target: str = "https://api.finsecure.bank"
    mode: str = "DEMONSTRATION" # DEMONSTRATION, LIVE
    authorized: bool = True
    quick: bool = True

# -------------------------------------------------------------
# CORE SYSTEM & HEALTH ROUTES
# -------------------------------------------------------------
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CyberRiskIQ Quantitative Risk Platform",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "multi_tenant": True
    }

# -------------------------------------------------------------
# ORGANIZATION & ONBOARDING ROUTES
# -------------------------------------------------------------
@app.get("/api/organization")
@app.get("/api/v1/organization")
def get_organization_profile(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    bus = [b.name for b in db.query(models.BusinessUnit).filter(models.BusinessUnit.organization_id == org.id).all()]
    asset_count = db.query(models.Asset).filter(models.Asset.organization_id == org.id).count()

    return {
        "id": org.id,
        "name": org.name,
        "industry": org.industry,
        "employees": org.employees,
        "annual_revenue": org.annual_revenue,
        "annualRevenue": org.annual_revenue,
        "budget": org.budget,
        "risk_appetite": org.risk_appetite,
        "riskAppetite": org.risk_appetite,
        "business_units": bus or BUSINESS_UNITS_SEED,
        "businessUnits": bus or BUSINESS_UNITS_SEED,
        "onboarding_completed": org.onboarding_completed,
        "onboardingCompleted": org.onboarding_completed,
        "asset_count": asset_count,
        "created_at": org.created_at.isoformat() if org.created_at else None
    }

@app.put("/api/organization")
@app.put("/api/v1/organization")
def update_organization_profile(
    req: OrgUpdateRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if req.name is not None: org.name = req.name
    if req.industry is not None: org.industry = req.industry
    if req.employees is not None: org.employees = req.employees
    if req.annual_revenue is not None: org.annual_revenue = req.annual_revenue
    if req.budget is not None: org.budget = req.budget
    if req.risk_appetite is not None: org.risk_appetite = req.risk_appetite

    db.commit()
    db.refresh(org)
    return get_organization_profile(org, db)

@app.post("/api/onboarding/complete")
@app.post("/api/v1/onboarding/complete")
def complete_onboarding(
    req: OnboardingCompleteRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Saves the complete 4-step first-time onboarding wizard payload.
    """
    # 1. Update Organization
    if req.organization.name: org.name = req.organization.name
    if req.organization.industry: org.industry = req.organization.industry
    if req.organization.employees: org.employees = req.organization.employees
    if req.organization.annual_revenue: org.annual_revenue = req.organization.annual_revenue
    if req.organization.budget: org.budget = req.organization.budget
    if req.organization.risk_appetite: org.risk_appetite = req.organization.risk_appetite
    org.onboarding_completed = True
    db.flush()

    # 2. Sync Business Units
    if req.business_units:
        db.query(models.BusinessUnit).filter(models.BusinessUnit.organization_id == org.id).delete()
        for bu_name in req.business_units:
            bu = models.BusinessUnit(
                organization_id=org.id,
                name=bu_name.strip(),
                criticality="High"
            )
            db.add(bu)
        db.flush()

    # 3. Add Assets & 5-Factor Business Impacts
    if req.assets:
        db.query(models.AssetBusinessImpact).filter(models.AssetBusinessImpact.organization_id == org.id).delete()
        db.query(models.Finding).filter(models.Finding.organization_id == org.id).delete()
        db.query(models.Asset).filter(models.Asset.organization_id == org.id).delete()
        db.flush()

        for idx, a in enumerate(req.assets):
            asset_id = a.id or f"AST-{idx + 1:03d}"
            ctrls = a.controls or req.initial_controls or {
                "mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30
            }
            asset_obj = models.Asset(
                id=asset_id,
                organization_id=org.id,
                name=a.name,
                type=a.type,
                owner=a.owner or "Security Operations",
                business_unit=a.business_unit,
                business_service=a.business_service,
                criticality=a.criticality,
                data_sensitivity=a.data_sensitivity,
                internet_exposure=a.internet_exposure,
                records_exposed=a.records_exposed,
                downtime_cost_per_hour=a.downtime_cost_per_hour,
                cost_per_record=a.cost_per_record,
                regulatory_penalty=a.regulatory_penalty,
                recovery_cost=a.recovery_cost,
                reputation_factor=a.reputation_factor,
                controls=ctrls,
                dependencies=a.dependencies or [],
                status="Active"
            )
            db.add(asset_obj)

            impact_obj = models.AssetBusinessImpact(
                organization_id=org.id,
                asset_id=asset_id,
                downtime_cost_per_hour=a.downtime_cost_per_hour,
                records_exposed=a.records_exposed,
                cost_per_record=a.cost_per_record,
                regulatory_penalty=a.regulatory_penalty,
                recovery_cost=a.recovery_cost,
                reputation_factor=a.reputation_factor
            )
            db.add(impact_obj)
        db.flush()

    # 4. Initialize Standard Controls Library if empty
    ctrl_count = db.query(models.Control).filter(models.Control.organization_id == org.id).count()
    if ctrl_count == 0:
        for c in CONTROLS_LIBRARY:
            ctrl_model = models.Control(
                id=c["id"],
                organization_id=org.id,
                name=c["name"],
                type="Preventive",
                cost=c["cost"],
                reduction=c["reduction"],
                description=c.get("description", ""),
                coverage=0.30,
                effectiveness=0.30
            )
            db.add(ctrl_model)

    db.commit()
    return {"status": "success", "message": "Onboarding completed successfully", "organization_id": org.id}

@app.post("/api/onboarding/load-demo")
@app.post("/api/v1/onboarding/load-demo")
def load_demo_dataset(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Loads the complete 52-asset FinSecure Bank dataset scoped strictly to the calling tenant."""
    seed_organization_demo_data(db, org.id)
    return {"status": "success", "message": "Demo dataset loaded successfully into your organization workspace"}

@app.post("/api/organization/reset")
@app.post("/api/v1/organization/reset")
def reset_organization_data(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Wipes organization assets, findings, and scenarios, returning to un-onboarded state."""
    db.query(models.Finding).filter(models.Finding.organization_id == org.id).delete()
    db.query(models.AssetBusinessImpact).filter(models.AssetBusinessImpact.organization_id == org.id).delete()
    db.query(models.Asset).filter(models.Asset.organization_id == org.id).delete()
    db.query(models.Scenario).filter(models.Scenario.org_id == org.id).delete()
    db.query(models.InvestmentPortfolio).filter(models.InvestmentPortfolio.organization_id == org.id).delete()

    org.onboarding_completed = False
    db.commit()
    return {"status": "success", "message": "Organization data reset successfully"}

# -------------------------------------------------------------
# ASSET INVENTORY & CRUD ROUTES
# -------------------------------------------------------------
@app.get("/api/assets")
@app.get("/api/v1/assets")
def list_assets(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    return [asset_to_dict(a) for a in db_assets]

@app.get("/api/assets/{asset_id}")
@app.get("/api/v1/assets/{asset_id}")
def get_asset(
    asset_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(
        models.Asset.organization_id == org.id,
        models.Asset.id == asset_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found in organization")
    return asset_to_dict(asset)

@app.post("/api/assets")
@app.post("/api/v1/assets")
def create_asset(
    req: AssetCreateRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    count = db.query(models.Asset).filter(models.Asset.organization_id == org.id).count()
    new_id = req.id or f"AST-{count + 1:03d}"

    ctrls = req.controls or {"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30}
    asset_obj = models.Asset(
        id=new_id,
        organization_id=org.id,
        name=req.name,
        type=req.type,
        owner=req.owner,
        business_unit=req.business_unit,
        business_service=req.business_service,
        criticality=req.criticality,
        data_sensitivity=req.data_sensitivity,
        internet_exposure=req.internet_exposure,
        records_exposed=req.records_exposed,
        downtime_cost_per_hour=req.downtime_cost_per_hour,
        cost_per_record=req.cost_per_record,
        regulatory_penalty=req.regulatory_penalty,
        recovery_cost=req.recovery_cost,
        reputation_factor=req.reputation_factor,
        controls=ctrls,
        dependencies=req.dependencies or [],
        status="Active"
    )
    db.add(asset_obj)

    impact_obj = models.AssetBusinessImpact(
        organization_id=org.id,
        asset_id=new_id,
        downtime_cost_per_hour=req.downtime_cost_per_hour,
        records_exposed=req.records_exposed,
        cost_per_record=req.cost_per_record,
        regulatory_penalty=req.regulatory_penalty,
        recovery_cost=req.recovery_cost,
        reputation_factor=req.reputation_factor
    )
    db.add(impact_obj)

    audit = models.AuditLog(
        organization_id=org.id,
        action="ASSET_CREATED",
        entity_type="Asset",
        entity_id=new_id,
        details=f"Created asset {req.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(asset_obj)
    return asset_to_dict(asset_obj)

@app.post("/api/assets/bulk-import")
@app.post("/api/v1/assets/bulk-import")
def bulk_import_assets(
    req: BulkAssetImportRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    count = db.query(models.Asset).filter(models.Asset.organization_id == org.id).count()
    created = []

    for idx, a in enumerate(req.assets):
        asset_id = a.id or f"AST-{count + idx + 1:03d}"
        ctrls = a.controls or {"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30}
        
        asset_obj = models.Asset(
            id=asset_id,
            organization_id=org.id,
            name=a.name,
            type=a.type,
            owner=a.owner,
            business_unit=a.business_unit,
            business_service=a.business_service,
            criticality=a.criticality,
            data_sensitivity=a.data_sensitivity,
            internet_exposure=a.internet_exposure,
            records_exposed=a.records_exposed,
            downtime_cost_per_hour=a.downtime_cost_per_hour,
            cost_per_record=a.cost_per_record,
            regulatory_penalty=a.regulatory_penalty,
            recovery_cost=a.recovery_cost,
            reputation_factor=a.reputation_factor,
            controls=ctrls,
            dependencies=a.dependencies or [],
            status="Active"
        )
        db.add(asset_obj)

        impact_obj = models.AssetBusinessImpact(
            organization_id=org.id,
            asset_id=asset_id,
            downtime_cost_per_hour=a.downtime_cost_per_hour,
            records_exposed=a.records_exposed,
            cost_per_record=a.cost_per_record,
            regulatory_penalty=a.regulatory_penalty,
            recovery_cost=a.recovery_cost,
            reputation_factor=a.reputation_factor
        )
        db.add(impact_obj)
        created.append(asset_id)

    db.commit()
    return {"status": "success", "imported_count": len(created), "asset_ids": created}

@app.put("/api/assets/{asset_id}")
@app.put("/api/v1/assets/{asset_id}")
def update_asset(
    asset_id: str,
    req: AssetCreateRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(
        models.Asset.organization_id == org.id,
        models.Asset.id == asset_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.name = req.name
    asset.type = req.type
    asset.owner = req.owner
    asset.business_unit = req.business_unit
    asset.business_service = req.business_service
    asset.criticality = req.criticality
    asset.data_sensitivity = req.data_sensitivity
    asset.internet_exposure = req.internet_exposure
    if req.controls:
        asset.controls = req.controls

    impact = db.query(models.AssetBusinessImpact).filter(
        models.AssetBusinessImpact.organization_id == org.id,
        models.AssetBusinessImpact.asset_id == asset_id
    ).first()
    if not impact:
        impact = models.AssetBusinessImpact(organization_id=org.id, asset_id=asset_id)
        db.add(impact)

    impact.downtime_cost_per_hour = req.downtime_cost_per_hour
    impact.records_exposed = req.records_exposed
    impact.cost_per_record = req.cost_per_record
    impact.regulatory_penalty = req.regulatory_penalty
    impact.recovery_cost = req.recovery_cost
    impact.reputation_factor = req.reputation_factor

    db.commit()
    db.refresh(asset)
    return asset_to_dict(asset)

@app.delete("/api/assets/{asset_id}")
@app.delete("/api/v1/assets/{asset_id}")
def delete_asset(
    asset_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(
        models.Asset.organization_id == org.id,
        models.Asset.id == asset_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.query(models.AssetBusinessImpact).filter(
        models.AssetBusinessImpact.organization_id == org.id,
        models.AssetBusinessImpact.asset_id == asset_id
    ).delete()
    db.query(models.Finding).filter(
        models.Finding.organization_id == org.id,
        models.Finding.asset_id == asset_id
    ).delete()
    db.delete(asset)
    db.commit()
    return {"status": "success", "message": f"Asset {asset_id} deleted"}

# -------------------------------------------------------------
# FINDINGS & ASSESSMENT ROUTES
# -------------------------------------------------------------
@app.get("/api/findings")
@app.get("/api/v1/findings")
def list_findings(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).order_by(models.Finding.cvss.desc()).all()
    return [finding_to_dict(f) for f in findings]

@app.post("/api/findings")
@app.post("/api/v1/findings")
def create_finding(
    req: FindingCreateRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    count = db.query(models.Finding).filter(models.Finding.organization_id == org.id).count()
    new_id = f"FND-{count + 1:03d}"

    f_model = models.Finding(
        id=new_id,
        organization_id=org.id,
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
    db.commit()
    db.refresh(f_model)
    return finding_to_dict(f_model)

@app.post("/api/assessment")
@app.post("/api/v1/assessment")
def run_security_assessment(
    req: SecurityAssessmentRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if req.mode == "LIVE" and not req.authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Live security assessment prohibited: Explicit authorization confirmation required."
        )

    run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"
    sample_findings = [
        {
            "id": f"FND-SEC-{uuid.uuid4().hex[:6]}",
            "asset_id": "AST-001",
            "title": "Broken Object Level Authorization (BOLA)",
            "vulnerability": "Broken Object Level Authorization on /api/v1/charge",
            "severity": "Critical",
            "cvss": 9.8,
            "exploit_available": True,
            "internet_exposed": True,
            "evidence": "Agent verified tenant ID header bypass extracting transaction records.",
            "control_state": "Gateway object authorization missing.",
            "remediation": "Enforce object-level tenant permission check.",
            "poc_attached": True
        }
    ]

    run_obj = models.SecurityAssessmentRun(
        id=run_id,
        organization_id=org.id,
        target=req.target,
        mode=req.mode,
        status="Completed",
        findings_count=len(sample_findings),
        evidence_count=len(sample_findings),
        confidence=0.96,
        results_json={"findings": sample_findings}
    )
    db.add(run_obj)
    db.commit()

    return {
        "runId": run_id,
        "status": "Completed",
        "mode": req.mode,
        "target": req.target,
        "findings_count": len(sample_findings),
        "results": {"findings": sample_findings}
    }

# -------------------------------------------------------------
# AUTHORITATIVE CALCULATION ENGINES
# -------------------------------------------------------------
@app.get("/api/dashboard/summary")
@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    if not assets:
        return {
            "organization_name": org.name,
            "asset_count": 0,
            "findings_count": len(findings),
            "enterprise_risk_score": 10,
            "total_eal": 0,
            "total_exposure": 0,
            "budget": org.budget,
            "bu_distribution": {},
            "category_totals": {"downtime": 0, "data_breach": 0, "regulatory": 0, "recovery": 0, "reputation": 0},
            "top_risks": [],
            "onboarding_completed": org.onboarding_completed
        }

    risk_scores = {
        a["id"]: calculate_asset_risk_score(a, findings, None, None, org.risk_appetite)
        for a in assets
    }
    fin_agg = aggregate_enterprise_financials(assets, risk_scores, org.annual_revenue, org.employees)
    ent_risk = aggregate_enterprise_risk(assets, findings, None, None, org.risk_appetite)

    sorted_risks = sorted(fin_agg["asset_financials"], key=lambda x: x["eal"], reverse=True)

    return {
        "organization_id": org.id,
        "organization_name": org.name,
        "asset_count": len(assets),
        "findings_count": len(findings),
        "enterprise_risk_score": ent_risk["enterprise_risk_score"],
        "total_eal": fin_agg["total_eal"],
        "total_exposure": fin_agg["total_financial_exposure"],
        "budget": org.budget,
        "bu_distribution": fin_agg["bu_distribution"],
        "category_totals": fin_agg["category_totals"],
        "top_risks": sorted_risks[:5],
        "onboarding_completed": org.onboarding_completed
    }

@app.get("/api/risks")
@app.get("/api/v1/risks")
def get_risks(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    risk_list = []
    for a in assets:
        score = calculate_asset_risk_score(a, findings, None, None, org.risk_appetite)
        eal_res = calculate_asset_eal(a, score, org.annual_revenue, org.employees, None)
        risk_list.append({
            "asset_id": a["id"],
            "asset_name": a["name"],
            "business_unit": a["business_unit"],
            "criticality": a["criticality"],
            "risk_score": score,
            "annual_probability": eal_res["incident_probability"],
            "potential_loss": eal_res["potential_loss"],
            "eal": eal_res["eal"],
            "calculation_formula": eal_res["calculation_formula"]
        })
    return risk_list

@app.get("/api/financial-exposure")
@app.get("/api/v1/financial-exposure")
def get_financial_exposure(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    risk_scores = {
        a["id"]: calculate_asset_risk_score(a, findings, None, None, org.risk_appetite)
        for a in assets
    }
    return aggregate_enterprise_financials(assets, risk_scores, org.annual_revenue, org.employees)

@app.post("/api/optimization/run")
@app.post("/api/v1/optimization/run")
def run_optimization(
    req: OptimizationRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    budget = req.budget or org.budget or 3500000.0
    result = solve_investment_optimization(
        budget=budget,
        assets=assets,
        findings=findings,
        org_revenue=org.annual_revenue,
        org_employees=org.employees,
        risk_appetite=org.risk_appetite,
        locked_in=req.locked_in,
        locked_out=req.locked_out
    )

    portfolio_obj = models.InvestmentPortfolio(
        organization_id=org.id,
        budget=budget,
        selected_portfolio=result["selected_portfolio"],
        total_cost=result["total_cost"],
        total_reduction=result["total_reduction"],
        residual_eal=result["residual_eal"],
        rosi=result["rosi"]
    )
    db.add(portfolio_obj)
    db.commit()

    return result

@app.post("/api/scenarios/simulate")
@app.post("/api/v1/scenarios/simulate")
def simulate_what_if_scenario(
    req: ScenarioSimulateRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    return simulate_scenario(
        assets=assets,
        findings=findings,
        simulated_controls=req.controls_override or {},
        simulated_exposure=req.exposure_override or {},
        org_revenue=org.annual_revenue,
        org_employees=org.employees,
        risk_appetite=org.risk_appetite,
        delay_30_days=req.delay_30_days
    )

@app.get("/api/compliance/posture")
@app.get("/api/v1/compliance/posture")
def get_compliance_posture(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    return calculate_framework_posture(assets, None)

@app.post("/api/ai/query")
@app.post("/api/v1/ai/query")
def query_ai_analyst(
    req: AIQueryRequest,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_assets = db.query(models.Asset).filter(models.Asset.organization_id == org.id).all()
    assets = [asset_to_dict(a) for a in db_assets]
    db_findings = db.query(models.Finding).filter(models.Finding.organization_id == org.id).all()
    findings = [finding_to_dict(f) for f in db_findings]

    org_dict = {
        "name": org.name,
        "annual_revenue": org.annual_revenue,
        "employees": org.employees,
        "budget": org.budget,
        "risk_appetite": org.risk_appetite
    }

    return query_ai_risk_analyst(
        query=req.query,
        org=org_dict,
        assets=assets,
        findings=findings,
        simulated_controls=req.simulated_controls or {}
    )

@app.get("/api/controls")
@app.get("/api/v1/controls")
def list_controls(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db_controls = db.query(models.Control).filter(models.Control.organization_id == org.id).all()
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

# -------------------------------------------------------------
# AI SECURITY ASSESSMENT ENGINE ENDPOINTS
# -------------------------------------------------------------
class AssessmentScanRequest(BaseModel):
    target: str = "./src"
    scope: Optional[str] = "Standard Full Scope"
    mode: Optional[str] = "demo" # demo | live
    authorized: Optional[bool] = True

@app.post("/api/assessment")
@app.post("/api/assessment/scan")
@app.post("/api/v1/assessments")
def launch_assessment_scan(
    req: AssessmentScanRequest,
    background_tasks: BackgroundTasks,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    mode_str = "LIVE" if req.mode and req.mode.upper() == "LIVE" else "DEMONSTRATION"
    if mode_str == "LIVE" and req.authorized is False:
        raise HTTPException(status_code=403, detail="Live security assessment unauthorized: Authorization consent is required.")
    
    scope_str = req.scope or "Standard Full Scope"
    
    run_obj = start_assessment(
        target=req.target,
        scope=scope_str,
        mode=mode_str,
        org_id=org.id,
        db=db
    )
    
    # Dispatch asynchronous background task
    background_tasks.add_task(
        execute_assessment_run,
        run_id=run_obj.id,
        org_id=org.id,
        target=req.target,
        scope=scope_str,
        mode=mode_str
    )
    
    return {
        "runId": run_obj.id,
        "resultsPath": f"assessment_runs/{run_obj.id}/results.json",
        "target": req.target,
        "scope": scope_str,
        "mode": mode_str,
        "status": "queued",
        "success": True
    }

@app.get("/api/assessment/status/{run_id}")
@app.get("/api/v1/assessments/{run_id}")
def get_assessment_status(
    run_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    run_obj = db.query(models.SecurityAssessmentRun).filter(
        models.SecurityAssessmentRun.id == run_id,
        models.SecurityAssessmentRun.organization_id == org.id
    ).first()
    if not run_obj:
        raise HTTPException(status_code=404, detail="Assessment run session not found")
    return {
        "runId": run_obj.id,
        "status": run_obj.status,
        "target": run_obj.target,
        "scope": run_obj.scope,
        "mode": run_obj.mode,
        "started_at": run_obj.started_at.isoformat() if run_obj.started_at else None,
        "completed_at": run_obj.completed_at.isoformat() if run_obj.completed_at else None,
        "findings_count": run_obj.findings_count,
        "error": run_obj.error_message
    }

@app.get("/api/assessment/log/{run_id}")
def get_assessment_log(
    run_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    run_obj = db.query(models.SecurityAssessmentRun).filter(
        models.SecurityAssessmentRun.id == run_id,
        models.SecurityAssessmentRun.organization_id == org.id
    ).first()
    
    log_text = ""
    run_dir = get_run_dir(run_id)
    disk_log = os.path.join(run_dir, "run.log")
    if os.path.exists(disk_log):
        try:
            with open(disk_log, "r", encoding="utf-8") as f:
                log_text = f.read()
        except Exception:
            pass
    if not log_text and run_obj:
        log_text = run_obj.logs or ""

    if not log_text:
        log_text = f"[{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}] [CYBERRISKIQ] Initializing AI Security Assessment session {run_id}...\n"
    
    return Response(content=log_text, media_type="text/plain; charset=utf-8")

@app.get("/api/assessment/result/{run_id}")
def get_assessment_result(
    run_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    run_obj = db.query(models.SecurityAssessmentRun).filter(
        models.SecurityAssessmentRun.id == run_id,
        models.SecurityAssessmentRun.organization_id == org.id
    ).first()
    if not run_obj:
        raise HTTPException(status_code=404, detail="Assessment run session not found")
    
    if run_obj.status == "completed":
        return {
            "success": True,
            "status": "completed",
            "runId": run_obj.id,
            "results": run_obj.results_json,
            "report": run_obj.report_json
        }
    elif run_obj.status == "failed":
        return {
            "success": False,
            "status": "failed",
            "runId": run_obj.id,
            "error": run_obj.error_message or "Security assessment execution failed"
        }
    else:
        return {
            "success": False,
            "status": run_obj.status,
            "runId": run_obj.id
        }

@app.get("/api/assessment/report/{run_id}")
def get_assessment_report(
    run_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    run_obj = db.query(models.SecurityAssessmentRun).filter(
        models.SecurityAssessmentRun.id == run_id,
        models.SecurityAssessmentRun.organization_id == org.id
    ).first()
    if not run_obj:
        raise HTTPException(status_code=404, detail="Assessment run session not found")
    
    if run_obj.status != "completed" or not run_obj.report_json:
        raise HTTPException(status_code=400, detail=f"Assessment report is not ready (Current status: {run_obj.status})")
    
    return run_obj.report_json

@app.get("/api/assessment/runs")
def list_assessment_runs(
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    runs = db.query(models.SecurityAssessmentRun).filter(
        models.SecurityAssessmentRun.organization_id == org.id
    ).order_by(models.SecurityAssessmentRun.started_at.desc()).all()

    return [
        {
            "id": r.id,
            "target": r.target,
            "scope": r.scope,
            "mode": r.mode,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "findings_count": r.findings_count,
            "confidence": r.confidence,
            "error_message": r.error_message
        }
        for r in runs
    ]

@app.get("/api/assessment/events/{run_id}/history")
def get_assessment_events_history(
    run_id: str,
    org: models.Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Returns chronological event history for a given assessment run."""
    events = get_run_events_history(run_id)
    return {"runId": run_id, "events": events, "count": len(events)}

@app.get("/api/assessment/events/{run_id}")
async def stream_assessment_events_sse(
    run_id: str,
    request: Request
):
    """
    Server-Sent Events (SSE) stream for real-time assessment progress and graph updates.
    """
    queue = register_event_listener(run_id)

    async def event_generator():
        try:
            # 1. Yield all existing historical events first
            history = get_run_events_history(run_id)
            for ev in history:
                yield f"data: {json.dumps(ev)}\n\n"
                await asyncio.sleep(0.02)

            # Check if run already ended
            if history and history[-1].get("status") in ["completed", "failed"]:
                return

            # 2. Yield live incoming events from queue
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                    yield f"data: {json.dumps(event)}\n\n"
                    if event.get("status") in ["completed", "failed"]:
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment
                    yield ": keep-alive\n\n"
        finally:
            unregister_event_listener(run_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.websocket("/api/assessment/ws/{run_id}")
async def websocket_assessment_stream(
    websocket: WebSocket,
    run_id: str
):
    """
    WebSocket endpoint streaming real-time attack graph nodes, edges, and telemetry logs.
    """
    await websocket.accept()
    queue = register_event_listener(run_id)
    try:
        # Send history first
        history = get_run_events_history(run_id)
        for ev in history:
            await websocket.send_json(ev)
            await asyncio.sleep(0.02)

        if history and history[-1].get("status") in ["completed", "failed"]:
            await websocket.close()
            return

        # Stream live events
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=2.0)
                await websocket.send_json(event)
                if event.get("status") in ["completed", "failed"]:
                    break
            except asyncio.TimeoutError:
                # Send ping
                await websocket.send_json({"type": "ping", "run_id": run_id})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        unregister_event_listener(run_id, queue)

# Backwards compatible seeder on startup
def seed_database_if_empty():
    db = SessionLocal()
    try:
        org = db.query(models.Organization).filter(models.Organization.id == DEFAULT_DEMO_ORG_ID).first()
        if not org or db.query(models.Asset).filter(models.Asset.organization_id == DEFAULT_DEMO_ORG_ID).count() == 0:
            seed_organization_demo_data(db, DEFAULT_DEMO_ORG_ID)
    finally:
        db.close()

seed_database_if_empty()
