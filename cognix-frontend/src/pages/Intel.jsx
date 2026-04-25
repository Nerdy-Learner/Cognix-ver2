import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Upload, AlertTriangle, Bot, FileText,
  Zap, ChevronRight, Lock, Activity, Target,
} from 'lucide-react';
import TopNav from '../components/layout/TopNav';

const CAPABILITIES = [
  {
    icon: Upload,
    code: 'CAP_01',
    title: 'LOG INGESTION',
    desc: 'Multi-format log upload — CSV, JSON, PCAP. Automatic schema detection and normalization pipeline.',
    color: '#0062FF',
  },
  {
    icon: Bot,
    code: 'CAP_02',
    title: 'AGENT PIPELINE',
    desc: 'Autonomous AI agents orchestrated via LangChain. Each agent specializes in a threat domain.',
    color: '#A78BFA',
  },
  {
    icon: AlertTriangle,
    code: 'CAP_03',
    title: 'THREAT TRIAGE',
    desc: 'Real-time severity classification (HIGH / MED / LOW) using ML classifiers trained on CVE data.',
    color: '#FF2D55',
  },
  {
    icon: Activity,
    code: 'CAP_04',
    title: 'INCIDENT TRACKING',
    desc: 'Full incident lifecycle management — open, investigate, escalate, close. Audit trail preserved.',
    color: '#FF9F0A',
  },
  {
    icon: FileText,
    code: 'CAP_05',
    title: 'FORENSIC REPORTING',
    desc: 'AI-generated incident reports with IOC extraction, MITRE ATT&CK mapping, and executive summaries.',
    color: '#30D158',
  },
  {
    icon: Lock,
    code: 'CAP_06',
    title: 'THREAT SCORING',
    desc: 'Risk scoring engine combining asset criticality, exploit likelihood, and lateral movement vectors.',
    color: '#0DD4C4',
  },
];

const PIPELINE = [
  { label: 'UPLOAD', icon: '📂', desc: 'Log files ingested', color: '#0062FF' },
  { label: 'NORMALIZE', icon: '⚙️', desc: 'Schema extraction', color: '#A78BFA' },
  { label: 'AGENTS', icon: '🤖', desc: 'AI analysis', color: '#FF9F0A' },
  { label: 'CLASSIFY', icon: '🧠', desc: 'Threat scoring', color: '#FF2D55' },
  { label: 'TRIAGE', icon: '⚡', desc: 'Auto escalation', color: '#0DD4C4' },
  { label: 'REPORT', icon: '📊', desc: 'Forensic output', color: '#30D158' },
];

const TECH = [
  { name: 'React', cat: 'FRONTEND' },
  { name: 'FastAPI', cat: 'BACKEND' },
  { name: 'LangChain', cat: 'AI_ORCHESTRATION' },
  { name: 'Python', cat: 'RUNTIME' },
  { name: 'Recharts', cat: 'VISUALIZATION' },
  { name: 'Tailwind CSS', cat: 'STYLING' },
  { name: 'Framer Motion', cat: 'ANIMATION' },
  { name: 'LLM', cat: 'AI_CORE' },
];

