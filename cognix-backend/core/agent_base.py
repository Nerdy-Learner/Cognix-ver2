from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def run(self, alert, context):
        pass

    def format_output(self, decision, confidence, reason):
        return {
            "agent": self.name,
            "decision": decision,
            "confidence": confidence,
            "reason": reason
        }