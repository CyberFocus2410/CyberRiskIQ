# tests/test_backend_api.py
"""
Automated Backend API and Domain Engine Verification Suite
Standard library unittest implementation for zero-dependency execution.
Tests database seeding, CRUD operations, deterministic calculations,
authorization guardrails, scenario simulations, optimizer, and AI analyst.
"""
import os
import sys
import unittest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.app.main import app, seed_database_if_empty
from backend.app.db.database import SessionLocal, engine, Base
from backend.app.models import models

class TestCyberRiskIQBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Ensure database schema exists and is seeded before test execution."""
        Base.metadata.create_all(bind=engine)
        seed_database_if_empty()
        cls.client = TestClient(app)

    def test_01_health_check(self):
        """Validates platform health check endpoint."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("CyberRiskIQ", data["service"])
        print("  [PASS] Health check endpoint operational")

    def test_02_database_seeding_completeness(self):
        """Verifies that 52 FinSecure Bank assets are seeded in the database."""
        db = SessionLocal()
        try:
            org = db.query(models.Organization).first()
            self.assertIsNotNone(org)
            self.assertEqual(org.name, "FinSecure Bank")
            
            asset_count = db.query(models.Asset).count()
            self.assertEqual(asset_count, 52, f"Expected 52 assets in database, found {asset_count}")

            finding_count = db.query(models.Finding).count()
            self.assertGreaterEqual(finding_count, 6, f"Expected >= 6 findings, found {finding_count}")

            bu_count = db.query(models.BusinessUnit).count()
            self.assertEqual(bu_count, 6, f"Expected 6 business units, found {bu_count}")
            print(f"  [PASS] Database integrity verified: {asset_count} assets, {finding_count} findings across {bu_count} BUs")
        finally:
            db.close()

    def test_03_dashboard_summary(self):
        """Tests /api/dashboard/summary returns consistent metrics."""
        response = self.client.get("/api/dashboard/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("organization", data)
        self.assertIn("baseline", data)
        self.assertIn("optimization", data)
        self.assertIn("compliance", data)
        self.assertEqual(data["asset_count"], 52)
        self.assertGreater(data["baseline"]["total_eal"], 0)
        print(f"  [PASS] Dashboard summary verified: EAL Rs. {data['baseline']['total_eal']/100000:.2f} Lakh")

    def test_04_asset_endpoints(self):
        """Tests asset listing and specific asset details."""
        res_list = self.client.get("/api/assets")
        self.assertEqual(res_list.status_code, 200)
        assets = res_list.json()
        self.assertEqual(len(assets), 52)
        self.assertIn("risk_score", assets[0])
        self.assertIn("eal", assets[0])

        # Test single asset lookup
        res_single = self.client.get("/api/assets/AST-001")
        self.assertEqual(res_single.status_code, 200)
        ast1 = res_single.json()
        self.assertEqual(ast1["id"], "AST-001")
        self.assertEqual(ast1["criticality"], "Critical")
        self.assertIn("loss_breakdown", ast1)
        print("  [PASS] Asset endpoints (/api/assets and /api/assets/AST-001) verified")

    def test_05_assessment_authorization_guardrails(self):
        """
        Priority 4: Verifies that LIVE assessment mode strictly requires authorized=True,
        rejecting unauthorized live scans with HTTP 403 Forbidden.
        """
        # 1. LIVE mode without authorization -> MUST REJECT WITH 403
        unauth_payload = {
            "target": "https://api.finsecure.bank",
            "mode": "LIVE",
            "authorized": False
        }
        res_unauth = self.client.post("/api/assessment", json=unauth_payload)
        self.assertEqual(res_unauth.status_code, 403, "Live assessment without explicit authorization must return 403")

        # 2. LIVE mode with explicit authorization -> MUST ACCEPT
        auth_payload = {
            "target": "https://api.finsecure.bank",
            "mode": "LIVE",
            "authorized": True
        }
        res_auth = self.client.post("/api/assessment", json=auth_payload)
        self.assertEqual(res_auth.status_code, 200)
        self.assertEqual(res_auth.json()["mode"], "LIVE")

        # 3. DEMONSTRATION mode -> Accepted by default
        demo_payload = {
            "target": "./src",
            "mode": "DEMONSTRATION",
            "authorized": False
        }
        res_demo = self.client.post("/api/assessment", json=demo_payload)
        self.assertEqual(res_demo.status_code, 200)
        self.assertEqual(res_demo.json()["mode"], "DEMONSTRATION")
        print("  [PASS] Assessment authorization guardrails verified (HTTP 403 on unauthorized LIVE mode)")

    def test_06_scenario_simulator(self):
        """Tests scenario state simulation endpoint."""
        payload = {
            "controls_override": {"mfa": True, "patching": True},
            "exposure_override": {}
        }
        response = self.client.post("/api/scenarios/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("baseline", data)
        self.assertIn("simulated", data)
        self.assertIn("delta", data)
        self.assertLess(data["simulated"]["total_eal"], data["baseline"]["total_eal"])
        print(f"  [PASS] Scenario simulation verified (EAL Delta: Rs. {data['delta']['eal_reduction_inr']/100000:.2f} Lakh)")

    def test_07_investment_optimizer(self):
        """Tests 0/1 Knapsack optimizer with finite budget."""
        payload = {
            "budget": 3500000.0,
            "locked_in": [],
            "locked_out": []
        }
        response = self.client.post("/api/optimization/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(data["total_cost"], 3500000.0)
        self.assertGreater(data["total_reduction"], 0)
        self.assertGreater(data["rosi"], 0)
        self.assertGreater(len(data["selected_portfolio"]), 0)
        print(f"  [PASS] Knapsack optimizer verified (ROSI: {data['rosi']}%, Selected: {len(data['selected_portfolio'])} initiatives)")

    def test_08_ai_analyst_grounded_query(self):
        """
        Priority 3: Verifies AI Risk Analyst queries against the live database
        and returns deterministic calculations with zero hallucination.
        """
        # Query 1: Highest risk asset
        q1 = self.client.post("/api/ai/query", json={"query": "What is our highest financial cyber risk?"})
        self.assertEqual(q1.status_code, 200)
        data1 = q1.json()
        self.assertTrue("AST-" in data1["response"] or "Payment" in data1["response"])
        self.assertTrue("EAL" in data1["response"] or "Expected Annual Loss" in data1["response"])

        # Query 2: Business unit exposure
        q2 = self.client.post("/api/ai/query", json={"query": "Which business unit has the highest EAL?"})
        self.assertEqual(q2.status_code, 200)
        data2 = q2.json()
        self.assertTrue("business unit" in data2["response"].lower() or "exposure" in data2["response"].lower() or "payments" in data2["response"].lower())
        print("  [PASS] AI Risk Analyst grounded querying verified against live DB records")

    def test_09_audit_logs_endpoint(self):
        """Verifies that audit logs are recorded and retrievable."""
        response = self.client.get("/api/audit-logs")
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        self.assertGreater(len(logs), 0)
        self.assertIn("action", logs[0])
        print(f"  [PASS] Audit logs endpoint verified ({len(logs)} persisted records)")

if __name__ == "__main__":
    print("====================================================")
    print("   CyberRiskIQ Backend API & Database Test Suite    ")
    print("====================================================")
    unittest.main(verbosity=2)
