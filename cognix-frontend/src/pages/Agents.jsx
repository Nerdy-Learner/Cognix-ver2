import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";
import { getFullIncidents } from "../services/api";
import { getThroughput } from "../services/api";
import { getAgent1Outputs } from "../services/api";
import { getRuntimeLogs } from "../services/api";
import { getStageThroughput } from "../services/api";
import { getStageLatency } from "../services/api";
import { getDatasetByStage } from "../services/api";


const agents = [
  { label: "Raw logs", stage: "01", name: "Data ingestion", desc: "Normalizes raw telemetry into structured payloads.", acc: null, thru: "12k eps", lat: "<1ms", key: "incidents" },
  { label: "Classifier", stage: "02", name: "Classifier agent", desc: "Assigns event type and confidence for analyst routing.", acc: "97.4%", thru: "840 eps", lat: "48ms", key: "agent_1_output" },
  { label: "Context", stage: "03", name: "Context agent", desc: "Enriches detections with intel, asset, and user context.", acc: "94.1%", thru: "620 eps", lat: "120ms", key: "agent_2_output" },
  { label: "Risk", stage: "04", name: "Risk agent", desc: "Scores severity and recommends escalate, monitor, or close.", acc: "96.8%", thru: "580 eps", lat: "65ms", key: "agent_3_output" },
  { label: "Decision", stage: "05", name: "Decision agent", desc: "Scores severity and recommends escalate, monitor, or close.", acc: "96.8%", thru: "580 eps", lat: "65ms", key: "agent_4_output" }
];

const logLinesSeed = [
  "[12:01:44] INPUT brute_force — 185.220.101.47 → ssh:22",
  "[12:01:44] MODEL inference running...",
  "[12:01:45] OUTPUT { category: 'Brute Force', confidence: 0.98 }",
  "[12:01:47] ESCALATING 2 events → Context Agent",
  "[12:01:49] Accuracy this window: 97.4%",
];

const pipelineRows = [
  { ts: "12:01:44", type: "Brute force", ip: "185.220.101.47", score: 0.92, rec: "Escalate" },
  { ts: "12:01:45", type: "C2 comms", ip: "91.108.4.200", score: 0.87, rec: "Escalate" },
  { ts: "12:01:46", type: "Recon", ip: "45.33.32.156", score: 0.61, rec: "Monitor" },
  { ts: "12:01:47", type: "Phishing", ip: "104.21.90.13", score: 0.55, rec: "Review" },
];

