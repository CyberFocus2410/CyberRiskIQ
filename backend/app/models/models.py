# backend/app/models/models.py
"""
CyberRiskIQ Domain & Multi-Tenant Persistence Layer Models
SQLAlchemy ORM definitions scoped strictly by organization_id for complete tenant isolation.
"""
from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, ForeignKeyConstraint
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, default="Banking & Financial Services")
    employees = Column(Integer, default=1200)
    annual_revenue = Column(Float, default=500000000.0) # ₹50 Crore
    budget = Column(Float, default=3500000.0)          # ₹35 Lakh
    risk_appetite = Column(String, default="Medium")  # Low, Medium, High
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    business_units = relationship("BusinessUnit", back_populates="organization", cascade="all, delete-orphan")
    business_services = relationship("BusinessService", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")
    controls = relationship("Control", back_populates="organization", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="organization", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")
    assessment_runs = relationship("SecurityAssessmentRun", back_populates="organization", cascade="all, delete-orphan")
    portfolios = relationship("InvestmentPortfolio", back_populates="organization", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "organization_users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    auth_user_id = Column(String, nullable=True, index=True)
    email = Column(String, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="admin") # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class BusinessUnit(Base):
    __tablename__ = "business_units"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    criticality = Column(String, default="High") # Critical, High, Medium, Low
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="business_units")
    services = relationship("BusinessService", back_populates="business_unit", cascade="all, delete-orphan")

class BusinessService(Base):
    __tablename__ = "business_services"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    business_unit_id = Column(String, ForeignKey("business_units.id"), nullable=True)
    name = Column(String, nullable=False)
    criticality = Column(String, default="Critical")
    revenue_dependency = Column(Float, default=0.80)
    downtime_cost_per_hour = Column(Float, default=100000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="business_services")
    business_unit = relationship("BusinessUnit", back_populates="services")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True) # AST-001
    organization_id = Column(String, ForeignKey("organizations.id"), primary_key=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Application, API, Database, Server, Endpoint, Identity Provider, Network Device
    owner = Column(String, default="Security Operations")
    business_unit = Column(String, nullable=False)
    business_service = Column(String, default="Core Operations")
    criticality = Column(String, default="Medium") # Critical, High, Medium, Low
    data_sensitivity = Column(String, default="Medium") # High, Medium, Low
    internet_exposure = Column(String, default="No") # Yes, No
    records_exposed = Column(Integer, default=5000)
    revenue_impact = Column(Float, default=1.0)
    downtime_cost = Column(Float, default=50000.0)
    regulatory_exposure = Column(Float, default=500000.0)
    reputation_factor = Column(Float, default=500000.0)
    status = Column(String, default="Active")
    
    # Financial Impact Variables
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

    organization = relationship("Organization", back_populates="assets")
    findings = relationship("Finding", back_populates="asset", cascade="all, delete-orphan", overlaps="organization,findings")
    business_impact = relationship("AssetBusinessImpact", back_populates="asset", uselist=False, cascade="all, delete-orphan", overlaps="organization,business_impact")

class AssetBusinessImpact(Base):
    __tablename__ = "asset_business_impact"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "asset_id"],
            ["assets.organization_id", "assets.id"],
            ondelete="CASCADE"
        ),
    )

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, nullable=False, index=True)
    asset_id = Column(String, nullable=False, index=True)
    downtime_cost_per_hour = Column(Float, default=50000.0)
    records_exposed = Column(Integer, default=5000)
    cost_per_record = Column(Float, default=150.0)
    regulatory_penalty = Column(Float, default=500000.0)
    recovery_cost = Column(Float, default=300000.0)
    reputation_factor = Column(Float, default=500000.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    asset = relationship("Asset", back_populates="business_impact", overlaps="organization,business_impact")

class Finding(Base):
    __tablename__ = "findings"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "asset_id"],
            ["assets.organization_id", "assets.id"],
            ondelete="CASCADE"
        ),
    )

    id = Column(String, primary_key=True, index=True) # FND-001
    organization_id = Column(String, ForeignKey("organizations.id"), primary_key=True, nullable=False, index=True)
    asset_id = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)
    title = Column(String, nullable=True)
    vulnerability = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, default="Medium")
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
    status = Column(String, default="Open")

    organization = relationship("Organization", back_populates="findings", overlaps="asset,findings")
    asset = relationship("Asset", back_populates="findings", overlaps="organization,findings")

class Control(Base):
    __tablename__ = "controls"

    id = Column(String, primary_key=True, index=True) # ctrl-mfa
    organization_id = Column(String, ForeignKey("organizations.id"), primary_key=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="Preventive")
    status = Column(String, default="Active")
    coverage = Column(Float, default=0.30)
    effectiveness = Column(Float, default=0.30)
    cost = Column(Float, nullable=False)
    reduction = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="controls")

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String, default="admin@cyberriskiq.io")
    actions = Column(JSON, default=dict)
    baseline_eal = Column(Float, default=0.0)
    simulated_eal = Column(Float, default=0.0)
    baseline_risk_score = Column(Float, default=0.0)
    simulated_risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="scenarios")

class InvestmentPortfolio(Base):
    __tablename__ = "investment_portfolios"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    budget = Column(Float, nullable=False)
    selected_portfolio = Column(JSON, default=list)
    total_cost = Column(Float, nullable=False)
    total_reduction = Column(Float, nullable=False)
    residual_eal = Column(Float, nullable=False)
    rosi = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="portfolios")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    asset_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default="High")
    status = Column(String, default="Proposed")
    potential_risk_reduction = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="recommendations")

class SecurityAssessmentRun(Base):
    __tablename__ = "security_assessment_runs"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), primary_key=True, nullable=False, index=True)
    target = Column(String, nullable=False)
    scope = Column(String, default="Standard Full Scope")
    mode = Column(String, default="DEMONSTRATION") # DEMONSTRATION or LIVE
    status = Column(String, default="queued")       # queued, running, normalizing, quantifying, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    findings_count = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.95)
    logs = Column(Text, default="")
    results_json = Column(JSON, default=dict)
    report_json = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="assessment_runs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String, default="admin@cyberriskiq.io")
    action = Column(String, nullable=False)
    entity_type = Column(String, default="Asset")
    entity_id = Column(String, nullable=False)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    details = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="audit_logs")
