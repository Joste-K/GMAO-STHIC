import React, { useState, useEffect } from "react";
import { AppDatabase, GE, Intervention, PlanningItem, Task, ArticleMagasin, Materiel, Vente, Bilan, Anomalie, RootCauseAnalysis } from "./types";
import {
  SEED_PARC,
  SEED_INTER,
  SEED_PLAN,
  ABOSEED,
  MAGCATALOG,
  TSPCATALOG,
  CONTENTKVA
} from "./data/seed";

// Import Modular Tabs
import { DashboardTab } from "./components/DashboardTab";
import { ParcTab } from "./components/ParcTab";
import { PlanningTab } from "./components/PlanningTab";
import { CalendrierTab } from "./components/CalendrierTab";
import { InterventionsTab } from "./components/InterventionsTab";
import { RapportsTab } from "./components/RapportsTab";
import { MagasinTab } from "./components/MagasinTab";
import { StockTab } from "./components/StockTab";
import { VentesTab } from "./components/VentesTab";
import { BilanTab } from "./components/BilanTab";
import { GuideTab } from "./components/GuideTab";
import { DonneesTab } from "./components/DonneesTab";
import { SuiviMensuelTab } from "./components/SuiviMensuelTab";
import { LoginView } from "./components/LoginView";
import { GEModal } from "./components/GEModal";
import { AuthManager, CloudManager, UserProfile } from "./utils/firebase";
import { calcGE, todayYMD } from "./utils/calculations";
import { askJosteExpert } from "./utils/josteExpertEngine";

// Lucide icons
import {
  LayoutDashboard,
  Cpu,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Printer,
  PackageCheck,
  Truck,
  DollarSign,
  Calculator,
  BookOpen,
  Database,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Trash2,
  Sparkles,
  Power,
  Send,
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
  ChevronRight,
  RefreshCw
} from "lucide-react";

// Local storage key
const STORAGE_KEY = "sthic_gmao_db_v1";

