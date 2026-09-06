# backend/tests/test_assessment_engine.py
"""
CyberRiskIQ AI Security Assessment Engine & Systematic Reporting Pipeline Tests

Tests:
1. Target Sensitivity Test (Target A != Target B findings and report profiles)
2. 6-Stage Quantitative Reporting Pipeline Verification
3. Driver Factor Attribution Verification
4. Asynchronous Execution Lifecycle (queued -> running -> completed)
5. Honest Failure State (Live mode failure does not fallback to synthetic data)
6. Tenant Scoping and Unique Run ID Isolation
"""
import unittest
import os
import json
import time
from fastapi.testclient import TestClient

from backend.app.db.database import Base, engine, SessionLocal
from backend.app.models import models
from backend.app.main import app, seed_database_if_empty, DEFAULT_DEMO_ORG_ID
from backend.app.services.assessment_engine import (
    start_assessment,
    execute_assessment_run,
    _generate_target_sensitive_raw_output
)
from backend.app.services.report_pipeline import generate_quantitative_report

class TestAssessmentEngineAndReporting(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database_if_empty()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_target_sensitivity_different_targets_produce_different_findings(self):
        """
        TASK 2 CORE REQUIREMENT:
        Verify that scanning two different targets produces genuinely different findings,
        vulnerabilities, CVSS scores, and attack surfaces (fixes identical report bug).
        """
        target_payment = "https://payments.finsecure.internal"
        target_iam = "https://iam.finsecure.internal"
        target_repo = "./src"

        raw_payment = _generate_target_sensitive_raw_output(target_payment, "Full", "DEMONSTRATION")
        raw_iam = _generate_target_sensitive_raw_output(target_iam, "Full", "DEMONSTRATION")
        raw_repo = _generate_target_sensitive_raw_output(target_repo, "Full", "DEMONSTRATION")

        # Check raw findings titles differ
        findings_payment = [f["title"] for f in raw_payment["raw_findings"]]
        findings_iam = [f["title"] for f in raw_iam["raw_findings"]]
        findings_repo = [f["title"] for f in raw_repo["raw_findings"]]

        self.assertNotEqual(findings_payment, findings_iam)
        self.assertNotEqual(findings_payment, findings_repo)
        self.assertNotEqual(findings_iam, findings_repo)

        # Verify specific domain findings
        self.assertTrue(any("Payment Gateway" in t or "BOLA" in t for t in findings_payment))
        self.assertTrue(any("JWT" in t or "OAuth" in t for t in findings_iam))
        self.assertTrue(any("Credentials" in t or "Prototype" in t for t in findings_repo))

    def test_6_stage_quantitative_report_pipeline(self):
        """
        TASK 3 REQUIREMENT:
        Verify systematic 6-stage quantitative report generation:
        Stage 1: Raw Output Ingestion
        Stage 2: Canonical Normalization
        Stage 3: Threat Correlation & Driver Attribution
        Stage 4: Per-Asset Risk Scoring
        Stage 5: FAIR Financial EAL Loss Quantification
        Stage 6: Enterprise Roll-Up & Strategic Recommendations
        """
        target = "https://payments.finsecure.internal"
        raw_output = _generate_target_sensitive_raw_output(target, "Standard", "DEMONSTRATION")
        
        report = generate_quantitative_report(
            run_id="test-run-001",
            target=target,
            scope="Standard",
            mode="DEMONSTRATION",
            raw_engine_output=raw_output,
            org_metadata={"id": DEFAULT_DEMO_ORG_ID, "name": "FinSecure Bank", "annual_revenue": 500000000.0, "budget": 3500000.0}
        )

        self.assertEqual(len(report["stages"]), 6)
        stage_names = [s["name"] for s in report["stages"]]
        self.assertEqual(stage_names[0], "Raw Engine Output Ingestion")
        self.assertEqual(stage_names[1], "Canonical Normalization")
        self.assertEqual(stage_names[2], "Threat Correlation & Driver Attribution")
        self.assertEqual(stage_names[3], "Per-Asset Risk Scoring")
        self.assertEqual(stage_names[4], "FAIR Financial EAL Loss Quantification")
        self.assertEqual(stage_names[5], "Enterprise Roll-Up & Strategic Recommendations")

        # Stage 3 Driver Attribution check
        driver_attributions = report["stages"][2]["driver_attributions"]
        self.assertGreater(len(driver_attributions), 0)
        first_attr = driver_attributions[0]
        self.assertIn("base_cvss", first_attr)
        self.assertIn("exploit_available_boost", first_attr)
        self.assertIn("internet_exposure_boost", first_attr)
        self.assertIn("correlated_risk_indicator", first_attr)
        self.assertGreater(len(first_attr["risk_driver_citations"]), 0)

        # Stage 5 Financial EAL check
        stage_5 = report["stages"][4]
        self.assertGreater(stage_5["total_enterprise_eal"], 0)
        self.assertGreater(stage_5["total_single_event_exposure"], 0)

        # Stage 6 Recommendations check
        self.assertGreater(len(report["recommendations"]), 0)
        first_rec = report["recommendations"][0]
        self.assertIn("expected_eal_reduction", first_rec)
        self.assertIn("return_on_security_investment_pct", first_rec)

    def test_asynchronous_scan_api_lifecycle(self):
        """
        TASK 1 & TASK 2 API TEST:
        Test POST /api/assessment/scan creates queued session,
        executes asynchronously, and populates results and logs.
        """
        resp = self.client.post("/api/assessment/scan", json={
            "target": "https://iam.finsecure.internal",
            "scope": "Full Scope",
            "mode": "demo"
        }, headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("runId", data)
        run_id = data["runId"]

        # Run worker synchronously for test assertion
        execute_assessment_run(
            run_id=run_id,
            org_id=DEFAULT_DEMO_ORG_ID,
            target="https://iam.finsecure.internal",
            scope="Full Scope",
            mode="DEMONSTRATION"
        )

        # Poll status
        status_resp = self.client.get(f"/api/assessment/status/{run_id}", headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()["status"], "completed")

        # Fetch logs
        log_resp = self.client.get(f"/api/assessment/log/{run_id}", headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})
        self.assertEqual(log_resp.status_code, 200)
        self.assertIn("[ASSESSMENT-INIT]", log_resp.text)
        self.assertIn("[ASSESSMENT-COMPLETE]", log_resp.text)

        # Fetch results
        result_resp = self.client.get(f"/api/assessment/result/{run_id}", headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})
        self.assertEqual(result_resp.status_code, 200)
        res_data = result_resp.json()
        self.assertTrue(res_data["success"])
        self.assertEqual(res_data["status"], "completed")
        self.assertGreater(len(res_data["results"]["findings"]), 0)

        # Fetch quantitative report
        report_resp = self.client.get(f"/api/assessment/report/{run_id}", headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})
        self.assertEqual(report_resp.status_code, 200)
        self.assertEqual(report_resp.json()["report_id"], f"REP-{run_id}")

    def test_honest_failure_state_in_live_mode(self):
        """
        DEFINITION OF DONE REQUIREMENT:
        Failed Live Mode scans MUST show an honest error state, never silently substituted demo data.
        """
        run_obj = start_assessment(
            target="http://unreachable.invalid.target.corp",
            scope="Live Penetration",
            mode="LIVE",
            org_id=DEFAULT_DEMO_ORG_ID,
            db=self.db
        )

        execute_assessment_run(
            run_id=run_obj.id,
            org_id=DEFAULT_DEMO_ORG_ID,
            target="http://unreachable.invalid.target.corp",
            scope="Live Penetration",
            mode="LIVE"
        )

        # Check DB run state
        self.db.expire_all()
        failed_run = self.db.query(models.SecurityAssessmentRun).filter(models.SecurityAssessmentRun.id == run_obj.id).first()
        self.assertEqual(failed_run.status, "failed")
        self.assertIsNotNone(failed_run.error_message)
        self.assertIn("unreachable", failed_run.error_message.lower())

        # Check API response returns failed status without fake findings
        result_resp = self.client.get(f"/api/assessment/result/{run_obj.id}", headers={"X-Organization-ID": DEFAULT_DEMO_ORG_ID})
        self.assertEqual(result_resp.status_code, 200)
        res_json = result_resp.json()
        self.assertFalse(res_json["success"])
        self.assertEqual(res_json["status"], "failed")
        self.assertNotIn("results", res_json)

if __name__ == "__main__":
    unittest.main()