function useCounter(target, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function Agents() {
  const [activeAgent, setActiveAgent] = useState(agents[1]);
  const [dataset, setDataset] = useState(null);
  const [escalationCount, setEscalationCount] = useState(0);
  const [throughputEPS, setThroughputEPS] = useState(0);
  const [stageEPS, setStageEPS] = useState(null);
  const [classifiedCount, setClassifiedCount] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [stageLatency, setStageLatency] = useState(null);
  const logRef = useRef(null);
  const lineIndex = useRef(0);

  const eps = useCounter(throughputEPS);
  const classified = useCounter(classifiedCount, 1800);
  const escalations = useCounter(escalationCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogLines((current) => {
        const next = [...current, { text: logLinesSeed[lineIndex.current % logLinesSeed.length], index: Date.now() }];
        lineIndex.current += 1;
        return next.slice(-16);
      });
    }, 1900);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        const res = await getFullIncidents();
        const data = res.data;

        const count = data.filter(
          (incident) => incident.agent4?.decision === "Escalate"
        ).length;

        setEscalationCount(count);

      } catch (err) {
        console.error("Failed to load escalation count:", err);
      }
    };

    fetchEscalations();
  }, []);

  useEffect(() => {
    const fetchThroughput = async () => {
      try {
        const res = await getThroughput();
        setThroughputEPS(Math.round(res.data.eps));
      } catch (err) {
        console.error(err);
      }
    };

    fetchThroughput();

    const interval = setInterval(fetchThroughput, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchClassified = async () => {
      try {
        const res = await getAgent1Outputs();
        setClassifiedCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch classified count:", err);
      }
    };

    fetchClassified();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getRuntimeLogs();

        setLogLines(
          res.data.map((entry, index) => ({
            text: entry.text,
            index
          }))
        );

      } catch (err) {
        console.error("Runtime log error:", err);
      }
    };

    fetchLogs();

    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeAgent?.key || activeAgent.key === "incidents") return;

    const fetchStage = async () => {
      try {
        const res = await getStageThroughput(activeAgent.key);
        setStageEPS(Math.round(res.data.eps));
      } catch (err) {
        console.error(err);
      }
    };

    fetchStage();
  }, [activeAgent]);


  const loadDataset = async (agent) => {
    setActiveAgent(agent);
    setStageEPS(null);

    // fetch stage latency
    const fetchLatency = async (stageKey) => {
      try {
        if (stageKey === "incidents") {
          setStageLatency(null);
          return;
        }

        const res = await getStageLatency(stageKey);
        setStageLatency(`${res.data.latency} ms`);


      } catch (err) {
        console.error("Latency error:", err);
      }
    };

    fetchLatency(agent.key);

    // fetch stage throughput
    const fetchStageEPS = async (stageKey) => {
      try {
        if (stageKey === "incidents") {
          setStageEPS(null);
          return;
        }

        const res = await getStageThroughput(stageKey);
        setStageEPS(Math.round(res.data.eps));

      } catch (err) {
        console.error("Stage throughput error:", err);
        setStageEPS(null);
      }
    };

    // 👇 IMPORTANT: call it here
    fetchStageEPS(agent.key);

    try {
      // let endpoint = "";

      // if (agent.key === "incidents")
      //   endpoint = "http://localhost:3001/api/incidents";

      // if (agent.key === "agent_1_output")
      //   endpoint = "http://localhost:3001/api/agent1";

      // if (agent.key === "agent_2_output")
      //   endpoint = "http://localhost:3001/api/agent2";

      // if (agent.key === "agent_3_output")
      //   endpoint = "http://localhost:3001/api/agent3";

      // if (agent.key === "agent_4_output")
      //   endpoint = "http://localhost:3001/api/agent4";

      const response = await getDatasetByStage(agent.key);
      const data = response.data;

      if (!data.length) {
        setDataset(null);
        return;
      }

      const headers = Object.keys(data[0]);

      setDataset({
        headers,
        data,
      });

    } catch (error) {
      console.error(error);
      setDataset(null);
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">agent workspace</div>
              <h1 className="workspace-title">AI pipeline desk</h1>
              <p className="workspace-copy">Only the useful operator view stays here: current stage, live throughput, runtime stream, and the output table.</p>
            </div>
          </div>

          <div className="workspace-metric-grid" style={{ marginTop: 18 }}>
            {[
              { label: "Throughput", value: `${eps}`, tone: "var(--accent-3)" },
              { label: "Classified", value: classified, tone: "var(--amber)" },
              { label: "Escalations", value: escalations, tone: "var(--red)" },
              { label: "Selected stage", value: activeAgent.stage, tone: "var(--green)" },
            ].map((item) => (
              <div key={item.label} className="workspace-stat">
                <div className="label-xs">{item.label}</div>
                <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Surface>

        <div className="workspace-grid workspace-grid-incidents">
          <Surface style={{ padding: 20 }}>
            <SectionHeading eyebrow="pipeline stages" title="Stage selector" />
            <div style={{ display: "grid", gap: 12 }}>
              {agents.map((agent) => (
                <button
                  key={agent.stage}
                  type="button"
                  onClick={() => loadDataset(agent)}
                  className="signal-stage"
                  style={{
                    textAlign: "left",
                    background: activeAgent.stage === agent.stage ? "rgba(255,138,61,.08)" : "rgba(255,255,255,.03)",
                    borderColor: activeAgent.stage === agent.stage ? "rgba(255,138,61,.28)" : "rgba(255,255,255,.08)",
                  }}
                >
                  <div className="label-xs">{agent.label} // stage {agent.stage}</div>
                  <strong>{agent.name}</strong>
                  <p>{agent.desc}</p>
                </button>
              ))}
            </div>
          </Surface>

          <div style={{ display: "grid", gap: 18 }}>
            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="selected stage" title={activeAgent.name} />
              <div className="incident-detail-grid">
                {[
                  { label: "Purpose", value: activeAgent.desc },
                  { label: "Accuracy", value: activeAgent.acc || "—" },
                  { label: "Throughput", value: stageEPS !== null ? `${stageEPS} eps` : activeAgent.thru },
                  { label: "Latency", value: stageLatency ?? activeAgent.lat },
                ].map((item) => (
                  <div key={item.label} className="signal-stage">
                    <div className="label-xs">{item.label}</div>
                    <strong style={{ marginTop: 10, lineHeight: 1.5 }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <SectionHeading eyebrow="runtime log" title="Agent stream" />
              </div>
              <div ref={logRef} style={{ padding: "14px 20px", height: 220, overflowY: "auto", fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.85 }}>
                {logLines.map((line) => (
                  <div key={line.index} style={{ color: line.text.includes("OUTPUT") ? "var(--accent-3)" : line.text.includes("ESCALAT") ? "var(--amber)" : "var(--t3)" }}>
                    {line.text}
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>

        <Surface style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <SectionHeading eyebrow="pipeline output" title={activeAgent.name} action={<FileText size={16} style={{ color: "var(--accent-2)" }} />} />
          </div>
          {dataset?.headers && dataset?.data ? (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table incident-board-table">
                <thead>
                  <tr>{dataset.headers.map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {dataset.data.map((row, index) => (
                    <tr key={index}>
                      {dataset.headers.map((header) => <td key={header}>{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table incident-board-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event type</th>
                    <th>Source IP</th>
                    <th>Risk score</th>
                    <th>Route</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineRows.map((row) => (
                    <tr key={`${row.ts}-${row.ip}`}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{row.ts}</td>
                      <td style={{ color: "#fff" }}>{row.type}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{row.ip}</td>
                      <td style={{ color: row.score > 0.7 ? "var(--red)" : "var(--amber)", fontFamily: "var(--mono)" }}>{row.score.toFixed(2)}</td>
                      <td>{row.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>
      </div>
    </Layout>
  );
}
