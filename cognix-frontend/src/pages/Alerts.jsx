import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";
import { getRisk, getRiskStyles } from "../utils/risk";
import { getFullIncidents } from "../services/api";
import { getIPStyle, getAttackTypeStyle, getRouteStyle } from "../utils/colors";


const severityOrder = { High: 0, Medium: 1, Low: 2 };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await getFullIncidents();
        const data = response.data;
        // if (response.ok) 
        setAlerts(data);
      } catch (error) {
        console.error("Failed to load alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const derived = useMemo(() => {
    const normalized = alerts
      .map((alert, index) => {
        const rawRisk = alert.agent3?.risk_level || alert.agent3?.decision || "Low";
        const normalizedRisk = rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase();
        const risk = normalizedRisk === "Critical" ? "High" : normalizedRisk;
        const source = alert.Source || alert.Host || alert.User || `sensor-${index + 1}`;
        const timestamp = alert.agent4?.processedAt || "Live now";
        const route = alert.agent4?.action || alert.agent4?.decision || "Monitor";
        return { ...alert, risk, source, timestamp, route };
      })
      .filter((alert) => {
        const haystack = Object.values(alert).join(" ").toLowerCase();

        const matchesSearch =
          haystack.includes(search.toLowerCase());

        const matchesRisk =
          riskFilter === "All" || alert.risk === riskFilter;

        // const isEscalated =
        //   alert.agent4?.decision === "Escalate";

        // return matchesSearch && matchesRisk && isEscalated;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => severityOrder[a.risk] - severityOrder[b.risk]);

    return {
      rows: normalized,
      total: normalized.length,
      high: normalized.filter((item) => item.risk === "High" || item.risk === "Critical").length,
      medium: normalized.filter((item) => item.risk === "Medium").length,
      low: normalized.filter((item) => item.risk === "Low").length,
    };
  }, [alerts, riskFilter, search]);

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--t2)" }}>
          Loading alert queue...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">alert workspace</div>
              <h1 className="workspace-title">Live alert queue</h1>
              <p className="workspace-copy">Only the working signal stays here: search, severity, source, timestamp, and the route each alert should follow.</p>
            </div>
          </div>

          <div className="workspace-metric-grid" style={{ marginTop: 18 }}>
            {[
              { label: "Visible alerts", value: derived.total, tone: "var(--accent-3)" },
              { label: "High priority", value: derived.high, tone: "var(--red)" },
              { label: "Medium priority", value: derived.medium, tone: "var(--amber)" },
              { label: "Low priority", value: derived.low, tone: "var(--green)" },
            ].map((item) => (
              <div key={item.label} className="workspace-stat">
                <div className="label-xs">{item.label}</div>
                <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface style={{ padding: 20 }}>
          <div className="workspace-toolbar">
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--t3)" }} />
              <input
                className="field-input"
                style={{ paddingLeft: 40 }}
                placeholder="Search alerts, hosts, users, timestamps..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div style={{ position: "relative" }}>
              <Filter size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--t3)" }} />
              <select className="field-select" style={{ paddingLeft: 40 }} value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
                {["All", "High", "Medium", "Low"].map((value) => (
                  <option key={value} value={value} style={{ background: "#140909" }}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        </Surface>

        <Surface style={{ padding: 20 }}>
          <SectionHeading eyebrow="alert ledger" title="Actionable signals" action={<span className="badge badge-dim">{derived.total} visible</span>} />
          <div style={{ overflowX: "auto" }}>
            <table className="data-table incident-board-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Timestamp</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                {derived.rows.map((alert, index) => (
                  <tr key={alert._id || `${alert.agent1?.decision || alert.agent1?.agent1_label}-${index}`}>
                    <td style={getAttackTypeStyle(alert.agent1?.decision || alert.agent1?.attack_type || alert.agent1?.agent1_label)}>{alert.agent1?.decision || alert.agent1?.attack_type || alert.agent1?.agent1_label || "Unknown alert"}</td>
                    <td>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${getRiskStyles(alert.risk)}`}>
                        {alert.risk}
                      </span>
                    </td>
                    <td style={getIPStyle(alert.source)}>{alert.source}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{alert.timestamp}</td>
                    <td style={getRouteStyle(alert.route)}>{alert.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!derived.rows.length ? (
            <div className="command-card" style={{ marginTop: 16 }}>
              <p>No alerts match the current filters.</p>
            </div>
          ) : null}
        </Surface>
      </div>
    </Layout>
  );
}
