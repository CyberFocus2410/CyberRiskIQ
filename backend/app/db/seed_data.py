# backend/app/db/seed_data.py
"""
CyberRiskIQ Realistic Enterprise Synthetic Dataset: FinSecure Bank
Includes 50+ enterprise assets across Retail Banking, Corporate Banking, Payments, Digital Banking, IT, and HR.
"""
from typing import List, Dict, Any

ORG_SEED = {
    "id": "ORG-001",
    "name": "FinSecure Bank",
    "industry": "Banking & Financial Services",
    "employees": 1200,
    "annual_revenue": 500000000.0, # ₹50 Crore
    "budget": 3500000.0, # ₹35 Lakh
    "risk_appetite": "Medium"
}

BUSINESS_UNITS_SEED = [
    "Retail Banking",
    "Corporate Banking",
    "Payments & Settlement",
    "Digital Banking",
    "Core IT & Infrastructure",
    "Human Resources & Legal"
]

def generate_assets_seed() -> List[Dict[str, Any]]:
    """Generates 50+ enterprise assets with realistic parameters and dependencies."""
    base_assets = [
        # --- Payments & Settlement ---
        {
            "id": "AST-001",
            "name": "Payment Gateway API",
            "type": "API",
            "owner": "Priya Sharma (Head of Payments)",
            "business_unit": "Payments & Settlement",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "Yes",
            "dependencies": ["AST-003", "AST-006"],
            "business_service": "Checkout & Real-Time Card Processing",
            "downtime_cost_per_hour": 450000.0,
            "records_exposed": 85000,
            "cost_per_record": 350.0,
            "regulatory_penalty": 6000000.0,
            "recovery_cost": 1800000.0,
            "reputation_factor": 4000000.0,
            "controls": {"mfa": 35, "patching": 60, "edr": 85, "segmentation": 25, "monitoring": 70, "backup": 90}
        },
        {
            "id": "AST-002",
            "name": "Retail Internet Banking Portal",
            "type": "Application",
            "owner": "Amit Patel (Retail Ops VP)",
            "business_unit": "Retail Banking",
            "criticality": "High",
            "data_sensitivity": "Medium",
            "internet_exposure": "Yes",
            "dependencies": ["AST-001", "AST-004"],
            "business_service": "Customer Web Portal & Account View",
            "downtime_cost_per_hour": 250000.0,
            "records_exposed": 150000,
            "cost_per_record": 180.0,
            "regulatory_penalty": 2500000.0,
            "recovery_cost": 950000.0,
            "reputation_factor": 2000000.0,
            "controls": {"mfa": 90, "patching": 40, "edr": 55, "segmentation": 50, "monitoring": 65, "backup": 95}
        },
        {
            "id": "AST-003",
            "name": "Core Transaction Ledger DB (PostgreSQL)",
            "type": "Database",
            "owner": "Sanjay Kumar (Chief DBA)",
            "business_unit": "Payments & Settlement",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "No",
            "dependencies": [],
            "business_service": "Financial Ledger & Account Balances",
            "downtime_cost_per_hour": 650000.0,
            "records_exposed": 250000,
            "cost_per_record": 450.0,
            "regulatory_penalty": 15000000.0, # ₹1.5 Cr
            "recovery_cost": 3500000.0,
            "reputation_factor": 9000000.0,
            "controls": {"mfa": 45, "patching": 75, "edr": 90, "segmentation": 80, "monitoring": 85, "backup": 99}
        },
        {
            "id": "AST-004",
            "name": "Corporate Active Directory & IAM Server",
            "type": "Identity System",
            "owner": "Rajesh Nair (IT Security Lead)",
            "business_unit": "Core IT & Infrastructure",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "No",
            "dependencies": [],
            "business_service": "Single Sign-On & Employee Access Control",
            "downtime_cost_per_hour": 150000.0,
            "records_exposed": 6500,
            "cost_per_record": 150.0,
            "regulatory_penalty": 800000.0,
            "recovery_cost": 500000.0,
            "reputation_factor": 750000.0,
            "controls": {"mfa": 80, "patching": 70, "edr": 65, "segmentation": 40, "monitoring": 55, "backup": 85}
        },
        {
            "id": "AST-005",
            "name": "DevSecOps CI/CD & Code Repository",
            "type": "Application",
            "owner": "Vikram Mehta (VP Engineering)",
            "business_unit": "Core IT & Infrastructure",
            "criticality": "Medium",
            "data_sensitivity": "High",
            "internet_exposure": "Yes",
            "dependencies": [],
            "business_service": "Proprietary Algorithm Repository & Automated Builds",
            "downtime_cost_per_hour": 75000.0,
            "records_exposed": 1200,
            "cost_per_record": 1200.0,
            "regulatory_penalty": 1200000.0,
            "recovery_cost": 600000.0,
            "reputation_factor": 2500000.0,
            "controls": {"mfa": 95, "patching": 35, "edr": 30, "segmentation": 20, "monitoring": 45, "backup": 90}
        },
        {
            "id": "AST-006",
            "name": "UPI & Instant Payment Switch Node",
            "type": "Server",
            "owner": "Priya Sharma (Head of Payments)",
            "business_unit": "Payments & Settlement",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "No",
            "dependencies": ["AST-003"],
            "business_service": "National Instant Settlement Switch",
            "downtime_cost_per_hour": 500000.0,
            "records_exposed": 120000,
            "cost_per_record": 300.0,
            "regulatory_penalty": 10000000.0,
            "recovery_cost": 2500000.0,
            "reputation_factor": 7000000.0,
            "controls": {"mfa": 50, "patching": 65, "edr": 80, "segmentation": 75, "monitoring": 85, "backup": 95}
        },
        {
            "id": "AST-007",
            "name": "Mobile Banking iOS & Android API Gateway",
            "type": "API",
            "owner": "Neha Gupta (Digital Channels Lead)",
            "business_unit": "Digital Banking",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "Yes",
            "dependencies": ["AST-001", "AST-003"],
            "business_service": "Mobile Banking Application Backend",
            "downtime_cost_per_hour": 350000.0,
            "records_exposed": 180000,
            "cost_per_record": 220.0,
            "regulatory_penalty": 5500000.0,
            "recovery_cost": 1500000.0,
            "reputation_factor": 4500000.0,
            "controls": {"mfa": 85, "patching": 50, "edr": 70, "segmentation": 45, "monitoring": 75, "backup": 90}
        },
        {
            "id": "AST-008",
            "name": "SWIFT Corporate Wire Transfer Terminal",
            "type": "Server",
            "owner": "Karan Malhotra (Corporate Banking Head)",
            "business_unit": "Corporate Banking",
            "criticality": "Critical",
            "data_sensitivity": "High",
            "internet_exposure": "No",
            "dependencies": ["AST-003", "AST-004"],
            "business_service": "Cross-Border Commercial Remittances",
            "downtime_cost_per_hour": 800000.0,
            "records_exposed": 15000,
            "cost_per_record": 1500.0,
            "regulatory_penalty": 20000000.0, # ₹2.0 Cr
            "recovery_cost": 5000000.0,
            "reputation_factor": 15000000.0,
            "controls": {"mfa": 90, "patching": 80, "edr": 95, "segmentation": 90, "monitoring": 90, "backup": 99}
        },
        {
            "id": "AST-009",
            "name": "Trade Finance & Letter of Credit Engine",
            "type": "Application",
            "owner": "Karan Malhotra (Corporate Banking Head)",
            "business_unit": "Corporate Banking",
            "criticality": "High",
            "data_sensitivity": "Medium",
            "internet_exposure": "No",
            "dependencies": ["AST-008"],
            "business_service": "Commercial Trade Credit Validation",
            "downtime_cost_per_hour": 180000.0,
            "records_exposed": 8000,
            "cost_per_record": 500.0,
            "regulatory_penalty": 1500000.0,
            "recovery_cost": 700000.0,
            "reputation_factor": 1800000.0,
            "controls": {"mfa": 75, "patching": 60, "edr": 60, "segmentation": 50, "monitoring": 60, "backup": 85}
        },
        {
            "id": "AST-010",
            "name": "HR Employee Payroll & Benefits Portal",
            "type": "Application",
            "owner": "Ananya Sen (Chief Human Resources Officer)",
            "business_unit": "Human Resources & Legal",
            "criticality": "Medium",
            "data_sensitivity": "High",
            "internet_exposure": "Yes",
            "dependencies": ["AST-004"],
            "business_service": "Employee Payroll & Tax Disclosures",
            "downtime_cost_per_hour": 40000.0,
            "records_exposed": 4500,
            "cost_per_record": 200.0,
            "regulatory_penalty": 750000.0,
            "recovery_cost": 300000.0,
            "reputation_factor": 600000.0,
            "controls": {"mfa": 85, "patching": 55, "edr": 40, "segmentation": 30, "monitoring": 40, "backup": 85}
        }
    ]

    # Dynamically expand to 52 structured enterprise assets across the 6 units
    units = BUSINESS_UNITS_SEED
    asset_types = ["Application", "API", "Database", "Server", "Endpoint", "Cloud Resource", "Network Device"]
    
    extra_assets = []
    for i in range(11, 53):
        bu = units[(i - 11) % len(units)]
        atype = asset_types[(i - 11) % len(asset_types)]
        is_crit = "Critical" if i % 7 == 0 else "High" if i % 3 == 0 else "Medium" if i % 2 == 0 else "Low"
        is_exp = "Yes" if i % 4 == 0 else "No"
        
        extra_assets.append({
            "id": f"AST-{i:03d}",
            "name": f"{bu} {atype} Node {i}",
            "type": atype,
            "owner": f"Team Lead ({bu})",
            "business_unit": bu,
            "criticality": is_crit,
            "data_sensitivity": "High" if is_crit in ["Critical", "High"] else "Medium",
            "internet_exposure": is_exp,
            "dependencies": [f"AST-{(i-1):03d}"] if i % 3 == 0 else [],
            "business_service": f"{bu} Core Sub-service {i}",
            "downtime_cost_per_hour": 30000.0 * (4 if is_crit == "Critical" else 2 if is_crit == "High" else 1),
            "records_exposed": 2000 * i,
            "cost_per_record": 150.0,
            "regulatory_penalty": 300000.0 * (5 if is_crit == "Critical" else 2 if is_crit == "High" else 1),
            "recovery_cost": 150000.0 * (3 if is_crit == "Critical" else 1),
            "reputation_factor": 250000.0 * (4 if is_crit == "Critical" else 1),
            "controls": {
                "mfa": 40 + (i % 50),
                "patching": 35 + (i % 45),
                "edr": 50 + (i % 40),
                "segmentation": 30 + (i % 60),
                "monitoring": 45 + (i % 45),
                "backup": 80 + (i % 18)
            }
        })

    return base_assets + extra_assets


