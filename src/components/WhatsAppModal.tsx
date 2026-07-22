import { AppDatabase, PlanningItem, Task } from "../types";
import {
  buildPlanningWhatsAppMessage,
  buildTaskWhatsAppMessage,
  buildTechnicianPlanningSummaryWhatsApp,
  sendWhatsAppMessage
} from "../utils/whatsapp";
import {
  MessageSquare,
  X,
  Send,
  User,
  Calendar,
  Phone,
  Copy,
  CheckCircle2,
  ListFilter
} from "lucide-react";
import React, { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  db: AppDatabase;
  singlePlanningItem?: PlanningItem | null;
  singleTask?: Task | null;
}

export const WhatsAppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  db,
  singlePlanningItem,
  singleTask
}) => {
  const [mode, setMode] = useState<"single" | "tech_summary">("single");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [previewText, setPreviewText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // List of unique technicians in planning & tasks
  const techList = Array.from(
    new Set([
      ...db.plan.map(p => p.tech).filter(Boolean),
      ...db.taches.map(t => t.assigne).filter(Boolean)
    ])
  ).sort();

  // On mount/mode change, initialize
  useEffect(() => {
    if (singlePlanningItem) {
      setMode("single");
      if (singlePlanningItem.tech) {
        setSelectedTech(singlePlanningItem.tech);
      }
      setPreviewText(buildPlanningWhatsAppMessage(singlePlanningItem, customNotes));
    } else if (singleTask) {
      setMode("single");
      if (singleTask.assigne) {
        setSelectedTech(singleTask.assigne);
      }
      setPreviewText(buildTaskWhatsAppMessage(singleTask));
    } else {
      setMode("tech_summary");
      if (techList.length > 0) {
        setSelectedTech(techList[0]);
      }
    }
  }, [isOpen, singlePlanningItem, singleTask]);

  // Update preview when inputs change
  useEffect(() => {
    if (singlePlanningItem) {
      setPreviewText(buildPlanningWhatsAppMessage(singlePlanningItem, customNotes));
    } else if (singleTask) {
      setPreviewText(buildTaskWhatsAppMessage(singleTask));
    } else if (mode === "tech_summary" && selectedTech) {
      const techItems = db.plan.filter(p => (p.tech || "").toLowerCase() === selectedTech.toLowerCase());
      setPreviewText(buildTechnicianPlanningSummaryWhatsApp(selectedTech, techItems));
    }
  }, [selectedTech, customNotes, mode, singlePlanningItem, singleTask]);

  if (!isOpen) return null;

  const handleSend = () => {
    sendWhatsAppMessage(previewText, phone);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-5 text-slate-800 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <span>Partager par WhatsApp</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                  Direct
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Envoyez l'ordre de mission ou le planning de travail directement au technicien.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode switcher if not single item forced */}
        {!singlePlanningItem && !singleTask && (
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => setMode("tech_summary")}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "tech_summary"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter size={14} />
              <span>Planning Complet par Technicien</span>
            </button>
          </div>
        )}

        {/* Technician selection */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                Technicien destinataire
              </label>
              <div className="relative">
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Choisir un technicien --</option>
                  {techList.map((tech, i) => (
                    <option key={i} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                Numéro WhatsApp (Optionnel)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 242061234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {singlePlanningItem && (
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                Consignes particulières à ajouter
              </label>
              <input
                type="text"
                placeholder="Ex: Prévoir le filtre huile LF3776 et clé de 17"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-500">Aperçu du Message WhatsApp</span>
            <button
              onClick={handleCopy}
              type="button"
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? "Copié !" : "Copier le texte"}</span>
            </button>
          </div>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-[220px] overflow-y-auto border border-slate-800 leading-relaxed shadow-inner">
            {previewText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            type="button"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
          >
            <Send size={15} />
            <span>Ouvrir dans WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
