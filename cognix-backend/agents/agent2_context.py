# from core.agent_base import BaseAgent

# class Agent2(BaseAgent):
#     def __init__(self):
#         super().__init__("Agent2_Context")

#     def run(self, alert, context):
#         src_ip = alert.get("Source_IP", "")
#         port = int(alert.get("Port", 0))
#         protocol = str(alert.get("Protocol", "")).upper()

#         reasons = []

#         # Internal vs External
#         is_internal = src_ip.startswith("192.168") or src_ip.startswith("10.")
#         context["features"]["is_internal_ip"] = "Yes" if is_internal else "No"
#         reasons.append("Internal IP" if is_internal else "External IP")

#         dest_ip = alert.get("Destination_IP", "")

#         # asset criticality
#         if dest_ip.startswith("192.168.1") or dest_ip.startswith("10.0"):
#             asset_value = "High"
#         elif dest_ip.startswith("172.16"):
#             asset_value = "Medium"
#         else:
#             asset_value = "Low"

#         context["features"]["asset_value"] = asset_value

#         # geo anomaly
#         geo_anomaly = not is_internal
#         context["features"]["geo_anomaly"] = "Yes" if geo_anomaly else "No"

#         # Port category
#         if port in [80, 443]:
#             port_category = "Web"
#         elif port == 22:
#             port_category = "SSH"
#         elif port == 25:
#             port_category = "Email"
#         else:
#             port_category = "Other"

#         context["features"]["port_category"] = port_category

#         # Protocol risk
#         if protocol in ["FTP", "TELNET"]:
#             protocol_risk = "High"
#         elif protocol == "UDP":
#             protocol_risk = "Medium"
#         elif protocol in ["HTTP", "HTTPS", "TCP"]:
#             protocol_risk = "Low"
#         else:
#             protocol_risk = "Unknown"

#         context["features"]["protocol_risk"] = protocol_risk

#         decision = "Context Enriched"
#         confidence = 0.8

#         return self.format_output(
#             decision,
#             confidence,
#             f"{'; '.join(reasons)}, Port: {port_category}, Protocol risk: {protocol_risk}"
#         )


from core.agent_base import BaseAgent
import requests


class Agent2(BaseAgent):

    def __init__(self):
        super().__init__("Agent2_Context")


    def run(self, alert, context):

        src_ip = alert.get("Source_IP", "")
        port = int(alert.get("Port", 0))
        protocol = str(alert.get("Protocol", "")).upper()

        reasons = []

        # Internal vs External
        is_internal = src_ip.startswith("192.168") or src_ip.startswith("10.")
        context["features"]["is_internal_ip"] = "Yes" if is_internal else "No"

        reasons.append("Internal IP" if is_internal else "External IP")

        dest_ip = alert.get("Destination_IP", "")

        # Asset criticality
        if dest_ip.startswith("192.168.1") or dest_ip.startswith("10.0"):
            asset_value = "High"
        elif dest_ip.startswith("172.16"):
            asset_value = "Medium"
        else:
            asset_value = "Low"

        context["features"]["asset_value"] = asset_value

        # Geo anomaly
        geo_anomaly = not is_internal
        context["features"]["geo_anomaly"] = "Yes" if geo_anomaly else "No"

        # Port category
        if port in [80, 443]:
            port_category = "Web"
        elif port == 22:
            port_category = "SSH"
        elif port == 25:
            port_category = "Email"
        else:
            port_category = "Other"

        context["features"]["port_category"] = port_category

        # Protocol risk
        if protocol in ["FTP", "TELNET"]:
            protocol_risk = "High"
        elif protocol == "UDP":
            protocol_risk = "Medium"
        elif protocol in ["HTTP", "HTTPS", "TCP"]:
            protocol_risk = "Low"
        else:
            protocol_risk = "Unknown"

        context["features"]["protocol_risk"] = protocol_risk

        decision = "Context Enriched"
        confidence = 0.8


        # 🔹 Store Agent2 output in MongoDB
        try:
            requests.post(
                "http://localhost:5000/api/agent2",
                json={
                    "alert_id": alert.get("_id", None),
                    "alert": alert,
                    "features": context["features"],
                    "decision": decision,
                    "confidence": confidence
                }
            )
        except Exception as e:
            print("Agent2 DB store failed:", e)


        return self.format_output(
            decision,
            confidence,
            f"{'; '.join(reasons)}, Port: {port_category}, Protocol risk: {protocol_risk}"
        )