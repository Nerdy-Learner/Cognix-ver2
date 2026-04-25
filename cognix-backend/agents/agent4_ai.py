# # from core.agent_base import BaseAgent
# # from agents.model import SimpleModel

# # class Agent4(BaseAgent):
# #     def __init__(self):
# #         super().__init__("Agent4_Decision")
# #         self.model = SimpleModel()

# #     def run(self, alert, context):
# #         risk_level = context["features"].get("risk_level", "low").lower()
# #         is_internal = context["features"].get("is_internal_ip", True)
# #         classification = context["features"].get("classification", "").lower()

# #         # --- Convert to numeric features ---
# #         # risk: low=0, medium=1, high=2
# #         if risk_level == "high":
# #             risk_num = 2
# #         elif risk_level == "medium":
# #             risk_num = 1
# #         else:
# #             risk_num = 0

# #         # internal: True=1, False=0
# #         internal_num = 1 if is_internal else 0

# #         # suspicious: yes=1, no=0
# #         suspicious_num = 1 if "suspicious" in classification else 0

# #         # features = [risk_num, internal_num, suspicious_num]
# #         # external: internal=1 → external=0, else 1
# #         external_num = 0 if is_internal else 1

# #         features = [
# #             classification,
# #             is_internal,
# #             port_category,
# #             protocol_risk,
# #             asset_value,
# #             geo_anomaly
# #         ]
# #         # --- ML prediction ---
# #         # decision = self.model.predict(features)

# #         # return self.format_output(
# #         #     decision,
# #         #     0.85,
# #         #     f"ML-based decision using features {features}"
# #         # )

# #         prediction = self.model.predict(features)

# #         risk = context["features"].get("risk_level", "low").lower()

# #         # --- Hybrid override logic ---
# #         # if risk == "high":
# #         #     final_decision = "Escalate"

# #         # elif risk == "Medium":
# #         #     final_decision = "Investigate"

# #         # elif risk == "Low":
# #         #     if prediction == "Investigate":
# #         #         final_decision = "Monitor"
# #         #     else:
# #         #         final_decision = "Ignore"

# #         # else:
# #         final_decision = prediction

# #         # return self.format_output(
# #         #     final_decision,
# #         #     0.9,
# #         #     f"Hybrid decision | ML: {prediction}, Risk: {risk}, Features: {features}"
            
# #         # )
# #         reason = []

# #         reason.append(f"Risk level is {risk}")

# #         if prediction == "Investigate":
# #             reason.append("Suspicious behavior detected by model")

# #         if final_decision == "Monitor":
# #             reason.append("Low risk, so monitoring instead of escalation")

# #         return self.format_output(
# #             final_decision,
# #             0.9,
# #             "; ".join(reason)
# #         )


# from core.agent_base import BaseAgent
# import pickle


# class Agent4(BaseAgent):

#     def __init__(self):
#         super().__init__("Agent4_Decision")

#         # Load trained ML model
#         self.model = pickle.load(open("agent4_model.pkl_ver2", "rb"))

#         # Load encoders used during training
#         self.encoders = pickle.load(open("encoders.pkl", "rb"))

#     def run(self, alert, context):

#         features = context.get("features", {})

#         # Extract features from pipeline context
#         alert_type = features.get("Alert_Type", "Unknown")
#         is_internal_ip = features.get("is_internal_ip", "No")
#         port_category = features.get("port_category", "Other")
#         protocol_risk = features.get("protocol_risk", "Low")
#         asset_value = features.get("asset_value", "Low")
#         geo_anomaly = features.get("geo_anomaly", "No")

#         reasons = []

#         # Encode categorical features using saved LabelEncoders
#         alert_type_enc = self.encoders["Alert_Type"].transform([alert_type])[0]
#         internal_enc = self.encoders["is_internal_ip"].transform([is_internal_ip])[0]
#         port_enc = self.encoders["port_category"].transform([port_category])[0]
#         protocol_enc = self.encoders["protocol_risk"].transform([protocol_risk])[0]
#         asset_enc = self.encoders["asset_value"].transform([asset_value])[0]
#         geo_enc = self.encoders["geo_anomaly"].transform([geo_anomaly])[0]

#         # Create feature vector for model
#         model_features = [[
#             alert_type_enc,
#             internal_enc,
#             port_enc,
#             protocol_enc,
#             asset_enc,
#             geo_enc
#         ]]

#         # ML prediction
#         prediction = self.model.predict(model_features)[0]

#         # Convert prediction into SOC action
#         if prediction == 1:
#             final_decision = "Escalate"
#             reasons.append("Model detected HIGH risk alert")
#         else:
#             final_decision = "Monitor"
#             reasons.append("Model detected LOW risk alert")

#         reasons.append(f"Alert_Type: {alert_type}")
#         reasons.append(f"Port: {port_category}")
#         reasons.append(f"Protocol risk: {protocol_risk}")
#         reasons.append(f"Asset value: {asset_value}")
#         reasons.append(f"Geo anomaly: {geo_anomaly}")

#         return self.format_output(
#             final_decision,
#             0.92,
#             "; ".join(reasons)
#         )

# from core.agent_base import BaseAgent
# import pickle


# class Agent4(BaseAgent):

#     def __init__(self):
#         super().__init__("Agent4_Decision")

