from core.agent_base import BaseAgent

import pandas as pd
import os
import requests


class Agent3(BaseAgent):

    def __init__(self):

        super().__init__("Agent3_Risk")

        BASE_DIR = os.path.dirname(
            os.path.dirname(__file__)
        )

        DATA_PATH = os.path.join(
            BASE_DIR,
            "models",
            "agent3_output.csv"
        )

        # =========================
        # LOAD USER RISK DB
        # =========================

        self.risk_db = pd.read_csv(
            DATA_PATH
        )

    def run(self, alert, context):

        features = context.get(
            "features",
            {}
        )

        classification = context.get(
            "classification",
            ""
        ).lower()

        severity = features.get(
            "severity",
            "None"
        )

        user = alert.get(
            "src_user",
            ""
        )

        score = 0

        reasons = []

        # =========================
        # AGENT1 CORRELATION
        # =========================

        if "portscan" in classification:

            score += 30

            reasons.append(
                "Port scanning detected"
            )

        if "ddos" in classification:

            score += 50

            reasons.append(
                "DDoS activity detected"
            )

        # =========================
        # AGENT2 CORRELATION
        # =========================

        severity_weight = {

            "None": 0,

            "Low": 10,

            "Medium": 25,

            "High": 40,

            "Critical": 60
        }

        score += severity_weight.get(
            severity,
            0
        )

        # =========================
        # USER RISK LOOKUP
        # =========================

        user_data = self.risk_db[
            self.risk_db["user"] == user
        ]

        if not user_data.empty:

            user_data = user_data.iloc[0]

            user_risk = float(
                user_data["risk_score"]
            )

            user_level = str(
                user_data["risk_level"]
            )

            score += user_risk * 0.3

            reasons.append(
                f"User behavioral risk: "
                f"{user_level}"
                f"(score={user_risk})"
            )
        else:

            reasons.append(
                "No historical user risk found"
            )


        # =========================
        # LIMIT SCORE
        # =========================

        score = min(score, 100)

        # =========================
        # FINAL LEVEL
        # =========================

        if score >= 80:

            level = "CRITICAL"

        elif score >= 60:

            level = "HIGH"

        elif score >= 30:

            level = "MEDIUM"

        else:

            level = "LOW"

        # =========================
        # UPDATE CONTEXT
        # =========================

        context["features"].update({

            "risk_score":
                score,

            "risk_level":
                level
        })

        # =========================
        # STORE OUTPUT (Commented out to prevent duplicate DB writes; handled by server.js)
        # =========================
        # try:
        #
        #     requests.post(
        #         "http://localhost:3001/api/agent3",
        #         json={
        #
        #             "user": user,
        #
        #             "risk_score": score,
        #
        #             "risk_level": level,
        #
        #             "features":
        #                 context["features"]
        #         }
        #     )
        #
        # except Exception as e:
        #
        #     print(
        #         "Agent3 DB store failed:",
        #         e
        #     )

        return self.format_output(

            level,

            score / 100,

            "; ".join(reasons)
        )