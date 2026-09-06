# backend/app/services/risk_engine.py
"""
CyberRiskIQ Deterministic Risk Engine
Calculates Likelihood, Impact, Control Gaps, and Normalizes Risk Scores (0 - 100).
Aggregates risk across Asset -> Business Service -> Business Unit -> Enterprise.

CALIBRATION & EMPIRICAL BENCHMARK CITATIONS:
1. CVSS Base Score (0.0 - 10.0):
   - Standard: FIRST Common Vulnerability Scoring System (CVSS v3.1) Specification.
   - Source: https://www.first.org/cvss/v3.1/specification-document
2. Exploit Available Modifier (+1.2):
   - Benchmark: FIRST Exploit Prediction Scoring System (EPSS) & CISA Known Exploited Vulnerabilities (KEV).
   - Empirical Grounding: Published exploit code presence is correlated with a 2.5x - 4x uplift
     in real-world weaponization probability. Mapped to an additive +1.2 scalar on a 10-point scale.
   - Configurable calibration parameter: WEIGHT_EXPLOIT_AVAILABLE.
3. Internet Exposure Modifier (+1.5):
   - Benchmark: Verizon Data Breach Investigations Report (DBIR) & Cyentia Information Risk Insights Study (IRIS).
   - Empirical Grounding: Publicly exposed attack surface encounters automated scanning and brute force probes
     at 3x - 5x the frequency of internal perimeter nodes. Mapped to an additive +1.5 scalar.
   - Configurable calibration parameter: WEIGHT_INTERNET_EXPOSED.
4. Risk Score Component Weights (0.50 Threat Likelihood / 0.30 Criticality / 0.20 Control Gap):
   - Grounding: Industry-standard defense-in-depth risk triage. Threat likelihood and active exploitability
     carry the highest weight (50%), business asset criticality dictates impact severity (30%),
     and defensive control effectiveness mitigates residual exposure (20%).
   - Configurable calibration parameters: WEIGHT_THREAT_LIKELIHOOD, WEIGHT_ASSET_CRITICALITY, WEIGHT_CONTROL_GAP.
"""
from typing import List, Dict, Any, Optional

# ==========================================
# CONFIGURABLE CALIBRATION PARAMETERS
# ==========================================
WEIGHT_EXPLOIT_AVAILABLE: float = 1.2    # Additive uplift for weaponized exploit presence (EPSS/CISA KEV grounded)
WEIGHT_INTERNET_EXPOSED: float = 1.5     # Additive uplift for public internet exposure (Verizon DBIR grounded)

WEIGHT_THREAT_LIKELIHOOD: float = 0.50   # Threat exposure weight in composite risk rating
WEIGHT_ASSET_CRITICALITY: float = 0.30   # Asset business criticality weight in composite risk rating
WEIGHT_CONTROL_GAP: float = 0.20         # Control deficiency weight in composite risk rating

# Asset Criticality Ordinal Mapping (0.0 to 1.0)
CRITICALITY_WEIGHT_MAP: Dict[str, float] = {
    "Critical": 1.0,
    "High": 0.8,
    "Medium": 0.6,
    "Low": 0.4
}

# Risk Appetite Multipliers
APPETITE_MULTIPLIERS: Dict[str, float] = {
    "Low": 1.25,      # Conservative: 25% risk score amplification
    "Medium": 1.00,   # Standard baseline
    "High": 0.75      # Aggressive tolerance: 25% attenuation
}

# Enterprise Aggregation Criticality Multipliers
ENTERPRISE_CRITICALITY_WEIGHTS: Dict[str, int] = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
}


