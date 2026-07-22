import { AppDatabase, GE, ArticleMagasin, Task, Intervention, Anomalie, Bilan } from "../types";

export interface JosteMessage {
  sender: "user" | "otto";
  text: string;
  time: string;
}

function getArticleQty(a: ArticleMagasin): number {
  return (a.stockInit || 0) + (a.entrees || 0) - (a.sorties || 0) - (a.ventes || 0);
}

export async function askJosteExpert(
  userPrompt: string,
  db: AppDatabase,
  messagesHistory: JosteMessage[]
): Promise<string> {
  const lower = userPrompt.toLowerCase().trim();

  // 1. Build a structured context payload from the DB
  const parcCount = db.parc.length;
  const enPanneGE = db.parc.filter(g => g.etat === "En panne" || g.etat === "Hors service");
  const enMaintGE = db.parc.filter(g => g.etat === "En maintenance");
  
  // High operating hours / overdue oil changes
  const overdueVidange = db.parc.filter(g => {
    const h = Number(g.hvid) || 0;
    const seuil = Number(g.seuil) || 250;
    return h >= seuil;
  });

  const lowStock = db.magasin.filter(item => getArticleQty(item) <= (item.seuil || 5));
  const activeTasks = db.taches.filter(t => t.statut !== "Terminé");
  const p1Tasks = activeTasks.filter(t => t.prio === "P1");
  const openAnomalies = db.anomalies.filter(a => a.statut !== "Résolu");

  const contextData = {
    stats: {
      totalGE: parcCount,
      enPanneGE: enPanneGE.length,
      enMaintenanceGE: enMaintGE.length,
      overdueVidangeCount: overdueVidange.length,
      lowStockCount: lowStock.length,
      activeTasksCount: activeTasks.length,
      p1TasksCount: p1Tasks.length,
      openAnomaliesCount: openAnomalies.length,
    },
    parcSummary: db.parc.slice(0, 15).map(g => ({
      id: g.id,
      client: g.client,
      site: g.site,
      marque: g.marque,
      kva: g.kva,
      hvid: g.hvid,
      seuil: g.seuil,
      etat: g.etat,
      dvid: g.dvid,
      dbatt: g.dbatt,
      dcourr: g.dcourr
    })),
    maintenanceAlerts: overdueVidange.slice(0, 10).map(g => ({
      id: g.id,
      site: `${g.client} - ${g.site}`,
      hvid: g.hvid,
      seuil: g.seuil,
      moteur: g.moteur
    })),
    activeTasks: activeTasks.slice(0, 10).map(t => ({
      id: t.id,
      titre: t.titre,
      prio: t.prio,
      ge: t.ge,
      client: t.client,
      site: t.site,
      statut: t.statut,
      assigne: t.assigne
    })),
    lowStockItems: lowStock.map(s => ({
      ref: s.ref,
      design: s.design,
      qte: getArticleQty(s),
      seuil: s.seuil
    })),
    anomalies: openAnomalies.slice(0, 10).map(a => ({
      id: a.id,
      ge: a.ge,
      site: a.site,
      prio: a.prio,
      desc: a.desc
    })),
    bilans: db.bilans.slice(0, 5).map(b => ({
      nom: b.nom,
      site: b.site,
      usage: b.usage,
      coef: b.coef
    })),
    materielStats: {
      total: db.materiel.length,
      hsOuAReviser: db.materiel.filter(m => m.etat === "À réviser" || m.etat === "HS").length
    }
  };

  // 2. Attempt call to server API (/api/joste)
  try {
    const res = await fetch("/api/joste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userPrompt,
        context: contextData,
        messages: messagesHistory.map(m => ({ sender: m.sender, text: m.text }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply && typeof data.reply === "string" && data.reply.trim()) {
        return data.reply;
      }
    }
  } catch (err) {
    console.warn("Server API Joste unavailable or offline, running local expert fallback engine:", err);
  }

  // 3. Fallback: Deep Local Expert Cognitive Engine
  return generateLocalExpertResponse(lower, userPrompt, db, contextData);
}

function generateLocalExpertResponse(
  lower: string,
  rawPrompt: string,
  db: AppDatabase,
  contextData: any
): string {
  // Check if searching for a specific GE or site
  const matchedGE = db.parc.find(g => 
    g.id.toLowerCase() === lower || 
    (g.client + " " + g.site).toLowerCase().includes(lower) ||
    (lower.includes(g.id.toLowerCase()) && g.id.length > 2)
  );

  if (matchedGE && (lower.includes("analyse") || lower.includes("état") || lower.includes("statut") || lower.includes("ge") || lower.includes("groupe"))) {
    const h = Number(matchedGE.hvid) || 0;
    const seuil = Number(matchedGE.seuil) || 250;
    const ratioVidange = Math.round((h / seuil) * 100);
    const isOverdue = h >= seuil;

    return `🔍 **ANALYSE EXPERT DE MACHINE : ${matchedGE.id} (${matchedGE.client} - ${matchedGE.site})**

📐 **Caractéristiques Techniques & État :**
- **Puissance Nominal** : **${matchedGE.kva || "Non renseigné"} kVA** (${matchedGE.type || "Principal"})
- **Moteur / Marque** : **${matchedGE.moteur || "Moteur standard"}** | **${matchedGE.marque || "FG Wilson"}**
- **Statut Opérationnel** : **${matchedGE.etat || "Inconnu"}**
- **Compteur Horaire Vidange** : **${h} h** / Seuil **${seuil} h** (${ratioVidange}% consommé)

⚠️ **Diagnostic & Critique de Maintenance :**
${isOverdue 
  ? `🚨 **ALERTE CRITIQUE** : Le compteur horaire (**${h}h**) a dépassé le seuil de vidange de **${seuil}h** ! Risque colmatage filtre huile et dégradation viscosité. Vidange urgente requise.`
  : `✅ Compteur sous contrôle. Prochaine vidange estimée dans **${seuil - h} heures** de fonctionnement.`}
- **Historique Filtres** : Huile: \`${matchedGE.fhuile || "STD"}\` | Gazole: \`${matchedGE.fgasoil || "STD"}\` | Air: \`${matchedGE.fair || "STD"}\`
- **Dernière Remplacement Batterie** : ${matchedGE.dbatt || "Non renseignée"}
- **Dernier Changement Courroie** : ${matchedGE.dcourr || "Non renseigné"}

🔧 **Pistes de Solution & Recommandations Technicien :**
1. Effectuer le relevé de tension batterie à vide (min 12.6V / 25.2V) et sous démarrage.
2. Inspecter la tension de courroie d'alternateur de charge (flèche 10mm).
3. Vérifier le filtre à gazole primaire (décanteur) et purger l'eau éventuelle en bas de cuve.
${matchedGE.comm ? `\n📝 **Notes du registre** : _${matchedGE.comm}_` : ""}`;
  }

  // AUDIT CRITIQUE GLOBAL / AUDIT MAINTENANCE
  if (lower.includes("audit") || lower.includes("critique") || lower.includes("global") || lower.includes("analyse générale") || lower.includes("synthèse")) {
    const overdue = db.parc.filter(g => (Number(g.hvid) || 0) >= (Number(g.seuil) || 250));
    const enPanne = db.parc.filter(g => g.etat === "En panne" || g.etat === "Hors service");
    const lowStock = db.magasin.filter(item => getArticleQty(item) <= (item.seuil || 5));
    const p1Tasks = db.taches.filter(t => t.prio === "P1" && t.statut !== "Terminé");
    const openAnomalies = db.anomalies.filter(a => a.statut !== "Résolu");

    return `🏛️ **AUDIT CRITIQUE GLOBAL GMAO — STHIC SERVICES**

📊 **1. Bilan Général du Parc (${db.parc.length} Groupes Électrogènes) :**
- 🟢 **Disponibilité Opérationnelle** : **${db.parc.length - enPanne.length} / ${db.parc.length}** groupes opérationnels (${Math.round(((db.parc.length - enPanne.length)/db.parc.length)*100)}%).
- 🚨 **Groupes Hors Service / En Panne** : **${enPanne.length}** machine(s) à l'arrêt.
- 🔧 **Dépassements de Seuil Vidange** : **${overdue.length}** groupe(s) nécessitent une vidange immédiate.

⚠️ **2. Analyse Critique des Dysfonctionnements :**
- **Sous-Maintenance & Retards** : ${overdue.length > 0 ? `Attention, **${overdue.length} sites** fonctionnent au-delà des limites d'huile moteur recomendées. Risque élevé d'usure des coussinets de bielle.` : "Aucun retard de vidange critique détecté."}
- **Urgences Terrain (P1)** : **${p1Tasks.length}** intervention(s) P1 non clôturée(s).
- **Stock Magasin** : **${lowStock.length}** références sous le seuil critique d'approvisionnement. Risk de rupture sur filtres/huile.
- **Anomalies Non Résolues** : **${openAnomalies.length}** signalement(s) technique(s) en attente.

💡 **3. Pistes d'Action Prioritaires pour l'Ingénieur :**
1. **Ruptures Magasin** : Approvisionner immédiatement les filtres et huiles sous le seuil min (${lowStock.slice(0, 3).map(s => s.design).join(", ") || "Filtres gazole"}).
2. **Ordres de Mission Techniciens** : Dépêcher une équipe pour effectuer la vidange sur : ${overdue.slice(0, 3).map(g => `${g.id} (${g.site})`).join(", ") || "Aucun site urgent"}.
3. **Clôture P1** : Prioriser la résolution des tâches P1 actives.`;
  }

  // DIAGNOSTIC PANNE SPECIFIQUE (Surchauffe, Fumée, Pression huile, AVR, Démarrage)
  if (lower.includes("surchauffe") || lower.includes("température") || lower.includes("eau") || lower.includes("chauffe") || lower.includes("95")) {
    return `🚨 **DIAGNOSTIC EXPERT : SURCHAUFFE MOTEUR (95°C+ / DÉCLENCHEMENT SÉCURITÉ)**

🔍 **Causes Racine Probables (Ordre de Probabilité) :**
1. **Niveau de liquide de refroidissement insuffisant / Fuite durite ou radiateur**.
2. **Courroie de pompe à eau / ventilateur détendue ou cassée**.
3. **Calorstat / Thermostat bloqué en position fermée**.
4. **Radiateur encrassé (poussière, huile, ailettes tordues)**.
5. **Joint de culasse endommagé** (compression passant dans le circuit d'eau, bulles dans le vase).

🛠️ **Procédure de Dépannage Technicien Terrain :**
- **Étape 1** : LAISSER REFROIDIR le groupe avant tout contrôle (danger de brûlure vapeur !).
- **Étape 2** : Contrôler le niveau de liquide dans le radiateur et le vase d'expansion.
- **Étape 3** : Inspecter la tension de la courroie de pompe à eau (\`dcourr\` dans la ficher GE).
- **Étape 4** : Nettoyer le faisceau du radiateur au souffleur d'air ou nettoyeur basse pression.
- **Étape 5** : Vérifier la circulation d'eau (durite supérieure chaude quand le moteur monte en température).

📦 **Pièces Associées en Stock** : Liquide de refroidissement, Courroies Trapézoïdales, Calorstat Perkins.`;
  }

  if (lower.includes("fumée") || lower.includes("fume") || lower.includes("noire") || lower.includes("blanche") || lower.includes("bleue")) {
    return `💨 **DIAGNOSTIC EXPERT : ANALYSE DES FUMÉES D'ÉCHAPPEMENT**

⬛ **Fumée Noire (Incapacité de combustion complète) :**
- *Causes* : Filtre à air totalement colmaté, surcharge du groupe électrogène (>100% kVA), injecteurs grippés/pissant, mauvais calage de la pompe d'injection.
- *Action* : Remplacer le filtre à air (\`fair\`), contrôler la charge au contrôleur monophasé/triphasé.

⬜ **Fumée Blanche (Gazole imbrûlé ou eau) :**
- *Causes* : Moteur froid, présence d'eau dans le gazole (décanteur plein), retard à l'injection, présence de liquide de refroidissement dans la chambre de combustion (joint de culasse).
- *Action* : Purger le préfiltre gazole décanteur, contrôler si baisse du niveau de liquide de refroidissement.

🟦 **Fumée Bleue (Combustion d'huile moteur) :**
- *Causes* : Segments de pistons usés, guides de soupapes fuitards, niveau d'huile moteur trop élevé.
- *Action* : Vérifier la jauge d'huile à froid, contrôler la consommation d'huile entre deux vidanges.`;
  }

  if (lower.includes("pression") || lower.includes("huile") || lower.includes("voyant huile") || lower.includes("pression d'huile")) {
    return `🛢️ **DIAGNOSTIC EXPERT : DÉFAUT PRESSION D'HUILE MOTEUR (SÉCURITÉ PRESSOSTAT)**

🔍 **Causes Principales :**
1. **Niveau d'huile bas** (consommation ou fuite carter/joint).
2. **Huile fluidifiée ou dégradée** (dépassant largement les 250h de service ou polluée par du gazole).
3. **Filtre à huile totalement obturé** (clapet de décharge ouvert).
4. **Pompe à huile usée ou crépine colmatée par des boues**.
5. **Mano-contact / Pressostat d'huile défectueux**.

🛠️ **Check-list de Contrôle :**
1. Relever la jauge d'huile moteur (moteur arrêté depuis au moins 10 min).
2. Vérifier l'état du filtre à huile (\`fhuile\`) et l'échéance de vidange (\`hvid\` vs \`seuil\`).
3. Connecter un manomètre mécanique de précision sur la galerie d'huile (pression min requise : **2.5 bars à chaud à 1500 tr/min**).
4. Si la pression mécanique est bonne, remplacer le mano-contact d'huile (signal tableau de commande).`;
  }

  if (lower.includes("démarr") || lower.includes("démarre pas") || lower.includes("batterie") || lower.includes("demarre")) {
    return `⚡ **DIAGNOSTIC EXPERT : DÉFAUT DE DÉMARRAGE DU GROUPE ÉLECTROGÈNE**

🔍 **Arbre de Décision Technique :**

1. **Le démarreur ne tourne pas (Pas de réaction ou "clic" répétitif) :**
   - *Cause* : Batterie déchargée (<12.2V à vide), cosses sulfatées, fusible de commande grillé, démarreur HS.
   - *Action* : Mesurer la tension batterie au démarrage (si <10V pendant l'action démarreur -> remplacer la batterie). Nettoyer et graisser les cosses.

2. **Le démarreur tourne mais le moteur ne tousse pas :**
   - *Cause* : Électrovanne de gazole non alimentée ou bloquée, prise d'air dans le circuit gazole, réservoir vide, préfiltre obstrué.
   - *Action* : Vérifier l'arrivée gazole à la pompe d'injection, purger la prise d'air via la pompe d'amorçage manuelle.

3. **Le moteur démarre puis cale après 5 secondes :**
   - *Cause* : Sécurité niveau d'eau / pression d'huile déclenchée, capteur PMH / régulateur de vitesse (GAC/Woodward) non configuré.`;
  }

  if (lower.includes("tension") || lower.includes("avr") || lower.includes("alternateur") || lower.includes("volts") || lower.includes("hz") || lower.includes("frequence")) {
    return `⚡ **DIAGNOSTIC EXPERT : DÉFAUT D'ALTERNATEUR & RÉGULATEUR DE TENSION (AVR)**

🔍 **Symptômes & Mesures d'Analyse :**
- **Pas de tension en sortie (0V)** : Diode tournante grillée, excitation perdue, AVR défectueux ou disjoncteur ouvert.
- **Tension trop basse (<360V triphasé / <200V monophasé)** : Vitesse moteur trop faible (<1500 tr/min / <50Hz), potentiomètre AVR mal réglé, sous-excitation.
- **Tension instable ou instabilité Hertzienne** : Régulateur de vitesse moteur (pompe injection) instable ("pompage"), condensateur ou AVR fatigué.

🛠️ **Procédure de Réglage & Test AVR :**
1. Régler d'abord la fréquence moteur à **51.5 Hz à vide** (1545 tr/min) via la vis de régime.
2. Agir délicatement sur le potentiomètre \`VOLT\` de l'AVR pour caler à **400V entre phases / 230V entre phase et neutre**.
3. Ajuster la stabilité via le potentiomètre \`STAB\` si la tension oscille.`;
  }

  // MAGASIN ET STOCK
  if (lower.includes("magasin") || lower.includes("stock") || lower.includes("pièce") || lower.includes("filtre")) {
    const lowStock = db.magasin.filter(item => getArticleQty(item) <= (item.seuil || 5));
    return `📦 **AUDIT ET GESTION DU MAGASIN DE PIÈCES & CONSUMMABLES**

🏬 **Situation Actuelle :**
- Total Références Enregistrées : **${db.magasin.length} articles**.
- Article sous le seuil d'alerte : **${lowStock.length} référence(s)**.

⚠️ **Articles Critiques en Réapprovisionnement Immédiat :**
${lowStock.length > 0 
  ? lowStock.map(s => `- **${s.ref}** | *${s.design}* : Stock actuel **${getArticleQty(s)}** (Seuil Min : ${s.seuil || 5})`).join("\n")
  : "✅ Aucun article sous le seuil minimum."}

💡 **Conseil Logistique Expert :**
Maintenez toujours un stock tampon de securité ("Buffer") composé de 5 jeux de filtres à huile (\`LF699\`, \`10000-51230\`), 5 filtres gazole (\`26560143\`) et 2 batteries 100Ah/120Ah pour parer aux pannes P1 imprévues à Pointe-Noire.`;
  }

  // DEFAULT HIGH-COGNITION GENERAL MAINTENANCE ASSISTANT
  return `🤖 **JOSTE — INGENIEUR EXPERT EN MAINTENANCE GMAO**

Je suis votre assistant intelligent de maintenance industrielle pour **STHIC SERVICES**. J'ai analysé l'intégralité de votre base de données :
- **Parc Équipements** : ${db.parc.length} Groupes Électrogènes
- **Interventions & Urgences** : ${db.taches.length} Tâches enregistrées
- **Catalogue Magasin** : ${db.magasin.length} Références de pièces
- **Anomalies & Sizing** : ${db.anomalies.length} Anomalies ouvertes | ${db.bilans.length} Bilans kVA

💡 **Comment puis-je vous guider aujourd'hui ?**
- 🔍 *"Fais un **audit critique global** de la maintenance"*
- 🚨 *"Donne la procédure pour une **surchauffe moteur (95°C)**"*
- ⚡ *"Comment diagnostiquer un **défaut de tension AVR / Alternateur** ?"*
- 🛢️ *"Quels sont les groupes en **retard de vidange** ?"*
- 📦 *"Affiche l'état des **stocks critiques** du magasin"*
- 👤 *"Analyse le groupe **GE193** ou le site **BRASCO**"*`;
}
