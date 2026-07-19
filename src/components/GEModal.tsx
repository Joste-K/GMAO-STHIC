import React, { useState, useEffect } from "react";
import { GE, AppDatabase } from "../types";
import { X, Wrench, Battery, Zap, History, ClipboardCheck, Info, AlertCircle, Save } from "lucide-react";
import { calcGE, recoGE, fmtD } from "../utils/calculations";

interface Props {
  ge: GE;
  db: AppDatabase;
  onClose: () => void;
  onSave: (updated: Partial<GE>) => void;
}

export const GEModal: React.FC<Props> = ({ ge, db, onClose, onSave }) => {
  const [formData, setFormData] = useState<GE>({ ...ge });
  
  const c = calcGE(formData, db.inter || []);
  const r = recoGE(formData, db.inter || []);

  const handleChange = (field: keyof GE, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    if (status.includes("🔴") || status.includes("Critique") || status.includes("panne") || status.includes("remplacer") || status.includes("vidanger")) return "bg-red-50 border-red-200 text-red-700";
    if (status.includes("🟠") || status.includes("surveiller") || status.includes("planifier") || status.includes("Bientôt") || status.includes("maintenance")) return "bg-amber-50 border-amber-200 text-amber-700";
    if (status.includes("🟢") || status.includes("OK") || status.includes("jour") || status.includes("Opérationnel")) return "bg-green-50 border-green-200 text-green-700";
    return "bg-slate-50 border-slate-200 text-slate-700";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
              {formData.id.replace("GE", "")}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
                {formData.id} — {formData.client}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {formData.site} · {formData.marque} {formData.kva} kVA
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin bg-slate-50/50">
          
          {/* Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border-2 flex flex-col gap-1 ${getStatusColor(r.health)}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">Santé Globale</span>
                <Info size={14} className="opacity-40" />
              </div>
              <div className="text-xl font-black">{r.health}</div>
            </div>
            <div className={`p-4 rounded-2xl border-2 flex flex-col gap-1 ${getStatusColor(c.sv)}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">État Vidange</span>
                <Wrench size={14} className="opacity-40" />
              </div>
              <div className="text-xl font-black">{c.sv}</div>
            </div>
            <div className={`p-4 rounded-2xl border-2 flex flex-col gap-1 ${getStatusColor(c.bs)}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">État Batterie</span>
                <Battery size={14} className="opacity-40" />
              </div>
              <div className="text-xl font-black">{c.bs}</div>
            </div>
          </div>

          {/* Recommandations */}
          <div className={`p-5 rounded-2xl border-l-8 ${r.crit ? "bg-red-50 border-l-red-600" : (r.surv ? "bg-amber-50 border-l-amber-600" : "bg-blue-50 border-l-blue-600")}`}>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-3 flex items-center gap-2">
              <AlertCircle size={16} />
              Recommandations techniques
            </h3>
            <ul className="space-y-2">
              {r.items.map((item, i) => (
                <li key={i} className="text-xs font-bold text-slate-600 flex items-start gap-2 leading-relaxed">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Identification Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <History size={16} className="text-blue-600" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identification & Configuration</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client</label>
                  <input 
                    type="text" 
                    value={formData.client} 
                    onChange={e => handleChange("client", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Site</label>
                  <input 
                    type="text" 
                    value={formData.site} 
                    onChange={e => handleChange("site", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marque</label>
                  <input 
                    type="text" 
                    value={formData.marque || ""} 
                    onChange={e => handleChange("marque", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Puissance (kVA)</label>
                  <input 
                    type="number" 
                    value={formData.kva || ""} 
                    onChange={e => handleChange("kva", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">État de fonctionnement</label>
                <select 
                  value={formData.etat || "Opérationnel"} 
                  onChange={e => handleChange("etat", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Opérationnel">Opérationnel</option>
                  <option value="En panne">En panne</option>
                  <option value="En maintenance">En maintenance</option>
                  <option value="Hors service">Hors service</option>
                  <option value="Arrêt contrat de maintenance">Arrêt contrat</option>
                </select>
              </div>

              {formData.etat !== "Opérationnel" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Justification / Cause panne</label>
                  <textarea 
                    value={formData.comm || ""} 
                    onChange={e => handleChange("comm", e.target.value)}
                    rows={3}
                    placeholder="Pourquoi le groupe est-il arrêté ?"
                    className="w-full px-4 py-2.5 bg-red-50/30 border border-red-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Maintenance Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <ClipboardCheck size={16} className="text-orange-600" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Maintenance & Relevés</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dernière Vidange</label>
                  <input 
                    type="date" 
                    value={formData.dvid || ""} 
                    onChange={e => handleChange("dvid", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Heures à la vidange</label>
                  <input 
                    type="number" 
                    value={formData.hvid ?? ""} 
                    onChange={e => handleChange("hvid", e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date dernier relevé</label>
                  <input 
                    type="date" 
                    value={formData.drel || ""} 
                    onChange={e => handleChange("drel", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Heures actuelles</label>
                  <input 
                    type="number" 
                    value={formData.hrel ?? ""} 
                    onChange={e => handleChange("hrel", e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seuil vidange (h)</label>
                  <input 
                    type="number" 
                    value={formData.seuil ?? 250} 
                    onChange={e => handleChange("seuil", e.target.value === "" ? 250 : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Régime (h / jour)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.regime ?? ""} 
                    onChange={e => handleChange("regime", e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date Batterie</label>
                  <input 
                    type="date" 
                    value={formData.dbatt || ""} 
                    onChange={e => handleChange("dbatt", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date Courroie</label>
                  <input 
                    type="date" 
                    value={formData.dcourr || ""} 
                    onChange={e => handleChange("dcourr", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Parts / Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
              <Zap size={16} className="text-yellow-600" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Consommables & Références</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filtre Huile</label>
                <input 
                  type="text" 
                  value={formData.fhuile || ""} 
                  onChange={e => handleChange("fhuile", e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filtre Gasoil</label>
                <input 
                  type="text" 
                  value={formData.fgasoil || ""} 
                  onChange={e => handleChange("fgasoil", e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filtre Air</label>
                <input 
                  type="text" 
                  value={formData.fair || ""} 
                  onChange={e => handleChange("fair", e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Courroie</label>
                <input 
                  type="text" 
                  value={formData.fcourroie || ""} 
                  onChange={e => handleChange("fcourroie", e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
