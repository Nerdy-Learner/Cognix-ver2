import { useEffect, useRef, useState, useMemo } from "react";
import { FileText, BarChart2 } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";
import { getFullIncidents } from "../services/api";
import { getThroughput } from "../services/api";
import { getAgent1Outputs } from "../services/api";
import { getRuntimeLogs } from "../services/api";
import { getStageThroughput } from "../services/api";
import { getStageLatency } from "../services/api";
import { getDatasetByStage } from "../services/api";
import { getIPStyle, getAttackTypeStyle, getRouteStyle, getProtocolStyle } from "../utils/colors";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  CartesianGrid 
} from "recharts";


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

  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowAnalysis(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const COLORS = ["#ff8a3d", "#58d59b", "#ff6565", "#ffd27d", "#8b5cf6", "#3b82f6"];

  const analysisData = useMemo(() => {
    let records = [];
    let keyToAggregate = "";
    
    if (dataset?.data && dataset.data.length > 0) {
      records = dataset.data;
      if (activeAgent.key === "incidents") {
        keyToAggregate = records[0].Protocol ? "Protocol" : records[0].Scan_Type ? "Scan_Type" : Object.keys(records[0])[1] || "";
      } else if (activeAgent.key === "agent_1_output") {
        keyToAggregate = records[0].decision ? "decision" : "attack_type";
      } else if (activeAgent.key === "agent_2_output") {
        keyToAggregate = records[0].decision ? "decision" : "tactic";
      } else if (activeAgent.key === "agent_3_output") {
        keyToAggregate = records[0].decision ? "decision" : "risk_level";
      } else if (activeAgent.key === "agent_4_output") {
        keyToAggregate = records[0].decision ? "decision" : "action";
      }
    }

    if (records.length === 0) {
      if (activeAgent.key === "incidents") {
        return [
          { name: "TCP", count: 145, percentage: 58 },
          { name: "UDP", count: 85, percentage: 34 },
          { name: "ICMP", count: 20, percentage: 8 }
        ];
      } else if (activeAgent.key === "agent_1_output") {
        return [
          { name: "Normal Traffic", count: 180, percentage: 72 },
          { name: "BotAttack", count: 45, percentage: 18 },
          { name: "PortScan", count: 25, percentage: 10 }
        ];
      } else if (activeAgent.key === "agent_2_output") {
        return [
          { name: "non-attack", count: 180, percentage: 72 },
          { name: "Impact", count: 45, percentage: 18 },
          { name: "Credential Access", count: 15, percentage: 6 },
          { name: "Reconnaissance", count: 10, percentage: 4 }
        ];
      } else if (activeAgent.key === "agent_3_output") {
        return [
          { name: "LOW", count: 180, percentage: 72 },
          { name: "MEDIUM", count: 40, percentage: 16 },
          { name: "HIGH", count: 20, percentage: 8 },
          { name: "CRITICAL", count: 10, percentage: 4 }
        ];
      } else if (activeAgent.key === "agent_4_output") {
        return [
          { name: "MONITOR", count: 185, percentage: 74 },
          { name: "ALERT", count: 35, percentage: 14 },
          { name: "ESCALATE", count: 20, percentage: 8 },
          { name: "BLOCK", count: 10, percentage: 4 }
        ];
      }
    }

    const counts = {};
    records.forEach(r => {
      let val = r[keyToAggregate] || r.decision || r.action || r.risk_level || "Unknown";
      counts[val] = (counts[val] || 0) + 1;
    });

    const total = records.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }, [dataset, activeAgent]);

  const statsSummary = useMemo(() => {
    const total = analysisData.reduce((acc, curr) => acc + curr.count, 0);
    let dominant = { name: "N/A", count: 0, percentage: 0 };
    if (analysisData.length > 0) {
      dominant = [...analysisData].sort((a, b) => b.count - a.count)[0];
    }
    return { total, dominant };
  }, [analysisData]);

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
          (incident) => ["Escalate", "ESCALATE", "BLOCK"].includes(incident.agent4?.action || incident.agent4?.decision)
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
      console.log("API DATA:", data);
      if (!data.length) {
        setDataset(null);
        return;
      }

      // flatten nested objects for a clean table
      const flattenObj = (obj) => {

        let result = {};

        for (const [key, value] of Object.entries(obj)) {

          // skip unwanted fields
          if (
            ["_id", "__v", "incidentId"].includes(key)
          ) continue;

          // =========================
          // SKIP RAW ALERT PAYLOADS
          // FOR AGENT TABLES
          // =========================

          if (
            key === "alert" &&
            activeAgent.key !== "incidents"
          ) continue;

          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {

            for (const [subKey, subValue]
              of Object.entries(value)) {

              result[
                `${key}.${subKey}`
              ] = subValue;
            }

          } else {

            result[key] = value;
          }
        }

        return result;
      };

      const flattenedData = data.map(row => flattenObj(row));

      const allKeys = new Set();
      flattenedData.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));

      const headers = Array.from(allKeys).sort((a, b) => {
        if (a === 'processedAt') return -1;
        if (b === 'processedAt') return 1;
        return 0;
      });

      const formattedData = flattenedData.map(row => {
        const newRow = {};
        headers.forEach(h => {
          if (h === "processedAt" && row[h]) {
            newRow[h] = new Date(row[h]).toLocaleTimeString();
          } else if (typeof row[h] === "number" && row[h] % 1 !== 0) {
            newRow[h] = row[h].toFixed(3);
          } else {
            newRow[h] = String(row[h] ?? "—");
          }
        });
        return newRow;
      });

      setDataset({
        headers,
        data: formattedData,
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
            <SectionHeading 
              eyebrow="pipeline output" 
              title={activeAgent.name} 
              action={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => setShowAnalysis(true)}
                    className="btn-primary"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.68rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,138,61,0.15)",
                      border: "1px solid rgba(255,138,61,0.4)",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Analyse <BarChart2 size={12} style={{ color: "var(--accent-1)" }} />
                  </button>
                  <FileText size={16} style={{ color: "var(--accent-2)" }} />
                </div>
              } 
            />
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
                      {dataset.headers.map((header) => {
                        const val = row[header];
                        let cellStyle = {};
                        if (header.toLowerCase().includes("ip") || header.toLowerCase().includes("source") || header.toLowerCase().includes("dest")) {
                          cellStyle = getIPStyle(val);
                        } else if (header.toLowerCase().includes("protocol")) {
                          cellStyle = getProtocolStyle(val);
                        } else if (["decision", "attack_type", "type"].includes(header.toLowerCase()) || header.includes("Agent 1")) {
                          cellStyle = getAttackTypeStyle(val);
                        } else if (["action", "route", "risk_level", "risk", "status"].includes(header.toLowerCase()) || header.includes("Agent 4") || header.includes("Agent 3")) {
                          cellStyle = getRouteStyle(val);
                        }
                        return <td key={header} style={cellStyle}>{val}</td>;
                      })}
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
                      <td style={getAttackTypeStyle(row.type)}>{row.type}</td>
                      <td style={getIPStyle(row.ip)}>{row.ip}</td>
                      <td style={{ color: row.score > 0.7 ? "var(--red)" : "var(--amber)", fontFamily: "var(--mono)" }}>{row.score.toFixed(2)}</td>
                      <td style={getRouteStyle(row.rec)}>{row.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>

        {/* ANALYSE POPUP MODAL */}
        {showAnalysis && (
          <div className="analysis-modal-overlay" style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 5, 5, 0.88)",
            backdropFilter: "blur(12px)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 20
          }}>
            <Surface className="line-accent" style={{
              width: "100%",
              maxWidth: 900,
              padding: 30,
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              background: "#160b0b",
              border: "1px solid rgba(255,138,61,0.22)"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
                <div>
                  <div className="page-eyebrow">// analytical focus desk</div>
                  <h2 className="section-title" style={{ marginTop: 8 }}>{activeAgent.name} Analysis</h2>
                </div>
                <button 
                  onClick={() => setShowAnalysis(false)} 
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.1em"
                  }}
                >
                  ESC // CLOSE
                </button>
              </div>

              {/* Stat Summary Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div className="signal-stage" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <div className="label-xs">Total Records Processed</div>
                  <strong style={{ fontSize: 20, color: "var(--accent-3)", marginTop: 6, display: "block" }}>{statsSummary.total} events</strong>
                </div>
                <div className="signal-stage" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <div className="label-xs">Dominant Category</div>
                  <strong style={{ fontSize: 20, color: "var(--accent-1)", marginTop: 6, display: "block" }}>{statsSummary.dominant.name} ({statsSummary.dominant.percentage}%)</strong>
                </div>
                {activeAgent.acc && (
                  <div className="signal-stage" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <div className="label-xs">Model Benchmark Accuracy</div>
                    <strong style={{ fontSize: 20, color: "var(--green)", marginTop: 6, display: "block" }}>{activeAgent.acc}</strong>
                  </div>
                )}
              </div>

              {/* Chart Grid */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {/* Bar Plot */}
                <div style={{ flex: 1, minWidth: 340, background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="label-xs" style={{ marginBottom: 16 }}>📊 Volume Distribution (Counts)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} style={{ fontFamily: "var(--mono)" }} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} style={{ fontFamily: "var(--mono)" }} />
                      <Tooltip
                        contentStyle={{
                          background: "#160b0b",
                          border: "1px solid rgba(255,138,61,0.2)",
                          borderRadius: 10,
                          color: "#fff",
                          fontFamily: "var(--mono)",
                          fontSize: 12
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--mono)", paddingTop: 10 }} />
                      <Bar dataKey="count" name="Event Count">
                        {analysisData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart (Percentage split) */}
                <div style={{ flex: 1, minWidth: 340, background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="label-xs" style={{ marginBottom: 16 }}>🍩 Percentage Split (%)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={analysisData}
                        dataKey="percentage"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        label={({ name, percentage }) => `${percentage}%`}
                        style={{ fontFamily: "var(--mono)", fontSize: 10 }}
                      >
                        {analysisData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#160b0b",
                          border: "1px solid rgba(255,138,61,0.2)",
                          borderRadius: 10,
                          color: "#fff",
                          fontFamily: "var(--mono)",
                          fontSize: 12
                        }}
                        formatter={(value) => `${value}%`}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--mono)", paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Surface>
          </div>
        )}
      </div>
    </Layout>
  );
}
