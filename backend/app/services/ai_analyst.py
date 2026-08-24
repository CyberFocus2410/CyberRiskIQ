# backend/app/services/ai_analyst.py
"""
CyberRiskIQ AI Risk Analyst Engine
Grounded AI Question Answering Service:
1. Intent Detection
2. Structured Data Retrieval
3. Deterministic Domain Calculation
4. Grounded, Natural Language Explanation (Zero Hallucination of Numbers/Assets)
"""
from typing import List, Dict, Any
from backend.app.services.risk_engine import calculate_asset_risk_score
from backend.app.services.financial_engine import calculate_asset_eal, calculate_asset_financial_impact
from backend.app.services.optimization_engine import solve_investment_optimization

def format_currency_inr(amount: float) -> str:
    """Formats currency in Indian numbering notation (Lakh / Crore)."""
    if amount >= 10000000.0:
        return f"₹{(amount / 10000000.0):.2f} Cr"
    elif amount >= 100000.0:
        return f"₹{(amount / 100000.0):.2f} Lakh"
    else:
        return f"₹{amount:,.0f}"

def query_ai_risk_analyst(
    query: str,
    org: Dict[str, Any],
    assets: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    simulated_controls: Dict[str, bool]
) -> Dict[str, Any]:
    """
    Evaluates user questions against live database records.
    Never invents assets, vulnerabilities, risk scores, or financial values.
    """
    normalized = query.lower().strip()
    org_revenue = float(org.get("annual_revenue") or org.get("annualRevenue") or 500000000.0)
    org_employees = int(org.get("employees") or 1200)
    org_budget = float(org.get("budget") or 3500000.0)
    risk_appetite = org.get("risk_appetite") or org.get("riskAppetite") or "Medium"

    intent = "general"
    response_text = ""
    structured_data = {}

    # Intent 1: Highest Financial Cyber Risk / Highest EAL
    if (any(k in normalized for k in ["highest", "biggest", "maximum", "top", "critical"]) and any(k in normalized for k in ["risk", "eal", "exposure", "asset", "liability"])) or "highest financial" in normalized:
        intent = "highest_financial_risk"
        max_eal = -1.0
        max_asset = None
        max_breakdown = None

        for asset in assets:
            score = calculate_asset_risk_score(asset, findings, simulated_controls, None, risk_appetite)
            eal_res = calculate_asset_eal(asset, score, org_revenue, org_employees, simulated_controls)
            if eal_res["eal"] > max_eal:
                max_eal = eal_res["eal"]
                max_asset = asset
                max_breakdown = eal_res

        if max_asset:
            asset_findings = [f for f in findings if (f.get("asset_id") == max_asset["id"] or f.get("assetId") == max_asset["id"]) and f.get("status") in ["Open", "In Progress", None]]
            top_fnd = asset_findings[0] if asset_findings else {}

            response_text = (
                f"Based on deterministic risk quantification, your highest financial cyber risk is "
                f"<b>{max_asset['name']}</b> ({max_asset['id']}) in the <b>{max_asset.get('business_unit') or max_asset.get('businessUnit')}</b> unit. "
                f"It generates an Expected Annual Loss (EAL) of <b>{format_currency_inr(max_eal)}</b> "
                f"(Annual Incident Probability: <b>{max_breakdown['incident_probability']:.1%}</b> on Potential Loss: <b>{format_currency_inr(max_breakdown['potential_loss'])}</b>). "
                f"The primary driver is {len(asset_findings)} open findings, including '<b>{top_fnd.get('vulnerability', 'N/A')}</b>'."
            )
            structured_data = max_breakdown
        else:
            response_text = "No assets are currently available in the active registry database."

    # Intent 2: Business Unit Risk Distribution
    elif any(k in normalized for k in ["business unit", "bu", "division", "department"]):
        intent = "business_unit_risk"
        bu_map: Dict[str, float] = {}

        for asset in assets:
            score = calculate_asset_risk_score(asset, findings, simulated_controls, None, risk_appetite)
            eal_res = calculate_asset_eal(asset, score, org_revenue, org_employees, simulated_controls)
            bu = asset.get("business_unit") or asset.get("businessUnit") or "General"
            bu_map[bu] = bu_map.get(bu, 0.0) + eal_res["eal"]

        sorted_bu = sorted(bu_map.items(), key=lambda x: x[1], reverse=True)
        if sorted_bu:
            top_bu = sorted_bu[0]
            second_bu = sorted_bu[1] if len(sorted_bu) > 1 else None
            second_text = f", followed by <b>{second_bu[0]}</b> ({format_currency_inr(second_bu[1])})" if second_bu else ""
            response_text = (
                f"The business unit with the highest financial cyber exposure is <b>{top_bu[0]}</b>, "
                f"contributing <b>{format_currency_inr(top_bu[1])}</b> in annualized risk liability{second_text}. "
                f"Prioritizing mitigation on core services in this unit yields the fastest reduction in enterprise EAL."
            )
            structured_data = dict(sorted_bu)
        else:
            response_text = "No business unit data could be evaluated."

    # Intent 3: Budget Prioritization & Investment Optimizer
    elif any(k in normalized for k in ["prioritize", "budget", "spend", "optimizer", "investment", "rosi"]):
        intent = "budget_optimization"
        opt = solve_investment_optimization(org_budget, assets, findings, org_revenue, org_employees, risk_appetite)
        ctrl_names = [f"<b>{c['name']}</b> ({format_currency_inr(c['cost'])})" for c in opt["selected_portfolio"]]

        response_text = (
            f"Using 0/1 Knapsack optimization against your allocated budget of <b>{format_currency_inr(org_budget)}</b>, "
            f"you should prioritize: {', '.join(ctrl_names) if ctrl_names else 'No controls within budget'}. "
            f"This portfolio requires a total investment of <b>{format_currency_inr(opt['total_cost'])}</b>, "
            f"yielding an EAL reduction of <b>{format_currency_inr(opt['total_reduction'])}</b> "
            f"and a projected Return on Security Investment (ROSI) of <b>{opt['rosi']}%</b>."
        )
        structured_data = opt

    # Intent 4: Security Assessment & Validation Findings
    elif any(k in normalized for k in ["pentest", "assessment", "telemetry", "poc", "exploit", "probe"]):
        sec_findings = [f for f in findings if "assessment" in (f.get("source") or "").lower() or "pentest" in (f.get("source") or "").lower()]
        poc_count = sum(1 for f in sec_findings if f.get("poc_attached") or f.get("pocAttached"))

        response_text = (
            f"The <b>CyberRiskIQ AI Security Assessment Engine</b> currently supplies <b>{len(sec_findings)} validated security findings</b> "
            f"({poc_count} with attached Proof-of-Concept verification traces). "
            f"Validated vulnerabilities receive boosted threat likelihood weighting in our risk quantification formulas, "
            f"directly elevating their financial exposure on the Executive Dashboard."
        )
        structured_data = {"assessment_findings_count": len(sec_findings), "poc_count": poc_count}

    # Fallback: Guided prompts
    else:
        intent = "help"
        response_text = (
            "I am grounded strictly in your live asset registry, control efficacy telemetry, and deterministic risk engines. "
            "You can ask me questions such as: "
            "<ul>"
            "<li>• <i>'What is our highest financial cyber risk?'</i></li>"
            "<li>• <i>'Which business unit has the highest EAL?'</i></li>"
            "<li>• <i>'Which controls should we prioritize with our budget?'</i></li>"
            "<li>• <i>'How are AI security assessment findings factored into our risk score?'</i></li>"
            "</ul>"
        )

    return {
        "intent": intent,
        "query": query,
        "response": response_text,
        "structured_data": structured_data
    }
