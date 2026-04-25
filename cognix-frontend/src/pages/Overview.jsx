import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import TopNav from "../components/layout/TopNav";
import NeuralSphere from "../components/NeuralSphere";

function useCounter(target, duration = 1600, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return undefined;
    let start = null;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(ease(progress) * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, active, duration]);

  return active ? value : 0;
}

const trend = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  risk: Math.floor(Math.random() * 45 + 14),
}));

const ticker =
  "// COGNIX COMMAND FABRIC ◈ LIVE DETECTIONS: 2,847 ◈ RESPONSE AGENTS: 04 ACTIVE ◈ ANALYST UPTIME: 99.997% ◈ INGEST PIPELINE READY ◈ FALSE POSITIVE RATE: 0.3% ◈ MODEL STACK: GPT-SOC ◈ FORENSICS READY ◈";

function StatCard({ label, value, color, active, delay, detail }) {
  const count = useCounter(value, 1600, active);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        padding: "2.2rem 2rem",
        position: "relative",
        overflow: "hidden",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 110%, ${color}30, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: color, opacity: 0.55 }} />
      <div className="label-sm" style={{ marginBottom: "1rem" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "clamp(42px,5vw,74px)",
          fontWeight: 700,
          lineHeight: 1,
          color,
          textShadow: `0 0 36px ${color}35`,
          letterSpacing: "-0.04em",
          fontFamily: "var(--display)",
        }}
      >
        {count}
      </div>
      <div style={{ marginTop: 10, color: "var(--t2)", fontSize: 13 }}>{detail}</div>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(new Date());


  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 120);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(clock);
    };
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const liveTime = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())} UTC`;

  const stats = [
    { label: "Escalations", value: 12, color: "#ff6565", detail: "Immediate analyst action" },
    { label: "Live agents", value: 4, color: "#ff8a3d", detail: "Classify, enrich, score, route" },
    { label: "Safe closures", value: 86, color: "#58d59b", detail: "Automated low-risk disposal" },
    { label: "Coverage", value: 99, color: "#ffd27d", detail: "Environment telemetry coverage" },
  ];

  return (
    <div style={{ fontFamily: "var(--display)", color: "#fff", minHeight: "100vh" }}>
      <TopNav />

      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "0 6vw",
          paddingTop: 110,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg,transparent,rgba(255,138,61,0.65) 40%,rgba(255,138,61,0.65) 60%,transparent)",
            pointerEvents: "none",
            zIndex: 10,
          }}
          className="scan-line-anim"
        />

        <div style={{ flex: 1, maxWidth: 720, paddingRight: "2rem" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.66rem",
              letterSpacing: "0.28em",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "1.8rem",
              opacity: ready ? 1 : 0,
              transition: "opacity 0.8s ease 0.1s",
              textTransform: "uppercase",
            }}
          >
            // autonomous security operations · premium threat intelligence fabric
          </div>

          <div style={{ position: "relative", marginBottom: "1.1rem" }}>
            <h1 style={{ fontSize: "clamp(72px,10vw,136px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.05em", margin: 0, color: "#fff7f2" }}>
              COGNIX
            </h1>
            <h1
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                fontSize: "clamp(72px,10vw,136px)",
                fontWeight: 700,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                margin: 0,
                color: "#fff7f2",
                pointerEvents: "none",
              }}
              className="glitch-layer"
            >
              COGNIX
            </h1>
          </div>

          <div style={{ fontSize: "clamp(28px,4vw,54px)", fontWeight: 400, lineHeight: 1, letterSpacing: "0.2em", color: "rgba(255,232,214,0.46)", marginBottom: "2rem" }}>
            DEFENSE CLOUD
          </div>

          <p
            style={{
              fontSize: "1.02rem",
              lineHeight: 1.85,
              color: "rgba(255,234,222,0.7)",
              maxWidth: 560,
              marginBottom: "2.2rem",
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(16px)",
              transition: "opacity .8s ease .25s,transform .8s ease .25s",
            }}
          >
            One premium operating surface for ingestion, AI triage, analyst review, and response reporting.
            The intro and the application now speak the same visual language: warm command-center lighting,
            cinematic depth, and clear operational confidence.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "1.8rem", marginBottom: "2rem", fontFamily: "var(--mono)", fontSize: "0.67rem", letterSpacing: "0.14em", opacity: ready ? 1 : 0, transition: "opacity .8s ease .4s", textTransform: "uppercase" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="pip pip-green" style={{ width: 7, height: 7 }} />
              <span style={{ color: "#58d59b" }}>Platform online</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.28)" }}>{liveTime}</span>
            <span style={{ color: "rgba(255,255,255,0.22)" }}>Build v3.0 flagship</span>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(12px)", transition: "opacity .8s ease .5s,transform .8s ease .5s" }}>
            <Link to="/subscription" className="btn-primary">
              Buy subscription <ArrowRight size={13} />
            </Link>
            <Link to="/login" className="btn-primary">
              Enter platform <ArrowRight size={13} />
            </Link>
            <Link to="/intel" className="btn-ghost">
              View intelligence <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        <div style={{ flexShrink: 0, opacity: ready ? 1 : 0, transform: ready ? "none" : "scale(0.9)", transition: "opacity 1s ease 0.4s,transform 1s ease 0.4s" }} className="float-anim">
          <NeuralSphere size={460} />
        </div>

        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.2)", fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.2em" }}>
          <span>Scroll</span>
          <ArrowDown size={11} />
        </div>
      </section>

      <section style={{ padding: "4rem 6vw 5rem", position: "relative" }}>
        <div className="page-eyebrow" style={{ marginBottom: "2.2rem" }}>
          // live mission metrics
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, overflow: "hidden" }}>
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} active={ready} delay={index * 0.08} />
          ))}
        </div>
      </section>

      <section style={{ padding: "0 6vw 6rem" }}>
        <div className="app-surface" style={{ padding: "2.5rem", borderRadius: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", gap: 20 }}>
            <div>
              <div className="page-eyebrow" style={{ marginBottom: ".5rem" }}>
                // command pulse · last 24h
              </div>
              <h2 className="section-title">Threat activity timeline</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="pip pip-green" style={{ width: 6, height: 6 }} />
              <span className="status-inline">Live feed</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.18)" fontSize={9} tickLine={false} axisLine={false} interval={3} style={{ fontFamily: "var(--mono)" }} />
              <YAxis stroke="rgba(255,255,255,0.18)" fontSize={9} tickLine={false} axisLine={false} style={{ fontFamily: "var(--mono)" }} />
              <Tooltip
                contentStyle={{
                  background: "#130809",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  fontFamily: "var(--mono)",
                  fontSize: "0.7rem",
                  color: "#fff",
                }}
                cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="risk" stroke="#ff8a3d" strokeWidth={2.4} dot={false} activeDot={{ r: 3, fill: "#ffd27d", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", padding: "0.82rem 0", background: "rgba(0,0,0,0.34)" }}>
        <div style={{ display: "flex", width: "max-content" }} className="marquee-track">
          {[ticker, ticker].map((item, index) => (
            <span key={index} style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", letterSpacing: "0.2em", color: "rgba(255,237,228,0.28)", whiteSpace: "nowrap", paddingRight: "4rem" }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
