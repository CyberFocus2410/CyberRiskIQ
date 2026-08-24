# backend/tests/test_api.py
"""
Automated Backend API and Database Persistence Integration Tests.
"""
import os
import sys
import unittest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi.testclient import TestClient
from backend.app.main import app, seed_database_if_empty
from backend.app.db.database import SessionLocal, engine, Base
from backend.app.models import models

class TestCyberRiskIQAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database_if_empty()
        cls.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)

    def test_database_persistence_and_seed(self):
        db = SessionLocal()
        try:
            self.assertEqual(db.query(models.Asset).count(), 52)
            self.assertGreaterEqual(db.query(models.Finding).count(), 6)
        finally:
            db.close()

    def test_summary_and_assets(self):
        res_sum = self.client.get("/api/dashboard/summary")
        self.assertEqual(res_sum.status_code, 200)
        self.assertEqual(res_sum.json()["asset_count"], 52)

        res_ast = self.client.get("/api/assets/AST-001")
        self.assertEqual(res_ast.status_code, 200)
        self.assertEqual(res_ast.json()["id"], "AST-001")

    def test_live_assessment_guardrails(self):
        # Must return 403 on unauthenticated/unauthorized live scans
        unauth = self.client.post("/api/assessment", json={"target": "https://api.finsecure.bank", "mode": "LIVE", "authorized": False})
        self.assertEqual(unauth.status_code, 403)

        # Authorized live scan returns 200
        auth = self.client.post("/api/assessment", json={"target": "https://api.finsecure.bank", "mode": "LIVE", "authorized": True})
        self.assertEqual(auth.status_code, 200)

    def test_optimizer_and_scenarios(self):
        opt = self.client.post("/api/optimization/run", json={"budget": 3500000.0})
        self.assertEqual(opt.status_code, 200)
        self.assertLessEqual(opt.json()["total_cost"], 3500000.0)

        scen = self.client.post("/api/scenarios/simulate", json={"controls_override": {"mfa": True}})
        self.assertEqual(scen.status_code, 200)
        self.assertGreater(scen.json()["delta"]["eal_reduction_inr"], 0)

    def test_grounded_ai_query(self):
        ai = self.client.post("/api/ai/query", json={"query": "What is our highest financial cyber risk?"})
        self.assertEqual(ai.status_code, 200)
        self.assertTrue("AST-" in ai.json()["response"] or "Payment" in ai.json()["response"])

if __name__ == "__main__":
    unittest.main()
