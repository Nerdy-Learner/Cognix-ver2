import { useState, useEffect } from "react";
import { Download, FileText, Filter } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";

// const [weeklyIncidents, setWeeklyIncidents] = useState(0);
// const [autoSummaries, setAutoSummaries] = useState(0);
// const [complianceStatus, setComplianceStatus] = useState("—");

// const incidentData = [
//   { name: "Mon", risk: 4 },
//   { name: "Tue", risk: 7 },
//   { name: "Wed", risk: 2 },
//   { name: "Thu", risk: 9 },
//   { name: "Fri", risk: 5 },
//   { name: "Sat", risk: 3 },
//   { name: "Sun", risk: 6 },
// ];

// const typeData = [
//   { name: "Malware", value: 400 },
//   { name: "Phishing", value: 300 },
//   { name: "DDoS", value: 300 },
//   { name: "Insider", value: 200 },
// ];

const colors = ["#ff6a2a", "#ff8a3d", "#ffd27d", "#58d59b"];

export default function Reports() {
  const [typeData, setTypeData] = useState([]);
  const [weeklyIncidents, setWeeklyIncidents] = useState(0);
  const [autoSummaries, setAutoSummaries] = useState(0);
  const [complianceStatus, setComplianceStatus] = useState("—");
  const [activeTab, setActiveTab] = useState("Weekly");
  const [incidentData, setIncidentData] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReportStats = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/incidents/full");
        const data = await res.json();

        const labelCounts = {};

        data.forEach((incident) => {
          const label = incident.agent1?.agent1_label || "Unknown";

          if (!labelCounts[label]) {
            labelCounts[label] = 0;
          }

          labelCounts[label]++;
        });

        const distribution = Object.entries(labelCounts).map(
          ([name, value]) => ({
            name,
            value,
          })
        );

        setTypeData(distribution);

        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

        const weekly = data.filter(
          (incident) =>
            incident.agent4?.processedAt &&
            new Date(incident.agent4.processedAt).getTime() >= weekAgo
        ).length;

        const summaries = data.filter(
          (incident) => incident.agent4?.decision
        ).length;

        const processed = data.filter(
          (incident) => incident.processed === true
        ).length;

        const compliance =
          processed === data.length ? "Yes" : "Partial";

        setWeeklyIncidents(weekly);
        setAutoSummaries(summaries);
        setComplianceStatus(compliance);


        // BAR CHART
        // const now = Date.now();

        let labels = [];
        let bucket = "";
        let windowStart = 0;

        if (activeTab === "Daily") {
          labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          bucket = "hour";
          windowStart = now - 24 * 60 * 60 * 1000;
        }

        if (activeTab === "Weekly") {
          labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          bucket = "day";
          windowStart = now - 7 * 24 * 60 * 60 * 1000;
        }

        if (activeTab === "Monthly") {
          labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
          bucket = "date";
          windowStart = now - 30 * 24 * 60 * 60 * 1000;
        }

        if (activeTab === "Annual") {
          labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          bucket = "month";
          windowStart = now - 365 * 24 * 60 * 60 * 1000;
        }

        const counts = {};
        labels.forEach(label => counts[label] = 0);

        data.forEach((incident) => {
          if (!incident.agent4?.processedAt) return;

          const ts = new Date(incident.agent4.processedAt).getTime();
          if (ts < windowStart) return;

          const d = new Date(ts);

          let key;

          if (bucket === "hour") key = `${d.getHours()}:00`;
          if (bucket === "day") key = labels[d.getDay()];
          if (bucket === "date") key = `Day ${d.getDate()}`;
          if (bucket === "month") key = labels[d.getMonth()];

          if (counts[key] !== undefined) counts[key]++;
        });

        setIncidentData(
          labels.map(label => ({
            name: label,
            risk: counts[label]
          }))
        );

        //REPORTS
        const reportsRes = await fetch("http://localhost:3001/api/reports");
        const reportsData = await reportsRes.json();

        setReports(reportsData);

      } catch (err) {
        console.error("Reports stats error:", err);
      }
    };

    fetchReportStats();
  }, [activeTab]);
  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">reporting workspace</div>
              <h1 className="workspace-title">Analytics and exports</h1>
              <p className="workspace-copy">The reports page now stays practical: choose the reporting window, read the charts, and export what matters.</p>
            </div>
            <div className="workspace-actions">
              <button className="btn-ghost" type="button"><Filter size={14} />Filter</button>
              <button className="btn-primary" type="button"><Download size={14} />Export PDF</button>
            </div>
          </div>

          <div className="workspace-chip-row">
            {[
              { label: "Cadence", value: activeTab },
              { label: "Generated", value: "03" },
              { label: "Export mode", value: "PDF / CSV" },
            ].map((item) => (
              <div key={item.label} className="workspace-chip">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Surface>

        <div className="workspace-metric-grid">
          {[
            { label: "Weekly incidents", value: weeklyIncidents, tone: "var(--accent-3)" },
            { label: "Auto summaries", value: autoSummaries, tone: "var(--amber)" },
            { label: "Compliance", value: complianceStatus, tone: "var(--green)" },
            { label: "Ready exports", value: reports.length, tone: "var(--red)" }
          ].map((item) => (
            <div key={item.label} className="workspace-stat">
              <div className="label-xs">{item.label}</div>
              <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
            </div>
          ))}
        </div>

        <Surface style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 18, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 6, overflowX: "auto" }}>
            {["Daily", "Weekly", "Monthly", "Annual"].map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ padding: "10px 0", color: activeTab === tab ? "var(--accent-2)" : "var(--t3)", fontWeight: 700, borderBottom: activeTab === tab ? "1px solid var(--accent-2)" : "1px solid transparent" }}>
                {tab}
              </button>
            ))}
          </div>
        </Surface>

        <div className="workspace-grid workspace-grid-incidents">
          <Surface style={{ padding: 20 }}>
            <SectionHeading eyebrow="incident frequency" title="Incidents by day" />
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.28)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.28)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#140909", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ color: "#FFF" }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="risk" fill="#ff8a3d" radius={[6, 6, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Surface>

          <Surface style={{ padding: 20 }}>
            <SectionHeading eyebrow="category split" title="Incident distribution" />
            <div style={{ height: 300, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: "#140909", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ color: "#FFF" }} />
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={80} outerRadius={108} paddingAngle={4} dataKey="value" stroke="none">
                    {typeData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="label-xs">Total</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 42, fontWeight: 700 }}>{typeData.reduce((sum, item) => sum + item.value, 0)}</div>
                </div>
              </div>
            </div>
          </Surface>
        </div>

        <Surface style={{ padding: 20 }}>
          <SectionHeading eyebrow="generated reports" title="Available exports" />
          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                id: "REP-ESC",
                name: "Escalation report",
                endpoint: "/api/reports/escalations",
                type: "CSV",
                date: new Date().toLocaleDateString(),
              },
              {
                id: "REP-CLS",
                name: "Classification summary",
                endpoint: "/api/reports/classification",
                type: "CSV",
                date: new Date().toLocaleDateString(),
              },
              {
                id: "REP-RSK",
                name: "Risk distribution report",
                endpoint: "/api/reports/risk",
                type: "CSV",
                date: new Date().toLocaleDateString(),
              },
              {
                id: "REP-CNF",
                name: "Confidence distribution report",
                endpoint: "/api/reports/confidence",
                type: "CSV",
                date: new Date().toLocaleDateString(),
              }
            ].map((report) => (
              <div key={report.id} className="signal-stage" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,.04)", display: "grid", placeItems: "center" }}>
                    <FileText size={18} style={{ color: "var(--accent-3)" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#fff" }}>{report.name}</p>
                    <p style={{ fontSize: 12, color: "var(--t2)" }}>{report.id} • {report.date} • {report.type}</p>
                  </div>
                </div>
                <a
                  href={`http://localhost:3001${report.endpoint}`}
                  className="btn-ghost"
                >
                  <Download size={14} />Download
                </a>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </Layout>
  );
}
