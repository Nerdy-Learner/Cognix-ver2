from core.agent_base import BaseAgent

import pandas as pd
import numpy as np
import joblib
import os
import requests


class Agent4(BaseAgent):

    def __init__(self):

        super().__init__(
            "Agent4_SOC_Decision"
        )

        BASE_DIR = os.path.dirname(
            os.path.dirname(__file__)
        )

        MODELS_DIR = os.path.join(
            BASE_DIR,
            "models"
        )

        # =========================
        # LOAD MODEL
        # =========================

        self.model = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent4_model.pkl"
            )
        )

        # =========================
        # LOAD FEATURE ENCODERS
        # =========================

        self.feature_encoders = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent4_feature_encoders.pkl"
            )
        )

        # =========================
        # LOAD LABEL ENCODER
        # =========================

        self.label_encoder = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent4_label_encoder.pkl"
            )
        )

        # =========================
        # LOAD FEATURES
        # =========================

        self.features = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent4_features.pkl"
            )
        )

    # =========================
    # MAIN EXECUTION
    # =========================

    def run(self, alert, context):

        try:

            features = context.get(
                "features",
                {}
            )

            # =========================
            # BUILD INPUT
            # =========================

            input_data = {

                # Behavioral
                "failed_logins":
                    features.get(
                        "failed_logins",
                        0
                    ),

                "total_attempts":
                    features.get(
                        "total_attempts",
                        0
                    ),

                "unique_devices":
                    features.get(
                        "unique_devices",
                        0
                    ),

                "failure_ratio":
                    features.get(
                        "failure_ratio",
                        0
                    ),

                "risk_score":
                    features.get(
                        "risk_score",
                        0
                    ),

                # Agent1
                "attack_type":
                    features.get(
                        "attack_type",
                        "BENIGN"
                    ),

                # Agent2
                "mitre_tactic":
                    features.get(
                        "mitre_tactic",
                        "non-attack"
                    ),

                "severity":
                    features.get(
                        "severity",
                        "Low"
                    ),

                # Agent3
                "risk_level":
                    features.get(
                        "risk_level",
                        "LOW"
                    )
            }

            df = pd.DataFrame(
                [input_data]
            )

            df = df.reindex(
                columns=self.features,
                fill_value=0
            )


            # =========================
            # ENCODE CATEGORICALS
            # =========================

            categorical_columns = [

                "attack_type",

                "mitre_tactic",

                "severity",

                "risk_level"
            ]

            for col in categorical_columns:

                encoder = self.feature_encoders[col]

                value = df[col].iloc[0]

                # Handle unseen values
                if value not in encoder.classes_:

                    value = encoder.classes_[0]

                df[col] = encoder.transform(
                    [value]
                )


            # =========================
            # PREDICT
            # =========================

            prediction = self.model.predict(
                df
            )[0]

            probabilities = (
                self.model.predict_proba(df)[0]
            )

            confidence = float(
                np.max(probabilities)
            )

            action = (
                self.label_encoder
                .inverse_transform(
                    [prediction]
                )[0]
            )

            # =========================
            # PRIORITY
            # =========================

            priority_map = {

                "BLOCK": "P1",

                "ESCALATE": "P2",

                "ALERT": "P3",

                "MONITOR": "P4"
            }

            priority = priority_map.get(
                action,
                "P4"
            )

            # =========================
            # UPDATE CONTEXT
            # =========================

            context["features"].update({

                "soc_action":
                    action,

                "soc_priority":
                    priority
            })

            # =========================
            # STORE OUTPUT (Commented out to prevent duplicate DB writes; handled by server.js)
            # =========================
            # try:
            #
            #     requests.post(
            #         "http://localhost:3001/api/agent4",
            #         json={
            #
            #             "action":
            #                 action,
            #
            #             "priority":
            #                 priority,
            #
            #             "confidence":
            #                 confidence,
            #
            #             "features":
            #                 context["features"]
            #         }
            #     )
            #
            # except Exception as db_error:
            #
            #     print(
            #         "Agent4 DB write failed:",
            #         db_error
            #     )

            # =========================
            # RETURN OUTPUT
            # =========================

            return self.format_output(

                action,

                confidence,

                f"SOC priority: "
                f"{priority}"
            )

        except Exception as e:

            print("Agent4 Error:", e)

            return self.format_output(

                "ERROR",

                0.0,

                str(e)
            )