export function getRisk(type) {
    if (!type) return "Low";

    const normalized = type.toLowerCase();

    if (
        normalized.includes("brute") ||
        normalized.includes("ransomware") ||
        normalized.includes("malware")
    ) {
        return "High";
    }

    if (
        normalized.includes("scan") ||
        normalized.includes("login") ||
        normalized.includes("phish")
    ) {
        return "Medium";
    }

    return "Low";
}

export function getRiskStyles(risk) {
    const normalized = risk ? risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase() : "Low";
    if (normalized === "High" || normalized === "Critical") {
        return "bg-red-500/10 text-[#E4223A] border border-red-500/20";
    }

    if (normalized === "Medium") {
        return "bg-orange-500/10 text-[#F97316] border border-orange-500/20";
    }

    return "bg-emerald-500/10 text-[#3ABB8C] border border-emerald-500/20";
}
