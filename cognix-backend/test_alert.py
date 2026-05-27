from agents.agent1_classifier import Agent1
from agents.agent2_context import Agent2
from agents.agent3_risk import Agent3
from agents.agent4_ai import Agent4

from core.orchestrator import Orchestrator


# =========================
# TEST ALERT
# =========================

alert = {

    # =========================
    # FLOW FEATURES
    # =========================

    "Flow Duration": 50000,

    "Total Fwd Packets": 12,

    "Total Backward Packets": 8,

    "Flow Bytes/s": 12000,

    "Flow Packets/s": 400,

    "Fwd Packet Length Mean": 300,

    "Bwd Packet Length Mean": 250,

    "Flow IAT Mean": 1500,

    "Fwd IAT Mean": 800,

    "Bwd IAT Mean": 700,

    # =========================
    # HTTP FEATURES
    # =========================

    "request":
        "GET /wp-login.php HTTP/1.1",

    "method":
        "GET",

    "status":
        401,

    "user_agent":
        "sqlmap",

    "src_ip":
        "192.168.1.10",

    "dst_ip":
        "10.0.0.5",
    
    "src_user": "Administrator"
}


# =========================
# LOAD AGENTS
# =========================

agent1 = Agent1()

# print("\nMODEL FEATURES:\n")

# print(
#     agent1.agent1a.feature_names_in_
# )

# print("\nAGENT1B FEATURES:\n")

# print(
#     agent1.agent1b.feature_names_in_
# )

# print("\nTOTAL AGENT1B:\n")

# print(
#     len(agent1.agent1b.feature_names_in_)
# )

# print("\nTOTAL FEATURES:\n")

# print(
#     len(agent1.agent1a.feature_names_in_)
# )

# print("\nLOADED FEATURE_COLUMNS:\n")

# print(
#     agent1.feature_columns[:20]
# )

print("\nTOTAL LOADED:\n")

print(
    len(agent1.feature_columns)
)

agent2 = Agent2()

agent3 = Agent3()
agent4 = Agent4()

# =========================
# CREATE ORCHESTRATOR
# =========================


pipeline = Orchestrator([

    agent1,
    agent2,
    agent3,
    agent4
])


# =========================
# RUN PIPELINE
# =========================

result = pipeline.run_pipeline(alert)

print("\nFINAL PIPELINE OUTPUT:\n")

print(result)