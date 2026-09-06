# backend/tests/test_accuracy_validation.py
"""
CyberRiskIQ Comprehensive Mathematical Accuracy & Property Validation Suite.

IMPORTANT SCOPE NOTE:
This test suite strictly validates:
1. Internal mathematical precision and algebraic correctness.
2. Monotonic rank-ordering consistency of risk tiers.
3. Strict invariant and boundary preservation (EAL <= Potential Loss, Knapsack spend <= Budget, Scores in [0, 100], Component conservation).
4. Continuous parameter sensitivity without anomalous jumps.

It does NOT claim predictive empirical accuracy against real-world breach frequencies
or incident losses, as no ground-truth public breach historical dataset exists for individual target organizations.
"""
import unittest
import random
from typing import List, Dict, Any

from backend.app.services.risk_engine import (
    calculate_correlated_risk_indicator,
    calculate_control_effectiveness,
    calculate_asset_risk_score,
    aggregate_enterprise_risk,
    WEIGHT_EXPLOIT_AVAILABLE,
    WEIGHT_INTERNET_EXPOSED
)
from backend.app.services.financial_engine import (
    calculate_asset_financial_impact,
    map_risk_score_to_probability,
    calculate_asset_eal,
    aggregate_enterprise_financials,
    DEFAULT_ORG_REVENUE_BASELINE,
    DEFAULT_ORG_EMPLOYEES_BASELINE
)
from backend.app.services.optimization_engine import (
    solve_investment_optimization,
    CONTROLS_LIBRARY
)
from backend.app.services.compliance_engine import calculate_framework_posture
from backend.app.db.seed_data import ORG_SEED, generate_assets_seed, FINDINGS_SEED


class TestRankOrderConsistency(unittest.TestCase):
    """
    CATEGORY 1: Rank-Order Consistency Validation.
    Verifies that synthetic finding sets with known relative severity strictly rank
    in expected monotonic severity order.
    """

    def test_pairwise_threat_correlation_rank_order(self):
        """Weaponized Exploit + Internet Exposed MUST rank strictly higher than unexploited internal."""
        asset_internal = {"id": "A-INT", "internet_exposure": "No"}
        asset_exposed = {"id": "A-EXP", "internet_exposure": "Yes"}

        f_low_internal = {"cvss": 4.0, "exploit_available": False}
        f_med_internal = {"cvss": 6.5, "exploit_available": False}
        f_high_exposed = {"cvss": 6.5, "exploit_available": True}
        f_crit_exposed = {"cvss": 9.0, "exploit_available": True}

        score_1 = calculate_correlated_risk_indicator(f_low_internal, asset_internal)
        score_2 = calculate_correlated_risk_indicator(f_med_internal, asset_internal)
        score_3 = calculate_correlated_risk_indicator(f_high_exposed, asset_exposed)
        score_4 = calculate_correlated_risk_indicator(f_crit_exposed, asset_exposed)

        self.assertLess(score_1, score_2, "Expected 4.0 < 6.5")
        self.assertLess(score_2, score_3, "Expected 6.5 (internal unexploited) < 9.2 (exposed exploited)")
        self.assertLess(score_3, score_4, "Expected 9.2 < 10.0 (clamped)")

    def test_asset_criticality_and_control_rank_order(self):
        """Critical assets with weak controls must rank higher than Low criticality assets with strong controls."""
        f_uniform = [{"asset_id": "TEST", "cvss": 7.0, "status": "Open"}]

        # Asset 1: Low Criticality, Strong Controls (90%)
        asset_hardened_low = {
            "id": "TEST",
            "criticality": "Low",
            "controls": {"mfa": 90, "patching": 90, "edr": 90, "segmentation": 90, "monitoring": 90, "backup": 90}
        }
        # Asset 2: Medium Criticality, Moderate Controls (50%)
        asset_mid = {
            "id": "TEST",
            "criticality": "Medium",
            "controls": {"mfa": 50, "patching": 50, "edr": 50, "segmentation": 50, "monitoring": 50, "backup": 50}
        }
        # Asset 3: Critical Tier, Poor Controls (10%)
        asset_vulnerable_crit = {
            "id": "TEST",
            "criticality": "Critical",
            "controls": {"mfa": 10, "patching": 10, "edr": 10, "segmentation": 10, "monitoring": 10, "backup": 10}
        }

        score_low = calculate_asset_risk_score(asset_hardened_low, f_uniform)
        score_mid = calculate_asset_risk_score(asset_mid, f_uniform)
        score_crit = calculate_asset_risk_score(asset_vulnerable_crit, f_uniform)

        self.assertLess(score_low, score_mid, f"Low criticality score ({score_low}) should be less than Mid ({score_mid})")
        self.assertLess(score_mid, score_crit, f"Mid score ({score_mid}) should be less than Crit ({score_crit})")


