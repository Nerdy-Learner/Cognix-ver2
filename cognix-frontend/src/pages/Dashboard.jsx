import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Upload } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";

// const incidents = [
//   { id: "INC-447", type: "Brute force burst", risk: "High", ip: "185.220.101.47", status: "Investigating" },
//   { id: "INC-448", type: "Malware C2 handshake", risk: "High", ip: "91.108.4.200", status: "Contained" },
//   { id: "INC-449", type: "Credential phishing", risk: "Medium", ip: "104.21.90.13", status: "Monitoring" },
//   { id: "INC-450", type: "Recon scan cluster", risk: "Medium", ip: "45.33.32.156", status: "Queued" },
// ];

// const priorities = [
//   { label: "Active high severity", value: "02", tone: "var(--red)" },
//   { label: "Queued analyst actions", value: "04", tone: "var(--amber)" },
//   { label: "Protected nodes", value: "847", tone: "var(--green)" },
//   { label: "Median containment", value: "18m", tone: "var(--accent-3)" },
// ];

// const statusBadge = (status) => {
//   const map = {
//     Investigating: "badge-red",
//     Contained: "badge-amber",
//     Monitoring: "badge-accent",
//     Queued: "badge-dim",
//   };

//   return <span className={`badge ${map[status] || "badge-dim"}`}>{status.toUpperCase()}</span>;
// };

const statusBadge = (status) => {
  const map = {
    Investigating: "badge-red",
    Escalate: "badge-red",

    Contained: "badge-amber",
    "Auto-Close": "badge-amber",

    Monitoring: "badge-accent",
    Monitor: "badge-accent",

    Queued: "badge-dim",
  };

  return (
    <span className={`badge ${map[status] || "badge-dim"}`}>
      {status.toUpperCase()}
    </span>
  );
};

const riskBadge = (risk) => {
  const map = { High: "badge-red", Medium: "badge-amber", Low: "badge-green" };
  return <span className={`badge ${map[risk] || "badge-dim"}`}>{risk.toUpperCase()}</span>;
};

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [incidents, setIncidents] = useState([]);
  const [priorityStats, setPriorityStats] = useState([]);

  // useEffect(() => {
  //   const clock = setInterval(() => setTime(new Date()), 1000);
  //   return () => clearInterval(clock);
  // }, []);

  useEffect(() => {

    const clock = setInterval(() => setTime(new Date()), 1000);

    const fetchDashboardData = async () => {
      try {

        const res = await fetch(
          "http://localhost:5000/api/incidents/full"
        );

        const data = await res.json();

        const formatted = data.slice(0, 6).map((incident, index) => ({
          id: incident._id.slice(-6).toUpperCase(),
          type:
            incident.agent1?.agent1_label ||
            incident.Scan_Type ||
            "Unknown",
          risk:
            incident.agent3?.risk_level ||
            "Low",
          ip:
            incident.Source_IP ||
            "—",
          status:
            incident.agent4?.decision === "Escalate"
              ? "Investigating"
              : incident.agent4?.decision === "Auto-Close"
                ? "Contained"
                : incident.agent4?.decision === "Monitor"
                  ? "Monitoring"
                  : "Queued",
        }));

        setIncidents(formatted);

        const highSeverity = data.filter(
          i =>
            i.agent3?.risk_level === "High" ||
            i.agent3?.risk_level === "Critical"
        ).length;

        const queuedActions = data.filter(
          i => i.agent4?.decision === "Monitor"
        ).length;

        setPriorityStats([
          {
            label: "Active high severity",
            value: highSeverity,
            tone: "var(--red)",
          },
          {
            label: "Queued analyst actions",
            value: queuedActions,
            tone: "var(--amber)",
          },
          {
            label: "Protected nodes",
            value: data.length,
            tone: "var(--green)",
          },
          {
            label: "Median containment",
            value: "—",
            tone: "var(--accent-3)",
          },
        ]);

      } catch (err) {

        console.error("Dashboard fetch error:", err);

      }
    };

    fetchDashboardData();

    return () => clearInterval(clock);

  }, []);

  const meta = useMemo(() => {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      { label: "Operations center", value: "Mission control" },
      { label: "UTC", value: `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}` },
      { label: "Priority cases", value: `${incidents.length} active` },
    ];
  }, [time]);

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">operations center // active workspace</div>
              <h1 className="workspace-title">Priority incident board</h1>
              <p className="workspace-copy">The dashboard now opens directly into the work that matters: active cases, response status, and the next analyst action.</p>
            </div>
            <div className="workspace-actions">
              <Link to="/upload" className="btn-primary">
                Upload telemetry <Upload size={14} />
              </Link>
              <Link to="/incidents" className="btn-ghost">
                Open case desk <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="workspace-chip-row">
            {meta.map((item) => (
              <div key={item.label} className="workspace-chip">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Surface>

        <div className="workspace-metric-grid">
          {priorityStats.map((item) => (
            <div key={item.label} className="workspace-stat">
              <div className="label-xs">{item.label}</div>
              <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="workspace-grid workspace-grid-dashboard">
          <Surface className="line-accent" style={{ padding: 0 }}>
            <div className="incident-board">
              <div className="incident-board-header">
                <div>
                  <div className="page-eyebrow">recent cases</div>
                  <h2 className="section-title" style={{ marginTop: 12 }}>Priority incident board</h2>
                </div>
                <span className="badge badge-dim">{incidents.length} active</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="data-table incident-board-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Source IP</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => (
                      <tr key={incident.id}>
                        <td style={{ color: "var(--accent-3)", fontWeight: 700 }}>{incident.id}</td>
                        <td style={{ color: "#fff" }}>{incident.type}</td>
                        <td>{riskBadge(incident.risk)}</td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{incident.ip}</td>
                        <td>{statusBadge(incident.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Surface>

          <div style={{ display: "grid", gap: 18 }}>
            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="working focus" title="Immediate analyst actions" />
              <div className="panel-grid">
                {[
                  { label: "Investigate", text: "Start with `INC-447` and validate brute-force spread before escalation." },
                  { label: "Contain", text: "`INC-448` is isolated. Review host evidence and confirm persistence is cleared." },
                  { label: "Monitor", text: "Track medium-risk cases without crowding the dashboard with secondary visuals." },
                ].map((item) => (
                  <div key={item.label} className="signal-stage">
                    <div className="label-xs">{item.label}</div>
                    <strong>{item.text}</strong>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="workflow" title="Fast lanes" />
              <div className="panel-grid">
                <Link to="/incidents" className="command-card" style={{ textDecoration: "none" }}>
                  <div className="label-xs">Case review</div>
                  <p>Open the incident desk for full evidence, filters, and structured investigation.</p>
                </Link>
                <Link to="/alerts" className="command-card" style={{ textDecoration: "none" }}>
                  <div className="label-xs">Signal queue</div>
                  <p>Check incoming alerts without leaving the operating theme or overloading the screen.</p>
                </Link>
                <Link to="/upload" className="command-card" style={{ textDecoration: "none" }}>
                  <div className="label-xs">Telemetry intake</div>
                  <p>Send a new CSV batch into the pipeline when the current queue is clear.</p>
                </Link>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </Layout>
  );
}