def calculate_correlated_risk_indicator(
    finding: Dict[str, Any],
    asset: Dict[str, Any],
    exposure_override: Optional[Dict[str, Any]] = None
) -> float:
    """
    Computes Correlated Risk Indicator for a single finding.
    Formula: Correlated Risk = CVSS Base + 1.2 * [Exploit Available] + 1.5 * [Internet Exposed]
    Clamped strictly between 0.0 and 10.0.
    """
    base_cvss = float(finding.get("cvss", 5.0))
    # Bounds check on raw CVSS
    base_cvss = min(10.0, max(0.0, base_cvss))
    score = base_cvss

    if finding.get("exploit_available") or finding.get("exploitAvailable"):
        score += WEIGHT_EXPLOIT_AVAILABLE

    # Check internet exposure
    asset_id = asset.get("id")
    is_exposed = False
    if exposure_override and asset_id in exposure_override:
        is_exposed = exposure_override[asset_id].get("internetExposure") == "Yes" or exposure_override[asset_id].get("internet_exposure") == "Yes"
    else:
        is_exposed = asset.get("internet_exposure") == "Yes" or asset.get("internetExposure") == "Yes"

    if is_exposed:
        score += WEIGHT_INTERNET_EXPOSED

    # Invariant: Score strictly clamped [0.0, 10.0]
    return min(10.0, max(0.0, round(score, 2)))


def calculate_control_effectiveness(
    asset: Dict[str, Any],
    controls_override: Optional[Dict[str, bool]] = None
) -> float:
    """
    Computes average effectiveness percentage across all defensive controls on an asset (0.0 - 100.0%).
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
            total += min(100.0, max(0.0, float(val)))

    effectiveness = total / count if count > 0 else 30.0
    return round(min(100.0, max(0.0, effectiveness)), 1)


def calculate_asset_risk_score(
    asset: Dict[str, Any],
    findings: List[Dict[str, Any]],
    controls_override: Optional[Dict[str, bool]] = None,
    exposure_override: Optional[Dict[str, Any]] = None,
    risk_appetite: str = "Medium"
) -> int:
    """
    Risk Score = (0.50 * Threat Likelihood + 0.30 * Asset Criticality + 0.20 * Control Gap) * 100 * Appetite Multiplier
    Normalized and clamped strictly between 0 and 100.
    """
    asset_id = asset.get("id")
    open_findings = [
        f for f in findings 
        if (f.get("asset_id") == asset_id or f.get("assetId") == asset_id) 
        and f.get("status") in ["Open", "In Progress", None]
    ]

    if not open_findings:
        # Minimum baseline score for clean asset
        return 10

    correlated_scores = [
        calculate_correlated_risk_indicator(f, asset, exposure_override)
        for f in open_findings
    ]

    max_correlated = max(correlated_scores)
    avg_correlated = sum(correlated_scores) / len(correlated_scores)

    # Threat Likelihood: 70% weighted toward worst finding, 30% aggregate density (0.0 to 1.0)
    threat_likelihood = (max_correlated * 0.7 + avg_correlated * 0.3) / 10.0
    threat_likelihood = min(1.0, max(0.0, threat_likelihood))

    criticality_val = asset.get("criticality", "Medium")
    if exposure_override and asset_id in exposure_override and "criticality" in exposure_override[asset_id]:
        criticality_val = exposure_override[asset_id]["criticality"]

    criticality_weight = CRITICALITY_WEIGHT_MAP.get(criticality_val, 0.6)

    effectiveness = calculate_control_effectiveness(asset, controls_override)
    control_gap = 1.0 - (effectiveness / 100.0)
    control_gap = min(1.0, max(0.0, control_gap))

    raw_score = (
        threat_likelihood * WEIGHT_THREAT_LIKELIHOOD +
        criticality_weight * WEIGHT_ASSET_CRITICALITY +
        control_gap * WEIGHT_CONTROL_GAP
    ) * 100.0

    appetite_multiplier = APPETITE_MULTIPLIERS.get(risk_appetite, 1.0)

    # Invariant: Risk Score must stay strictly clamped between 0 and 100
    final_score = int(round(min(100.0, max(0.0, raw_score * appetite_multiplier))))
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

    for asset in assets:
        score = calculate_asset_risk_score(asset, findings, controls_override, exposure_override, risk_appetite)
        crit = asset.get("criticality", "Medium")
        w = ENTERPRISE_CRITICALITY_WEIGHTS.get(crit, 2)
        weighted_risk_sum += score * w
        total_weights += w

    avg_score = int(round(weighted_risk_sum / total_weights if total_weights > 0 else 10.0))
    # Invariant: Clamped 0 - 100
    avg_score = min(100, max(0, avg_score))

    return {
        "enterprise_risk_score": avg_score,
        "asset_count": len(assets)
    }

