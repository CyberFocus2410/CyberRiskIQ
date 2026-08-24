# backend/app/models/models.py
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

    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True) # AST-001
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Application, API, Database, Server, etc.
    owner = Column(String, default="Security Operations")
    business_unit = Column(String, nullable=False)
    business_service = Column(String, default="Core Banking Operations")
    criticality = Column(String, default="Medium") # Critical, High, Medium, Low
    data_sensitivity = Column(String, default="Medium") # High, Medium, Low
    internet_exposure = Column(String, default="No") # Yes, No
    dependencies = Column(JSON, default=list) # List of dependency asset IDs
    
    # Financial Impact Variables
    downtime_cost_per_hour = Column(Float, default=50000.0)
    records_exposed = Column(Integer, default=5000)
    cost_per_record = Column(Float, default=150.0)
    regulatory_penalty = Column(Float, default=500000.0)
    recovery_cost = Column(Float, default=300000.0)
    reputation_factor = Column(Float, default=500000.0)
    
    # Controls Effectiveness (0 - 100)
    controls = Column(JSON, default=lambda: {
        "mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30
    })

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="assets")
    findings = relationship("Finding", back_populates="asset", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, index=True) # FND-001
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    source = Column(String, nullable=False) # CyberRiskIQ AI Security Assessment, Scanner, etc.
    vulnerability = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    severity = Column(String, default="Medium") # Critical, High, Medium, Low
    cvss = Column(Float, default=5.0)
    exploit_available = Column(Boolean, default=False)
    internet_exposed = Column(Boolean, default=False)
    evidence = Column(Text, nullable=True)
    control_state = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    poc_attached = Column(Boolean, default=False)
    status = Column(String, default="Open") # Open, Remediated, Mitigated, In Progress
    confidence = Column(Float, default=0.95)
    discovered_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="findings")

class Control(Base):
    __tablename__ = "controls"

    id = Column(String, primary_key=True, index=True) # ctrl-mfa
    name = Column(String, nullable=False)
    type = Column(String, default="Preventive")
    cost = Column(Float, nullable=False)
    reduction = Column(Float, nullable=False) # Estimated risk reduction coefficient (0.0 - 1.0)
    description = Column(Text, nullable=True)
    default_coverage = Column(Float, default=0.30)
    target_coverage = Column(Float, default=0.95)

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    actions = Column(JSON, default=dict) # Key-value map of simulated control overrides
    baseline_eal = Column(Float, default=0.0)
    simulated_eal = Column(Float, default=0.0)
    baseline_risk_score = Column(Float, default=0.0)
    simulated_risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="scenarios")

class AssessmentRun(Base):
    __tablename__ = "assessment_runs"

    id = Column(String, primary_key=True, index=True)
    target = Column(String, nullable=False)
    mode = Column(String, default="DEMONSTRATION") # LIVE, DEMONSTRATION
    status = Column(String, default="Completed")
    findings_count = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.95)
    results_json = Column(JSON, default=dict)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, default="admin@finsecure.bank")
    action = Column(String, nullable=False) # Finding Ingestion, Control Adjustment, Scenario Run, Optimization Run
    entity = Column(String, nullable=False) # Asset, Control, Scenario, Optimizer
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)

    organization = relationship("Organization", back_populates="audit_logs")
