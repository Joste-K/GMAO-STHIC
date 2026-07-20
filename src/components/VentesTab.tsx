import React, { useState } from "react";
import { AppDatabase, Vente } from "../types";
import { fmt, todayYMD, pd, today } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onAddVente: () => void;
  onUpdateVente: (idx: number, updated: Partial<Vente>) => void;
  onDeleteVente: (idx: number) => void;
}

export const VentesTab: React.FC<Props> = ({ db, onAddVente, onUpdateVente, onDeleteVente }) => {
  const [search, setSearch] = useState("");
  const [filtStatut, setFiltStatut] = useState("");

  const STATUTS = ["Payé", "À recouvrer", "Échu non payé", "Litige"];
  const TYPES = ["Contrat Maintenance", "Dépannage d'urgence", "Sizing & Bilan de puissance", "Fourniture pièces", "Installation GE"];

  // Filter lists
  const filtered = db.ventes
    .map((v, idx) => ({ v, idx }))
    .filter(({ v }) => {
      if (filtStatut && (v.statut || "") !== filtStatut) return false;

      const hay = `${v.id || ""} ${v.client || ""} ${v.type || ""} ${v.obs || ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });

  // KPI calculations
  let vTotal = 0;
  let vPaye = 0;
  let vArecouvrer = 0;
  let vEchu = 0;

  db.ventes.forEach(v => {
    const val = parseFloat(String(v.valeur || 0)) || 0;
    vTotal += val;

    const st = v.statut || "À recouvrer";
    if (st === "Payé") {
      vPaye += val;
    } else if (st === "Échu non payé") {
      vEchu += val;
    } else {
      vArecouvrer += val;
    }
  });

  const exportCSV = () => {
    const cols: (keyof Vente)[] = ["id", "client", "valeur", "type", "statut", "dfact", "echeance", "obs"];
    const head = ["N Facture", "Client", "Montant (FCFA)", "Type Prestation", "Statut", "Date Facture", "Echeance", "Observations"];

    const csvContent = "\ufeff" + [head, ...db.ventes.map(v => cols.map(c => `"${String(v[c] || "").replace(/"/g, '""')}"`))].map(r => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `facturation_sthic_${todayYMD()}.csv`;
    link.click();
  };

  const badgeColors: { [key: string]: string } = {
    "Payé": "bg-green-100 text-green-700",
    "À recouvrer": "bg-blue-100 text-blue-700",
    "Échu non payé": "bg-red-100 text-red-700",
    "Litige": "bg-purple-100 text-purple-700"
  };

  return (
    <div id="ventes" className="space-y-6">
      <h2 className="text-xl font-extrabold text-blue-900 border-b pb-2">
        💰 Facturation &amp; Suivi Commercial — STHIC
      </h2>

      {/* Ventes KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-slate-700">
          <div className="text-lg font-black text-slate-800">{vTotal.toLocaleString("fr-FR")} FCFA</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Total facturé</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
          <div className="text-lg font-black text-green-700">{vPaye.toLocaleString("fr-FR")} FCFA</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold font-semibold tracking-wide">Montants encaissés</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-600">
          <div className="text-lg font-black text-blue-700">{vArecouvrer.toLocaleString("fr-FR")} FCFA</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold font-semibold tracking-wide">À recouvrer</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
          <div className="text-lg font-black text-red-600">{vEchu.toLocaleString("fr-FR")} FCFA</div>
          <div className="text-[10px] uppercase text-slate-500 font-bold font-semibold tracking-wide">Créances échues</div>
        </div>
      </div>

      {/* List Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border border-slate-100">
        <input
          type="text"
          placeholder="🔎 Rechercher un dossier facturation (facture, client, type)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-black focus:outline-none"
        />
        <select
          value={filtStatut}
          onChange={(e) => setFiltStatut(e.target.value)}
          className="px-2.5 py-2 border border-slate-200 bg-white rounded-lg text-xs text-black focus:outline-none"
        >
          <option value="">Tous statuts</option>
          {STATUTS.map((st, i) => (
            <option key={i}>{st}</option>
          ))}
        </select>
        <button
          onClick={onAddVente}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          ➕ Nouvelle facture / contrat
        </button>
        <button
          onClick={exportCSV}
          className="px-4 py-2 border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Main factures table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
        <div className="overflow-x-auto max-h-[50vh]">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-700 text-white font-semibold">
                <th className="px-3 py-2.5">Facture N°</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5 text-right">Montant (FCFA)</th>
                <th className="px-3 py-2.5">Type Prestation</th>
                <th className="px-3 py-2.5">Statut de paiement</th>
                <th className="px-3 py-2.5">Émission</th>
                <th className="px-3 py-2.5">Échéance</th>
                <th className="px-3 py-2.5">Observations / Devis</th>
                <th className="px-3 py-2.5 text-center">X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length > 0 ? (
                filtered.map(({ v, idx }) => {
                  const updateField = (field: keyof Vente, val: any) => {
                    onUpdateVente(idx, { [field]: val });
                  };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.id}
                          onChange={(e) => updateField("id", e.target.value)}
                          className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.client || ""}
                          onChange={(e) => updateField("client", e.target.value)}
                          className="w-36 px-1.5 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.valeur || ""}
                          onChange={(e) => updateField("valeur", e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-28 px-1.5 py-1 border border-slate-200 rounded text-xs bg-white text-right font-black text-slate-800"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={v.type}
                          onChange={(e) => updateField("type", e.target.value)}
                          className="px-1 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none cursor-pointer"
                        >
                          {TYPES.map((ty, i) => (
                            <option key={i}>{ty}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={v.statut}
                          onChange={(e) => updateField("statut", e.target.value)}
                          className={`px-1.5 py-1 rounded text-xs font-bold border-0 focus:outline-none cursor-pointer ${
                            badgeColors[v.statut] || "bg-slate-100"
                          }`}
                        >
                          {STATUTS.map((st, i) => (
                            <option key={i}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={v.dfact || ""}
                          onChange={(e) => updateField("dfact", e.target.value || null)}
                          className="px-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={v.echeance || ""}
                          onChange={(e) => updateField("echeance", e.target.value || null)}
                          className="px-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.obs || ""}
                          onChange={(e) => updateField("obs", e.target.value)}
                          className="w-32 px-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => onDeleteVente(idx)}
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
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-400 font-medium">
                    Aucune facture ne correspond à la recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
