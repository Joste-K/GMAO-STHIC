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

  // New custom fields state
  const [formVisibiliteClient, setFormVisibiliteClient] = useState(true);
  const [formEmailAvisClient, setFormEmailAvisClient] = useState(false);
  const [formEmailPlanifClient, setFormEmailPlanifClient] = useState(false);
  const [formMotif, setFormMotif] = useState("");
  const [formNomDemandeur, setFormNomDemandeur] = useState("");
  const [formTelDemandeur, setFormTelDemandeur] = useState("");
  const [formNumCommande, setFormNumCommande] = useState("");
  const [formObservation, setFormObservation] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formFac, setFormFac] = useState("Maintenance");
  const [formSociete, setFormSociete] = useState("");
  const [formPrestations, setFormPrestations] = useState("");
  const [formInstallationEquipement, setFormInstallationEquipement] = useState("");
  const [formAttente, setFormAttente] = useState(false);
  const [formSource, setFormSource] = useState("");
  const [formDebutIntervention, setFormDebutIntervention] = useState("");
  const [formFinIntervention, setFormFinIntervention] = useState("");
  const [formPlanningDetaille, setFormPlanningDetaille] = useState(false);
  const [formIntervenants, setFormIntervenants] = useState("");

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

    // Initialize custom fields
    setFormVisibiliteClient(true);
    setFormEmailAvisClient(false);
    setFormEmailPlanifClient(false);
    setFormMotif("");
    setFormNomDemandeur("");
    setFormTelDemandeur("");
    setFormNumCommande("");
    setFormObservation("");
    setFormPhoto("");
    setFormFac("Maintenance");
    setFormSociete("");
    setFormPrestations("");
    setFormInstallationEquipement("");
    setFormAttente(false);
    setFormSource("");
    setFormDebutIntervention("");
    setFormFinIntervention("");
    setFormPlanningDetaille(false);
    setFormIntervenants("");

    setShowAddModal(true);
  };

  const handleSaveAddTask = () => {
    if (!formTitre && !formMotif) {
      alert("L'intitulé ou le motif de l'intervention est requis.");
      return;
    }
    const cleanGe = (formGe.split(" — ")[0] || "").trim();
    onAddTask({
      id: "T" + Date.now(),
      titre: formTitre || formMotif || "Nouvelle intervention",
      type: formType,
      statut: formStatut,
      prio: formPrio,
      cat: "Maintenance",
      ge: cleanGe,
      client: formClient,
      site: formSite,
      echeance: formEcheance || formFinIntervention || todayYMD(),
      assigne: formIntervenants || formAssigne || "Non assigné",
      etiquette: cleanGe || "ADMIN",
      prog: formProg,
      notes: formNotes || formObservation || "",
      dreal: formStatut === "Terminé" ? todayYMD() : null,
      msgs: [],
      log: [{ t: new Date().toISOString(), a: "Intervention créée" }],

      // Custom fields saved
      visibiliteClient: formVisibiliteClient,
      emailAvisClient: formEmailAvisClient,
      emailPlanifClient: formEmailPlanifClient,
      motif: formMotif,
      nomDemandeur: formNomDemandeur,
      telDemandeur: formTelDemandeur,
      numCommande: formNumCommande,
      observation: formObservation,
      photo: formPhoto,
      fac: formFac,
      societe: formSociete,
      prestations: formPrestations,
      installationEquipement: formInstallationEquipement,
      attente: formAttente,
      source: formSource,
      debutIntervention: formDebutIntervention,
      finIntervention: formFinIntervention,
      planningDetaille: formPlanningDetaille,
      intervenants: formIntervenants || formAssigne
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

    // Populate custom fields (handling default values)
    setFormVisibiliteClient(t.visibiliteClient !== undefined ? t.visibiliteClient : true);
    setFormEmailAvisClient(!!t.emailAvisClient);
    setFormEmailPlanifClient(!!t.emailPlanifClient);
    setFormMotif(t.motif || t.titre || "");
    setFormNomDemandeur(t.nomDemandeur || "");
    setFormTelDemandeur(t.telDemandeur || "");
    setFormNumCommande(t.numCommande || "");
    setFormObservation(t.observation || t.notes || "");
    setFormPhoto(t.photo || "");
    setFormFac(t.fac || "Maintenance");
    setFormSociete(t.societe || "");
    setFormPrestations(t.prestations || "");
    setFormInstallationEquipement(t.installationEquipement || "");
    setFormAttente(!!t.attente);
    setFormSource(t.source || "");
    setFormDebutIntervention(t.debutIntervention || "");
    setFormFinIntervention(t.finIntervention || "");
    setFormPlanningDetaille(!!t.planningDetaille);
    setFormIntervenants(t.intervenants || t.assigne || "");

    setShowEditModal(true);
  };

  const handleSaveEditTask = () => {
    if (activeEditIdx === null) return;
    const t = db.taches[activeEditIdx];
    const cleanGe = (formGe.split(" — ")[0] || "").trim();

    const updated: Partial<Task> = {
      titre: formTitre || formMotif || t.titre,
      type: formType,
      statut: formStatut,
      prio: formPrio,
      ge: cleanGe,
      client: formClient,
      site: formSite,
      ddemande: formDdemande,
      echeance: formEcheance || formFinIntervention || t.echeance,
      assigne: formIntervenants || formAssigne || t.assigne,
      prog: formProg,
      notes: formNotes || formObservation || t.notes,

      // Custom fields saved
      visibiliteClient: formVisibiliteClient,
      emailAvisClient: formEmailAvisClient,
      emailPlanifClient: formEmailPlanifClient,
      motif: formMotif,
      nomDemandeur: formNomDemandeur,
      telDemandeur: formTelDemandeur,
      numCommande: formNumCommande,
      observation: formObservation,
      photo: formPhoto,
      fac: formFac,
      societe: formSociete,
      prestations: formPrestations,
      installationEquipement: formInstallationEquipement,
      attente: formAttente,
      source: formSource,
      debutIntervention: formDebutIntervention,
      finIntervention: formFinIntervention,
      planningDetaille: formPlanningDetaille,
      intervenants: formIntervenants || formAssigne
    };

    if (formStatut === "Terminé") {
      updated.prog = 100;
      if (!t.dreal) updated.dreal = todayYMD();
    } else if (formStatut === "Non commencé") {
      updated.prog = 0;
    }

    // Add log entry
    const changes: string[] = [];
    if (t.titre !== (formTitre || formMotif)) changes.push("intitulé");
    if (t.statut !== formStatut) changes.push(`statut (${t.statut} ➜ ${formStatut})`);
    if (t.prog !== formProg) changes.push(`progression (${t.prog}% ➜ ${formProg}%)`);
    if ((t.assigne || "") !== (formIntervenants || formAssigne)) changes.push("technicien");

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

      {/* Visual Timeline Segment */}
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base tracking-tight uppercase flex items-center gap-2">
                <span className="text-blue-600">🛠️</span> AJOUTER UNE INTERVENTION
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors text-2xl font-semibold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Top switches row */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Visibilité client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Visibilité client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Permet au client de voir cette intervention sur son portail">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormVisibiliteClient(!formVisibiliteClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formVisibiliteClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formVisibiliteClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email avis client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Email avis client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Envoyer automatiquement un e-mail d'avis à la fin">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEmailAvisClient(!formEmailAvisClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formEmailAvisClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formEmailAvisClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email planification client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Email planification client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Informer le client par mail dès la planification">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEmailPlanifClient(!formEmailPlanifClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formEmailPlanifClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formEmailPlanifClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* Site client */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Site client <span className="text-red-500 font-bold">*</span>
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez le groupe ou saisissez le site d'intervention">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formGe}
                        onChange={(e) => {
                          const geVal = e.target.value;
                          handleGEFill(geVal);
                          if (geVal === "") {
                            setFormTitre("");
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Choisir un site / client...</option>
                        {db.parc.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.site} — {g.client} (GE: {g.id})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const promptSite = prompt("Saisir un nouveau nom de site client :");
                          if (promptSite) {
                            setFormSite(promptSite);
                            setFormClient("Nouveau Client");
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                        title="Ajouter un site temporaire"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Manual Site & Client detail inputs if no GE is linked */}
                  {!formGe && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 animate-in fade-in duration-150">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Société/Client</label>
                        <input
                          type="text"
                          value={formClient}
                          onChange={(e) => setFormClient(e.target.value)}
                          placeholder="Nom client"
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Site précis</label>
                        <input
                          type="text"
                          value={formSite}
                          onChange={(e) => setFormSite(e.target.value)}
                          placeholder="Localisation"
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Motif de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1">
                      <span>Motif de l'intervention</span>
                      <span className="text-amber-500 text-xs">⚠️</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formMotif}
                      onChange={(e) => {
                        setFormMotif(e.target.value);
                        if (!formTitre) setFormTitre(e.target.value.slice(0, 50));
                      }}
                      placeholder="Motif détaillé de l'intervention..."
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Type de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Type de l'intervention
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez le type préventif/curatif">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        {TTYPES.map((x, i) => (
                          <option key={i}>{x}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customType = prompt("Saisir un nouveau type d'intervention :");
                          if (customType) {
                            setFormType(customType);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Nom du demandeur & Tel du demandeur */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 uppercase">Nom du demandeur</label>
                      <input
                        type="text"
                        value={formNomDemandeur}
                        onChange={(e) => setFormNomDemandeur(e.target.value)}
                        placeholder="Nom du demandeur"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 uppercase">Tel du demandeur</label>
                      <input
                        type="text"
                        value={formTelDemandeur}
                        onChange={(e) => setFormTelDemandeur(e.target.value)}
                        placeholder="Tel du demandeur"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  {/* N° de commande */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">N° de commande</label>
                    <input
                      type="text"
                      value={formNumCommande}
                      onChange={(e) => setFormNumCommande(e.target.value)}
                      placeholder="N° de commande"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Observation */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Observation</label>
                    <textarea
                      rows={2}
                      value={formObservation}
                      onChange={(e) => setFormObservation(e.target.value)}
                      placeholder="Observation terrain ou consignes spéciales..."
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Priorité (Normal, Haute, Urgente) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Priorité</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Normal", "Haute", "Urgente"].map(p => {
                        const isSel = (p === "Normal" && formPrio === "P3") || (p === "Haute" && formPrio === "P2") || (p === "Urgente" && formPrio === "P1");
                        const colorClass = p === "Urgente" ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : p === "Haute" ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                        const selColorClass = p === "Urgente" ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200' : p === "Haute" ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200' : 'bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-300';
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              if (p === "Normal") setFormPrio("P3");
                              else if (p === "Haute") setFormPrio("P2");
                              else if (p === "Urgente") setFormPrio("P1");
                            }}
                            className={`py-2 px-3 text-xs font-bold border rounded-lg transition-all cursor-pointer ${isSel ? selColorClass : colorClass}`}
                          >
                            {p === "Urgente" ? "🚨 " : p === "Haute" ? "⚡ " : "👍 "}
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photo / Fichier */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Photo / Fichier</label>
                    <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white">
                      <label className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0">
                        Choisir un fichier...
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFormPhoto(file.name);
                          }}
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate flex-1 font-mono">
                        {formPhoto || "Aucun fichier sélectionné"}
                      </span>
                      {formPhoto && (
                        <button
                          type="button"
                          onClick={() => setFormPhoto("")}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold px-2 py-1 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                  {/* Société */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Société
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez l'entité cliente">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formSociete}
                        onChange={(e) => {
                          setFormSociete(e.target.value);
                          if (!formClient) setFormClient(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une société...</option>
                        {Array.from(new Set(db.parc.map(p => p.client).filter(Boolean))).map((cl, i) => (
                          <option key={i} value={cl || ""}>{cl}</option>
                        ))}
                        <option value="STHIC">STHIC</option>
                        <option value="TOTAL CONGO">TOTAL CONGO</option>
                        <option value="ENI CONGO">ENI CONGO</option>
                        <option value="TECNOSTREAM">TECNOSTREAM</option>
                        <option value="GMAO JOSTE">GMAO JOSTE</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const promptSoc = prompt("Saisir un nouveau nom de société :");
                          if (promptSoc) {
                            setFormSociete(promptSoc);
                            if (!formClient) setFormClient(promptSoc);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Prestation(s) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Prestation(s)
                        <span className="text-slate-400 cursor-help text-[10px]" title="Définir la nature de la prestation">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formPrestations}
                        onChange={(e) => {
                          setFormPrestations(e.target.value);
                          if (!formTitre) setFormTitre(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une prestation...</option>
                        <option value="Maintenance Préventive standard">Maintenance Préventive standard</option>
                        <option value="Vidange et Remplacement Filtres">Vidange et Remplacement Filtres</option>
                        <option value="Diagnostic Panne Electrique">Diagnostic Panne Electrique</option>
                        <option value="Dépannage Mécanique Moteur">Dépannage Mécanique Moteur</option>
                        <option value="Remplacement de Batterie">Remplacement de Batterie</option>
                        <option value="Contrôle Mensuel & Essai à Vide">Contrôle Mensuel & Essai à Vide</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customPres = prompt("Saisir une nouvelle prestation :");
                          if (customPres) {
                            setFormPrestations(customPres);
                            if (!formTitre) setFormTitre(customPres);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Installation / matériel / équipement */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">
                      installation/matériel/équipement
                    </label>
                    <select
                      value={formInstallationEquipement}
                      onChange={(e) => setFormInstallationEquipement(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                    >
                      <option value="">Sélectionner une prestation</option>
                      <option value="Groupe Electrogène Principal">Groupe Electrogène Principal</option>
                      <option value="Armoire Inverseur Automatique">Armoire Inverseur Automatique</option>
                      <option value="Cuve à Carburant & Tuyauteries">Cuve à Carburant & Tuyauteries</option>
                      <option value="Batteries de Démarrage">Batteries de Démarrage</option>
                      <option value="Disjoncteur Général / Protection">Disjoncteur Général / Protection</option>
                    </select>
                  </div>

                  {/* Intervention en attente */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Intervention en attente</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormAttente(true);
                          setFormStatut("En attente");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          formAttente ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        OUI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormAttente(false);
                          if (formStatut === "En attente") setFormStatut("Non commencé");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          !formAttente ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        NON
                      </button>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Source
                        <span className="text-slate-400 cursor-help text-[10px]" title="Canal d'émission de l'intervention">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une source...</option>
                        <option value="Téléphone">Téléphone</option>
                        <option value="Email">Email</option>
                        <option value="Portail Client">Portail Client</option>
                        <option value="Contrôle de Routine">Contrôle de Routine</option>
                        <option value="Joste Assistant AI">Joste Assistant AI</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customSrc = prompt("Saisir un nouveau canal source :");
                          if (customSrc) {
                            setFormSource(customSrc);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Début de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Début de l'intervention
                        <span className="text-slate-400 cursor-help text-[10px]" title="Date et heure prévues de début">❓</span>
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formDebutIntervention}
                      onChange={(e) => {
                        setFormDebutIntervention(e.target.value);
                        if (!formDdemande) setFormDdemande(e.target.value.split("T")[0] || todayYMD());
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-800"
                    />
                  </div>

                  {/* Fin de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Fin de l'intervention</label>
                    <input
                      type="datetime-local"
                      value={formFinIntervention}
                      onChange={(e) => {
                        setFormFinIntervention(e.target.value);
                        if (!formEcheance) setFormEcheance(e.target.value.split("T")[0] || "");
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-800"
                    />
                  </div>

                  {/* Planning détaillé */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Planning détaillé</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPlanningDetaille(true)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          formPlanningDetaille ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        OUI
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPlanningDetaille(false)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          !formPlanningDetaille ? 'bg-slate-700 text-white border-slate-700 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        NON
                      </button>
                    </div>
                  </div>

                  {/* Intervenant(s) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Intervenant(s)</label>
                    <input
                      type="text"
                      value={formIntervenants}
                      onChange={(e) => {
                        setFormIntervenants(e.target.value);
                        setFormAssigne(e.target.value);
                      }}
                      placeholder="Nom de l'intervenant / technicien (ex: Jean, Koffi, Joste)"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      list="techlist"
                    />
                  </div>

                  {/* Fac / Facturation */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Facturation (Fac)</label>
                    <select
                      value={formFac}
                      onChange={(e) => setFormFac(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                    >
                      <option value="A facturer">A facturer</option>
                      <option value="Sous Garantie">Sous Garantie</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Non facturable">Non facturable</option>
                      <option value="Facturée">Facturée</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Title input (Hidden or preset with action description) */}
              <div className="pt-4 border-t border-slate-200/60 flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Désignation synthétique pour planning / calendrier</label>
                <input
                  type="text"
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  placeholder="Intitulé concis de l'action GMAO..."
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-4 flex justify-end gap-2 border-t shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAddTask}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-200"
              >
                Enregistrer l'Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Edit Task */}
      {showEditModal && activeEditIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base tracking-tight uppercase flex items-center gap-2">
                <span className="text-amber-500">✏️</span> MODIFIER L'INTERVENTION
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors text-2xl font-semibold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Top switches row */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Visibilité client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Visibilité client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Permet au client de voir cette intervention sur son portail">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormVisibiliteClient(!formVisibiliteClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formVisibiliteClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formVisibiliteClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email avis client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Email avis client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Envoyer automatiquement un e-mail d'avis à la fin">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEmailAvisClient(!formEmailAvisClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formEmailAvisClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formEmailAvisClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email planification client */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>Email planification client</span>
                  <span className="text-slate-400 cursor-help text-[10px]" title="Informer le client par mail dès la planification">❓</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEmailPlanifClient(!formEmailPlanifClient)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formEmailPlanifClient ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formEmailPlanifClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* Site client */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Site client <span className="text-red-500 font-bold">*</span>
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez le groupe ou saisissez le site d'intervention">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formGe}
                        onChange={(e) => {
                          const geVal = e.target.value;
                          handleGEFill(geVal);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Choisir un site / client...</option>
                        {db.parc.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.site} — {g.client} (GE: {g.id})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const promptSite = prompt("Saisir un nouveau nom de site client :");
                          if (promptSite) {
                            setFormSite(promptSite);
                            setFormClient("Client Modifié");
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                        title="Modifier le nom du site"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Manual Site & Client detail inputs if no GE is linked */}
                  {!formGe && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 animate-in fade-in duration-150">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Société/Client</label>
                        <input
                          type="text"
                          value={formClient}
                          onChange={(e) => setFormClient(e.target.value)}
                          placeholder="Nom client"
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Site précis</label>
                        <input
                          type="text"
                          value={formSite}
                          onChange={(e) => setFormSite(e.target.value)}
                          placeholder="Localisation"
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Motif de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1">
                      <span>Motif de l'intervention</span>
                      <span className="text-amber-500 text-xs">⚠️</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formMotif}
                      onChange={(e) => setFormMotif(e.target.value)}
                      placeholder="Motif détaillé de l'intervention..."
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Type de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Type de l'intervention
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez le type préventif/curatif">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        {TTYPES.map((x, i) => (
                          <option key={i}>{x}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customType = prompt("Saisir un nouveau type d'intervention :");
                          if (customType) {
                            setFormType(customType);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Nom du demandeur & Tel du demandeur */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 uppercase">Nom du demandeur</label>
                      <input
                        type="text"
                        value={formNomDemandeur}
                        onChange={(e) => setFormNomDemandeur(e.target.value)}
                        placeholder="Nom du demandeur"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 uppercase">Tel du demandeur</label>
                      <input
                        type="text"
                        value={formTelDemandeur}
                        onChange={(e) => setFormTelDemandeur(e.target.value)}
                        placeholder="Tel du demandeur"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  {/* N° de commande */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">N° de commande</label>
                    <input
                      type="text"
                      value={formNumCommande}
                      onChange={(e) => setFormNumCommande(e.target.value)}
                      placeholder="N° de commande"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Observation */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Observation</label>
                    <textarea
                      rows={2}
                      value={formObservation}
                      onChange={(e) => setFormObservation(e.target.value)}
                      placeholder="Observation terrain ou consignes spéciales..."
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Priorité (Normal, Haute, Urgente) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Priorité</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Normal", "Haute", "Urgente"].map(p => {
                        const isSel = (p === "Normal" && formPrio === "P3") || (p === "Haute" && formPrio === "P2") || (p === "Urgente" && formPrio === "P1");
                        const colorClass = p === "Urgente" ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : p === "Haute" ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                        const selColorClass = p === "Urgente" ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200' : p === "Haute" ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200' : 'bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-300';
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              if (p === "Normal") setFormPrio("P3");
                              else if (p === "Haute") setFormPrio("P2");
                              else if (p === "Urgente") setFormPrio("P1");
                            }}
                            className={`py-2 px-3 text-xs font-bold border rounded-lg transition-all cursor-pointer ${isSel ? selColorClass : colorClass}`}
                          >
                            {p === "Urgente" ? "🚨 " : p === "Haute" ? "⚡ " : "👍 "}
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photo / Fichier */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Photo / Fichier</label>
                    <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white">
                      <label className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0">
                        Choisir un fichier...
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFormPhoto(file.name);
                          }}
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate flex-1 font-mono">
                        {formPhoto || "Aucun fichier sélectionné"}
                      </span>
                      {formPhoto && (
                        <button
                          type="button"
                          onClick={() => setFormPhoto("")}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold px-2 py-1 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                  {/* Société */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Société
                        <span className="text-slate-400 cursor-help text-[10px]" title="Sélectionnez l'entité cliente">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formSociete}
                        onChange={(e) => {
                          setFormSociete(e.target.value);
                          if (!formClient) setFormClient(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une société...</option>
                        {Array.from(new Set(db.parc.map(p => p.client).filter(Boolean))).map((cl, i) => (
                          <option key={i} value={cl || ""}>{cl}</option>
                        ))}
                        <option value="STHIC">STHIC</option>
                        <option value="TOTAL CONGO">TOTAL CONGO</option>
                        <option value="ENI CONGO">ENI CONGO</option>
                        <option value="TECNOSTREAM">TECNOSTREAM</option>
                        <option value="GMAO JOSTE">GMAO JOSTE</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const promptSoc = prompt("Saisir un nouveau nom de société :");
                          if (promptSoc) {
                            setFormSociete(promptSoc);
                            if (!formClient) setFormClient(promptSoc);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Prestation(s) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Prestation(s)
                        <span className="text-slate-400 cursor-help text-[10px]" title="Définir la nature de la prestation">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formPrestations}
                        onChange={(e) => {
                          setFormPrestations(e.target.value);
                          if (!formTitre) setFormTitre(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une prestation...</option>
                        <option value="Maintenance Préventive standard">Maintenance Préventive standard</option>
                        <option value="Vidange et Remplacement Filtres">Vidange et Remplacement Filtres</option>
                        <option value="Diagnostic Panne Electrique">Diagnostic Panne Electrique</option>
                        <option value="Dépannage Mécanique Moteur">Dépannage Mécanique Moteur</option>
                        <option value="Remplacement de Batterie">Remplacement de Batterie</option>
                        <option value="Contrôle Mensuel & Essai à Vide">Contrôle Mensuel & Essai à Vide</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customPres = prompt("Saisir une nouvelle prestation :");
                          if (customPres) {
                            setFormPrestations(customPres);
                            if (!formTitre) setFormTitre(customPres);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Installation / matériel / équipement */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">
                      installation/matériel/équipement
                    </label>
                    <select
                      value={formInstallationEquipement}
                      onChange={(e) => setFormInstallationEquipement(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                    >
                      <option value="">Sélectionner une prestation</option>
                      <option value="Groupe Electrogène Principal">Groupe Electrogène Principal</option>
                      <option value="Armoire Inverseur Automatique">Armoire Inverseur Automatique</option>
                      <option value="Cuve à Carburant & Tuyauteries">Cuve à Carburant & Tuyauteries</option>
                      <option value="Batteries de Démarrage">Batteries de Démarrage</option>
                      <option value="Disjoncteur Général / Protection">Disjoncteur Général / Protection</option>
                    </select>
                  </div>

                  {/* Intervention en attente */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Intervention en attente</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormAttente(true);
                          setFormStatut("En attente");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          formAttente ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        OUI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormAttente(false);
                          if (formStatut === "En attente") setFormStatut("Non commencé");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          !formAttente ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        NON
                      </button>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Source
                        <span className="text-slate-400 cursor-help text-[10px]" title="Canal d'émission de l'intervention">❓</span>
                      </span>
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                      >
                        <option value="">Sélectionner une source...</option>
                        <option value="Téléphone">Téléphone</option>
                        <option value="Email">Email</option>
                        <option value="Portail Client">Portail Client</option>
                        <option value="Contrôle de Routine">Contrôle de Routine</option>
                        <option value="Joste Assistant AI">Joste Assistant AI</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const customSrc = prompt("Saisir un nouveau canal source :");
                          if (customSrc) {
                            setFormSource(customSrc);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Début de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Début de l'intervention
                        <span className="text-slate-400 cursor-help text-[10px]" title="Date et heure prévues de début">❓</span>
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formDebutIntervention}
                      onChange={(e) => {
                        setFormDebutIntervention(e.target.value);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-800"
                    />
                  </div>

                  {/* Fin de l'intervention */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Fin de l'intervention</label>
                    <input
                      type="datetime-local"
                      value={formFinIntervention}
                      onChange={(e) => {
                        setFormFinIntervention(e.target.value);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-800"
                    />
                  </div>

                  {/* Planning détaillé */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Planning détaillé</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPlanningDetaille(true)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          formPlanningDetaille ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        OUI
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPlanningDetaille(false)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          !formPlanningDetaille ? 'bg-slate-700 text-white border-slate-700 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        NON
                      </button>
                    </div>
                  </div>

                  {/* Intervenant(s) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Intervenant(s)</label>
                    <input
                      type="text"
                      value={formIntervenants}
                      onChange={(e) => {
                        setFormIntervenants(e.target.value);
                        setFormAssigne(e.target.value);
                      }}
                      placeholder="Nom de l'intervenant / technicien (ex: Jean, Koffi, Joste)"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800"
                      list="techlist"
                    />
                  </div>

                  {/* Fac / Facturation */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">Facturation (Fac)</label>
                    <select
                      value={formFac}
                      onChange={(e) => setFormFac(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                    >
                      <option value="A facturer">A facturer</option>
                      <option value="Sous Garantie">Sous Garantie</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Non facturable">Non facturable</option>
                      <option value="Facturée">Facturée</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Title input */}
              <div className="pt-4 border-t border-slate-200/60 flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Désignation synthétique pour planning / calendrier</label>
                <input
                  type="text"
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  placeholder="Intitulé concis de l'action GMAO..."
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 font-medium"
                />
              </div>

              {/* Statut & Progression fields for editing */}
              <div className="pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase">Statut d'intervention</label>
                  <select
                    value={formStatut}
                    onChange={(e) => {
                      setFormStatut(e.target.value);
                      if (e.target.value === "Terminé") setFormProg(100);
                      else if (e.target.value === "Non commencé") setFormProg(0);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 font-semibold"
                  >
                    <option value="Non commencé">Non commencé</option>
                    <option value="En cours">En cours</option>
                    <option value="En attente">En attente</option>
                    <option value="Bloqué">Bloqué</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase">Progression (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProg}
                    onChange={(e) => setFormProg(Number(e.target.value))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-4 flex justify-end gap-2 border-t shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveEditTask}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-200"
              >
                Enregistrer les Modifications
              </button>
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
