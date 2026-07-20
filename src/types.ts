export interface GE {
  id: string;
  client: string;
  site: string;
  marque?: string;
  kva?: number | "";
  moteur?: string;
  huile?: number | null;
  regime?: number | null;
  seuil?: number | null;
  dvid?: string | null;
  hvid?: number | null;
  drel?: string | null;
  hrel?: number | null;
  dbatt?: string | null;
  dcourr?: string | null;
  type?: string;
  etat?: string; // 'Opérationnel' | 'En panne' | 'En maintenance' | 'Hors service' | 'Arrêt contrat de maintenance'
  comm?: string | null;
  cause?: string | null;
  actions?: string | null;
  recop?: string | null;
  fhuile?: string;
  fgasoil?: string;
  fair?: string;
  feau?: string;
  fcourroie?: string;
  fbatterie?: string;
  _id?: string;
}

export interface Intervention {
  num?: string;
  client: string;
  site: string;
  ge: string;
  type: string;
  tech: string;
  descp: string;
  descr: string;
  reso: string;
  obs: string;
  ddeb: string | null;
  dfin: string | null;
  dplan: string | null;
  urg: string; // 'Faible' | 'Moyen' | 'Élevé' | 'Critique'
  kva?: number | "";
  _id?: string;
}

export interface PlanningItem {
  date: string | null;
  client: string;
  site: string;
  ge: string;
  type?: string; // 'Préventive' | 'Corrective' | 'Vidange' | 'Curative' | 'Autre'
  tech: string;
  note: string;
  exec: string | null;
  marque?: string | null;
  kva?: number | "";
  _id?: string;
}

export interface Anomalie {
  id: string;
  ge: string;
  client: string;
  site: string;
  date: string;
  prio: string; // 'Haute' | 'Moyenne' | 'Basse'
  echeance: string;
  resp: string;
  statut: string; // 'Ouvert' | 'En cours' | 'Résolu'
  desc: string;
  _id?: string;
}

export interface TaskLogEvent {
  t: string; // ISO String
  a: string; // Action description
}

export interface TaskMsg {
  who: string;
  txt: string;
  t: string; // ISO String
}

export interface Task {
  id: string;
  titre: string;
  type: string;
  statut: string; // 'Non commencé' | 'En cours' | 'En attente' | 'Bloqué' | 'Terminé'
  prio: string; // 'P1' | 'P2' | 'P3' | 'P4'
  cat: string;
  ge: string;
  client: string;
  site: string;
  echeance: string;
  ddemande?: string | null;
  assigne: string;
  etiquette: string;
  prog: number;
  notes: string;
  log?: TaskLogEvent[];
  msgs?: TaskMsg[];
  dreal?: string | null;
  _id?: string;

  // New custom fields
  visibiliteClient?: boolean;
  emailAvisClient?: boolean;
  emailPlanifClient?: boolean;
  motif?: string;
  nomDemandeur?: string;
  telDemandeur?: string;
  numCommande?: string;
  observation?: string;
  photo?: string;
  fac?: string; // 'A facturer' | 'Sous Garantie' | 'Maintenance' | 'Non facturable' | 'Facturée'
  societe?: string;
  prestations?: string;
  installationEquipement?: string;
  attente?: boolean; // Intervention en attente (OUI / NON)
  source?: string;
  debutIntervention?: string; // jj/mm/aaaa --:--
  finIntervention?: string; // jj/mm/aaaa --:--
  planningDetaille?: boolean; // OUI / NON
  intervenants?: string;
}

export interface Materiel {
  code: string;
  cat: string; // 'Groupe électrogène' | 'Outillage' | 'Véhicule' | 'Pompe' | 'Autre'
  designation?: string;
  marque?: string;
  carac?: string;
  annee?: number | null;
  valeur?: number | null;
  etat?: string; // 'Neuf' | 'Bon' | 'Moyen' | 'À réviser' | 'HS'
  dispo?: string; // 'En stock' | 'Déployé' | 'En réparation' | 'Réformé'
  client?: string;
  sortie?: string | null;
  retour?: string | null;
  heures?: number | null;
  obs?: string;
  _id?: string;
}

export interface ArticleMagasin {
  ref: string;
  design: string;
  cat: string;
  ordre?: string;
  unite?: string;
  seuil?: number | null;
  stockInit: number;
  entrees?: number;
  sorties?: number;
  ventes?: number;
  prixAchat: number;
  marge: number;
  prixVente: number;
  note: string;
  _id?: string;
}

export interface MouvementMagasin {
  date: string;
  mois: string;
  ref: string;
  design: string;
  qteE: number;
  qteS: number;
  note: string;
  _id?: string;
}

export interface Vente {
  date: string;
  ref: string;
  design: string;
  cat: string;
  unite: string;
  qte: number;
  pv: number;
  remise: number;
  cout: number;
  note: string;
  _id?: string;

  // Commercial tracking extra properties
  id?: string;
  client?: string;
  valeur?: number | null;
  type?: string;
  statut?: string;
  dfact?: string | null;
  echeance?: string | null;
  obs?: string;
}

export interface Abonnement {
  client: string;
  tel: string;
  type: string;
  formule: string;
  montant: number;
  dateReact: string;
  validite: number;
  dateExp: string;
  compte: string;
  _id?: string;
}

export interface BilanRecepteur {
  des: string;
  qte: number;
  pu: number;
  cosphi: number;
  fd: number;
  fs: number;
}

export interface Bilan {
  id: string;
  nom: string;
  client: string;
  site: string;
  date: string;
  usage: string; // 'Secours' | 'Continu' | 'Mixte'
  tension: string;
  tech: string;
  devis: string;
  coef: number;
  rec: BilanRecepteur[];
}

export interface CartItem {
  ref: string;
  des: string;
  qteSelected: number;
  pu_vente: number;
  maxStock: number;
}

export interface RootCauseAnalysis {
  id: string;
  date: string;
  geId: string;
  anomaly: string;
  whys: string[];
  action: string;
  _id?: string;
}

export interface AppDatabase {
  parc: GE[];
  inter: Intervention[];
  plan: PlanningItem[];
  anomalies: Anomalie[];
  taches: Task[];
  materiel: Materiel[];
  magasin: ArticleMagasin[];
  mouvements: MouvementMagasin[];
  ventes: Vente[];
  abos: Abonnement[];
  bilans: Bilan[];
  rootCauses: RootCauseAnalysis[];
  magasinCats: string[];
  magasinUnites: string[];
}
