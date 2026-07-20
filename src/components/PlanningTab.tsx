import React, { useState } from "react";
import * as XLSX from "xlsx";
import { AppDatabase, PlanningItem, Anomalie } from "../types";
import { calcPlan, fmt, today, todayYMD, pd } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  selectedMonth: string;
  onUpdatePlanItem: (idx: number, updated: Partial<PlanningItem>) => void;
  onAddPlanItem: (item: PlanningItem) => void;
  onProjeterVidanges: (month: string) => void;
  onEclaterMultiGE: () => void;
  onGenererMaintenances: (client: string, site: string, frequency: string, day: string, month: string) => void;
  onAddAnomalie: (ano: Anomalie) => void;
  onUpdateAnomalieStatut: (idx: number, statut: string) => void;
  onDeleteAnomalie: (idx: number) => void;
  onReplacePlan: (items: PlanningItem[]) => void;
  onAppendPlan: (items: PlanningItem[]) => void;
  onStartIntervention?: (item: PlanningItem, idx: number) => void;
}

export const PlanningTab: React.FC<Props> = ({
  db,
  selectedMonth,
  onUpdatePlanItem,
  onAddPlanItem,
  onProjeterVidanges,
  onEclaterMultiGE,
  onGenererMaintenances,
  onAddAnomalie,
  onUpdateAnomalieStatut,
  onDeleteAnomalie,
  onReplacePlan,
  onAppendPlan,
  onStartIntervention
}) => {
  const [search, setSearch] = useState("");
  const [filtType, setFiltType] = useState("");
  const [filtTech, setFiltTech] = useState("");
  const [filtStatut, setFiltStatut] = useState("");
  const [filtFrom, setFiltFrom] = useState("");
  const [filtTo, setFiltTo] = useState("");

  // Modals for Actions
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAnoModal, setShowAnoModal] = useState(false);
  const [showGenMaintModal, setShowGenMaintModal] = useState(false);

  // New Plan form state
  const [newPlanDate, setNewPlanDate] = useState(todayYMD());
  const [newPlanGe, setNewPlanGe] = useState("");
  const [newPlanType, setNewPlanType] = useState("Préventive");
  const [newPlanClient, setNewPlanClient] = useState("");
  const [newPlanSite, setNewPlanSite] = useState("");
  const [newPlanMarque, setNewPlanMarque] = useState("");
  const [newPlanKva, setNewPlanKva] = useState<number | "">("");
  const [newPlanTech, setNewPlanTech] = useState("");
  const [newPlanNote, setNewPlanNote] = useState("");

  // New Anomalie form state
  const [anoGe, setAnoGe] = useState("");
  const [anoSite, setAnoSite] = useState("");
  const [anoDesc, setAnoDesc] = useState("");
  const [anoPrio, setAnoPrio] = useState("Moyenne");
  const [anoEch, setAnoEch] = useState("");
  const [anoResp, setAnoResp] = useState("");

  // Gen Maint form state
  const [genClient, setGenClient] = useState("");
  const [genSite, setGenSite] = useState("");
  const [genFreq, setGenFreq] = useState("1"); // 1 = Once, H = Weekly
  const [genDay, setGenDay] = useState("vendredi");
  const [genMonth, setGenMonth] = useState(selectedMonth || todayYMD().slice(0, 7));

  React.useEffect(() => {
    if (selectedMonth) setGenMonth(selectedMonth);
  }, [selectedMonth]);

  // Tech list
  const techList = Array.from(new Set(db.plan.map(p => p.tech).filter(Boolean))).sort();

  // Filter planned items
  const filteredPlan = db.plan
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => {
      const g = db.parc.find(x => x.id === p.ge) || {};
      const cPlan = calcPlan(p, today());
      const stateArr = g.etat === "Arrêt contrat de maintenance";
      const itemStatus = stateArr ? "arret" : cPlan.k;

      const matchesSearch = ((p.client || "") + " " + (p.site || "") + " " + (p.tech || "") + " " + (p.ge || "") + " " + (p.type || ""))
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType = !filtType || p.type === filtType;
      const matchesTech = !filtTech || p.tech === filtTech;
      const matchesStatut = !filtStatut || itemStatus === filtStatut;
      const matchesFrom = !filtFrom || (p.date && p.date >= filtFrom);
      const matchesTo = !filtTo || (p.date && p.date <= filtTo);
      const matchesMonth = !selectedMonth || (p.date && p.date.startsWith(selectedMonth));

      return matchesSearch && matchesType && matchesTech && matchesStatut && matchesFrom && matchesTo && matchesMonth;
    });

  // Sort: date asc
  filteredPlan.sort((a, b) => {
    const da = a.p.date || "9999-99-99";
    const dbVal = b.p.date || "9999-99-99";
    return da.localeCompare(dbVal);
  });

  // CSV Template downloader
  const downloadTemplate = () => {
    const header = ["Date (AAAA-MM-JJ)", "Client", "Site", "GE (Code)", "Technicien", "Note"];
    const rows = db.parc.map(g => ["", g.client || "", g.site || "", g.id || "", "", ""]);
    const csvContent = "\ufeff" + [header, ...rows].map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_planning.csv";
    link.click();
  };

  // Excel/CSV Uploader handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

        if (!rows.length) {
          alert("Fichier vide.");
          return;
        }

        // Find header row containing client/date
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 8); i++) {
          const rowStr = rows[i].map((x: any) => String(x).toLowerCase()).join(" ");
          if (rowStr.includes("client") || rowStr.includes("date")) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          alert("Impossible de trouver une ligne d'en-tête contenant 'Client' ou 'Date'.");
          return;
        }

        const headers = rows[headerIdx].map((h: any) => String(h).trim().toLowerCase());
        const dateCol = headers.findIndex((h: string) => h.includes("date") || h.includes("prév") || h.includes("planif"));
        const clientCol = headers.findIndex((h: string) => h.includes("client"));
        const siteCol = headers.findIndex((h: string) => h.includes("site") || h.includes("lieu"));
        const geCol = headers.findIndex((h: string) => h.includes("ge") || h.includes("groupe") || h.includes("equip") || h.includes("matricule"));
        const techCol = headers.findIndex((h: string) => h.includes("tech") || h.includes("intervenant"));
        const noteCol = headers.findIndex((h: string) => h.includes("note") || h.includes("obs"));

        if (dateCol === -1 || clientCol === -1) {
          alert("Les colonnes 'Date' et 'Client' sont requises.");
          return;
        }

        const items: PlanningItem[] = [];
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every((c: any) => c === "" || c == null)) continue;

          let rawDate = row[dateCol];
          let formattedDate = "";
          if (rawDate) {
            if (rawDate instanceof Date) {
              formattedDate = rawDate.toISOString().slice(0, 10);
            } else if (typeof rawDate === "number") {
              const dt = new Date(Math.round((rawDate - 25569) * 86400000));
              formattedDate = dt.toISOString().slice(0, 10);
            } else {
              // Convert text to YMD
              const match = String(rawDate).match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              if (match) {
                const y = match[3].length === 2 ? "20" + match[3] : match[3];
                const m = match[2].padStart(2, "0");
                const d = match[1].padStart(2, "0");
                formattedDate = `${y}-${m}-${d}`;
              } else {
                formattedDate = String(rawDate).trim();
              }
            }
          }

          items.push({
            date: formattedDate || null,
            client: String(row[clientCol] || "").trim(),
            site: siteCol >= 0 ? String(row[siteCol] || "").trim() : "",
            ge: geCol >= 0 ? String(row[geCol] || "").trim() : "",
            tech: techCol >= 0 ? String(row[techCol] || "").trim() : "",
            note: noteCol >= 0 ? String(row[noteCol] || "").trim() : "",
            exec: null
          });
        }

        if (confirm(`Importer ${items.length} lignes ? OK pour remplacer le planning, Annuler pour ajouter.`)) {
          onReplacePlan(items);
        } else {
          onAppendPlan(items);
        }
      } catch (err: any) {
        alert("Erreur de lecture : " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProjVidanges = () => {
    const month = prompt("Projeter les vidanges pour quel mois ? (AAAA-MM)", "2026-07");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      if (month) alert("Format attendu : AAAA-MM");
      return;
    }
    onProjeterVidanges(month);
  };

  const fillNewPlanFromGE = (geId: string) => {
    setNewPlanGe(geId);
    const g = db.parc.find(x => x.id === geId);
    if (g) {
      setNewPlanClient(g.client || "");
      setNewPlanSite(g.site || "");
      setNewPlanMarque(g.marque || "");
      setNewPlanKva(g.kva || "");
    }
  };

  const handleSavePlanItem = () => {
    if (!newPlanDate) {
      alert("Date planifiée requise.");
      return;
    }
    onAddPlanItem({
      date: newPlanDate,
      ge: newPlanGe,
      type: newPlanType,
      client: newPlanClient,
      site: newPlanSite,
      marque: newPlanMarque,
      kva: newPlanKva === "" ? "" : Number(newPlanKva),
      tech: newPlanTech,
      note: newPlanNote,
      exec: null
    });
    setShowAddPlanModal(false);
  };

  const handleSaveAnomalie = () => {
    if (!anoDesc) {
      alert("Veuillez décrire l'anomalie.");
      return;
    }
    const g = db.parc.find(x => x.id === anoGe);
    onAddAnomalie({
      id: "A" + Date.now(),
      ge: anoGe,
      client: g ? g.client : "",
      site: anoSite,
      date: todayYMD(),
      prio: anoPrio,
      echeance: anoEch,
      resp: anoResp,
      statut: "Ouvert",
      desc: anoDesc
    });
    setShowAnoModal(false);
    setAnoGe("");
    setAnoSite("");
    setAnoDesc("");
    setAnoResp("");
    setAnoEch("");
  };

  const handleGenMaintenances = () => {
    if (!genClient) {
      alert("Le client est requis.");
      return;
    }
    onGenererMaintenances(genClient, genSite, genFreq, genDay, genMonth);
    setShowGenMaintModal(false);
  };

  // Expert stats
  const stats = {
    total: filteredPlan.length,
    retard: filteredPlan.filter(({ p }) => calcPlan(p, today()).k === "retard").length,
    prevu: filteredPlan.filter(({ p }) => calcPlan(p, today()).k === "prevu").length,
    fait: filteredPlan.filter(({ p }) => calcPlan(p, today()).k === "fait").length,
  };

  return (
    <div id="plan" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">PLANNING DE MAINTENANCE</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Gestion prévisionnelle et suivi des interventions</p>
        </div>
      </div>

      {/* KPI Expert Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-slate-900">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Planifié</span>
          <span className="text-2xl font-black text-black">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-red-600">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">En Retard</span>
          <span className="text-2xl font-black text-red-600">{stats.retard}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-600">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">À Venir</span>
          <span className="text-2xl font-black text-blue-600">{stats.prevu}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-green-600">
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Exécutés</span>
          <span className="text-2xl font-black text-green-600">{stats.fait}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="🔎 Planning par client, site, technicien, GE…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm text-black focus:outline-none focus:border-blue-500"
        />
        <select
          value={filtType}
          onChange={(e) => setFiltType(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm text-black font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
        >
          <option value="">Tous les types</option>
          <option value="Préventive">🛡️ Préventive</option>
          <option value="Corrective">🛠️ Corrective</option>
          <option value="Vidange">🛢️ Vidange</option>
          <option value="Curative">🚑 Curative</option>
          <option value="Expertise">🔬 Expertise</option>
          <option value="Autre">📝 Autre</option>
        </select>
        <select
          value={filtTech}
          onChange={(e) => setFiltTech(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm text-black font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
        >
          <option value="">Tous techniciens</option>
          {techList.map((t, i) => (
            <option key={i}>{t}</option>
          ))}
        </select>
        <select
          value={filtStatut}
          onChange={(e) => setFiltStatut(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm text-black font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
        >
          <option value="">Tous statuts</option>
          <option value="fait">✅ Exécuté</option>
          <option value="avance">⏩ Fait en avance</option>
          <option value="retard_fait">⚠️ Fait en retard</option>
          <option value="retard">🔴 En retard</option>
          <option value="prevu">🟠 Planifié</option>
          <option value="arret">⏸️ En arrêt contrat</option>
        </select>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Du</span>
          <input
            type="date"
            value={filtFrom}
            onChange={(e) => setFiltFrom(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-black focus:outline-none focus:border-blue-500"
          />
          <span>au</span>
          <input
            type="date"
            value={filtTo}
            onChange={(e) => setFiltTo(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-black focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setFiltFrom(todayYMD());
            setFiltTo(todayYMD());
          }}
          className="px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold cursor-pointer"
        >
          📅 Aujourd'hui
        </button>
        {(filtFrom || filtTo) && (
          <button
            onClick={() => {
              setFiltFrom("");
              setFiltTo("");
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
            title="Effacer filtres dates"
          >
            ✕
          </button>
        )}
      </div>

      {/* Primary Actions bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAddPlanModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors"
        >
          ➕ Ajouter au planning
        </button>
        <button
          onClick={handleProjVidanges}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors"
          title="Générer les vidanges prévues du mois selon les échéances"
        >
          🔮 Projeter vidanges
        </button>
        <button
          onClick={onEclaterMultiGE}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors"
          title="Transforme une visite multi-GE en lignes individuelles par GE"
        >
          🔧 Éclater visites multi-GE
        </button>
        <button
          onClick={() => setShowGenMaintModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors"
          title="Crée 1 maintenance par GE pour un client/site, récurrente"
        >
          📅 Générer maintenances
        </button>
        <label className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors">
          📥 Importer planning (Excel/CSV)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </label>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold cursor-pointer transition-colors"
        >
          📄 Modèle d'import
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white border-b-2 border-slate-900">
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Date planifiée</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Type / GE</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Client / Site</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider hide-sm">Marque</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Puissance</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Technicien</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Exécution</th>
                <th className="px-4 py-4 text-left font-bold text-[11px] uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-wider">Note / Anomalie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlan.length > 0 ? (
                filteredPlan.map(({ p, idx }) => {
                  const g = db.parc.find(x => x.id === p.ge) || {};
                  const isArr = g.etat === "Arrêt contrat de maintenance";
                  const cPlan = calcPlan(p, today());
                  const dispStatut = isArr ? "⏸️ Arrêt contrat" : cPlan.s;
                  
                  // Expert status colors
                  let dispColorClass = "bg-slate-100 text-slate-700";
                  if (isArr) dispColorClass = "bg-slate-200 text-slate-500 italic";
                  else if (cPlan.k === "fait") dispColorClass = "bg-green-700 text-white shadow-sm ring-1 ring-green-800";
                  else if (cPlan.k === "avance") dispColorClass = "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700";
                  else if (cPlan.k === "retard_fait") dispColorClass = "bg-orange-600 text-white shadow-sm ring-1 ring-orange-700";
                  else if (cPlan.k === "retard") dispColorClass = "bg-red-700 text-white shadow-sm animate-pulse ring-2 ring-red-300";
                  else if (cPlan.k === "prevu") dispColorClass = "bg-blue-50 text-blue-900 border-2 border-blue-200 font-black";

                  // Type colors
                  const getTypeStyle = (t?: string) => {
                    switch (t) {
                      case 'Préventive': return 'bg-blue-600 text-white border-blue-700';
                      case 'Corrective': return 'bg-amber-500 text-white border-amber-600';
                      case 'Vidange': return 'bg-slate-800 text-white border-slate-900';
                      case 'Curative': return 'bg-red-600 text-white border-red-700';
                      case 'Expertise': return 'bg-purple-600 text-white border-purple-700';
                      default: return 'bg-slate-200 text-slate-800 border-slate-300';
                    }
                  };

                  const handleCellChange = (field: keyof PlanningItem, val: any) => {
                    onUpdatePlanItem(idx, { [field]: val });
                  };

                  return (
                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${isArr ? "opacity-60 grayscale-[0.5]" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={p.date || ""}
                          onChange={(e) => handleCellChange("date", e.target.value || null)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <select
                            value={p.type || "Préventive"}
                            onChange={(e) => handleCellChange("type", e.target.value)}
                            className={`px-2 py-1 rounded text-[10px] font-black uppercase border focus:outline-none ${getTypeStyle(p.type)}`}
                          >
                            <option>Préventive</option>
                            <option>Corrective</option>
                            <option>Vidange</option>
                            <option>Curative</option>
                            <option>Expertise</option>
                            <option>Autre</option>
                          </select>
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm w-fit">ID: {p.ge || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black block text-black text-sm uppercase leading-tight">{p.client}</span>
                        <span className="text-[11px] text-slate-900 font-black uppercase opacity-80">{p.site}</span>
                      </td>
                      <td className="px-4 py-3 hide-sm">
                        <input
                          type="text"
                          value={p.marque || g.marque || ""}
                          onChange={(e) => handleCellChange("marque", e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-black bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={p.kva || g.kva || ""}
                            onChange={(e) => handleCellChange("kva", e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-black text-black bg-white text-center focus:outline-none"
                          />
                          <span className="text-[10px]">kVA</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={p.tech || ""}
                          onChange={(e) => handleCellChange("tech", e.target.value)}
                          className="w-32 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-black bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={p.exec || ""}
                          onChange={(e) => handleCellChange("exec", e.target.value || null)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-black bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-center min-w-[100px] ${dispColorClass}`}>
                            {dispStatut}
                          </span>
                          {!p.exec && onStartIntervention && (
                            <button
                              onClick={() => onStartIntervention(p, idx)}
                              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer transition-all hover:scale-110 shadow-md"
                              title="Démarrer l'intervention réelle"
                            >
                              🚀
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="text"
                            value={p.note || ""}
                            onChange={(e) => handleCellChange("note", e.target.value)}
                            className="flex-1 min-w-[100px] px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Note…"
                          />
                          <button
                            onClick={() => {
                              setAnoGe(p.ge || "");
                              setAnoSite(p.site || "");
                              setShowAnoModal(true);
                            }}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black cursor-pointer transition-transform hover:rotate-12 shadow-sm"
                            title="Relever une anomalie"
                          >
                            ⚠️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Aucune ligne de planning correspondante.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <b className="text-md font-bold text-slate-800">⚠️ Anomalies relevées en maintenance</b>
          <button
            onClick={() => setShowAnoModal(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            + Relever anomalie
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase">
                <th className="px-3 py-2">Client / Site / GE</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Priorité</th>
                <th className="px-3 py-2">Échéance</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-center">X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.anomalies.filter(ano => !selectedMonth || (ano.date && ano.date.startsWith(selectedMonth))).length > 0 ? (
                db.anomalies
                  .filter(ano => !selectedMonth || (ano.date && ano.date.startsWith(selectedMonth)))
                  .map((ano, idx) => {
                  const getAnoStyle = (s: string) => {
                    if (s === "Résolu") return "bg-green-100 text-green-700";
                    if (s === "En cours") return "bg-amber-100 text-amber-700";
                    return "bg-red-100 text-red-700";
                  };

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <span className="font-bold block text-slate-800">{ano.client || "—"}</span>
                        <span className="text-xs text-slate-400 block">{ano.site}</span>
                        {ano.ge && <span className="text-[10px] text-blue-700 font-semibold block">GE: {ano.ge}</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 leading-normal font-medium max-w-[240px]">
                        {ano.desc}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ano.prio === "Haute" ? "text-red-600" : (ano.prio === "Basse" ? "text-slate-500" : "text-amber-600")}`}>
                          {ano.prio}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-600">{fmt(ano.echeance)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{ano.resp || "—"}</td>
                      <td className="px-3 py-3">
                        <select
                          value={ano.statut || "Ouvert"}
                          onChange={(e) => onUpdateAnomalieStatut(idx, e.target.value)}
                          className={`px-2.5 py-1 rounded text-xs font-bold ${getAnoStyle(ano.statut)} focus:outline-none border-0`}
                        >
                          <option value="Ouvert">Ouvert</option>
                          <option value="En cours">En cours</option>
                          <option value="Résolu">Résolu</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => onDeleteAnomalie(idx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer font-bold text-sm"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400 font-medium">
                    Aucune anomalie déclarée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Plan line */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">➕ Ajouter au planning</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Date planifiée *</label>
                  <input type="date" value={newPlanDate} onChange={(e) => setNewPlanDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Type d'intervention *</label>
                  <select value={newPlanType} onChange={(e) => setNewPlanType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white font-bold text-black">
                    <option>Préventive</option>
                    <option>Corrective</option>
                    <option>Vidange</option>
                    <option>Curative</option>
                    <option>Expertise</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Choisir GE</label>
                  <select onChange={(e) => fillNewPlanFromGE(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" value={newPlanGe}>
                    <option value="">— Aucun GE —</option>
                    {db.parc.map(g => (
                      <option key={g.id} value={g.id}>{g.id} — {g.client} / {g.site}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Client</label>
                  <input type="text" value={newPlanClient} onChange={(e) => setNewPlanClient(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Site</label>
                  <input type="text" value={newPlanSite} onChange={(e) => setNewPlanSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Marque</label>
                  <input type="text" value={newPlanMarque} onChange={(e) => setNewPlanMarque(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Puissance (kVA)</label>
                  <input type="number" value={newPlanKva} onChange={(e) => setNewPlanKva(e.target.value ? Number(e.target.value) : "")} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Technicien</label>
                  <input type="text" value={newPlanTech} onChange={(e) => setNewPlanTech(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" list="techlist" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Commentaire / Note</label>
                  <input type="text" value={newPlanNote} onChange={(e) => setNewPlanNote(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button onClick={handleSavePlanItem} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Anomalie */}
      {showAnoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">⚠️ Relever une anomalie</h3>
              <button onClick={() => setShowAnoModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">GE concerné</label>
                  <select
                    value={anoGe}
                    onChange={(e) => {
                      const id = e.target.value;
                      setAnoGe(id);
                      const g = db.parc.find(x => x.id === id);
                      if (g) setAnoSite(g.site || "");
                    }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
                  >
                    <option value="">— Aucun GE —</option>
                    {db.parc.map(g => (
                      <option key={g.id} value={g.id}>{g.id} — {g.client} / {g.site}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Site</label>
                  <input type="text" value={anoSite} onChange={(e) => setAnoSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Priorité</label>
                  <select value={anoPrio} onChange={(e) => setAnoPrio(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option>Haute</option>
                    <option>Moyenne</option>
                    <option>Basse</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Échéance de résolution</label>
                  <input type="date" value={anoEch} onChange={(e) => setAnoEch(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Responsable</label>
                  <input type="text" value={anoResp} onChange={(e) => setAnoResp(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Description de l'anomalie *</label>
                <textarea rows={3} value={anoDesc} onChange={(e) => setAnoDesc(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500" placeholder="Décrivez l'anomalie constatée…" />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowAnoModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button onClick={handleSaveAnomalie} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gen Maintenances */}
      {showGenMaintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">📅 Générer maintenances périodiques</h3>
              <button onClick={() => setShowGenMaintModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Client exact (ex : SCLOG) *</label>
                  <input type="text" value={genClient} onChange={(e) => setGenClient(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Site (Laisser vide pour tous)</label>
                  <input type="text" value={genSite} onChange={(e) => setGenSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Fréquence</label>
                  <select value={genFreq} onChange={(e) => setGenFreq(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="1">Une fois par mois (Mensuel)</option>
                    <option value="H">Chaque semaine (Hebdo)</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Mois cible (AAAA-MM)</label>
                  <input type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Jour d'intervention</label>
                <select value={genDay} onChange={(e) => setGenDay(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="lundi">Lundi</option>
                  <option value="mardi">Mardi</option>
                  <option value="mercredi">Mercredi</option>
                  <option value="jeudi">Jeudi</option>
                  <option value="vendredi">Vendredi</option>
                  <option value="samedi">Samedi</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowGenMaintModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button onClick={handleGenMaintenances} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer">Générer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
