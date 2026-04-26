import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";
import { getRisk, getRiskStyles } from "../utils/risk";
import { getFullIncidents } from "../services/api";

const severityOrder = { High: 0, Medium: 1, Low: 2 };

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await getFullIncidents();
        const data = response.data;

        setIncidents(data);

        if (data[0]?._id) {
          setSelectedIncidentId(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to load incidents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents
      .map((incident, index) => ({
        ...incident,
        risk: incident.agent3?.risk_level || "Low",
        id: incident._id || `${incident.Type || "incident"}-${incident.Timestamp || index}`,
      }))
      .filter((incident) => {
        const haystack = Object.values(incident).join(" ").toLowerCase();

        const matchesRisk =
          riskFilter === "All" ||
          (riskFilter === "High" &&
            (incident.risk === "High" || incident.risk === "Critical")) ||
          incident.risk === riskFilter;

        return haystack.includes(search.toLowerCase()) && matchesRisk;
      })
      // .filter((incident) => {
      //   const haystack = Object.values(incident).join(" ").toLowerCase();
      //   return haystack.includes(search.toLowerCase()) && (riskFilter === "All" || incident.risk === riskFilter);
      // })
      .sort((a, b) => severityOrder[a.risk] - severityOrder[b.risk]);
  }, [incidents, riskFilter, search]);

  useEffect(() => {
    if (!filteredIncidents.length) {
      setSelectedIncidentId(null);
      return;
    }

    const visible = filteredIncidents.some((incident) => incident.id === selectedIncidentId);
    if (!visible) setSelectedIncidentId(filteredIncidents[0].id);
  }, [filteredIncidents, selectedIncidentId]);

  const selectedIncident = filteredIncidents.find((incident) => incident.id === selectedIncidentId) || null;

  const summary = useMemo(() => {
    const high = filteredIncidents.filter((incident) => incident.risk === "High" || incident.risk === "Critical").length;
    const medium = filteredIncidents.filter((incident) => incident.risk === "Medium").length;
    const low = filteredIncidents.filter((incident) => incident.risk === "Low").length;
    return { high, medium, low, total: filteredIncidents.length };
  }, [filteredIncidents]);

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--t2)" }}>
          Loading case desk...
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
              <div className="page-eyebrow">incident workspace</div>
              <h1 className="workspace-title">Case review desk</h1>
              <p className="workspace-copy">This page now stays focused on actual investigation work: filter the queue, choose a case, and inspect the evidence package.</p>
            </div>
          </div>

          <div className="workspace-metric-grid" style={{ marginTop: 18 }}>
            {[
              { label: "Visible cases", value: summary.total, tone: "var(--accent-3)" },
              { label: "High severity", value: summary.high, tone: "var(--red)" },
              { label: "Medium severity", value: summary.medium, tone: "var(--amber)" },
              { label: "Low severity", value: summary.low, tone: "var(--green)" },
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
                placeholder="Search incidents, hosts, users, timestamps..."
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

        <div className="workspace-grid workspace-grid-incidents">
          <Surface style={{ padding: 20 }}>
            <SectionHeading eyebrow="case queue" title="Priority cases" action={<span className="badge badge-dim">{filteredIncidents.length} visible</span>} />
            <div style={{ display: "grid", gap: 12, maxHeight: "820px", overflowY: "auto", paddingRight: 6 }}>
              {filteredIncidents.map((incident, index) => {
                const selected = incident.id === selectedIncidentId;
                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className="signal-stage"
                    style={{
                      textAlign: "left",
                      borderColor: selected ? "rgba(255,138,61,.3)" : "rgba(255,255,255,.08)",
                      background: selected ? "rgba(255,138,61,.08)" : "rgba(255,255,255,.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 14 }}>
                      <div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <strong style={{ color: "white", fontSize: 15 }}>{incident.agent1?.agent1_label || incident.Scan_Type || "Unknown incident"}</strong>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${getRiskStyles(incident.risk)}`}>
                            {incident.risk}
                          </span>

                          {incident.agent4?.decision && (
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                              style={{
                                background:
                                  incident.agent4.decision === "Escalate"
                                    ? "rgba(255,80,80,.18)"
                                    : "rgba(88,213,155,.18)",
                                color:
                                  incident.agent4.decision === "Escalate"
                                    ? "#ff5050"
                                    : "#58d59b",
                                border: "1px solid rgba(255,255,255,.12)"
                              }}
                            >
                              {incident.agent4.decision}
                            </span>
                          )}

                        </div>
                        <p style={{ marginTop: 8, color: "var(--t2)", fontSize: 13 }}>
                          {incident.Source || incident.Host || incident.User || "No explicit source"}
                        </p>
                      </div>
                      <span style={{ color: "var(--t3)", fontFamily: "var(--mono)", fontSize: 11 }}>Case #{index + 1}</span>
                    </div>
                    <div style={{ marginTop: 12, color: "var(--t3)", fontFamily: "var(--mono)", fontSize: 11 }}>
                      {incident.Timestamp || incident.Date || "Awaiting timestamp"}
                    </div>
                  </button>
                );
              })}

              {!filteredIncidents.length ? (
                <div className="command-card">
                  <p>No incidents match the current filters.</p>
                </div>
              ) : null}
            </div>
          </Surface>

          <Surface style={{ padding: 20 }}>
            {selectedIncident ? (
              <>
                <SectionHeading
                  eyebrow="selected case"
                  title={selectedIncident.Type || "Unknown incident"}
                  action={<span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] ${getRiskStyles(selectedIncident.risk)}`}>{selectedIncident.risk}</span>}
                />

                <div className="incident-detail-grid">
                  {/* {Object.entries(selectedIncident).map(([key, value]) => {
                    if (["_id", "id", "risk"].includes(key)) return null;

                    return (
                      <div key={key} className="signal-stage">
                        <div className="label-xs">{key}</div>
                        <strong style={{ marginTop: 10, lineHeight: 1.5 }}>{String(value || "—")}</strong>
                      </div>
                    );
                  })} */}
                  <>
                    {/* RAW INCIDENT DATA */}
                    {Object.entries(selectedIncident).map(([key, value]) => {
                      if (
                        [
                          "_id",
                          "id",
                          "risk",
                          "agent1",
                          "agent2",
                          "agent3",
                          "agent4"
                        ].includes(key)
                      )
                        return null;

                      return (
                        <div key={key} className="signal-stage">
                          <div className="label-xs">{key}</div>
                          <strong style={{ marginTop: 10, lineHeight: 1.5 }}>
                            {String(value || "—")}
                          </strong>
                        </div>
                      );
                    })}

                    {/* AGENT PIPELINE OUTPUT */}
                    {/* AGENT PIPELINE OUTPUT */}
                    {[
                      ["Agent 1 Label", selectedIncident.agent1?.agent1_label],
                      ["Protocol Risk", selectedIncident.agent2?.protocol_risk],
                      ["Asset Value", selectedIncident.agent2?.asset_value],
                      ["Risk Level", selectedIncident.agent3?.risk_level],
                      ["Decision", selectedIncident.agent4?.decision],
                      ["Confidence", selectedIncident.agent4?.confidence],
                    ].map(([label, value]) => (
                      <div key={label} className="signal-stage">
                        <div className="label-xs">{label}</div>
                        <strong style={{ marginTop: 10, lineHeight: 1.5 }}>
                          {value ?? "—"}
                        </strong>
                      </div>
                    ))}
                  </>
                </div>
              </>
            ) : (
              <div className="command-card">
                <p>Select an incident to inspect its evidence package.</p>
              </div>
            )}
          </Surface>
        </div>
      </div>
    </Layout>
  );
}
