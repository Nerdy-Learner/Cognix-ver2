# from core.agent_base import BaseAgent

# class Agent1(BaseAgent):
#     def __init__(self):
#         super().__init__("Agent1_Classifier")

#         self.common_ports = [80, 443, 22, 21]
#         self.suspicious_agents = ["sqlmap", "nikto", "nmap", "masscan", "bot"]

#     def run(self, alert, context):
#         port = int(alert.get("Port", 0))
#         scan_type = str(alert.get("Scan_Type", "")).lower()
#         user_agent = str(alert.get("User_Agent", "")).lower()
#         intrusion_flag = int(alert.get("Intrusion", 0))
#         protocol = str(alert.get("Protocol", "")).lower()
#         request_type = str(alert.get("Request_Type", "")).lower()

#         reasons = []
#         score = 0

#         if intrusion_flag == 1:
#             score += 2
#             reasons.append("Intrusion flag = 1")

#         if scan_type != "normal":
#             score += 2
#             reasons.append(f"Abnormal scan type: {scan_type}")

#         is_suspicious_agent = any(a in user_agent for a in self.suspicious_agents)
#         if is_suspicious_agent:
#             score += 2
#             reasons.append(f"Suspicious user agent: {user_agent}")

#         is_common_port = port in self.common_ports
#         if not is_common_port:
#             score += 1
#             reasons.append(f"Uncommon port: {port}")

#         if request_type == "ftp" and protocol == "udp":
#             score += 1
#             reasons.append("Unusual FTP over UDP")

#         if score >= 5:
#             decision = "Intrusion Attempt"
#             confidence = 0.9
#         elif score >= 3:
#             decision = "Port Scan"
#             confidence = 0.75
#         elif score >= 1:
#             decision = "Recon Activity"
#             confidence = 0.6
#         else:
#             decision = "Normal Traffic"
#             confidence = 0.4

#         context["features"]["Alert_Type"] = decision
#         context["classification"] = decision
#         context["features"]["is_suspicious_agent"] = is_suspicious_agent
#         context["features"]["is_common_port"] = is_common_port

#         return self.format_output(decision, confidence, "; ".join(reasons) or "Normal traffic")


from core.agent_base import BaseAgent
import requests


class Agent1(BaseAgent):

    def __init__(self):
        super().__init__("Agent1_Classifier")

        self.common_ports = [80, 443, 22, 21]
        self.suspicious_agents = ["sqlmap", "nikto", "nmap", "masscan", "bot"]


    def run(self, alert, context):

        port = int(alert.get("Port", 0))
        scan_type = str(alert.get("Scan_Type", "")).lower()
        user_agent = str(alert.get("User_Agent", "")).lower()
        intrusion_flag = int(alert.get("Intrusion", 0))
        protocol = str(alert.get("Protocol", "")).lower()
        request_type = str(alert.get("Request_Type", "")).lower()

        reasons = []
        score = 0


        if intrusion_flag == 1:
            score += 2
            reasons.append("Intrusion flag = 1")

        if scan_type != "normal":
            score += 2
            reasons.append(f"Abnormal scan type: {scan_type}")

        is_suspicious_agent = any(a in user_agent for a in self.suspicious_agents)
        if is_suspicious_agent:
            score += 2
            reasons.append(f"Suspicious user agent: {user_agent}")

        is_common_port = port in self.common_ports
        if not is_common_port:
            score += 1
            reasons.append(f"Uncommon port: {port}")

        if request_type == "ftp" and protocol == "udp":
            score += 1
            reasons.append("Unusual FTP over UDP")


        if score >= 5:
            decision = "Intrusion Attempt"
            confidence = 0.9

        elif score >= 3:
            decision = "Port Scan"
            confidence = 0.75

        elif score >= 1:
            decision = "Recon Activity"
            confidence = 0.6

        else:
            decision = "Normal Traffic"
            confidence = 0.4


        context["features"]["Alert_Type"] = decision
        context["classification"] = decision
        context["features"]["is_suspicious_agent"] = is_suspicious_agent
        context["features"]["is_common_port"] = is_common_port


        # 🔹 Store Agent1 output in MongoDB
        try:
            print("Agent1 DB write triggered")
            requests.post(
                "http://localhost:5000/api/agent1",
                json={
                    "alert": alert,
                    "decision": decision,
                    "confidence": confidence,
                    "features": context["features"]
                }
            )
        except Exception as e:
            print("Agent1 DB store failed:", e)


        return self.format_output(
            decision,
            confidence,
            "; ".join(reasons) or "Normal traffic"
        )