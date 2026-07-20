
import { SEED_PARC } from './src/data/parc';
import { CONTENTKVA } from './src/data/catalog';

const existing = new Set(SEED_PARC.map(g => `${g.client}|${g.site}|${g.marque}`.toUpperCase()));

const missing = [];
let nextId = 300; // On commence à 300 pour éviter les collisions avec les nouveaux déjà ajoutés

for (const key in CONTENTKVA) {
  if (!existing.has(key.toUpperCase())) {
    const [client, site, marque] = key.split('|');
    missing.push({
      id: `GE${String(nextId++).padStart(3, '0')}`,
      client: client || "INCONNU",
      site: site || "SITEPARDEFAUT",
      marque: marque || "",
      kva: CONTENTKVA[key],
      moteur: "",
      huile: null,
      regime: 1.0,
      seuil: 300,
      dvid: null,
      hvid: null,
      drel: null,
      hrel: null,
      dbatt: null,
      dcourr: null,
      type: "Principal",
      etat: "Opérationnel",
      comm: "Importé du catalogue KVA"
    });
  }
}

console.log(JSON.stringify(missing, null, 2));
