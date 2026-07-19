import React, { useState, useRef } from "react";
import { AppDatabase } from "../types";
import { todayYMD } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onRestoreDB: (restored: AppDatabase) => void;
  onResetDB: () => void;
}

export const DonneesTab: React.FC<Props> = ({ db, onRestoreDB, onResetDB }) => {
  const [supaUrl, setSupaUrl] = useState(() => localStorage.getItem("gmao_supa_url") || "");
  const [supaKey, setSupaKey] = useState(() => localStorage.getItem("gmao_supa_key") || "");
  const [logs, setLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const handleSaveCredentials = () => {
    localStorage.setItem("gmao_supa_url", supaUrl);
    localStorage.setItem("gmao_supa_key", supaKey);
    addLog("Identifiants Supabase enregistrés localement.");
  };

  const handleExportJSON = () => {
    const rawStr = JSON.stringify(db, null, 2);
    const blob = new Blob([rawStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sthic_gmao_backup_${todayYMD()}.json`;
    link.click();
    addLog("Export de la base de données complète (JSON) réussi !");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result;
        if (typeof raw === "string") {
          const parsed = JSON.parse(raw);
          if (parsed.parc && parsed.inter && parsed.plan && parsed.taches) {
            onRestoreDB(parsed);
            addLog("Restauration de la base effectuée avec succès !");
            alert("Restauration réussie !");
          } else {
            alert("Fichier JSON invalide. Structure GMAO non détectée.");
          }
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier de sauvegarde.");
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (confirm("⚠️ AVERTISSEMENT : Cette action écrasera toutes vos modifications et rechargera les données de démonstration STHIC d'origine. Procéder ?")) {
      onResetDB();
      addLog("Réinitialisation de la base de données (SEED d'usine) effectuée.");
    }
  };

  // Mock Supabase sync client-side script matching original prototype
  const handlePushToSupabase = async () => {
    if (!supaUrl || !supaKey) {
      alert("Veuillez renseigner votre URL Supabase et votre Clé API Service Role.");
      return;
    }
    setSyncing(true);
    addLog("Début de la synchronisation push vers Supabase...");

    try {
      // Simulate real API endpoints payload or fetch
      addLog(`Envoi de ${db.parc.length} GEs, ${db.inter.length} rapports historiques, ${db.plan.length} planifications et ${db.taches.length} interventions actives...`);

      // Mock real API call
      await new Promise(r => setTimeout(r, 1500));

      addLog("SUCCESS : Base de données poussée avec succès vers Supabase ! (Simulation)");
      alert("Synchronisation Supabase Push réussie ! (Simulation)");
    } catch (err: any) {
      addLog(`ERROR : Échec de la synchronisation : ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!supaUrl || !supaKey) {
      alert("Veuillez renseigner votre URL Supabase et votre Clé API Service Role.");
      return;
    }
    setSyncing(true);
    addLog("Récupération des données depuis Supabase (pull)...");

    try {
      await new Promise(r => setTimeout(r, 1500));
      addLog("Données récupérées depuis le Cloud Supabase.");
      addLog("SUCCESS : Base locale synchronisée avec le cloud. (Simulation)");
      alert("Synchronisation Supabase Pull réussie ! (Simulation)");
    } catch (err: any) {
      addLog(`ERROR : Échec de la récupération : ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div id="data" className="space-y-6">
      <h2 className="text-xl font-extrabold text-blue-900 border-b pb-2">
        ⚙️ Maintenance des données &amp; Sauvegardes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup / Restore */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-2xs">
          <div className="border-l-4 border-l-purple-600 pl-2">
            <h3 className="text-sm font-extrabold text-blue-900">💾 Sauvegarde &amp; Restauration Locales</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Téléchargez l'intégralité de vos données GMAO STHIC (parc, interventions actives, planifications, bilans de puissance, catalogue magasin, factures) sous forme de fichier JSON sur votre disque, ou restaurez un fichier précédemment exporté.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              📥 Exporter la base (JSON)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              📤 Restaurer depuis fichier
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".json"
            />
          </div>

          <div className="pt-4 border-t">
            <div className="text-[10px] font-bold text-red-600 uppercase mb-2">Zone de danger</div>
            <button
              onClick={handleFactoryReset}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              ⚠️ Réinitialiser la base (SEED d'usine)
            </button>
          </div>
        </div>

        {/* Supabase credentials and synchronization */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-2xs">
          <div className="border-l-4 border-l-blue-600 pl-2">
            <h3 className="text-sm font-extrabold text-blue-900">☁️ Synchronisation Supabase Cloud</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Configurez vos identifiants d'API Supabase pour synchroniser automatiquement les fiches de vos Groupes Électrogènes et rapports d'interventions avec votre base de données Cloud Supabase.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Supabase URL</label>
              <input
                type="text"
                value={supaUrl}
                onChange={(e) => setSupaUrl(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                placeholder="https://xxxxxx.supabase.co"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Service Role Key / API Key</label>
              <input
                type="password"
                value={supaKey}
                onChange={(e) => setSupaKey(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                placeholder="eyJhbGciOi..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveCredentials}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Sauvegarder identifiants
              </button>
              <button
                onClick={handlePushToSupabase}
                disabled={syncing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {syncing ? "Synchro en cours..." : "Push vers Cloud 📤"}
              </button>
              <button
                onClick={handlePullFromSupabase}
                disabled={syncing}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {syncing ? "Synchro..." : "Pull depuis Cloud 📥"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Console logs */}
      <div className="bg-slate-900 rounded-2xl p-5 space-y-2 text-white font-mono text-xs">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-slate-800">
          📠 Console GMAO STHIC - Logs d'activités
        </div>
        <div className="h-[140px] overflow-y-auto space-y-1.5 pt-1.5 scrollbar-thin">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className="text-green-400 font-medium">
                {log}
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic">Aucun événement enregistré. Prêt à travailler.</div>
          )}
        </div>
      </div>
    </div>
  );
};
