import { PythonShell } from "python-shell";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

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
const port = Number(process.env.PORT || 5050);



const cashfreeEnv = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const cashfreeApiBase =
    cashfreeEnv === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
const cashfreeApiVersion = process.env.CASHFREE_API_VERSION || "2025-01-01";
const cashfreeAppId = process.env.CASHFREE_APP_ID || "";
const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || "";
const paymentDemoMode = process.env.DEMO_MODE !== "false";

app.use(cors());
app.use(express.json());

/* ---------------- DATABASE CONNECTION ---------------- */

mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));


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


async function runAgentsPipeline() {
    try {
        console.log("Running agents pipeline...");

        const unprocessedIncidents = await Incident.find({ processed: false });

        for (const incident of unprocessedIncidents) {
            console.log("Processing incident:", incident._id);

            if (incident.processed) continue;

            // Agent 1 output
            await Agent1Output.create({
                incidentId: incident._id,

                Source_IP: incident.Source_IP || null,
                Destination_IP: incident.Destination_IP || null,
                Port: incident.Port || null,
                Request_Type: incident.Request_Type || null,
                Protocol: incident.Protocol || null,
                Payload_Size: incident.Payload_Size || null,
                User_Agent: incident.User_Agent || null,
                Status: incident.Status || null,
                Intrusion: incident.Intrusion || null,
                Scan_Type: incident.Scan_Type || null,

                agent1_label:
                    incident.Scan_Type === "Normal"
                        ? "Normal Traffic"
                        : incident.Scan_Type === "BotAttack"
                            ? "Bot Activity"
                            : incident.Scan_Type === "Recon"
                                ? "Recon Activity"
                                : incident.Scan_Type === "Intrusion"
                                    ? "Intrusion Attempt"
                                    : incident.Scan_Type === "BruteForce"
                                        ? "Brute Force Attack"
                                        : incident.Scan_Type === "PortScan"
                                            ? "Port Scan"
                                            : "Unknown Activity",
                processedAt: new Date()
            });

            console.log("Agent-1 done");


            // // Agent 2 output
            await Agent2Output.create({
                incidentId: incident._id,

                Source_IP: incident.Source_IP,
                Destination_IP: incident.Destination_IP,
                Protocol: incident.Protocol,
                Scan_Type: incident.Scan_Type,

                is_internal_ip:
                    (incident.Source_IP || "").startsWith("192.168") ||
                        (incident.Source_IP || "").startsWith("10.")
                        ? "Yes"
                        : "No",

                port_category:
                    incident.Port === "80" || incident.Port === "443"
                        ? "Web"
                        : incident.Port === "25"
                            ? "Email"
                            : incident.Port === "22"
                                ? "SSH"
                                : incident.Port === "3389"
                                    ? "RDP"
                                    : incident.Port === "53"
                                        ? "DNS"
                                        : "Other",

                protocol_risk:
                    incident.Protocol === "FTP" ||
                        incident.Protocol === "Telnet"
                        ? "High"
                        : incident.Protocol === "UDP"
                            ? "Medium"
                            : ["HTTP", "HTTPS", "TCP"].includes(incident.Protocol)
                                ? "Low"
                                : "Unknown",

                asset_value:
                    (incident.Destination_IP || "").startsWith("192.168.1") ||
                        (incident.Destination_IP || "").startsWith("10.0")
                        ? "High"
                        : (incident.Destination_IP || "").startsWith("172.16")
                            ? "Medium"
                            : "Low",

                geo_anomaly:
                    !(incident.Source_IP || "").startsWith("192.168"),

                processedAt: new Date()
            });

            // // Agent 3 output
            // // fetch Agent-2 output for this incident
            const agent2 = await Agent2Output.findOne({
                incidentId: incident._id
            });

            let risk_level = "Low";

            if (incident.Intrusion === "1") {
                risk_level = "Critical";
            }
            else if (incident.Scan_Type !== "Normal") {
                risk_level = "High";
            }
            else if (agent2?.geo_anomaly === true) {
                risk_level = "Medium";
            }

            await Agent3Output.create({
                incidentId: incident._id,
                asset_value: agent2?.asset_value || "Unknown",
                geo_anomaly: agent2?.geo_anomaly || false,
                risk_level: risk_level,
                processedAt: new Date()
            });

            // Agent 4 output
            // fetch Agent-2 output

            // fetch Agent - 1 output
            const agent1 = await Agent1Output.findOne({
                incidentId: incident._id
            });

            // prepare model features
            const features = {
                Alert_Type: agent1?.agent1_label || "Unknown",
                is_internal_ip: agent2?.is_internal_ip || "Yes",
                port_category: agent2?.port_category || "Other",
                protocol_risk: agent2?.protocol_risk || "Low",
                asset_value: agent2?.asset_value || "Low",
                geo_anomaly: agent2?.geo_anomaly ? "Yes" : "No"
            };

            // call Python model
            let prediction = 0;
            let confidence = 0;
            let result = { prediction: 0, confidence: 0 };

            try {

                result = await new Promise((resolve) => {

                    let finalOutput = null;

                    const pyshell = new PythonShell("predict_agent4.py", {
                        pythonPath: "python3",
                        scriptPath: "./"
                    });

                    pyshell.send(JSON.stringify(features));

                    pyshell.on("message", (message) => {

                        console.log("Python raw output:", message);

                        if (message.includes(",")) {
                            finalOutput = message;
                        }

                    });

                    pyshell.end((err) => {

                        if (err) {
                            console.log("Agent4 Python error:", err.message);
                            return resolve({ prediction: 0, confidence: 0 });
                        }

                        if (!finalOutput) {
                            console.log("Agent4 empty output");
                            return resolve({ prediction: 0, confidence: 0 });
                        }

                        const parts = finalOutput.split(",");

                        resolve({
                            prediction: parseInt(parts[0].trim()),
                            confidence: parseFloat(parts[1].trim())
                        });

                    });

                });

                prediction = result.prediction ?? 0;
                confidence = result.confidence ?? 0;

                console.log("Agent4 prediction:", prediction);
                console.log("Agent4 confidence:", confidence);


            } catch (err) {
                console.log("Agent4 fallback triggered:", err.message);
            }

            // map prediction → decision
            let decision = "Auto-Close";
            let reason = "Low-risk activity";

            if (prediction === 1) {
                decision = "Escalate";
                reason = "High-risk activity detected by ML model";
            }

            await Agent4Output.create({
                incidentId: incident._id,
                prediction,
                confidence,
                decision,
                reason,
                processedAt: new Date()
            });

            // mark incident processed
            await Incident.findByIdAndUpdate(
                incident._id,
                { processed: true }
            );
        }

        console.log("Pipeline completed successfully");

    } catch (err) {
        console.error("Pipeline error:", err);
    }
}


/* ---------------- INCIDENT ROUTES ---------------- */

// Save uploaded CSV rows
app.post("/api/incidents", async (req, res) => {
    try {
        const { data } = req.body;

        // const inserted = await Incident.insertMany(data);

        // remove duplicates before insertion
        const newRecords = [];

        for (const row of data) {
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

        // insert only unique records
        const inserted = await Incident.insertMany(newRecords);

        // automatically run agents pipeline in background
        runAgentsPipeline();

        res.json({
            message: "Incidents saved successfully",
            count: inserted.length,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all incidents
app.get("/api/incidents", async (req, res) => {
    try {
        const incidents = await Incident.find();

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

        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            isNewUser: false,
            message: "Login successful",
            user
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Login failed"
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

app.post("/api/auth/google", async (req, res) => {
    const { code } = req.body;

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

        res.json({ success: true, user });

    } catch (err) {
        res.status(500).json({ success: false });
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

        res.json({ success: true, user });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});



/* ---------------- SERVER START ---------------- */

app.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`)
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
