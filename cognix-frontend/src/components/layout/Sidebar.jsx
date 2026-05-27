import { Link, useLocation } from "react-router-dom";
import { logoutUser } from "../../services/login-api";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Radio,
  Settings,
  Upload,
  Home,
  LogOut,
} from "lucide-react";
import BrandMark from "../BrandMark";

const sections = [
  {
    title: "Command",
    items: [
      { name: "Home page", path: "/", icon: Home },
      { name: "Dashboard", path: "/app", icon: LayoutDashboard },
      { name: "Alerts", path: "/alerts", icon: Radio },
      { name: "Incidents", path: "/incidents", icon: AlertTriangle },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Upload", path: "/upload", icon: Upload },
      { name: "Agents", path: "/agents", icon: Bot },
      { name: "Reports", path: "/reports", icon: FileText },
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  // const user = JSON.parse(localStorage.getItem("cognix_user"));
  let user = null;

  try {
    const storedUser = localStorage.getItem("cognix_user");

    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    console.warn("Invalid cognix_user in localStorage");
    localStorage.removeItem("cognix_user");
  }

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();

    localStorage.removeItem("cognix_token");
    localStorage.removeItem("cognix_user");
    localStorage.removeItem("otpId");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  return (
    <aside className="shell-sidebar">
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <BrandMark />
      </div>

      <nav style={{ flex: 1, padding: "20px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
        {sections.map((section) => (
          <div key={section.title}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".22em", color: "var(--t3)", marginBottom: 10, paddingLeft: 8, textTransform: "uppercase" }}>
              {section.title}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {section.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-item${active ? " active" : ""}`}>
                    <item.icon size={16} style={{ flexShrink: 0 }} />
                    <span>{item.name}</span>
                    {active ? (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "linear-gradient(180deg, var(--accent-2), var(--gold))",
                          boxShadow: "0 0 16px rgba(255,138,61,.55)",
                        }}
                      />
                    ) : null}
                  </Link>
                );
              })}
              {section.title === "Operations" && (
                <button key="logout" onClick={handleLogout} className="nav-item" style={{ textAlign: "left", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
                  <LogOut size={16} style={{ flexShrink: 0 }} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          className="command-card"
          style={{ background: "rgba(255,255,255,0.028)" }}
        >
          {user && (
            <div
              style={{
                fontSize: 12,
                marginBottom: 8,
                color: "var(--t2)"
              }}
            >
              Logged in as
              <div style={{ fontWeight: 600, color: "#fff" }}>
                {user.name} ({user.role})
              </div>
            </div>
          )}
          <div className="status-inline">
            <span className="pip pip-green" style={{ width: 7, height: 7 }} />
            System nominal
          </div>
          <p style={{ marginTop: 10 }}>
            Analysts online: 04. Automated classifiers and enrichment agents are actively routing telemetry.
          </p>
        </div>
      </div>
    </aside>
  );
}
