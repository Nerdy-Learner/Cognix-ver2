import os
import re
import joblib
import pandas as pd

from core.agent_base import BaseAgent


# =========================
# MODEL PATHS
# =========================

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# =========================
# LOAD AGENT-2 MODELS
# =========================

agent2_model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "agent2_mitre_model.pkl"
    )
)

agent2_tfidf = joblib.load(
    os.path.join(
        MODEL_DIR,
        "agent2_tfidf.pkl"
    )
)

agent2_encoder = joblib.load(
    os.path.join(
        MODEL_DIR,
        "agent2_label_encoder.pkl"
    )
)


# =========================
# RULE ENGINE
# =========================

RULES = [

    {
        "name": "SQL Injection",

        "pattern": r"(SELECT|UNION|INSERT|DROP|extractvalue|alert\()",

        "tactic": "Credential Access",

        "severity": "High",

        "technique": "T1059"
    },

    {
        "name": "Login Attempt",

        "pattern": r"(wp-login\.php|POST.*login|failed)",

        "tactic": "Credential Access",

        "severity": "Medium",

        "technique": "T1110"
    },

    {
        "name": "Recon Scan",

        "pattern": r"(xmlrpc|wlwmanifest|robots\.txt|sitemap)",

        "tactic": "Reconnaissance",

        "severity": "Low",

        "technique": "T1595"
    },

    {
        "name": "Service Abuse",

        "pattern": r"(/lib/ajax/service.php)",

        "tactic": "Impact",

        "severity": "High",

        "technique": "T1499"
    }
]


# =========================
# NORMALIZE ATTACK NAME
# =========================

def normalize_attack_name(name):

    return (
        str(name)
        .replace("�", "-")
        .replace("–", "-")
        .strip()
    )


# =========================
# APPLY RULE ENGINE
# =========================

def apply_rules(request):

    for rule in RULES:

        if re.search(
            rule["pattern"],
            request,
            re.IGNORECASE
        ):

            return {

                "tactic": rule["tactic"],

                "technique": rule["technique"],

                "severity": rule["severity"],

                "matched_rule": rule["name"]
            }

    return None


# =========================
# ATTACK-TYPE → MITRE
# =========================

attack_to_mitre = {

    "DDoS": "Impact",

    "DoS Hulk": "Impact",

    "DoS GoldenEye": "Impact",

    "DoS Slowhttptest": "Impact",

    "DoS slowloris": "Impact",

    "PortScan": "Reconnaissance",

    "Bot": "Command and Control",

    "FTP-Patator": "Credential Access",

    "SSH-Patator": "Credential Access",

    "Web Attack - Brute Force":
        "Credential Access",

    "Web Attack - Sql Injection":
        "Initial Access",

    "Web Attack - XSS":
        "Execution",

    "Infiltration":
        "Lateral Movement",

    "Heartbleed":
        "Credential Access"
}


# =========================
# ATTACK-TYPE → TECHNIQUE
# =========================

attack_to_technique = {

    "DDoS": "T1498",

    "DoS Hulk": "T1499",

    "DoS GoldenEye": "T1499",

    "DoS Slowhttptest": "T1499",

    "DoS slowloris": "T1499",

    "PortScan": "T1595",

    "Bot": "T1071",

    "FTP-Patator": "T1110",

    "SSH-Patator": "T1110",

    "Web Attack - Brute Force":
        "T1110",

    "Web Attack - Sql Injection":
        "T1190",

    "Web Attack - XSS":
        "T1059",

    "Infiltration":
        "T1021",

    "Heartbleed":
        "T1190"
}


# =========================
# AGENT-2 CLASS
# =========================

class Agent2(BaseAgent):

    def __init__(self):

        super().__init__("Agent2")


    def run(self, alert, context):

        # =========================
        # GET AGENT1 OUTPUT
        # =========================

        attack_type = normalize_attack_name(

            context["features"].get(
                "attack_type",
                "BENIGN"
            )
        )

        confidence = context["features"].get(
            "agent1_confidence",
            0
        )

        request = str(
            alert.get(
                "request",
                "GET / HTTP/1.1"
            )
        )


        # =========================
        # DEFAULT ENRICHMENT
        # =========================

        enrichment = {

            "tactic": None,

            "technique": None,

            "severity": "Low",

            "matched_rule": None
        }


        # =========================
        # BENIGN BYPASS
        # =========================

        if attack_type == "BENIGN":

            enrichment["tactic"] = "non-attack"

            enrichment["technique"] = None

            enrichment["matched_rule"] = (
                "benign traffic"
            )


        else:

            # =========================
            # PRIMARY ATTACK MAPPING
            # =========================

            enrichment["tactic"] = (
                attack_to_mitre.get(
                    attack_type
                )
            )

            enrichment["technique"] = (
                attack_to_technique.get(
                    attack_type
                )
            )

            enrichment["matched_rule"] = (
                f"{attack_type} heuristic mapping"
            )


            # =========================
            # RULE ENGINE FALLBACK
            # =========================

            if enrichment["tactic"] is None:

                rule_result = apply_rules(
                    request
                )

                if rule_result is not None:

                    enrichment.update(
                        rule_result
                    )


            # =========================
            # ML FALLBACK
            # =========================

            if enrichment["tactic"] is None:

                vec = agent2_tfidf.transform(
                    [request]
                )

                pred = agent2_model.predict(
                    vec
                )

                tactic = (
                    agent2_encoder
                    .inverse_transform(pred)[0]
                )

                enrichment["tactic"] = tactic

                enrichment["matched_rule"] = (
                    "ml prediction"
                )


            # =========================
            # FINAL FALLBACK
            # =========================

            if enrichment["tactic"] is None:

                enrichment["tactic"] = "Unknown"


        # =========================
        # TECHNIQUE FALLBACK
        # =========================

        if enrichment["technique"] is None:

            enrichment["technique"] = (
                attack_to_technique.get(
                    attack_type
                )
            )


        # =========================
        # UPDATE CONTEXT
        # =========================

        context["features"].update({

            "mitre_tactic":
                enrichment["tactic"],

            "mitre_technique":
                enrichment["technique"],

            "agent2_severity":
                enrichment["severity"],

            "matched_rule":
                enrichment["matched_rule"]
        })


        # =========================
        # RETURN OUTPUT
        # =========================

        return self.format_output(

            decision=enrichment["tactic"],

            confidence=confidence,

            reason=(
                enrichment["matched_rule"]
            )
        )