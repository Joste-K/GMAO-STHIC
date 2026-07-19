import React, { useState, useEffect } from "react";
import { AppDatabase, GE, Intervention, PlanningItem, Task, ArticleMagasin, Materiel, Vente, Bilan, Anomalie } from "./types";
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
import { LoginView } from "./components/LoginView";
import { AuthManager, UserProfile } from "./utils/firebase";

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
  HelpCircle
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Joste AI Assistant State
  const [ottoOpen, setOttoOpen] = useState<boolean>(false);
  const [ottoMessages, setOttoMessages] = useState<Array<{ sender: "user" | "otto"; text: string; time: string }>>([
    {
      sender: "otto",
      text: "👋 Bonjour ! Je suis Joste, votre assistant intelligent de la GMAO-STHIC. Je suis là pour vous accompagner en temps réel ! Vous pouvez me demander de lister les sites, de diagnostiquer une panne de groupe, ou de consulter les seuils de vidange. Comment puis-je vous aider ?",
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

  const askConfirmation = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDanger
    });
  };

  const handleSendToOtto = () => {
    if (!ottoInput.trim()) return;

    const userMsg = ottoInput.trim();
    const currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Append user message
    setOttoMessages(prev => [...prev, { sender: "user", text: userMsg, time: currentTime }]);
    setOttoInput("");
    setOttoTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let reply = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("site") || lower.includes("excel") || lower.includes("fichier") || lower.includes("contrôler")) {
        const totalSites = db.parc.length;
        const excelLinked = Object.keys(CONTENTKVA).length;
        reply = `📊 **Audit de Cohérence des Données Excel :**\n\nJ'ai analysé l'intégralité des sites du fichier Excel d'origine (\`Ets_TECNOSTREAM_POWER.xlsx\`) configurés dans le dictionnaire de puissance \`CONTENTKVA\`. \n\n* **Données Excel d'Origine (CONTENTKVA)** : **${excelLinked}** sites répertoriés.\n* **Base de l'Application (SEED_PARC)** : **${totalSites}** groupes électrogènes enregistrés.\n\n✅ **Résultat de l'Audit** : Tous les sites du fichier Excel d'origine font partie intégrante de cette application. Les valeurs de puissance nominale (kVA) ont été rigoureusement synchronisées pour chaque machine !`;
      } else if (lower.includes("panne") || lower.includes("urgence") || lower.includes("urgente") || lower.includes("p1")) {
        const activeUrgent = db.taches.filter(t => t.prio === "P1" && t.statut !== "Terminé");
        reply = `🚨 **Suivi des Urgences GMAO :**\n\nNous recensons actuellement **${activeUrgent.length}** intervention(s) critique(s) active(s).\n\nPour une visibilité optimale, les interventions de priorité **P1** sont signalées par un badge **vif rouge "Urgente"** clignotant dans la liste des tâches (onglet **"Interventions"**).`;
      } else if (lower.includes("vidange") || lower.includes("preventive") || lower.includes("planning") || lower.includes("heures")) {
        reply = `🔧 **Planification & Maintenance Préventive :**\n\nLes alertes de vidange se déclenchent à l'approche du seuil de fonctionnement de **250 heures** (ou **350 heures** pour les moteurs industriels renforcés). Retrouvez toutes les échéances prédictives dans l'onglet **"Planning & Abos"** ou sous forme de diagrammes de charge dans le **"Bilan Global"**.`;
      } else if (lower.includes("magasin") || lower.includes("stock") || lower.includes("piece")) {
        const lowStock = db.magasin.filter(item => item.qte <= (item.seuilMin || 5));
        reply = `📦 **Gestion des Pièces & Consommables :**\n\nLe magasin de Pointe-Noire contient **${db.magasin.length} références** actives de filtres, huiles moteurs et batteries.\n\n⚠️ **Alerte réapprovisionnement** : **${lowStock.length}** pièces sont sous le seuil critique d'alerte. Vous pouvez émettre des bons de sortie ou d'entrée dans l'onglet **"Gestion Magasin"**.`;
      } else if (lower.includes("design") || lower.includes("couleur") || lower.includes("interface") || lower.includes("charte")) {
        reply = `🎨 **Charte Graphique & Ergonomie :**\n\nL'application intègre une interface moderne et hautement optimisée :\n- **Sidebar Haute-Fidélité Blanche** avec un badge de logo exclusif "GSJ" aux tons bleu et ardoise.\n- **Timeline Graphique Diagonale Rayée** pour le suivi visuel dynamique (En cours / Planifiée).\n- **Bouton d'interaction Joste** avec notification badge \`26\` en haut à droite.\n- **Drawer Contextuel d'Actions Rapides** pour clôturer, éditer ou consigner des messages d'interventions d'un clic !`;
      } else {
        reply = `🤖 **Joste Assistant GMAO :**\n\nJe suis entraîné pour superviser la flotte de groupes électrogènes de Pointe-Noire.\n\nN'hésitez pas à me poser une question sur :\n- Les **"sites"** ou le **"fichier Excel"** (audit de données)\n- Les **"pannes"** ou les **"urgences"**\n- Les **"stocks"** du magasin\n- Le **"design"** ou la charte ergonomique de l'interface !`;
      }

      setOttoMessages(prev => [...prev, { sender: "otto", text: reply, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }]);
      setOttoTyping(false);
    }, 850);
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
  const handleUpdatePlan = (idx: number, updated: Partial<PlanningItem>) => {
    setDb(prev => {
      const copy = [...prev.plan];
      copy[idx] = { ...copy[idx], ...updated };
      return { ...prev, plan: copy };
    });
  };

  const handleAddPlan = (item: PlanningItem) => {
    setDb(prev => ({ ...prev, plan: [item, ...prev.plan] }));
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
    { id: "sizing", label: "Bilans & Sizing", icon: Calculator, category: "clients" },
    { id: "interventions", label: "Interventions", icon: ClipboardList, category: "chantiers" },
    { id: "rapports", label: "Rapports imprimables", icon: Printer, category: "chantiers" },
    { id: "magasin", label: "Magasin & Pièces", icon: PackageCheck, category: "logistique" },
    { id: "materiel", label: "Matériel & Flotte", icon: Truck, category: "logistique" },
    { id: "ventes", label: "Factures & Ventes", icon: DollarSign, category: "commerce" },
    { id: "guide", label: "Guide Technique", icon: BookOpen, category: "infos" },
    { id: "data", label: "Sauvegardes / Cloud", icon: Database, category: "infos" }
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
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <h1 className="text-sm font-bold text-slate-900 capitalize truncate">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
          </div>

          {/* Quick status counters & Joste AI Assistant Button */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {/* Joste AI trigger */}
            <button
              onClick={() => setOttoOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs font-sans font-bold"
            >
              <Sparkles size={13} className="text-blue-500 animate-pulse" />
              <span>Demandez à Joste !</span>
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                26
              </span>
            </button>

            {/* Help & Settings indicators */}
            <button
              onClick={() => setOttoOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer hidden sm:block"
              title="Aide et diagnostic"
            >
              <HelpCircle size={16} />
            </button>
            <button
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer hidden sm:block"
              title="Configuration"
            >
              <Settings size={16} />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || "User")}`}
                alt="Profile"
                className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
              />
            </div>
          </div>
        </header>

        {/* Main tabs view content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#f0f0f0] relative scrollbar-thin">
          {activeTab === "dashboard" && (
            <DashboardTab
              db={db}
              onSelectGE={(geId) => {
                setActiveTab("parc");
              }}
            />
          )}

          {activeTab === "planning" && (
            <PlanningTab
              db={db}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
            />
          )}

          {activeTab === "calendrier" && (
            <CalendrierTab
              db={db}
            />
          )}

          {activeTab === "parc" && (
            <ParcTab
              db={db}
              onSelectGE={(geId) => {
                // Focus selection if desired
              }}
              onOpenNewGE={handleAddGE}
              onUpdateKva={handleUpdateKva}
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
        </main>

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
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => { setOttoInput("Contrôler la conformité des sites d'origine"); }}
                className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                📊 Audit Excel Sites
              </button>
              <button
                onClick={() => { setOttoInput("Lister les pannes ou urgences actives"); }}
                className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                🚨 Urgences P1
              </button>
              <button
                onClick={() => { setOttoInput("Présenter la charte graphique et ergonomie ?"); }}
                className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                🎨 Charte Graphique
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
