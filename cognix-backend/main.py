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
import os
from pathlib import Path

# Load .env manually if it exists in the same folder
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(mongo_uri)

db_name = "cognix"
if "mongodb+srv://" in mongo_uri:
    try:
        path_part = mongo_uri.split("://")[1].split("/", 1)[1]
        parsed = path_part.split("?")[0]
        if parsed:
            db_name = parsed
    except Exception:
        db_name = "cognix"

db = client[db_name]

raw_collection = db["incidents"]
final_collection = db["final_results"]
agent1_collection = db["agent1outputs"]
agent2_collection = db["agent2outputs"]
agent3_collection = db["agent3outputs"]
agent4_collection = db["agent4outputs"]

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
agents = [
    Agent1(),
    Agent2(),
    Agent3(),
    Agent4()
]

orchestrator = Orchestrator(agents)

# --- MAIN API (Agentic Execution) ---
@app.post("/analyze")
def analyze_alert(alert: dict):
    try:
        result = orchestrator.run_pipeline(
            alert if "Source_IP" in alert else alert.get("alert", {})
        )

        # store a COPY in DB safely (prevent DuplicateKeyError from breaking response)
        try:
            db_result = result.copy()
            if "_id" in db_result:
                del db_result["_id"]
            final_collection.insert_one(db_result)
        except Exception as db_err:
            print(f"Database insertion warning: {db_err}")

        return result

    except Exception as e:
        return {"error": str(e)}


@app.post("/analyze-all")
def analyze_all():

    results = []

    # =========================
    # CLEAR OLD OUTPUTS
    # =========================

    agent1_collection.delete_many({})
    agent2_collection.delete_many({})
    agent3_collection.delete_many({})
    agent4_collection.delete_many({})
    final_collection.delete_many({})

    # =========================
    # LOAD INCIDENTS
    # =========================

    data = list(
        raw_collection.find({}, {"_id": 0})
    )

    # =========================
    # RUN PIPELINE
    # =========================

    for alert in data:

        result = orchestrator.run_pipeline(
            alert
        )

        results.append(result)

        outputs = result.get(
            "agent_outputs",
            []
        )

        # =========================
        # STORE AGENT OUTPUTS
        # =========================

        if len(outputs) >= 4:

            agent1_collection.insert_one(
                outputs[0]
            )

            agent2_collection.insert_one(
                outputs[1]
            )

            agent3_collection.insert_one(
                outputs[2]
            )

            agent4_collection.insert_one(
                outputs[3]
            )

        # =========================
        # STORE FINAL RESULT
        # =========================

        final_collection.insert_one({

            "alert":
                result.get("alert"),

            "final_decision":
                result.get(
                    "final_decision"
                ),

            "features":
                result.get("features")
        })

    return {

        "message":
            "Pipeline completed",

        "processed":
            len(results)
    }