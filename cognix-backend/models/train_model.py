import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import pickle

df = pd.read_csv("../data/soc_agent_dataset.csv")

df["risk_num"] = df["Intrusion"].apply(lambda x: 2 if x == 1 else 0)
df["internal"] = df["Source_IP"].apply(lambda x: 1 if str(x).startswith("192.168") else 0)
df["suspicious"] = df["User_Agent"].apply(
    lambda x: 1 if any(k in str(x).lower() for k in ["nmap", "nikto", "bot"]) else 0
)
df["external"] = df["Source_IP"].apply(lambda ip: 0 if ip.startswith("192.168") else 1)

X = df[["risk_num","internal","suspicious","external"]]

def label_row(row):
    if row["Intrusion"] == 1:
        return "Escalate"
    elif row["suspicious"] == 1:
        return "Investigate"
    elif row["external"] == 1:
        return "Monitor"
    else:
        return "Ignore"

y = df.apply(label_row, axis=1)

model = DecisionTreeClassifier(class_weight="balanced")
model.fit(X,y)

pickle.dump(model, open("../models/agent4_model.pkl","wb"))

print("Model trained and saved.")