FINDINGS_SEED = [
    {
        "id": "FND-001",
        "source": "CyberRiskIQ AI Security Assessment",
        "asset_id": "AST-001",
        "vulnerability": "Broken Object Level Authorization (BOLA) in /api/v1/payments/charge",
        "title": "BOLA Endpoint Vulnerability on Payment Gateway",
        "severity": "Critical",
        "cvss": 9.8,
        "exploit_available": True,
        "internet_exposed": True,
        "evidence": "Exploited BOLA via customized Authorization header parameters to pull other customer payment tokens. Response: HTTP 200 OK with sensitive JSON payload containing Card Holder details.",
        "control_state": "Weak input sanitization and inadequate endpoint auth verification.",
        "remediation": "Implement server-side object-level permission verification and tenant scoping on all payment endpoints.",
        "poc_attached": True,
        "status": "Open",
        "confidence": 0.98
    },
    {
        "id": "FND-002",
        "source": "Internal Vulnerability Scanner",
        "asset_id": "AST-002",
        "vulnerability": "Outdated Apache Web Server Package (CVE-2023-45678)",
        "title": "Outdated Apache HTTP Server",
        "severity": "High",
        "cvss": 7.5,
        "exploit_available": True,
        "internet_exposed": True,
        "evidence": "Apache version 2.4.56 detected on retail web tier. Version is vulnerable to Denial of Service and remote code execution.",
        "control_state": "Patch cycle delay - pending monthly remediation window.",
        "remediation": "Upgrade Apache HTTP Server to latest patched version 2.4.59+.",
        "poc_attached": False,
        "status": "Open",
        "confidence": 0.95
    },
    {
        "id": "FND-003",
        "source": "Internal Vulnerability Scanner",
        "asset_id": "AST-003",
        "vulnerability": "Unencrypted Database Backups on Local Drive",
        "title": "Unencrypted Database Dump Files",
        "severity": "High",
        "cvss": 8.1,
        "exploit_available": False,
        "internet_exposed": False,
        "evidence": "Found standard .sql dumps on directory /var/backup/ without password-protected gzip compression or KMS encryption.",
        "control_state": "Backup policy violation - local control failed to enforce encryption key.",
        "remediation": "Enforce automated GPG/AES-256 encryption on all database dumps before writing to disk.",
        "poc_attached": False,
        "status": "Open",
        "confidence": 0.92
    },
    {
        "id": "FND-004",
        "source": "Active Directory Auditor",
        "asset_id": "AST-004",
        "vulnerability": "Kerberoasting Vulnerability in Admin Service Accounts",
        "title": "Weak SPN Encryption Keys on Domain Controller",
        "severity": "Medium",
        "cvss": 6.5,
        "exploit_available": True,
        "internet_exposed": False,
        "evidence": "Found 4 service accounts with high privileges using weak SPN encryption keys, allowing offline brute-force cracking.",
        "control_state": "MFA active for normal users, but service accounts are bypassed.",
        "remediation": "Rotate service account passwords to AES-256 32+ character keys and enforce gMSA.",
        "poc_attached": False,
        "status": "Open",
        "confidence": 0.90
    },
    {
        "id": "FND-005",
        "source": "CyberRiskIQ AI Security Assessment",
        "asset_id": "AST-005",
        "vulnerability": "Hardcoded GitHub Access Token in CI/CD pipeline scripts",
        "title": "Exposed Personal Access Token in Workflow",
        "severity": "Critical",
        "cvss": 9.3,
        "exploit_available": True,
        "internet_exposed": True,
        "evidence": "Extracted active PAT token from actions workflow logs. Token has admin permissions on the main code repositories.",
        "control_state": "Pipeline secrets not configured in Github Secrets manager.",
        "remediation": "Revoke and rotate the exposed GitHub PAT. Configure GitHub Secret Store or HashiCorp Vault.",
        "poc_attached": True,
        "status": "Open",
        "confidence": 0.99
    },
    {
        "id": "FND-006",
        "source": "CyberRiskIQ AI Security Assessment",
        "asset_id": "AST-007",
        "vulnerability": "Insecure Direct Object Reference (IDOR) on Mobile Account Statement API",
        "title": "IDOR on Statement Retrieval Endpoint",
        "severity": "Critical",
        "cvss": 9.1,
        "exploit_available": True,
        "internet_exposed": True,
        "evidence": "Manipulating account_num in GET /api/v2/statements?account_num=ACC98124 returned statements of other customer accounts.",
        "control_state": "Gateway token validation exists but downstream service omitted tenant boundary check.",
        "remediation": "Enforce strict session-bound customer context in statement generation microservice.",
        "poc_attached": True,
        "status": "Open",
        "confidence": 0.97
    }
]
