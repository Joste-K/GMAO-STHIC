import React, { useState, useRef, useEffect } from "react";
import { AppDatabase } from "../types";
import { todayYMD } from "../utils/calculations";
import { AuthManager, CloudManager, UserProfile } from "../utils/firebase";
import { Cloud, Cpu, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface Props {
  db: AppDatabase;
  user: UserProfile;
  onRestoreDB: (restored: AppDatabase) => void;
  onResetDB: () => void;
  onOpenImportModal?: () => void;
}

export const DonneesTab: React.FC<Props> = ({ db, user, onRestoreDB, onResetDB, onOpenImportModal }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    // Initial status log
    addLog(`Utilisateur connecté : ${user.displayName || user.email}`);
    const isReal = AuthManager.isRealFirebase();
    if (isReal) {
      addLog("🔥 Connexion Firebase active. Prêt pour la synchronisation Cloud Firestore.");
    } else {
      addLog("ℹ️ Mode Sandbox (simulation) actif. Synchronisation cloud simulée via LocalStorage.");
    }

    // Try to load last sync metadata if available
    const savedMeta = localStorage.getItem(`sthic_last_sync_date_${user.uid}`);
    if (savedMeta) {
      setLastSyncDate(savedMeta);
    }
  }, [user]);

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
            addLog("SUCCESS : Restauration de la base effectuée avec succès depuis le fichier JSON !");
          } else {
            addLog("ERROR : Fichier JSON invalide. Structure de données GMAO STHIC non détectée.");
          }
        }
      } catch (err) {
        addLog("ERROR : Échec de la lecture ou de l'analyse du fichier de sauvegarde.");
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    onResetDB();
    addLog("Action : Réinitialisation d'usine demandée.");
  };

  const handlePushToFirebase = async () => {
    setSyncing(true);
    addLog("Début de l'envoi de sauvegarde vers Firebase Cloud...");
    try {
      addLog(`Préparation du payload : ${db.parc.length} GEs, ${db.inter.length} rapports historiques, ${db.plan.length} planifications, ${db.taches.length} interventions actives...`);
      await CloudManager.saveToCloud(user.uid, db);
      const nowStr = new Date().toLocaleString("fr-FR");
      localStorage.setItem(`sthic_last_sync_date_${user.uid}`, nowStr);
      setLastSyncDate(nowStr);
      addLog("SUCCESS : Base de données sauvegardée avec succès sur le cloud Firebase Firestore !");
    } catch (err: any) {
      addLog(`ERROR : Échec de l'envoi vers le cloud : ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setSyncing(true);
    addLog("Récupération de la dernière sauvegarde depuis Firebase Cloud...");
    try {
      const data = await CloudManager.loadFromCloud(user.uid);
      if (data) {
        if (data.parc && data.inter && data.plan && data.taches) {
          onRestoreDB(data);
          const nowStr = new Date().toLocaleString("fr-FR");
          localStorage.setItem(`sthic_last_sync_date_${user.uid}`, nowStr);
          setLastSyncDate(nowStr);
          addLog("SUCCESS : Base de données locale restaurée et synchronisée avec le cloud Firebase !");
        } else {
          addLog("WARNING : Le document trouvé sur Firebase ne correspond pas à une structure GMAO valide.");
        }
      } else {
        addLog("INFO : Aucune sauvegarde cloud existante trouvée pour ce compte. Veuillez d'abord faire un 'Push vers Cloud'.");
      }
    } catch (err: any) {
      addLog(`ERROR : Échec de la récupération depuis le cloud : ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const isReal = AuthManager.isRealFirebase();

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
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-2 shadow-xs"
              >
                <span>📥 Mettre à jour depuis un fichier (Excel/JSON)</span>
              </button>
            )}
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              💾 Exporter la base (JSON)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              📤 Restauration rapide JSON
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

        {/* Firebase Synchronization */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-2xs">
          <div className="border-l-4 border-l-blue-600 pl-2">
            <h3 className="text-sm font-extrabold text-blue-900">☁️ Synchronisation Firebase Cloud</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Conservez vos données à l'abri et synchronisées sur plusieurs appareils en liant votre base de données à votre compte Firebase. Tout est enregistré de manière sécurisée et peut être importé/exporté en temps réel.
          </p>

          {/* Connection Status Indicator */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            isReal
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {isReal ? (
              <CheckCircle2 size={16} className="shrink-0 text-green-600 mt-0.5" />
            ) : (
              <Cpu size={16} className="shrink-0 text-amber-600 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-[10px]">
                {isReal ? "🔥 Firebase Firestore Connecté" : "⚠️ Simulation Locale Active (Sandbox)"}
              </div>
              <div className="text-[11px] leading-relaxed">
                {isReal 
                  ? "Votre compte est connecté à la base de données Firestore réelle. Vos push/pull s'enregistrent sur l'infrastructure Google Cloud." 
                  : "Le système fonctionne en mode Sandbox. Les données cloud sont simulées et sauvegardées localement dans votre navigateur."
                }
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1 bg-white/60 p-1.5 rounded border border-black/5">
                Path : <span className="font-bold text-slate-800">users_gmao_db/{user.uid}</span>
              </div>
            </div>
          </div>

          {/* Sync actions */}
          <div className="pt-2 space-y-3">
            {lastSyncDate && (
              <div className="text-[10px] text-slate-500 font-medium">
                Dernière synchronisation : <span className="font-bold text-slate-800">{lastSyncDate}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handlePushToFirebase}
                disabled={syncing}
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                <span>{syncing ? "Envoi..." : "Push vers Cloud 📤"}</span>
              </button>
              <button
                onClick={handlePullFromFirebase}
                disabled={syncing}
                className="flex-1 h-10 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                <span>{syncing ? "Réception..." : "Pull depuis Cloud 📥"}</span>
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