function CapabilityCard({ icon: Icon, code, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${hexToRgb(color)}, 0.06)` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(16px)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.3s ease',
        animationDelay: `${delay}s`,
      }}
      className="fade-up"
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: color, opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.3s ease',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8,
          background: `rgba(${hexToRgb(color)}, 0.12)`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.58rem', letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.2)',
        }}>{code}</span>
      </div>

      <h3 style={{
        fontSize: '0.82rem', fontWeight: 700,
        letterSpacing: '0.16em', color: '#fff',
        marginBottom: '0.8rem',
        fontFamily: "'JetBrains Mono', monospace",
      }}>{title}</h3>

      <p style={{
        fontSize: '0.85rem', lineHeight: 1.65,
        color: 'rgba(255,255,255,0.45)',
      }}>{desc}</p>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function Intel() {
  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fff', minHeight: '100vh' }}>
      <TopNav />

      {/* ── CLASSIFIED HEADER ──────────────────────── */}
      <section style={{
        minHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 6vw 5rem',
        paddingTop: 64,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,98,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,98,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem', letterSpacing: '0.32em',
          color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem',
        }}>
          // INTEL_CLASSIFICATION: INTERNAL · ACCESS_LEVEL: OPERATOR
        </div>

        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 110px)',
          fontWeight: 700, lineHeight: 0.9,
          letterSpacing: '-0.03em', margin: 0,
          background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.4))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          PLATFORM<br />INTELLIGENCE
        </h1>

        <p style={{
          fontSize: '1rem', lineHeight: 1.7,
          color: 'rgba(255,255,255,0.45)',
          maxWidth: 580, marginTop: '2rem',
        }}>
          Classified briefing on the COGNIX AI architecture, operational capabilities,
          and deployment pipeline. For SOC operator eyes only.
        </p>
      </section>

      {/* ── MISSION BRIEFING ───────────────────────── */}
      <section style={{ padding: '7rem 6vw' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem', letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem',
            }}>
              // MISSION_BRIEF
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.15, margin: '0 0 2rem' }}>
              What is<br />COGNIX AI?
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              COGNIX AI is an enterprise-grade Security Operations Centre (SOC) triage platform
              that combines the power of large language models, autonomous AI agents, and real-time
              threat intelligence to automate the most time-consuming parts of incident response.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)' }}>
              Security analysts upload raw logs or alert feeds. COGNIX AI ingests, normalises,
              and dispatches the data through a multi-agent pipeline that scores severity,
              identifies patterns, suggests mitigations, and generates forensic-grade reports —
              all in real time.
            </p>
          </div>

          {/* Stats column */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '1.5px',
            background: 'rgba(255,255,255,0.04)',
          }}>
            {[
              { label: 'CLASSIFICATION ACCURACY', value: '94.7%', color: '#30D158' },
              { label: 'MEAN TIME TO TRIAGE', value: '< 2s', color: '#0062FF' },
              { label: 'SUPPORTED LOG FORMATS', value: '12+', color: '#A78BFA' },
              { label: 'AI AGENTS IN PIPELINE', value: '5', color: '#FF9F0A' },
              { label: 'MITRE ATT&CK COVERAGE', value: '80%', color: '#0DD4C4' },
            ].map(item => (
              <div key={item.label} style={{
                background: '#000', padding: '1.5rem 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.62rem', letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.35)',
                }}>{item.label}</span>
                <span style={{
                  fontSize: '1.5rem', fontWeight: 700,
                  color: item.color, textShadow: `0 0 20px ${item.color}60`,
                }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ───────────────────────────── */}
      <section style={{
        padding: '0 6vw 7rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ paddingTop: '5rem', marginBottom: '4rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)', marginBottom: '1rem',
          }}>
            // IDENTIFIED_CAPABILITIES
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
            What it can do
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5px', background: 'rgba(255,255,255,0.04)' }}>
          {CAPABILITIES.map((cap, i) => (
            <CapabilityCard key={cap.code} {...cap} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── PIPELINE ───────────────────────────────── */}
      <section style={{
        padding: '5rem 6vw 7rem',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)', marginBottom: '1rem',
          }}>
            // OPERATIONAL_FLOW
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
            How it works
          </h2>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto', gap: '0',
          paddingBottom: '1rem',
        }}>
          {PIPELINE.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              {/* Step node */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '1rem', flex: '0 0 auto', padding: '0 1rem',
              }}>
                <div style={{
                  width: 64, height: 64,
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem',
                  boxShadow: `0 0 24px ${step.color}30`,
                  position: 'relative',
                }}>
                  {/* Pulse ring on first and last */}
                  {(i === 0 || i === PIPELINE.length - 1) && (
                    <div style={{
                      position: 'absolute', inset: -6,
                      border: `1px solid ${step.color}`,
                      animationDelay: `${i * 0.5}s`,
                    }} className="pulse-ring-anim" />
                  )}
                  {step.icon}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem', letterSpacing: '0.2em',
                    color: step.color, fontWeight: 700, marginBottom: '0.3rem',
                  }}>{step.label}</div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.3)',
                  }}>{step.desc}</div>
                </div>
              </div>

              {/* Connector */}
              {i < PIPELINE.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: 'rgba(255,255,255,0.08)',
                  position: 'relative', overflow: 'hidden',
                  minWidth: 30,
                }}>
                  <div style={{
                    position: 'absolute', top: 0, width: '30%', height: '100%',
                    background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                    opacity: 0.8,
                  }} className="pipeline-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────── */}
      <section style={{ padding: '7rem 6vw' }}>
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)', marginBottom: '1rem',
          }}>
            // TECH_STACK · DEPENDENCIES
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>Built with</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5px', background: 'rgba(255,255,255,0.04)' }}>
          {TECH.map(t => (
            <div key={t.name} style={{
              background: '#000', padding: '1.5rem 2.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              flex: '1 0 140px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem', letterSpacing: '0.25em',
                color: 'rgba(255,255,255,0.25)',
              }}>{t.cat}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t.name}</span>
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
          }}>// INITIATE_ACCESS</div>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
            Ready to<br />take control?
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
