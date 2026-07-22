import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Server-side Gemini AI setup
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI on server:", err);
  }
}

// API endpoint for Joste Assistant
app.post("/api/joste", async (req, res) => {
  try {
    const { prompt, context, messages } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Le message (prompt) est requis." });
    }

    if (ai) {
      const systemInstruction = `Tu es JOSTE, l'Assistant Expert Ingénieur Électromécanique et Chef de Maintenance de la GMAO STHIC SERVICES (Groupes Électrogènes, Moteurs Industriels Perkins/Wilson/SDMO/CAT, Alternateurs AVR, Diagnostics Electriques & Mécaniques, Gestion de Stock Magasin & Logistique Flotte).

VOTRE RÔLE ET POSTURE D'EXPERT :
1. **ANALYSE COGNITIVE GLOBALE ET CRITIQUE CONSTRUCTIVE** :
   - Tu ne te contentes jamais d'un résumé passif. Tu portes un regard d'EXPERT CRITIQUE et RIGOUREUX sur l'état de la maintenance.
   - Tu dénonces et mets en évidence la sous-maintenance, les retards de vidange, les dépassements d'heures de fonctionnement (seuil 250h/350h), les filtres colmatés, les batteries hors d'âge, les courroies vétustes, et les ruptures de stock imminentes.
   - Tu analyses la pertinence du sizing des groupes (kVA), le déséquilibre de charge, les consommations anormales d'huile/carburant et la récurrence des pannes (5 Pourquoi / Cause Racine).

2. **PISTES DE SOLUTION ET DIAGNOSTIC TECHNIQUE PAS À PAS** :
   - Pour chaque panne, symptôme ou demande d'intervention (ex: fumée noire/blanche, baisse de pression d'huile, surchauffe 95°C+, baisse de tension AVR, défaut de démarrage, fuite gazole, déclenchement disjoncteur) :
     a) Donne le **Diagnostic Différentiel** (hypothèses techniques classées par ordre de probabilité).
     b) Fournis la **Check-list de Diagnostic Terrain** pour le technicien (tests au multimètre, prise de pression huile/gazole au manomètre, calage distribution, purge air).
     c) Liste les **Pièces & Consommables Nécessaires** (références filtres, huile 15W40, courroie, batterie) avec vérification de la disponibilité dans le stock magasin.
     d) Donne des **Consignes de Sécurité** (consignation électrique, refroidissement du bloc, gants anti-brûlure).

3. **INTEGRATION COMPLETE DU CONTEXTE TRANSMIS** :
   - Utilise TOUTES les données transmises dans la requête : les groupes électrogènes exacts (ex: GE193 BRASCO, GE194 VINDOULOU, GE001, etc.), les compteurs horaires, les références magasin, les interventions P1/P2/P3, les anomalies enregistrées, les mouvements et les bilans de puissance.

4. **TON ET FORMATAGE** :
   - Ton ultra-professionnel, assertif, technique, clair et structuré.
   - Utilise des titres clairs en Markdown, des puces aérées, des blocs de code pour les procédures si nécessaire, et des émojis ciblés (🔧, 🚨, 📦, 📊, ⚠️, ✅, ⚡, 🔍).`;

      const contentsPrompt = `
CONTEXTE SYNTHETIQUE DE LA BASE DE DONNEES GMAO :
- Statistique Parc GE : Total = ${context?.stats?.totalGE || 0}, En panne = ${context?.stats?.enPanneGE || 0}, En maintenance = ${context?.stats?.enMaintenanceGE || 0}
- Alertes Maintenance & Vidanges : ${JSON.stringify(context?.maintenanceAlerts || [])}
- Tâches & Interventions Actives (Critique P1/P2) : ${JSON.stringify(context?.activeTasks || [])}
- Alertes Stock Magasin (Sous Seuil Min) : ${JSON.stringify(context?.lowStockItems || [])}
- Anomalies Ouvertes : ${JSON.stringify(context?.anomalies || [])}
- Bilans de Charge & Sizing kVA : ${JSON.stringify(context?.bilans || [])}
- Flotte & Matériel : ${JSON.stringify(context?.materielStats || {})}

HISTORIQUE RECENT DE CONVERSATION :
${JSON.stringify((messages || []).slice(-6))}

DEMANDE / QUESTION DE L'UTILISATEUR :
"${prompt}"
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contentsPrompt,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      return res.json({ reply: response.text });
    }

    return res.json({
      fallback: true,
      message: "Processeur AI serveur indisponible.",
    });
  } catch (err: any) {
    console.error("Erreur serveur Joste AI:", err);
    return res.status(500).json({
      error: "Erreur serveur Joste AI",
      details: err.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 GMAO-STHIC Server démarré sur le port ${PORT}`);
  });
}

startServer();