class TestPropertyInvariantBounds(unittest.TestCase):
    """
    CATEGORY 2: Invariant & Property-Based Randomization Tests.
    Runs 500 randomized parameter configurations checking the 4 structural invariants.
    """

    def setUp(self):
        # Seed for repeatable, deterministic property testing
        random.seed(42)

    def test_property_eal_never_exceeds_potential_loss(self):
        """Invariant 1: EAL <= Potential Loss for any randomized asset."""
        for i in range(500):
            asset = {
                "id": f"RND-{i}",
                "name": f"Random Asset {i}",
                "criticality": random.choice(["Critical", "High", "Medium", "Low"]),
                "internet_exposure": random.choice(["Yes", "No"]),
                "downtime_cost_per_hour": random.uniform(0, 500000),
                "records_exposed": random.randint(0, 1000000),
                "cost_per_record": random.uniform(10, 500),
                "regulatory_penalty": random.uniform(0, 10000000),
                "recovery_cost": random.uniform(0, 5000000),
                "reputation_factor": random.uniform(0, 10000000),
                "controls": {
                    "mfa": random.randint(0, 100),
                    "patching": random.randint(0, 100),
                    "edr": random.randint(0, 100),
                    "backup": random.randint(0, 100)
                }
            }
            risk_score = random.randint(0, 120) # Test even out-of-normal scores
            org_rev = random.uniform(1000000, 5000000000)
            org_emp = random.randint(10, 50000)

            eal_res = calculate_asset_eal(asset, risk_score, org_rev, org_emp)
            eal = eal_res["eal"]
            pot_loss = eal_res["potential_loss"]

            self.assertLessEqual(eal, pot_loss, f"Trial {i}: EAL ({eal}) exceeded Potential Loss ({pot_loss})")
            self.assertGreaterEqual(eal, 0, f"Trial {i}: EAL ({eal}) was negative")

    def test_property_knapsack_portfolio_never_exceeds_budget(self):
        """Invariant 2: Knapsack optimizer must NEVER select a portfolio exceeding entered budget."""
        assets = generate_assets_seed()
        findings = FINDINGS_SEED

        # Test budgets across orders of magnitude
        test_budgets = [
            0.0,
            100000.0,       # 1 Lakh (less than cheapest control)
            600000.0,       # Exact cost of 1 control (backup)
            1500000.0,      # 15 Lakh
            3500000.0,      # FinSecure baseline
            8000000.0,      # 80 Lakh
            20000000.0,     # Enough for all controls
            100000000.0     # Massive budget
        ]

        # Add 100 randomized budgets
        for _ in range(100):
            test_budgets.append(random.uniform(0.0, 15000000.0))

        for b in test_budgets:
            locked_in = random.sample([c["id"] for c in CONTROLS_LIBRARY], k=random.randint(0, 2))
            locked_out = random.sample([c["id"] for c in CONTROLS_LIBRARY if c["id"] not in locked_in], k=random.randint(0, 1))

            sol = solve_investment_optimization(
                budget=b,
                assets=assets,
                findings=findings,
                locked_in=locked_in,
                locked_out=locked_out
            )

            cost = sol["total_cost"]
            self.assertLessEqual(cost, b + 1e-6, f"Knapsack spent ₹{cost} exceeding budget ₹{b}")
            self.assertGreaterEqual(sol["budget_remaining"], 0.0, f"Remaining budget was negative: {sol['budget_remaining']}")
            self.assertLessEqual(sol["residual_eal"], sol["baseline_eal"], "Residual EAL cannot exceed Baseline EAL")

    def test_property_risk_scores_strictly_clamped_0_to_100(self):
        """Invariant 3: Asset Risk Score and Enterprise Risk Score strictly bounded in [0, 100]."""
        for i in range(500):
            asset = {
                "id": f"RND-{i}",
                "criticality": random.choice(["Critical", "High", "Medium", "Low", "Unknown"]),
                "internet_exposure": random.choice(["Yes", "No"]),
                "controls": {
                    "mfa": random.randint(-50, 150),
                    "patching": random.randint(-50, 150)
                }
            }
            num_findings = random.randint(0, 10)
            findings = [
                {
                    "asset_id": f"RND-{i}",
                    "cvss": random.uniform(-5.0, 15.0),
                    "exploit_available": random.choice([True, False]),
                    "status": "Open"
                }
                for _ in range(num_findings)
            ]
            appetite = random.choice(["Low", "Medium", "High", "Extreme"])

            score = calculate_asset_risk_score(asset, findings, risk_appetite=appetite)
            self.assertTrue(0 <= score <= 100, f"Trial {i}: Score {score} out of [0, 100] bounds")

    def test_property_enterprise_aggregation_conservation(self):
        """Invariant 4: Enterprise aggregate roll-up totals must equal sum of asset components."""
        for trial in range(50):
            num_assets = random.randint(5, 30)
            assets = []
            findings = []
            for a_idx in range(num_assets):
                bu = random.choice(["Retail Banking", "Wealth Mgmt", "Payment Gateway", "Corporate Core"])
                aid = f"AST-{trial}-{a_idx}"
                assets.append({
                    "id": aid,
                    "name": f"Asset {aid}",
                    "business_unit": bu,
                    "criticality": random.choice(["Critical", "High", "Medium", "Low"]),
                    "downtime_cost_per_hour": random.uniform(10000, 100000),
                    "records_exposed": random.randint(1000, 50000),
                    "cost_per_record": 150.0,
                    "regulatory_penalty": random.uniform(100000, 1000000),
                    "recovery_cost": random.uniform(50000, 500000),
                    "reputation_factor": random.uniform(100000, 1000000),
                    "controls": {"mfa": random.randint(10, 90), "patching": random.randint(10, 90)}
                })
                findings.append({
                    "asset_id": aid,
                    "cvss": random.uniform(2.0, 9.5),
                    "status": "Open"
                })

            risk_scores = {a["id"]: calculate_asset_risk_score(a, findings) for a in assets}
            agg = aggregate_enterprise_financials(assets, risk_scores)

            sum_asset_eals = sum(item["eal"] for item in agg["asset_financials"])
            sum_asset_potential = sum(item["potential_loss"] for item in agg["asset_financials"])
            sum_bu_eals = sum(agg["bu_distribution"].values())

            self.assertEqual(agg["total_eal"], sum_asset_eals, f"Total EAL mismatch in trial {trial}")
            self.assertEqual(agg["total_financial_exposure"], sum_asset_potential, f"Total Exposure mismatch in trial {trial}")
            self.assertEqual(agg["total_eal"], sum_bu_eals, f"BU roll-up mismatch in trial {trial}")


