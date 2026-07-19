import { GE, Intervention, PlanningItem, Anomalie, Task, Materiel, ArticleMagasin, MouvementMagasin, Vente, Abonnement, Bilan } from "../types";

export const TECHS_REF = [
  "Joste KODIA", "Simplice EKIA", "MBOUNGOU WILFRIED", "MBOUSSI PARFAIT",
  "Cyr TSIBA", "Odilon MABIALA", "Tuburse BOUETOUMOUSSA", "Michel TOLOLO",
  "Gildas MAKOUMBOU", "YONEL NKELANI", "SANTONY KIBANGOU", "NERVAL MABIALA", "Trésor BOUTSALA"
];

// Let's bundle the base SEED data
export const SEED_PARC: GE[] = [
  {"id": "GE003", "client": "AGROFAB", "site": "VILLA CEDRICK", "marque": "SDMO", "kva": 22, "moteur": "MITSIBUSHI", "huile": 8, "regime": 0.46, "seuil": 300, "dvid": "2026-02-19", "hvid": 1914, "drel": "2026-03-17", "hrel": 1926, "dbatt": "2022-08-05", "dcourr": "2022-08-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE190", "client": "XOIL", "site": "S/S  FAUBOURG", "marque": "SDMO", "kva": 33, "moteur": "JOHN DEER", "huile": 14, "regime": 0.84, "seuil": 300, "dvid": "2025-06-17", "hvid": 12138, "drel": "2026-05-27", "hrel": 12427, "dbatt": "2025-09-02", "dcourr": "2022-09-24", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE187", "client": "XOIL", "site": "S/S LOANDJILI", "marque": "SDMO", "kva": 66, "moteur": "MITSIBUSHI", "huile": 7, "regime": 0.77, "seuil": 300, "dvid": "2025-07-19", "hvid": 1094, "drel": "2026-05-26", "hrel": 1334, "dbatt": "2022-02-24", "dcourr": "2022-02-24", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE007", "client": "AIRTEL", "site": "LOANGO", "marque": "FG WILSON N°1", "kva": 150, "moteur": "PERKINS", "huile": 8, "regime": 0.88, "seuil": 300, "dvid": "2026-03-14", "hvid": 3220, "drel": "2026-06-16", "hrel": 3303, "dbatt": "2020-08-26", "dcourr": "2020-08-26", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE008", "client": "AIRTEL", "site": "LOANGO", "marque": "FG WILSON N°2", "kva": 150, "moteur": "LISTER PETTER", "huile": 7, "regime": 2.52, "seuil": 300, "dvid": "2026-03-14", "hvid": 3826, "drel": "2026-06-16", "hrel": 4063, "dbatt": "2020-09-19", "dcourr": "2020-09-19", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE010", "client": "AMBASSADE DE France", "site": "CONSULAT", "marque": "OLYMPIAN", "kva": 65, "moteur": "PERKINS", "huile": 10, "regime": 1.56, "seuil": 300, "dvid": "2026-02-05", "hvid": 1662, "drel": "2026-05-18", "hrel": 1821, "dbatt": null, "dcourr": "2025-09-09", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE011", "client": "AMBASSADE DE France", "site": "RESIDENCE CONSUL GENERAL", "marque": "SDMO", "kva": 44, "moteur": "JOHN DEER", "huile": 8, "regime": 1.89, "seuil": 300, "dvid": "2026-02-05", "hvid": 4796, "drel": "2026-04-08", "hrel": 4913, "dbatt": "2026-02-18", "dcourr": "2025-09-09", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE127", "client": "S.C.I  LE TCHILASSI", "site": "IMMEUBLE", "marque": "JCB", "kva": 14, "moteur": "IVECO", "huile": null, "regime": 1.06, "seuil": 300, "dvid": "2025-11-15", "hvid": 4017, "drel": "2026-05-29", "hrel": 4224, "dbatt": null, "dcourr": null, "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE017", "client": "AOGC", "site": "TCHIMBAMBA", "marque": "SDMO", "kva": 44, "moteur": "BAUDOUIN", "huile": 8, "regime": 0.74, "seuil": 300, "dvid": "2026-03-13", "hvid": 381, "drel": "2026-05-14", "hrel": 427, "dbatt": null, "dcourr": null, "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE018", "client": "AOGC", "site": "S/S MAHOUATA", "marque": "SDMO", "kva": 44, "moteur": "BAUDOUIN", "huile": 8, "regime": 2, "seuil": 300, "dvid": "2026-01-29", "hvid": 88, "drel": "2026-04-20", "hrel": 250, "dbatt": "2026-01-03", "dcourr": "2026-01-03", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE110", "client": "MTN", "site": "CHARIOT ROULANT", "marque": "ELCOS", "kva": 13, "moteur": "PERKINS", "huile": 9, "regime": 5, "seuil": 300, "dvid": "2026-05-28", "hvid": 30060, "drel": "2026-05-29", "hrel": 30065, "dbatt": "2022-01-05", "dcourr": "2022-01-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE128", "client": "S.C.I  LE TCHILASSI", "site": "IMMEUBLE", "marque": "JCB", "kva": 330, "moteur": "IVECO", "huile": null, "regime": 1.26, "seuil": 300, "dvid": "2025-11-15", "hvid": 4017, "drel": "2026-03-27", "hrel": 4183, "dbatt": null, "dcourr": null, "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE022", "client": "BCI", "site": "AGENCE C/V", "marque": "CATERPILAR", "kva": 165, "moteur": "CAT", "huile": 22, "regime": 1.16, "seuil": 300, "dvid": "2026-04-22", "hvid": 1389, "drel": "2026-06-11", "hrel": 1447, "dbatt": "2024-09-17", "dcourr": "2022-08-06", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE021", "client": "BCI", "site": "GRAND MARCHE", "marque": "SDMO", "kva": 44, "moteur": "JOHN DEER", "huile": 8, "regime": 5, "seuil": 300, "dvid": "2026-05-29", "hvid": 12510, "drel": "2026-05-30", "hrel": 12515, "dbatt": "2021-01-26", "dcourr": "2021-01-26", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE026", "client": "BEAC", "site": "AGENCE C/V G1", "marque": "SDMO", "kva": 550, "moteur": "DOOSAN", "huile": 36, "regime": 1.32, "seuil": 300, "dvid": "2026-03-12", "hvid": 2099, "drel": "2026-05-13", "hrel": 2181, "dbatt": "2026-05-13", "dcourr": "2024-08-22", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE184", "client": "XOIL", "site": "S/S CNSS FOUCKS", "marque": "SDMO", "kva": 110, "moteur": "JOHN DEER", "huile": 9, "regime": 0.71, "seuil": 300, "dvid": "2025-07-23", "hvid": 6233, "drel": "2026-02-23", "hrel": 6385, "dbatt": "2023-03-31", "dcourr": "2023-03-31", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE186", "client": "XOIL", "site": "S/S MONGO KAMBA", "marque": "SDMO", "kva": 33, "moteur": "JOHN DEER", "huile": 9, "regime": 0.68, "seuil": 300, "dvid": "2025-07-18", "hvid": 281, "drel": "2026-02-18", "hrel": 427, "dbatt": "2022-02-23", "dcourr": "2022-02-23", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE031", "client": "BPC", "site": "GUD AEROPORT", "marque": "OLYMPIAN", "kva": 275, "moteur": "PERKINS", "huile": 14, "regime": 0.03, "seuil": 300, "dvid": "2026-01-27", "hvid": 4080, "drel": "2026-06-01", "hrel": 4084, "dbatt": "2026-04-28", "dcourr": "2021-04-01", "type": "Secours", "etat": "Opérationnel"},
  {"id": "GE034", "client": "BPC", "site": "FOND TIE-TIE", "marque": "SDMO", "kva": 66, "moteur": "JOHN DEER", "huile": 15, "regime": 2.93, "seuil": 300, "dvid": "2026-03-30", "hvid": 2256, "drel": "2026-05-27", "hrel": 2426, "dbatt": "2026-04-15", "dcourr": "2025-11-28", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE104", "client": "Mr.MOUNGONDO", "site": "VILLA TCHIMBAMBA", "marque": "SDMO", "kva": 22, "moteur": "KOLHER", "huile": 8, "regime": 1.05, "seuil": 300, "dvid": "2025-10-29", "hvid": 648, "drel": "2026-05-06", "hrel": 847, "dbatt": "2022-06-24", "dcourr": "2022-06-24", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE038", "client": "BPC", "site": "REGIONALE", "marque": "SDMO", "kva": 66, "moteur": "JOHN DEER", "huile": 14, "regime": 1.25, "seuil": 300, "dvid": "2026-02-19", "hvid": 2662, "drel": "2026-06-12", "hrel": 2803, "dbatt": "2026-04-15", "dcourr": "2022-08-22", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE041", "client": "BRASCO", "site": "INFORMATIQUE", "marque": "FG WILSON", "kva": 33, "moteur": "", "huile": 8, "regime": 0.07, "seuil": 300, "dvid": "2026-04-21", "hvid": 1185, "drel": "2026-05-06", "hrel": 1186, "dbatt": "2025-07-26", "dcourr": "2026-03-31", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE042", "client": "BRASCO", "site": "VILLA Joseph NIAMA", "marque": "CAT", "kva": 30, "moteur": "", "huile": 9, "regime": 1.44, "seuil": 300, "dvid": "2026-01-24", "hvid": 2544, "drel": "2026-03-17", "hrel": 2619, "dbatt": "2021-07-03", "dcourr": "2023-01-07", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE058", "client": "CONGO TELECOM", "site": "MATOMBI", "marque": "SDMO", "kva": 110, "moteur": "JOHN DEER", "huile": null, "regime": 4.15, "seuil": 300, "dvid": "2026-05-09", "hvid": 4373, "drel": "2026-05-29", "hrel": 4456, "dbatt": "2021-08-06", "dcourr": "2021-08-06", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE043", "client": "BRASCO", "site": "CASE POINTE INDIENNE", "marque": "FG WILSON", "kva": 33, "moteur": "", "huile": 9, "regime": 1, "seuil": 300, "dvid": "2026-01-20", "hvid": 6977, "drel": "2026-01-21", "hrel": 6978, "dbatt": "2021-06-01", "dcourr": "2021-06-01", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE044", "client": "BRASCO", "site": "VILLA SG", "marque": "SDMO", "kva": 22, "moteur": "KOHLER", "huile": 9, "regime": 6, "seuil": 300, "dvid": "2026-05-27", "hvid": 519, "drel": "2026-05-28", "hrel": 525, "dbatt": "2022-12-31", "dcourr": "2022-12-31", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE048", "client": "BUREAU VERITAS", "site": "DIRECTION", "marque": "SDMO", "kva": 275, "moteur": "DOOSAN", "huile": 38, "regime": 1, "seuil": 300, "dvid": "2026-02-09", "hvid": 1650, "drel": "2026-02-10", "hrel": 1651, "dbatt": "2023-01-06", "dcourr": "2023-01-06", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE049", "client": "BUREAU VERITAS", "site": "VILLA DG", "marque": "JCB", "kva": 22, "moteur": "YANMAR", "huile": 8, "regime": 1.82, "seuil": 300, "dvid": "2026-02-17", "hvid": 764, "drel": "2026-04-29", "hrel": 893, "dbatt": "2025-09-12", "dcourr": "2025-04-23", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE050", "client": "BUROTEC", "site": "FRANPRIX PNR N°1", "marque": "SDMO", "kva": 440, "moteur": "DOOSAN", "huile": 40, "regime": 1.53, "seuil": 300, "dvid": "2026-03-16", "hvid": 1354, "drel": "2026-06-05", "hrel": 1478, "dbatt": "2021-07-06", "dcourr": "2021-07-06", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE051", "client": "CASINO", "site": "ANCIEN MAGASIN", "marque": "LEPRON", "kva": 375, "moteur": "", "huile": 35, "regime": 1, "seuil": 300, "dvid": "2026-02-20", "hvid": 8919, "drel": "2026-02-21", "hrel": 8920, "dbatt": "2025-07-29", "dcourr": "2024-07-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE052", "client": "CASINO", "site": "NEW MAGASIN", "marque": "LEPRON", "kva": 375, "moteur": "JOHN DEER", "huile": 35, "regime": 1, "seuil": 300, "dvid": "2026-02-21", "hvid": 3935, "drel": "2026-02-22", "hrel": 3936, "dbatt": "2025-07-29", "dcourr": "2024-07-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE055", "client": "CONGO TELECOM", "site": "DIRECTION", "marque": "SDMO", "kva": 220, "moteur": "JOHN DEER", "huile": 35, "regime": 1.25, "seuil": 300, "dvid": "2026-03-16", "hvid": 2606, "drel": "2026-05-22", "hrel": 2690, "dbatt": "2025-11-26", "dcourr": "2025-09-09", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE056", "client": "CONGO TELECOM", "site": "FOIRE CTS", "marque": "SDMO", "kva": 330, "moteur": "DOOSAN", "huile": 35, "regime": 4.58, "seuil": 300, "dvid": "2026-04-13", "hvid": 5301, "drel": "2026-04-25", "hrel": 5356, "dbatt": "2025-12-26", "dcourr": "2023-04-03", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE036", "client": "BPC", "site": "GRAND MARCHE", "marque": "SDMO", "kva": 33, "moteur": "JOHN DEER", "huile": 9, "regime": 0.55, "seuil": 300, "dvid": "2026-05-19", "hvid": 333, "drel": "2026-06-08", "hrel": 344, "dbatt": "2023-03-31", "dcourr": "2023-03-31", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE060", "client": "CONSULAT TURQUIE", "site": "VILLA POINTE INDIENNE", "marque": "SDMO", "kva": 88, "moteur": "", "huile": null, "regime": 1.1, "seuil": 300, "dvid": "2026-01-09", "hvid": 2283, "drel": "2026-05-11", "hrel": 2417, "dbatt": "2023-04-03", "dcourr": "2023-04-03", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE061", "client": "CONSULAT TURQUIE", "site": "CONSULAT", "marque": "GHADDAR", "kva": 20, "moteur": "PERKINS", "huile": 9, "regime": 2.05, "seuil": 300, "dvid": "2026-02-11", "hvid": 2677, "drel": "2026-04-13", "hrel": 2802, "dbatt": "2025-11-11", "dcourr": "2021-08-13", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE062", "client": "CONSULAT TURQUIE", "site": "VILLA CONSULAT", "marque": "GHADDAR", "kva": 37, "moteur": "", "huile": null, "regime": 1.39, "seuil": 300, "dvid": "2026-01-13", "hvid": 1500, "drel": "2026-04-13", "hrel": 1625, "dbatt": "2025-09-24", "dcourr": "2022-11-14", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE076", "client": "FAC", "site": "VILLA COMZONE MPITA", "marque": "SDMO", "kva": 66, "moteur": "JOHN DEER", "huile": 14, "regime": 1.1, "seuil": 300, "dvid": "2025-11-11", "hvid": 8282, "drel": "2026-02-10", "hrel": 8382, "dbatt": "2022-08-05", "dcourr": "2022-08-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE064", "client": "DOM HELDER CAMARA", "site": "DIRECTION", "marque": "SDMO", "kva": 33, "moteur": "JOHN DEER", "huile": 8, "regime": 2, "seuil": 300, "dvid": "2026-02-20", "hvid": 2196, "drel": "2026-02-21", "hrel": 2198, "dbatt": "2021-08-17", "dcourr": "2021-08-17", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE069", "client": "EGIS", "site": "PEAGE MENGO", "marque": "CUMMINS", "kva": 132, "moteur": "", "huile": 18, "regime": 2, "seuil": 300, "dvid": "2026-03-27", "hvid": 19187, "drel": "2026-03-28", "hrel": 19189, "dbatt": "2025-08-01", "dcourr": "2024-12-03", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE070", "client": "EMILE OUOSSO", "site": "VILLA WARF", "marque": "OLYMPIAN", "kva": 165, "moteur": "PERKINS", "huile": null, "regime": 1.16, "seuil": 300, "dvid": "2026-01-22", "hvid": 4280, "drel": "2026-05-27", "hrel": 4425, "dbatt": "2026-04-11", "dcourr": "2023-09-05", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE071", "client": "EUROTECH", "site": "BOSCH", "marque": "GHADDAR", "kva": 60, "moteur": "PERKINS", "huile": 9, "regime": 0.01, "seuil": 300, "dvid": "2026-02-18", "hvid": 1939, "drel": "2026-05-19", "hrel": 1940, "dbatt": "2024-12-18", "dcourr": "2021-09-14", "type": "Secours", "etat": "Opérationnel"},
  {"id": "GE072", "client": "EUROTECH", "site": "BOSCH", "marque": "GHADDAR", "kva": 110, "moteur": "PERKINS", "huile": 15, "regime": 0.92, "seuil": 300, "dvid": "2026-02-18", "hvid": 280, "drel": "2026-05-19", "hrel": 363, "dbatt": "2026-02-18", "dcourr": "2026-02-18", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE188", "client": "XOIL", "site": "S/S REVOLUTION", "marque": "SDMO", "kva": 33, "moteur": "MITSIBUSHI", "huile": 9, "regime": 0.35, "seuil": 300, "dvid": "2025-05-22", "hvid": 11343, "drel": "2026-02-17", "hrel": 11439, "dbatt": "2022-09-22", "dcourr": "2022-09-22", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE077", "client": "FORTIS", "site": "GARRAGE", "marque": "CUMMINS", "kva": 66, "moteur": "MITSIBUSHI", "huile": 9, "regime": 1.1, "seuil": 300, "dvid": "2026-03-07", "hvid": 4850, "drel": "2026-05-05", "hrel": 4915, "dbatt": "2022-11-21", "dcourr": "2025-08-04", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE078", "client": "FORTIS", "site": "DEPOT", "marque": "SDMO", "kva": 33, "moteur": "MITSIBUSHI", "huile": 9, "regime": 0.02, "seuil": 300, "dvid": "2026-02-12", "hvid": 13034, "drel": "2026-04-13", "hrel": 13035, "dbatt": "2024-09-20", "dcourr": "2025-08-04", "type": "Secours", "etat": "Opérationnel"},
  {"id": "GE079", "client": "FORTIS", "site": "DEPOT HTC", "marque": "SDMO", "kva": 22, "moteur": "KHOLER", "huile": 8, "regime": 0.89, "seuil": 300, "dvid": "2026-03-17", "hvid": 1105, "drel": "2026-06-01", "hrel": 1173, "dbatt": "2024-09-20", "dcourr": "2025-08-04", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE080", "client": "FUGRO", "site": "DIRECTION", "marque": "CAT", "kva": 50, "moteur": "PERKINS", "huile": 9, "regime": 2, "seuil": 300, "dvid": "2026-03-12", "hvid": 6733, "drel": "2026-03-13", "hrel": 6735, "dbatt": "2026-02-23", "dcourr": "2026-03-12", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE081", "client": "FUGRO", "site": "DIRECTION", "marque": "FG WILSON", "kva": 60, "moteur": "PERKINS", "huile": 9, "regime": 0.3, "seuil": 300, "dvid": "2026-03-12", "hvid": 10598, "drel": "2026-06-04", "hrel": 10623, "dbatt": "2026-02-23", "dcourr": "2026-03-12", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE082", "client": "GLE. ESSONGO", "site": "VILLA MPITA", "marque": "SDMO", "kva": 44, "moteur": "KOLHER", "huile": 9, "regime": 0.12, "seuil": 300, "dvid": "2026-02-20", "hvid": 136, "drel": "2026-06-16", "hrel": 150, "dbatt": "2024-09-07", "dcourr": "2021-10-31", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE126", "client": "PEA-CONGO", "site": "MONGO KAMBA", "marque": "FOGO", "kva": 45, "moteur": "MITSIBUSHI", "huile": 8, "regime": 1.09, "seuil": 300, "dvid": "2025-11-20", "hvid": 1, "drel": "2026-05-08", "hrel": 185, "dbatt": "2022-08-09", "dcourr": "2022-08-09", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE150", "client": "STHIC", "site": "BASE", "marque": "SDMO N°09", "kva": 300, "moteur": "JOHN DEER", "huile": null, "regime": 1.77, "seuil": 300, "dvid": "2026-04-28", "hvid": 9441, "drel": "2026-06-10", "hrel": 9517, "dbatt": "2022-02-02", "dcourr": "2026-04-28", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE117", "client": "MUCODEC", "site": "TCHIMBAMBA", "marque": "SDMO", "kva": 70, "moteur": "JOHN DEER", "huile": 15, "regime": 3, "seuil": 300, "dvid": "2026-06-13", "hvid": 5157, "drel": "2026-06-14", "hrel": 5160, "dbatt": "2026-03-20", "dcourr": "2022-01-13", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE132", "client": "SCLOG", "site": "PORT", "marque": "SDMO N*02", "kva": 440, "moteur": "DOOSAN", "huile": 14, "regime": 1.96, "seuil": 300, "dvid": "2025-12-18", "hvid": 3828, "drel": "2026-06-05", "hrel": 4160, "dbatt": "2026-02-06", "dcourr": "2026-02-09", "type": "Principal", "etat": "Opérationnel"},
  {"id": "GE135", "client": "SEP", "site": "VILLA DG", "marque": "JCB", "kva": 22, "moteur": "JOHN DEER", "huile": 9, "regime": 2.5, "seuil": 300, "dvid": "2026-02-12", "hvid": 4908, "drel": "2026-05-13", "hrel": 5133, "dbatt": "2024-06-18", "dcourr": "2022-02-02", "type": "Principal", "etat": "Opérationnel"}
];

export const SEED_INTER: Intervention[] = [
  {"num": "INT-001", "client": "BPC", "site": "NKOUIKOU", "ge": "GE040", "type": "Préventive", "tech": "MBOUNGOU WILFRIED", "descp": "Nbres d'heure atteind", "descr": "Seuil de maintenance préventive atteint : huile moteur usagée + filtres (huile/gasoil/air) saturés", "reso": "Vidange huile + remplacement filtres (huile/gasoil/air) ;", "obs": "Vidange complet du ge", "ddeb": "2026-04-20", "dfin": "2026-04-24", "dplan": "2026-04-22", "urg": "Élevé"},
  {"num": "INT-002", "client": "BPC", "site": "G.U.D PORT", "ge": "GE033", "type": "Préventive", "tech": "MBOUNGOU WILFRIED", "descp": "Filtre decanteur à boucher", "descr": "filtre decanteur hs", "reso": "remplacement du filtre decateur", "obs": "", "ddeb": "2026-04-20", "dfin": null, "dplan": "2026-04-23", "urg": "Critique"},
  {"num": "INT-003", "client": "AGROFAB", "site": "AGROFAB  VINDOULOU", "ge": "GE002", "type": "Préventive", "tech": "SANTONY KIBANGOU", "descp": "Nbres d'heure atteind", "descr": "Seuil de maintenance préventive atteint : huile moteur usagée + filtres (huile/gasoil/air) saturés", "reso": "Vidange huile + remplacement filtres (huile/gasoil/air) ;", "obs": "Vidange complet du ge", "ddeb": "2026-04-20", "dfin": "2026-04-23", "dplan": "2026-04-23", "urg": "Élevé"},
  {"num": "INT-010", "client": "XOIL", "site": "S/S KM4", "ge": "GE183", "type": "Corrective", "tech": "Cyr TSIBA", "descp": "Relais 12v electrovanne hs", "descr": "Bobine relais 12V grillée ; possible grippage de l'électrovanne gasoil ou chute tension batterie", "reso": "Remplacement relais 12V ; test électrovanne ; contrôle tension batterie ; nettoyage contacts ; essai 3 cycles de démarrage", "obs": "devis relais a remplacer", "ddeb": "2026-04-20", "dfin": null, "dplan": null, "urg": "Critique"}
];

export const SEED_PLAN: PlanningItem[] = [
  {"date": "2026-06-05", "client": "SCLOG", "site": "VILLA DEX", "tech": "WILFRIED", "note": "", "exec": null, "ge": "GE129"},
  {"date": "2026-06-12", "client": "SCLOG", "site": "VILLA DEX", "tech": "MBOUSSI", "note": "", "exec": null, "ge": "GE129"},
  {"date": "2026-06-19", "client": "SCLOG", "site": "VILLA DEX", "tech": "WILFRIED", "note": "", "exec": null, "ge": "GE129"},
  {"date": "2026-06-04", "client": "GVA", "site": "NZASSI", "tech": "Gildas MAKOUMBOU", "note": "SOUS GARANTIE", "exec": null, "ge": "GE197"},
  {"date": "2026-06-09", "client": "BPC", "site": "NZASSI", "tech": "Gildas MAKOUMBOU", "note": "", "exec": null, "ge": "GE037"},
  {"date": "2026-06-09", "client": "TOTAL", "site": "S/S LOANGO", "tech": "YIONEL", "note": "MENSUELLE", "exec": null, "ge": "GE167"}
];

// detailed configuration catalog by generator brand
export const CATFILTRES = [
  {"marque": "SDMO", "kva": 16, "moteur": "MITSUBISHI / KOHLER", "huile": "LF 3624 / LF 716", "gasoil": "FF 5018", "air": "ECC 06503 / SAC 06503", "don_huile": "P551808/BT9390", "don_gasoil": "P550932/BF9887", "don_air": "P771558/BA5028", "qte_huile": 5, "grade": "15W-40", "kit": "Gates 6PK1200 / Mitsubishi MD349786", "notes": "Mitsubishi S3L2/Kohler KD625-2"},
  {"marque": "SDMO", "kva": 22, "moteur": "MITSUBISHI S4L2", "huile": "LF 3776", "gasoil": "FF 5300", "air": "ECC 065003", "don_huile": "P550003/BT9332", "don_gasoil": "P550898/BF1369", "don_air": "P822768/BA4891", "qte_huile": 7, "grade": "15W-40", "kit": "Gates T196 (Mitsubishi S4L2) + 6PK1270", "notes": "SDMO T22 / T22C"},
  {"marque": "SDMO", "kva": 25, "moteur": "PERKINS 403G", "huile": "LF 701", "gasoil": "FF 5018", "air": "AH 1198", "don_huile": "P551336/BT212", "don_gasoil": "P550932/BF9887", "don_air": "P181051/PA2736", "qte_huile": 9, "grade": "15W-40", "kit": "Perkins 403G: U5LT0102 + 5PK880", "notes": ""},
  {"marque": "SDMO", "kva": 33, "moteur": "JOHN DEERE 3029T", "huile": "LF 3828/P550020", "gasoil": "FF 5300/P551424", "air": "AH 1190", "don_huile": "P550003/BT9332", "don_gasoil": "P550898/BF7620", "don_air": "P822768/PA3908", "qte_huile": 8, "grade": "15W-40", "kit": "JD 3029T: AM101054 + AM107840 + 6PK900", "notes": ""},
  {"marque": "SDMO", "kva": 44, "moteur": "JOHN DEERE 4045T", "huile": "LF 16173 (alt. LF 3608)", "gasoil": "FS 19811 / FS 19573", "air": "AH 1198 / AH 1196", "don_huile": "P551311/BT7922", "don_gasoil": "P550900/BF7893", "don_air": "P822768/PA3908", "qte_huile": 9, "grade": "15W-40", "kit": "JD 4045T: RE504836 + RE57394 + 6PK1440", "notes": "GE le plus frequent du parc"},
  {"marque": "SDMO", "kva": 66, "moteur": "JOHN DEERE 4045HF", "huile": "LF 3703", "gasoil": "FS 19832", "air": "AH 1107", "don_huile": "P552505/BT839", "don_gasoil": "P550629/BF7587", "don_air": "P611914/BA4975", "qte_huile": 14, "grade": "15W-40", "kit": "JD 4045HF: RE62758 + RE57394 + 6PK1440", "notes": ""},
  {"marque": "SDMO", "kva": 88, "moteur": "JOHN DEERE 4045TF", "huile": "LF 3703 / P551352", "gasoil": "FS 19832 / SN 70110", "air": "AH 1198 / AH 1196", "don_huile": "P552505/BT839", "don_gasoil": "P550629/BF7587", "don_air": "P611914/BA4975", "qte_huile": 14, "grade": "15W-40", "kit": "JD 4045TF: RE62758 + RE57394 + 6PK1440", "notes": ""},
  {"marque": "FG WILSON", "kva": 13, "moteur": "PERKINS 403D-11G", "huile": "LF 785", "gasoil": "FF 167", "air": "—", "don_huile": "P553191/BT212", "don_gasoil": "P550161/BF9888", "don_air": "P181058/PA2734", "qte_huile": 9, "grade": "15W-40", "kit": "Perkins 403D: U5LT0102 + 5PK820", "notes": ""},
  {"marque": "FG WILSON", "kva": 22, "moteur": "PERKINS 403G-11G", "huile": "LF 785", "gasoil": "FF 167", "air": "AF 27867 / SA 17217", "don_huile": "P553191/BT212", "don_gasoil": "P550161/BF9888", "don_air": "P182033/PA3786", "qte_huile": 10, "grade": "15W-40", "kit": "Perkins 403G: U5LT0105 + U5MK1227 + 5PK880", "notes": ""},
  {"marque": "FG WILSON", "kva": 33, "moteur": "PERKINS 404D-22G", "huile": "LF 785", "gasoil": "FF 167", "air": "AF 25553", "don_huile": "P553191/BT212", "don_gasoil": "P550161/BF9888", "don_air": "P181052/PA3560", "qte_huile": 9, "grade": "15W-40", "kit": "Perkins 404D: U5LT0150 + U5MK1235 + 5PK1000", "notes": ""},
  {"marque": "CUMMINS", "kva": 132, "moteur": "CUMMINS 6BT5.9-G2", "huile": "LF 3349", "gasoil": "FF 5018", "air": "AF 25557", "don_huile": "P551394/BT8816", "don_gasoil": "P550932/BF7530", "don_air": "P608667/BA4476", "qte_huile": 18, "grade": "15W-40", "kit": "Cummins 6BT5.9: 3901877 + 3900503 + 5PK1375", "notes": ""},
  {"marque": "CATERPILLAR", "kva": 165, "moteur": "CAT C6.6 ACERT", "huile": "LF 691 / 1R-0716", "gasoil": "FF 5319 + FS 19591", "air": "142-1404", "don_huile": "P552518/BT7349", "don_gasoil": "P550162/BF7953", "don_air": "P611912/BA5029", "qte_huile": 14, "grade": "10W-40 SYNT.", "kit": "CAT C6.6 ACERT: 256-8010 + 241-2462 + 6PK1800", "notes": ""},
  {"marque": "BAUDOUIN", "kva": 44, "moteur": "BAUDOUIN 4M06G1", "huile": "LF 16173 / LF 3608", "gasoil": "FS 19811 / FS 19573", "air": "AH 1198 / AH 1196", "don_huile": "P551311/BT7922", "don_gasoil": "P550900/BF7893", "don_air": "P822768/PA3908", "qte_huile": 9, "grade": "15W-40", "kit": "Baudouin 4M06G1: 1000049590 + 1000049592 + 5PK1050", "notes": ""}
];

// Let's bundle some unique oil/gasoil/air references
export const REFS = {
  "huile": ["04134", "1R-0716", "LF 3624", "LF 3776", "LF 701", "LF 3828", "LF 16173", "LF 3703", "LF 3716", "LF 3567", "LF 3977", "LF 785", "LF 3349", "LF 3000"],
  "gasoil": ["FF 5018", "FF 5300", "FF 167", "FS 19811", "FS 19573", "FS 19832", "FS 19833", "FS 1212", "FF 5045", "FS 19993", "FF 5319", "FS 19591"],
  "air": ["ECC 06503", "SAC 06503", "ECC 065003", "AH 1198", "AH 1190", "AH 1196", "AH 1107", "PA 2784", "SA 14788", "AH 19220", "AF 25553", "AF 25526", "AF 25557"],
  "courroie": ["Gates 6PK1200", "Gates T196", "6PK1270", "5PK880", "6PK900", "6PK1440", "8PK1660", "6PK1550", "6PK1600", "8PK1420", "5PK820", "5PK1000", "5PK1375", "6PK1375"]
};

// Tecnostream products seed catalog
export const TSPCATALOG: any[] = [
  {"ref": "AMF -Prod-E1R1", "design": "AMF Genset Controller En occasion Autamate", "cat": "Électrique / Électronique", "ordre": "E1R1", "unite": "Pce", "prixVente": 100000, "prixAchat": 80000, "marge": 20000, "stockInit": 2, "seuil": 1, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"},
  {"ref": "Inte-Prod-E1R1", "design": "Intelilite AMF 25 En occasion Automate", "cat": "Électrique / Électronique", "ordre": "E1R1", "unite": "Pce", "prixVente": 100000, "prixAchat": 80000, "marge": 20000, "stockInit": 1, "seuil": 1, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"},
  {"ref": "7420-Prod-E1R1", "design": "7420 MKII Deep Sea Electronic Automate", "cat": "Électrique / Électronique", "ordre": "E1R1", "unite": "Pce", "prixVente": 250000, "prixAchat": 120000, "marge": 0, "stockInit": 3, "seuil": 5, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"},
  {"ref": "7320-Prod-E1R1", "design": "7320 MKII Deep Sea Electronic Automate", "cat": "Électrique / Électronique", "ordre": "E1R1", "unite": "Pce", "prixVente": 250000, "prixAchat": 120000, "marge": 0, "stockInit": 6, "seuil": 5, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"},
  {"ref": "R-22-Prod-F1R1", "design": "R-22 Refrigerants", "cat": "Autre", "ordre": "F1R1", "unite": "Kg", "prixVente": 6000, "prixAchat": 3000, "marge": 0, "stockInit": 39, "seuil": 14, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"},
  {"ref": "R-41-Prod-F1R1", "design": "R-410A Refrigerants", "cat": "Autre", "ordre": "F1R1", "unite": "Kg", "prixVente": 10000, "prixAchat": 4000, "marge": 0, "stockInit": 22, "seuil": 12, "note": "Source : Ets_TECNOSTREAM_POWER.xlsx"}
];

// Sporafric price catalog seed
export const FOURNCATALOG: any[] = [
  {"ref": "SPORA-001", "design": "FILTRE AIR J861/U861 AH1107 30800114203", "cat": "Filtres", "unite": "Pce", "prixAchat": 30400, "note": "Sporafric net price"},
  {"ref": "SPORA-002", "design": "FILTRE AIR AH1198/SA05001/22/133/144", "cat": "Filtres", "unite": "Pce", "prixAchat": 30880, "note": "Sporafric net price"},
  {"ref": "SPORA-005", "design": "FILTRE GASOIL FF167B FF825 DF929 26561117", "cat": "Filtres", "unite": "Pce", "prixAchat": 34560, "note": "Sporafric net price"},
  {"ref": "SPORA-008", "design": "FILTRE HUILE SO612 T122 LF3774 LF3977", "cat": "Filtres", "unite": "Pce", "prixAchat": 31120, "note": "Sporafric net price"}
];

// Abonnements seed data
export const ABOSEED: Abonnement[] = [
  {"client": "Chadelin Dinga", "tel": "06 831 61 20", "type": "Iptv Super", "formule": "Annuel", "montant": 35000, "dateReact": "2026-04-06", "validite": 365, "dateExp": "2027-04-06", "compte": "Impayé"},
  {"client": "Mr Dongui Doc", "tel": "06 560 77 37", "type": "Iptv Panel", "formule": "Annuel", "montant": 35000, "dateReact": "2026-04-07", "validite": 365, "dateExp": "2027-04-07", "compte": "Impayé"},
  {"client": "Dastel", "tel": "+242 05 062 3680", "type": "Netflix", "formule": "Partagé", "montant": 4000, "dateReact": "2026-06-17", "validite": 30, "dateExp": "2026-07-17", "compte": ""}
];

// Seed Catalog prices from main library file (PRICE_LIST_STHIC / HTC)
export const MAGCATALOG: any[] = [
  {"ref": "STHIC-OU004", "design": "BAGUETTE DE BRASURE CUIVRE P28 CLIMATISATION", "cat": "Mécanique", "unite": "Pce", "prixAchat": 250, "note": ""},
  {"ref": "STHIC-BM21", "design": "PAQUET 93P ELECTRODE RUTILE OMNIA 46 2,5", "cat": "Mécanique", "unite": "Pce", "prixAchat": 11771, "note": ""},
  {"ref": "STHIC-OU008", "design": "DISQUE A TRONCONNER A COUPER METAL 230", "cat": "Mécanique", "unite": "Pce", "prixAchat": 1100, "note": ""},
  {"ref": "STHIC-GE001", "design": "BATTERIE D59 12V 60 AH", "cat": "Batteries", "unite": "Pce", "prixAchat": 49588, "note": ""},
  {"ref": "STHIC-GE004", "design": "BATTERIE E 11 12V 74 AH / 75 AH", "cat": "Batteries", "unite": "Pce", "prixAchat": 73272, "note": ""},
  {"ref": "STHIC-E001", "design": "Tube fluo 18W lumiere du jour", "cat": "Électrique / Électronique", "unite": "Pce", "prixAchat": 1800, "note": ""}
];

export const CONTENTKVA: { [key: string]: number } = {
  "AGROFAB|BRASCO|FG WILSON": 22, "AGROFAB|VINDOULOU|SDMO": 44, "AGROFAB|VILLA CEDRICK|SDMO": 22,
  "AIRTEL|NEW HQ|DPK N°1": 1100, "AIRTEL|NEW HQ|DPK N°2": 1100, "AIRTEL|MSC|SDMO": 44,
  "AMBASSADE DE FRANCE|CONSULAT|LISTER PETTER": 20, "AMBASSADE DE FRANCE|CONSULAT|OLYMPIAN": 65,
  "AOGC|S/S PLATEAUX|SDMO": 44, "AOGC|S/S MAKAYABOU|SDMO": 33, "AOGC|DIRECTION|SDMO": 88,
  "BCH|CENTRE VILLE|SDMO": 44, "BCI|VILLA DGA / TCHIKOBO|CATERPILAR": 45, "BCI|GRAND MARCHE|SDMO": 44,
  "BEAC|VILLA DA|SDMO": 66, "BEAC|AGENCE C/V G1|SDMO": 550, "BEAC|AGENCE C/V G2|SDMO": 550,
  "BPC|GUD AEROPORT|OLYMPIAN": 275, "BPC|PORT|SDMO": 33, "BPC|G.U.D PORT|SDMO": 66,
  "BPC|FOND TIE-TIE|SDMO": 66, "BPC|KASSAI|SDMO": 66, "BPC|GRAND MARCHE|SDMO": 33,
  "BRASCO|INFORMATIQUE|FG WILSON": 33, "BRASCO|VILLA JOSEPH NIAMA|CAT": 30, "BRASCO|VILLA SG|SDMO": 22,
  "CONGO TELECOM|DIRECTION|SDMO": 220, "CONSULAT TURQUIE|CONSULAT|GHADDAR": 20, "EGIS|PEAGE MENGO|CUMMINS": 132,
  "EMILE OUOSSO|VILLA WARF|OLYMPIAN": 165, "FAC|VILLA COMZONE|SDMO": 70, "FORTIS|GARRAGE|CUMMINS": 66,
  "FUGRO|DIRECTION|CAT": 50, "GLE. ESSONGO|VILLA MPITA|SDMO": 44, "GVA|VINDOULOU|SDMO N°01": 12,
  "IFC|DIRECTION|SDMO": 88, "MUCODEC|TCHIMBAMBA|SDMO": 66, "SCLOG|VILLA DEX|SDMO": 33,
  "SEP|DIRECTION|SDMO": 110, "STHIC|BASE|SDMO N°05": 110, "TOTAL|S/S LOANGO|SDMO": 44,
  "XOIL|S/S KM4|SDMO": 110
};

export const RECEP: [string, number, number, number, number][] = [
  ['Éclairage LED intérieur', 15, 0.9, 1, 0.7],
  ['Éclairage extérieur', 36, 0.8, 1, 0.8],
  ['Prises courant (salon/chambres)', 200, 0.8, 1, 0.6],
  ['Prises TV / Home cinéma', 150, 0.95, 1, 0.8],
  ['Climatiseur Split 9000 BTU', 800, 0.85, 2.5, 0.8],
  ['Climatiseur Split 12000 BTU', 1100, 0.85, 2.5, 0.8],
  ['Climatiseur Split 18000 BTU', 1800, 0.85, 2.5, 0.7],
  ['Réfrigérateur / Congélateur', 350, 0.85, 3, 1],
  ['Four électrique encastrable', 3500, 0.95, 1, 0.3],
  ['Lave-linge', 2500, 0.85, 2, 0.5],
  ['Chauffe-eau électrique', 2000, 1, 1, 0.6],
  ['Surpresseur / Pompe', 1500, 0.8, 4, 1],
  ['Pompe piscine', 746, 0.8, 4, 0.7]
];

export const STDGE: [number, string][] = [
  [12, 'SDMO T 12 kVA'],
  [22, 'SDMO T 22 kVA'],
  [33, 'SDMO J 33 kVA'],
  [44, 'SDMO J 44 kVA'],
  [66, 'SDMO J 66 kVA'],
  [88, 'SDMO J 88 kVA'],
  [110, 'SDMO J 110 kVA'],
  [160, 'SDMO 160 kVA'],
  [200, 'SDMO 200 kVA'],
  [275, 'SDMO 275 kVA']
];
