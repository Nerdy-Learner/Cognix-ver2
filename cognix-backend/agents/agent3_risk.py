# from core.agent_base import BaseAgent

# class Agent3(BaseAgent):
#     def __init__(self):
#         super().__init__("Agent3_Risk")

#     def run(self, alert, context):
#         classification = context["features"].get("classification", "").lower()
#         protocol_risk = context["features"].get("protocol_risk", "").lower()
#         is_internal = context["features"].get("is_internal_ip", True)

#         score = 0
#         reasons = []

#         if "intrusion" in classification:
#             score += 50
#             reasons.append("Intrusion detected")

#         if protocol_risk == "medium":
#             score += 20
#             reasons.append("Risky protocol")

#         if not is_internal:
#             score += 20
#             reasons.append("External source")

#         if "scan" in classification:
#             score += 10
#             reasons.append("Scan activity")

#         if score >= 70:
#             level = "High"
#         elif score >= 40:
#             level = "Medium"
#         else:
#             level = "Low"

#         context["features"]["risk_score"] = score
#         context["features"]["risk_level"] = level

#         return self.format_output(
#             level,
#             0.85,
#             f"Score: {score}; " + "; ".join(reasons)
#         )

# from core.agent_base import BaseAgent


# class Agent3(BaseAgent):
#     def __init__(self):
#         super().__init__("Agent3_Risk")

#     def run(self, alert, context):

#         features = context.get("features", {})

#         classification = context.get("classification", "").lower()
#         protocol_risk = features.get("protocol_risk", "").lower()
#         is_internal = features.get("is_internal_ip", "Yes")
#         port_category = features.get("port_category", "")
#         asset_value = features.get("asset_value", "Low")
#         geo_anomaly = features.get("geo_anomaly", "No")

#         score = 0
#         reasons = []

#         # Rule 1: confirmed intrusion behaviour
#         if "intrusion" in classification:
#             score += 50
#             reasons.append("Intrusion detected")

#         # Rule 2: credential access attempt
#         if "credential" in classification:
#             score += 35
#             reasons.append("Credential attack pattern")

#         # Rule 3: suspicious login behaviour
#         if "suspicious login" in classification:
#             score += 25
#             reasons.append("Suspicious login detected")

#         # Rule 4: scan activity
#         if "scan" in classification:
#             score += 20
#             reasons.append("Scanning behaviour observed")

#         # Rule 5: external geo_anomaly = features.get("geo_anomaly", "No")
#         if is_internal == "No":
#             score += 15
#             reasons.append("External source IP")

#         # Rule 6: risky protocol usage
#         if protocol_risk == "medium":
#             score += 15
#             reasons.append("Medium-risk protocol used")

#         # Rule 7: privileged service targeting
#         if port_category in ["SSH", "RDP"]:
#             score += 20
#             reasons.append("Privileged service targeted")

#         # Rule 8: critical asset targeted
#         if asset_value == "High":
#             score += 30
#             reasons.append("Critical asset targeted")

#         # Rule 9: geo anomaly detected
#         if geo_anomaly == "Yes":
#             score += 15
#             reasons.append("Geolocation anomaly detected")

#         # Risk level classification
#         if score >= 70:
#             level = "High"
#         elif score >= 40:
#             level = "Medium"
#         else:
#             level = "Low"

#         # Store results in shared pipeline context
#         context["features"]["risk_score"] = score
#         context["features"]["risk_level"] = level

#         return self.format_output(
#             level,
#             0.9,
#             f"Risk Score: {score}; " + "; ".join(reasons)
#         )

# from core.agent_base import BaseAgent


# class Agent3(BaseAgent):
#     def __init__(self):
#         super().__init__("Agent3_Risk")

#     def run(self, alert, context):

#         features = context.get("features", {})

#         classification = context.get("classification", "").lower()
#         protocol_risk = features.get("protocol_risk", "").lower()
#         is_internal = features.get("is_internal_ip", "Yes")
#         port_category = features.get("port_category", "")
#         asset_value = features.get("asset_value", "Low")
#         geo_anomaly = features.get("geo_anomaly", "No")

#         score = 0
#         reasons = []

#         if "intrusion" in classification:
#             score += 60
#             reasons.append("Intrusion detected")

#         if "credential" in classification:
#             score += 50
#             reasons.append("Credential attack pattern")

#         if "suspicious login" in classification:
#             score += 40
#             reasons.append("Suspicious login detected")

#         if "scan" in classification:
#             score += 30
#             reasons.append("Scanning behaviour observed")

#         if is_internal == "No":
#             score += 25
#             reasons.append("External source IP")

#         if protocol_risk == "medium":
#             score += 25
#             reasons.append("Medium-risk protocol used")

#         if port_category in ["SSH", "RDP"]:
#             score += 30
#             reasons.append("Privileged service targeted")

#         if asset_value == "High":
#             score += 40
#             reasons.append("Critical asset targeted")

#         if geo_anomaly == "Yes":
#             score += 25
#             reasons.append("Geolocation anomaly detected")

#         if score >= 80:
#             level = "High"
#         elif score >= 40:
#             level = "Medium"
#         else:
#             level = "Low"

#         context["features"]["risk_score"] = score
#         context["features"]["risk_level"] = level

#         return self.format_output(
#             level,
#             0.9,
#             f"Risk Score: {score}; " + "; ".join(reasons)
#         )

from core.agent_base import BaseAgent
import requests


class Agent3(BaseAgent):

    def __init__(self):
        super().__init__("Agent3_Risk")

    def run(self, alert, context):

        features = context.get("features", {})

        classification = context.get("classification", "").lower()
        protocol_risk = features.get("protocol_risk", "").lower()
        is_internal = features.get("is_internal_ip", "Yes")
        port_category = features.get("port_category", "")
        asset_value = features.get("asset_value", "Low")
        geo_anomaly = features.get("geo_anomaly", "No")

        score = 0
        reasons = []

        if "intrusion" in classification:
            score += 60
            reasons.append("Intrusion detected")

        if "credential" in classification:
            score += 50
            reasons.append("Credential attack pattern")

        if "suspicious login" in classification:
            score += 40
            reasons.append("Suspicious login detected")

        if "scan" in classification:
            score += 30
            reasons.append("Scanning behaviour observed")

        if is_internal == "No":
            score += 25
            reasons.append("External source IP")

        if protocol_risk == "medium":
            score += 25
            reasons.append("Medium-risk protocol used")

        if port_category in ["SSH", "RDP"]:
            score += 30
            reasons.append("Privileged service targeted")

        if asset_value == "High":
            score += 40
            reasons.append("Critical asset targeted")

        if geo_anomaly == "Yes":
            score += 25
            reasons.append("Geolocation anomaly detected")

        if score >= 80:
            level = "High"
        elif score >= 40:
            level = "Medium"
        else:
            level = "Low"

        context["features"]["risk_score"] = score
        context["features"]["risk_level"] = level


        # 🔹 Store Agent3 output in MongoDB
        try:
            requests.post(
                "http://localhost:5000/api/agent3",
                json={
                    "alert_id": alert.get("_id", None),
                    "alert": alert,
                    "features": context["features"],
                    "risk_score": score,
                    "risk_level": level,
                    "confidence": 0.9
                }
            )
        except Exception as e:
            print("Agent3 DB store failed:", e)


        return self.format_output(
            level,
            0.9,
            f"Risk Score: {score}; " + "; ".join(reasons)
        )