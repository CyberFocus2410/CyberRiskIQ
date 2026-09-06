# backend/tests/test_multi_tenancy.py
"""
CyberRiskIQ Multi-Tenancy & Tenant Data Isolation Test Suite.
Validates:
1. Strict cross-tenant isolation for assets, findings, and business units.
2. Independent calculation engines producing isolated metrics per organization.
3. Row-Level Security / tenant scoping preventing data leakage.
"""
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app, seed_database_if_empty
from backend.app.db.database import SessionLocal, engine, Base
from backend.app.models import models

class TestMultiTenancyIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database_if_empty()
        cls.client = TestClient(app)

    def test_tenant_data_isolation(self):
        # 1. Organization A: Apex Fintech
        headers_a = {"X-Organization-ID": "org-apex-fintech-101"}
        
        # Complete Onboarding for Org A
        res_a_onboard = self.client.post("/api/onboarding/complete", headers=headers_a, json={
            "organization": {
                "name": "Apex Fintech",
                "industry": "Fintech",
                "employees": 500,
                "annual_revenue": 200000000.0,
                "budget": 2000000.0,
                "risk_appetite": "Low"
            },
            "business_units": ["Apex Payments", "Apex Trading"],
            "assets": [
                {
                    "name": "Apex Core API Gateway",
                    "type": "API",
                    "business_unit": "Apex Payments",
                    "criticality": "Critical",
                    "downtime_cost_per_hour": 300000.0,
                    "records_exposed": 40000,
                    "cost_per_record": 200.0,
                    "regulatory_penalty": 2000000.0,
                    "recovery_cost": 800000.0,
                    "reputation_factor": 1500000.0
                }
            ],
            "initial_controls": {"mfa": 80, "patching": 70, "edr": 60, "segmentation": 50, "monitoring": 70, "backup": 80}
        })
        self.assertEqual(res_a_onboard.status_code, 200)

        # 2. Organization B: Beacon Health
        headers_b = {"X-Organization-ID": "org-beacon-health-202"}
        
        # Complete Onboarding for Org B
        res_b_onboard = self.client.post("/api/onboarding/complete", headers=headers_b, json={
            "organization": {
                "name": "Beacon Health",
                "industry": "Healthcare",
                "employees": 2500,
                "annual_revenue": 800000000.0,
                "budget": 5000000.0,
                "risk_appetite": "High"
            },
            "business_units": ["Patient Portal", "Clinical Trials", "Hospital Operations"],
            "assets": [
                {
                    "name": "Patient EHR Cloud Database",
                    "type": "Database",
                    "business_unit": "Patient Portal",
                    "criticality": "Critical",
                    "downtime_cost_per_hour": 100000.0,
                    "records_exposed": 500000,
                    "cost_per_record": 400.0,
                    "regulatory_penalty": 10000000.0,
                    "recovery_cost": 2500000.0,
                    "reputation_factor": 5000000.0
                },
                {
                    "name": "Clinical Trial Repository",
                    "type": "Application",
                    "business_unit": "Clinical Trials",
                    "criticality": "High",
                    "downtime_cost_per_hour": 50000.0,
                    "records_exposed": 10000,
                    "cost_per_record": 500.0,
                    "regulatory_penalty": 3000000.0,
                    "recovery_cost": 1000000.0,
                    "reputation_factor": 2000000.0
                }
            ],
            "initial_controls": {"mfa": 40, "patching": 40, "edr": 40, "segmentation": 40, "monitoring": 40, "backup": 40}
        })
        self.assertEqual(res_b_onboard.status_code, 200)

        # 3. Assert Asset Isolation
        assets_a = self.client.get("/api/assets", headers=headers_a).json()
        assets_b = self.client.get("/api/assets", headers=headers_b).json()

        self.assertEqual(len(assets_a), 1)
        self.assertEqual(assets_a[0]["name"], "Apex Core API Gateway")
        self.assertEqual(assets_a[0]["organization_id"], "org-apex-fintech-101")

        self.assertEqual(len(assets_b), 2)
        b_names = [a["name"] for a in assets_b]
        self.assertIn("Patient EHR Cloud Database", b_names)
        self.assertIn("Clinical Trial Repository", b_names)
        self.assertNotIn("Apex Core API Gateway", b_names)

        # 4. Assert Dashboard & EAL Calculation Isolation
        summary_a = self.client.get("/api/dashboard/summary", headers=headers_a).json()
        summary_b = self.client.get("/api/dashboard/summary", headers=headers_b).json()

        self.assertEqual(summary_a["organization_name"], "Apex Fintech")
        self.assertEqual(summary_a["asset_count"], 1)

        self.assertEqual(summary_b["organization_name"], "Beacon Health")
        self.assertEqual(summary_b["asset_count"], 2)

        # Verify that total EAL is completely distinct between Org A and Org B
        self.assertNotEqual(summary_a["total_eal"], summary_b["total_eal"])

        # 5. Assert Reset Isolation (Resetting Org A must not affect Org B)
        reset_a = self.client.post("/api/organization/reset", headers=headers_a)
        self.assertEqual(reset_a.status_code, 200)

        assets_a_after = self.client.get("/api/assets", headers=headers_a).json()
        self.assertEqual(len(assets_a_after), 0)

        assets_b_after = self.client.get("/api/assets", headers=headers_b).json()
        self.assertEqual(len(assets_b_after), 2) # Org B remains fully intact!

if __name__ == "__main__":
    unittest.main()
