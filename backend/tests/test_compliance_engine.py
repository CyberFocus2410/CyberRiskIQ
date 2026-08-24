# backend/tests/test_compliance_engine.py
"""
Unit tests for Regulatory Framework Alignment & Control Coverage (NIST, ISO 27001, RBI, SEBI, CIS).
"""
import unittest
from backend.app.services.compliance_engine import calculate_framework_posture
from backend.app.db.seed_data import generate_assets_seed

class TestComplianceEngine(unittest.TestCase):
    def test_framework_coverage(self):
        assets = generate_assets_seed()
        posture = calculate_framework_posture(assets, None)
        
        self.assertIn("nist", posture)
        self.assertIn("iso", posture)
        self.assertIn("rbi", posture)
        self.assertIn("sebi", posture)
        self.assertIn("cis", posture)

        for fw, data in posture.items():
            score = data["coverage_pct"]
            self.assertGreaterEqual(score, 0)
            self.assertLessEqual(score, 100)
            self.assertGreater(len(data["controls"]), 0)

if __name__ == "__main__":
    unittest.main()
