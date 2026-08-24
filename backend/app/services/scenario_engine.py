# backend/app/services/scenario_engine.py
"""
CyberRiskIQ Scenario Simulation Engine
Clones active risk state, applies hypothetical control modifications,
and recalculates risk and financial exposure dynamically without mutating baseline data.
"""
from typing import List, Dict, Any
import copy
from backend.app.services.risk_engine import calculate_asset_risk_score, aggregate_enterprise_risk
from backend.app.services.financial_engine import calculate_asset_eal, aggregate_enterprise_financials

def simulate_scenario(
    assets: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    simulated_controls: Dict[str, bool],
    simulated_exposure: Dict[str, Any],
    org_revenue: float = 500000000.0,
    org_employees: int = 1200,
    risk_appetite: str = "Medium"
) -> Dict[str, Any]:
    """
    Simulates hypothetical defensive changes against cloned state.
    Returns Before, After, and Delta metrics.
    """
    # 1. Baseline State Calculations
    baseline_scores = {
        a["id"]: calculate_asset_risk_score(a, findings, None, None, risk_appetite)
        for a in assets
    }
    baseline_ent_risk = aggregate_enterprise_risk(assets, findings, None, None, risk_appetite)
    baseline_financials = aggregate_enterprise_financials(
        assets, baseline_scores, org_revenue, org_employees, None
    )

    # 2. Simulated State Calculations (using overlays)
    simulated_scores = {
        a["id"]: calculate_asset_risk_score(
            a, findings, simulated_controls, simulated_exposure, risk_appetite
        )
        for a in assets
    }
    simulated_ent_risk = aggregate_enterprise_risk(
        assets, findings, simulated_controls, simulated_exposure, risk_appetite
    )
    simulated_financials = aggregate_enterprise_financials(
        assets, simulated_scores, org_revenue, org_employees, simulated_controls
    )

    # 3. Deltas & Reductions
    eal_delta = baseline_financials["total_eal"] - simulated_financials["total_eal"]
    eal_reduction_pct = (
        round((eal_delta / baseline_financials["total_eal"]) * 100.0, 2)
        if baseline_financials["total_eal"] > 0 else 0.0
    )

    risk_score_delta = baseline_ent_risk["enterprise_risk_score"] - simulated_ent_risk["enterprise_risk_score"]

    return {
        "baseline": {
            "enterprise_risk_score": baseline_ent_risk["enterprise_risk_score"],
            "total_eal": baseline_financials["total_eal"],
            "total_exposure": baseline_financials["total_financial_exposure"],
            "category_totals": baseline_financials["category_totals"]
        },
        "simulated": {
            "enterprise_risk_score": simulated_ent_risk["enterprise_risk_score"],
            "total_eal": simulated_financials["total_eal"],
            "total_exposure": simulated_financials["total_financial_exposure"],
            "category_totals": simulated_financials["category_totals"]
        },
        "delta": {
            "eal_reduction_inr": eal_delta,
            "eal_reduction_pct": eal_reduction_pct,
            "risk_score_reduction": risk_score_delta
        },
        "simulated_controls": simulated_controls,
        "simulated_exposure": simulated_exposure
    }
