# backend/app/models/models.py
"""
CyberRiskIQ Domain & Persistence Layer Models
SQLAlchemy ORM definitions for Organization, Assets, Services, Controls,
Findings, Risk Assessments, Scenarios, Optimizations, Frameworks, and Audit Logs.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, default="Banking & Financial Services")
    employees = Column(Integer, default=1200)
    annual_revenue = Column(Float, default=500000000.0) # ₹50 Crore
    budget = Column(Float, default=3500000.0) # ₹35 Lakh
    risk_appetite = Column(String, default="Medium") # Low, Medium, High
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business_units = relationship("BusinessUnit", back_populates="organization", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")

class BusinessUnit(Base):
    __tablename__ = "business_units"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    criticality = Column(String, default="High") # Critical, High, Medium, Low

    organization = relationship("Organization", back_populates="business_units")
    services = relationship("BusinessService", back_populates="business_unit", cascade="all, delete-orphan")

class BusinessService(Base):
    __tablename__ = "business_services"

    id = Column(String, primary_key=True, index=True)
    business_unit_id = Column(String, ForeignKey("business_units.id"), nullable=False)
    name = Column(String, nullable=False)
    criticality = Column(String, default="Critical")
    revenue_dependency = Column(Float, default=0.80)
    downtime_cost_per_hour = Column(Float, default=100000.0)

    business_unit = relationship("BusinessUnit", back_populates="services")
    assets = relationship("Asset", back_populates="business_service_rel", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True) # AST-001
    business_service_id = Column(String, ForeignKey("business_services.id"), nullable=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Application, API, Database, Server, Endpoint, Identity Provider, Network Device
    owner = Column(String, default="Security Operations")
    business_unit = Column(String, nullable=False)
    business_service = Column(String, default="Core Banking Operations")
    criticality = Column(String, default="Medium") # Critical, High, Medium, Low
    data_sensitivity = Column(String, default="Medium") # High, Medium, Low
    internet_exposure = Column(String, default="No") # Yes, No
    records_exposed = Column(Integer, default=5000)
    revenue_impact = Column(Float, default=1.0)
    downtime_cost = Column(Float, default=50000.0) # Downtime cost per hour
    regulatory_exposure = Column(Float, default=500000.0)
    reputation_factor = Column(Float, default=500000.0)
    status = Column(String, default="Active") # Active, Retired, Staged
    
    # Financial Impact Variables (Backwards compatibility aliases)
    downtime_cost_per_hour = Column(Float, default=50000.0)
    cost_per_record = Column(Float, default=150.0)
    regulatory_penalty = Column(Float, default=500000.0)
    recovery_cost = Column(Float, default=300000.0)
    
    # Controls Effectiveness Map (0 - 100)
    controls = Column(JSON, default=lambda: {
        "mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30
    })

    dependencies = Column(JSON, default=list) # List of dependency asset IDs

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business_service_rel = relationship("BusinessService", back_populates="assets")
    findings = relationship("Finding", back_populates="asset", cascade="all, delete-orphan")
    control_evidences = relationship("ControlEvidence", back_populates="asset", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="asset", cascade="all, delete-orphan")

class AssetDependency(Base):
    __tablename__ = "asset_dependencies"

    id = Column(String, primary_key=True, index=True)
    source_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    target_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    dependency_type = Column(String, default="Data Flow") # Data Flow, Authentication, Network, API Call
    criticality = Column(String, default="High")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, index=True) # FND-001
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    source = Column(String, nullable=False) # CyberRiskIQ AI Security Assessment, Internal Scanner, etc.
    title = Column(String, nullable=True)
    vulnerability = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, default="Medium") # Critical, High, Medium, Low
    cvss = Column(Float, default=5.0)
    exploitability = Column(Float, default=1.0)
    known_exploitation = Column(Boolean, default=False)
    exploit_available = Column(Boolean, default=False)
    internet_exposed = Column(Boolean, default=False)
    evidence = Column(Text, nullable=True)
    control_state = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    poc_attached = Column(Boolean, default=False)
    confidence = Column(Float, default=0.95)
    discovered_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Open") # Open, Remediated, Mitigated, In Progress

    asset = relationship("Asset", back_populates="findings")

class Control(Base):
    __tablename__ = "controls"

    id = Column(String, primary_key=True, index=True) # ctrl-mfa
    name = Column(String, nullable=False)
    type = Column(String, default="Preventive") # Preventive, Detective, Corrective
    status = Column(String, default="Active")
    coverage = Column(Float, default=0.30)
    effectiveness = Column(Float, default=0.30)
    cost = Column(Float, nullable=False)
    reduction = Column(Float, nullable=False) # Estimated risk reduction coefficient (0.0 - 1.0)
    description = Column(Text, nullable=True)

    evidences = relationship("ControlEvidence", back_populates="control", cascade="all, delete-orphan")
    mappings = relationship("ControlMapping", back_populates="control", cascade="all, delete-orphan")

class ControlEvidence(Base):
    __tablename__ = "control_evidences"

    id = Column(String, primary_key=True, index=True)
    control_id = Column(String, ForeignKey("controls.id"), nullable=False)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    evidence = Column(Text, nullable=False)
    freshness = Column(String, default="Current") # Current, Stale, Expired
    verified_at = Column(DateTime, default=datetime.utcnow)

    control = relationship("Control", back_populates="evidences")
    asset = relationship("Asset", back_populates="control_evidences")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    likelihood = Column(Float, nullable=False)
    impact = Column(Float, nullable=False)
    exposure = Column(Float, nullable=False)
    control_gap = Column(Float, nullable=False)
    potential_loss = Column(Float, nullable=False)
    annual_probability = Column(Float, nullable=False)
    eal = Column(Float, nullable=False)
    confidence = Column(Float, default=0.90)
    calculation_version = Column(String, default="1.0.0")
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="risk_assessments")

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String, default="admin@finsecure.bank")
    actions = Column(JSON, default=dict) # Key-value map of simulated control overrides
    baseline_eal = Column(Float, default=0.0)
    simulated_eal = Column(Float, default=0.0)
    baseline_risk_score = Column(Float, default=0.0)
    simulated_risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="scenarios")
    scenario_actions = relationship("ScenarioAction", back_populates="scenario", cascade="all, delete-orphan")

class ScenarioAction(Base):
    __tablename__ = "scenario_actions"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    action_type = Column(String, nullable=False) # ENABLE_CONTROL, DELAY_REMEDIATION, ENHANCE_MONITORING
    target_id = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    effect = Column(Float, default=0.0)

    scenario = relationship("Scenario", back_populates="scenario_actions")

class SecurityInvestment(Base):
    __tablename__ = "security_investments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    control_id = Column(String, ForeignKey("controls.id"), nullable=False)
    cost = Column(Float, nullable=False)
    implementation_time = Column(String, default="30 Days")
    coverage = Column(Float, default=0.95)
    expected_effectiveness = Column(Float, default=0.95)

class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id = Column(String, primary_key=True, index=True)
    budget = Column(Float, nullable=False)
    selected_investments = Column(JSON, default=list)
    total_cost = Column(Float, nullable=False)
    risk_reduction = Column(Float, nullable=False)
    eal_before = Column(Float, nullable=False)
    eal_after = Column(Float, nullable=False)
    rosi = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Framework(Base):
    __tablename__ = "frameworks"

    id = Column(String, primary_key=True, index=True) # nist-csf, iso-27001, rbi-csf, sebi-cscrf, cis-controls
    name = Column(String, nullable=False)
    version = Column(String, default="2.0")

    controls = relationship("FrameworkControl", back_populates="framework", cascade="all, delete-orphan")

class FrameworkControl(Base):
    __tablename__ = "framework_controls"

    id = Column(String, primary_key=True, index=True)
    framework_id = Column(String, ForeignKey("frameworks.id"), nullable=False)
    control_identifier = Column(String, nullable=False) # PR.AC-1, A.9.1, RBI-G-1
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    framework = relationship("Framework", back_populates="controls")
    mappings = relationship("ControlMapping", back_populates="framework_control", cascade="all, delete-orphan")

class ControlMapping(Base):
    __tablename__ = "control_mappings"

    id = Column(String, primary_key=True, index=True)
    control_id = Column(String, ForeignKey("controls.id"), nullable=False)
    framework_control_id = Column(String, ForeignKey("framework_controls.id"), nullable=False)
    mapping_strength = Column(Float, default=1.0) # 0.0 - 1.0

    control = relationship("Control", back_populates="mappings")
    framework_control = relationship("FrameworkControl", back_populates="mappings")

class SecurityAssessmentRun(Base):
    __tablename__ = "security_assessment_runs"

    id = Column(String, primary_key=True, index=True)
    target = Column(String, nullable=False)
    mode = Column(String, default="DEMONSTRATION") # LIVE, DEMONSTRATION
    status = Column(String, default="Completed")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)
    finding_count = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.95)
    results_json = Column(JSON, default=dict)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, default="admin@finsecure.bank")
    action = Column(String, nullable=False) # Finding Ingestion, Control Adjustment, Scenario Run, Optimization Run
    entity_type = Column(String, default="Asset") # Asset, Control, Scenario, Optimizer, Report
    entity_id = Column(String, nullable=False)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    details = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="audit_logs")
