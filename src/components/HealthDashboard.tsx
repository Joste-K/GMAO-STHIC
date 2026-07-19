import React from "react";
import { GE, Intervention } from "../types";
import { recoGE } from "../utils/calculations";
import { AlertTriangle, CheckCircle, Activity, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface HealthDashboardProps {
  parc: GE[];
  interventions: Intervention[];
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ parc, interventions }) => {
  const healthStats = parc.map(g => recoGE(g, interventions));
  
  const total = parc.length;
  const critical = healthStats.filter(s => s.crit).length;
  const warning = healthStats.filter(s => s.surv && !s.crit).length;
  const healthy = total - critical - warning;

  const stats = [
    { label: "Critique", count: critical, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { label: "À Surveiller", count: warning, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Opérationnel", count: healthy, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { label: "Total Parc", count: total, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`${stat.bg} ${stat.border} border p-4 rounded-xl shadow-sm flex items-center justify-between`}
          id={`health-stat-${idx}`}
        >
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.count}</p>
          </div>
          <div className={`p-3 rounded-full ${stat.bg.replace('50', '100')} ${stat.color}`}>
            <stat.icon size={24} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
