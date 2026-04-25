# import pandas as pd
# from sklearn.tree import DecisionTreeClassifier

# class SimpleModel:
#     def __init__(self):
#         self.model = DecisionTreeClassifier(class_weight="balanced")

#         # --- Load dataset ---
#         df = pd.read_csv("data/network_logs.csv")

#         # --- Feature engineering ---
#         df["risk_num"] = df["Intrusion"].apply(lambda x: 2 if x == 1 else 0)
#         df["internal"] = df["Source_IP"].apply(lambda x: 1 if str(x).startswith("192.168") else 0)
#         df["suspicious"] = df["User_Agent"].apply(
#             lambda x: 1 if any(k in str(x).lower() for k in ["nmap", "nikto", "bot"]) else 0
#         )
#         df["external"] = df["Source_IP"].apply(
#             lambda ip: 0 if ip.startswith("192.168") else 1
#         )

#         X = df[["risk_num", "internal", "suspicious", "external"]]

#         # --- Target (simple logic for now) ---
#         def label_row(row):
#             if row["Intrusion"] == 1:
#                 return "Escalate"
#             elif row["suspicious"] == 1:
#                 return "Investigate"
#             elif row["external"] == 1:
#                 return "Monitor"
#             else:
#                 return "Ignore"

#         y = df.apply(label_row, axis=1)

#         self.model.fit(X, y)

#     def predict(self, features):
#         return self.model.predict([features])[0]

import pickle

class SimpleModel:

    def __init__(self):
        self.model = pickle.load(open("models/agent4_model.pkl","rb"))

    def predict(self, features):
        return self.model.predict([features])[0]