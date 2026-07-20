import React, { useState, useMemo } from "react";
import { AppDatabase, GE } from "../types";
import { calcGE, recoGE, calcPlan, diffDays, today, pd, fmt } from "../utils/calculations";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { motion } from "motion/react";
import { 
  Activity, ShieldAlert, AlertTriangle, CheckCircle, 
  Wrench, TrendingUp, Clock, History,
  Filter, RotateCcw, ChevronDown, Settings, ClipboardList
} from "lucide-react";

interface Props {
  db: AppDatabase;
  selectedMonth: string;
  onSelectGE: (geId: string) => void;
  onAddRootCause: (rc: RootCauseAnalysis) => void;
}

export const DashboardTab: React.FC<Props> = ({ db, selectedMonth, onSelectGE, onAddRootCause }) => {
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [whyProblem, setWhyProblem] = useState("");
  const [whys, setWhys] = useState(["", "", "", "", ""]);
  const [whyGeId, setWhyGeId] = useState("");

  const handleSaveRootCause = () => {
    if (!whyProblem || !whys[0]) {
      alert("Veuillez saisir au moins le problème et le premier 'Pourquoi'.");
      return;
    }
    onAddRootCause({
      id: "RC-" + Date.now(),
      date: todayYMD(),
      geId: whyGeId,
      anomaly: whyProblem,
      whys: whys,
      action: "Action corrective recommandée générée dans le rapport technique."
    });
    setWhyProblem("");
    setWhys(["", "", "", "", ""]);
    setWhyGeId("");
    alert("Analyse enregistrée avec succès !");
  };

  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalGE = db.parc.length;
    const operationalGE = db.parc.filter(g => (g.etat || "Opérationnel") === "Opérationnel").length;
    const dispoPercent = totalGE ? Math.round((operationalGE / totalGE) * 100) : 0;
    const enPanne = db.parc.filter(g => g.etat === "En panne").length;

    let vidangeRetard = 0;
    let vidangePlanif = 0;
    let battChanger = 0;
    let courrChanger = 0;
    let relObs = 0;
    let criticalCount = 0;
    let warningCount = 0;
    const alertsList: { g: GE; health: string; hc: string; items: string[]; isCrit: boolean }[] = [];

    db.parc.forEach(g => {
      const c = calcGE(g, db.inter || []);
      const r = recoGE(g, db.inter || []);
      if (c.sv.includes("retard") || c.sv.includes("vidanger")) vidangeRetard++;
      if (c.sv.includes("planifier")) vidangePlanif++;
      if (c.bs.includes("remplacer")) battChanger++;
      if (c.cs.includes("remplacer")) courrChanger++;
      if (c.ar.includes("obsolète")) relObs++;

      if (r.crit) {
        criticalCount++;
        alertsList.push({ g, health: r.health, hc: r.hc, items: r.items, isCrit: true });
      } else if (r.surv) {
        warningCount++;
        alertsList.push({ g, health: r.health, hc: r.hc, items: r.items, isCrit: false });
      }
    });

    const healthyCount = totalGE - criticalCount - warningCount;

    // Sort alerts: critical first
    alertsList.sort((a, b) => (b.isCrit ? 1 : 0) - (a.isCrit ? 1 : 0));

    // Planning stats
    const monthPlan = db.plan.filter(p => !selectedMonth || (p.date && p.date.startsWith(selectedMonth)));
    const pmTot = monthPlan.length;
    const pmFait = monthPlan.filter(x => x.exec).length;
    const tauxPlan = pmTot ? Math.round((pmFait / pmTot) * 100) : 0;

    // Maintenance Type Distribution (Preventive vs Corrective)
    const monthInter = db.inter.filter(i => !selectedMonth || (i.ddeb && i.ddeb.startsWith(selectedMonth)));
    const prevCount = monthInter.filter(i => i.type === "Préventive").length;
    const corrCount = monthInter.filter(i => i.type === "Corrective").length;
    const otherCount = monthInter.length - prevCount - corrCount;

    // MTTR calculation (Mean Time To Repair)
    const correctiveDone = monthInter.filter(i => i.type === "Corrective" && i.dfin);
    let totalRepairTimeHours = 0;
    correctiveDone.forEach(i => {
      const d1 = new Date(i.ddeb);
      const d2 = new Date(i.dfin!);
      const diffHours = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600));
      totalRepairTimeHours += Math.max(1, diffHours);
    });
    
    const mttrHours = correctiveDone.length ? (totalRepairTimeHours / correctiveDone.length).toFixed(1) : "0";
    
    // MTBF calculation (Mean Time Between Failures)
    // Approximation: (Total Time in Month - Total Downtime) / Number of Failures
    const daysInMonth = 30; // Approximation for calculation
    const totalTimeHours = daysInMonth * 24 * totalGE;
    const mtbfHours = correctiveDone.length ? ((totalTimeHours - totalRepairTimeHours) / correctiveDone.length).toFixed(1) : "—";
    
    // Historical Availability (D = MTBF / (MTBF + MTTR))
    const mtbfNum = parseFloat(mtbfHours) || 0;
    const mttrNum = parseFloat(mttrHours) || 0;
    const historicalDispo = (mtbfNum + mttrNum) > 0 ? Math.round((mtbfNum / (mtbfNum + mttrNum)) * 100) : 0;

    // Pareto Data: Failures by Client
    const failureByClient: Record<string, number> = {};
    correctiveDone.forEach(i => {
      failureByClient[i.client] = (failureByClient[i.client] || 0) + 1;
    });
    const paretoData = Object.entries(failureByClient)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalGE,
      operationalGE,
      dispoPercent,
      enPanne,
      vidangeRetard,
      vidangePlanif,
      battChanger,
      courrChanger,
      relObs,
      criticalCount,
      warningCount,
      healthyCount,
      alertsList,
      pmTot,
      pmFait,
      tauxPlan,
      prevCount,
      corrCount,
      otherCount,
      mttrHours,
      mtbfHours,
      historicalDispo,
      paretoData
    };
  }, [db.parc, db.inter, db.plan]);

  // Tech list
  const techList = useMemo(() => Array.from(
    new Set([
      ...(db.plan || []).map(p => p.tech).filter(Boolean),
      ...(db.taches || []).map(t => t.assigne).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b)), [db.plan, db.taches]);

  // Chart Data
  const healthData = [
    { name: "Opérationnel", value: stats.healthyCount, color: "#16a34a" },
    { name: "À Surveiller", value: stats.warningCount, color: "#d97706" },
    { name: "Critique", value: stats.criticalCount, color: "#dc2626" },
  ];

  const maintenanceTypeData = [
    { name: "Préventive", value: stats.prevCount },
    { name: "Corrective", value: stats.corrCount },
    { name: "Autre", value: stats.otherCount },
  ];

  const COLORS = ["#16a34a", "#d97706", "#dc2626"];

  const objectives = [
    { name: "Disponibilité du parc", target: "≥ 95 %", current: `${stats.dispoPercent} %`, status: stats.dispoPercent >= 95 ? "ok" : (stats.dispoPercent >= 90 ? "warn" : "bad") },
    { name: "Taux réalisation PM", target: "≥ 90 %", current: `${stats.tauxPlan} %`, status: stats.tauxPlan >= 90 ? "ok" : (stats.tauxPlan >= 70 ? "warn" : "bad") },
    { name: "GE en panne", target: "0", current: `${stats.enPanne}`, status: stats.enPanne === 0 ? "ok" : "bad" },
    { name: "Vidanges retard", target: "0", current: `${stats.vidangeRetard}`, status: stats.vidangeRetard === 0 ? "ok" : (stats.vidangeRetard <= 3 ? "warn" : "bad") },
  ];

  const objBadge = (status: string) => {
    if (status === "ok") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">CONFORME</span>;
    if (status === "warn") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">LIMITE</span>;
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">CRITIQUE</span>;
  };

  const techItems = selectedTech ? (() => {
    const list: any[] = [];
    (db.plan || []).forEach(p => {
      if ((p.tech || "").trim() === selectedTech) {
        const isArr = p.ge && db.parc.find(x => x.id === p.ge)?.etat === "Arrêt contrat de maintenance";
        const cPlan = calcPlan(p, today());
        list.push({ id: p.ge || "—", nat: "PM", client: p.client, site: p.site, date: p.date, statut: isArr ? "⏸️ En arrêt" : cPlan.s, k: isArr ? "arret" : cPlan.k, titre: "Maintenance préventive" });
      }
    });
    (db.taches || []).forEach(t => {
      if ((t.assigne || "").trim() === selectedTech) {
        let k = "prevu";
        if (t.statut === "Terminé") k = "fait";
        else if (t.echeance && pd(t.echeance) && pd(t.echeance)! < today()) k = "retard";
        list.push({ id: t.ge || "BT", nat: "BT", client: t.client, site: t.site, date: t.echeance, statut: t.statut, k, titre: t.titre || t.type });
      }
    });
    return list.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  })() : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Global Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <Filter size={20} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tableau de Bord</h2>
              <p className="text-xs text-slate-500 font-medium italic">Analyse des Performance (Pareto, MTBF, MTTR, 5 Whys)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Status Global</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] font-black text-slate-700">OPTIMISÉ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Tous les techniciens</option>
            {techList.map((tech, i) => <option key={i} value={tech}>{tech}</option>)}
          </select>
          {selectedTech && (
            <button onClick={() => setSelectedTech("")} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {selectedTech ? (
        <TechPanel tech={selectedTech} items={techItems} />
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIItem label="Disponibilité" value={`${stats.historicalDispo}%`} icon={TrendingUp} color="green" />
            <KPIItem label="MTBF Moyen" value={`${stats.mtbfHours} h`} icon={Activity} color="blue" />
            <KPIItem label="MTTR Moyen" value={`${stats.mttrHours} h`} icon={Clock} color="amber" />
            <KPIItem label="GE en Panne" value={stats.enPanne} icon={ShieldAlert} color="red" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <BarChart size={16} className="text-red-600" />
                Analyse de Pareto (Top 10 Clients - Pannes)
              </h3>
              <div className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
                <p className="text-[10px] text-red-800 leading-tight">
                  <span className="font-black">Loi de Pareto (80/20) :</span> 80% des pannes proviennent de 20% des causes. Concentrez vos efforts sur le top 3 ci-dessous pour maximiser la disponibilité de votre parc.
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.paretoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} tick={{fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Maintenance Types Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Wrench size={16} className="text-blue-600" />
                Répartition des Interventions
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceTypeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5 Whys Analysis Tool */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList size={16} className="text-indigo-600" />
                  Méthode des 5 Pourquoi (Analyse Root Cause)
                </h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">GE Concerné</label>
                    <select 
                      value={whyGeId}
                      onChange={(e) => setWhyGeId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-black outline-none"
                    >
                      <option value="">— Aucun —</option>
                      {db.parc.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Problème constaté</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Groupe s'arrête après 5 min" 
                      value={whyProblem}
                      onChange={(e) => setWhyProblem(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">{num}</div>
                    <input 
                      type="text" 
                      placeholder={`Pourquoi ? (Cause ${num})`} 
                      value={whys[num-1]}
                      onChange={(e) => {
                        const next = [...whys];
                        next[num-1] = e.target.value;
                        setWhys(next);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <button onClick={handleSaveRootCause} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                    <CheckCircle size={14} /> VALIDER L'ANALYSE ET GÉNÉRER L'ACTION
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 italic">Cette méthode permet de remonter à la cause profonde pour éviter la récurrence de la panne.</p>
            </div>

            {/* Health Distribution Chart (Small) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                Santé du Parc & Unités Critiques
              </h3>
              <div className="flex items-center gap-6">
                <div className="h-40 w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1">
                  {healthData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">{d.name}</span>
                      <span className="text-slate-900 px-2 py-0.5 rounded bg-slate-100" style={{color: d.color}}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                Objectifs de Performance (KPIs)
              </h3>
              <div className="space-y-3">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{obj.name}</p>
                      <p className="text-[10px] text-slate-400">Cible: {obj.target}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{obj.current}</p>
                      {objBadge(obj.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Units */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-600" />
                Unités Critiques Prioritaires
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.alertsList.length > 0 ? (
                  stats.alertsList.slice(0, 8).map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => onSelectGE(item.g.id)}
                      className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-red-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.isCrit ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.g.id} — {item.g.client}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{item.items[0]}</p>
                        </div>
                      </div>
                      <ChevronDown size={14} className="-rotate-90 text-slate-300" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                    <p className="text-xs text-slate-500 font-medium">Toutes les unités sont opérationnelles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KPIItem = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 rounded-2xl shadow-sm border ${colorClasses[color]} border-l-4 flex items-center justify-between`}
    >
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
      <div className={`p-3 rounded-2xl ${colorClasses[color]} bg-opacity-50`}>
        <Icon size={24} />
      </div>
    </motion.div>
  );
};

const TechPanel = ({ tech, items }: { tech: string; items: any[] }) => {
  const stats = {
    total: items.length,
    done: items.filter(i => i.k === "fait" || i.k === "avance" || i.k === "retard_fait").length,
    pending: items.filter(i => i.k === "prevu" || i.k === "retard").length,
    late: items.filter(i => i.k === "retard").length,
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nature", "Client", "Site", "Date", "Titre", "Statut"];
    const rows = items.map(i => [
      i.id,
      i.nat,
      `"${i.client}"`,
      `"${i.site || ''}"`,
      i.date,
      `"${i.titre}"`,
      i.statut
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `planning_${tech.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Tech Mini KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem label="Total Assigné" value={stats.total} icon={ClipboardList} color="indigo" />
        <KPIItem label="Réalisé" value={stats.done} icon={CheckCircle} color="green" />
        <KPIItem label="En Attente" value={stats.pending} icon={Clock} color="amber" />
        <KPIItem label="En Retard" value={stats.late} icon={History} color="red" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800">📋 Missions assignées à {tech}</h3>
            <p className="text-[10px] text-slate-400 font-medium">Liste des interventions et tâches planifiées</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <TrendingUp size={14} /> Exporter CSV
            </button>
            <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">{items.length} tâches</span>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black bg-white px-2 py-1 rounded border border-slate-200">{item.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.nat === 'PM' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    {item.nat}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.client}</p>
                <p className="text-[11px] text-slate-500 mb-3">{item.site}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-3">
                  <Settings size={12} /> {item.titre}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">📅 {fmt(item.date)}</span>
                  <span className={`text-[10px] font-bold ${item.k === 'fait' || item.k === 'avance' ? 'text-green-600' : item.k === 'retard' ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium">Aucune tâche active pour ce technicien</p>
          </div>
        )}
      </div>

      {/* Methodology Footer Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Info size={24} className="text-blue-400" />
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Méthodologie de Performance GMAO-STHIC</h3>
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Guide technique pour la prise de décision</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-blue-400 font-black text-xs uppercase tracking-wider">01. Loi de Pareto (80/20)</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-white font-bold">Formule :</span> Analyse ABC des pannes.<br/>
                80% des arrêts sont dus à 20% des causes. L'objectif est d'identifier les "Quelques Vitales" pour maximiser l'impact de la maintenance.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-indigo-400 font-black text-xs uppercase tracking-wider">02. Méthode des 5 Pourquoi</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-white font-bold">Approche :</span> Analyse de la cause racine.<br/>
                On ne s'arrête pas au symptôme. On remonte jusqu'à la cause primaire (ex: radiateur non soufflé).
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-amber-400 font-black text-xs uppercase tracking-wider">03. MTBF (Fiabilité)</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-white font-bold">Formule :</span> Temps de marche total / Nb de pannes.<br/>
                Indique la fiabilité des machines. Plus le MTBF est élevé, plus la machine est robuste.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-green-400 font-black text-xs uppercase tracking-wider">04. MTTR (Maintenabilité)</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-white font-bold">Formule :</span> Temps total de réparation / Nb de pannes.<br/>
                Indique la rapidité d'intervention. Doit être le plus bas possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
