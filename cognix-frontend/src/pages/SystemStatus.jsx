import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle, Clock, Cpu, Wifi, Zap } from 'lucide-react';
import TopNav from '../components/layout/TopNav';

// ── Circular gauge canvas ────────────────────────────────────
function CircularGauge({ label, value, max, color, unit = '%', size = 170 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size * 0.38;
    const start = Math.PI * 0.75;
    const fullArc = Math.PI * 1.5;
    const progress = Math.min(value / max, 1);
    const endAngle = start + fullArc * progress;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + fullArc);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.16}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value}${unit}`, cx, cy - size * 0.04);

    // Label text
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `${size * 0.07}px 'JetBrains Mono', monospace`;
    ctx.fillText(label, cx, cy + size * 0.18);
  }, [value, max, color, size, unit, label]);

  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

// ── Uptime counter ───────────────────────────────────────────
function UptimeCounter() {
  const [seconds, setSeconds] = useState(Math.floor(Math.random() * 86400 * 30));
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = n => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {[['DAYS', d], ['HRS', h], ['MIN', m], ['SEC', s]].map(([lbl, val]) => (
        <div key={lbl} style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#0062FF', textShadow: '0 0 30px rgba(0,98,255,0.6)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{pad(val)}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem',
          }}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}

const AGENTS = [
  { id: 'AGT-001', name: 'INTAKE AGENT', role: 'Log parsing & normalization', status: 'ACTIVE', color: '#30D158', load: 12 },
  { id: 'AGT-002', name: 'CLASSIFIER AGENT', role: 'Threat scoring & severity mapping', status: 'ACTIVE', color: '#30D158', load: 34 },
  { id: 'AGT-003', name: 'CORRELATION AGENT', role: 'Cross-event pattern detection', status: 'ACTIVE', color: '#30D158', load: 8 },
  { id: 'AGT-004', name: 'REPORT AGENT', role: 'Forensic report generation', status: 'STANDBY', color: '#FF9F0A', load: 0 },
  { id: 'AGT-005', name: 'ESCALATION AGENT', role: 'Auto-escalation & notification', status: 'STANDBY', color: '#FF9F0A', load: 0 },
];

const METRICS = [
  { label: 'THREAT LEVEL', value: 0, max: 100, color: '#30D158', unit: '%' },
  { label: 'SYSTEM HEALTH', value: 99, max: 100, color: '#0062FF', unit: '%' },
  { label: 'PIPELINE LOAD', value: 18, max: 100, color: '#A78BFA', unit: '%' },
];

export default function SystemStatus() {
  const [time, setTime] = useState(new Date());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const liveTime = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fff', minHeight: '100vh' }}>
      <TopNav />

      {/* ── STATUS HEADER ──────────────────────────── */}
      <section style={{
        minHeight: '45vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 6vw 5rem', paddingTop: 64,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background radial */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 60% 0%, rgba(48,209,88,0.06), transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#30D158', boxShadow: '0 0 14px #30D158',
            }} className="blink" />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem', letterSpacing: '0.28em', color: '#30D158',
            }}>ALL SYSTEMS NOMINAL</span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.25)',
          }}>{liveTime} UTC</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 108px)',
          fontWeight: 700, lineHeight: 0.9,
          letterSpacing: '-0.03em', margin: '0 0 2rem',
          background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.4))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SYSTEM<br />STATUS
        </h1>
      </section>

      {/* ── GAUGES ─────────────────────────────────── */}
      <section style={{ padding: '7rem 6vw' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem', letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.3)', marginBottom: '4rem',
        }}>
          // LIVE_METRICS · OPERATIONAL_STATUS
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {METRICS.map(m => (
            <div key={m.label} style={{
              background: '#000', padding: '3.5rem 2rem',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '1.5rem',
            }}>
              <CircularGauge {...m} size={180} />
            </div>
          ))}
        </div>
      </section>

      {/* ── UPTIME ─────────────────────────────────── */}
      <section style={{
        padding: '5rem 6vw 7rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem', letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.3)', marginBottom: '2rem',
        }}>
          // CONTINUOUS_UPTIME · SINCE_DEPLOYMENT
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '3rem' }}>
          Platform Uptime
        </h2>
        <UptimeCounter />
      </section>

      {/* ── AGENT STATUS ───────────────────────────── */}
      <section style={{ padding: '7rem 6vw' }}>
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)', marginBottom: '1rem',
          }}>
            // AGENT_REGISTRY · LIVE_STATUS
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>AI Agents</h2>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: '1.5px', background: 'rgba(255,255,255,0.04)',
        }}>
          {AGENTS.map((agent, i) => (
            <div key={agent.id} style={{
              background: '#000', padding: '2rem',
              display: 'flex', alignItems: 'center',
              gap: '2rem', flexWrap: 'wrap',
              opacity: ready ? 1 : 0,
              transform: ready ? 'none' : 'translateX(-16px)',
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}>
              {/* ID */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.62rem', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.25)',
                flex: '0 0 80px',
              }}>{agent.id}</span>

              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: agent.color,
                boxShadow: `0 0 10px ${agent.color}`,
                flex: '0 0 8px',
              }} className={agent.status === 'ACTIVE' ? 'blink' : ''} />

              {/* Name & role */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{
                  fontSize: '0.9rem', fontWeight: 700,
                  letterSpacing: '0.08em', marginBottom: '0.3rem',
                }}>{agent.name}</div>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.4)',
                }}>{agent.role}</div>
              </div>

              {/* Status badge */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.6rem', letterSpacing: '0.22em',
                color: agent.color,
                padding: '0.3rem 0.8rem',
                border: `1px solid ${agent.color}40`,
                background: `${agent.color}10`,
              }}>{agent.status}</span>

              {/* Load bar */}
              <div style={{ flex: '0 0 160px' }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.55rem', letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.25)',
                  marginBottom: '0.4rem',
                }}>LOAD: {agent.load}%</div>
                <div style={{
                  height: 3, background: 'rgba(255,255,255,0.08)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '100%', width: `${agent.load}%`,
                    background: agent.color,
                    boxShadow: `0 0 8px ${agent.color}80`,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SYSTEM INFO ────────────────────────────── */}
      <section style={{
        padding: '5rem 6vw 7rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5px', background: 'rgba(255,255,255,0.04)',
        }}>
          {[
            { icon: Cpu, label: 'RUNTIME', value: 'Python 3.11', color: '#A78BFA' },
            { icon: Wifi, label: 'API ENDPOINT', value: 'localhost:3001', color: '#0062FF' },
            { icon: Zap, label: 'FRAMEWORK', value: 'FastAPI', color: '#FF9F0A' },
            { icon: CheckCircle, label: 'ENVIRONMENT', value: 'Development', color: '#30D158' },
          ].map(item => (
            <div key={item.label} style={{
              background: '#000', padding: '2rem',
            }}>
              <item.icon size={20} color={item.color} style={{ marginBottom: '1.2rem' }} />
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.58rem', letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.3)', marginBottom: '0.6rem',
              }}>{item.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section style={{
        padding: '6rem 6vw',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '2rem',
      }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.3)', marginBottom: '1rem',
          }}>// DEPLOY · ACCESS · CONTROL</div>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
            All systems<br />are go.
          </h2>
        </div>
        <Link to="/app" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          padding: '1.1rem 3rem',
          background: '#0062FF', color: '#fff',
          textDecoration: 'none', fontWeight: 700,
          fontSize: '0.85rem', letterSpacing: '0.18em',
          boxShadow: '0 0 40px rgba(0,98,255,0.5)',
        }}>
          ENTER PLATFORM <ChevronRight size={16} />
        </Link>
      </section>
    </div>
  );
}
