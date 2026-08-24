# backend/tests/test_financial_engine.py
"""
Unit tests for Financial Loss & Expected Annual Loss (EAL) calculations.
Validates 5-factor potential loss itemization and deterministic incident probability mapping.
"""
import unittest
from backend.app.services.financial_engine import (
    calculate_asset_financial_impact,
    calculate_asset_eal,
    aggregate_enterprise_financials
)

class TestFinancialEngine(unittest.TestCase):
    def test_probability_calibration(self):
        asset = {"id": "AST-TEST", "recovery_cost": 300000.0}
        
        # Risk score 10 -> 1.0% annual probability
        eal_10 = calculate_asset_eal(asset, 10, 500000000.0, 1200, None)
        self.assertAlmostEqual(eal_10["incident_probability"], 0.01, places=4)

        # Risk score 100 -> 35.0% annual probability
        eal_100 = calculate_asset_eal(asset, 100, 500000000.0, 1200, None)
        self.assertAlmostEqual(eal_100["incident_probability"], 0.35, places=4)

    def test_loss_itemization(self):
        asset = {
            "id": "AST-001",
            "downtime_cost_per_hour": 450000.0,
            "records_exposed": 85000,
            "cost_per_record": 350.0,
            "regulatory_penalty": 6000000.0,
            "recovery_cost": 1800000.0,
            "reputation_factor": 4000000.0
        }
        impact = calculate_asset_financial_impact(asset, 500000000.0, 1200)
        self.assertEqual(impact["downtime_loss"], 450000.0 * 4) # 18 Lakh
        self.assertEqual(impact["data_breach_loss"], 85000 * 350.0) # 2.975 Cr
        self.assertEqual(impact["regulatory_loss"], 6000000.0)
        self.assertEqual(impact["recovery_loss"], 1800000.0)
        self.assertEqual(impact["reputation_loss"], 4000000.0)
        self.assertGreater(impact["total_potential_loss"], 40000000.0)

if __name__ == "__main__":
    unittest.main()
