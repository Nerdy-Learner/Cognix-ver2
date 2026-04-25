from fastapi import FastAPI
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware

# --- Import Orchestrator ---
from core.orchestrator import Orchestrator

# --- Import Agents ---
from agents.agent1_classifier import Agent1
from agents.agent2_context import Agent2
from agents.agent3_risk import Agent3
from agents.agent4_ai import Agent4

# --- App Init ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MongoDB ---
client = MongoClient("mongodb://localhost:27017/")
db = client["cognix"]

raw_collection = db["incidents"]
final_collection = db["final_results"]

# --- Health Check ---
@app.get("/")
def home():
    return {"message": "SOC AI Agentic Backend Running"}

# --- Get Raw Incidents ---
@app.get("/incidents")
def get_incidents():
    return list(raw_collection.find({}, {"_id": 0}))

# --- Clear Incidents ---
@app.delete("/clear-incidents")
def clear_incidents():
    raw_collection.delete_many({})
    final_collection.delete_many({})
    return {"message": "All data cleared"}

# --- Dataset Viewer ---
@app.get("/dataset/{name}")
def get_dataset(name: str):
    collection = db[name]
    data = list(collection.find({}, {"_id": 0}))

    if not data:
        return {"headers": [], "data": []}

    headers = list(data[0].keys())

    return {
        "headers": headers,
        "data": data
    }

# --- Agent Pipeline Setup ---
# agents = [
#     Agent1(),
#     Agent2(),
#     Agent3(),
#     Agent4()
# ]

# orchestrator = Orchestrator(agents)

# --- MAIN API (Agentic Execution) ---
# @app.post("/analyze")
# def analyze_alert(alert: dict):
#     try:
#         result = orchestrator.run_pipeline(
#             alert if "Source_IP" in alert else alert.get("alert", {})
#         )

#         # store a COPY in DB (important)
#         db_result = result.copy()
#         final_collection.insert_one(db_result)

#         return result

#     except Exception as e:
#         return {"error": str(e)}
    


# def analyze_all():
#     results = []

#     data = list(raw_collection.find({}, {"_id": 0}))

#     for alert in data:
#         result = orchestrator.run_pipeline(alert)
#         results.append(result)

#     return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
























# from fastapi import FastAPI
# from pymongo import MongoClient
# from fastapi.middleware.cors import CORSMiddleware

# from agents.agent1_classifier import Agent1

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# client = MongoClient("mongodb://localhost:27017/")
# db = client["cognix"]

# raw_collection = db["incidents"]
# agent1_collection = db["agent_1_output"]
# agent2_collection = db["agent_2_output"]
# agent3_collection = db["agent_3_output"]

# @app.get("/")
# def home():
#     return {"message": "SOC AI backend running"}

# @app.get("/incidents")
# def get_incidents():
#     data = list(raw_collection.find({}, {"_id": 0}))
#     return data

# @app.delete("/clear-incidents")
# def clear_incidents():
#     raw_collection.delete_many({})

#     return {"message": "All incidents deleted"}

# @app.get("/agents/raw")
# def raw_data():
#     return list(raw_collection.find({}, {"_id":0}))

# @app.get("/dataset/{name}")
# def get_dataset(name: str):

#     collection = db[name]

#     data = list(collection.find({}, {"_id": 0}))

#     if not data:
#         return {"headers": [], "data": []}

#     headers = list(data[0].keys())

#     return {
#         "headers": headers,
#         "data": data
#     }




# agents = [
#     Agent1(),
#     Agent2(),
#     Agent3(),
#     Agent4()
# ]

# orchestrator = Orchestrator(agents)


# @app.post("/analyze")
# def analyze_alert(alert: dict):
#     result = orchestrator.run_pipeline(alert)
#     return result


























# @app.get("/agents/raw")
# def raw_data():
#     return list(collection.find({"stage": "raw"}, {"_id": 0}))

# @app.get("/agents/agent1")
# def agent1_data():
#     return list(collection.find({"stage": "agent1"}, {"_id": 0}))

# @app.get("/agents/raw")
# def raw_data():
#     return list(collection.find({"stage": "raw"}, {"_id": 0}))

# @app.get("/agents/agent1")
# def agent1_data():
#     return list(collection.find({"stage": "agent1"}, {"_id": 0}))



# # ----------------------- AGENT -1 ------------------------------------------------

# def alert_analysis(row):

#     if row.get("Intrusion") == 1:
#         return "Intrusion Attempt"

#     scan = str(row.get("Scan_Type","")).lower()
#     user = str(row.get("User_Agent","")).lower()
#     port = str(row.get("Port",""))

#     if "bot" in scan:
#         return "Bot Activity"

#     if "nmap" in user:
#         return "Port Scan"

#     if port in ["22","23","3389"]:
#         return "Suspicious Login"

#     if scan == "normal":
#         return "Normal Traffic"

#     return "Unknown Activity"


# @app.get("/run-agent1")
# def run_agent1():

#     agent1_collection.delete_many({})

#     for incident in raw_collection.find({}, {"_id": 0}):

#         alert_type = alert_analysis(incident)

#         incident["Alert_Type"] = alert_type

#         agent1_collection.insert_one(incident)

#     return {"message": "Agent-1 completed"}


# @app.get("/agents/agent1")
# def agent1_data():
#     return list(agent1_collection.find({}, {"_id":0}))

# # ----------------------- AGENT -2 ------------------------------------------------
# def enrich_context(row):

#     src_ip = row.get("Source_IP", "")
#     port = row.get("Port", "")
#     protocol = row.get("Protocol", "")

#     # internal vs external IP
#     internal = "Yes" if (src_ip.startswith("192.168") or src_ip.startswith("10.")) else "No"

#     # port category
#     port_category = "Other"
#     if port == "80":
#         port_category = "Web"
#     elif port == "25":
#         port_category = "Email"
#     elif port == "22":
#         port_category = "SSH"

#     # protocol risk
#     protocol_risk = "Low"
#     if protocol in ["UDP", "FTP"]:
#         protocol_risk = "Medium"

#     return internal, port_category, protocol_risk


# @app.get("/run-agent2")
# def run_agent2():

#     agent2_collection.delete_many({})

#     data = list(agent1_collection.find({}, {"_id": 0}))

#     for row in data:

#         internal, port_category, protocol_risk = enrich_context(row)

#         row["is_internal_ip"] = internal
#         row["port_category"] = port_category
#         row["protocol_risk"] = protocol_risk

#         agent2_collection.insert_one(row)

#     return {"message": "Agent-2 (Context Enrichment) completed"}

# # ----------------------- AGENT -3 ------------------------------------------------



# def calculate_risk(row):

#     alert = str(row.get("Alert_Type", "")).lower()
#     protocol_risk = str(row.get("protocol_risk", "")).lower()
#     internal = row.get("is_internal_ip", "No")

#     score = 0

#     if "brute" in alert or "malware" in alert:
#         score += 50

#     if protocol_risk == "medium":
#         score += 20

#     if internal == "No":
#         score += 20

#     if "scan" in alert:
#         score += 10

#     if score >= 70:
#         level = "High"
#     elif score >= 40:
#         level = "Medium"
#     else:
#         level = "Low"

#     return score, level


# @app.get("/run-agent3")
# def run_agent3():

#     agent3_collection.delete_many({})

#     data = list(agent2_collection.find({}, {"_id": 0}))

#     for row in data:

#         score, level = calculate_risk(row)

#         row["risk_score"] = score
#         row["risk_level"] = level

#         agent3_collection.insert_one(row)

#     return {"message": "Agent-3 completed"}