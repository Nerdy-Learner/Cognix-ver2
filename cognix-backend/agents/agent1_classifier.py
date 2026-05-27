from core.agent_base import BaseAgent

import pandas as pd
import numpy as np
import joblib
import os
import requests


class Agent1(BaseAgent):

    def __init__(self):

        super().__init__("Agent1_ML_Classifier")

        BASE_DIR = os.path.dirname(
            os.path.dirname(__file__)
        )

        MODELS_DIR = os.path.join(
            BASE_DIR,
            "models"
        )

        # =========================
        # LOAD MODELS
        # =========================

        self.agent1a = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent1_rf_final.pkl"
            )
        )

        self.agent1b = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent1B_attack_classifier.pkl"
            )
        )

        self.label_encoder = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent1B_label_encoder.pkl"
            )
        )

        self.feature_columns = joblib.load(
            os.path.join(
                MODELS_DIR,
                "agent1_feature_columns.pkl"
            )
        )

        self.agent1b_features = list(
            self.agent1b.feature_names_in_
        )

    # =========================
    # PREPROCESS INPUT
    # =========================

    def preprocess(self, alert, feature_set):

        df = pd.DataFrame(
            columns=feature_set
        )

        df.loc[0] = 0

        for feature in feature_set:

            if feature in alert:

                df.at[0, feature] = alert[feature]

        df = df.apply(
            pd.to_numeric,
            errors="coerce"
        ).fillna(0)

        return df

    # =========================
    # MAIN EXECUTION
    # =========================

    def run(self, alert, context):

        try:

            processed_a = self.preprocess(
                alert,
                self.feature_columns
            )

            # =========================
            # AGENT-1A
            # =========================

            binary_pred = self.agent1a.predict(
                processed_a
            )[0]

            binary_probs = self.agent1a.predict_proba(
                processed_a
            )[0]

            confidence = float(
                np.max(binary_probs)
            )

            # =========================
            # BENIGN
            # =========================

            if binary_pred == 0:

                decision = "Normal Traffic"

                attack_type = "BENIGN"

                reason = (
                    "Traffic classified as benign"
                )

            # =========================
            # MALICIOUS
            # =========================

            else:

                processed_b = self.preprocess(
                    alert,
                    self.agent1b_features
                )

                multiclass_pred = self.agent1b.predict(
                    processed_b
                )[0]

                attack_type = (
                    self.label_encoder
                    .inverse_transform(
                        [multiclass_pred]
                    )[0]
                )

                decision = attack_type

                reason = (
                    f"Detected attack: "
                    f"{attack_type}"
                )

            # =========================
            # UPDATE CONTEXT
            # =========================

            context["classification"] = decision

            context["features"].update({

                "attack_type":
                    attack_type,

                "agent1_confidence":
                    confidence
            })

            # =========================
            # STORE OUTPUT (Commented out to prevent duplicate DB writes; handled by server.js)
            # =========================
            # try:
            #
            #     requests.post(
            #         "http://localhost:3001/api/agent1",
            #         json={
            #
            #             "alert": alert,
            #
            #             "decision": decision,
            #
            #             "confidence": confidence,
            #
            #             "attack_type": attack_type
            #         }
            #     )
            #
            # except Exception as db_error:
            #
            #     print(
            #         "Agent1 DB write failed:",
            #         db_error
            #     )

            return self.format_output(
                decision,
                confidence,
                reason
            )

        except Exception as e:

            print("Agent1 Error:", e)

            return self.format_output(
                "Error",
                0.0,
                str(e)
            )