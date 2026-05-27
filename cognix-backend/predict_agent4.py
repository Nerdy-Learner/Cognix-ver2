import warnings
warnings.filterwarnings("ignore")

import sys
import json
import pickle
import os

# resolve models path
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "models", "agent4_model.pkl")
encoder_path = os.path.join(base_dir, "models", "agent4_feature_encoders.pkl")
label_encoder_path = os.path.join(base_dir, "models", "agent4_label_encoder.pkl")
features_path = os.path.join(base_dir, "models", "agent4_features.pkl")

# load model + encoders
model = pickle.load(open(model_path, "rb"))
feature_encoders = pickle.load(open(encoder_path, "rb"))
label_encoder = pickle.load(open(label_encoder_path, "rb"))
feature_columns = pickle.load(open(features_path, "rb"))

# safe encoding
def safe_encode(column, value):
    encoder = feature_encoders[column]
    if value not in encoder.classes_:
        value = encoder.classes_[0]
    return encoder.transform([value])[0]


# read input from Node
input_json = sys.stdin.read()
features = json.loads(input_json)

# build input row
import pandas as pd
import numpy as np

input_data = {
    "failed_logins": features.get("failed_logins", 0),
    "total_attempts": features.get("total_attempts", 0),
    "unique_devices": features.get("unique_devices", 0),
    "failure_ratio": features.get("failure_ratio", 0),
    "risk_score": features.get("risk_score", 0),
    "attack_type": features.get("attack_type", "BENIGN"),
    "mitre_tactic": features.get("mitre_tactic", "non-attack"),
    "severity": features.get("severity", "Low"),
    "risk_level": features.get("risk_level", "LOW"),
}

df = pd.DataFrame([input_data])
df = df.reindex(columns=feature_columns, fill_value=0)

# encode categoricals
categorical_columns = [
    "attack_type",
    "mitre_tactic",
    "severity",
    "risk_level"
]

for col in categorical_columns:
    value = df[col].iloc[0]
    encoder = feature_encoders[col]
    if value not in encoder.classes_:
        value = encoder.classes_[0]
    df[col] = encoder.transform([value])

# predict
prediction = int(model.predict(df)[0])
probs = model.predict_proba(df)[0]
confidence = float(np.max(probs))
action = label_encoder.inverse_transform([prediction])[0]

print(f"{prediction},{confidence},{action}")
