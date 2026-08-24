# backend/app/services/optimization_engine.py
"""
CyberRiskIQ Security Investment Optimizer
Dynamic Programming 0/1 Knapsack Solver for budget-constrained security investment.
Calculates maximum EAL reduction, residual risk, and ROSI.
"""
from typing import List, Dict, Any, Optional
import copy
from backend.app.services.risk_engine import calculate_asset_risk_score
from backend.app.services.financial_engine import calculate_asset_eal

CONTROLS_LIBRARY = [
    {
        "id": "ctrl-mfa",
        "key": "mfa",
        "name": "Enforce Strong MFA & PAM",
        "cost": 1200000.0, # ₹12 Lakh
        "reduction": 0.25,
        "description": "Reduces Threat Likelihood for access breaches and credential replay."
    },
    {
        "id": "ctrl-patching",
        "key": "patching",
        "name": "Continuous Automated Patching",
        "cost": 1500000.0, # ₹15 Lakh
        "reduction": 0.30,
        "description": "Remediates known vulnerabilities and lowers exploitability ratings."
    },
    {
        "id": "ctrl-edr",
        "key": "edr",
        "name": "Deploy Next-Gen EDR Agent",
        "cost": 1800000.0, # ₹18 Lakh
        "reduction": 0.35,
        "description": "Improves endpoint detection and rapid automated isolation."
    },
    {
        "id": "ctrl-segmentation",
        "key": "segmentation",
        "name": "Micro-segmentation & Zero Trust Network",
        "cost": 2500000.0, # ₹25 Lakh
        "reduction": 0.40,
        "description": "Minimizes horizontal blast radius between apps and critical databases."
    },
    {
        "id": "ctrl-monitoring",
        "key": "monitoring",
        "name": "24/7 SOC & SIEM Monitoring",
        "cost": 1000000.0, # ₹10 Lakh
        "reduction": 0.20,
        "description": "Improves early detection and incident responsiveness."
    },
    {
        "id": "ctrl-backup",
        "key": "backup",
        "name": "Immutable Encrypted Cloud Backups",
        "cost": 600000.0, # ₹6 Lakh
        "reduction": 0.15,
        "description": "Drastically lowers data recovery and restoration expenses by 70%."
    }
]

def calculate_control_benefit(
    control: Dict[str, Any],
    assets: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    baseline_eal: float,
    org_revenue: float = 500000000.0,
    org_employees: int = 1200,
    risk_appetite: str = "Medium"
) -> float:
    """
    Evaluates individual control's EAL reduction impact across all enterprise assets.
    """
    key = control["key"]
    simulated_ctrls = {key: True}
    
    sim_eal = 0.0
    for asset in assets:
        score = calculate_asset_risk_score(asset, findings, simulated_ctrls, None, risk_appetite)
        res = calculate_asset_eal(asset, score, org_revenue, org_employees, simulated_ctrls)
        sim_eal += res["eal"]

    reduction = max(0.0, baseline_eal - sim_eal)
    return reduction


def solve_investment_optimization(
    budget: float,
    assets: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    org_revenue: float = 500000000.0,
    org_employees: int = 1200,
    risk_appetite: str = "Medium",
    locked_in: Optional[List[str]] = None,
    locked_out: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    0/1 Knapsack Dynamic Programming optimization.
    Returns optimal control portfolio, remaining budget, EAL reduction, residual EAL, and ROSI.
    """
    locked_in_ids = locked_in or []
    locked_out_ids = locked_out or []

    # Calculate baseline active EAL
    baseline_eal = 0.0
    for asset in assets:
        score = calculate_asset_risk_score(asset, findings, None, None, risk_appetite)
        res = calculate_asset_eal(asset, score, org_revenue, org_employees, None)
        baseline_eal += res["eal"]

    # Filter available controls
    candidate_controls = [c for c in CONTROLS_LIBRARY if c["id"] not in locked_out_ids]

    # Precalculate benefits
    evaluated_options = []
    for c in candidate_controls:
        benefit = calculate_control_benefit(c, assets, findings, baseline_eal, org_revenue, org_employees, risk_appetite)
        c_copy = copy.deepcopy(c)
        c_copy["eal_reduction"] = benefit
        evaluated_options.append(c_copy)

    # Process locked-in items
    forced_in_items = [c for c in evaluated_options if c["id"] in locked_in_ids]
    forced_cost = sum(c["cost"] for c in forced_in_items)

    remaining_budget = max(0.0, budget - forced_cost)
    selectable_items = [c for c in evaluated_options if c["id"] not in locked_in_ids]

    selected_from_dp = []
    if remaining_budget > 0 and selectable_items:
        # Scale for DP table (10,000 INR unit step)
        scale = 10000.0
        W = int(remaining_budget // scale)
        n = len(selectable_items)

        weights = [int(round(c["cost"] / scale)) for c in selectable_items]
        values = [c["eal_reduction"] for c in selectable_items]

        dp = [[0.0 for _ in range(W + 1)] for _ in range(n + 1)]

        for i in range(1, n + 1):
            w = weights[i - 1]
            v = values[i - 1]
            for j in range(W + 1):
                if w <= j:
                    dp[i][j] = max(dp[i - 1][j], dp[i - 1][j - w] + v)
                else:
                    dp[i][j] = dp[i - 1][j]

        # Traceback selected controls
        j = W
        for i in range(n, 0, -1):
            if dp[i][j] != dp[i - 1][j]:
                selected_from_dp.append(selectable_items[i - 1])
                j -= weights[i - 1]

    # Combine forced and DP selected
    final_portfolio = forced_in_items + selected_from_dp
    total_cost = sum(c["cost"] for c in final_portfolio)
    total_reduction = sum(c["eal_reduction"] for c in final_portfolio)
    residual_eal = max(0.0, baseline_eal - total_reduction)

    # ROSI = ((Risk Reduction Benefit - Investment Cost) / Investment Cost) * 100
    rosi = int(round(((total_reduction - total_cost) / total_cost) * 100.0)) if total_cost > 0 else 0

    return {
        "budget": budget,
        "selected_portfolio": final_portfolio,
        "total_cost": total_cost,
        "budget_remaining": max(0.0, budget - total_cost),
        "baseline_eal": baseline_eal,
        "total_reduction": total_reduction,
        "residual_eal": residual_eal,
        "rosi": rosi,
        "formula": f"ROSI = (₹{total_reduction:,.0f} - ₹{total_cost:,.0f}) / ₹{total_cost:,.0f} × 100 = {rosi}%"
    }
