# backend/tests/test_scenario_engine.py
"""
Unit tests for What-if Scenario Simulator.
Validates state cloning, control overlays, and delta calculations.
"""
import unittest
from backend.app.services.scenario_engine import simulate_scenario
from backend.app.db.seed_data import generate_assets_seed, FINDINGS_SEED

class TestScenarioEngine(unittest.TestCase):
    def setUp(self):
        self.assets = generate_assets_seed()
        self.findings = FINDINGS_SEED

    def test_mfa_simulation(self):
        res = simulate_scenario(
            assets=self.assets,
            findings=self.findings,
            simulated_controls={"mfa": True},
            simulated_exposure={}
        )
        self.assertLess(res["simulated"]["total_eal"], res["baseline"]["total_eal"])
        self.assertGreater(res["delta"]["eal_reduction_inr"], 0)
        self.assertGreater(res["delta"]["eal_reduction_pct"], 0)

if __name__ == "__main__":
    unittest.main()
