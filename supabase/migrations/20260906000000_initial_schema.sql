-- supabase/migrations/20260906000000_initial_schema.sql
-- CyberRiskIQ Multi-Tenant Database Schema with Row Level Security (RLS)
-- Compatible with Supabase PostgreSQL (Free Tier) & Standard PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) DEFAULT 'Banking & Financial Services',
    employees INTEGER DEFAULT 1200,
    annual_revenue NUMERIC(18, 2) DEFAULT 500000000.00, -- ₹50 Crore
    budget NUMERIC(18, 2) DEFAULT 3500000.00,          -- ₹35 Lakh
    risk_appetite VARCHAR(20) DEFAULT 'Medium',        -- 'Low', 'Medium', 'High'
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Users (Linked to Supabase auth.users if present)
CREATE TABLE IF NOT EXISTS organization_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    auth_user_id UUID, -- References auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'analyst', 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_user UNIQUE (organization_id, email)
);

-- 3. Business Units
CREATE TABLE IF NOT EXISTS business_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    criticality VARCHAR(20) DEFAULT 'High', -- 'Critical', 'High', 'Medium', 'Low'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Business Services
CREATE TABLE IF NOT EXISTS business_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    criticality VARCHAR(20) DEFAULT 'Critical',
    revenue_dependency NUMERIC(5, 2) DEFAULT 0.80,
    downtime_cost_per_hour NUMERIC(18, 2) DEFAULT 100000.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Assets
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) NOT NULL, -- e.g. AST-001
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_service_id UUID REFERENCES business_services(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Application, API, Database, Server, Endpoint, Identity Provider, Network Device
    owner VARCHAR(255) DEFAULT 'Security Operations',
    business_unit VARCHAR(150) NOT NULL,
    business_service VARCHAR(255) DEFAULT 'Core Operations',
    criticality VARCHAR(20) DEFAULT 'Medium',
    data_sensitivity VARCHAR(20) DEFAULT 'Medium',
    internet_exposure VARCHAR(10) DEFAULT 'No', -- 'Yes', 'No'
    status VARCHAR(50) DEFAULT 'Active',
    controls JSONB DEFAULT '{"mfa": 30, "patching": 30, "edr": 30, "segmentation": 30, "monitoring": 30, "backup": 30}'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, id)
);

-- 6. Asset Business Impact (5-Category Financial Loss Vectors)
CREATE TABLE IF NOT EXISTS asset_business_impact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    downtime_cost_per_hour NUMERIC(18, 2) DEFAULT 50000.00,
    records_exposed INTEGER DEFAULT 5000,
    cost_per_record NUMERIC(18, 2) DEFAULT 150.00,
    regulatory_penalty NUMERIC(18, 2) DEFAULT 500000.00,
    recovery_cost NUMERIC(18, 2) DEFAULT 300000.00,
    reputation_factor NUMERIC(18, 2) DEFAULT 500000.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (organization_id, asset_id) REFERENCES assets(organization_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_org_asset_impact UNIQUE (organization_id, asset_id)
);

-- 7. Controls Library
CREATE TABLE IF NOT EXISTS controls (
    id VARCHAR(64) NOT NULL, -- e.g. ctrl-mfa
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'Preventive',
    status VARCHAR(50) DEFAULT 'Active',
    cost NUMERIC(18, 2) NOT NULL,
    reduction NUMERIC(5, 2) NOT NULL, -- e.g. 0.25 (25% reduction)
    description TEXT,
    coverage NUMERIC(5, 2) DEFAULT 0.30,
    effectiveness NUMERIC(5, 2) DEFAULT 0.30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, id)
);

-- 8. Control Effectiveness Evidence
CREATE TABLE IF NOT EXISTS control_effectiveness_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id VARCHAR(64) NOT NULL,
    asset_id VARCHAR(64) NOT NULL,
    evidence TEXT NOT NULL,
    freshness VARCHAR(50) DEFAULT 'Current',
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Security Findings (Vulnerabilities & Scanner Detections)
CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(64) NOT NULL, -- e.g. FND-001
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    source VARCHAR(150) NOT NULL,
    title VARCHAR(255),
    vulnerability VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'Medium',
    cvss NUMERIC(4, 1) DEFAULT 5.0,
    exploitability NUMERIC(4, 2) DEFAULT 1.0,
    known_exploitation BOOLEAN DEFAULT FALSE,
    exploit_available BOOLEAN DEFAULT FALSE,
    internet_exposed BOOLEAN DEFAULT FALSE,
    evidence TEXT,
    control_state TEXT,
    remediation TEXT,
    poc_attached BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(4, 2) DEFAULT 0.95,
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'In Progress', 'Remediated', 'Mitigated'
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, id),
    FOREIGN KEY (organization_id, asset_id) REFERENCES assets(organization_id, id) ON DELETE CASCADE
);

-- 10. Security Assessment Runs (AI & Containerized Probing Engine)
CREATE TABLE IF NOT EXISTS assessment_runs (
    id VARCHAR(64) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    target VARCHAR(255) NOT NULL,
    mode VARCHAR(50) DEFAULT 'DEMONSTRATION', -- 'LIVE', 'DEMONSTRATION'
    status VARCHAR(50) DEFAULT 'Completed', -- 'Running', 'Completed', 'Failed'
    findings_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    confidence NUMERIC(4, 2) DEFAULT 0.95,
    results_json JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, id)
);

-- 11. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'High',
    status VARCHAR(50) DEFAULT 'Proposed',
    potential_risk_reduction NUMERIC(18, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Investment Portfolios (Knapsack Optimization Results)
CREATE TABLE IF NOT EXISTS investment_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    budget NUMERIC(18, 2) NOT NULL,
    selected_portfolio JSONB DEFAULT '[]'::jsonb,
    total_cost NUMERIC(18, 2) NOT NULL,
    total_reduction NUMERIC(18, 2) NOT NULL,
    residual_eal NUMERIC(18, 2) NOT NULL,
    rosi NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_email VARCHAR(255) DEFAULT 'admin@cyberriskiq.io',
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'Asset',
    entity_id VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    details TEXT
);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_business_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_effectiveness_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user's organization_id from JWT or organization_users table
CREATE OR REPLACE FUNCTION get_auth_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id')::UUID,
        (SELECT organization_id FROM organization_users WHERE auth_user_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Isolation Policies
DO $$
BEGIN
    -- Organizations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_organizations') THEN
        CREATE POLICY org_isolation_organizations ON organizations
            FOR ALL USING (id = get_auth_organization_id());
    END IF;

    -- Assets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_assets') THEN
        CREATE POLICY org_isolation_assets ON assets
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;

    -- Findings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_findings') THEN
        CREATE POLICY org_isolation_findings ON findings
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;

    -- Business Units
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_bu') THEN
        CREATE POLICY org_isolation_bu ON business_units
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;

    -- Controls
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_controls') THEN
        CREATE POLICY org_isolation_controls ON controls
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;

    -- Assessment Runs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_assessments') THEN
        CREATE POLICY org_isolation_assessments ON assessment_runs
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;

    -- Portfolios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_isolation_portfolios') THEN
        CREATE POLICY org_isolation_portfolios ON investment_portfolios
            FOR ALL USING (organization_id = get_auth_organization_id());
    END IF;
END $$;
