import React, { useState } from "react";
import { AppDatabase, Materiel } from "../types";
import { today, todayYMD, pd } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onAddMateriel: () => void;
  onUpdateMateriel: (idx: number, updated: Partial<Materiel>) => void;
  onDeleteMateriel: (idx: number) => void;
  onImportParcStock: () => void;
}

export const StockTab: React.FC<Props> = ({
  db,
  onAddMateriel,
  onUpdateMateriel,
  onDeleteMateriel,
  onImportParcStock
}) => {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [filtDispo, setFiltDispo] = useState("");

  const CATS = ["Groupe électrogène", "Outillage", "Véhicule", "Pompe", "Autre"];
  const ETATS = ["Neuf", "Bon", "Moyen", "À réviser", "HS"];
  const DISPOS = ["En stock", "Déployé", "En réparation", "Réformé"];

  // Helper: late days
  const getLateDays = (m: Materiel) => {
    if (m.dispo !== "Déployé" || !m.retour) return 0;
    const d = pd(m.retour);
    if (!d) return 0;
    const t = today();
    if (d >= t) return 0;
    return Math.round((t.getTime() - d.getTime()) / 86400000);
  };

  // Helper: Net Book Value
  const getNetValue = (m: Materiel) => {
    const v = parseFloat(String(m.valeur || 0)) || 0;
    if (!v) return 0;
    const an = parseInt(String(m.annee || 0)) || 0;
    if (!an) return Math.round(v);
    const age = new Date().getFullYear() - an;
    const net = v * Math.max(0, 1 - age / 10);
    return Math.round(net);
  };

  // Filter lists
  const filtered = db.materiel
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => {
      if (selectedCat && (m.cat || "") !== selectedCat) return false;
      if (filtDispo && (m.dispo || "") !== filtDispo) return false;

      const hay = `${m.code || ""} ${m.designation || ""} ${m.marque || ""} ${m.client || ""} ${m.cat || ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });

  // KPI computations
  let enStock = 0;
  let deploye = 0;
  let reparation = 0;
  let rawTotal = 0;
  let netTotal = 0;
  let lateCount = 0;

  db.materiel.forEach(m => {
    const d = m.dispo || "";
    if (d === "En stock") enStock++;
    else if (d === "Déployé") deploye++;
    else if (d === "En réparation") reparation++;

    rawTotal += parseFloat(String(m.valeur || 0)) || 0;
    netTotal += getNetValue(m);

    if (getLateDays(m) > 0) lateCount++;
  });

  const catCount = (catName: string) => {
    return db.materiel.filter(m => (m.cat || "Autre") === catName).length;
  };

  const exportCSV = () => {
    const cols: (keyof Materiel)[] = ["code", "cat", "designation", "marque", "carac", "annee", "valeur", "etat", "dispo", "client", "sortie", "retour", "heures", "obs"];
    const head = ["Code", "Categorie", "Designation", "Marque", "Caractéristiques", "Annee", "Valeur acquisition", "Etat", "Disponibilité", "Client / Dest", "Sortie", "Retour prevu", "Heures", "Observations"];

    const csvContent = "\ufeff" + [head, ...db.materiel.map(m => cols.map(c => `"${String(m[c] || "").replace(/"/g, '""')}"`))].map(r => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventaire_sthic_${todayYMD()}.csv`;
    link.click();
  };

  return (
    <div id="stock" className="space-y-6">
      <h2 className="text-xl font-extrabold text-blue-900 border-b pb-2">
        📦 Gestion du matériel &amp; stock — STHIC
      </h2>

      {/* Stock Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-slate-700">
          <div className="text-xl font-bold text-slate-800">{db.materiel.length}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Total fiches</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
          <div className="text-xl font-bold text-green-600">{enStock}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">En stock</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-600">
          <div className="text-xl font-bold text-blue-600">{deploye}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Déployé</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-amber-600">
          <div className="text-xl font-bold text-amber-600">{reparation}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">En réparat.</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
          <div className="text-xl font-bold text-red-600">{lateCount}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">En retard</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-purple-600">
          <div className="text-md font-bold text-purple-700">{rawTotal.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Valeur Brute (FCFA)</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-cyan-600">
          <div className="text-md font-bold text-cyan-700">{netTotal.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Valeur Nette (FCFA)</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar */}
        <div className="w-full lg:w-[210px] flex-shrink-0 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
            Rubriques Matériel
          </div>
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button
              onClick={() => setSelectedCat("")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex justify-between items-center ${
                selectedCat === ""
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800"
              }`}
            >
              <span>📂 Tous</span>
              <span className="bg-slate-900/10 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{db.materiel.length}</span>
            </button>
            {CATS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedCat(c)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex justify-between items-center ${
                  selectedCat === c
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <span>🛠️ {c}</span>
                <span className="bg-slate-900/10 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{catCount(c)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="🔎 Rechercher un matériel (code, désignation, client)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-lg text-xs text-black bg-white focus:outline-none focus:border-blue-500"
            />
            <select
              value={filtDispo}
              onChange={(e) => setFiltDispo(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 bg-white rounded-lg text-xs text-black focus:outline-none"
            >
              <option value="">Disponibilité : toutes</option>
              {DISPOS.map((d, i) => (
                <option key={i}>{d}</option>
              ))}
            </select>
            <button
              onClick={onAddMateriel}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              ➕ Ajouter matériel
            </button>
            <button
              onClick={onImportParcStock}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              📥 Importer les GE base STHIC
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              ⬇️ Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white font-semibold">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Catégorie</th>
                    <th className="px-3 py-2">Désignation</th>
                    <th className="px-3 py-2">Marque</th>
                    <th className="px-3 py-2">Caract.</th>
                    <th className="px-3 py-2 text-center">Année</th>
                    <th className="px-3 py-2 text-right">Acquisition (FCFA)</th>
                    <th className="px-3 py-2 text-right">Val. nette (FCFA)</th>
                    <th className="px-3 py-2">État</th>
                    <th className="px-3 py-2">Disponibilité</th>
                    <th className="px-3 py-2">Client / Dest.</th>
                    <th className="px-3 py-2">Sortie</th>
                    <th className="px-3 py-2">Retour prévu</th>
                    <th className="px-3 py-2 text-center">Heures</th>
                    <th className="px-3 py-2">Observation</th>
                    <th className="px-3 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.length > 0 ? (
                    filtered.map(({ m, idx }) => {
                      const late = getLateDays(m);
                      const netVal = getNetValue(m);

                      const updateField = (field: keyof Materiel, val: any) => {
                        onUpdateMateriel(idx, { [field]: val });
                      };

                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 ${late > 0 ? "bg-red-50/20" : ""}`}>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.code}
                              onChange={(e) => updateField("code", e.target.value)}
                              className="w-16 px-1 border border-slate-200 rounded text-xs bg-white text-center focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={m.cat}
                              onChange={(e) => updateField("cat", e.target.value)}
                              className="px-1 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            >
                              {CATS.map((c, i) => (
                                <option key={i}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.designation || ""}
                              onChange={(e) => updateField("designation", e.target.value)}
                              className="w-36 px-1.5 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.marque || ""}
                              onChange={(e) => updateField("marque", e.target.value)}
                              className="w-20 px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.carac || ""}
                              onChange={(e) => updateField("carac", e.target.value)}
                              className="w-20 px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              value={m.annee || ""}
                              onChange={(e) => updateField("annee", e.target.value ? parseInt(e.target.value) : null)}
                              className="w-14 px-1 border border-slate-200 rounded text-xs bg-white text-center focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={m.valeur || ""}
                              onChange={(e) => updateField("valeur", e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-20 px-1 border border-slate-200 rounded text-xs bg-white text-right focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right font-bold text-slate-700">
                            {netVal.toLocaleString("fr-FR")}
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={m.etat || "Bon"}
                              onChange={(e) => updateField("etat", e.target.value)}
                              className="px-1 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            >
                              {ETATS.map((et, i) => (
                                <option key={i}>{et}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={m.dispo || "En stock"}
                              onChange={(e) => updateField("dispo", e.target.value)}
                              className="px-1 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            >
                              {DISPOS.map((ds, i) => (
                                <option key={i}>{ds}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.client || ""}
                              onChange={(e) => updateField("client", e.target.value)}
                              className="w-24 px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={m.sortie || ""}
                              onChange={(e) => updateField("sortie", e.target.value || null)}
                              className="px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={m.retour || ""}
                              onChange={(e) => updateField("retour", e.target.value || null)}
                              className="px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                            {late > 0 && (
                              <span className="block text-[10px] text-red-600 font-bold mt-1">
                                ⚠️ Non rentré +{late}j
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              value={m.heures || ""}
                              onChange={(e) => updateField("heures", e.target.value ? parseInt(e.target.value) : null)}
                              className="w-16 px-1 border border-slate-200 rounded text-xs bg-white text-center focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={m.obs || ""}
                              onChange={(e) => updateField("obs", e.target.value)}
                              className="w-24 px-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => onDeleteMateriel(idx)}
                              className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={16} className="px-3 py-8 text-center text-slate-400 font-medium">
                        Aucun élément ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
