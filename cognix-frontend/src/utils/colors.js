export function getIPStyle(ip) {
    if (!ip || ip === "—") return { color: "var(--t3)", fontFamily: "var(--mono)" };
    const isInternal = ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("127.0.0.");
    return {
        color: isInternal ? "#58d59b" : "#ff8a3d", // Green for internal, orange/red for external
        fontFamily: "var(--mono)",
        fontSize: "12px",
        fontWeight: isInternal ? 500 : 600,
        textShadow: isInternal ? "none" : "0 0 12px rgba(255, 138, 61, 0.15)"
    };
}

export function getProtocolStyle(protocol) {
    if (!protocol) return {};
    const norm = protocol.toUpperCase();
    let color = "#fff";
    if (norm === "TCP") color = "#3b82f6"; // Blue
    else if (norm === "UDP") color = "#ffd27d"; // Yellow/Gold
    else if (norm === "ICMP") color = "#8b5cf6"; // Purple
    else if (["SSH", "FTP", "SFTP", "TELNET", "22", "21", "23"].includes(norm)) color = "#ff6565"; // Red
    else if (["HTTP", "HTTPS", "SSL", "80", "443"].includes(norm)) color = "#06b6d4"; // Cyan
    
    return {
        color,
        fontWeight: 600,
        fontFamily: "var(--mono)",
        fontSize: "11px",
        letterSpacing: "0.05em"
    };
}

export function getAttackTypeStyle(type) {
    if (!type || type === "Unknown" || type === "Unknown incident") return { color: "var(--t3)" };
    const norm = type.toLowerCase();
    let color = "#fff";
    if (norm.includes("benign") || norm.includes("normal") || norm.includes("safe")) {
        color = "#58d59b"; // Green
    } else if (
        norm.includes("scan") || 
        norm.includes("recon") || 
        norm.includes("login") || 
        norm.includes("phish") ||
        norm.includes("brute")
    ) {
        color = "#ffd27d"; // Amber
    } else {
        color = "#ff6565"; // Red for high risk attacks (Bot, malware, DDoS, Injection)
    }
    
    return {
        color,
        fontWeight: 600
    };
}

export function getRouteStyle(route) {
    if (!route) return {};
    const norm = route.toUpperCase();
    let color = "var(--t3)";
    if (["BLOCK", "ESCALATE", "BLOCKING", "ESCALATING", "INVESTIGATING", "INVESTIGATE"].includes(norm)) {
        color = "#ff6565";
    } else if (["MONITOR", "ALERT", "MONITORING", "ALERTING"].includes(norm)) {
        color = "#ffd27d";
    } else if (["AUTO-CLOSE", "CONTAINED", "CLOSE", "AUTO_CLOSE"].includes(norm)) {
        color = "#58d59b";
    }
    
    return {
        color,
        fontWeight: 700,
        letterSpacing: "0.05em"
    };
}
