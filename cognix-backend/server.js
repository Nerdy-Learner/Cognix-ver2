import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { sendOtpMail } from "./utils/sendOtpMail.js";
import axios from "axios";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST before reading any env vars
function loadDotEnv() {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}
loadDotEnv();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cognix";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const port = Number(process.env.PORT || 3001);
const pythonBackendUrl = (process.env.PYTHON_BACKEND_URL || "http://localhost:8002").replace(/\/$/, "");



const cashfreeEnv = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const cashfreeApiBase =
    cashfreeEnv === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
const cashfreeApiVersion = process.env.CASHFREE_API_VERSION || "2025-01-01";
const cashfreeAppId = process.env.CASHFREE_APP_ID || "";
const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || "";
const paymentDemoMode = process.env.DEMO_MODE === "true";

// CORS — allow both localhost (dev) and production frontend URL
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    frontendUrl
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
    })
);
app.use(express.json({ limit: "50mb" }));

/* ---------------- HEALTH CHECK (Render pings this) ---------------- */

app.get("/", (req, res) => {
    res.json({ status: "ok", service: "cognix-backend", timestamp: new Date().toISOString() });
});

/* ---------------- DATABASE CONNECTION ---------------- */

mongoose
    .connect(mongoUri, { dbName: "cognix" })
    .then(() => console.log("MongoDB connected to database: cognix"))
    .catch((err) => console.log("MongoDB connection error:", err));


/* ---------------- SCHEMAS ---------------- */

// Raw CSV incidents
const incidentSchema = new mongoose.Schema(
    {
        processed: {
            type: Boolean,
            default: false
        }
    },
    { strict: false }
);
const Incident = mongoose.model("Incident", incidentSchema);

// Agent outputs (separate collections)
const agent1Schema = new mongoose.Schema({}, { strict: false });
const Agent1Output = mongoose.model("Agent1Output", agent1Schema);

const agent2Schema = new mongoose.Schema({}, { strict: false });
const Agent2Output = mongoose.model("Agent2Output", agent2Schema);

const agent3Schema = new mongoose.Schema({}, { strict: false });
const Agent3Output = mongoose.model("Agent3Output", agent3Schema);

const agent4Schema = new mongoose.Schema({}, { strict: false });
const Agent4Output = mongoose.model("Agent4Output", agent4Schema);


/* ---------------- AGENT-4 PURE JS PREDICTOR ---------------- */
// Replaces PythonShell + sklearn model for deployment compatibility.
// Uses rule-based scoring that mirrors the trained model's behavior.

function predictAgent4JS(features, riskLevel) {
    let score = 0;

    // Alert type scoring
    const alertType = (features.Alert_Type || "").toLowerCase();
    if (alertType.includes("intrusion")) score += 40;
    else if (alertType.includes("brute force")) score += 35;
    else if (alertType.includes("bot")) score += 30;
    else if (alertType.includes("recon")) score += 25;
    else if (alertType.includes("port scan")) score += 20;
    else if (alertType.includes("normal")) score -= 10;

    // Protocol risk scoring
    const protocolRisk = (features.protocol_risk || "").toLowerCase();
    if (protocolRisk === "high") score += 25;
    else if (protocolRisk === "medium") score += 15;
    else if (protocolRisk === "low") score += 5;

    // Asset value scoring
    const assetValue = (features.asset_value || "").toLowerCase();
    if (assetValue === "high") score += 20;
    else if (assetValue === "medium") score += 10;

    // Geo anomaly scoring
    if (features.geo_anomaly === "Yes") score += 15;

    // Internal IP scoring (external is riskier)
    if (features.is_internal_ip === "No") score += 10;

    // Port category scoring
    const portCat = (features.port_category || "").toLowerCase();
    if (portCat === "ssh" || portCat === "rdp") score += 15;
    else if (portCat === "dns") score += 5;

    // Risk level boost from Agent3
    if (riskLevel === "Critical") score += 30;
    else if (riskLevel === "High") score += 15;

    // Threshold-based prediction
    const threshold = 50;
    const prediction = score >= threshold ? 1 : 0;

    // Confidence calculation (sigmoid-like mapping)
    const rawConfidence = Math.min(Math.abs(score - threshold) / 50, 1);
    const confidence = 0.5 + rawConfidence * 0.5;

    return {
        prediction,
        confidence: Math.round(confidence * 10000) / 10000
    };
}


