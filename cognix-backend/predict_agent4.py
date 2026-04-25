import warnings
warnings.filterwarnings("ignore")

import sys
import json
import pickle
import os

# resolve models path
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "models", "agent4_model.pkl_ver2")
encoder_path = os.path.join(base_dir, "models", "encoders.pkl")

# load model + encoders
model = pickle.load(open(model_path, "rb"))
encoders = pickle.load(open(encoder_path, "rb"))

# safe encoding (same as your Agent4 class)
def safe_encode(column, value):
    encoder = encoders[column]
    if value not in encoder.classes_:
        value = encoder.classes_[0]
    return encoder.transform([value])[0]


# read input from Node
# print("START")  # debug

input_json = sys.stdin.read()

# print("RECEIVED:", input_json)  # debug

features = json.loads(input_json)

# encode features
alert_type_enc = safe_encode("Alert_Type", features["Alert_Type"])
internal_enc = safe_encode("is_internal_ip", features["is_internal_ip"])
port_enc = safe_encode("port_category", features["port_category"])
protocol_enc = safe_encode("protocol_risk", features["protocol_risk"])
asset_enc = safe_encode("asset_value", features["asset_value"])
geo_enc = safe_encode("geo_anomaly", features["geo_anomaly"])

model_features = [[
    alert_type_enc,
    internal_enc,
    port_enc,
    protocol_enc,
    asset_enc,
    geo_enc
]]

# print("ENCODING DONE")  # debug

prediction = int(model.predict(model_features)[0])
probs = model.predict_proba(model_features)[0]

confidence = float(probs[prediction])

print(f"{prediction},{confidence}")
