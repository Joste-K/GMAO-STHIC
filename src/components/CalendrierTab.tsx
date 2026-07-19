import React, { useState } from "react";
import { AppDatabase } from "../types";
import { calcGE, calcPlan, pd, today, fmt } from "../utils/calculations";

interface Props {
  db: AppDatabase;
}

export const CalendrierTab: React.FC<Props> = ({ db }) => {
  const [currentYear, setCurrentYear] = useState(() => today().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today().getMonth()); // 0-11
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);

  const monthsList = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const handleNavMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDayISO(null);
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const isFerie = (d: Date) => {
    const fDates = ["01-01", "05-01", "08-04", "08-15", "11-01", "11-28", "12-25"];
    const key = `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    return fDates.includes(key);
  };

  // Build list of calendar events dynamically
  const calendarEvents: { [key: string]: any[] } = {};

  const addEvent = (iso: string, evt: any) => {
    if (!iso) return;
    if (!calendarEvents[iso]) calendarEvents[iso] = [];
    calendarEvents[iso].push(evt);
  };

  // 1. Visites planifiées
  db.plan.forEach(p => {
    if (p.date) {
      addEvent(p.date, {
        t: "v",
        ge: p.ge,
        client: p.client,
        site: p.site,
        tech: p.tech,
        notes: p.note
      });
    }
  });

  // 2. Vidanges prévues
  db.parc.forEach(g => {
    const c = calcGE(g, db.inter || []);
    if (c.proch) {
      // Adjust to prior working day if proch falls on Sunday/Holiday
      const adjusted = new Date(c.proch.getTime());
      let safetyCounter = 0;
      while ((adjusted.getDay() === 0 || adjusted.getDay() === 6 || isFerie(adjusted)) && safetyCounter < 10) {
        adjusted.setDate(adjusted.getDate() - 1);
        safetyCounter++;
      }
      const adjustedISO = `${adjusted.getFullYear()}-${pad2(adjusted.getMonth() + 1)}-${pad2(adjusted.getDate())}`;
      addEvent(adjustedISO, {
        t: "d",
        ge: g.id,
        client: g.client,
        site: g.site,
        sv: c.sv
      });
    }
  });

  // 3. Anomalies échéances
  db.anomalies.forEach(a => {
    if (a.echeance) {
      addEvent(a.echeance.slice(0, 10), {
        t: "a",
        ge: a.ge,
        client: a.client,
        site: a.site,
        desc: a.desc,
        statut: a.statut
      });
    }
  });

  // Build grid calendar days
  const ndays = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Get weekday of 1st day of month, adjusted so Monday is 0, Sunday is 6
  let firstDayWeekIdx = new Date(currentYear, currentMonth, 1).getDay();
  firstDayWeekIdx = firstDayWeekIdx === 0 ? 6 : firstDayWeekIdx - 1;

  const daysGrid: React.JSX.Element[] = [];

  // Empty cells at start of month
  for (let b = 0; b < firstDayWeekIdx; b++) {
    daysGrid.push(<div key={`empty-${b}`} className="bg-slate-50 border border-slate-100 rounded-lg min-h-[84px] opacity-40"></div>);
  }

  const todayISO = today().toISOString().slice(0, 10);

  // Populate actual days
  for (let d = 1; d <= ndays; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const iso = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(d)}`;
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isHoliday = isFerie(dateObj);
    const isT = iso === todayISO;

    const items = calendarEvents[iso] || [];

    const cellBg = isT ? "bg-blue-50/50" : (isWeekend || isHoliday ? "bg-slate-50" : "bg-white");
    const cellBorder = isT ? "border-blue-500 shadow-inner" : "border-slate-100";

    daysGrid.push(
      <div
        key={d}
        onClick={() => items.length > 0 && setSelectedDayISO(iso)}
        className={`min-h-[84px] border ${cellBorder} ${cellBg} rounded-xl p-2 flex flex-col justify-between select-none ${
          items.length > 0 ? "cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all" : ""
        }`}
      >
        <span className={`text-xs font-bold ${isWeekend || isHoliday ? "text-slate-400" : "text-slate-800"}`}>
          {d}
        </span>
        <div className="space-y-1 mt-1">
          {items.slice(0, 2).map((it, idx) => {
            let col = "bg-blue-50 text-blue-700";
            let sym = "📋";
            if (it.t === "d") {
              col = "bg-amber-50 text-amber-700 border-l-2 border-l-amber-500";
              sym = "⚙️";
            } else if (it.t === "a") {
              col = "bg-red-50 text-red-700 border-l-2 border-l-red-500";
              sym = "⚠️";
            }
            return (
              <div
                key={idx}
                className={`text-[9px] font-bold px-1 py-0.5 rounded truncate max-w-full ${col}`}
                title={it.client || it.ge}
              >
                {sym} {it.client || it.ge}
              </div>
            );
          })}
          {items.length > 2 && (
            <div className="text-[9px] font-extrabold text-blue-600 pl-1">
              +{items.length - 2} autre{items.length - 2 > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render selected day detail card
  const selectedDayItems = selectedDayISO ? calendarEvents[selectedDayISO] || [] : [];

  return (
    <div id="cal" className="space-y-6">
      {/* Navigator bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-100">
        <button
          onClick={() => handleNavMonth(-1)}
          className="px-4 py-2 border hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
        >
          ◀ Mois précédent
        </button>
        <b className="text-lg font-extrabold text-blue-900 min-w-[150px] text-center">
          {monthsList[currentMonth]} {currentYear}
        </b>
        <button
          onClick={() => handleNavMonth(1)}
          className="px-4 py-2 border hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
        >
          Mois suivant ▶
        </button>
        <button
          onClick={() => {
            setCurrentYear(today().getFullYear());
            setCurrentMonth(today().getMonth());
            setSelectedDayISO(null);
          }}
          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold cursor-pointer"
        >
          Ce mois-ci
        </button>
      </div>

      {/* Grid calendar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => (
            <div
              key={i}
              className={`text-center font-bold py-2 text-sm ${
                i >= 5 ? "text-red-500 font-extrabold" : "text-slate-500"
              }`}
            >
              {d}
            </div>
          ))}
          {daysGrid}
        </div>
      </div>

      {/* Daily Event Detail card */}
      {selectedDayISO && selectedDayItems.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-extrabold text-slate-800 text-sm">
              🗓️ Événements planifiés le {fmt(selectedDayISO)} ({selectedDayItems.length})
            </h4>
            <button
              onClick={() => setSelectedDayISO(null)}
              className="text-slate-400 hover:text-slate-600 font-extrabold text-lg"
            >
              &times;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold uppercase text-[10px] border-b">
                  <th className="py-2">Type</th>
                  <th className="py-2">GE</th>
                  <th className="py-2">Client / Site</th>
                  <th className="py-2">Détails de l'intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {selectedDayItems.map((it, i) => {
                  let badgeText = "📋 Visite";
                  let badgeCol = "bg-blue-100 text-blue-800";
                  let det = `Tech: ${it.tech || "Non assigné"}`;
                  if (it.t === "d") {
                    badgeText = "🔧 Vidange";
                    badgeCol = "bg-amber-100 text-amber-800";
                    det = it.sv || "Vidange périodique requise";
                  } else if (it.t === "a") {
                    badgeText = "⚠️ Anomalie";
                    badgeCol = "bg-red-100 text-red-800";
                    det = `${it.desc || ""} [Statut: ${it.statut || "Ouvert"}]`;
                  }

                  return (
                    <tr key={i} className="hover:bg-slate-100/50">
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeCol}`}>
                          {badgeText}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">{it.ge || "—"}</td>
                      <td className="py-2.5">
                        <span className="font-semibold block">{it.client}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{it.site}</span>
                      </td>
                      <td className="py-2.5 text-slate-600 leading-normal">{det}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