#         self.model = pickle.load(open("D:/College/SEM -4/AI_LAB/Project/cognix-react/cognix-backend/models/agent4_model.pkl_ver2", "rb"))
#         self.encoders = pickle.load(open("D:/College/SEM -4/AI_LAB/Project/cognix-react/cognix-backend/models/encoders.pkl", "rb"))


#     def safe_encode(self, column, value):
#         encoder = self.encoders[column]

#         if value not in encoder.classes_:
#             value = encoder.classes_[0]

#         return encoder.transform([value])[0]


#     def run(self, alert, context):

#         features = context.get("features", {})

#         alert_type = features.get("Alert_Type", "Unknown")
#         is_internal_ip = features.get("is_internal_ip", "No")
#         port_category = features.get("port_category", "Other")
#         protocol_risk = features.get("protocol_risk", "Low")
#         asset_value = features.get("asset_value", "Low")
#         geo_anomaly = features.get("geo_anomaly", "No")

#         reasons = []

#         alert_type_enc = self.safe_encode("Alert_Type", alert_type)
#         internal_enc = self.safe_encode("is_internal_ip", is_internal_ip)
#         port_enc = self.safe_encode("port_category", port_category)
#         protocol_enc = self.safe_encode("protocol_risk", protocol_risk)
#         asset_enc = self.safe_encode("asset_value", asset_value)
#         geo_enc = self.safe_encode("geo_anomaly", geo_anomaly)

#         model_features = [[
#             alert_type_enc,
#             internal_enc,
#             port_enc,
#             protocol_enc,
#             asset_enc,
#             geo_enc
#         ]]

#         prediction = self.model.predict(model_features)[0]
#         probability = self.model.predict_proba(model_features)[0][1]

#         if prediction == 1:
#             final_decision = "Escalate"
#             reasons.append("Model detected HIGH risk alert")
#         else:
#             final_decision = "Monitor"
#             reasons.append("Model detected LOW risk alert")

#         reasons.append(f"Confidence: {round(probability, 2)}")
#         reasons.append(f"Alert_Type: {alert_type}")
#         reasons.append(f"Port: {port_category}")
#         reasons.append(f"Protocol risk: {protocol_risk}")
#         reasons.append(f"Asset value: {asset_value}")
#         reasons.append(f"Geo anomaly: {geo_anomaly}")

#         return self.format_output(
#             final_decision,
#             probability,
#             "; ".join(reasons)
#         )


from core.agent_base import BaseAgent
import pickle
import requests
import os


class Agent4(BaseAgent):

    def __init__(self):
        super().__init__("Agent4_Decision")

        base_dir = os.path.dirname(os.path.dirname(__file__))

        model_path = os.path.join(base_dir, "models", "agent4_model.pkl_ver2")
        encoder_path = os.path.join(base_dir, "models", "encoders.pkl")

        self.model = pickle.load(open(model_path, "rb"))
        self.encoders = pickle.load(open(encoder_path, "rb"))


    def safe_encode(self, column, value):

        encoder = self.encoders[column]

        if value not in encoder.classes_:
            value = encoder.classes_[0]

        return encoder.transform([value])[0]


    def run(self, alert, context):

        features = context.get("features", {})

        alert_type = features.get("Alert_Type", "Unknown")
        is_internal_ip = features.get("is_internal_ip", "No")
        port_category = features.get("port_category", "Other")
        protocol_risk = features.get("protocol_risk", "Low")
        asset_value = features.get("asset_value", "Low")
        geo_anomaly = features.get("geo_anomaly", "No")

        reasons = []

        alert_type_enc = self.safe_encode("Alert_Type", alert_type)
        internal_enc = self.safe_encode("is_internal_ip", is_internal_ip)
        port_enc = self.safe_encode("port_category", port_category)
        protocol_enc = self.safe_encode("protocol_risk", protocol_risk)
        asset_enc = self.safe_encode("asset_value", asset_value)
        geo_enc = self.safe_encode("geo_anomaly", geo_anomaly)

        model_features = [[
            alert_type_enc,
            internal_enc,
            port_enc,
            protocol_enc,
            asset_enc,
            geo_enc
        ]]

        prediction = self.model.predict(model_features)[0]
        probability = self.model.predict_proba(model_features)[0][1]

        if prediction == 1:
            final_decision = "Escalate"
            reasons.append("Model detected HIGH risk alert")
        else:
            final_decision = "Monitor"
            reasons.append("Model detected LOW risk alert")

        reasons.append(f"Confidence: {round(probability, 2)}")
        reasons.append(f"Alert_Type: {alert_type}")
        reasons.append(f"Port: {port_category}")
        reasons.append(f"Protocol risk: {protocol_risk}")
        reasons.append(f"Asset value: {asset_value}")
        reasons.append(f"Geo anomaly: {geo_anomaly}")


        # 🔹 Store Agent4 output in MongoDB
        try:
            requests.post(
                "http://localhost:5000/api/agent4",
                json={
                    "alert_id": alert.get("_id", None),
                    "alert": alert,
                    "features": features,
                    "prediction": prediction,
                    "decision": final_decision,
                    "confidence": probability
                }
            )
        except Exception as e:
            print("Agent4 DB store failed:", e)


        return self.format_output(
            final_decision,
            probability,
            "; ".join(reasons)
        )