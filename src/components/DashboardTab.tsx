import React, { useState } from "react";
import { AppDatabase, GE } from "../types";
import { calcGE, recoGE, calcPlan, diffDays, today, pd, fmt } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onSelectGE: (geId: string) => void;
}

export const DashboardTab: React.FC<Props> = ({ db, onSelectGE }) => {
  const [selectedTech, setSelectedTech] = useState<string>("");

  // Get unique tech list
  const techList = Array.from(
    new Set([
      ...(db.plan || []).map(p => p.tech).filter(Boolean),
      ...(db.taches || []).map(t => t.assigne).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b));

  const totalGE = db.parc.length;
  const operationalGE = db.parc.filter(g => (g.etat || "Opérationnel") === "Opérationnel").length;
  const dispoPercent = totalGE ? Math.round((operationalGE / totalGE) * 100) : 0;
  const enPanne = db.parc.filter(g => g.etat === "En panne").length;

  // Data completeness: GE has kVA, dvid or hvid, dbatt, dcourr
  const completeGE = db.parc.filter(g => g.kva && (g.dvid || g.hvid) && g.dbatt && g.dcourr).length;
  const completudePercent = totalGE ? Math.round((completeGE / totalGE) * 100) : 0;

  // Planning stats
  const pmTot = db.plan.length;
  const pmFait = db.plan.filter(x => x.exec).length;
  const tauxPlan = pmTot ? Math.round((pmFait / pmTot) * 100) : 0;

  // Alerts & Critical machines
  let vidangeRetard = 0;
  let vidangePlanif = 0;
  let battChanger = 0;
  let courrChanger = 0;
  let relObs = 0;
  let criticalCount = 0;
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
      alertsList.push({ g, health: r.health, hc: r.hc, items: r.items, isCrit: false });
    }
  });

  // Sort alerts: critical first
  alertsList.sort((a, b) => (b.isCrit ? 1 : 0) - (a.isCrit ? 1 : 0));

  // Interventions
  const totalBT = db.taches.length;
  const termBT = db.taches.filter(t => t.statut === "Terminé").length;
  const activeBT = db.taches.filter(t => t.statut !== "Terminé").length;

  const anoOuv = db.anomalies.filter(a => a.statut !== "Résolu").length;
  const anoClo = db.anomalies.filter(a => a.statut === "Résolu").length;

  // Sizing standard recommendations and objectives
  const objectives = [
    { name: "Disponibilité du parc", target: "≥ 95 %", current: `${dispoPercent} %`, status: dispoPercent >= 95 ? "ok" : (dispoPercent >= 90 ? "warn" : "bad") },
    { name: "Complétude des données (KVA, Vidange, Batterie, Courroie)", target: "≥ 90 %", current: `${completudePercent} %`, status: completudePercent >= 90 ? "ok" : (completudePercent >= 60 ? "warn" : "bad") },
    { name: "Taux de réalisation du planning PM", target: "≥ 90 %", current: `${tauxPlan} %`, status: tauxPlan >= 90 ? "ok" : (tauxPlan >= 70 ? "warn" : "bad") },
    { name: "GE en panne", target: "0", current: `${enPanne}`, status: enPanne === 0 ? "ok" : "bad" },
    { name: "Vidanges en retard", target: "0", current: `${vidangeRetard}`, status: vidangeRetard === 0 ? "ok" : (vidangeRetard <= 3 ? "warn" : "bad") },
    { name: "Anomalies ouvertes", target: "0", current: `${anoOuv}`, status: anoOuv === 0 ? "ok" : (anoOuv <= 3 ? "warn" : "bad") }
  ];

  const objBadge = (status: string) => {
    if (status === "ok") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✅ Atteint</span>;
    if (status === "warn") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🟠 À surveiller</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 Non atteint</span>;
  };

  // Tech assignment filter items
  const techItems = selectedTech ? (() => {
    const list: any[] = [];
    (db.plan || []).forEach(p => {
      if ((p.tech || "").trim() === selectedTech) {
        const isArr = p.ge && db.parc.find(x => x.id === p.ge)?.etat === "Arrêt contrat de maintenance";
        const cPlan = calcPlan(p, today());
        list.push({
          id: p.ge || "—",
          nat: "PM",
          client: p.client,
          site: p.site,
          date: p.date,
          statut: isArr ? "⏸️ En arrêt" : cPlan.s,
          k: isArr ? "arret" : cPlan.k,
          titre: "Maintenance préventive"
        });
      }
    });

    (db.taches || []).forEach(t => {
      if ((t.assigne || "").trim() === selectedTech) {
        let k = "prevu";
        if (t.statut === "Terminé") k = "fait";
        else if (t.echeance && pd(t.echeance) && pd(t.echeance)! < today()) k = "retard";

        list.push({
          id: t.ge || "BT",
          nat: "BT",
          client: t.client,
          site: t.site,
          date: t.echeance,
          statut: t.statut,
          k,
          titre: t.titre || t.type
        });
      }
    });

    list.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    return list;
  })() : [];

  const getTechCardColorClass = (k: string) => {
    if (k === "fait" || k === "avance") return "border-l-green-600";
    if (k === "retard_fait" || k === "retard") return "border-l-red-600";
    if (k === "prevu") return "border-l-sky-600";
    return "border-l-slate-400";
  };

  const getTechTagColor = (k: string) => {
    if (k === "PM") return "bg-blue-600 text-white";
    return "bg-indigo-600 text-white";
  };

  const getTechStatutClass = (k: string) => {
    if (k === "fait" || k === "avance") return "text-green-600 font-bold";
    if (k === "retard" || k === "retard_fait") return "text-red-600 font-bold";
    return "text-amber-600 font-bold";
  };

  return (
    <div id="dash" className="space-y-6">
      {/* Filter Tech */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-xs border-l-5 border-l-blue-600">
        <label htmlFor="dashTech" className="font-bold text-blue-900 text-sm">
          👷 Filtrer par Technicien :
        </label>
        <select
          id="dashTech"
          value={selectedTech}
          onChange={(e) => setSelectedTech(e.target.value)}
          className="flex-1 min-w-[200px] max-w-[340px] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-blue-500"
        >
          <option value="">Tous les techniciens</option>
          {techList.map((tech, i) => (
            <option key={i} value={tech}>
              {tech}
            </option>
          ))}
        </select>
        {selectedTech && (
          <button
            onClick={() => setSelectedTech("")}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
          >
            ↺ Réinitialiser
          </button>
        )}
      </div>

      {/* Tech Isolated Panel */}
      {selectedTech ? (
        <div className="space-y-6">
          {/* Tech KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-slate-700">
              <div className="text-2xl font-extrabold text-slate-800">{techItems.length}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Assignés</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-600">
              <div className="text-2xl font-extrabold text-blue-600">
                {new Set(techItems.map(i => i.site).filter(Boolean)).size}
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Sites couverts</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
              <div className="text-2xl font-extrabold text-green-600">
                {techItems.filter(i => i.k === "fait" || i.k === "avance" || i.k === "retard_fait").length}
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Faites</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-amber-600">
              <div className="text-2xl font-extrabold text-amber-600">
                {techItems.filter(i => i.k === "prevu" || i.k === "retard").length}
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">À faire</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
              <div className="text-2xl font-extrabold text-red-600">
                {techItems.filter(i => i.k === "retard").length}
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">En retard</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-indigo-600">
              <div className="text-2xl font-extrabold text-indigo-600">
                {techItems.filter(i => i.k === "fait" || i.k === "avance" || i.k === "retard_fait").length
                  ? Math.round(
                      (techItems.filter(i => i.k === "fait" || i.k === "avance").length * 100) /
                        techItems.filter(i => i.k === "fait" || i.k === "avance" || i.k === "retard_fait").length
                    )
                  : 0}
                %
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Ponctualité</div>
            </div>
          </div>

          <div className="border-l-4 border-l-red-600 pl-3">
            <h3 className="text-lg font-bold text-slate-800">
              🗂️ Maintenances de {selectedTech}
            </h3>
          </div>

          {techItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {techItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl p-4 shadow-xs border-l-5 ${getTechCardColorClass(
                    item.k
                  )} flex flex-col justify-between space-y-2`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-blue-900 text-md">{item.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTechTagColor(item.nat)}`}>
                      {item.nat}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 line-clamp-1">{item.client}</div>
                  {item.site && <div className="text-xs text-slate-500 line-clamp-1">{item.site}</div>}
                  <div className="text-xs text-slate-500 font-medium">📋 {item.titre}</div>
                  <div className="text-xs font-semibold text-slate-600">📅 {fmt(item.date)}</div>
                  <div className={`text-xs ${getTechStatutClass(item.k)}`}>{item.statut}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-sky-50 text-blue-950 p-4 rounded-xl text-sm border-l-4 border-l-sky-600">
              Aucune maintenance ou tâche n'est assignée à {selectedTech}.
            </div>
          )}
        </div>
      ) : (
        /* Default dashboard KPIs */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-900">
              <div className="text-2xl font-extrabold text-blue-900">{totalGE}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">GE au parc</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
              <div className="text-2xl font-extrabold text-green-600">{dispoPercent}%</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Disponibilité</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
              <div className="text-2xl font-extrabold text-red-600">{enPanne}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">GE en panne</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-amber-600">
              <div className="text-2xl font-extrabold text-amber-600">{criticalCount}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">GE critiques</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-sky-500">
              <div className="text-2xl font-extrabold text-sky-600">{termBT}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Tâches Clôturées</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-indigo-500">
              <div className="text-2xl font-extrabold text-indigo-500">{activeBT}</div>
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Tâches Actives</div>
            </div>
          </div>

          {/* Sizing additional sub stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-3 shadow-xs border-l-4 border-l-amber-500">
              <div className="text-xl font-bold text-slate-800">{vidangeRetard}</div>
              <div className="text-[11px] uppercase text-slate-500 font-semibold">Vidanges en retard</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-xs border-l-4 border-l-amber-400">
              <div className="text-xl font-bold text-slate-800">{battChanger + courrChanger}</div>
              <div className="text-[11px] uppercase text-slate-500 font-semibold">Consommables arrivés à échéance</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-xs border-l-4 border-l-blue-400">
              <div className="text-xl font-bold text-slate-800">{anoOuv} / {anoClo}</div>
              <div className="text-[11px] uppercase text-slate-500 font-semibold">Anomalies Ouvertes/Résolues</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-xs border-l-4 border-l-green-400">
              <div className="text-xl font-bold text-slate-800">{tauxPlan}%</div>
              <div className="text-[11px] uppercase text-slate-500 font-semibold">Taux réalisation Planning</div>
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <div className="border-l-4 border-l-red-600 pl-3">
              <h3 className="text-lg font-bold text-slate-800">
                🎯 Objectifs de maintenance
              </h3>
            </div>
            <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className="px-4 py-3 text-left font-semibold">Indicateur</th>
                      <th className="px-4 py-3 text-left font-semibold">Cible</th>
                      <th className="px-4 py-3 text-left font-semibold">Actuel</th>
                      <th className="px-4 py-3 text-left font-semibold">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {objectives.map((obj, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{obj.name}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{obj.target}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{obj.current}</td>
                        <td className="px-4 py-3">{objBadge(obj.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Priority Alert Machines */}
          <div className="space-y-3">
            <div className="border-l-4 border-l-red-600 pl-3">
              <h3 className="text-lg font-bold text-slate-800">
                🚨 Machines à traiter en priorité
              </h3>
            </div>
            <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className="px-4 py-3 text-left font-semibold">GE</th>
                      <th className="px-4 py-3 text-left font-semibold">Client / Site</th>
                      <th className="px-4 py-3 text-left font-semibold">État</th>
                      <th className="px-4 py-3 text-left font-semibold">Recommandation principale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertsList.length > 0 ? (
                      alertsList.slice(0, 15).map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => onSelectGE(item.g.id)}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-blue-900">{item.g.id}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.g.client}
                            <span className="block text-xs text-slate-400 font-medium">{item.g.site}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                item.health.includes("Critique")
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.health}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed font-medium">
                            {item.items[0]}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium">
                          Aucun groupe électrogène ne nécessite d'alerte pour l'instant. 🟢
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
