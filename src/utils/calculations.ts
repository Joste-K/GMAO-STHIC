import { GE, Intervention, PlanningItem, ArticleMagasin } from "../types";
import { STDGE } from "../data/seed";

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayYMD(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function pd(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function fmt(s: string | null | undefined): string {
  const d = pd(s);
  return d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() : '—';
}

export function fmtD(d: Date | null | undefined): string {
  return d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() : '—';
}

export function addDays(s: string | Date, n: number): Date | null {
  const d = typeof s === 'string' ? pd(s) : new Date(s.getTime());
  if (!d) return null;
  d.setDate(d.getDate() + Math.round(n));
  return d;
}

export function addMonths(s: string | Date, m: number): Date | null {
  const d = typeof s === 'string' ? pd(s) : new Date(s.getTime());
  if (!d) return null;
  d.setMonth(d.getMonth() + m);
  return d;
}

export function diffDays(a: Date | null | undefined, b: Date | null | undefined): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function pannes(geId: string, interList: Intervention[]): number {
  return interList.filter(i => i.ge === geId && ['Corrective', 'Curative', 'Dépannage'].includes(i.type)).length;
}

export function siteKey(x: string | null | undefined): string {
  if (!x) return '';
  let s = x.toString().toUpperCase();
  s = s.replace(/\s*\/\s*\d+\s*GE\s*$/i, '');
  s = s.replace(/\s*\d+\s*KVA.*$/i, '');
  return s.trim();
}

export function normCli(x: string | null | undefined): string {
  return (x || '').toString().trim().toUpperCase();
}

export function normMarqueGE(m: string | null | undefined): string {
  let s = (m || '').toString().toUpperCase().trim();
  s = s.replace(/\s*N[°*]\s*\d+.*$/, '').replace(/\s*BPC\s*$/, '').trim();
  const fixes: { [key: string]: string } = {
    'CATERPILAR': 'CATERPILLAR',
    'KOLHER': 'KOHLER',
    'GADDAR': 'GHADDAR',
    'OLYMPIAN': 'OLYMPIAN (CAT)',
    'SDMO KOHLER': 'KOHLER',
    'SDMO KOLHER': 'KOHLER'
  };
  if (/^SDMO KOLHER/.test(s)) return 'KOHLER';
  return fixes[s] || s;
}

export function normRefPiece(s: string | null | undefined): string {
  return (s || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function magStockFinal(a: ArticleMagasin): number {
  return (a.stockInit || 0) + (a.entrees || 0) - (a.sorties || 0) - (a.ventes || 0);
}

export function magCoutUnit(a: ArticleMagasin): number {
  return (Number(a.prixAchat) || 0) + (Number(a.marge) || 0);
}

export function magPrixVente(a: ArticleMagasin): number {
  return Number(a.prixVente) || 0;
}

export function magBenefUnit(a: ArticleMagasin): number {
  const pv = magPrixVente(a);
  return pv ? (pv - magCoutUnit(a)) : 0;
}

export function magValeur(a: ArticleMagasin): number {
  return magStockFinal(a) * magCoutUnit(a);
}

export function magStatut(a: ArticleMagasin): string {
  const sf = magStockFinal(a);
  if (sf <= 0) return "Besoin d'appro urgent!";
  if (a.seuil != null && a.seuil !== 0 && sf <= a.seuil) return "Besoin d'appro";
  return 'Bon niveau de stock';
}

export function magStatutColor(s: string): string {
  return s === 'Bon niveau de stock' ? '#16a34a' : (s === "Besoin d'appro" ? '#d97706' : '#dc2626');
}

export function calcGE(g: GE, interList: Intervention[]) {
  const hrelNum = g.hrel != null ? Number(g.hrel) : null;
  const hvidNum = g.hvid != null ? Number(g.hvid) : null;
  const depuis = (hrelNum !== null && hvidNum !== null) ? hrelNum - hvidNum : null;
  const rest = (g.seuil != null && depuis !== null) ? g.seuil - depuis : null;
  const cycle = (g.regime && g.regime > 0 && g.seuil) ? Math.round(g.seuil / g.regime) : null;
  const proch = (g.dvid && cycle) ? addDays(g.dvid, cycle) : null;

  let sv = '⚪ À renseigner', svc = 'b-grey';
  const t = today();
  const v6 = g.dvid ? (addDays(g.dvid, 180)! <= t) : false;
  const v5 = g.dvid ? (addDays(g.dvid, 150)! <= t) : false;
  const svThreshold = Math.min(50, (g.seuil || 300) / 6);
  const vd = (rest !== null && rest <= svThreshold) || v6;
  const spThreshold = Math.min(100, (g.seuil || 300) / 3);
  const vpl = (rest !== null && rest <= spThreshold) || v5;

  if (rest !== null || proch) {
    if (vd) {
      sv = '🔴 À vidanger';
      svc = 'b-red';
    } else if (vpl) {
      sv = '🟠 À planifier';
      svc = 'b-amber';
    } else {
      sv = '🟢 OK';
      svc = 'b-ok';
    }
  }

  const bp = g.dbatt ? addMonths(g.dbatt, 24) : null;
  let bs = '⚪ À renseigner', bsc = 'b-grey';
  if (g.dbatt && bp) {
    if (bp < t) {
      bs = '🔴 À remplacer';
      bsc = 'b-red';
    } else if (diffDays(t, bp)! <= 120) {
      bs = '🟠 Bientôt';
      bsc = 'b-amber';
    } else {
      bs = '🟢 OK';
      bsc = 'b-ok';
    }
  }

  const kvaNum = g.kva ? Number(g.kva) : 0;
  const csh = (kvaNum >= 66 ? 2000 : 1000);
  const csm = (kvaNum >= 66 ? 36 : 24);
  const ch = (g.dcourr && g.regime && g.regime > 0) ? addDays(g.dcourr, Math.round(csh / g.regime)) : null;
  const cm = g.dcourr ? addMonths(g.dcourr, csm) : null;
  const cp = (ch && cm) ? (ch < cm ? ch : cm) : (cm || ch);

  let cs = '⚪ À renseigner', csc = 'b-grey';
  if (g.dcourr && cp) {
    if (cp < t) {
      cs = '🔴 À remplacer';
      csc = 'b-red';
    } else if (diffDays(t, cp)! <= 30) {
      cs = '🟠 Bientôt';
      csc = 'b-amber';
    } else {
      cs = '🟢 OK';
      csc = 'b-ok';
    }
  }

  const anc = g.drel ? diffDays(pd(g.drel), t) : null;
  let ar = '⚪ Aucun relevé';
  if (g.drel && anc !== null) {
    ar = anc > 45 ? '🔴 Relevé obsolète' : '🟢 À jour';
  }

  const np = pannes(g.id, interList);

  return { depuis, rest, cycle, proch, sv, svc, bp, bs, bsc, cp, cs, csc, anc, ar, np };
}

export function recoGE(g: GE, interList: Intervention[]) {
  const c = calcGE(g, interList);
  const items: string[] = [];
  let crit = false, surv = false;

  if (c.sv.includes('À vidanger')) {
    items.push('Vidange en retard (au-delà du seuil) : à réaliser sans délai.');
    crit = true;
  } else if (c.sv.includes('À planifier')) {
    items.push('Vidange proche : à planifier dans les prochains jours.');
    surv = true;
  }

  if (c.bs.includes('À remplacer')) {
    items.push('Batterie au-delà de 24 mois (garantie dépassée) : remplacer.');
    crit = true;
  } else if (c.bs.includes('Bientôt')) {
    items.push('Batterie en fin de garantie (proche de 24 mois) : prévoir le remplacement.');
    surv = true;
  }

  const kvaNum = g.kva ? Number(g.kva) : 0;
  if (c.cs.includes('À remplacer')) {
    items.push(`Courroie au-delà du seuil (${kvaNum >= 66 ? 2000 : 1000} h) ou échéance dépassée : remplacer.`);
    crit = true;
  } else if (c.cs.includes('Bientôt')) {
    items.push('Courroie proche de son échéance : prévoir le remplacement.');
    surv = true;
  }

  if (c.ar.includes('obsolète')) {
    items.push('Relevé compteur de plus de 45 jours : relever pour fiabiliser les échéances.');
    surv = true;
  }

  if (c.np >= 3) {
    items.push(`Pannes récurrentes (${c.np} interventions correctives) : diagnostic approfondi requis.`);
    crit = true;
  } else if (c.np === 2) {
    items.push('2 pannes correctives enregistrées : surveiller la fiabilité.');
    surv = true;
  }

  let health = '🟢 Bon', hc = 'b-ok';
  if (surv) {
    health = '🟠 À surveiller';
    hc = 'b-amber';
  }
  if (crit) {
    health = '🔴 Critique';
    hc = 'b-red';
  }

  if (!items.length) {
    items.push('État de fonctionnement correct : poursuivre la maintenance préventive selon échéancier.');
  }

  return { health, hc, items, crit, surv };
}

export function calcInter(i: Intervention) {
  const duree = (i.ddeb && i.dfin) ? diffDays(pd(i.ddeb), pd(i.dfin)) : null;

  let st = 'À traiter', stc = 'b-grey';
  if (i.dfin) {
    st = 'Terminé';
    stc = 'b-ok';
  } else if (i.ddeb) {
    st = 'En cours';
    stc = 'b-amber';
  } else if (i.dplan) {
    st = 'Planifié';
    stc = 'b-grey';
  }

  const imp = ['Corrective', 'Curative', 'Dépannage'].includes(i.type);
  const urg = ['Élevé', 'Critique'].includes(i.urg);

  let p = 'P4 — à classer', pc = 'b-grey';
  if (urg && imp) {
    p = '🔴 P1 — faire';
    pc = 'b-red';
  } else if (imp) {
    p = '🟠 P2 — planifier';
    pc = 'b-amber';
  } else if (urg) {
    p = '🟢 P3 — déléguer';
    pc = 'b-ok';
  }

  return { duree, st, stc, p, pc };
}

export function geEtatArret(geId: string, parcList: GE[]): boolean {
  const g = parcList.find(x => x.id === geId);
  return !!(g && g.etat === 'Arrêt contrat de maintenance');
}

export function calcPlan(p: PlanningItem, todayDate: Date = today()) {
  if (p.exec) {
    if (p.date && pd(p.exec)! < pd(p.date)!) {
      return { s: '⏩ Fait en avance', c: 'b-info', k: 'avance' };
    }
    if (p.date && pd(p.exec)! > pd(p.date)!) {
      const r = Math.round((pd(p.exec)!.getTime() - pd(p.date)!.getTime()) / 86400000);
      return { s: `⚠️ Fait en retard (+${r}j)`, c: 'b-amber', k: 'retard_fait' };
    }
    return { s: '✅ Exécuté', c: 'b-ok', k: 'fait' };
  }

  if (p.date && pd(p.date)! < todayDate) {
    const d = Math.round((todayDate.getTime() - pd(p.date)!.getTime()) / 86400000);
    return { s: `🔴 En retard (+${d}j)`, c: 'b-red', k: 'retard' };
  }

  return { s: '🟠 Planifié', c: 'b-grey', k: 'prevu' };
}

export function pickGE(k: number): string {
  for (const [s, m] of STDGE) {
    if (s >= k) return `${s} kVA — ${m}`;
  }
  return '≥ 275 kVA — étude spécifique';
}

export function calcLine(r: { qte?: number; pu?: number; cosphi?: number; fd?: number; fs?: number }) {
  const E = (Number(r.qte) || 0) * (Number(r.pu) || 0);
  const cf = Number(r.cosphi) || 0;
  const G = E * cf / 1000;
  const H = E * Math.sqrt(Math.max(0, 1 - cf * cf)) / 1000;
  const I = Math.sqrt(G * G + H * H);
  const L = I * (Number(r.fd) || 0);
  const M = G * (Number(r.fs) || 0);
  return { E, G, H, I, L, M };
}
