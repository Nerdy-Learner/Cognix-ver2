import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { FileText, ShieldCheck, UploadCloud } from "lucide-react";
import Layout from "../components/layout/Layout";
import { SectionHeading, Surface } from "../components/ui/AppFrame";

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Select a CSV file first");
      return;
    }

    setLoading(true);
    setStatus("Uploading dataset...");
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const data = lines.slice(1).map((line) => {
        const values = line.split(",");
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || "";
        });
        return row;
      });

      const interval = setInterval(() => {
        setProgress((current) => (current >= 95 ? current : current + 2));
      }, 100);

      try {
        const response = await fetch("http://localhost:3001/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });

        clearInterval(interval);
        setProgress(100);

        if (response.ok) {
          setStatus("Upload successful. Agent pipeline started.");
        } else {
          setStatus("Upload failed");
        }
      } catch (error) {
        console.error(error);
        setStatus("Server error");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Surface className="line-accent" style={{ padding: 24 }}>
          <div className="workspace-header">
            <div>
              <div className="page-eyebrow">ingestion workspace</div>
              <h1 className="workspace-title">Telemetry intake desk</h1>
              <p className="workspace-copy">This page now stays focused on the work itself: choose a source, drop the file, watch the pipeline handoff, and move straight into incidents.</p>
            </div>
          </div>

          <div className="workspace-metric-grid" style={{ marginTop: 18 }}>
            {[
              { label: "Accepted format", value: "CSV", tone: "var(--accent-3)" },
              { label: "Max payload", value: "50 MB", tone: "var(--amber)" },
              { label: "Pipeline stages", value: "04", tone: "var(--red)" },
              { label: "Routing target", value: "Incidents", tone: "var(--green)" },
            ].map((item) => (
              <div key={item.label} className="workspace-stat">
                <div className="label-xs">{item.label}</div>
                <div className="workspace-stat-value" style={{ color: item.tone }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Surface>

        <div className="workspace-grid workspace-grid-incidents">
          <Surface className="line-accent" style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <button className="btn-primary" type="button">CSV upload</button>
              <button className="btn-ghost" type="button" disabled>Cloud API</button>
              <button className="btn-ghost" type="button" disabled>Syslog stream</button>
            </div>

            <Motion.div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const droppedFile = event.dataTransfer.files[0];
                if (droppedFile) setFile(droppedFile);
              }}
              className="upload-stage"
              style={{
                borderColor: isDragging ? "rgba(255,138,61,.35)" : "rgba(255,255,255,.1)",
                background: isDragging ? "rgba(255,138,61,.08)" : undefined,
              }}
            >
              <div className="upload-orbit upload-orbit-a" />
              <div className="upload-orbit upload-orbit-b" />

              <div className="upload-stage-inner">
                <div className="upload-stage-icon">
                  <UploadCloud size={36} style={{ color: "var(--accent-2)" }} />
                </div>

                <div className="page-eyebrow">drop zone // live intake</div>
                <h2 className="upload-stage-title">
                  {file ? "Dataset armed for ingestion" : "Drop telemetry into the corridor"}
                </h2>
                <p className="upload-stage-copy">
                  CSV files flow into the classifier pipeline automatically, preserving the same premium tone while keeping the task simple and fast.
                </p>

                <input type="file" accept=".csv" id="fileUpload" className="hidden" onChange={(event) => setFile(event.target.files[0])} />

                <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 28, flexWrap: "wrap" }}>
                  <label htmlFor="fileUpload" className="secondary-button" style={{ cursor: "pointer" }}>
                    Browse files
                  </label>
                  {file ? (
                    <button onClick={handleUpload} disabled={loading} className="primary-button" type="button">
                      {loading ? "Processing..." : "Start ingestion"}
                    </button>
                  ) : null}
                </div>

                {file ? (
                  <div className="upload-file-chip">
                    <FileText size={18} style={{ color: "var(--accent-3)" }} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: "var(--t2)" }}>{(file.size / 1024).toFixed(1)} KB • ready to upload</p>
                    </div>
                  </div>
                ) : null}

                {loading ? (
                  <div style={{ width: "100%", maxWidth: 520, margin: "28px auto 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".14em" }}>
                      <span>{status}</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                      <Motion.div className="bg-[#ff8a3d] h-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : null}

                {!loading && status ? (
                  <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--green)", background: "rgba(88,213,155,.1)", padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(88,213,155,.18)" }}>
                    <ShieldCheck size={16} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{status}</span>
                  </div>
                ) : null}
              </div>
            </Motion.div>
          </Surface>

          <div style={{ display: "grid", gap: 18 }}>
            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="pipeline handoff" title="What happens next" />
              <div className="panel-grid">
                {[
                  { label: "01", text: "Ingest raw telemetry and map headers into the working schema." },
                  { label: "02", text: "Trigger classifier and enrichment agents with no extra analyst steps." },
                  { label: "03", text: "Route reviewed output directly into the case workspace." },
                ].map((item) => (
                  <div key={item.label} className="signal-stage">
                    <div className="label-xs">step {item.label}</div>
                    <strong>{item.text}</strong>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ padding: 20 }}>
              <SectionHeading eyebrow="intake notes" title="Operator cues" />
              <div className="panel-grid">
                {[
                  "Use SOC-aligned CSV headers for the fastest ingest.",
                  "Upload lane is optimized for analyst handoff, not general file storage.",
                  "Once processed, the strongest signals land in incidents automatically.",
                ].map((item) => (
                  <div key={item} className="command-card">
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </Layout>
  );
}
