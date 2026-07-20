import React, { useState } from "react";

export const GuideTab: React.FC = () => {
  const [search, setSearch] = useState("");

  const TROUBLESHOOTING = [
    {
      title: "🛑 Le groupe ne démarre pas (Pas de lancement moteur)",
      causes: [
        "Batterie déchargée ou cosses oxydées (vérifier la tension > 12.4V)",
        "Fusible de commande grillé sur la carte de contrôle (DSE / Woodward)",
        "Niveau de carburant insuffisant ou présence d'air dans le circuit de gasoil",
        "Arrêt d'urgence enfoncé sur l'armoire ou sur le capotage"
      ],
      solutions: [
        "Mesurer la tension de batterie en charge, nettoyer et serrer les cosses",
        "Purger le circuit de gasoil à l'aide de la pompe d'amorçage manuelle",
        "Vérifier la position du bouton arrêt d'urgence et le déverrouiller"
      ]
    },
    {
      title: "⚠️ Surchauffe Moteur (Température liquide > 95°C)",
      causes: [
        "Niveau de liquide de refroidissement trop bas (fuite radiateur)",
        "Courroie d'alternateur détendue ou cassée (plus d'entraînement pompe à eau)",
        "Radiateur encrassé par la poussière ou colmaté par des débris",
        "Calorstat défectueux bloqué en position fermée"
      ],
      solutions: [
        "Laisser refroidir puis faire l'appoint avec du liquide de refroidissement adapté",
        "Vérifier la tension de la courroie de ventilateur (flèche de 10mm max)",
        "Souffler le nid d'abeilles du radiateur à l'air comprimé de l'intérieur vers l'extérieur"
      ]
    },
    {
      title: "💨 Fumée échappement anormale (Noire / Bleue / Blanche)",
      causes: [
        "Fumée noire : Surcharge, injecteurs encrassés ou filtre à air obstrué",
        "Fumée bleue : Usure des segments, passage d'huile moteur dans la chambre de combustion",
        "Fumée blanche : Présence d'eau dans le carburant ou joint de culasse défectueux"
      ],
      solutions: [
        "Nettoyer ou remplacer l'élément cartouche filtrante du filtre à air",
        "Purger la cuve à décanteur de carburant pour éliminer l'eau de condensation",
        "Faire contrôler le tarage des injecteurs mécaniques par un diéséliste"
      ]
    },
    {
      title: "⚡ Pas de tension en sortie alternateur",
      causes: [
        "Disjoncteur général du GE en position OFF (déclenché)",
        "Régulateur automatique de tension (AVR) défectueux ou débranché",
        "Perte du magnétisme rémanent de l'excitatrice",
        "Fusible interne de l'AVR fondu"
      ],
      solutions: [
        "Réenclencher le disjoncteur général après vérification de l'absence de court-circuit",
        "Vérifier les connexions de l'AVR et remplacer le fusible de protection interne",
        "Procéder à une ré-excitation de l'enroulement à l'aide d'une batterie 12V externe"
      ]
    }
  ];

  const MAINTENANCE_RULES = [
    { title: "🛢️ Vidange d'huile moteur", period: "Toutes les 250 heures de marche ou 1 fois par an", text: "Utiliser de l'huile grade 15W40 pour moteurs diesel industriels lourds. Remplacer systématiquement le filtre à huile." },
    { title: "🌪️ Filtre à air", period: "Toutes les 250 heures ou plus souvent en milieu poussiéreux", text: "Inspecter la cartouche, souffler à basse pression ou remplacer. Ne jamais nettoyer l'élément de sécurité interne." },
    { title: "💧 Filtre à gasoil & décanteur", period: "Toutes les 250 heures de marche", text: "Remplacer le filtre principal. Purger régulièrement l'eau cumulée au fond du préfiltre séparateur." },
    { title: "🔋 Batterie de démarrage", period: "Contrôle mensuel / Remplacement tous les 2 à 3 ans", text: "Vérifier le niveau d'électrolyte et la charge résiduelle. Un chargeur statique permanent de maintien est indispensable." },
    { title: "🎗️ Courroies ventilateur", period: "Contrôle toutes les 250 heures / Remplacement tous les 3 ans", text: "Vérifier l'alignement des poulies et la tension manuelle. Remplacer en cas de craquelures apparentes." }
  ];

  const SAFETY = [
    "⚡ Consignation Électrique : Toujours ouvrir et cadenasser le disjoncteur de puissance et isoler la commande (débrancher la batterie) avant toute intervention.",
    "🚫 Démarrage Intempestif : S'assurer que le commutateur de la carte de contrôle est sur la position 'OFF/MANUEL' et non 'AUTO' pour éviter les démarrages distants liés à des coupures réseau.",
    "🔥 Pièces Chaudes & Mobiles : Ne jamais travailler à proximité immédiate du collecteur d'échappement ou des ventilateurs lorsque la machine est en marche.",
    "💨 Intoxication au CO : Ne jamais faire fonctionner un groupe électrogène dans un local fermé sans extraction d'air et de fumées conforme vers l'extérieur."
  ];

  // Filtering
  const filteredTroubles = TROUBLESHOOTING.filter(t => {
    const hay = `${t.title} ${t.causes.join(" ")} ${t.solutions.join(" ")}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const filteredRules = MAINTENANCE_RULES.filter(r => {
    const hay = `${r.title} ${r.period} ${r.text}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div id="guide" className="space-y-6">
      <div className="border-b pb-2 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-blue-900">
            📖 Documentation &amp; Aide au Diagnostic
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1">Guide pratique des techniciens STHIC</p>
        </div>
        <input
          type="text"
          placeholder="🔎 Rechercher un mot clé (batterie, fumée, surchauffe)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 w-full sm:w-[320px]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagnostics & Troubleshooting */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-l-4 border-l-red-600 pl-2">
            <h3 className="text-md font-extrabold text-blue-900">🩺 Arbre de recherche de pannes</h3>
          </div>

          <div className="space-y-4">
            {filteredTroubles.length > 0 ? (
              filteredTroubles.map((tr, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-100 space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-sm">{tr.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-red-600 uppercase text-[10px]">Causes probables :</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                        {tr.causes.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-green-600 uppercase text-[10px]">Actions correctives :</div>
                      <ul className="list-decimal pl-4 space-y-1 text-slate-700 font-bold">
                        {tr.solutions.map((s, sIdx) => (
                          <li key={sIdx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4">Aucun symptôme correspondant.</p>
            )}
          </div>
        </div>

        {/* Maintenance Intervals & Safety */}
        <div className="space-y-6">
          {/* Intervals */}
          <div className="space-y-3">
            <div className="border-l-4 border-l-amber-500 pl-2">
              <h3 className="text-md font-extrabold text-blue-900">⏱️ Fréquences de maintenance</h3>
            </div>
            <div className="space-y-2.5">
              {filteredRules.map((ru, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800 text-xs">{ru.title}</div>
                  <div className="text-[10px] text-amber-700 font-bold uppercase">{ru.period}</div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{ru.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety rules */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-red-800 uppercase tracking-wider">⚡ Recommandations de sécurité absolues</h3>
            <ul className="space-y-2 text-[11px] font-bold text-red-700">
              {SAFETY.map((sa, i) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{sa}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
