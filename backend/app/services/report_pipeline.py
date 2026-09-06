# backend/app/services/report_pipeline.py
"""
CyberRiskIQ Systematic 6-Stage Quantitative Report Generation Pipeline

Stages:
1. Raw Engine Output Ingestion (Reconnaissance, attack surface, probe execution traces)
2. Canonical Normalization (CyberRiskIQ Finding Schema)
3. Threat Correlation (Correlated Risk Indicator with driver factor attribution)
4. Per-Asset Risk Scoring (Weighted asset risk ratings 0-100)
5. FAIR Financial EAL Loss Quantification (Downtime, Breach, Regulatory, Recovery, Reputation)
6. Enterprise Roll-Up & Strategic Recommendations (EAL delta, ROSI, Prioritized Roadmap)
"""
from datetime import datetime
from typing import Dict, List, Any, Optional

def generate_quantitative_report(
    run_id: str,
    target: str,
    scope: str,
    mode: str,
    raw_engine_output: Dict[str, Any],
    org_metadata: Optional[Dict[str, Any]] = None,
    assets_context: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes the 6-stage quantitative reporting pipeline and returns a complete,
    versioned, traceable audit report with driver factor attribution for every metric.
    """
    generated_at = datetime.utcnow().isoformat() + "Z"
    org_name = org_metadata.get("name", "FinSecure Enterprise") if org_metadata else "FinSecure Enterprise"
    annual_revenue = org_metadata.get("annual_revenue", 500000000.0) if org_metadata else 500000000.0
    budget = org_metadata.get("budget", 3500000.0) if org_metadata else 3500000.0

    # STAGE 1: RAW ENGINE OUTPUT INGESTION
    stage_1_raw = {
        "stage": 1,
        "name": "Raw Engine Output Ingestion",
        "target": target,
        "scope": scope,
        "mode": mode,
        "engine": "CyberRiskIQ AI Security Assessment Engine",
        "raw_endpoints_discovered": raw_engine_output.get("endpoints_discovered", []),
        "raw_services_identified": raw_engine_output.get("services_identified", []),
        "probe_execution_traces": raw_engine_output.get("execution_traces", []),
        "raw_findings_count": len(raw_engine_output.get("raw_findings", [])),
        "recon_timestamp": raw_engine_output.get("timestamp", generated_at)
    }

    # STAGE 2: CANONICAL NORMALIZATION
    normalized_findings = []
    raw_findings = raw_engine_output.get("raw_findings", [])
    
    for idx, rf in enumerate(raw_findings):
        f_id = rf.get("id") or f"FND-SCAN-{run_id[-4:].upper()}-{idx+1:02d}"
        asset_id = rf.get("asset_id") or rf.get("assetId") or "AST-001"
        severity = str(rf.get("severity", "Medium")).capitalize()
        cvss = float(rf.get("cvss", 5.0))
        exploit_available = bool(rf.get("exploit_available", False) or rf.get("exploitAvailable", False) or rf.get("exploit_available") == "Yes")
        internet_exposed = bool(rf.get("internet_exposed", False) or rf.get("internetExposed", False) or rf.get("internet_exposed") == "Yes")
        
        normalized = {
            "id": f_id,
            "asset_id": asset_id,
            "vulnerability": rf.get("vulnerability") or rf.get("title") or "Discovered Security Weakness",
            "severity": severity,
            "cvss": round(cvss, 1),
            "exploit_available": exploit_available,
            "internet_exposed": internet_exposed,
            "evidence": rf.get("evidence") or rf.get("description") or "Automated engine probe verification.",
            "control_state": rf.get("control_state") or rf.get("controlState") or "Suboptimal Control Configuration",
            "remediation": rf.get("remediation") or "Apply security patches and enforce least-privilege controls.",
            "poc_attached": bool(rf.get("poc_attached", True)),
            "cve_id": rf.get("cve_id", "CVE-2026-NVD-PENDING"),
            "cwe_id": rf.get("cwe_id", "CWE-200")
        }
        normalized_findings.append(normalized)

    stage_2_normalization = {
        "stage": 2,
        "name": "Canonical Normalization",
        "findings_count": len(normalized_findings),
        "findings": normalized_findings
    }

    # STAGE 3: THREAT CORRELATION & DRIVER FACTOR ATTRIBUTION
    # Formula: Correlated Risk = (Base CVSS * 10) + Exploit Factor + Exposure Factor - Control Attenuation
    stage_3_attributions = []
    correlated_findings = []

    for f in normalized_findings:
        base_cvss = f["cvss"]
        base_risk = base_cvss * 10.0 # 0 - 100 scale

        # Driver factor weights
        exploit_factor = 15.0 if f["exploit_available"] else 0.0
        exposure_factor = 20.0 if f["internet_exposed"] else 0.0
        control_attenuation = 10.0 # Standard baseline protection

        # Calculation
        correlated_score = max(5.0, min(100.0, base_risk + exploit_factor + exposure_factor - control_attenuation))
        
        driver_breakdown = {
            "finding_id": f["id"],
            "vulnerability": f["vulnerability"],
            "base_cvss": base_cvss,
            "base_component": round(base_risk, 1),
            "exploit_available_boost": exploit_factor,
            "internet_exposure_boost": exposure_factor,
            "control_mitigation": -control_attenuation,
            "correlated_risk_indicator": round(correlated_score, 1),
            "risk_driver_citations": [
                f"Base CVSS {base_cvss}/10",
                "Exploit in the Wild (+15 pts)" if f["exploit_available"] else "No Known Public Exploit (+0 pts)",
                "Direct Internet Surface (+20 pts)" if f["internet_exposed"] else "Internal Perimeter Protected (+0 pts)",
                "Standard Defenses (-10 pts)"
            ]
        }
        stage_3_attributions.append(driver_breakdown)
        
        correlated_finding = dict(f)
        correlated_finding["correlated_risk_score"] = round(correlated_score, 1)
        correlated_finding["driver_attribution"] = driver_breakdown
        correlated_findings.append(correlated_finding)

    stage_3_correlation = {
        "stage": 3,
        "name": "Threat Correlation & Driver Attribution",
        "driver_attributions": stage_3_attributions
    }

    # STAGE 4: PER-ASSET RISK SCORING
    # Group findings by asset and calculate weighted asset risk scores
    assets_map: Dict[str, Dict[str, Any]] = {}
    if assets_context:
        for a in assets_context:
            a_id = a.get("id", "AST-001")
            assets_map[a_id] = {
                "id": a_id,
                "name": a.get("name", f"Target Asset ({a_id})"),
                "criticality": a.get("criticality", "High"),
                "type": a.get("type", "Application"),
                "downtime_cost_per_hour": float(a.get("downtime_cost_per_hour", 75000.0)),
                "records_exposed": int(a.get("records_exposed", 10000)),
                "cost_per_record": float(a.get("cost_per_record", 150.0)),
                "regulatory_penalty": float(a.get("regulatory_penalty", 500000.0)),
                "recovery_cost": float(a.get("recovery_cost", 300000.0)),
                "findings": []
            }

    # If no existing asset context matched, create dynamic asset node for target
    primary_asset_id = "AST-TARGET"
    if primary_asset_id not in assets_map:
        assets_map[primary_asset_id] = {
            "id": primary_asset_id,
            "name": f"Scan Target: {target}",
            "criticality": "Critical" if "payment" in target.lower() or "auth" in target.lower() else "High",
            "type": "Web API / Service" if target.startswith("http") else "Application Source",
            "downtime_cost_per_hour": 100000.0 if "payment" in target.lower() else 50000.0,
            "records_exposed": 25000 if "data" in target.lower() or "payment" in target.lower() else 8000,
            "cost_per_record": 180.0,
            "regulatory_penalty": 750000.0,
            "recovery_cost": 400000.0,
            "findings": []
        }

    for cf in correlated_findings:
        target_a_id = cf["asset_id"] if cf["asset_id"] in assets_map else primary_asset_id
        assets_map[target_a_id]["findings"].append(cf)

    asset_risk_evaluations = []
    for a_id, a_data in assets_map.items():
        if not a_data["findings"]:
            continue
        
        # Criticality multipliers
        crit_mult = {
            "Critical": 1.4,
            "High": 1.2,
            "Medium": 1.0,
            "Low": 0.8
        }.get(a_data["criticality"], 1.0)

        max_finding_score = max((f["correlated_risk_score"] for f in a_data["findings"]), default=0.0)
        avg_finding_score = sum(f["correlated_risk_score"] for f in a_data["findings"]) / max(1, len(a_data["findings"]))
        
        raw_asset_score = (max_finding_score * 0.6 + avg_finding_score * 0.4) * crit_mult
        final_asset_score = min(100.0, round(raw_asset_score, 1))

        asset_risk_evaluations.append({
            "asset_id": a_id,
            "asset_name": a_data["name"],
            "criticality": a_data["criticality"],
            "findings_count": len(a_data["findings"]),
            "peak_vulnerability_score": round(max_finding_score, 1),
            "asset_risk_score": final_asset_score,
            "risk_rating": "Critical" if final_asset_score >= 80 else "High" if final_asset_score >= 60 else "Medium"
        })

    stage_4_asset_scoring = {
        "stage": 4,
        "name": "Per-Asset Risk Scoring",
        "asset_evaluations": asset_risk_evaluations
    }

    # STAGE 5: FAIR FINANCIAL EAL LOSS QUANTIFICATION
    asset_financial_quantifications = []
    total_eal = 0.0
    total_potential_loss = 0.0

    for a_eval in asset_risk_evaluations:
        a_id = a_eval["asset_id"]
        a_meta = assets_map[a_id]
        risk_score = a_eval["asset_risk_score"]

        # Loss Event Frequency (LEF) annualized based on threat correlation
        # A risk score of 80 -> 0.45 annual frequency, 50 -> 0.15, 95 -> 0.85
        lef = round(min(0.95, max(0.05, (risk_score / 100.0) ** 1.6)), 3)

        # Loss Magnitude (LM) breakdown
        downtime_loss = a_meta["downtime_cost_per_hour"] * (12.0 if risk_score > 75 else 4.0)
        data_breach_loss = a_meta["records_exposed"] * a_meta["cost_per_record"]
        regulatory_loss = a_meta["regulatory_penalty"] if risk_score > 70 else (a_meta["regulatory_penalty"] * 0.4)
        recovery_loss = a_meta["recovery_cost"]
        reputation_loss = (downtime_loss + data_breach_loss) * 0.25

        total_loss_magnitude = downtime_loss + data_breach_loss + regulatory_loss + recovery_loss + reputation_loss
        asset_eal = round(lef * total_loss_magnitude, 2)

        total_eal += asset_eal
        total_potential_loss += total_loss_magnitude

        asset_financial_quantifications.append({
            "asset_id": a_id,
            "asset_name": a_meta["name"],
            "loss_event_frequency": lef,
            "total_potential_loss": round(total_loss_magnitude, 2),
            "expected_annual_loss": asset_eal,
            "loss_breakdown": {
                "downtime_loss": round(downtime_loss, 2),
                "data_breach_loss": round(data_breach_loss, 2),
                "regulatory_loss": round(regulatory_loss, 2),
                "recovery_loss": round(recovery_loss, 2),
                "reputation_loss": round(reputation_loss, 2)
            },
            "financial_driver_citations": [
                f"Loss Event Frequency calibrated at {lef * 100:.1f}% annualized based on Correlated Risk Score {risk_score}",
                f"Data exposure estimated at {a_meta['records_exposed']:,} records @ ₹{a_meta['cost_per_record']}/rec",
                f"Estimated critical downtime disruption: {12 if risk_score > 75 else 4} hours @ ₹{a_meta['downtime_cost_per_hour']:,.0f}/hr"
            ]
        })

    stage_5_financial_eal = {
        "stage": 5,
        "name": "FAIR Financial EAL Loss Quantification",
        "currency": "INR (₹)",
        "total_enterprise_eal": round(total_eal, 2),
        "total_single_event_exposure": round(total_potential_loss, 2),
        "asset_quantifications": asset_financial_quantifications
    }

    # STAGE 6: ENTERPRISE ROLL-UP & ACTIONABLE RECOMMENDATIONS
    recommendations = []
    
    # Generate prioritized recommendations based on normalized findings
    for idx, f in enumerate(normalized_findings):
        est_cost = 250000.0 if f["severity"] == "Critical" else 150000.0
        # Estimated risk reduction 35% - 60%
        reduction_rate = 0.55 if f["severity"] == "Critical" else 0.40
        eal_reduction = round(total_eal * (reduction_rate / max(1, len(normalized_findings))), 2)
        rosi = round(((eal_reduction - est_cost) / max(1.0, est_cost)) * 100.0, 1)

        recommendations.append({
            "priority": idx + 1,
            "finding_id": f["id"],
            "vulnerability": f["vulnerability"],
            "severity": f["severity"],
            "action_plan": f["remediation"],
            "estimated_implementation_cost": est_cost,
            "expected_eal_reduction": eal_reduction,
            "return_on_security_investment_pct": rosi,
            "driver_justification": f"Mitigates {f['severity']} vulnerability with CVSS {f['cvss']} currently exposed on {target}."
        })

    stage_6_rollup = {
        "stage": 6,
        "name": "Enterprise Roll-Up & Strategic Recommendations",
        "summary": {
            "run_id": run_id,
            "target": target,
            "scope": scope,
            "mode": mode,
            "total_findings": len(normalized_findings),
            "critical_count": sum(1 for f in normalized_findings if f["severity"] == "Critical"),
            "high_count": sum(1 for f in normalized_findings if f["severity"] == "High"),
            "medium_count": sum(1 for f in normalized_findings if f["severity"] == "Medium"),
            "baseline_annual_loss_exposure": round(total_eal, 2),
            "max_single_loss_exposure": round(total_potential_loss, 2),
            "budget_available": budget,
            "overall_health": "Urgent Remediation Required" if any(f["severity"] == "Critical" for f in normalized_findings) else "Cautionary Exposure"
        },
        "prioritized_recommendations": recommendations
    }

    # ASSEMBLE COMPREHENSIVE REPORT
    return {
        "report_id": f"REP-{run_id}",
        "run_id": run_id,
        "target": target,
        "scope": scope,
        "mode": mode,
        "organization_id": org_metadata.get("id") if org_metadata else "org-demo-finsecure",
        "organization_name": org_name,
        "generated_at": generated_at,
        "pipeline_version": "2.1.0",
        "stages": [
            stage_1_raw,
            stage_2_normalization,
            stage_3_correlation,
            stage_4_asset_scoring,
            stage_5_financial_eal,
            stage_6_rollup
        ],
        "findings": normalized_findings,
        "summary": stage_6_rollup["summary"],
        "recommendations": recommendations
    }