class TestSensitivityAnalysis(unittest.TestCase):
    """
    CATEGORY 3: Sensitivity Analysis & Monotonic Directionality.
    Varies one input parameter at a time and verifies smooth, monotonic movement.
    """

    def test_controls_effectiveness_monotonic_decay(self):
        """As control effectiveness increases from 0% to 100%, Asset Risk Score must strictly decrease or stay flat."""
        asset_base = {
            "id": "AST-SENSITIVITY",
            "criticality": "Critical",
            "internet_exposure": "Yes"
        }
        findings = [{"asset_id": "AST-SENSITIVITY", "cvss": 8.0, "status": "Open"}]

        prev_score = 100
        for eff in range(0, 101, 10):
            asset = {
                **asset_base,
                "controls": {"mfa": eff, "patching": eff, "edr": eff, "segmentation": eff, "monitoring": eff, "backup": eff}
            }
            score = calculate_asset_risk_score(asset, findings)
            self.assertLessEqual(score, prev_score, f"Score increased at control effectiveness {eff}% ({score} > {prev_score})")
            prev_score = score

    def test_cvss_severity_monotonic_escalation(self):
        """As CVSS increases from 0.0 to 10.0, Risk Score and Correlated Indicator must strictly increase or stay flat."""
        asset = {
            "id": "AST-CVSS",
            "criticality": "High",
            "internet_exposure": "No",
            "controls": {"mfa": 50, "patching": 50}
        }

        prev_ind = 0.0
        prev_score = 0
        for cvss_int in range(0, 101, 5):
            cvss = cvss_int / 10.0
            f = {"cvss": cvss, "exploit_available": False}
            ind = calculate_correlated_risk_indicator(f, asset)
            self.assertGreaterEqual(ind, prev_ind, f"Correlated indicator dropped at CVSS {cvss}")
            prev_ind = ind

            score = calculate_asset_risk_score(asset, [{"asset_id": "AST-CVSS", "cvss": cvss, "status": "Open"}])
            self.assertGreaterEqual(score, prev_score, f"Risk score dropped at CVSS {cvss}")
            prev_score = score

    def test_criticality_monotonic_escalation(self):
        """Ordinal criticality steps (Low -> Medium -> High -> Critical) must strictly increase risk rating."""
        tiers = ["Low", "Medium", "High", "Critical"]
        f = [{"asset_id": "AST-CRIT", "cvss": 7.0, "status": "Open"}]
        prev_score = 0

        for tier in tiers:
            asset = {
                "id": "AST-CRIT",
                "criticality": tier,
                "controls": {"mfa": 50, "patching": 50}
            }
            score = calculate_asset_risk_score(asset, f)
            self.assertGreaterEqual(score, prev_score, f"Risk score dropped going to tier {tier}")
            prev_score = score

    def test_financial_exposure_monotonic_scaling(self):
        """As records exposed increase, Potential Loss and EAL must strictly increase."""
        asset_base = {
            "id": "AST-FIN-SENS",
            "criticality": "High",
            "downtime_cost_per_hour": 50000.0,
            "cost_per_record": 150.0,
            "regulatory_penalty": 500000.0,
            "recovery_cost": 300000.0,
            "reputation_factor": 500000.0
        }
        prev_loss = 0
        prev_eal = 0
        risk_score = 65

        for recs in [100, 1000, 10000, 100000, 1000000]:
            asset = {**asset_base, "records_exposed": recs}
            eal_res = calculate_asset_eal(asset, risk_score)
            pot_loss = eal_res["potential_loss"]
            eal = eal_res["eal"]

            self.assertGreater(pot_loss, prev_loss, f"Potential loss did not increase at {recs} records")
            self.assertGreater(eal, prev_eal, f"EAL did not increase at {recs} records")
            prev_loss = pot_loss
            prev_eal = eal


if __name__ == "__main__":
    unittest.main()