async function runAgentsPipeline() {
    try {
        console.log("Running agents pipeline...");

        const unprocessedIncidents = await Incident.find({ processed: false });

        for (const incident of unprocessedIncidents) {
            try {
                console.log("Processing incident:", incident._id);

                if (incident.processed) continue;

                // Agent 1 output
                // =========================
                // REAL FASTAPI AGENT-1
                // =========================

                const fastapiResponse = await axios.post(
                    `${pythonBackendUrl}/analyze`,
                    {
                        alert: incident
                    }
                );

                const pipeline = fastapiResponse.data;

                if (!pipeline || pipeline.error || !pipeline.agent_outputs) {
                    console.error(`Skipping incident ${incident._id} due to FastAPI error:`, pipeline?.error || "Invalid response structure");
                    continue;
                }

                const fastapiAgent1 = pipeline.agent_outputs[0];
                const fastapiAgent2 = pipeline.agent_outputs[1];
                const fastapiAgent3 = pipeline.agent_outputs[2];
                const fastapiAgent4 = pipeline.agent_outputs[3];

                if (!fastapiAgent1 || !fastapiAgent2 || !fastapiAgent3 || !fastapiAgent4) {
                    console.error(`Skipping incident ${incident._id} because agent outputs are incomplete`);
                    continue;
                }

                const parsedType = pipeline.features?.attack_type || "BENIGN";

                await Agent1Output.create({
                    incidentId: incident._id,
                    agent: fastapiAgent1.agent,
                    decision: fastapiAgent1.decision,
                    confidence: fastapiAgent1.confidence,
                    metadata: {
                        attack_type: parsedType
                    },
                    processedAt: new Date()
                });
                console.log("REAL Agent-1 done");

                // Agent 2 output
                // =========================
                // REAL FASTAPI AGENT-2
                // =========================

                const mitreFeatures = pipeline.features || {};

                await Agent2Output.create({
                    incidentId: incident._id,
                    agent: fastapiAgent2.agent,
                    decision: fastapiAgent2.decision,
                    confidence: fastapiAgent2.confidence,
                    metadata: {
                        mitre_tactic: mitreFeatures.mitre_tactic,
                        mitre_technique: mitreFeatures.mitre_technique,
                        severity: mitreFeatures.agent2_severity,
                        category: mitreFeatures.matched_rule,
                        priority: fastapiAgent2.reason,
                        is_internal_ip: "Unknown",
                        port_category: "Unknown",
                        protocol_risk: "Unknown",
                        asset_value: "Unknown",
                        geo_anomaly: false
                    },
                    processedAt: new Date()
                });
                console.log("REAL Agent-2 done");

                // Agent 3 output
                // =========================
                // REAL FASTAPI AGENT-3
                // =========================

                const riskFeatures = pipeline.features || {};

                await Agent3Output.create({
                    incidentId: incident._id,
                    agent: fastapiAgent3.agent,
                    decision: fastapiAgent3.decision,
                    confidence: fastapiAgent3.confidence,
                    metadata: {
                        user: incident.src_user || "Administrator",
                        risk_score: riskFeatures.risk_score || 0,
                        risk_level: riskFeatures.risk_level || "LOW",
                        behavioral_score: riskFeatures.risk_score || 0,
                        attack_type: parsedType,
                        severity: riskFeatures.agent2_severity || "Low",
                        user_behavior: riskFeatures.risk_level === "HIGH" ? "Anomalous" : "Normal",
                        reason: fastapiAgent3.reason
                    },
                    processedAt: new Date()
                });
                console.log("REAL Agent-3 done");

                // Agent 4 output
                // =========================
                // REAL FASTAPI AGENT-4
                // =========================

                const finalFeatures = pipeline.features || {};

                await Agent4Output.create({
                    incidentId: incident._id,
                    agent: fastapiAgent4.agent,
                    decision: fastapiAgent4.decision,
                    confidence: fastapiAgent4.confidence,
                    metadata: {
                        action: finalFeatures.soc_action,
                        priority: finalFeatures.soc_priority,
                        risk_level: finalFeatures.risk_level,
                        risk_score: finalFeatures.risk_score,
                        recommended_response: fastapiAgent4.reason,
                        soc_action: finalFeatures.soc_action
                    },
                    processedAt: new Date()
                });
                console.log("REAL Agent-4 done");

                // Successfully processed - persist status to MongoDB
                await Incident.findByIdAndUpdate(incident._id, { processed: true });
                console.log(`Incident ${incident._id} successfully processed and saved.`);

            } catch (incidentErr) {
                console.error(`Error processing incident ${incident._id}:`, incidentErr.message || incidentErr);
            }
        }

        console.log("Pipeline processing pass completed.");

    } catch (err) {
        console.error("Pipeline error:", err);
    }
}


