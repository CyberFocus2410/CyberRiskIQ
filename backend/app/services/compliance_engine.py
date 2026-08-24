# backend/app/services/compliance_engine.py
"""
CyberRiskIQ Compliance Engine
Maps active and simulated defensive controls to regulatory cybersecurity frameworks:
- NIST Cybersecurity Framework (CSF)
- ISO/IEC 27001
- RBI Cyber Security Framework
- SEBI Cybersecurity and Cyber Resilience Framework (CSCRF)
"""
from typing import List, Dict, Any, Optional

FRAMEWORK_MAPPINGS = {
    "nist": {
        "name": "NIST Cybersecurity Framework (CSF)",
        "mapping": {
            "Identify (ID.AM)": ["mfa", "patching"],
            "Protect (PR.AC)": ["mfa", "segmentation"],
            "Protect (PR.DS)": ["backup"],
            "Detect (DE.AE)": ["monitoring"],
            "Respond (RS.RP)": ["edr", "monitoring"],
            "Recover (RC.RP)": ["backup"]
        },
        "controls": [
            {"code": "ID.AM-1", "name": "Physical & Cloud assets inventoried", "status": "Compliant", "gap": "None"},
            {"code": "PR.AC-1", "name": "Identities and credentials managed", "status": "Partial", "gap": "MFA not enforced on service accounts"},
            {"code": "PR.DS-1", "name": "Data-at-rest is protected & encrypted", "status": "Compliant", "gap": "None"},
            {"code": "DE.AE-1", "name": "Anomalous events analyzed via 24/7 SOC", "status": "Compliant", "gap": "None"},
            {"code": "RS.RP-1", "name": "Response plan executed during incidents", "status": "Partial", "gap": "EDR coverage gaps on R&D endpoints"}
        ]
    },
    "iso": {
        "name": "ISO/IEC 27001",
        "mapping": {
            "A.9 Access Control": ["mfa"],
            "A.12 Operations Security": ["patching", "monitoring"],
            "A.14 System Acquisition/Dev": ["segmentation"],
            "A.17 Information Security Continuity": ["backup"],
            "A.18 Compliance": ["monitoring", "patching"]
        },
        "controls": [
            {"code": "A.9.1.1", "name": "Access control policy & privileged account enforcement", "status": "Compliant", "gap": "None"},
            {"code": "A.12.6.1", "name": "Management of technical vulnerabilities", "status": "Partial", "gap": "Apache package updates delayed"},
            {"code": "A.14.1.1", "name": "Information security requirements in applications", "status": "Compliant", "gap": "None"},
            {"code": "A.17.1.1", "name": "Planning information security continuity & disaster recovery", "status": "Compliant", "gap": "None"}
        ]
    },
    "rbi": {
        "name": "RBI Cyber Security Framework",
        "mapping": {
            "G-1: User Access Control": ["mfa"],
            "G-3: Vulnerability Management": ["patching"],
            "G-5: Cyber Security Operations (SOC)": ["monitoring"],
            "G-8: Incident Response & Recovery": ["edr", "backup"],
            "G-11: Network Security & Segmentation": ["segmentation"]
        },
        "controls": [
            {"code": "RBI-G-1", "name": "User access control and two-factor authentication (2FA/MFA)", "status": "Partial", "gap": "Access control audit logging missing on legacy nodes"},
            {"code": "RBI-G-3", "name": "Patch and vulnerability management pipeline implementation", "status": "Partial", "gap": "GitHub actions secrets validation missing"},
            {"code": "RBI-G-5", "name": "Establishment of 24/7 Security Operations Center (SOC)", "status": "Compliant", "gap": "None"},
            {"code": "RBI-G-8", "name": "Incident response system and host agent isolation (EDR)", "status": "Partial", "gap": "Endpoint recovery orchestration gaps"},
            {"code": "RBI-G-11", "name": "Network perimeter security and zero-trust segmentation", "status": "Compliant", "gap": "None"}
        ]
    },
    "sebi": {
        "name": "SEBI Cybersecurity & Cyber Resilience Framework (CSCRF)",
        "mapping": {
            "Sec 3.1: Identification & Asset Management": ["patching"],
            "Sec 3.2: Protection & Identity Management": ["mfa"],
            "Sec 3.3: Network Segmentation": ["segmentation"],
            "Sec 3.4: Monitoring & Detection": ["monitoring"],
            "Sec 3.5: Response & Endpoint Protection": ["edr"],
            "Sec 3.6: Recovery & Backups": ["backup"]
        },
        "controls": [
            {"code": "SEBI-3.1", "name": "Identification and asset management register", "status": "Compliant", "gap": "None"},
            {"code": "SEBI-3.2", "name": "Protection, identity provider, and user credentials authentication", "status": "Compliant", "gap": "None"},
            {"code": "SEBI-3.3", "name": "Network segmentation controls and boundary security", "status": "Partial", "gap": "Unsanitized BOLA endpoints"},
            {"code": "SEBI-3.4", "name": "Continuous monitoring, detection alerts, and SOC logs", "status": "Compliant", "gap": "None"},
            {"code": "SEBI-3.5", "name": "Endpoint response agents and endpoint detection capability", "status": "Compliant", "gap": "None"},
            {"code": "SEBI-3.6", "name": "Robust backup management and immutable storage policy", "status": "Compliant", "gap": "None"}
        ]
    }
}

def calculate_framework_posture(
    assets: List[Dict[str, Any]],
    simulated_controls: Optional[Dict[str, bool]] = None
) -> Dict[str, Any]:
    """
    Computes percentage coverage across each compliance framework
    based on asset control effectiveness.
    """
    sim_ctrls = simulated_controls or {}
    results = {}

    for fw_key, fw_data in FRAMEWORK_MAPPINGS.items():
        mapping = fw_data["mapping"]
        total_items = 0
        total_effective = 0.0

        for category, controls_associated in mapping.items():
            for ctrl in controls_associated:
                for asset in assets:
                    controls = asset.get("controls", {})
                    eff = 95.0 if sim_ctrls.get(ctrl) else float(controls.get(ctrl, 30.0))
                    total_effective += eff
                    total_items += 100.0

        coverage_pct = int(round((total_effective / total_items) * 100.0)) if total_items > 0 else 0
        results[fw_key] = {
            "name": fw_data["name"],
            "coverage_pct": coverage_pct,
            "controls": fw_data["controls"]
        }

    return results
