# backend/app/services/financial_engine.py
"""
CyberRiskIQ Financial Risk Engine
Deterministic financial exposure, incident probability, Expected Annual Loss (EAL),
and explainability drill-down breakdown.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

def calculate_asset_financial_impact(
    asset: Dict[str, Any],
    org_revenue: float = 500000000.0, # ₹50 Crore baseline
    org_employees: int = 1200
) -> Dict[str, Any]:
    """
    Potential Loss = Downtime Loss + Data Breach Cost + Regulatory Cost + Recovery Cost + Reputation Impact
    """
    revenue_scaler = org_revenue / 500000000.0
    employee_scaler = org_employees / 1200.0

    downtime_cost_per_hour = float(asset.get("downtime_cost_per_hour") or asset.get("downtimeCostPerHour") or 50000.0)
    records_exposed = int(asset.get("records_exposed") or asset.get("recordsExposed") or 5000)
    cost_per_record = float(asset.get("cost_per_record") or asset.get("costPerRecord") or 150.0)
    regulatory_penalty = float(asset.get("regulatory_penalty") or asset.get("regulatoryPenalty") or 500000.0)
    recovery_cost = float(asset.get("recovery_cost") or asset.get("recoveryCost") or 300000.0)
    reputation_factor = float(asset.get("reputation_factor") or asset.get("reputationFactor") or 500000.0)

    # Downtime 4 hours average outage duration
    downtime_loss = round((downtime_cost_per_hour * revenue_scaler) * 4)
    # Records exposed scaled with employee base
    data_breach_loss = round((records_exposed * employee_scaler) * cost_per_record)
    regulatory_loss = round(regulatory_penalty * revenue_scaler)
    recovery_loss = round(recovery_cost * employee_scaler)
    reputation_loss = round(reputation_factor * revenue_scaler)

    total_potential_loss = downtime_loss + data_breach_loss + regulatory_loss + recovery_loss + reputation_loss

    return {
        "total_potential_loss": total_potential_loss,
        "downtime_loss": downtime_loss,
        "data_breach_loss": data_breach_loss,
        "regulatory_loss": regulatory_loss,
        "recovery_loss": recovery_loss,
        "reputation_loss": reputation_loss
    }


def map_risk_score_to_probability(risk_score: int) -> float:
    """
    Deterministic mapping:
    Score 10 -> 1% (0.01) annual incident probability
    Score 100 -> 35% (0.35) annual incident probability
    """
    clamped_score = max(10, min(100, risk_score))
    probability = 0.01 + (clamped_score - 10) * (0.34 / 90.0)
    return round(probability, 4)


def calculate_asset_eal(
    asset: Dict[str, Any],
    risk_score: int,
    org_revenue: float = 500000000.0,
    org_employees: int = 1200,
    controls_override: Optional[Dict[str, bool]] = None
) -> Dict[str, Any]:
    """
    EAL = Annual Incident Probability * Potential Financial Loss
    Returns comprehensive explainability data.
    """
    financial_breakdown = calculate_asset_financial_impact(asset, org_revenue, org_employees)
    probability = map_risk_score_to_probability(risk_score)

    ctrl_override = controls_override or {}
    potential_loss = financial_breakdown["total_potential_loss"]

    # If immutable cloud backup is active in scenario, recovery loss is discounted 70%
    if ctrl_override.get("backup"):
        recovery_saving = financial_breakdown["recovery_loss"] * 0.70
        potential_loss = max(0, potential_loss - recovery_saving)

    eal = int(round(probability * potential_loss))

    return {
        "asset_id": asset.get("id"),
        "asset_name": asset.get("name"),
        "business_unit": asset.get("business_unit") or asset.get("businessUnit"),
        "business_service": asset.get("business_service") or asset.get("businessService"),
        "risk_score": risk_score,
        "incident_probability": probability,
        "potential_loss": potential_loss,
        "eal": eal,
        "breakdown": financial_breakdown,
        "calculation_formula": f"{probability:.2%} × ₹{potential_loss:,.0f} = ₹{eal:,.0f}",
        "timestamp": datetime.utcnow().isoformat()
    }


def aggregate_enterprise_financials(
    assets: List[Dict[str, Any]],
    risk_scores: Dict[str, int],
    org_revenue: float = 500000000.0,
    org_employees: int = 1200,
    controls_override: Optional[Dict[str, bool]] = None
) -> Dict[str, Any]:
    """
    Aggregates EAL and financial exposure across the entire enterprise and by business unit.
    """
    total_eal = 0
    total_exposure = 0
    bu_eal_map: Dict[str, int] = {}
    category_totals = {
        "downtime": 0,
        "data_breach": 0,
        "regulatory": 0,
        "recovery": 0,
        "reputation": 0
    }

    asset_eal_list = []

    for asset in assets:
        asset_id = asset.get("id")
        score = risk_scores.get(asset_id, 10)
        eal_result = calculate_asset_eal(asset, score, org_revenue, org_employees, controls_override)
        
        total_eal += eal_result["eal"]
        total_exposure += eal_result["potential_loss"]

        bu = asset.get("business_unit") or asset.get("businessUnit") or "General"
        bu_eal_map[bu] = bu_eal_map.get(bu, 0) + eal_result["eal"]

        prob = eal_result["incident_probability"]
        bd = eal_result["breakdown"]
        category_totals["downtime"] += int(round(bd["downtime_loss"] * prob))
        category_totals["data_breach"] += int(round(bd["data_breach_loss"] * prob))
        category_totals["regulatory"] += int(round(bd["regulatory_loss"] * prob))
        category_totals["recovery"] += int(round(bd["recovery_loss"] * prob))
        category_totals["reputation"] += int(round(bd["reputation_loss"] * prob))

        asset_eal_list.append(eal_result)

    return {
        "total_eal": total_eal,
        "total_financial_exposure": total_exposure,
        "bu_distribution": bu_eal_map,
        "category_totals": category_totals,
        "asset_financials": asset_eal_list
    }
