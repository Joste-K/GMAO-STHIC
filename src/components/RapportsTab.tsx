import React, { useState } from "react";
import { AppDatabase, GE, Task, PlanningItem, Anomalie } from "../types";
import { calcGE, recoGE, fmt, todayYMD, pd } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  selectedMonth: string;
  onSelectGE: (geId: string) => void;
}

export const RapportsTab: React.FC<Props> = ({ db, selectedMonth, onSelectGE }) => {
  const [scope, setScope] = useState("__ALL__");
  const [month, setMonth] = useState(selectedMonth || "");
  const [generated, setGenerated] = useState(false);

  // Clients
  const clients = Array.from(new Set(db.parc.map(g => g.client).filter(Boolean))).sort();

  // Filter lists based on scope and month
  const isG = scope === "__ALL__";
  const parc = isG ? db.parc : db.parc.filter(g => g.client === scope);

  const inMois = (dateStr: string | null | undefined) => {
    if (!month) return true;
    return dateStr && dateStr.slice(0, 7) === month;
  };

  const inter = (isG ? db.inter : db.inter.filter(i => i.client === scope || parc.some(g => g.id === i.ge))).filter(i => inMois(i.ddeb || i.dfin || i.dplan));
  const plan = (isG ? db.plan : db.plan.filter(p => p.client === scope)).filter(p => inMois(p.date));
  const tasks = db.taches.filter(t => (isG || t.client === scope || parc.some(g => g.id === t.ge)) && inMois(t.echeance || t.dreal));
  const anomalies = db.anomalies.filter(a => (isG || a.client === scope || parc.some(g => g.id === a.ge)) && inMois(a.echeance || a.date));

  const pannesList = parc.filter(g => g.etat === "En panne");

  let critCount = 0;
  let survCount = 0;
  let bonCount = 0;
  parc.forEach(g => {
    const r = recoGE(g, db.inter || []);
    if (r.crit) critCount++;
    else if (r.surv) survCount++;
    else bonCount++;
  });

  const pmFait = plan.filter(p => p.exec).length;
  const correctives = inter.filter(i => ["Corrective", "Curative", "Dépannage"].includes(i.type)).length;

  const order: { [key: string]: number } = { "🔴 Critique": 0, "🟠 À surveiller": 1, "🟢 Bon": 2 };
  const sortedParcRows = parc
    .map(g => ({ g, r: recoGE(g, db.inter || []), c: calcGE(g, db.inter || []) }))
    .sort((a, b) => order[a.r.health] - order[b.r.health]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const head = ["GE", "Client", "Site", "État global", "Statut vidange", "Prochaine vidange", "Batterie", "Courroie", "Pannes", "Recommandation"];
    const rows = parc.map(g => {
      const c = calcGE(g, db.inter || []);
      const r = recoGE(g, db.inter || []);
      return [g.id, g.client, g.site, r.health, c.sv, c.proch ? c.proch.toISOString().slice(0, 10) : "—", c.bs, c.cs, c.np, r.items.join(" ")];
    });

    const csvContent = "\ufeff" + [head, ...rows].map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${isG ? "GLOBAL" : scope.replace(/[^A-Za-z0-9]/g, "_")}_${month || todayYMD()}.csv`;
    link.click();
  };

  const getBadgeClass = (text: string) => {
    if (text.includes("🔴") || text.includes("Critique") || text.includes("panne") || text.includes("remplacer") || text.includes("vidanger")) return "bg-red-100 text-red-700";
    if (text.includes("🟠") || text.includes("surveiller") || text.includes("planifier") || text.includes("Bientôt") || text.includes("maintenance")) return "bg-amber-100 text-amber-700";
    if (text.includes("🟢") || text.includes("OK") || text.includes("jour") || text.includes("Opérationnel")) return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-700";
  };

  // Group old inter list by site
  const bySite: { [key: string]: typeof inter } = {};
  inter.forEach(i => {
    const k = i.site || i.client || "—";
    if (!bySite[k]) bySite[k] = [];
    bySite[k].push(i);
  });

  return (
    <div id="rapports" className="space-y-6">
      {/* Scope selection panel */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-100">
        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setGenerated(false);
          }}
          className="min-w-[240px] px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none"
        >
          <option value="__ALL__">🌍 Rapport global (tout le parc)</option>
          {clients.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setGenerated(false);
          }}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none"
          title="Mois (Laisser vide pour toute la période)"
        />
        <button
          onClick={() => setGenerated(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors"
        >
          📊 Générer le rapport
        </button>
        {generated && (
          <>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors"
            >
              🖨️ Imprimer / PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold cursor-pointer transition-colors"
            >
              ⬇️ Export CSV
            </button>
          </>
        )}
      </div>

      {/* Generated Report Content */}
      {generated ? (
        <div id="reportOut" className="bg-white rounded-xl p-8 border border-slate-100 space-y-6 shadow-sm print:shadow-none print:border-none print-target">
          <div className="border-b-3 border-b-red-600 pb-3">
            <h2 className="text-2xl font-extrabold text-blue-900 leading-tight">
              Rapport de maintenance — {isG ? "PARC GLOBAL" : scope}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase">
              STHIC &middot; Édité le {fmt(todayYMD())} {month ? `&middot; Mois : ${month}` : ""}
            </p>
          </div>

          {/* Mini KPIs inside report */}
          <div className="flex flex-wrap gap-4">
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-blue-900 font-extrabold">{parc.length}</b> GE
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-red-600 font-extrabold">{critCount}</b> Critiques
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-red-600 font-extrabold">{pannesList.length}</b> En panne
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-amber-600 font-extrabold">{survCount}</b> À surveiller
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-green-600 font-extrabold">{bonCount}</b> Bon état
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-slate-800 font-extrabold">{pmFait}/{plan.length}</b> PM Exécutées
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-slate-800 font-extrabold">{inter.length}</b> Interventions
            </span>
            <span className="bg-slate-50 px-4 py-2 rounded-lg border text-sm font-semibold text-slate-700">
              <b className="text-lg block text-slate-800 font-extrabold">{anomalies.length}</b> Anomalies
            </span>
          </div>

          {/* GEs in Panne section */}
          {pannesList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-extrabold text-blue-900 border-l-4 border-l-red-600 pl-2">
                🛑 Groupes Électrogènes actuellement EN PANNE
              </h3>
              <table className="w-full text-xs text-left border border-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                    <th className="px-3 py-2">GE</th>
                    <th className="px-3 py-2">Site</th>
                    <th className="px-3 py-2">Cause</th>
                    <th className="px-3 py-2">Actions correctives</th>
                    <th className="px-3 py-2">Recommandations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pannesList.map((g, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2.5 font-bold text-red-600">{g.id}</td>
                      <td className="px-3 py-2.5">{g.site}</td>
                      <td className="px-3 py-2.5 text-slate-600">{g.cause || "Non spécifiée"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{g.actions || "En attente"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{g.recop || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Interventions regrouped section */}
          {inter.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-md font-extrabold text-blue-900 border-l-4 border-l-blue-600 pl-2">
                🛠️ Interventions réalisées ou planifiées par Site
              </h3>
              {Object.keys(bySite).map((site, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">👤 {site}</div>
                  <table className="w-full text-xs text-left border border-slate-100">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">GE</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Technicien</th>
                        <th className="px-3 py-2">Statut</th>
                        <th className="px-3 py-2">Commentaire / Descr.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bySite[site].map((i, rIdx) => (
                        <tr key={rIdx}>
                          <td className="px-3 py-2">{fmt(i.ddeb || i.dplan)}</td>
                          <td className="px-3 py-2 font-bold text-slate-800">{i.ge || "—"}</td>
                          <td className="px-3 py-2">{i.type}</td>
                          <td className="px-3 py-2">{i.tech}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${i.dfin ? "bg-green-100 text-green-700" : (i.ddeb ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700")}`}>
                              {i.dfin ? "Terminé" : (i.ddeb ? "En cours" : "Planifié")}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600 font-medium max-w-[200px] truncate">{i.descp || i.reso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Anomalies section */}
          {anomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-extrabold text-blue-900 border-l-4 border-l-amber-500 pl-2">
                ⚠️ Anomalies détectées sur la période
              </h3>
              <table className="w-full text-xs text-left border border-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                    <th className="px-3 py-2">GE / Client / Site</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Priorité</th>
                    <th className="px-3 py-2">Échéance</th>
                    <th className="px-3 py-2">Responsable</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {anomalies.map((a, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2.5">
                        <span className="font-bold">{a.client || a.ge}</span>
                        {a.site && <span className="block text-[10px] text-slate-400 font-medium">{a.site}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 leading-normal max-w-[220px]">{a.desc}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-700">{a.prio}</td>
                      <td className="px-3 py-2.5">{fmt(a.echeance)}</td>
                      <td className="px-3 py-2.5">{a.resp || "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.statut === "Résolu" ? "bg-green-100 text-green-700" : (a.statut === "En cours" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}`}>
                          {a.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GEs list detail section */}
          <div className="space-y-3">
            <h3 className="text-md font-extrabold text-blue-900 border-l-4 border-l-purple-600 pl-2">
              📋 Recommandations & échéances par machine
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border border-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                    <th className="px-3 py-2">GE</th>
                    <th className="px-3 py-2">Site / Marque</th>
                    <th className="px-3 py-2">État global</th>
                    <th className="px-3 py-2">Vidange</th>
                    <th className="px-3 py-2">Batterie</th>
                    <th className="px-3 py-2">Courroie</th>
                    <th className="px-3 py-2">Recommandations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedParcRows.map(({ g, r, c }, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-800">{g.id}</td>
                      <td className="px-3 py-3 leading-tight">
                        <span className="font-semibold block text-slate-700">{g.site}</span>
                        <span className="text-slate-400 block">{g.marque}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(r.health)}`}>
                          {r.health}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(c.sv)}`}>
                          {c.sv}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(c.bs)}`}>
                          {c.bs}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(c.cs)}`}>
                          {c.cs}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-medium max-w-[240px] leading-relaxed">
                        {r.items.join(" ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
          <p className="text-slate-400 font-medium py-12">
            Veuillez sélectionner le périmètre (Client ou Global) et cliquer sur « Générer le rapport ».
          </p>
        </div>
      )}
    </div>
  );
};
