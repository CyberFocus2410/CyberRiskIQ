# backend/tests/test_assessment_engine_integration.py
import unittest
import os
import json
import shutil
import tempfile

from backend.app.services.assessment_engine import (
    sanitize_engine_error_message,
    prepare_fresh_run_dir,
    get_run_dir,
    RUNS_BASE_DIR
)
from backend.app.services.report_pipeline import (
    resolve_asset_internet_exposure,
    calculate_cvss_exploitability_subscore,
    is_exploit_available,
    map_owasp_category,
    generate_quantitative_report
)

class TestAssessmentEngineIntegration(unittest.TestCase):

    def test_sanitize_engine_error_message(self):
        # 1. Test Windows file path redaction
        win_err = "Traceback in C:\\Users\\Admin\\PROJECTS\\CyberRiskIQ\\strix\\strix\\interface\\main.py line 446"
        sanitized = sanitize_engine_error_message(win_err)
        self.assertNotIn("strix\\interface", sanitized)
        self.assertIn("[assessment engine internal path]", sanitized)

        # 2. Test Unix file path redaction
        unix_err = "Error in /usr/local/lib/python3.11/site-packages/strix/report/writer.py: file not found"
        sanitized_unix = sanitize_engine_error_message(unix_err)
        self.assertNotIn("/strix/report", sanitized_unix)
        self.assertIn("[assessment engine internal path]", sanitized_unix)

        # 3. Test module namespace redaction
        mod_err = "ModuleNotFoundError: No module named 'strix.interface.main'"
        sanitized_mod = sanitize_engine_error_message(mod_err)
        self.assertNotIn("strix.interface", sanitized_mod)
        self.assertIn("assessment_engine", sanitized_mod)

        # 4. Test branding header redaction
        brand_err = "[bold white]STRIX[/] ERROR: Docker daemon not running"
        sanitized_brand = sanitize_engine_error_message(brand_err)
        self.assertNotIn("STRIX", sanitized_brand)
        self.assertIn("CYBERRISKIQ ENGINE", sanitized_brand)

    def test_prepare_fresh_run_dir(self):
        test_run_id = "test-retry-run-9988"
        run_dir = os.path.join(RUNS_BASE_DIR, test_run_id)
        os.makedirs(run_dir, exist_ok=True)
        stale_file = os.path.join(run_dir, "vulnerabilities.json")
        with open(stale_file, "w") as f:
            f.write('{"stale": true}')

        self.assertTrue(os.path.exists(stale_file))

        # Re-run prepare_fresh_run_dir
        fresh_dir = prepare_fresh_run_dir(test_run_id)
        self.assertEqual(run_dir, fresh_dir)
        self.assertFalse(os.path.exists(stale_file), "Stale artifact was not wiped!")

        # Clean up
        shutil.rmtree(fresh_dir, ignore_errors=True)

    def test_resolve_asset_internet_exposure(self):
        context = [
            {"id": "AST-001", "name": "Payment Gateway", "internet_exposure": "Yes"},
            {"id": "AST-002", "name": "Core Ledger DB", "internet_exposure": "No"}
        ]

        # Exposed asset
        self.assertTrue(resolve_asset_internet_exposure("AST-001", context))
        # Internal non-exposed asset
        self.assertFalse(resolve_asset_internet_exposure("AST-002", context))
        # Unknown asset defaults to False and logs warning
        self.assertFalse(resolve_asset_internet_exposure("AST-999", context))

    def test_calculate_cvss_exploitability_subscore(self):
        # CVSS 3.1 Network, Low complexity, No privileges, No UI
        vector_max = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
        score_max = calculate_cvss_exploitability_subscore(vector_max)
        self.assertAlmostEqual(score_max, 3.89, delta=0.05)
        self.assertTrue(is_exploit_available(score_max))

        # Local, High complexity, High privileges, Required UI
        vector_min = "CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N"
        score_min = calculate_cvss_exploitability_subscore(vector_min)
        self.assertLess(score_min, 2.0)
        self.assertFalse(is_exploit_available(score_min, has_poc=False))

    def test_owasp_mapping_and_report_generation(self):
        self.assertEqual(map_owasp_category("Critical BOLA on Payment Endpoint", "CWE-284"), "A01:2021-Broken Access Control")
        self.assertEqual(map_owasp_category("Hardcoded GitHub Secret Token", "CWE-798"), "A02:2021-Cryptographic Failures")
        self.assertEqual(map_owasp_category("SQL Injection in Search API", "CWE-89"), "A03:2021-Injection")

        raw_output = {
            "timestamp": "2026-09-06T13:00:00Z",
            "endpoints_discovered": ["https://api.finsecure.internal/api/v1/charge"],
            "services_identified": ["Payment Gateway API"],
            "execution_traces": ["Probed endpoint with modified header"],
            "raw_findings": [
                {
                    "id": "FND-TEST-01",
                    "asset_id": "AST-001",
                    "vulnerability": "Critical BOLA in Payment API",
                    "severity": "Critical",
                    "cvss": 9.3,
                    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
                    "poc_description": "Unauthorized ledger extraction via X-Tenant-ID tampering",
                    "poc_script_code": "curl -H 'X-Tenant-ID: victim' https://api.finsecure.internal/api/v1/charge",
                    "evidence": "Returned 200 OK with cross-tenant data"
                }
            ]
        }

        context = [{"id": "AST-001", "name": "Payment Gateway API", "internet_exposure": "Yes"}]
        report = generate_quantitative_report(
            run_id="run-test-rep-01",
            target="https://api.finsecure.internal",
            scope="Full Scope",
            mode="LIVE",
            raw_engine_output=raw_output,
            assets_context=context
        )

        self.assertIn("findings", report)
        self.assertEqual(len(report["findings"]), 1)
        f = report["findings"][0]
        self.assertEqual(f["owasp_category"], "A01:2021-Broken Access Control")
        self.assertTrue(f["internet_exposed"])
        self.assertTrue(f["exploit_available"])
        self.assertIsNotNone(f["poc_script_code"])

if __name__ == '__main__':
    unittest.main()