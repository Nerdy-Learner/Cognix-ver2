import { motion as Motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Globe, Settings as SettingsIcon, Shield, User } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";

function Toggle({ label, active, onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{label}</span>
      <button type="button" onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, transition: "background .2s ease", position: "relative", background: active ? "var(--accent-2)" : "rgba(255,255,255,.1)" }}>
        <Motion.div animate={{ x: active ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ width: 18, height: 18, background: "#fff", borderRadius: 999, position: "absolute", top: 3 }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [notifyReports, setNotifyReports] = useState(false);
  const [autoTriage, setAutoTriage] = useState(true);
  const [mfa, setMfa] = useState(true);

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">settings workspace</div>
              <h1 className="workspace-title">Control suite</h1>
              <p className="workspace-copy">The settings page now stays simple and operational: profile, notifications, security, and integrations in one clean desk.</p>
            </div>
            <div className="workspace-actions">
              <button className="btn-primary" type="button">Save changes</button>
            </div>
          </div>

          <div className="workspace-metric-grid" style={{ marginTop: 18 }}>
            {[
              { label: "Profile", value: "Enterprise", tone: "var(--accent-3)" },
              { label: "Security", value: mfa ? "Strong" : "Review", tone: "var(--amber)" },
              { label: "Automation", value: autoTriage ? "Active" : "Paused", tone: "var(--green)" },
              { label: "Alerts", value: notifyAlerts ? "On" : "Off", tone: "var(--red)" },
            ].map((item) => (
              <div key={item.label} className="workspace-stat">
                <div className="label-xs">{item.label}</div>
                <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Surface>

        <div className="workspace-grid workspace-grid-incidents">
          <Surface style={{ padding: 18 }}>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { icon: User, label: "Account", active: true },
                { icon: Bell, label: "Notifications" },
                { icon: Shield, label: "Security" },
                { icon: Globe, label: "Integrations" },
              ].map((item) => (
                <button key={item.label} type="button" className="nav-item" style={{ color: item.active ? "#fff" : "var(--t2)", background: item.active ? "rgba(255,138,61,.08)" : "transparent", borderColor: item.active ? "rgba(255,138,61,.18)" : "transparent" }}>
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </Surface>

          <div style={{ display: "grid", gap: 18 }}>
            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="profile details" title="Account" action={<SettingsIcon size={16} style={{ color: "var(--accent-2)" }} />} />
              <div className="incident-detail-grid">
                <div>
                  <div className="label-xs" style={{ marginBottom: 8 }}>First name</div>
                  <input type="text" defaultValue="Admin" className="field-input" />
                </div>
                <div>
                  <div className="label-xs" style={{ marginBottom: 8 }}>Last name</div>
                  <input type="text" defaultValue="User" className="field-input" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="label-xs" style={{ marginBottom: 8 }}>Email address</div>
                  <input type="email" defaultValue="admin@cognix.ai" className="field-input" />
                </div>
              </div>
            </Surface>

            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="notifications" title="Preferences" />
              <Toggle label="Critical incident email alerts" active={notifyAlerts} onClick={() => setNotifyAlerts(!notifyAlerts)} />
              <Toggle label="Weekly security health summary" active={notifyReports} onClick={() => setNotifyReports(!notifyReports)} />
            </Surface>

            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="platform security" title="Guardrails" />
              <Toggle label="Two-factor authentication (MFA)" active={mfa} onClick={() => setMfa(!mfa)} />
              <Toggle label="AI-assisted automated triage" active={autoTriage} onClick={() => setAutoTriage(!autoTriage)} />
            </Surface>

            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="subscription center" title="Billing" />
              <p style={{ color: "var(--t2)", lineHeight: 1.75, marginBottom: 16 }}>
                Upgrade the Cognix workspace with weekly, monthly, or yearly subscription plans using the branded payment portal.
              </p>
              <Link to="/subscription" className="btn-primary">
                Buy subscription
              </Link>
            </Surface>

            <Surface style={{ padding: 20, borderColor: "rgba(255,101,101,.18)" }}>
              <SectionHeading eyebrow="danger zone" title="Deactivate environment" />
              <p style={{ color: "var(--t2)", lineHeight: 1.75, marginBottom: 16 }}>
                Permanently delete incident data and connected settings for this environment.
              </p>
              <button type="button" className="btn-ghost" style={{ borderColor: "rgba(255,101,101,.28)", color: "var(--red)" }}>
                Delete environment
              </button>
            </Surface>
          </div>
        </div>
      </div>
    </Layout>
  );
}