// Default seed database
const buildFactoryDB = (): AppDatabase => {
  // Map and sanitize the MAGCATALOG with default stock values
  const sanitizeMagasin: ArticleMagasin[] = [
    ...TSPCATALOG.map((item, i) => ({
      ref: item.ref || `TSP-${i}`,
      design: item.design || "",
      cat: item.cat || "Électrique / Électronique",
      stockInit: item.stockInit || 0,
      prixAchat: item.prixAchat || 0,
      prixVente: item.prixVente || 0,
      marge: item.marge || 0,
      seuil: item.seuil || 5,
      note: item.note || "",
      entrees: 0,
      sorties: 0,
      ventes: 0
    })),
    ...MAGCATALOG.map((item, i) => ({
      ref: item.ref || `MAG-${i}`,
      design: item.design || "",
      cat: item.cat || "Mécanique",
      stockInit: 15, // standard starting stock
      prixAchat: item.prixAchat || 0,
      prixVente: Math.round((item.prixAchat || 0) * 1.3), // default 30% margin
      marge: Math.round((item.prixAchat || 0) * 0.3),
      seuil: 5,
      note: item.note || "Catalogue initial",
      entrees: 0,
      sorties: 0,
      ventes: 0
    }))
  ];

  // Default tasks
  const defaultTasks: Task[] = [
    {
      id: "TSK-001",
      titre: "Vidange périodique et remplacement filtre",
      type: "Préventive",
      statut: "En cours",
      prio: "P2",
      cat: "Moteur",
      ge: "GE003",
      client: "AGROFAB",
      site: "VILLA CEDRICK",
      echeance: "2026-07-25",
      assigne: "MBOUNGOU WILFRIED",
      etiquette: "Vidange",
      prog: 30,
      notes: "Huile 15W-40 et filtres déjà préparés au magasin.",
      log: [
        { t: new Date().toISOString(), a: "Tâche créée par le système." }
      ],
      msgs: [
        { who: "Superviseur", txt: "Veuillez vérifier la tension de la courroie également.", t: new Date().toISOString() }
      ]
    },
    {
      id: "TSK-002",
      titre: "Remplacement batteries de démarrage",
      type: "Corrective",
      statut: "Non commencé",
      prio: "P1",
      cat: "Batteries",
      ge: "GE187",
      client: "XOIL",
      site: "S/S LOANDJILI",
      echeance: "2026-07-20",
      assigne: "Simplice EKIA",
      etiquette: "Batterie",
      prog: 0,
      notes: "Batterie 12V 75Ah à récupérer au magasin STHIC."
    }
  ];

  // Default material fleet
  const defaultMateriel: Materiel[] = [
    {
      code: "VEH-01",
      cat: "Véhicule",
      designation: "Toyota Hilux 4x4 - Équipe d'intervention",
      marque: "Toyota",
      carac: "Immatriculation 245-KG-5, Diesel",
      annee: 2021,
      valeur: 18000000,
      etat: "Bon",
      dispo: "En stock",
      obs: "Contrôle technique valide."
    },
    {
      code: "OUT-05",
      cat: "Outillage",
      designation: "Mallette de diagnostic électronique OBD2",
      marque: "Ancel",
      carac: "Multi-marques Caterpillar / Perkins / SDMO",
      annee: 2023,
      valeur: 450000,
      etat: "Neuf",
      dispo: "En stock",
      obs: "Dans le casier d'outillage technique."
    }
  ];

  // Initial bills
  const defaultBilans: Bilan[] = [
    {
      id: "BIL-001",
      nom: "Bilan Électrique Résidence",
      client: "VILLA PRINCIPALE",
      site: "VILLA MPITA",
      date: "2026-06-15",
      usage: "Continu",
      tension: "Triphasé (400V)",
      tech: "Michel TOLOLO",
      devis: "Projet Sizing Initial",
      coef: 1.25,
      rec: [
        { des: "Éclairage LED intérieur", qte: 15, pu: 15, cosphi: 0.9, fd: 1, fs: 0.7 },
        { des: "Climatiseur Split 12000 BTU", qte: 3, pu: 1100, cosphi: 0.85, fd: 2.5, fs: 0.8 },
        { des: "Réfrigérateur / Congélateur", qte: 1, pu: 350, cosphi: 0.85, fd: 3, fs: 1 },
        { des: "Surpresseur / Pompe", qte: 1, pu: 1500, cosphi: 0.8, fd: 4, fs: 1 }
      ]
    }
  ];

  // Default invoices
  const defaultVentes: Vente[] = [
    {
      id: "FACT-2026-001",
      client: "AGROFAB",
      valeur: 450000,
      type: "Contrat Maintenance",
      statut: "Payé",
      dfact: "2026-06-01",
      echeance: "2026-07-01",
      obs: "Contrat mensuel payé par virement bancaire",
      date: "2026-06-01",
      ref: "F-001",
      design: "Maintenance mensuelle",
      cat: "Contrat",
      unite: "Mois",
      qte: 1,
      pv: 450000,
      remise: 0,
      cout: 300000,
      note: "Réglé"
    },
    {
      id: "FACT-2026-002",
      client: "XOIL",
      valeur: 850000,
      type: "Dépannage d'urgence",
      statut: "À recouvrer",
      dfact: "2026-07-05",
      echeance: "2026-08-05",
      obs: "Intervention sur automate DeepSea grillé",
      date: "2026-07-05",
      ref: "F-002",
      design: "Remplacement automate",
      cat: "Dépannage",
      unite: "Forfait",
      qte: 1,
      pv: 850000,
      remise: 0,
      cout: 400000,
      note: "En attente"
    }
  ];

  return {
    parc: SEED_PARC,
    inter: SEED_INTER,
    plan: SEED_PLAN,
    anomalies: [],
    taches: defaultTasks,
    materiel: defaultMateriel,
    magasin: sanitizeMagasin,
    mouvements: [],
    ventes: defaultVentes,
    abos: ABOSEED,
    bilans: defaultBilans,
    rootCauses: [],
    magasinCats: ["Filtres", "Huile", "Courroies", "Batteries", "Électrique / Électronique", "Mécanique", "Autre"],
    magasinUnites: ["Pce", "Litre", "Kg", "Mètre", "Rouleau", "Paquet"]
  };
};

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure sub-arrays exist to prevent crashes
        if (parsed.parc && parsed.inter && parsed.plan && parsed.taches) {
          let updated = false;
          // MIGRATION: Sync park by adding missing seed sites
          const existingIds = new Set(parsed.parc.map((g: GE) => g.id));
          const missing = SEED_PARC.filter(g => !existingIds.has(g.id));
          if (missing.length > 0) {
            console.log(`Synchronisation du parc: ajout de ${missing.length} sites manquants...`);
            parsed.parc = [...parsed.parc, ...missing];
            updated = true;
          }
          
          // MIGRATION: Sync planning by adding missing seed items
          const existingPlanKeys = new Set(parsed.plan.map((p: PlanningItem) => `${p.date}|${p.ge || p.site}|${p.note}`));
          const missingPlan = SEED_PLAN.filter(p => !existingPlanKeys.has(`${p.date}|${p.ge || p.site}|${p.note}`));
          if (missingPlan.length > 0) {
            console.log(`Synchronisation du planning: ajout de ${missingPlan.length} éléments manquants...`);
            parsed.plan = [...parsed.plan, ...missingPlan];
            updated = true;
          }

          if (updated) {
            // Also update storage immediately
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (err) {
        console.error("Erreur lors de la lecture de la base GMAO locale :", err);
      }
    }
    return buildFactoryDB();
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeGEId, setActiveGEId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Try to recover last selected month or default to June 2026 for now
    return localStorage.getItem("sthic_selected_month") || "2026-06";
  });

  // Joste AI Assistant State
  const [ottoOpen, setOttoOpen] = useState<boolean>(false);
  const [ottoMessages, setOttoMessages] = useState<Array<{ sender: "user" | "otto"; text: string; time: string }>>([
    {
      sender: "otto",
      text: "👋 Bonjour ! Je suis Joste, votre Ingénieur Expert de la GMAO STHIC SERVICES (Groupes Électrogènes, Moteurs Perkins/SDMO, Alternateurs AVR, Diagnostics Electromécaniques & Magasin).\n\nJ'analyse en temps réel l'ensemble de votre base de données. Posez-moi une question sur une machine, un diagnostic de panne, ou demandez-moi un **audit critique global** de la maintenance !",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [ottoInput, setOttoInput] = useState<string>("");
  const [ottoTyping, setOttoTyping] = useState<boolean>(false);

  // Custom in-UI modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredGEs = globalSearch.trim() 
    ? db.parc.filter(g => 
        (g.id + " " + g.client + " " + g.site).toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const askConfirmation = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDanger
    });
  };

  const handleSendToOtto = async (customPrompt?: string) => {
    const textToSend = customPrompt || ottoInput;
    if (!textToSend.trim()) return;

    const userMsg = textToSend.trim();
    const currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Append user message
    setOttoMessages(prev => [...prev, { sender: "user", text: userMsg, time: currentTime }]);
    if (!customPrompt) setOttoInput("");
    setOttoTyping(true);

    try {
      const reply = await askJosteExpert(userMsg, db, ottoMessages);
      const replyTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      setOttoMessages(prev => [...prev, { sender: "otto", text: reply, time: replyTime }]);
    } catch (err: any) {
      console.error("Joste assistant error:", err);
      setOttoMessages(prev => [
        ...prev,
        {
          sender: "otto",
          text: "⚠️ Désolé, une erreur est survenue lors de l'analyse. Veuillez réessayer.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setOttoTyping(false);
    }
  };

  useEffect(() => {
    const unsub = AuthManager.subscribe((profile) => {
      setUser(profile);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Auto-save database to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    localStorage.setItem("sthic_selected_month", selectedMonth);
  }, [selectedMonth]);

  // General state mutations
  const handleRestoreDB = (restored: AppDatabase) => {
    setDb(restored);
  };

  const handleResetDB = () => {
    askConfirmation(
      "Réinitialiser la base d'usine",
      "⚠️ AVERTISSEMENT : Cette action écrasera toutes vos modifications locales et rechargera les données de démonstration d'origine de STHIC SERVICES. Cette opération va recharger l'application.",
      () => {
        const fresh = buildFactoryDB();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setDb(fresh);
        window.location.reload();
      },
      true
    );
  };

  const handleSyncCloud = async () => {
    try {
      // 1. Get the current local database
      const localDb = db;
      
      // 2. Perform Excel Catalog/Seed merge on the local database
      const existingKeys = new Set(localDb.parc.map(g => `${g.client}|${g.site}|${g.marque}`.toUpperCase()));
      const missingFromCatalog: GE[] = [];
      let nextId = Math.max(...localDb.parc.map(g => parseInt(g.id.replace(/\D/g, "") || "0"))) + 1;
      if (isNaN(nextId) || nextId < 500) nextId = 500;

      for (const key in CONTENTKVA) {
        if (!existingKeys.has(key.toUpperCase())) {
          const [client, site, marque] = key.split('|');
          missingFromCatalog.push({
            id: `GE${String(nextId++).padStart(3, '0')}`,
            client: client || "INCONNU",
            site: site || "SITEPARDEFAUT",
            marque: marque || "",
            kva: CONTENTKVA[key],
            moteur: "PERKINS",
            regime: 1.0,
            seuil: 300,
            type: "Principal",
            etat: "Opérationnel",
            comm: "Synchronisé du catalogue Excel"
          });
        }
      }

      const existingPlanKeys = new Set(localDb.plan.map(p => `${p.date}|${p.ge || p.site}|${p.note}`));
      const missingPlan = SEED_PLAN.filter(p => !existingPlanKeys.has(`${p.date}|${p.ge || p.site}|${p.note}`));

      const baseLocalMerged: AppDatabase = {
        ...localDb,
        parc: [...localDb.parc, ...missingFromCatalog],
        plan: [...localDb.plan, ...missingPlan]
      };

      // 3. Fetch latest database from the Cloud
      let finalDb = baseLocalMerged;
      let cloudFound = false;

      if (user) {
        const cloudDb = await CloudManager.loadFromCloud(user.uid);
        if (cloudDb && cloudDb.parc && cloudDb.inter && cloudDb.plan && cloudDb.taches) {
          cloudFound = true;
          
          // Merge local merged database with cloud database
          const mergeArray = <T,>(
            localArr: T[] | undefined,
            cloudArr: T[] | undefined,
            getKey: (item: T) => string
          ): T[] => {
            const l = localArr || [];
            const c = cloudArr || [];
            const map = new Map<string, T>();
            // Add cloud items first
            c.forEach(item => {
              map.set(getKey(item), item);
            });
            // Overwrite/Add local items (local items are newer/modified on this device)
            l.forEach(item => {
              map.set(getKey(item), item);
            });
            return Array.from(map.values());
          };

          finalDb = {
            parc: mergeArray(baseLocalMerged.parc, cloudDb.parc, (g) => g.id),
            inter: mergeArray(baseLocalMerged.inter, cloudDb.inter, (i) => `${i.client || ''}|${i.site || ''}|${i.ge || ''}|${i.ddeb || ''}`),
            plan: mergeArray(baseLocalMerged.plan, cloudDb.plan, (p) => `${p.date || ''}|${p.ge || ''}|${p.client || ''}|${p.site || ''}`),
            anomalies: mergeArray(baseLocalMerged.anomalies, cloudDb.anomalies, (a) => a.id),
            taches: mergeArray(baseLocalMerged.taches, cloudDb.taches, (t) => t.id),
            materiel: mergeArray(baseLocalMerged.materiel, cloudDb.materiel, (m) => m.code),
            magasin: mergeArray(baseLocalMerged.magasin, cloudDb.magasin, (a) => a.ref),
            mouvements: mergeArray(baseLocalMerged.mouvements, cloudDb.mouvements, (mv) => `${mv.date || ''}|${mv.ref || ''}|${mv.note || ''}`),
            ventes: mergeArray(baseLocalMerged.ventes, cloudDb.ventes, (v) => `${v.date || ''}|${v.ref || ''}|${v.qte || ''}`),
            abos: mergeArray(baseLocalMerged.abos, cloudDb.abos, (ab) => `${ab.client || ''}|${ab.type || ''}`),
            bilans: mergeArray(baseLocalMerged.bilans, cloudDb.bilans, (b) => b.id),
            rootCauses: mergeArray(baseLocalMerged.rootCauses, cloudDb.rootCauses, (rc) => rc.id),
            magasinCats: Array.from(new Set([...(baseLocalMerged.magasinCats || []), ...(cloudDb.magasinCats || [])])),
            magasinUnites: Array.from(new Set([...(baseLocalMerged.magasinUnites || []), ...(cloudDb.magasinUnites || [])]))
          };
        }
      }

      // 4. Save the merged DB back to the cloud (so technicians can download/access it)
      if (user) {
        await CloudManager.saveToCloud(user.uid, finalDb);
        // Store last sync metadata
        const nowStr = new Date().toLocaleString("fr-FR");
        localStorage.setItem(`sthic_last_sync_date_${user.uid}`, nowStr);
      }

      // 5. Update state and local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalDb));
      setDb(finalDb);

      const isReal = AuthManager.isRealFirebase();
      let msg = "✅ Synchronisation réussie !\n\n";
      msg += `• Fusion du catalogue Excel d'origine effectuée.\n`;
      if (user) {
        msg += cloudFound 
          ? `• Données fusionnées avec succès avec la sauvegarde existante sur le Cloud.\n`
          : `• Première sauvegarde créée sur le Cloud avec succès.\n`;
        msg += isReal 
          ? `• Données stockées en toute sécurité sur Firebase Firestore (partagées avec vos techniciens).\n`
          : `• Données stockées localement en mode Sandbox (simulation).\n`;
      }
      alert(msg);

    } catch (err: any) {
      console.error("Sync error:", err);
      alert("⚠️ Erreur lors de la synchronisation : " + err.message);
    }
  };

  // 1. Parc GEs handlers
  const handleUpdateGE = (idx: number, updated: Partial<GE>) => {
    setDb(prev => {
      const copy = [...prev.parc];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, parc: copy };
    });
  };

  const handleAddGE = () => {
    const newGe: GE = {
      id: `GE${Math.floor(100 + Math.random() * 900)}`,
      client: "NOUVEAU CLIENT",
      site: "NOUVEAU SITE",
      marque: "SDMO",
      kva: 33,
      moteur: "JOHN DEER",
      huile: 9,
      regime: 1.0,
      seuil: 300,
      dvid: new Date().toISOString().split("T")[0],
      hvid: 0,
      drel: new Date().toISOString().split("T")[0],
      hrel: 0,
      dbatt: null,
      dcourr: null,
      type: "Principal",
      etat: "Opérationnel",
      comm: "",
      fhuile: "LF 3776",
      fgasoil: "FF 5300",
      fair: "ECC 065003",
      feau: "Standard",
      fcourroie: "Standard",
      fbatterie: "12V 60Ah"
    };
    setDb(prev => ({ ...prev, parc: [newGe, ...prev.parc] }));
  };

  const handleDeleteGE = (idx: number) => {
    askConfirmation(
      "Supprimer le Groupe Électrogène",
      "Confirmez-vous la suppression définitive de ce Groupe Électrogène de l'inventaire ?",
      () => {
        setDb(prev => ({ ...prev, parc: prev.parc.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  const handleUpdateKva = (id: string, value: number | "") => {
    setDb(prev => {
      const copy = prev.parc.map(g => g.id === id ? { ...g, kva: value } : g);
      return { ...prev, parc: copy };
    });
  };

  // 2. Interventions handlers
  const handleUpdateInter = (idx: number, updated: Partial<Intervention>) => {
    setDb(prev => {
      const copy = [...prev.inter];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, inter: copy };
    });
  };

  const handleAddInter = (inter: Intervention) => {
    setDb(prev => ({ ...prev, inter: [inter, ...prev.inter] }));
  };

  const handleDeleteInter = (idx: number) => {
    askConfirmation(
      "Supprimer le rapport d'intervention",
      "Confirmez-vous la suppression définitive de ce rapport d'intervention de l'historique ?",
      () => {
        setDb(prev => ({ ...prev, inter: prev.inter.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  // 3. Planning handlers
  const handleAddPlan = (item: PlanningItem) => {
    setDb(prev => ({ ...prev, plan: [item, ...prev.plan] }));
  };

  const handleUpdatePlan = (idx: number, updated: Partial<PlanningItem>) => {
    setDb(prev => {
      const copy = [...prev.plan];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, plan: copy };
    });
  };

  const handleDeletePlan = (idx: number) => {
    askConfirmation(
      "Supprimer la planification",
      "Confirmez-vous la suppression de cette planification de maintenance ?",
      () => {
        setDb(prev => ({ ...prev, plan: prev.plan.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  const handleProjeterVidanges = (month: string) => {
    const newItems: PlanningItem[] = [];
    db.parc.forEach(g => {
      const { proch } = calcGE(g, db.inter || []);
      if (proch) {
        const prochStr = proch.toISOString().slice(0, 7);
        if (prochStr === month) {
          // Check if already planned
          const already = db.plan.some(p => p.ge === g.id && p.date && p.date.startsWith(month));
          if (!already) {
            newItems.push({
              date: proch.toISOString().slice(0, 10),
              client: g.client,
              site: g.site,
              ge: g.id,
              type: "Vidange",
              tech: "",
              note: "Projection vidange auto",
              exec: null
            });
          }
        }
      }
    });
    if (newItems.length > 0) {
      setDb(prev => ({ ...prev, plan: [...newItems, ...prev.plan] }));
    }
  };

  const handleEclaterMultiGE = () => {
    setDb(prev => {
      const newPlan: PlanningItem[] = [];
      prev.plan.forEach(p => {
        if (!p.ge && p.site && p.site.toUpperCase().includes("GE")) {
          // It's a multi-GE site task, find all GEs for this site
          const ges = prev.parc.filter(g => g.site === p.site && g.client === p.client);
          if (ges.length > 1) {
            ges.forEach(g => {
              newPlan.push({ ...p, ge: g.id, note: p.note + " (Éclaté)" });
            });
            return;
          }
        }
        newPlan.push(p);
      });
      return { ...prev, plan: newPlan };
    });
  };

  const handleGenererMaintenances = (client: string, site: string, freq: string, day: string, month: string) => {
    const ges = db.parc.filter(g => g.client === client && (!site || g.site === site));
    const newItems: PlanningItem[] = [];
    
    // Simple logic to find the first occurrence of 'day' in 'month'
    const baseDate = new Date(month + "-01");
    const dayMap: { [key: string]: number } = { "dimanche": 0, "lundi": 1, "mardi": 2, "mercredi": 3, "jeudi": 4, "vendredi": 5, "samedi": 6 };
    const targetDay = dayMap[day.toLowerCase()] ?? 5;
    
    while (baseDate.getDay() !== targetDay) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    
    ges.forEach(g => {
      newItems.push({
        date: baseDate.toISOString().slice(0, 10),
        client: g.client,
        site: g.site,
        ge: g.id,
        type: "Préventive",
        tech: "",
        note: freq === "H" ? "Maintenance Hebdomadaire" : "Maintenance Mensuelle",
        exec: null
      });
    });

    if (newItems.length > 0) {
      setDb(prev => ({ ...prev, plan: [...newItems, ...prev.plan] }));
    }
  };

  const handleAddAnomalie = (ano: Anomalie) => {
    setDb(prev => ({ ...prev, anomalies: [ano, ...prev.anomalies] }));
  };

  const handleUpdateAnomalieStatut = (idx: number, statut: string) => {
    setDb(prev => {
      const copy = [...prev.anomalies];
      copy[idx] = { ...copy[idx], statut: statut as any };
      return { ...prev, anomalies: copy };
    });
  };

  const handleDeleteAnomalie = (idx: number) => {
    askConfirmation("Supprimer l'anomalie", "Confirmer la suppression ?", () => {
      setDb(prev => ({ ...prev, anomalies: prev.anomalies.filter((_, i) => i !== idx) }));
    });
  };

  const handleReplacePlan = (items: PlanningItem[]) => {
    setDb(prev => ({ ...prev, plan: items }));
  };

  const handleAppendPlan = (items: PlanningItem[]) => {
    setDb(prev => ({ ...prev, plan: [...prev.plan, ...items] }));
  };

  const handleStartInterventionFromPlan = (item: PlanningItem, idx: number) => {
    const newInter: Intervention = {
      num: `INT-PL-${Math.floor(1000 + Math.random() * 9000)}`,
      client: item.client || "",
      site: item.site || "",
      ge: item.ge || "",
      type: (item.type as any) || "Préventive",
      tech: item.tech || "",
      descp: `${item.type || 'Maintenance'} planifiée le ${item.date}`,
      descr: "",
      reso: "",
      obs: item.note || "",
      dplan: item.date || todayYMD(),
      ddeb: todayYMD(),
      dfin: null,
      urg: "Moyen"
    };

    setDb(prev => ({
      ...prev,
      inter: [newInter, ...prev.inter],
    }));
    
    setActiveTab("interventions");
  };

  // 4. Tasks handlers
  const handleUpdateTask = (idx: number, updated: Partial<Task>) => {
    setDb(prev => {
      const copy = [...prev.taches];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, taches: copy };
    });
  };

  const handleAddTask = (task: Task) => {
    setDb(prev => ({ ...prev, taches: [task, ...prev.taches] }));
  };

  const handleDeleteTask = (idx: number) => {
    askConfirmation(
      "Supprimer la tâche d'intervention",
      "Confirmez-vous la suppression de cette tâche d'intervention active du tableau de bord ?",
      () => {
        setDb(prev => ({ ...prev, taches: prev.taches.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  // 5. Warehouse / Magasin handlers
  const handleUpdateArticle = (idx: number, updated: Partial<ArticleMagasin>) => {
    setDb(prev => {
      const copy = [...prev.magasin];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, magasin: copy };
    });
  };

  const handleAddArticle = () => {
    const nextRef = `STHIC-P${Math.floor(100 + Math.random() * 900)}`;
    const newArt: ArticleMagasin = {
      ref: nextRef,
      design: "Nouveau produit ou filtre",
      cat: "Autre",
      stockInit: 10,
      prixAchat: 5000,
      marge: 1500,
      prixVente: 6500,
      note: "Saisie manuelle",
      entrees: 0,
      sorties: 0,
      ventes: 0
    };
    setDb(prev => ({ ...prev, magasin: [newArt, ...prev.magasin] }));
  };

  const handleDeleteArticle = (idx: number) => {
    askConfirmation(
      "Supprimer l'article",
      "Confirmez-vous la suppression définitive de cet article du magasin ? Cette action est irréversible et affectera l'inventaire.",
      () => {
        setDb(prev => ({ ...prev, magasin: prev.magasin.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  const handleCheckoutCart = (cart: any[], client: string, ge: string, workRef: string) => {
    setDb(prev => {
      const updatedMagasin = prev.magasin.map(art => {
        const item = cart.find(c => c.ref === art.ref);
        if (item) {
          return {
            ...art,
            sorties: (art.sorties || 0) + item.qteSelected
          };
        }
        return art;
      });

      // Construct a summary of preselected items
      const summaryItems = cart.map(c => `${c.qteSelected}x ${c.des} [${c.ref}]`).join(", ");

      // Log a new intervention reporting this checkout
      const newInter: Intervention = {
        num: `INT-PR-${Math.floor(1000 + Math.random() * 9000)}`,
        client: client,
        site: ge ? (prev.parc.find(x => x.id === ge)?.site || "Atelier STHIC") : "Atelier STHIC",
        ge: ge || "Magasin",
        type: "Corrective",
        tech: "Superviseur Magasin",
        descp: `Prélèvement pièces détachées : ${workRef}`,
        descr: `Allocation de pièces pour maintenance : ${summaryItems}`,
        reso: `Pièces prélevées en stock et allouées.`,
        obs: `Généré automatiquement par le module magasin.`,
        ddeb: new Date().toISOString().split("T")[0],
        dfin: new Date().toISOString().split("T")[0],
        dplan: new Date().toISOString().split("T")[0],
        urg: "Moyen"
      };

      return {
        ...prev,
        magasin: updatedMagasin,
        inter: [newInter, ...prev.inter]
      };
    });
  };

  // 6. Assets / Materiel handlers
  const handleUpdateMateriel = (idx: number, updated: Partial<Materiel>) => {
    setDb(prev => {
      const copy = [...prev.materiel];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, materiel: copy };
    });
  };

  const handleAddMateriel = () => {
    const newMat: Materiel = {
      code: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      cat: "Outillage",
      designation: "Nouvel outil ou équipement",
      marque: "Bosch",
      carac: "Spécification standard",
      annee: new Date().getFullYear(),
      valeur: 150000,
      etat: "Neuf",
      dispo: "En stock",
      obs: "Ajouté récemment"
    };
    setDb(prev => ({ ...prev, materiel: [newMat, ...prev.materiel] }));
  };

  const handleDeleteMateriel = (idx: number) => {
    askConfirmation(
      "Supprimer le matériel / véhicule",
      "Confirmez-vous la suppression de ce matériel ou véhicule de l'inventaire de la flotte ?",
      () => {
        setDb(prev => ({ ...prev, materiel: prev.materiel.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  // 7. Commercial / Invoices handlers
  const handleUpdateVente = (idx: number, updated: Partial<Vente>) => {
    setDb(prev => {
      const copy = [...prev.ventes];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, ventes: copy };
    });
  };

  const handleAddVente = () => {
    const newVente: Vente = {
      id: `F-${Math.floor(1000 + Math.random() * 9000)}`,
      client: "CLIENT INCONNU",
      valeur: 150000,
      type: "Dépannage d'urgence",
      statut: "À recouvrer",
      dfact: new Date().toISOString().split("T")[0],
      echeance: new Date().toISOString().split("T")[0],
      obs: "Nouvelle facture émise",
      date: new Date().toISOString().split("T")[0],
      ref: `F-${Math.floor(1000 + Math.random() * 9000)}`,
      design: "Prestation technique",
      cat: "Dépannage",
      unite: "Pce",
      qte: 1,
      pv: 150000,
      remise: 0,
      cout: 50000,
      note: "Création manuelle"
    };
    setDb(prev => ({ ...prev, ventes: [newVente, ...prev.ventes] }));
  };

  const handleDeleteVente = (idx: number) => {
    askConfirmation(
      "Supprimer la facture",
      "Confirmez-vous la suppression définitive de cette facture commerciale ?",
      () => {
        setDb(prev => ({ ...prev, ventes: prev.ventes.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  // 8. Sizing / Bilans handlers
  const handleUpdateBilan = (idx: number, updated: Partial<Bilan>) => {
    setDb(prev => {
      const copy = [...prev.bilans];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, bilans: copy };
    });
  };

  const handleAddRootCause = (rc: RootCauseAnalysis) => {
    setDb(prev => ({ ...prev, rootCauses: [...(prev.rootCauses || []), rc] }));
  };

  const handleAddBilan = (bilan: Bilan) => {
    setDb(prev => ({ ...prev, bilans: [bilan, ...prev.bilans] }));
  };

  const handleDeleteBilan = (idx: number) => {
    askConfirmation(
      "Supprimer le bilan de puissance",
      "Confirmez-vous la suppression définitive de ce dossier d'étude de bilan de puissance ?",
      () => {
        setDb(prev => ({ ...prev, bilans: prev.bilans.filter((_, i) => i !== idx) }));
      },
      true
    );
  };

  // Navigation configurations
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, category: "pilotage" },
    { id: "planning", label: "Planification", icon: CalendarRange, category: "pilotage" },
    { id: "calendrier", label: "Calendrier", icon: CalendarDays, category: "pilotage" },
    { id: "parc", label: "Parc GEs", icon: Cpu, category: "clients" },
    { id: "mensuel", label: "Suivi Mensuel", icon: CalendarDays, category: "clients" },
    { id: "sizing", label: "Bilans & Sizing", icon: Calculator, category: "clients" },
    { id: "interventions", label: "Interventions", icon: ClipboardList, category: "chantiers" },
    { id: "rapports", label: "Rapports & Impressions", icon: Printer, category: "chantiers" },
    { id: "magasin", label: "Magasin & Pièces", icon: PackageCheck, category: "logistique" },
    { id: "materiel", label: "Matériel & Flotte", icon: Truck, category: "logistique" },
    { id: "ventes", label: "Factures & Ventes", icon: DollarSign, category: "commerce" },
    { id: "guide", label: "Guide Technique", icon: BookOpen, category: "infos" },
    { id: "data", label: "Données & Sauvegardes", icon: Database, category: "infos" }
  ];

  const categories = [
    { id: "pilotage", label: "🎛️ Pilotage" },
    { id: "clients", label: "📋 Clients & GEs" },
    { id: "chantiers", label: "⚙️ Chantiers" },
    { id: "logistique", label: "🧰 Logistique" },
    { id: "commerce", label: "💰 Commerce" },
    { id: "infos", label: "📖 Infos & Cloud" }
  ];

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f0f0] text-slate-800 font-sans gap-3">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Chargement de la session...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-[#f0f0f0] text-slate-800 font-sans overflow-hidden antialiased relative">
      {/* Backdrop overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/55 z-35 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`${
          sidebarOpen 
            ? "translate-x-0 w-[260px]" 
            : "-translate-x-full md:translate-x-0 w-0 md:w-[70px]"
        } fixed md:static top-0 left-0 bottom-0 bg-white text-slate-700 flex flex-col h-full transition-all duration-300 overflow-hidden shrink-0 z-40 md:z-20 border-r border-slate-200`}
      >
        {/* Brand header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-800 border border-slate-800 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md">
              GSJ
            </div>
            {sidebarOpen && (
              <div className="font-extrabold text-[12px] tracking-wide text-slate-800 uppercase truncate">
                GMAO-STHIC Joste
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar scrolling menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-thin">
          {categories.map(cat => {
            const catItems = menuItems.filter(item => item.category === cat.id);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1.5">
                {sidebarOpen && (
                  <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {cat.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {catItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 transition-all cursor-pointer text-[11px] uppercase tracking-wider font-bold rounded-lg ${
                          isActive
                            ? "bg-slate-100 text-slate-900 border-l-4 border-orange-500"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        title={item.label}
                      >
                        <Icon size={14} className={`shrink-0 ${isActive ? "text-orange-500" : "text-slate-400"}`} />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer info block */}
        {sidebarOpen && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-semibold shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || "User")}`}
                  alt="avatar"
                  className="w-6 h-6 rounded-full bg-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="truncate min-w-0">
                  <div className="text-slate-800 uppercase tracking-wider truncate font-bold">
                    {user.displayName || "Superviseur"}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate font-mono">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => AuthManager.logout()}
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer transition-colors shadow-sm"
                title="Se déconnecter (Power Off)"
              >
                <Power size={13} />
              </button>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-400 uppercase tracking-wider">
              <span>POINTE-NOIRE</span>
              <span className={user.isSimulated ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                {user.isSimulated ? "● OFFLINE" : "● CLOUD"}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header toolbar */}
        <header className="h-14 bg-blue-900 border-b border-blue-800 flex items-center justify-between px-6 shrink-0 z-50 text-white">
          <div className="flex items-center gap-4 text-xs font-medium flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tighter uppercase">GMAO SAISIE — STHIC</span>
              <span className="h-4 w-[1px] bg-blue-700 mx-1 hidden lg:block" />
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-blue-800 shadow-sm">
                <CalendarDays size={14} className="text-blue-600" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black text-black focus:ring-0 cursor-pointer uppercase outline-none"
                >
                  <option value="">Tous les mois</option>
                  <option value="2026-06">Juin 2026</option>
                  <option value="2026-07">Juillet 2026</option>
                  <option value="2026-08">Août 2026</option>
                  <option value="2026-09">Septembre 2026</option>
                </select>
              </div>
              <span className="h-4 w-[1px] bg-blue-700 mx-1 hidden lg:block" />
              <h1 className="text-sm font-bold text-blue-100 capitalize truncate hidden lg:block min-w-[120px]">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h1>
            </div>

            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-md ml-2 group">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Recherche rapide GE, Site ou Client..."
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full bg-white border-transparent focus:ring-4 focus:ring-blue-400/20 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-black placeholder-slate-400 transition-all outline-none shadow-sm"
                />
                {globalSearch && (
                  <button 
                    onClick={() => { setGlobalSearch(""); setShowSearchResults(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && globalSearch.trim() && (
                <>
                  <div 
                    className="fixed inset-0 z-[-1]" 
                    onClick={() => setShowSearchResults(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 max-h-[400px] overflow-y-auto">
                      <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Résultats du parc ({filteredGEs.length})
                      </div>
                      {filteredGEs.length > 0 ? (
                        filteredGEs.map((ge) => (
                          <button
                            key={ge.id}
                            onClick={() => {
                              setGlobalSearch("");
                              setShowSearchResults(false);
                              setActiveTab("parc");
                              setActiveGEId(ge.id);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all group/item text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                                {ge.id}
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-slate-800 group-hover/item:text-blue-700 transition-colors uppercase">
                                  {ge.client}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                  {ge.site}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover/item:text-blue-500 transform translate-x-0 group-hover/item:translate-x-1 transition-all" />
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Search size={16} className="text-slate-300" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Aucun GE trouvé pour "{globalSearch}"</p>
                        </div>
                      )}
                    </div>
                    {filteredGEs.length > 0 && (
                      <div className="bg-slate-50 p-2 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            setActiveTab("parc");
                            setShowSearchResults(false);
                          }}
                          className="w-full py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-white rounded-lg transition-all cursor-pointer"
                        >
                          Voir tout le parc
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick status counters & Synchronize button */}
          <div className="flex items-center gap-3 text-xs font-bold">
            {/* Sync button */}
            <button
              onClick={handleSyncCloud}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-black border border-slate-200 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw size={13} className="text-blue-600" />
              <span>Synchroniser</span>
            </button>

            {/* Logout button */}
            <button
              onClick={() => AuthManager.logout()}
              className="px-3 py-1.5 bg-slate-100/10 hover:bg-white hover:text-black text-white border border-white/20 rounded-lg transition-all cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Main tabs view content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#f0f0f0] relative scrollbar-thin">
          {activeTab === "dashboard" && (
            <DashboardTab
              db={db}
              selectedMonth={selectedMonth}
              onSelectGE={(geId) => {
                setActiveGEId(geId);
              }}
              onAddRootCause={handleAddRootCause}
            />
          )}

          {activeTab === "planning" && (
            <PlanningTab
              db={db}
              selectedMonth={selectedMonth}
              onAddPlanItem={handleAddPlan}
              onUpdatePlanItem={handleUpdatePlan}
              onDeletePlanItem={handleDeletePlan}
              onProjeterVidanges={handleProjeterVidanges}
              onEclaterMultiGE={handleEclaterMultiGE}
              onGenererMaintenances={handleGenererMaintenances}
              onAddAnomalie={handleAddAnomalie}
              onUpdateAnomalieStatut={handleUpdateAnomalieStatut}
              onDeleteAnomalie={handleDeleteAnomalie}
              onReplacePlan={handleReplacePlan}
              onAppendPlan={handleAppendPlan}
              onStartIntervention={handleStartInterventionFromPlan}
            />
          )}

          {activeTab === "calendrier" && (
            <CalendrierTab
              db={db}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === "parc" && (
            <ParcTab
              db={db}
              onSelectGE={(geId) => {
                setActiveGEId(geId);
              }}
              onOpenNewGE={handleAddGE}
              onUpdateKva={handleUpdateKva}
              searchQuery={globalSearch}
            />
          )}

          {activeTab === "sizing" && (
            <BilanTab
              db={db}
              onAddBilan={handleAddBilan}
              onUpdateBilan={handleUpdateBilan}
              onDeleteBilan={handleDeleteBilan}
            />
          )}

          {activeTab === "interventions" && (
            <InterventionsTab
              db={db}
              selectedMonth={selectedMonth}
              onAddInter={handleAddInter}
              onUpdateInter={handleUpdateInter}
              onDeleteInter={handleDeleteInter}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "rapports" && (
            <RapportsTab
              db={db}
              selectedMonth={selectedMonth}
              onSelectGE={(geId) => {
                setActiveGEId(geId);
                setActiveTab("parc");
              }}
            />
          )}

          {activeTab === "magasin" && (
            <MagasinTab
              db={db}
              onAddArticle={handleAddArticle}
              onUpdateArticle={handleUpdateArticle}
              onDeleteArticle={handleDeleteArticle}
              onCheckoutCart={handleCheckoutCart}
            />
          )}

          {activeTab === "materiel" && (
            <StockTab
              db={db}
              onAddMateriel={handleAddMateriel}
              onUpdateMateriel={handleUpdateMateriel}
              onDeleteMateriel={handleDeleteMateriel}
            />
          )}

          {activeTab === "ventes" && (
            <VentesTab
              db={db}
              onAddVente={handleAddVente}
              onUpdateVente={handleUpdateVente}
              onDeleteVente={handleDeleteVente}
            />
          )}

          {activeTab === "guide" && (
            <GuideTab
            />
          )}

          {activeTab === "data" && (
            <DonneesTab
              db={db}
              user={user}
              onRestoreDB={handleRestoreDB}
              onResetDB={handleResetDB}
            />
          )}

          {activeTab === "mensuel" && (
            <SuiviMensuelTab
              db={db}
              selectedMonth={selectedMonth}
              onUpdateGE={(id, updated) => {
                setDb(prev => {
                  const newParc = prev.parc.map(g => g.id === id ? { ...g, ...updated } : g);
                  return { ...prev, parc: newParc };
                });
              }}
              onAddIntervention={(inter) => {
                setDb(prev => ({ ...prev, inter: [inter, ...prev.inter] }));
              }}
            />
          )}
        </main>

        {/* Global GE Modal */}
        {activeGEId && (
          <GEModal
            db={db}
            ge={db.parc.find(g => g.id === activeGEId)!}
            onClose={() => setActiveGEId(null)}
            onSave={(updated) => {
              const idx = db.parc.findIndex(g => g.id === activeGEId);
              if (idx !== -1) handleUpdateGE(idx, updated);
            }}
          />
        )}

        {/* Enterprise OS high density Footer */}
        <footer className="h-8 bg-gray-100 border-t border-gray-300 px-6 flex items-center justify-between text-[10px] text-gray-500 font-mono shrink-0">
          <div>© GMAO- STHIC 2026</div>
          <div className="flex gap-4">
            <span>PARC: {db.parc.filter(g => g.etat === "Opérationnel").length}/{db.parc.length} OP</span>
            <span>TACHES: {db.taches.filter(t => t.statut !== "Terminé").length} ACTIVES</span>
            <span>DB: SYSTEME LOCAL STORAGE</span>
          </div>
        </footer>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header / Accent bar */}
            <div className={`h-1.5 ${confirmModal.isDanger ? "bg-red-600" : "bg-blue-600"}`} />
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${confirmModal.isDanger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-0 shadow-sm ${
                    confirmModal.isDanger 
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/10" 
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Otto AI Assistant Drawer */}
      {ottoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[999] flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between border-b border-blue-700 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-200 animate-bounce" />
                <div>
                  <h3 className="font-bold text-sm">Joste — Assistant Intelligent</h3>
                  <p className="text-[10px] text-blue-200 font-medium">GMAO-STHIC — Assistant de flotte</p>
                </div>
              </div>
              <button
                onClick={() => setOttoOpen(false)}
                className="text-white hover:bg-blue-700 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin">
              {ottoMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-3xs ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    <div className="font-sans whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    <div
                      className={`text-[9px] mt-1 font-mono text-right ${
                        msg.sender === "user" ? "text-blue-200" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              {ottoTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-2 text-xs shadow-3xs text-slate-400 flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                    <span>Joste réfléchit...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts footer */}
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => { handleSendToOtto("Fais un audit critique global de toute la maintenance"); }}
                className="text-[10px] font-bold bg-white text-blue-700 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer shadow-2xs"
              >
                🏛️ Audit Critique Global
              </button>
              <button
                onClick={() => { handleSendToOtto("Donne la procédure pour une surchauffe moteur 95°C"); }}
                className="text-[10px] font-bold bg-white text-rose-700 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer shadow-2xs"
              >
                🚨 Diagnostic Surchauffe
              </button>
              <button
                onClick={() => { handleSendToOtto("Comment diagnostiquer un défaut de tension AVR et alternateur ?"); }}
                className="text-[10px] font-bold bg-white text-amber-700 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-50 cursor-pointer shadow-2xs"
              >
                ⚡ Defaut Tension AVR
              </button>
              <button
                onClick={() => { handleSendToOtto("Quels sont les groupes en retard de vidange ou courroie ?"); }}
                className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer shadow-2xs"
              >
                🛢️ Vidanges & Courroies
              </button>
              <button
                onClick={() => { handleSendToOtto("Analyse l'état des stocks critiques du magasin"); }}
                className="text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50 cursor-pointer shadow-2xs"
              >
                📦 Stocks Magasin
              </button>
            </div>

            {/* Form Input footer */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Discutez avec Joste…"
                value={ottoInput}
                onChange={(e) => setOttoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendToOtto(); }}
                className="flex-1 px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendToOtto}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Active Chat Bubble on bottom-left */}
      <button
        onClick={() => setOttoOpen(true)}
        className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all z-30 animate-pulse"
        title="Discuter avec Joste !"
      >
        <MessageSquare size={20} className="text-white" />
      </button>
    </div>
  );
}
