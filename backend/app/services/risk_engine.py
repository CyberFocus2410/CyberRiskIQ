# backend/app/services/risk_engine.py
"""
CyberRiskIQ Deterministic Risk Engine
Calculates Likelihood, Impact, Control Gaps, and Normalizes Risk Scores (0 - 100).
Aggregates risk across Asset -> Business Service -> Business Unit -> Enterprise.
"""
from typing import List, Dict, Any, Optional

def calculate_correlated_risk_indicator(
    finding: Dict[str, Any],
    asset: Dict[str, Any],
    exposure_override: Optional[Dict[str, Any]] = None
) -> float:
    """
    Computes Correlated Risk Indicator for a single finding.
    Factors in exploit availability and internet exposure.
    Clamped strictly between 0.0 and 10.0.
    """
    base_cvss = float(finding.get("cvss", 5.0))
    score = base_cvss

    if finding.get("exploit_available") or finding.get("exploitAvailable"):
        score += 1.2

    # Check internet exposure
    asset_id = asset.get("id")
    is_exposed = False
    if exposure_override and asset_id in exposure_override:
        is_exposed = exposure_override[asset_id].get("internetExposure") == "Yes" or exposure_override[asset_id].get("internet_exposure") == "Yes"
    else:
        is_exposed = asset.get("internet_exposure") == "Yes" or asset.get("internetExposure") == "Yes"

    if is_exposed:
        score += 1.5

    return min(10.0, max(0.0, score))


def calculate_control_effectiveness(
    asset: Dict[str, Any],
    controls_override: Optional[Dict[str, bool]] = None
) -> float:
    """
    Computes average effectiveness percentage across all defensive controls on an asset (0 - 100).
    """
    controls = asset.get("controls", {})
    if not controls:
        return 30.0

    total = 0.0
    count = len(controls)
    ctrl_override = controls_override or {}

    for k, val in controls.items():
        if ctrl_override.get(k):
            total += 95.0
        else:
            total += float(val)

    return round(total / count if count > 0 else 30.0, 1)


def calculate_asset_risk_score(
    asset: Dict[str, Any],
    findings: List[Dict[str, Any]],
    controls_override: Optional[Dict[str, bool]] = None,
    exposure_override: Optional[Dict[str, Any]] = None,
    risk_appetite: str = "Medium"
) -> int:
    """
    Risk Score = Threat Likelihood (50%) + Asset Criticality (30%) + Control Gap (20%)
    Normalized to 0 - 100.
    """
    asset_id = asset.get("id")
    open_findings = [
        f for f in findings 
        if (f.get("asset_id") == asset_id or f.get("assetId") == asset_id) 
        and f.get("status") in ["Open", "In Progress", None]
    ]

    if not open_findings:
        return 10 # Baseline safe score

    correlated_scores = [
        calculate_correlated_risk_indicator(f, asset, exposure_override)
        for f in open_findings
    ]

    max_correlated = max(correlated_scores)
    avg_correlated = sum(correlated_scores) / len(correlated_scores)

    threat_likelihood = (max_correlated * 0.7 + avg_correlated * 0.3) / 10.0 # 0.0 - 1.0

    criticality_val = asset.get("criticality", "Medium")
    if exposure_override and asset_id in exposure_override and "criticality" in exposure_override[asset_id]:
        criticality_val = exposure_override[asset_id]["criticality"]

    crit_weight_map = {"Critical": 1.0, "High": 0.8, "Medium": 0.6, "Low": 0.4}
    criticality_weight = crit_weight_map.get(criticality_val, 0.6)

    effectiveness = calculate_control_effectiveness(asset, controls_override)
    control_gap = 1.0 - (effectiveness / 100.0)

    raw_score = (threat_likelihood * 0.5 + criticality_weight * 0.3 + control_gap * 0.2) * 100.0

    # Risk Appetite scaling
    appetite_multiplier = 1.0
    if risk_appetite == "Low":
        appetite_multiplier = 1.25
    elif risk_appetite == "High":
        appetite_multiplier = 0.75

    final_score = int(round(min(100.0, max(10.0, raw_score * appetite_multiplier))))
    return final_score


def aggregate_enterprise_risk(
    assets: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    controls_override: Optional[Dict[str, bool]] = None,
    exposure_override: Optional[Dict[str, Any]] = None,
    risk_appetite: str = "Medium"
) -> Dict[str, Any]:
    """
    Aggregates asset-level risk scores to Enterprise-level weighted average score.
    """
    if not assets:
        return {"enterprise_risk_score": 10, "asset_count": 0}

    weighted_risk_sum = 0.0
    total_weights = 0.0

    crit_mult = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

    for asset in assets:
        score = calculate_asset_risk_score(asset, findings, controls_override, exposure_override, risk_appetite)
        crit = asset.get("criticality", "Medium")
        w = crit_mult.get(crit, 2)
        weighted_risk_sum += score * w
        total_weights += w

    avg_score = int(round(weighted_risk_sum / total_weights if total_weights > 0 else 10.0))
    return {
        "enterprise_risk_score": avg_score,
        "asset_count": len(assets)
    }
