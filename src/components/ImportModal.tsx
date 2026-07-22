import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { AppDatabase, PlanningItem, GE, Intervention, ArticleMagasin } from "../types";
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
  Wrench,
  Package,
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

interface ParsedExcelResult {
  plan: PlanningItem[];
  parc: GE[];
  inter: Intervention[];
  magasin: ArticleMagasin[];
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
  const [excelResult, setExcelResult] = useState<ParsedExcelResult | null>(null);
  const [jsonPreview, setJsonPreview] = useState<AppDatabase | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFileType(null);
    setFileName("");
    setExcelResult(null);
    setJsonPreview(null);
    setErrorMsg("");
    setSuccessMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Download sample Excel template with multi-sheets or clean structure
  const downloadSampleTemplate = () => {
    const planningData = [
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

    const parcData = [
      {
        CODE_GE: "GE001",
        CLIENT: "AGROFAB",
        SITE: "VINDOULOU",
        MARQUE: "PERKINS",
        KVA: 100,
        MOTEUR: "1104A-44TG2",
        STATUT: "Opérationnel",
        FEAU: "Standard",
        FHUILE: "LF 3776",
        FGASOIL: "FF 5300",
        FAIR: "ECC 065003"
      },
      {
        CODE_GE: "GE002",
        CLIENT: "BPC",
        SITE: "PORT",
        MARQUE: "SDMO",
        KVA: 250,
        MOTEUR: "JOHN DEERE",
        STATUT: "Opérationnel",
        FEAU: "Standard",
        FHUILE: "LF 9009",
        FGASOIL: "FS 19732",
        FAIR: "AF 25550"
      }
    ];

    const workbook = XLSX.utils.book_new();
    const wsPlanning = XLSX.utils.json_to_sheet(planningData);
    const wsParc = XLSX.utils.json_to_sheet(parcData);
    
    XLSX.utils.book_append_sheet(workbook, wsPlanning, "Planification");
    XLSX.utils.book_append_sheet(workbook, wsParc, "Parc GE");
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
          if (parsed && (parsed.parc || parsed.plan || parsed.inter || parsed.taches || parsed.magasin)) {
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

          const parsedPlan: PlanningItem[] = [];
          const parsedParc: GE[] = [];
          const parsedInter: Intervention[] = [];
          const parsedMagasin: ArticleMagasin[] = [];

          // Helper to parse dates
          const parseDateVal = (rawDate: any): string => {
            if (!rawDate) return todayYMD();
            if (typeof rawDate === "number") {
              const dateObj = XLSX.SSF.parse_date_code(rawDate);
              if (dateObj) {
                const y = dateObj.y;
                const m = String(dateObj.m).padStart(2, "0");
                const d = String(dateObj.d).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }
            } else if (typeof rawDate === "string") {
              const match = rawDate.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              if (match) {
                const y = match[3].length === 2 ? "20" + match[3] : match[3];
                const m = match[2].padStart(2, "0");
                const d = match[1].padStart(2, "0");
                return `${y}-${m}-${d}`;
              }
              return String(rawDate).trim();
            }
            return todayYMD();
          };

          // Iterate through all sheets in the workbook
          wb.SheetNames.forEach((sheetName) => {
            const ws = wb.Sheets[sheetName];
            const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (!rawRows || rawRows.length < 2) return;

            // Detect header row
            let headerIdx = -1;
            for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
              if (!rawRows[i] || !Array.isArray(rawRows[i])) continue;
              const rowStr = rawRows[i].map(c => String(c || "").toLowerCase()).join(" ");
              if (
                rowStr.includes("date") ||
                rowStr.includes("client") ||
                rowStr.includes("site") ||
                rowStr.includes("ge") ||
                rowStr.includes("kva") ||
                rowStr.includes("moteur") ||
                rowStr.includes("designation") ||
                rowStr.includes("reference") ||
                rowStr.includes("tech")
              ) {
                headerIdx = i;
                break;
              }
            }

            if (headerIdx === -1) headerIdx = 0;
            const headers = rawRows[headerIdx].map(c => String(c || "").trim().toLowerCase());

            const hasKvaOrMoteur = headers.some(h => h.includes("kva") || h.includes("puissance") || h.includes("moteur") || h.includes("code_ge"));
            const hasDateOrTech = headers.some(h => h.includes("date") || h.includes("tech") || h.includes("planif") || h.includes("intervenant"));
            const hasDesign = headers.some(h => h.includes("designation") || h.includes("ref") || h.includes("article") || h.includes("stock"));

            // Parse each row based on header signature
            for (let i = headerIdx + 1; i < rawRows.length; i++) {
              const row = rawRows[i];
              if (!row || row.length === 0) continue;

              const geVal = String(row[headers.findIndex(h => h.includes("ge") || h.includes("code"))] || "").trim();
              const clientVal = String(row[headers.findIndex(h => h.includes("client"))] || "").trim();
              const siteVal = String(row[headers.findIndex(h => h.includes("site") || h.includes("lieu"))] || "").trim();

              if (!geVal && !clientVal && !siteVal && !hasDesign) continue;

              // 1. Parc GE check
              if (hasKvaOrMoteur || sheetName.toLowerCase().includes("parc") || sheetName.toLowerCase().includes("groupe")) {
                const kvaCol = headers.findIndex(h => h.includes("kva") || h.includes("puissance"));
                const moteurCol = headers.findIndex(h => h.includes("moteur"));
                const marqueCol = headers.findIndex(h => h.includes("marque"));
                const etatCol = headers.findIndex(h => h.includes("etat") || h.includes("statut"));
                const fHuileCol = headers.findIndex(h => h.includes("fhuile") || h.includes("filtre huile"));
                const fGasoilCol = headers.findIndex(h => h.includes("fgasoil") || h.includes("filtre gasoil"));
                const fAirCol = headers.findIndex(h => h.includes("fair") || h.includes("filtre air"));
                const fEauCol = headers.findIndex(h => h.includes("feau") || h.includes("filtre eau"));

                const geCode = geVal || `GE${Math.floor(100 + Math.random() * 900)}`;

                parsedParc.push({
                  id: geCode.toUpperCase(),
                  client: clientVal || "CLIENT STHIC",
                  site: siteVal || "SITE EXPLOITATION",
                  marque: marqueCol >= 0 ? String(row[marqueCol] || "").trim() : "STHIC",
                  kva: kvaCol >= 0 ? parseFloat(String(row[kvaCol])) || 100 : 100,
                  moteur: moteurCol >= 0 ? String(row[moteurCol] || "").trim() : "PERKINS",
                  type: "Principal",
                  etat: etatCol >= 0 ? (String(row[etatCol]).includes("panne") ? "En panne" : "Opérationnel") : "Opérationnel",
                  fhuile: fHuileCol >= 0 ? String(row[fHuileCol] || "").trim() : "Standard",
                  fgasoil: fGasoilCol >= 0 ? String(row[fGasoilCol] || "").trim() : "Standard",
                  fair: fAirCol >= 0 ? String(row[fAirCol] || "").trim() : "Standard",
                  feau: fEauCol >= 0 ? String(row[fEauCol] || "").trim() : "Standard",
                  seuil: 300,
                  regime: 1.0
                });
              }

              // 2. Planning or Intervention check
              if (hasDateOrTech || sheetName.toLowerCase().includes("plan") || sheetName.toLowerCase().includes("interv")) {
                const dateCol = headers.findIndex(h => h.includes("date"));
                const techCol = headers.findIndex(h => h.includes("tech") || h.includes("intervenant") || h.includes("agent"));
                const noteCol = headers.findIndex(h => h.includes("note") || h.includes("remarque") || h.includes("objet") || h.includes("descp") || h.includes("obs"));
                const typeCol = headers.findIndex(h => h.includes("type"));

                const dateParsed = dateCol >= 0 ? parseDateVal(row[dateCol]) : todayYMD();

                parsedPlan.push({
                  date: dateParsed,
                  client: clientVal || "CLIENT STHIC",
                  site: siteVal || "SITE",
                  ge: geVal || "GE_GENERAL",
                  tech: techCol >= 0 ? String(row[techCol] || "").trim() : "TECHNICIEN STHIC",
                  note: noteCol >= 0 ? String(row[noteCol] || "").trim() : "Importé via Fichier Excel",
                  type: typeCol >= 0 ? String(row[typeCol] || "").trim() : "Préventive",
                  exec: null
                });
              }

              // 3. Magasin / Stock check
              if (hasDesign || sheetName.toLowerCase().includes("stock") || sheetName.toLowerCase().includes("magasin")) {
                const refCol = headers.findIndex(h => h.includes("ref") || h.includes("code"));
                const desCol = headers.findIndex(h => h.includes("design") || h.includes("nom") || h.includes("article"));
                const catCol = headers.findIndex(h => h.includes("cat") || h.includes("famille"));
                const stockCol = headers.findIndex(h => h.includes("stock") || h.includes("qte") || h.includes("quantite"));
                const prixCol = headers.findIndex(h => h.includes("prix") || h.includes("pv") || h.includes("tarif"));

                const refVal = refCol >= 0 ? String(row[refCol] || "").trim() : `REF-${Math.floor(1000 + Math.random() * 9000)}`;
                const desVal = desCol >= 0 ? String(row[desCol] || "").trim() : "";

                if (desVal || refVal) {
                  parsedMagasin.push({
                    ref: refVal.toUpperCase(),
                    design: desVal || "Article Importé",
                    cat: catCol >= 0 ? String(row[catCol] || "").trim() : "Filtres & Pièces",
                    stockInit: stockCol >= 0 ? parseFloat(String(row[stockCol])) || 10 : 10,
                    prixAchat: prixCol >= 0 ? parseFloat(String(row[prixCol])) || 0 : 0,
                    marge: 20,
                    prixVente: prixCol >= 0 ? parseFloat(String(row[prixCol])) * 1.2 || 0 : 0,
                    note: "Importé via Fichier Excel"
                  });
                }
              }
            }
          });

          if (parsedPlan.length === 0 && parsedParc.length === 0 && parsedMagasin.length === 0) {
            setErrorMsg("Aucune donnée valide n'a pu être extraite de ce fichier Excel. Vérifiez les entêtes de vos colonnes.");
          } else {
            setExcelResult({
              plan: parsedPlan,
              parc: parsedParc,
              inter: parsedInter,
              magasin: parsedMagasin
            });
          }
        } catch (err: any) {
          setErrorMsg("Erreur lors de l'analyse du fichier Excel : " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Execution: Append / Merge
  const handleApplyAppend = () => {
    if (fileType === "excel" && excelResult) {
      // Create non-duplicate merge
      const existingPlanKeys = new Set(db.plan.map(p => `${p.date}|${p.ge}|${p.client}|${p.note}`));
      const newPlanItems = excelResult.plan.filter(p => !existingPlanKeys.has(`${p.date}|${p.ge}|${p.client}|${p.note}`));

      const existingGeIds = new Set(db.parc.map(g => g.id.toUpperCase()));
      const newGEs = excelResult.parc.filter(g => !existingGeIds.has(g.id.toUpperCase()));

      const existingRef = new Set(db.magasin.map(m => m.ref.toUpperCase()));
      const newMagasin = excelResult.magasin.filter(m => !existingRef.has(m.ref.toUpperCase()));

      const updatedDB: AppDatabase = {
        ...db,
        plan: [...db.plan, ...newPlanItems],
        parc: [...db.parc, ...newGEs],
        magasin: [...db.magasin, ...newMagasin]
      };

      onRestoreDB(updatedDB);
      setSuccessMsg(`✅ Mise à jour réussie : ${newPlanItems.length} planifications, ${newGEs.length} GEs, et ${newMagasin.length} articles ajoutés !`);
      setTimeout(() => handleClose(), 1800);
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
      setSuccessMsg("✅ Base de données fusionnée avec succès !");
      setTimeout(() => handleClose(), 1500);
    }
  };

  // Execution: Replace / Overwrite
  const handleApplyReplace = () => {
    if (fileType === "excel" && excelResult) {
      const updatedDB: AppDatabase = {
        ...db,
        plan: excelResult.plan.length > 0 ? excelResult.plan : db.plan,
        parc: excelResult.parc.length > 0 ? excelResult.parc : db.parc,
        magasin: excelResult.magasin.length > 0 ? excelResult.magasin : db.magasin
      };
      onRestoreDB(updatedDB);
      setSuccessMsg("✅ Données remplacées avec succès à partir du fichier importé.");
      setTimeout(() => handleClose(), 1500);
    } else if (fileType === "json" && jsonPreview) {
      onRestoreDB(jsonPreview);
      setSuccessMsg("✅ Base de données entièrement restaurée depuis le fichier JSON !");
      setTimeout(() => handleClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 space-y-5 text-slate-800 relative my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Mise à Jour par Importation de Fichier
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Prise en compte directe de vos fichiers Excel (.xlsx, .xls, .csv) et Sauvegardes (.json).
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
        <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/80">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Formats pris en charge : <strong>.xlsx, .xls, .csv, .json</strong></span>
          </div>
          <button
            onClick={downloadSampleTemplate}
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            <Download size={14} />
            <span>Modèle Excel Type (.xlsx)</span>
          </button>
        </div>

        {/* Dropzone Area */}
        {!excelResult && !jsonPreview && (
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
                ? "border-emerald-600 bg-emerald-50/80 scale-[1.01]"
                : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Glissez et déposez votre fichier ici, ou cliquez pour parcourir
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-md">
              Toutes les feuilles et lignes de votre fichier seront analysées et intégrées dans la GMAO STHIC.
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-3 font-bold">
            <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Excel Result Extraction Cards */}
        {excelResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={20} />
                <span className="text-xs font-black text-slate-900">
                  Fichier chargé : <span className="text-blue-700">{fileName}</span>
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black">
                Extraction Réussie
              </span>
            </div>

            {/* Entity Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase block">Planifications</span>
                  <span className="text-base font-black text-blue-950">{excelResult.plan.length} lignes</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                  <Zap size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-amber-900 uppercase block">Parc GEs</span>
                  <span className="text-base font-black text-amber-950">{excelResult.parc.length} groupes</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <Package size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-purple-900 uppercase block">Articles Stock</span>
                  <span className="text-base font-black text-purple-950">{excelResult.magasin.length} articles</span>
                </div>
              </div>
            </div>

            {/* Snippet Preview */}
            {excelResult.plan.length > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto">
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
                    {excelResult.plan.slice(0, 4).map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50">
                        <td className="p-2.5 font-bold text-slate-900">{row.date}</td>
                        <td className="p-2.5 font-extrabold text-blue-900">{row.client}</td>
                        <td className="p-2.5 text-slate-600">{row.site}</td>
                        <td className="p-2.5 font-bold text-slate-800">{row.ge || "—"}</td>
                        <td className="p-2.5 text-slate-700">{row.tech}</td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[150px]">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Apply Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleApplyAppend}
                type="button"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <RefreshCw size={15} />
                <span>Mettre à jour &amp; Fusionner la Base</span>
              </button>
              <button
                onClick={handleApplyReplace}
                type="button"
                className="py-3 px-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <ArrowRight size={15} />
                <span>Remplacer Intégralement</span>
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
                <span>Fichier de Sauvegarde JSON Détecté</span>
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
