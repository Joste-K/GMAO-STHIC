import React, { useState } from "react";
import { AppDatabase, GE } from "../types";
import { calcGE, recoGE, fmtD, diffDays, today, pd } from "../utils/calculations";
import { HealthDashboard } from "./HealthDashboard";

interface Props {
  db: AppDatabase;
  onSelectGE: (geId: string) => void;
  onOpenNewGE: () => void;
  onUpdateKva: (id: string, value: number | "") => void;
  searchQuery?: string;
}

export const ParcTab: React.FC<Props> = ({ db, onSelectGE, onOpenNewGE, onUpdateKva, searchQuery = "" }) => {
  const [search, setSearch] = useState(searchQuery);

  React.useEffect(() => {
    if (searchQuery) setSearch(searchQuery);
  }, [searchQuery]);

  const [filtClient, setFiltClient] = useState("");
  const [filtMarque, setFiltMarque] = useState("");
  const [filtEtat, setFiltEtat] = useState("");
  const [filtVidange, setFiltVidange] = useState("");
  const [filtBatt, setFiltBatt] = useState("");
  const [filtCourr, setFiltCourr] = useState("");
  const [filtPuiss, setFiltPuiss] = useState<number | "">("");

  // Extract unique clients & brands
  const clients = Array.from(new Set(db.parc.map(g => g.client).filter(Boolean))).sort();
  const brands = Array.from(new Set(db.parc.map(g => g.marque).filter(Boolean))).sort();

  // Filter GEs
  const filteredGEs = db.parc.filter(g => {
    const c = calcGE(g, db.inter || []);
    const r = recoGE(g, db.inter || []);

    const matchesSearch = (g.id + " " + g.client + " " + g.site + " " + (g.marque || "") + " " + (g.moteur || ""))
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesClient = !filtClient || g.client === filtClient;
    const matchesMarque = !filtMarque || g.marque === filtMarque;
    const matchesEtat = !filtEtat || (g.etat || "Opérationnel") === filtEtat;
    const matchesVidange = !filtVidange || c.sv.includes(filtVidange);
    const matchesBatt = !filtBatt || c.bs.includes(filtBatt);
    const matchesCourr = !filtCourr || c.cs.includes(filtCourr);
    const matchesPuiss = !filtPuiss || (Number(g.kva) || 0) >= Number(filtPuiss);

    return (
      matchesSearch &&
      matchesClient &&
      matchesMarque &&
      matchesEtat &&
      matchesVidange &&
      matchesBatt &&
      matchesCourr &&
      matchesPuiss
    );
  });

  // Sort GEs: client name first, then id
  filteredGEs.sort((a, b) => {
    const cliCompare = a.client.toLowerCase().localeCompare(b.client.toLowerCase());
    if (cliCompare !== 0) return cliCompare;
    return a.id.localeCompare(b.id);
  });

  const getBadgeClass = (text: string) => {
    if (text.includes("🔴") || text.includes("Critique") || text.includes("panne") || text.includes("remplacer") || text.includes("vidanger")) return "bg-red-100 text-red-700";
    if (text.includes("🟠") || text.includes("surveiller") || text.includes("planifier") || text.includes("Bientôt") || text.includes("maintenance")) return "bg-amber-100 text-amber-700";
    if (text.includes("🟢") || text.includes("OK") || text.includes("jour") || text.includes("Opérationnel")) return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div id="parc" className="space-y-4">
      {/* Dashboard Santé */}
      <HealthDashboard parc={db.parc} interventions={db.inter || []} />

      {/* Search & New button */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="🔎 Rechercher un GE par client, site, ID, moteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={onOpenNewGE}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors"
        >
          + Nouveau GE
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <select
          value={filtClient}
          onChange={(e) => setFiltClient(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Tous clients</option>
          {clients.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filtMarque}
          onChange={(e) => setFiltMarque(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Toutes marques</option>
          {brands.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={filtEtat}
          onChange={(e) => setFiltEtat(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Tous états</option>
          <option value="Opérationnel">Opérationnel</option>
          <option value="En panne">En panne</option>
          <option value="En maintenance">En maintenance</option>
          <option value="Hors service">Hors service</option>
          <option value="Arrêt contrat de maintenance">Arrêt contrat</option>
        </select>

        <select
          value={filtVidange}
          onChange={(e) => setFiltVidange(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">🛢️ À vidanger : tous</option>
          <option value="🔴">🔴 À vidanger</option>
          <option value="🟠">🟠 À planifier</option>
          <option value="🟢">🟢 OK</option>
          <option value="⚪">⚪ À renseigner</option>
        </select>

        <select
          value={filtBatt}
          onChange={(e) => setFiltBatt(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Batterie : tous</option>
          <option value="🔴">🔴 À remplacer</option>
          <option value="🟠">🟠 Bientôt</option>
          <option value="🟢">🟢 OK</option>
        </select>

        <select
          value={filtCourr}
          onChange={(e) => setFiltCourr(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Courroie : tous</option>
          <option value="🔴">🔴 À remplacer</option>
          <option value="🟠">🟠 Bientôt</option>
          <option value="🟢">🟢 OK</option>
        </select>

        <input
          type="number"
          placeholder="kVA min"
          value={filtPuiss}
          onChange={(e) => setFiltPuiss(e.target.value ? Number(e.target.value) : "")}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Client / Site</th>
                <th className="px-4 py-3 text-left font-semibold">Puissance (kVA)</th>
                <th className="px-4 py-3 text-left font-semibold hide-sm">État global</th>
                <th className="px-4 py-3 text-left font-semibold hide-sm">Maintenance</th>
                <th className="px-4 py-3 text-left font-semibold">Vidange</th>
                <th className="px-4 py-3 text-left font-semibold">Batterie</th>
                <th className="px-4 py-3 text-left font-semibold">Courroie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGEs.length > 0 ? (
                filteredGEs.map((g, idx) => {
                  const c = calcGE(g, db.inter || []);
                  const r = recoGE(g, db.inter || []);

                  // Format detailed vidange text
                  let vdText = "";
                  if (c.rest !== null) {
                    vdText = c.rest < 0 ? `dépassé de ${-c.rest} h` : `${c.rest} h restantes`;
                  }
                  if (c.proch) {
                    const daysLeft = diffDays(today(), c.proch);
                    const daysLeftStr = daysLeft !== null ? (daysLeft >= 0 ? `${daysLeft} j restants · ` : `en retard de ${-daysLeft} j · `) : "";
                    vdText += (vdText ? " · " : "") + daysLeftStr + fmtD(c.proch);
                  }
                  if (g.dvid) {
                    const ageM = Math.round((diffDays(pd(g.dvid), today()) || 0) / 30 * 10) / 10;
                    if (ageM >= 5) {
                      vdText += (vdText ? " · " : "") + `🗓️ vid. il y a ${ageM} mois`;
                    }
                  }

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectGE(g.id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 font-bold text-blue-900">{g.id}</td>
                      <td className="px-4 py-4 text-slate-700">
                        <span className="font-semibold block">{g.client}</span>
                        <span className="text-xs text-slate-400 font-medium">{g.site}</span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <input
                            type="number"
                            min="0"
                            value={g.kva === "" || g.kva == null ? "" : g.kva}
                            onChange={(e) =>
                              onUpdateKva(g.id, e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-16 px-1.5 py-1 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <span className="text-xs">kVA</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hide-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(g.etat || "Opérationnel")}`}>
                          {g.etat || "Opérationnel"}
                        </span>
                      </td>
                      <td className="px-4 py-4 hide-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(r.health)}`}>
                          {r.health}
                        </span>
                      </td>
                      <td className="px-4 py-4 leading-normal">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(c.sv)}`}>
                          {c.sv}
                        </span>
                        {vdText && (
                          <span className="block text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                            {vdText}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(c.bs)}`}>
                          {c.bs}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(c.cs)}`}>
                          {c.cs}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Aucun groupe électrogène ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <span>🟢 OK</span>
        <span>🟠 À surveiller</span>
        <span>🔴 Critique</span>
        <span>⚪ À renseigner</span>
      </div>
    </div>
  );
};
