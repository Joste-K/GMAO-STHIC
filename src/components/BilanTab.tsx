import React, { useState, useEffect } from "react";
import { AppDatabase, Bilan, BilanRecepteur } from "../types";
import { calcLine, pickGE, todayYMD } from "../utils/calculations";
import { RECEP } from "../data/seed";

interface Props {
  db: AppDatabase;
  onAddBilan: (bilan: Bilan) => void;
  onUpdateBilan: (id: string, updated: Partial<Bilan>) => void;
  onDeleteBilan: (id: string) => void;
}

export const BilanTab: React.FC<Props> = ({ db, onAddBilan, onUpdateBilan, onDeleteBilan }) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!activeId && db.bilans.length > 0) {
      setActiveId(db.bilans[0].id);
    }
  }, [db.bilans, activeId]);

  const activeBilan = db.bilans.find(b => b.id === activeId);

  const handleCreateNew = () => {
    const newB: Bilan = {
      id: "B" + Date.now(),
      nom: "Nouveau bilan",
      client: "",
      site: "",
      date: new Date().toISOString().slice(0, 10),
      usage: "Secours",
      tension: "220/380 V — 50 Hz",
      tech: "",
      devis: "",
      coef: 0.8,
      rec: RECEP.map(r => ({
        des: r[0],
        qte: 0,
        pu: r[1],
        cosphi: r[2],
        fd: r[3],
        fs: r[4]
      }))
    };
    onAddBilan(newB);
    setActiveId(newB.id);
  };

  const handleDuplicate = () => {
    if (!activeBilan) return;
    const dup: Bilan = JSON.parse(JSON.stringify(activeBilan));
    dup.id = "B" + Date.now();
    dup.nom = (dup.nom || "Bilan") + " (copie)";
    onAddBilan(dup);
    setActiveId(dup.id);
  };

  const handleDelete = () => {
    if (!activeBilan) return;
    if (confirm("Supprimer définitivement ce bilan de puissance ?")) {
      onDeleteBilan(activeBilan.id);
      setActiveId("");
    }
  };

  const updateHeader = (field: keyof Bilan, val: any) => {
    if (activeId) {
      onUpdateBilan(activeId, { [field]: val });
    }
  };

  const updateReceptor = (idx: number, field: keyof BilanRecepteur, val: any) => {
    if (!activeBilan) return;
    const rec = [...activeBilan.rec];
    rec[idx] = {
      ...rec[idx],
      [field]: val === "" ? "" : parseFloat(val) || 0
    };
    onUpdateBilan(activeBilan.id, { rec });
  };

  const updateReceptorText = (idx: number, text: string) => {
    if (!activeBilan) return;
    const rec = [...activeBilan.rec];
    rec[idx] = { ...rec[idx], des: text };
    onUpdateBilan(activeBilan.id, { rec });
  };

  const addLine = () => {
    if (!activeBilan) return;
    const rec = [...activeBilan.rec];
    rec.push({
      des: "Nouveau récepteur",
      qte: 0,
      pu: 0,
      cosphi: 0.85,
      fd: 1,
      fs: 1
    });
    onUpdateBilan(activeBilan.id, { rec });
  };

  const removeLine = (idx: number) => {
    if (!activeBilan) return;
    const rec = [...activeBilan.rec];
    rec.splice(idx, 1);
    onUpdateBilan(activeBilan.id, { rec });
  };

  // Computations
  let sumG = 0;
  let sumI = 0;
  let sumL = 0;
  let sumM = 0;

  if (activeBilan) {
    activeBilan.rec.forEach(r => {
      const c = calcLine(r);
      sumG += c.G;
      sumI += c.I;
      sumL += LValue(c);
      sumM += c.M;
    });
  }

  // To prevent TS types errors, we make sure values are safely extracted
  function LValue(c: any): number {
    return Number(c.L) || 0;
  }

  const coef = activeBilan?.coef || 0.8;
  const smin = sumI / coef;
  const speak = sumL / coef;
  const base = Math.max(smin, speak);

  const g20 = Math.round(base * 1.2);
  const g25 = Math.round(base * 1.25);
  const g30 = Math.round(base * 1.3);

  const currentA = g25 ? Math.round((g25 * 1000) / (Math.sqrt(3) * 400)) : 0;

  const exportCSV = () => {
    if (!activeBilan) return;
    const head = ["N°", "Designation", "Qte", "P.U.(W)", "cos phi", "FD", "FS", "P.Act(kW)", "P.App(kVA)", "P.Demarrage(kVA)", "P.Dem(kW)"];
    const rows = activeBilan.rec.map((r, i) => {
      const c = calcLine(r);
      return [i + 1, r.des, r.qte, r.pu, r.cosphi, r.fd, r.fs, c.G.toFixed(2), c.I.toFixed(2), LValue(c).toFixed(2), c.M.toFixed(2)];
    });

    const foot = [
      [""],
      ["RÉSULTATS"],
      ["Client", activeBilan.client],
      ["Site", activeBilan.site],
      ["P apparente totale (kVA)", sumI.toFixed(1)],
      ["Pointe de démarrage totale (kVA)", sumL.toFixed(1)],
      ["Coefficient foisonnement", coef],
      ["GE recommandé +25% (kVA)", g25],
      ["Modèle standard proposé", pickGE(g25)]
    ];

    const csvContent = "\ufeff" + [head, ...rows, ...foot].map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bilan_${(activeBilan.client || "STHIC").replace(/[^A-Za-z0-9]/g, "_")}_${todayYMD()}.csv`;
    link.click();
  };

  return (
    <div id="bilan" className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border border-slate-100">
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="min-w-[240px] px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none"
        >
          {db.bilans.length > 0 ? (
            db.bilans.map((b, i) => (
              <option key={b.id} value={b.id}>
                {b.nom || "Bilan"} {b.client ? `— ${b.client}` : ""}
              </option>
            ))
          ) : (
            <option value="">— Aucun bilan —</option>
          )}
        </select>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
        >
          + Nouveau bilan
        </button>
        {activeBilan && (
          <>
            <button
              onClick={handleDuplicate}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Dupliquer
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              🖨️ Imprimer / PDF
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              ⬇️ Export CSV
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Supprimer
            </button>
          </>
        )}
      </div>

      {activeBilan ? (
        <div id="bilanPrint" className="bg-white rounded-xl p-8 border border-slate-100 space-y-6 shadow-sm print:shadow-none print:border-none print-target">
          <div className="border-b-3 border-b-red-600 pb-3">
            <h2 className="text-2xl font-extrabold text-blue-900 leading-tight">
              ⚡ Bilan de puissance — STHIC
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase">
              Dimensionnement des charges actives &amp; réactives
            </p>
          </div>

          {/* Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Nom de l'étude</label>
              <input
                type="text"
                value={activeBilan.nom || ""}
                onChange={(e) => updateHeader("nom", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Client</label>
              <input
                type="text"
                value={activeBilan.client || ""}
                onChange={(e) => updateHeader("client", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Site / Adresse</label>
              <input
                type="text"
                value={activeBilan.site || ""}
                onChange={(e) => updateHeader("site", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Date</label>
              <input
                type="date"
                value={activeBilan.date || ""}
                onChange={(e) => updateHeader("date", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Usage du GE</label>
              <select
                value={activeBilan.usage}
                onChange={(e) => updateHeader("usage", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none cursor-pointer"
              >
                <option value="Secours">Secours</option>
                <option value="Continu">Continu (Source principale)</option>
                <option value="Mixte">Mixte</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Tension nominale</label>
              <input
                type="text"
                value={activeBilan.tension || ""}
                onChange={(e) => updateHeader("tension", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Technicien</label>
              <input
                type="text"
                value={activeBilan.tech || ""}
                onChange={(e) => updateHeader("tech", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">N° Devis</label>
              <input
                type="text"
                value={activeBilan.devis || ""}
                onChange={(e) => updateHeader("devis", e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Receptors table */}
          <div className="space-y-3">
            <div className="border-l-4 border-l-red-600 pl-2 flex justify-between items-center">
              <h3 className="text-md font-extrabold text-blue-900">🔌 Bibliothèque de charges &amp; récepteurs</h3>
              <button
                onClick={addLine}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                + Ajouter ligne
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-100">
                <thead>
                  <tr className="bg-slate-700 text-white font-semibold">
                    <th className="px-3 py-2 text-center">N°</th>
                    <th className="px-3 py-2">Désignation récepteur</th>
                    <th className="px-3 py-2 text-center">Qté</th>
                    <th className="px-3 py-2 text-center">P.U.(W)</th>
                    <th className="px-3 py-2 text-center">cos φ</th>
                    <th className="px-3 py-2 text-center" title="Facteur de simultanéité">FD</th>
                    <th className="px-3 py-2 text-center" title="Facteur d'appel / démarrage">FS</th>
                    <th className="px-3 py-2 text-right bg-slate-800">P.Act (kW)</th>
                    <th className="px-3 py-2 text-right bg-slate-800">P.App (kVA)</th>
                    <th className="px-3 py-2 text-right bg-slate-800">P.Dém (kVA)</th>
                    <th className="px-3 py-2 text-right bg-slate-800">P.Dem (kW)</th>
                    <th className="px-3 py-2 text-center">X</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeBilan.rec.map((r, i) => {
                    const c = calcLine(r);
                    return (
                      <tr key={i} className="hover:bg-slate-50 font-medium">
                        <td className="px-3 py-2 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.des}
                            onChange={(e) => updateReceptorText(i, e.target.value)}
                            className="w-full min-w-[150px] px-1 py-0.5 border border-transparent hover:border-slate-200 rounded-sm bg-transparent"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={r.qte || 0}
                            onChange={(e) => updateReceptor(i, "qte", e.target.value)}
                            className="w-12 text-center border rounded-md"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={r.pu || 0}
                            onChange={(e) => updateReceptor(i, "pu", e.target.value)}
                            className="w-16 text-center border rounded-md"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={r.cosphi}
                            onChange={(e) => updateReceptor(i, "cosphi", e.target.value)}
                            className="w-12 text-center border rounded-md"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={r.fd}
                            onChange={(e) => updateReceptor(i, "fd", e.target.value)}
                            className="w-12 text-center border rounded-md"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={r.fs}
                            onChange={(e) => updateReceptor(i, "fs", e.target.value)}
                            className="w-12 text-center border rounded-md"
                          />
                        </td>
                        <td className="px-3 py-2 text-right bg-slate-50 font-bold text-slate-700">{c.G.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right bg-slate-50 font-bold text-slate-700">{c.I.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right bg-slate-50 font-bold text-slate-700">{LValue(c).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right bg-slate-50 font-bold text-slate-700">{c.M.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            onClick={() => removeLine(i)}
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer text-sm"
                          >
                            &times;
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={7} className="px-3 py-3 text-right text-slate-600 font-extrabold uppercase">Totaux :</td>
                    <td className="px-3 py-3 text-right text-slate-800">{sumG.toFixed(2)} kW</td>
                    <td className="px-3 py-3 text-right text-slate-800">{sumI.toFixed(2)} kVA</td>
                    <td className="px-3 py-3 text-right text-slate-800">{sumL.toFixed(2)} kVA</td>
                    <td className="px-3 py-3 text-right text-slate-800">{sumM.toFixed(2)} kW</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3 border">
              <div className="text-xl font-extrabold text-blue-900">{sumI.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">P. Apparente Totale (kVA)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <div className="text-xl font-extrabold text-blue-900">{sumM.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">P. Demande (kW)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <div className="text-xl font-extrabold text-blue-900">{sumL.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Pointe Démarrage (kVA)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <div className="text-xl font-extrabold text-blue-900">{sumI > 0 ? (sumG / sumI).toFixed(3) : "—"}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Cos φ moyen</div>
            </div>
          </div>

          {/* Sizing Recommendations */}
          <div className="space-y-4">
            <div className="border-l-4 border-l-red-600 pl-2">
              <h3 className="text-md font-extrabold text-blue-900">⚖️ Critères de Dimensionnement</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Facteur de sécurité / Coef (0,6–1,0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={coef}
                  onChange={(e) => updateHeader("coef", e.target.value === "" ? 0.8 : parseFloat(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                />
              </div>
              <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-slate-800">{smin.toFixed(1)} kVA</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Puissance Min requise</div>
              </div>
              <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-slate-800">{speak.toFixed(1)} kVA</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Pointe max foisonnée</div>
              </div>
              <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-slate-800">{currentA} A</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Intensité Triphasée ~ (400V)</div>
              </div>
            </div>

            {/* Standard sizing recommendation box */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-5 space-y-2">
              <div className="text-sm font-bold text-blue-900">⚡ Groupe Électrogène recommandé (marge de sécurité +25 % incluse) :</div>
              <div className="text-3xl font-extrabold text-blue-900">{g25} kVA</div>
              <div className="text-lg font-bold text-red-600">{pickGE(g25)}</div>
              <div className="text-xs text-slate-500 font-semibold pt-1 border-t border-blue-200">
                Autres tolérances : +20 % ➜ <b>{g20}</b> kVA &middot; +30 % (Continu / Secours critique) ➜ <b>{g30}</b> kVA
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
          <p className="text-slate-400 font-medium py-12">
            Sélectionnez un bilan de puissance existant ou cliquez sur « + Nouveau bilan » pour démarrer l'étude.
          </p>
        </div>
      )}
    </div>
  );
};
