class Orchestrator:
    def __init__(self, agents):
        self.agents = agents

    def run_pipeline(self, alert):
        context = {
            "history": [],
            "features": {}
        }

        for agent in self.agents:
            output = agent.run(alert, context)
            context["history"].append(output)

        return {
            "alert": alert,
            "agent_outputs": context["history"],
            "final_decision": context["history"][-1] if context["history"] else None,
            "features": context["features"]
        }