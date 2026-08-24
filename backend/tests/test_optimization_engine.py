# backend/tests/test_optimization_engine.py
"""
Unit tests for 0/1 Knapsack Security Investment Optimizer and ROSI calculation.
"""
import unittest
from backend.app.services.optimization_engine import solve_investment_optimization
from backend.app.db.seed_data import generate_assets_seed, FINDINGS_SEED

class TestOptimizationEngine(unittest.TestCase):
    def setUp(self):
        self.assets = generate_assets_seed()
        self.findings = FINDINGS_SEED

    def test_zero_budget(self):
        opt = solve_investment_optimization(0.0, self.assets, self.findings)
        self.assertEqual(opt["total_cost"], 0.0)
        self.assertEqual(len(opt["selected_portfolio"]), 0)

    def test_standard_budget(self):
        budget = 3500000.0 # 35 Lakh
        opt = solve_investment_optimization(budget, self.assets, self.findings)
        self.assertLessEqual(opt["total_cost"], budget)
        self.assertGreater(opt["total_reduction"], 0)
        self.assertGreater(opt["rosi"], 0)

    def test_lock_in_override(self):
        budget = 3500000.0
        opt = solve_investment_optimization(budget, self.assets, self.findings, locked_in=["ctrl-segmentation"])
        selected_ids = [c["id"] for c in opt["selected_portfolio"]]
        self.assertIn("ctrl-segmentation", selected_ids)

    def test_lock_out_override(self):
        budget = 3500000.0
        opt = solve_investment_optimization(budget, self.assets, self.findings, locked_out=["ctrl-mfa"])
        selected_ids = [c["id"] for c in opt["selected_portfolio"]]
        self.assertNotIn("ctrl-mfa", selected_ids)

if __name__ == "__main__":
    unittest.main()
