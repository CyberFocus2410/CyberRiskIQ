# backend/tests/test_risk_engine.py
"""
Unit tests for deterministic Risk Quantification Engine.
Validates bounded 10-100 scoring, exploitability modifiers, exposure boosts, and appetite multipliers.
"""
import unittest
from backend.app.services.risk_engine import (
    calculate_correlated_risk_indicator,
    calculate_asset_risk_score,
    aggregate_enterprise_risk
)

class TestRiskEngine(unittest.TestCase):
    def test_correlated_risk_indicator(self):
        # Base CVSS = 7.0, no exploit, internal
        f1 = {"cvss": 7.0, "exploit_available": False, "internet_exposed": False}
        a1 = {"internet_exposure": "No"}
        c1 = calculate_correlated_risk_indicator(f1, a1)
        self.assertEqual(c1, 7.0)

        # Exploit available (+1.2) on exposed asset (+1.5) -> 7.0 + 1.2 + 1.5 = 9.7
        f2 = {"cvss": 7.0, "exploit_available": True, "internet_exposed": True}
        a2 = {"internet_exposure": "Yes"}
        c2 = calculate_correlated_risk_indicator(f2, a2)
        self.assertAlmostEqual(c2, 9.7, places=2)

        # Clamping at max 10.0
        f3 = {"cvss": 9.5, "exploit_available": True, "internet_exposed": True}
        c3 = calculate_correlated_risk_indicator(f3, a2)
        self.assertEqual(c3, 10.0)

    def test_risk_score_bounds(self):
        # Clamped minimum boundary = 10
        asset_low = {
            "id": "AST-MIN",
            "criticality": "Low",
            "controls": {"mfa": 100, "patching": 100, "edr": 100, "segmentation": 100, "monitoring": 100, "backup": 100}
        }
        score_min = calculate_asset_risk_score(asset_low, [], risk_appetite="High")
        self.assertEqual(score_min, 10)

        # Clamped maximum boundary = 100
        asset_max = {
            "id": "AST-MAX",
            "criticality": "Critical",
            "internet_exposure": "Yes",
            "controls": {"mfa": 0, "patching": 0, "edr": 0, "segmentation": 0, "monitoring": 0, "backup": 0}
        }
        crit_finding = [{
            "asset_id": "AST-MAX",
            "cvss": 10.0,
            "exploit_available": True,
            "internet_exposed": True,
            "status": "Open"
        }]
        score_max = calculate_asset_risk_score(asset_max, crit_finding, risk_appetite="Low")
        self.assertEqual(score_max, 100)

if __name__ == "__main__":
    unittest.main()
