import { useEffect, useState } from "react";
import { getIncidents } from "../../services/api";

import {
    AlertOctagon,
    AlertTriangle,
    ShieldCheck,
    BarChart3,
} from "lucide-react";
/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getRisk } from "../../utils/risk";

function Cards() {
    const [counts, setCounts] = useState({
        high: 0,
        medium: 0,
        low: 0,
        total: 0
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await getIncidents();
                const data = res.data;

                let high = 0;
                let medium = 0;
                let low = 0;

                data.forEach(item => {
                    const risk = getRisk(item.Type);
                    if (risk === "High") high++;
                    else if (risk === "Medium") medium++;
                    else low++;
                });

                setCounts({ high, medium, low, total: data.length });
            } catch (err) {
                console.error("Failed to load metric counts:", err);
            }
        };

        loadData();
        window.addEventListener("incidentsUpdated", loadData);
        return () => window.removeEventListener("incidentsUpdated", loadData);
    }, []);

    const navigate = useNavigate();

    const cards = [
        {
            title: "High Risk",
            value: counts.high,
            icon: AlertOctagon,
            colorClass: "text-[#E4223A]",
            bgClass: "bg-red-500/10",
            borderColor: "border-l-[#E4223A]",
            pulse: counts.high > 0
        },
        {
            title: "Medium Risk",
            value: counts.medium,
            icon: AlertTriangle,
            colorClass: "text-[#F97316]",
            bgClass: "bg-orange-500/10",
            borderColor: "border-l-[#F97316]",
        },
        {
            title: "Low Risk",
            value: counts.low,
            icon: ShieldCheck,
            colorClass: "text-[#3ABB8C]",
            bgClass: "bg-emerald-500/10",
            borderColor: "border-l-[#3ABB8C]",
        },
        {
            title: "Total Alerts",
            value: counts.total,
            icon: BarChart3,
            colorClass: "text-[#0062FF]",
            bgClass: "bg-blue-500/10",
            borderColor: "border-l-[#0062FF]",
        },
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.02)" }}
                    onClick={() => navigate("/incidents")}
                    className={`enterprise-card flex items-center justify-between border-l-4 ${card.borderColor} cursor-pointer transition-all`}
                >
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                            {card.title}
                        </h3>
                        <p className="text-3xl font-bold text-white">
                            {card.value}
                        </p>
                    </div>

                    <div className={`w-12 h-12 rounded-xl ${card.bgClass} flex items-center justify-center ${card.colorClass} relative`}>
                        {card.pulse && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                        )}
                        <card.icon size={22} />
                    </div>
                </motion.div>
            ))}
        </section>
    );
}

export default Cards;
