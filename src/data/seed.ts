import { GE, Intervention, PlanningItem, Anomalie, Task, Materiel, ArticleMagasin, MouvementMagasin, Vente, Abonnement, Bilan } from "../types";
import { SEED_PARC as BASE_PARC } from "./parc";
import { SEED_INTER } from "./interventions";
import { SEED_PLAN } from "./planning";
import { CONTENTKVA, CATFILTRES, REFS, TSPCATALOG, FOURNCATALOG, ABOSEED, MAGCATALOG, RECEP, STDGE } from "./catalog";

export { SEED_INTER, SEED_PLAN, CONTENTKVA, CATFILTRES, REFS, TSPCATALOG, FOURNCATALOG, ABOSEED, MAGCATALOG, RECEP, STDGE };

export const TECHS_REF = [
  "Joste KODIA", "Simplice EKIA", "MBOUNGOU WILFRIED", "MBOUSSI PARFAIT",
  "Cyr TSIBA", "Odilon MABIALA", "Tuburse BOUETOUMOUSSA", "Michel TOLOLO",
  "Gildas MAKOUMBOU", "YONEL NKELANI", "SANTONY KIBANGOU", "NERVAL MABIALA", "Trésor BOUTSALA"
];

// Enrich the park with all sites from CONTENTKVA
const ENRICHED_PARC = [...BASE_PARC];

Object.keys(CONTENTKVA).forEach((key, index) => {
  const parts = key.split("|");
  if (parts.length >= 2) {
    const client = parts[0].trim();
    const site = parts[1].trim();
    const marque = parts[2] ? parts[2].trim() : "SDMO";
    
    // Check if it already exists in BASE_PARC
    const exists = ENRICHED_PARC.some(ge => 
      ge.client.toLowerCase() === client.toLowerCase() && 
      ge.site.toLowerCase() === site.toLowerCase()
    );
    
    if (!exists) {
      const kvaVal = CONTENTKVA[key];
      ENRICHED_PARC.push({
        id: `GE_AUTO_${index}`,
        client: client,
        site: site,
        marque: marque,
        kva: kvaVal,
        moteur: "PERKINS",
        huile: 12,
        regime: 1.0,
        seuil: 300,
        dvid: "2026-01-10",
        hvid: 1500,
        drel: "2026-03-12",
        hrel: 1650,
        dbatt: "2025-06-20",
        dcourr: "2025-06-20",
        type: "Principal",
        etat: "Opérationnel",
        comm: "Généré via catalogue sites STHIC"
      });
    }
  }
});

export const SEED_PARC: GE[] = ENRICHED_PARC;


