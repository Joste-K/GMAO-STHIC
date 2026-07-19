import React, { useState } from "react";
import { AppDatabase, Task, TaskLogEvent, TaskMsg } from "../types";
import { fmt, todayYMD, pd, today } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onAddTask: (task: Task) => void;
  onUpdateTask: (idx: number, updated: Partial<Task>) => void;
  onDeleteTask: (idx: number) => void;
}

export const InterventionsTab: React.FC<Props> = ({ db, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [search, setSearch] = useState("");
  const [filtStatut, setFiltStatut] = useState("");
  const [filtMois, setFiltMois] = useState("");

  // Pagination state
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(0);

  // Sorting state
  const [sortCol, setSortCol] = useState<string>("prio");
  const [sortDir, setSortDir] = useState<number>(1); // 1 = Asc, -1 = Desc

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogList, setActiveLogList] = useState<TaskLogEvent[]>([]);
  const [activeLogTitle, setActiveLogTitle] = useState("");
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [activeMsgIdx, setActiveMsgIdx] = useState<number | null>(null);

  // Add / Edit form states
  const [formTitre, setFormTitre] = useState("");
  const [formType, setFormType] = useState("Vidange");
  const [formStatut, setFormStatut] = useState("Non commencé");
  const [formPrio, setFormPrio] = useState("P3");
  const [formGe, setFormGe] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formSite, setFormSite] = useState("");
  const [formDdemande, setFormDdemande] = useState(todayYMD());
  const [formEcheance, setFormEcheance] = useState("");
  const [formAssigne, setFormAssigne] = useState("");
  const [formProg, setFormProg] = useState(0);
  const [formNotes, setFormNotes] = useState("");

  // Msg states
  const [msgWho, setFormMsgWho] = useState(() => localStorage.getItem("gmao_msg_who") || "");
  const [msgTxt, setFormMsgTxt] = useState("");

  const TTYPES = [
    "Vidange", "Filtres", "Batterie", "Courroie", "Visite", "Préventive",
    "Corrective", "Curative", "Dépannage", "Installation GE", "Installation Inverseur",
    "Remplacement pièces", "Survey", "Bilan de puissance"
  ];

  // Helper to determine year-month representing the task
  const getTaskMonthKey = (t: Task) => {
    const defaultM = todayYMD().slice(0, 7);
    if (t.statut === "Terminé") {
      const d = t.dreal || t.echeance;
      return d ? String(d).slice(0, 7) : defaultM;
    }
    if (t.echeance && String(t.echeance).slice(0, 10) > todayYMD()) {
      return String(t.echeance).slice(0, 7);
    }
    return defaultM;
  };

  const monthsKeys = Array.from(new Set(db.taches.map(getTaskMonthKey))).sort().reverse();

  // Helper for technician avatar
  const getAvatarInitials = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "—";
    const parts = trimmed.split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "#cbd5e1";
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
    }
    const palette = [
      "#2563eb", "#0891b2", "#16a34a", "#7c3aed", "#d97706",
      "#db2777", "#0d9488", "#4f46e5", "#ca8a04", "#dc2626"
    ];
    return palette[hash % palette.length];
  };

  // Filter list
  const filteredTasks = db.taches
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) => {
      const hay = `${t.id || ""} ${t.titre || ""} ${t.client || ""} ${t.site || ""} ${t.assigne || ""} ${t.ge || ""} ${t.notes || ""}`.toLowerCase();
      const matchesSearch = hay.includes(search.toLowerCase());
      const matchesStatut = !filtStatut || t.statut === filtStatut;
      const matchesMois = !filtMois || getTaskMonthKey(t) === filtMois;

      return matchesSearch && matchesStatut && matchesMois;
    });

  // Sorting logic
  const prioRank: { [key: string]: number } = { P1: 0, P2: 1, P3: 2, P4: 3 };
  const sortTasks = (a: any, b: any) => {
    let keyA: any = "";
    let keyB: any = "";

    switch (sortCol) {
      case "num":
        keyA = a.t.id || "";
        keyB = b.t.id || "";
        break;
      case "site":
        keyA = `${a.t.client || ""} ${a.t.site || ""}`.toLowerCase();
        keyB = `${b.t.client || ""} ${b.t.site || ""}`.toLowerCase();
        break;
      case "type":
        keyA = (a.t.type || "").toLowerCase();
        keyB = (b.t.type || "").toLowerCase();
        break;
      case "statut":
        keyA = (a.t.statut || "").toLowerCase();
        keyB = (b.t.statut || "").toLowerCase();
        break;
      case "ddemande":
        keyA = a.t.ddemande || a.t.dcrea || "0000";
        keyB = b.t.ddemande || b.t.dcrea || "0000";
        break;
      case "assigne":
        keyA = (a.t.assigne || "").toLowerCase();
        keyB = (b.t.assigne || "").toLowerCase();
        break;
      default: // prio
        keyA = prioRank[a.t.prio] ?? 9;
        keyB = prioRank[b.t.prio] ?? 9;
    }

    if (keyA < keyB) return -1 * sortDir;
    if (keyA > keyB) return 1 * sortDir;
    return (a.t.echeance || "9999").localeCompare(b.t.echeance || "9999");
  };

  filteredTasks.sort(sortTasks);

  // Pagination
  const totalItems = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const activePage = Math.min(page, totalPages - 1);
  const paginatedTasks = filteredTasks.slice(activePage * perPage, (activePage + 1) * perPage);

  // Quick stats computed
  const termCount = filteredTasks.filter(o => o.t.statut === "Terminé").length;
  const activeCount = filteredTasks.filter(o => o.t.statut !== "Terminé").length;
  const p1Count = filteredTasks.filter(o => o.t.prio === "P1" && o.t.statut !== "Terminé").length;
  const avgProg = totalItems ? Math.round(filteredTasks.reduce((sum, o) => sum + (o.t.prog || 0), 0) / totalItems) : 0;

  // Task form fill helper
  const handleGEFill = (geId: string) => {
    setFormGe(geId);
    const g = db.parc.find(x => x.id === geId);
    if (g) {
      setFormClient(g.client || "");
      setFormSite(g.site || "");
    }
  };

  const triggerAddTache = () => {
    setFormTitre("");
    setFormType("Vidange");
    setFormStatut("Non commencé");
    setFormPrio("P3");
    setFormGe("");
    setFormClient("");
    setFormSite("");
    setFormDdemande(todayYMD());
    setFormEcheance("");
    setFormAssigne("");
    setFormProg(0);
    setFormNotes("");
    setShowAddModal(true);
  };

  const handleSaveAddTask = () => {
    if (!formTitre) {
      alert("L'intitulé de la prestation est requis.");
      return;
    }
    const cleanGe = (formGe.split(" — ")[0] || "").trim();
    onAddTask({
      id: "T" + Date.now(),
      titre: formTitre,
      type: formType,
      statut: formStatut,
      prio: formPrio,
      cat: "Maintenance",
      ge: cleanGe,
      client: formClient,
      site: formSite,
      echeance: formEcheance,
      assigne: formAssigne,
      etiquette: cleanGe || "ADMIN",
      prog: formProg,
      notes: formNotes,
      dreal: formStatut === "Terminé" ? todayYMD() : null,
      msgs: [],
      log: [{ t: new Date().toISOString(), a: "Intervention créée" }]
    });
    setShowAddModal(false);
  };

  const triggerEditTache = (idx: number) => {
    const t = db.taches[idx];
    if (!t) return;
    setActiveEditIdx(idx);
    setFormTitre(t.titre || "");
    setFormType(t.type || "Vidange");
    setFormStatut(t.statut || "Non commencé");
    setFormPrio(t.prio || "P3");
    setFormGe(t.ge || "");
    setFormClient(t.client || "");
    setFormSite(t.site || "");
    setFormDdemande(t.ddemande || t.dcrea || todayYMD());
    setFormEcheance(t.echeance || "");
    setFormAssigne(t.assigne || "");
    setFormProg(t.prog || 0);
    setFormNotes(t.notes || "");
    setShowEditModal(true);
  };

  const handleSaveEditTask = () => {
    if (activeEditIdx === null) return;
    const t = db.taches[activeEditIdx];
    const cleanGe = (formGe.split(" — ")[0] || "").trim();

    const updated: Partial<Task> = {
      titre: formTitre,
      type: formType,
      statut: formStatut,
      prio: formPrio,
      ge: cleanGe,
      client: formClient,
      site: formSite,
      ddemande: formDdemande,
      echeance: formEcheance,
      assigne: formAssigne,
      prog: formProg,
      notes: formNotes
    };

    if (formStatut === "Terminé") {
      updated.prog = 100;
      if (!t.dreal) updated.dreal = todayYMD();
    } else if (formStatut === "Non commencé") {
      updated.prog = 0;
    }

    // Add log entry
    const changes: string[] = [];
    if (t.titre !== formTitre) changes.push("intitulé");
    if (t.statut !== formStatut) changes.push(`statut (${t.statut} ➜ ${formStatut})`);
    if (t.prog !== formProg) changes.push(`progression (${t.prog}% ➜ ${formProg}%)`);
    if (t.assigne !== formAssigne) changes.push("technicien");

    const log = t.log ? [...t.log] : [];
    if (changes.length) {
      log.unshift({
        t: new Date().toISOString(),
        a: `Modifications : ${changes.join(", ")}`
      });
    }

    updated.log = log;

    onUpdateTask(activeEditIdx, updated);
    setShowEditModal(false);
    setActiveEditIdx(null);
  };

  const triggerLogModal = (idx: number) => {
    const t = db.taches[idx];
    if (t) {
      setActiveLogList(t.log || []);
      setActiveLogTitle(`${t.id || "—"} — ${t.titre}`);
      setShowLogModal(true);
    }
  };

  const triggerMsgModal = (idx: number) => {
    const t = db.taches[idx];
    if (t) {
      setActiveMsgIdx(idx);
      setShowMsgModal(true);
    }
  };

  const handleSendMsg = () => {
    if (activeMsgIdx === null || !msgTxt) return;
    const t = db.taches[activeMsgIdx];
    const msgs = t.msgs ? [...t.msgs] : [];
    const who = msgWho.trim() || "Anonyme";
    localStorage.setItem("gmao_msg_who", who);

    msgs.push({
      who,
      txt: msgTxt,
      t: new Date().toISOString()
    });

    const log = t.log ? [...t.log] : [];
    log.unshift({
      t: new Date().toISOString(),
      a: `Note / Commentaire ajouté par ${who}`
    });

    onUpdateTask(activeMsgIdx, { msgs, log });
    setFormMsgTxt("");
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 1 ? -1 : 1);
    } else {
      setSortCol(col);
      setSortDir(1);
    }
  };

  const handleQuickFinish = (idx: number) => {
    if (confirm("Clôturer définitivement cette intervention ?")) {
      const t = db.taches[idx];
      const log = t.log ? [...t.log] : [];
      log.unshift({ t: new Date().toISOString(), a: "Clôture rapide (100% terminé)" });
      onUpdateTask(idx, { statut: "Terminé", prog: 100, dreal: todayYMD(), log });
    }
  };

  const exportCSV = () => {
    const head = ["ID", "Priorite", "Client", "Site", "Prestation", "Type", "Statut", "Date demande", "Echeance", "Technicien", "GE Code", "Progression %", "Notes"];
    const rows = filteredTasks.map(o => {
      const t = o.t;
      return [t.id, t.prio, t.client, t.site, t.titre, t.type, t.statut, _ddemande(t), t.echeance, t.assigne, t.ge, t.prog, t.notes];
    });

    const csvContent = "\ufeff" + [head, ...rows].map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `interventions_${todayYMD()}.csv`;
    link.click();
  };

  const statColors: { [key: string]: string } = {
    "Non commencé": "text-slate-500 bg-slate-100",
    "En cours": "text-blue-700 bg-blue-100",
    "En attente": "text-amber-700 bg-amber-100",
    "Bloqué": "text-red-700 bg-red-100",
    "Terminé": "text-green-700 bg-green-100"
  };

  const prioColors: { [key: string]: string } = {
    "P1": "bg-red-600 text-white",
    "P2": "bg-amber-500 text-white",
    "P3": "bg-blue-500 text-white",
    "P4": "bg-slate-400 text-white"
  };

  const countEnCours = db.taches.filter(t => t.statut === "En cours").length || 3;
  const countPlanifiee = db.taches.filter(t => t.statut !== "Terminé" && t.statut !== "En cours").length || 7;
  const totalActiveTimeline = countEnCours + countPlanifiee;
  const pctEnCours = totalActiveTimeline ? Math.round((countEnCours / totalActiveTimeline) * 100) : 35;
  const pctPlanifiee = 100 - pctEnCours;

  return (
    <div id="taches" className="space-y-6">
      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-slate-700">
          <div className="text-2xl font-extrabold text-slate-800">{totalItems}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Total Interventions</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
          <div className="text-2xl font-extrabold text-red-600">{p1Count}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Urgent / P1</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-600">
          <div className="text-2xl font-extrabold text-blue-600">{activeCount}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Actives</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
          <div className="text-2xl font-extrabold text-green-600">{termCount}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Terminées</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-purple-600">
          <div className="text-2xl font-extrabold text-purple-600">{avgProg}%</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Progression moyenne</div>
        </div>
      </div>

      {/* Houltu Visual Timeline Segment */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
        <div className="flex justify-between items-center text-xs font-black text-slate-800 uppercase tracking-wider pl-1 font-sans">
          <span>📈 Suivi de Progression Opérationnelle (Timeline)</span>
          <span className="text-[10px] text-orange-600 font-black animate-pulse bg-orange-50 px-2 py-0.5 rounded-full">★ SYNC EXCEL LIVE</span>
        </div>

        {/* Avatars above timeline */}
        <div className="relative h-10 w-full hidden sm:block">
          <div className="absolute left-[15%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white shadow-sm" title="Arthur">AR</span>
            <span className="text-[8px] text-slate-400 font-black leading-none">▼</span>
          </div>
          <div className="absolute left-[40%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white shadow-sm" title="Jean">JN</span>
            <span className="text-[8px] text-slate-400 font-black leading-none">▼</span>
          </div>
          <div className="absolute left-[65%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white shadow-sm" title="Christophe">CH</span>
            <span className="text-[8px] text-slate-400 font-black leading-none">▼</span>
          </div>
          <div className="absolute left-[85%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white shadow-sm" title="Pierre">PR</span>
            <span className="text-[8px] text-slate-400 font-black leading-none">▼</span>
          </div>
        </div>

        {/* The Bar */}
        <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-xs border border-slate-200">
          {/* En cours */}
          <div 
            className="bg-striped-gray flex items-center justify-center text-white font-black text-[11px] uppercase tracking-wider transition-all duration-300"
            style={{ width: `${pctEnCours}%` }}
          >
            <span>En cours ({countEnCours})</span>
          </div>
          {/* Planifiée */}
          <div 
            className="bg-striped-red-orange flex items-center justify-center text-white font-black text-[11px] uppercase tracking-wider transition-all duration-300"
            style={{ width: `${pctPlanifiee}%` }}
          >
            <span>Planifiée ({countPlanifiee})</span>
          </div>
        </div>

        {/* Index Numbers underneath */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold px-2">
          <span>0 (INITIAL)</span>
          <span>{countEnCours} EN PROGRÈS</span>
          <span>{countEnCours + countPlanifiee} TOTAL ACTIVES</span>
        </div>
      </div>

      {/* Search & Filter bar inspired by Huoltu */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="🔎 Rechercher ici avec plusieurs valeurs séparées par des espaces (ET)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
          />

          <select
            value={filtStatut}
            onChange={(e) => setFiltStatut(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Tous statuts</option>
            <option value="Non commencé">Non commencé</option>
            <option value="En cours">En cours</option>
            <option value="En attente">En attente</option>
            <option value="Bloqué">Bloqué</option>
            <option value="Terminé">Terminé</option>
          </select>

          <select
            value={filtMois}
            onChange={(e) => setFiltMois(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Tous les mois</option>
            {monthsKeys.map((mk, i) => (
              <option key={i} value={mk}>
                {mk}
              </option>
            ))}
          </select>

          <button
            onClick={triggerAddTache}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black cursor-pointer transition-colors shadow-sm"
          >
            + Nouvelle intervention
          </button>
        </div>
        <p className="text-[11px] text-slate-400 font-medium pl-1">
          💡 Affiner votre recherche en espaçant les mots avec un espace. <span className="font-bold text-slate-600">{filteredTasks.length}</span> éléments affichés / un total de <span className="font-bold text-slate-600">{db.taches.length}</span> | Page {activePage + 1} / {totalPages}
        </p>
      </div>

      {/* Toolbar Options Export / Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold cursor-pointer"
          >
            ⬇️ CSV
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Lignes :</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="px-1.5 py-1 border border-slate-200 bg-white rounded-md focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="99999">Toutes</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Page {activePage + 1} / {totalPages} · {totalItems} task(s)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={activePage === 0}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold cursor-pointer"
            >
              ‹ Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={activePage >= totalPages - 1}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold cursor-pointer"
            >
              Suivant ›
            </button>
          </div>
        </div>
      </div>

      {/* Main tasks list */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th onClick={() => toggleSort("prio")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Priorité {sortCol === "prio" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th onClick={() => toggleSort("num")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Num {sortCol === "num" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th onClick={() => toggleSort("site")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Site {sortCol === "site" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th className="px-4 py-3 text-left font-semibold">Prestation(s)</th>
                <th onClick={() => toggleSort("type")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Type {sortCol === "type" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th onClick={() => toggleSort("statut")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Statut {sortCol === "statut" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th onClick={() => toggleSort("ddemande")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Demande {sortCol === "ddemande" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th onClick={() => toggleSort("assigne")} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-slate-600">Intervenant {sortCol === "assigne" ? (sortDir > 0 ? "▲" : "▼") : "↕"}</th>
                <th className="px-4 py-3 text-left font-semibold">Progression</th>
                <th className="px-4 py-3 text-center font-semibold">Log</th>
                <th className="px-4 py-3 text-center font-semibold">Msg</th>
                <th className="px-4 py-3 text-center font-semibold">Modif</th>
                <th className="px-4 py-3 text-center font-semibold">Clôture</th>
                <th className="px-4 py-3 text-center font-semibold">X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length > 0 ? (
                paginatedTasks.map(({ t, idx }) => {
                  const isP1Active = t.prio === "P1" && t.statut !== "Terminé";
                  const nMsg = t.msgs?.length || 0;

                  return (
                    <tr key={idx} className={`hover:bg-slate-50/50 ${isP1Active ? "bg-red-50/20" : ""}`}>
                      <td className="px-4 py-3">
                        {isP1Active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase animate-pulse">
                            ☐ URGENTE
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prioColors[t.prio] || "bg-slate-400 text-white"}`}>
                            {t.prio}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{t.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold block text-slate-700">{t.client}</span>
                        <span className="text-xs text-slate-400 font-medium block">{t.site}</span>
                      </td>
                      <td className="px-4 py-3 leading-normal">
                        <span className="font-semibold text-slate-700">{t.titre}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.type && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">🏷️ {t.type}</span>}
                          {t.ge && <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">🔧 {t.ge}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600">{t.type}</td>
                      <td className="px-4 py-3">
                        <select
                          value={t.statut}
                          onChange={(e) => onUpdateTask(idx, { statut: e.target.value })}
                          className={`px-2 py-1 rounded-md text-xs font-bold ${statColors[t.statut] || "bg-slate-100"} border-0 focus:outline-none cursor-pointer`}
                        >
                          <option value="Non commencé">Non commencé</option>
                          <option value="En cours">En cours</option>
                          <option value="En attente">En attente</option>
                          <option value="Bloqué">Bloqué</option>
                          <option value="Terminé">Terminé</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{fmt(_ddemande(t))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: getAvatarColor(t.assigne) }}
                          >
                            {getAvatarInitials(t.assigne)}
                          </span>
                          <span className="text-xs font-medium text-slate-600 leading-tight block truncate max-w-[90px]">{t.assigne || "Non assigné"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border">
                          <div
                            className="bg-blue-600 h-2"
                            style={{ width: `${t.prog || 0}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1">{t.prog || 0}%</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => triggerLogModal(idx)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                          title="Historique modifications"
                        >
                          🕘
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => triggerMsgModal(idx)}
                          className="w-8 h-8 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-xs relative cursor-pointer"
                        >
                          💬
                          {nMsg > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                              {nMsg}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => triggerEditTache(idx)}
                          className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center cursor-pointer"
                        >
                          ✏️
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.statut === "Terminé" ? (
                          <span className="text-green-600 font-bold text-lg">✔</span>
                        ) : (
                          <button
                            onClick={() => handleQuickFinish(idx)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md cursor-pointer"
                          >
                            Terminer
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onDeleteTask(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-lg cursor-pointer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Aucune intervention trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL Add Task */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">➕ Nouvelle intervention</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Intitulé / prestation *</label>
                <input type="text" value={formTitre} onChange={(e) => setFormTitre(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Saisir l'action à réaliser…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Statut</label>
                  <select value={formStatut} onChange={(e) => setFormStatut(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option>Non commencé</option>
                    <option>En cours</option>
                    <option>En attente</option>
                    <option>Bloqué</option>
                    <option>Terminé</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Priorité</label>
                  <select value={formPrio} onChange={(e) => setFormPrio(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option>P1</option>
                    <option>P2</option>
                    <option>P3</option>
                    <option>P4</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Groupe Électrogène</label>
                <select
                  value={formGe}
                  onChange={(e) => handleGEFill(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">— Aucun GE précis —</option>
                  {db.parc.map(g => (
                    <option key={g.id} value={g.id}>{g.id} — {g.client} / {g.site}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Client</label>
                  <input type="text" value={formClient} onChange={(e) => setFormClient(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Site</label>
                  <input type="text" value={formSite} onChange={(e) => setFormSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Type prestation</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    {TTYPES.map((x, i) => (
                      <option key={i}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Date demande</label>
                  <input type="date" value={formDdemande} onChange={(e) => setFormDdemande(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Échéance</label>
                  <input type="date" value={formEcheance} onChange={(e) => setFormEcheance(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Technicien / Intervenant</label>
                  <input type="text" value={formAssigne} onChange={(e) => setFormAssigne(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" list="techlist" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Progression (%)</label>
                  <input type="number" min="0" max="100" value={formProg} onChange={(e) => setFormProg(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Notes / Obs</label>
                  <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Précisions de terrain…" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button onClick={handleSaveAddTask} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Edit Task */}
      {showEditModal && activeEditIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">✏️ Modifier l'intervention</h3>
              <button onClick={() => setShowEditModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Intitulé / prestation</label>
                <input type="text" value={formTitre} onChange={(e) => setNewPlanTitre(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" id="m_titre" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Statut</label>
                  <select value={formStatut} onChange={(e) => setFormStatut(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option>Non commencé</option>
                    <option>En cours</option>
                    <option>En attente</option>
                    <option>Bloqué</option>
                    <option>Terminé</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Priorité</label>
                  <select value={formPrio} onChange={(e) => setFormPrio(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option>P1</option>
                    <option>P2</option>
                    <option>P3</option>
                    <option>P4</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">GE concerné</label>
                <select value={formGe} onChange={(e) => handleGEFill(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="">— Aucun GE précis —</option>
                  {db.parc.map(g => (
                    <option key={g.id} value={g.id}>{g.id} — {g.client} / {g.site}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Client</label>
                  <input type="text" value={formClient} onChange={(e) => setFormClient(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Site</label>
                  <input type="text" value={formSite} onChange={(e) => setFormSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Type prestation</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    {TTYPES.map((x, i) => (
                      <option key={i}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Date demande</label>
                  <input type="date" value={formDdemande} onChange={(e) => setFormDdemande(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Échéance</label>
                  <input type="date" value={formEcheance} onChange={(e) => setFormEcheance(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Intervenant</label>
                  <input type="text" value={formAssigne} onChange={(e) => setFormAssigne(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" list="techlist" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Progression (%)</label>
                  <input type="number" min="0" max="100" value={formProg} onChange={(e) => setFormProg(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Notes / Obs</label>
                  <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button onClick={handleSaveEditTask} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL History Log */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">🕘 Historique de modifications</h3>
              <button onClick={() => setShowLogModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="font-bold text-slate-800 text-xs uppercase">{activeLogTitle}</p>
              {activeLogList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activeLogList.map((evt, i) => (
                    <div key={i} className="py-2.5 text-sm text-slate-700">
                      <div className="font-medium">{evt.a}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{new Date(evt.t).toLocaleString("fr-FR")}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-4">Aucune trace de modification.</p>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Message Thread */}
      {showMsgModal && activeMsgIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-md">💬 Notes de l'intervention</h3>
              <button onClick={() => setShowMsgModal(false)} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="font-bold text-slate-800 text-xs uppercase">
                {db.taches[activeMsgIdx]?.id} — {db.taches[activeMsgIdx]?.titre}
              </p>
              <div className="bg-slate-50 border rounded-xl p-3 h-[240px] overflow-y-auto flex flex-col space-y-2">
                {(db.taches[activeMsgIdx]?.msgs || []).length > 0 ? (
                  (db.taches[activeMsgIdx].msgs || []).map((m, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg shadow-2xs border border-slate-100 flex flex-col space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>👤 {m.who}</span>
                        <span>{new Date(m.t).toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">{m.txt}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs text-center my-auto">Aucun commentaire de terrain. Laissez votre première note.</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col space-y-1 col-span-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Votre nom</label>
                  <input type="text" value={msgWho} onChange={(e) => setFormMsgWho(e.target.value)} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white" list="techlist" />
                </div>
                <div className="flex flex-col space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Message</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={msgTxt}
                      onChange={(e) => setFormMsgTxt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendMsg(); }}
                      className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                      placeholder="Commentaire…"
                    />
                    <button onClick={handleSendMsg} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold cursor-pointer">Envoyer</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t">
              <button onClick={() => setShowMsgModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-100 cursor-pointer">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help helper to change title
function setNewPlanTitre(v: string) {
  const el = document.getElementById("te_titre") as HTMLInputElement;
  if (el) el.value = v;
}

function _ddemande(t: Task): string {
  return t.ddemande || t.dreal || "";
}
