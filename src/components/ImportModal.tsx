import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { AppDatabase, PlanningItem, GE, Intervention } from "../types";
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  Database,
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";
import { todayYMD } from "../utils/calculations";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: AppDatabase;
  onRestoreDB: (restored: AppDatabase) => void;
  onAppendPlan: (items: PlanningItem[]) => void;
  onReplacePlan: (items: PlanningItem[]) => void;
  onUpdateParc?: (newGEs: GE[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  db,
  onRestoreDB,
  onAppendPlan,
  onReplacePlan,
  onUpdateParc
}) => {
  const [fileType, setFileType] = useState<"excel" | "json" | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [excelPreview, setExcelPreview] = useState<PlanningItem[] | null>(null);
  const [jsonPreview, setJsonPreview] = useState<AppDatabase | null>(null);
  const [parsedGeCount, setParsedGeCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFileType(null);
    setFileName("");
    setExcelPreview(null);
    setJsonPreview(null);
    setParsedGeCount(0);
    setErrorMsg("");
    setSuccessMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Download sample Excel template
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        DATE: todayYMD(),
        CLIENT: "AGROFAB",
        SITE: "VINDOULOU",
        GE: "GE002",
        TECHNICIEN: "SANTONY KIBANGOU",
        TYPE: "Préventive",
        NOTE: "Vidange d'huile et remplacement des filtres"
      },
      {
        DATE: todayYMD(),
        CLIENT: "BPC",
        SITE: "G.U.D PORT",
        GE: "GE033",
        TECHNICIEN: "MBOUNGOU WILFRIED",
        TYPE: "Préventive",
        NOTE: "Remplacement du filtre décanteur"
      },
      {
        DATE: todayYMD(),
        CLIENT: "TOTAL",
        SITE: "S/S LOSANGE",
        GE: "GE176",
        TECHNICIEN: "MBOUSSI PARFAIT",
        TYPE: "Corrective",
        NOTE: "Contrôle circuit électrique et relais"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planification STHIC");
    XLSX.writeFile(workbook, `Modele_Import_GMAO_STHIC.xlsx`);
  };

  // Process File Upload
  const processFile = (file: File) => {
    setErrorMsg("");
    setSuccessMsg("");
    setFileName(file.name);

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
    const isJson = file.name.endsWith(".json");

    if (!isExcel && !isJson) {
      setErrorMsg("Format de fichier non supporté. Veuillez sélectionner un fichier .xlsx, .xls, .csv ou .json.");
      return;
    }

    if (isJson) {
      setFileType("json");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed && (parsed.parc || parsed.plan || parsed.inter || parsed.taches)) {
            setJsonPreview(parsed);
          } else {
            setErrorMsg("Structure de sauvegarde JSON invalide ou non reconnue pour GMAO STHIC.");
          }
        } catch (err: any) {
          setErrorMsg("Erreur lors de la lecture du fichier JSON : " + err.message);
        }
      };
      reader.readAsText(file);
    } else if (isExcel) {
      setFileType("excel");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const wb = XLSX.read(buffer, { type: "array" });
          const sheetName = wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

          if (!rawRows || rawRows.length < 2) {
            setErrorMsg("Le fichier Excel ne contient pas de lignes de données suffisantes.");
            return;
          }

          // Header Detection
          let headerIdx = -1;
          for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
            const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(" ");
            if (rowStr.includes("date") || rowStr.includes("client") || rowStr.includes("site") || rowStr.includes("ge") || rowStr.includes("tech")) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) headerIdx = 0;

          const headers = rawRows[headerIdx].map(c => String(c).trim().toLowerCase());
          const dateCol = headers.findIndex(h => h.includes("date"));
          const clientCol = headers.findIndex(h => h.includes("client"));
          const siteCol = headers.findIndex(h => h.includes("site") || h.includes("lieu"));
          const geCol = headers.findIndex(h => h.includes("ge") || h.includes("groupe") || h.includes("code"));
          const techCol = headers.findIndex(h => h.includes("tech") || h.includes("intervenant") || h.includes("agent"));
          const noteCol = headers.findIndex(h => h.includes("note") || h.includes("remarque") || h.includes("objet") || h.includes("descp"));

          const items: PlanningItem[] = [];
          for (let i = headerIdx + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0) continue;

            const clientVal = clientCol >= 0 ? String(row[clientCol] || "").trim() : "";
            const siteVal = siteCol >= 0 ? String(row[siteCol] || "").trim() : "";
            const geVal = geCol >= 0 ? String(row[geCol] || "").trim() : "";

            if (!clientVal && !siteVal && !geVal) continue;

            // Date parsing
            let formattedDate = todayYMD();
            if (dateCol >= 0 && row[dateCol]) {
              const rawDate = row[dateCol];
              if (typeof rawDate === "number") {
                const dateObj = XLSX.SSF.parse_date_code(rawDate);
                if (dateObj) {
                  const y = dateObj.y;
                  const m = String(dateObj.m).padStart(2, "0");
                  const d = String(dateObj.d).padStart(2, "0");
                  formattedDate = `${y}-${m}-${d}`;
                }
              } else if (typeof rawDate === "string") {
                const match = rawDate.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
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
              date: formattedDate,
              client: clientVal || "CLIENT STHIC",
              site: siteVal || "SITE",
              ge: geVal,
              tech: techCol >= 0 ? String(row[techCol] || "").trim() : "",
              note: noteCol >= 0 ? String(row[noteCol] || "").trim() : "Importé via Fichier Excel",
              exec: null
            });
          }

          if (items.length === 0) {
            setErrorMsg("Aucune ligne de données exploitable trouvée dans le fichier Excel.");
          } else {
            setExcelPreview(items);
          }
        } catch (err: any) {
          setErrorMsg("Erreur lors de l'analyse du fichier Excel : " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // File Drop / Selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Execution: Append / Merge
  const handleApplyAppend = () => {
    if (fileType === "excel" && excelPreview) {
      onAppendPlan(excelPreview);
      setSuccessMsg(`✅ ${excelPreview.length} planifications ajoutées avec succès !`);
      setTimeout(() => handleClose(), 1500);
    } else if (fileType === "json" && jsonPreview) {
      const merged: AppDatabase = {
        ...db,
        parc: [...db.parc, ...(jsonPreview.parc || [])],
        plan: [...db.plan, ...(jsonPreview.plan || [])],
        inter: [...db.inter, ...(jsonPreview.inter || [])],
        taches: [...db.taches, ...(jsonPreview.taches || [])],
        magasin: [...db.magasin, ...(jsonPreview.magasin || [])],
        materiel: [...db.materiel, ...(jsonPreview.materiel || [])],
        ventes: [...db.ventes, ...(jsonPreview.ventes || [])]
      };
      onRestoreDB(merged);
      setSuccessMsg("✅ Données fusionnées avec succès dans la base actuelle !");
      setTimeout(() => handleClose(), 1500);
    }
  };

  // Execution: Replace / Overwrite
  const handleApplyReplace = () => {
    if (fileType === "excel" && excelPreview) {
      onReplacePlan(excelPreview);
      setSuccessMsg(`✅ Planning remplacé intégralement par les ${excelPreview.length} lignes du fichier.`);
      setTimeout(() => handleClose(), 1500);
    } else if (fileType === "json" && jsonPreview) {
      onRestoreDB(jsonPreview);
      setSuccessMsg("✅ Base de données entièrement restaurée et remplacée depuis le fichier JSON !");
      setTimeout(() => handleClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 space-y-5 text-slate-800 relative my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Importer &amp; Mettre à Jour par Fichier
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mettez à jour votre planning, votre parc GE ou restaurer votre base à partir d'un fichier Excel ou JSON.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls & Template download */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50/70 p-3 rounded-2xl border border-blue-100/80">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <FileSpreadsheet size={16} className="text-blue-600" />
            <span>Formats acceptés : <strong>.xlsx, .xls, .csv, .json</strong></span>
          </div>
          <button
            onClick={downloadSampleTemplate}
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            <Download size={14} />
            <span>Télécharger Modèle Excel</span>
          </button>
        </div>

        {/* Dropzone Area */}
        {!excelPreview && !jsonPreview && (
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-600 bg-blue-50/80 scale-[1.01]"
                : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/60"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Glissez votre fichier ici ou cliquez pour le sélectionner
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-md">
              Mettez à jour automatiquement les données STHIC avec votre fichier d'intervention ou votre sauvegarde.
            </p>
          </label>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center gap-3 font-medium">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-xs flex items-center gap-3 font-bold">
            <CheckCircle2 className="text-green-600 shrink-0" size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Excel Preview Table */}
        {excelPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={18} />
                <span className="text-xs font-black text-slate-900">
                  Fichier Excel analysé : <span className="text-blue-700">{fileName}</span>
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                {excelPreview.length} lignes extraites
              </span>
            </div>

            {/* Table snippet */}
            <div className="border rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 font-black uppercase text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Client</th>
                    <th className="p-2.5">Site</th>
                    <th className="p-2.5">GE</th>
                    <th className="p-2.5">Technicien</th>
                    <th className="p-2.5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {excelPreview.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50">
                      <td className="p-2.5 font-bold">{row.date}</td>
                      <td className="p-2.5 font-extrabold text-blue-900">{row.client}</td>
                      <td className="p-2.5 text-slate-600">{row.site}</td>
                      <td className="p-2.5 font-bold text-slate-800">{row.ge || "—"}</td>
                      <td className="p-2.5 text-slate-700">{row.tech || "Non assigné"}</td>
                      <td className="p-2.5 text-slate-500 truncate max-w-[150px]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {excelPreview.length > 5 && (
              <p className="text-[10px] text-slate-400 font-bold text-center italic">
                + {excelPreview.length - 5} autres lignes prêtes pour l'importation...
              </p>
            )}

            {/* Decision Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleApplyAppend}
                type="button"
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <RefreshCw size={15} />
                <span>Ajouter &amp; Fusionner ({excelPreview.length} lignes)</span>
              </button>
              <button
                onClick={handleApplyReplace}
                type="button"
                className="py-3 px-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <ArrowRight size={15} />
                <span>Remplacer Intégralement le Planning</span>
              </button>
            </div>
          </div>
        )}

        {/* JSON Preview */}
        {jsonPreview && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                <Database size={18} className="text-emerald-600" />
                <span>Sauvegarde JSON Valide Détectée</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-slate-700 pt-1">
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Parc GE</span>
                  <span className="text-emerald-700 font-black text-sm">{jsonPreview.parc?.length || 0} GEs</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Planning</span>
                  <span className="text-blue-700 font-black text-sm">{jsonPreview.plan?.length || 0} items</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Interventions</span>
                  <span className="text-purple-700 font-black text-sm">{jsonPreview.inter?.length || 0} rapports</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Magasin</span>
                  <span className="text-amber-700 font-black text-sm">{jsonPreview.magasin?.length || 0} articles</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleApplyAppend}
                type="button"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <RefreshCw size={15} />
                <span>Fusionner avec la Base Actuelle</span>
              </button>
              <button
                onClick={handleApplyReplace}
                type="button"
                className="py-3 px-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <ArrowRight size={15} />
                <span>Restaurer &amp; Écraser la Base</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
          <button
            onClick={resetState}
            type="button"
            className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer underline"
          >
            Réinitialiser la sélection
          </button>
          <button
            onClick={handleClose}
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