/* ---------------- INCIDENT ROUTES ---------------- */

// Save uploaded CSV rows
app.post("/api/incidents", async (req, res) => {
    try {
        const { data } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ message: "Invalid data format" });
        }

        const newRecords = [];

        for (const row of data) {
            // Prevent Mongoose from dropping undefined fields and matching the first DB document
            if (!row.Source_IP || !row.Destination_IP) {
                newRecords.push(row);
                continue;
            }

            const exists = await Incident.findOne({
                Source_IP: row.Source_IP,
                Destination_IP: row.Destination_IP,
                Port: row.Port,
                Protocol: row.Protocol,
                Scan_Type: row.Scan_Type
            });

            if (!exists) {
                newRecords.push(row);
            }
        }

        // Only insert if there are unique records to add
        if (newRecords.length > 0) {
            await Incident.insertMany(newRecords);
        }

        runAgentsPipeline(); // Uncomment if you want the pipeline to run immediately after upload

        res.json({
            message: "Incidents saved successfully",
            count: newRecords.length,
        });

    } catch (err) {
        console.error("Error storing incidents:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all incidents
app.get("/api/incidents", async (req, res) => {
    try {
        const incidents = await Incident.find({
            processed: false
        });

        res.json(incidents);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


/* ---------------- AGENT OUTPUT ROUTES ---------------- */

// Agent1 output storage
app.post("/api/agent1", async (req, res) => {
    try {
        await Agent1Output.create(req.body);

        res.json({ message: "Agent1 output stored successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Agent2 output storage
app.post("/api/agent2", async (req, res) => {
    try {
        await Agent2Output.create(req.body);

        res.json({ message: "Agent2 output stored successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Agent3 output storage
app.post("/api/agent3", async (req, res) => {
    try {
        await Agent3Output.create(req.body);

        res.json({ message: "Agent3 output stored successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Agent4 output storage
app.post("/api/agent4", async (req, res) => {
    try {
        await Agent4Output.create(req.body);

        res.json({ message: "Agent4 output stored successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


/* ---------------- FETCH AGENT OUTPUTS ---------------- */

// Optional: view stored outputs

app.get("/api/agent1", async (req, res) => {
    res.json(await Agent1Output.find());
});

app.get("/api/agent2", async (req, res) => {
    res.json(await Agent2Output.find());
});

app.get("/api/agent3", async (req, res) => {
    res.json(await Agent3Output.find());
});

app.get("/api/agent4", async (req, res) => {
    res.json(await Agent4Output.find());
});

// Get incidents + all agent outputs merged
app.get("/api/incidents/full", async (req, res) => {
    try {

        const incidents = await Incident.aggregate([

            {
                $lookup: {
                    from: "agent1outputs",
                    localField: "_id",
                    foreignField: "incidentId",
                    as: "agent1"
                }
            },

            {
                $lookup: {
                    from: "agent2outputs",
                    localField: "_id",
                    foreignField: "incidentId",
                    as: "agent2"
                }
            },

            {
                $lookup: {
                    from: "agent3outputs",
                    localField: "_id",
                    foreignField: "incidentId",
                    as: "agent3"
                }
            },

            {
                $lookup: {
                    from: "agent4outputs",
                    localField: "_id",
                    foreignField: "incidentId",
                    as: "agent4"
                }
            },

            {
                $addFields: {
                    agent1: { $arrayElemAt: ["$agent1", 0] },
                    agent2: { $arrayElemAt: ["$agent2", 0] },
                    agent3: { $arrayElemAt: ["$agent3", 0] },
                    agent4: { $arrayElemAt: ["$agent4", 0] }
                }
            }

        ]);

        res.json(incidents);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to merge incidents with agent outputs"
        });

    }
});

/* ---------------- RUNTIME-LOG ROUTE ---------------- */

app.get("/api/runtime-log", async (req, res) => {
    try {
        const recent = await Agent4Output.find()
            .sort({ processedAt: -1 })
            .limit(10);

        const formatted = recent.map((row) => ({
            text: `[${new Date(row.processedAt).toLocaleTimeString()}] DECISION ${row.decision} (confidence ${row.confidence})`
        }));

        res.json(formatted);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Runtime log failed" });
    }
});


/* ---------------- THROUGPUT ROUTE ---------------- */

app.get("/api/stage-throughput/:stage", async (req, res) => {
    try {
        const windowSeconds = 10;
        const since = new Date(Date.now() - windowSeconds * 1000);

        const stageMap = {
            agent_1_output: Agent1Output,
            agent_2_output: Agent2Output,
            agent_3_output: Agent3Output,
            agent_4_output: Agent4Output,
        };

        const Model = stageMap[req.params.stage];

        if (!Model) {
            return res.status(400).json({ message: "Invalid stage" });
        }

        const count = await Model.countDocuments({
            processedAt: { $gte: since },
        });

        const eps = count / windowSeconds;

        res.json({ eps });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Throughput error" });
    }
});

app.get("/api/throughput", async (req, res) => {
    try {
        const windowSeconds = 10;

        const since = new Date(Date.now() - windowSeconds * 1000);

        const count = await Agent4Output.countDocuments({
            processedAt: { $gte: since }
        });

        const eps = count / windowSeconds;

        res.json({ eps });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Throughput calculation failed" });
    }
});


/* ---------------- LATENCY ---------------- */

app.get("/api/stage-latency/:stage", async (req, res) => {
    try {
        const stage = req.params.stage;

        const stageMap = {
            agent_1_output: Agent1Output,
            agent_2_output: Agent2Output,
            agent_3_output: Agent3Output,
            agent_4_output: Agent4Output,
        };

        const prevStageMap = {
            agent_2_output: Agent1Output,
            agent_3_output: Agent2Output,
            agent_4_output: Agent3Output,
        };

        const CurrentModel = stageMap[stage];
        const PrevModel = prevStageMap[stage];

        if (!CurrentModel) {
            return res.status(400).json({ message: "Invalid stage" });
        }

        const recent = await CurrentModel.find()
            .sort({ processedAt: -1 })
            .limit(20);

        if (!recent.length) {
            return res.json({ latency: 0 });
        }

        let totalLatency = 0;
        let count = 0;

        for (const row of recent) {
            if (!PrevModel) continue;

            const prev = await PrevModel.findOne({
                incidentId: row.incidentId
            });

            if (!prev) continue;

            totalLatency += row.processedAt - prev.processedAt;
            count++;
        }

        const avgLatency = count ? totalLatency / count : 0;

        res.json({ latency: Math.round(avgLatency) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Latency calculation failed" });
    }
});


/* ---------------- REPORTS ---------------- */

app.get("/api/reports", async (req, res) => {
    try {
        const incidents = await Agent4Output.countDocuments();

        const escalations = await Agent4Output.countDocuments({
            decision: "Escalate",
        });

        const today = new Date().toLocaleDateString();

        const reports = [
            {
                id: "REP-001",
                name: `Pipeline decision summary (${incidents} events)`,
                date: today,
                type: "CSV",
            },
            {
                id: "REP-002",
                name: `Escalation report (${escalations} alerts)`,
                date: today,
                type: "CSV",
            },
        ];

        res.json(reports);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Reports fetch failed" });
    }
});


/* ---------------- CSV Export Endpoint ---------------- */

app.get("/api/reports/escalations", async (req, res) => {
    try {
        const escalations = await Agent4Output.find({
            decision: "Escalate",
        });

        if (!escalations.length) {
            return res.send("No escalation records found");
        }

        const rows = [];

        for (const item of escalations) {
            const incident = await Incident.findById(item.incidentId);
            const risk = await Agent3Output.findOne({
                incidentId: item.incidentId,
            });

            rows.push({
                incidentId: item.incidentId,
                Source_IP: incident?.Source_IP,
                Destination_IP: incident?.Destination_IP,
                Protocol: incident?.Protocol,
                Scan_Type: incident?.Scan_Type,
                Risk_Level: risk?.risk_level,
                Decision: item.decision,
                Confidence: item.confidence,
                Timestamp: item.processedAt,
            });
        }

        const header = Object.keys(rows[0]).join(",");

        const csv = [
            header,
            ...rows.map((row) => Object.values(row).join(",")),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=escalation-report.csv"
        );

        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "CSV export failed" });
    }
});



/* ---------------- Classification CSV Endpoint ---------------- */

app.get("/api/reports/classification", async (req, res) => {
    try {
        const classifications = await Agent1Output.find();

        if (!classifications.length) {
            return res.send("No classification data found");
        }

        const counts = {};

        classifications.forEach((item) => {
            const label = item.agent1_label || "Unknown";

            if (!counts[label]) counts[label] = 0;
            counts[label]++;
        });

        const rows = Object.entries(counts).map(([label, count]) => ({
            Label: label,
            Count: count,
        }));

        const header = Object.keys(rows[0]).join(",");

        const csv = [
            header,
            ...rows.map((row) => Object.values(row).join(",")),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=classification-summary.csv"
        );

        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Classification CSV export failed" });
    }
});



/* ---------------- Risk Distribution Export Endpoint ---------------- */

app.get("/api/reports/risk", async (req, res) => {
    try {
        const risks = await Agent3Output.find();

        if (!risks.length) {
            return res.send("No risk data found");
        }

        const counts = {};

        risks.forEach((item) => {
            const level = item.risk_level || "Unknown";

            if (!counts[level]) counts[level] = 0;
            counts[level]++;
        });

        const rows = Object.entries(counts).map(([level, count]) => ({
            Risk_Level: level,
            Count: count,
        }));

        const header = Object.keys(rows[0]).join(",");

        const csv = [
            header,
            ...rows.map((row) => Object.values(row).join(",")),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=risk-distribution.csv"
        );

        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Risk CSV export failed" });
    }
});


/* ---------------- CONFIDENDCE Distribution Export Endpoint ---------------- */

app.get("/api/reports/confidence", async (req, res) => {
    try {
        const outputs = await Agent4Output.find();

        if (!outputs.length) {
            return res.send("No confidence data found");
        }

        const buckets = {
            "0.90–1.00": 0,
            "0.70–0.89": 0,
            "0.50–0.69": 0,
            "<0.50": 0,
        };

        outputs.forEach((item) => {
            const c = item.confidence ?? 0;

            if (c >= 0.9) buckets["0.90–1.00"]++;
            else if (c >= 0.7) buckets["0.70–0.89"]++;
            else if (c >= 0.5) buckets["0.50–0.69"]++;
            else buckets["<0.50"]++;
        });

        const rows = Object.entries(buckets).map(([range, count]) => ({
            Confidence_Range: range,
            Count: count,
        }));

        const header = Object.keys(rows[0]).join(",");

        const csv = [
            header,
            ...rows.map((row) => Object.values(row).join(",")),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=confidence-distribution.csv"
        );

        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Confidence CSV export failed" });
    }
});



/* ---------------- USER SCHEMA ---------------- */

const userSchema = new mongoose.Schema({
    name: String,

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: "analyst"
    },

    lastLogin: Date
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

function sanitizeText(value, maxLength = 140) {
    return String(value || "")
        .trim()
        .slice(0, maxLength);
}

function sanitizePhone(value) {
    return String(value || "")
        .replace(/\D/g, "")
        .slice(0, 15);
}

function mapMethodLabel(method) {
    if (method === "upi") return "upi";
    if (method === "wallet") return "wallet";
    if (method === "bank") return "netbanking";
    return "card";
}

function createOrderId() {
    return `order_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

function formatAmountDisplay(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount || 0));
}

async function callCashfree(endpoint, options = {}) {
    const response = await fetch(`${cashfreeApiBase}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "x-api-version": cashfreeApiVersion,
            "x-client-id": cashfreeAppId,
            "x-client-secret": cashfreeSecretKey,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message =
            data.message || data.error_description || data.error || "Cashfree request failed.";
        throw new Error(message);
    }

    return data;
}



/* ---------------- USER SIGNUP ---------------- */

app.post("/api/auth/signup", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.json({
            success: true,
            message: "User created successfully",
            user
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Signup failed"
        });

    }
});


/* ---------------- USER LOGIN ---------------- */
const otpStore = new Map();
app.post("/api/auth/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                isNewUser: true,
                message: "User not found"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        // ✅ Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpId = crypto.randomBytes(12).toString("hex");

        otpStore.set(otpId, {
            otp,
            userId: user._id.toString(),
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        // ✅ Send OTP email
        await sendOtpMail(user.email, otp);

        res.json({
            success: true,
            requiresTwoFactor: true,
            otpId,
            userId: user._id,
            message: "OTP sent to your email"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }

});

app.post("/api/auth/verify-otp", async (req, res) => {

    try {

        const { otpId, code, userId } = req.body;

        const record = otpStore.get(otpId);

        if (!record) {
            return res.json({
                success: false,
                message: "OTP expired or invalid"
            });
        }

        if (record.userId !== userId) {
            return res.json({
                success: false,
                message: "Invalid OTP session"
            });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(otpId);

            return res.json({
                success: false,
                message: "OTP expired"
            });
        }

        if (record.otp !== code) {
            return res.json({
                success: false,
                message: "Incorrect OTP"
            });
        }

        otpStore.delete(otpId);

        const user = await User.findById(userId);

        user.lastLogin = new Date();
        await user.save();

        const token = crypto.randomBytes(24).toString("hex");

        res.json({
            success: true,
            token,
            user
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });

    }

});

/* ---------------- PAYMENT ROUTES ---------------- */

app.get("/api/payment/config", async (req, res) => {
    res.json({
        cashfreeReady: Boolean(cashfreeAppId && cashfreeSecretKey),
        environment: cashfreeEnv,
        demoMode: paymentDemoMode
    });
});

app.post("/api/payment/demo-payment", async (req, res) => {
    const customerName = sanitizeText(req.body.name, 80);

    if (!paymentDemoMode) {
        return res.status(403).json({ error: "Demo mode is disabled." });
    }

    res.json({
        redirectUrl:
            `${frontendUrl}/payment-success?demo=1` +
            `&customer_name=${encodeURIComponent(customerName || "Customer")}`
    });
});

app.post("/api/payment/create-checkout-order", async (req, res) => {
    try {
        if (!cashfreeAppId || !cashfreeSecretKey) {
            return res.status(500).json({ error: "Cashfree is not configured on the server." });
        }

        const customerName = sanitizeText(req.body.name, 80);
        const customerEmail = sanitizeText(req.body.email, 180);
        const customerPhone = sanitizePhone(req.body.phone);
        const company = "Cognix AI";
        const preferredMethod = sanitizeText(req.body.method, 24);
        const planId = sanitizeText(req.body.planId, 24) || "monthly";
        const planLabel = sanitizeText(req.body.planLabel, 24) || "Monthly";
        const amount = Number(req.body.amount || 0);

        if (!customerName || !customerEmail || !customerPhone) {
            return res.status(400).json({ error: "name, email, and phone are required." });
        }

        if (customerPhone.length < 10) {
            return res.status(400).json({ error: "A valid phone number is required." });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: "A valid amount is required." });
        }

        const orderId = createOrderId();

        const order = await callCashfree("/orders", {
            method: "POST",
            body: JSON.stringify({
                order_id: orderId,
                order_amount: amount,
                order_currency: "INR",
                customer_details: {
                    customer_id: `cust_${Date.now()}`,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone
                },
                order_meta: {
                    return_url: `${frontendUrl}/payment-success?order_id=${orderId}`
                },
                order_note: `${planLabel} subscription for ${company}`,
                order_tags: {
                    preferred_method: mapMethodLabel(preferredMethod),
                    plan_id: planId
                }
            })
        });

        res.json({
            orderId: order.order_id,
            paymentSessionId: order.payment_session_id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Could not create checkout order." });
    }
});

app.get("/api/payment/order-status", async (req, res) => {
    try {
        if (!cashfreeAppId || !cashfreeSecretKey) {
            return res.status(500).json({ error: "Cashfree is not configured on the server." });
        }

        const orderId = sanitizeText(req.query.order_id, 120);

        if (!orderId) {
            return res.status(400).json({ error: "order_id is required." });
        }

        const order = await callCashfree(`/orders/${encodeURIComponent(orderId)}`, {
            method: "GET"
        });

        res.json({
            orderId: order.order_id,
            orderStatus: order.order_status,
            customerName: order.customer_details?.customer_name || "",
            customerEmail: order.customer_details?.customer_email || "",
            amount: formatAmountDisplay(order.order_amount),
            preferredMethod: order.order_tags?.preferred_method || ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Could not verify payment." });
    }
});




/* ---------------- GOOGLE LOGIN ENDPOINT ---------------- */

// import crypto from "crypto";
// import sendOtpMail from "./utils/sendOtpMail.js"; // adjust path if needed

app.post("/api/auth/google", async (req, res) => {

    const { code } = req.body;

    try {

        // Exchange code for access token
        const tokenRes = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                    grant_type: "authorization_code",
                }),
            }
        );

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("Google token error:", tokenData);
            return res.status(400).json({ success: false });
        }

        // Fetch Google profile
        const userRes = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const profile = await userRes.json();

        // Find or create user
        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.name,
                email: profile.email,
                password: crypto.randomBytes(16).toString("hex"),
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpId = crypto.randomBytes(12).toString("hex");

        otpStore.set(otpId, {
            otp,
            userId: user._id.toString(),
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

        // Send OTP email
        await sendOtpMail(user.email, otp);

        // Mask email for UI display
        const maskedEmail =
            user.email.slice(0, 2) +
            "***@" +
            user.email.split("@")[1];

        // Send OTP response
        res.json({
            success: true,
            requiresTwoFactor: true,
            data: {
                otpId,
                userId: user._id,
                maskedEmail,
            },
        });

    } catch (err) {

        console.error("Google OAuth error:", err);

        res.status(500).json({
            success: false,
        });

    }
});

app.get("/api/auth/google", (req, res) => {

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const googleAuthUrl =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        "&response_type=code" +
        "&scope=profile email" +
        "&access_type=offline" +
        "&prompt=consent";

    res.redirect(googleAuthUrl);

});

app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code;

    try {
        const tokenRes = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                    grant_type: "authorization_code",
                }),
            }
        );

        const tokenData = await tokenRes.json();

        const userRes = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const profile = await userRes.json();

        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.name,
                email: profile.email,
                password: "oauth-user",
            });
        }

        res.redirect(`${process.env.FRONTEND_URL}/app`);
    } catch (err) {
        res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
});
/* ---------------- GITHUB LOGIN ENDPOINT ---------------- */

app.post("/api/auth/github", async (req, res) => {
    const { code } = req.body;

    try {
        const tokenRes = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: { Accept: "application/json" },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                }),
            }
        );

        const tokenData = await tokenRes.json();

        const userRes = await fetch(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const profile = await userRes.json();

        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.login,
                email: profile.email,
                password: "oauth-user",
            });
        }

        const token = crypto.randomBytes(24).toString("hex");

        res.json({
            success: true,
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.get("/api/auth/github", (req, res) => {
    const redirectUrl =
        "https://github.com/login/oauth/authorize?" +
        new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
            scope: "read:user user:email",
        });

    res.redirect(redirectUrl);
});

app.get("/api/auth/github/callback", async (req, res) => {
    const code = req.query.code;

    try {
        const tokenRes = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                }),
            }
        );

        const tokenData = await tokenRes.json();

        const userRes = await fetch(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const profile = await userRes.json();

        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.login,
                email: profile.email,
                password: "oauth-user",
            });
        }

        res.redirect(`${process.env.FRONTEND_URL}/app`);
    } catch (err) {
        res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
});

/* ---------------- SERVER START ---------------- */

app.listen(port, "0.0.0.0", () =>
    console.log(`Server running on http://0.0.0.0:${port}`)
);


app.delete("/api/reset", async (req, res) => {
    try {

        await Incident.deleteMany({});
        await Agent1Output.deleteMany({});
        await Agent2Output.deleteMany({});
        await Agent3Output.deleteMany({});
        await Agent4Output.deleteMany({});

        res.json({ message: "Database reset successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Reset failed" });
    }
});
