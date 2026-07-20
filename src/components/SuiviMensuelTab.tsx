import React, { useState, useMemo } from "react";
import { AppDatabase, GE, Intervention } from "../types";
import { calcGE, recoGE, todayYMD, fmtD } from "../utils/calculations";
import { motion } from "motion/react";
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Filter, Save, ChevronLeft, ChevronRight,
  Battery, Wrench, RefreshCw
} from "lucide-react";

interface Props {
  db: AppDatabase;
  selectedMonth: string; // YYYY-MM
  onUpdateGE: (id: string, updated: Partial<GE>) => void;
  onAddIntervention: (inter: Intervention) => void;
}

export const SuiviMensuelTab: React.FC<Props> = ({ db, selectedMonth, onUpdateGE, onAddIntervention }) => {
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState<string | null>(null); // geId being edited
  const [tempHours, setTempHours] = useState<number | "">("");

  // Filter GEs
  const filteredGEs = useMemo(() => {
    return db.parc.filter(g => {
      const hay = `${g.client} ${g.site} ${g.id} ${g.marque || ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [db.parc, search]);

  const handleSaveHours = (ge: GE) => {
    if (tempHours === "") return;
    
    onUpdateGE(ge.id, {
      hrel: Number(tempHours),
      drel: todayYMD()
    });
    setEditMode(null);
    setTempHours("");
  };

  const handleMarkDone = (ge: GE, type: 'vidange' | 'batterie' | 'courroie') => {
    const today = todayYMD();
    const update: Partial<GE> = {};
    let desc = "";

    if (type === 'vidange') {
      update.dvid = today;
      update.hvid = ge.hrel || 0;
      desc = "Vidange effectuée (Saisie Mensuelle)";
    } else if (type === 'batterie') {
      update.dbatt = today;
      desc = "Remplacement batterie effectué (Saisie Mensuelle)";
    } else if (type === 'courroie') {
      update.dcourr = today;
      desc = "Remplacement courroie effectué (Saisie Mensuelle)";
    }

    onUpdateGE(ge.id, update);
    
    // Add a light intervention record
    onAddIntervention({
      client: ge.client,
      site: ge.site,
      ge: ge.id,
      type: "Préventive",
      tech: "Saisie Système",
      descp: desc,
      descr: desc,
      reso: "OK",
      obs: "Validé via Suivi Mensuel",
      ddeb: today,
      dfin: today,
      dplan: today,
      urg: "Moyen"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Suivi Mensuel & Saisie d'Heures
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Méthode "Huoltu" : Pilotage rigoureux des consommables et relevés.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <input
            type="text"
            placeholder="🔎 Rechercher un site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-transparent border-none text-sm text-black font-semibold focus:outline-none w-48 md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4 border-b">GE / Site</th>
                <th className="px-6 py-4 border-b">Dernier Relevé</th>
                <th className="px-6 py-4 border-b">Heures Actuelles</th>
                <th className="px-6 py-4 border-b text-center">Vidange</th>
                <th className="px-6 py-4 border-b text-center">Batterie</th>
                <th className="px-6 py-4 border-b text-center">Courroie</th>
                <th className="px-6 py-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGEs.map(g => {
                const c = calcGE(g, db.inter || []);
                const isEditing = editMode === g.id;

                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-black text-sm uppercase leading-tight">{g.client}</div>
                      <div className="text-[11px] text-slate-900 font-black uppercase opacity-80">{g.site} <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded ml-1">{g.id}</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-black">{g.hrel || 0} h</div>
                      <div className="text-[10px] text-slate-900 font-bold">{g.drel ? fmtD(g.drel) : 'Jamais'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tempHours}
                            onChange={(e) => setTempHours(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-blue-400 rounded text-sm text-black focus:outline-none ring-2 ring-blue-100"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSaveHours(g)}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setEditMode(g.id);
                            setTempHours(g.hrel || 0);
                          }}
                          className="flex items-center gap-2 cursor-pointer group-hover:text-blue-600 transition-colors"
                        >
                          <span className="text-sm font-bold">{g.hrel || 0} h</span>
                          <Clock size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    
                    {/* Status Cells */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleMarkDone(g, 'vidange')}
                        className={`inline-flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          c.sv.includes('🔴') ? 'bg-red-50 text-red-600 hover:bg-red-100' : 
                          c.sv.includes('🟠') ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' :
                          'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <Wrench size={16} />
                        <span className="text-[9px] font-black">{c.sv.split(' ')[1] || 'OK'}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleMarkDone(g, 'batterie')}
                        className={`inline-flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          c.bs.includes('🔴') ? 'bg-red-50 text-red-600 hover:bg-red-100' : 
                          'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <Battery size={16} />
                        <span className="text-[9px] font-black">{c.bs.split(' ')[1] || 'OK'}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleMarkDone(g, 'courroie')}
                        className={`inline-flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          c.cs.includes('🔴') ? 'bg-red-50 text-red-600 hover:bg-red-100' : 
                          'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <RefreshCw size={16} />
                        <span className="text-[9px] font-black">{c.cs.split(' ')[1] || 'OK'}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditMode(isEditing ? null : g.id)}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {isEditing ? 'Annuler' : 'Saisir relevé'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredGEs.length === 0 && (
            <div className="p-12 text-center">
              <Search className="mx-auto text-slate-200 mb-2" size={48} />
              <p className="text-slate-400 font-medium">Aucun GE trouvé pour cette recherche.</p>
            </div>
          )}
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
        <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-2">
          <CheckCircle2 size={18} />
          Méthode Huoltu : Maintenance Préventive
        </h3>
        <p className="text-blue-800/80 text-sm leading-relaxed">
          Cette interface permet de valider mensuellement les interventions préventives majeures. 
          En cliquant sur les icônes <strong>Vidange</strong>, <strong>Batterie</strong> ou <strong>Courroie</strong>, 
          vous enregistrez l'intervention et mettez à jour la date du prochain cycle.
          Le relevé d'heures est crucial pour le calcul précis de la prochaine vidange (Seuil standard : 300h).
        </p>
      </div>
    </div>
  );
};
