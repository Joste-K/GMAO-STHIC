import { PlanningItem, Task } from "../types";

/**
 * Formats phone numbers into standard international format for WhatsApp (e.g., 242061234567 or 33612345678).
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  // Strip spaces, dashes, plus, parentheses
  let cleaned = phone.replace(/[^\d]/g, "");
  // If starts with 06, 05, 04 in Congo Brazzaville (9 digits), add 242
  if (cleaned.length === 9 && (cleaned.startsWith("06") || cleaned.startsWith("05") || cleaned.startsWith("04"))) {
    cleaned = "242" + cleaned;
  }
  return cleaned;
}

/**
 * Opens WhatsApp Web or WhatsApp Mobile with a prefilled message.
 */
export function sendWhatsAppMessage(messageText: string, phone?: string) {
  const encodedText = encodeURIComponent(messageText);
  const cleanPhone = phone ? formatPhoneForWhatsApp(phone) : "";

  let url = "";
  if (cleanPhone) {
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    // If no phone provided, wa.me/?text= allows picking any contact directly in WhatsApp
    url = `https://wa.me/?text=${encodedText}`;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Builds a clean, professional WhatsApp text message for a single planning item.
 */
export function buildPlanningWhatsAppMessage(p: PlanningItem, extraConsignes?: string): string {
  const dateStr = p.date || "Date à préciser";
  const techStr = p.tech || "Non assigné";
  const clientStr = p.client || "STHIC";
  const siteStr = p.site || "Non spécifié";
  const geStr = p.ge ? `GE: ${p.ge}` : "Groupe Électrogène";
  const typeStr = p.type || "Maintenance / Vidange";
  const noteStr = p.note ? p.note : "Aucune consigne particulière.";

  return `📲 *GMAO STHIC - AFFECTATION D'INTERVENTION*

📅 *Date d'intervention:* ${dateStr}
👤 *Technicien assigné:* ${techStr}
🏢 *Client:* ${clientStr}
📍 *Site / Lieu:* ${siteStr}
⚡ *Équipement:* ${geStr}${p.kva ? ` (${p.kva} kVA)` : ""}${p.marque ? ` - ${p.marque}` : ""}
🔧 *Type d'intervention:* ${typeStr}
📝 *Consignes & Notes:* ${noteStr}
${extraConsignes ? `\n📌 *Consignes supplémentaires:* ${extraConsignes}` : ""}

----------------------------------
Merci de confirmer la réception de cet ordre de mission.
*Service Technique STHIC GMAO*`;
}

/**
 * Builds a WhatsApp summary message for all tasks/interventions assigned to a technician.
 */
export function buildTechnicianPlanningSummaryWhatsApp(techName: string, items: PlanningItem[]): string {
  if (items.length === 0) {
    return `📲 *GMAO STHIC - PLANNING TECHNICIEN*\n\nBonjour ${techName},\nVous n'avez aucune intervention attribuée dans le planning sélectionné.`;
  }

  let text = `📲 *GMAO STHIC - PLANNING DU TECHNICIEN*\n\n`;
  text += `👤 *Technicien:* ${techName}\n`;
  text += `📊 *Nombre d'interventions:* ${items.length}\n`;
  text += `----------------------------------\n\n`;

  items.forEach((item, index) => {
    text += `*${index + 1}. [${item.date || "Sans date"}] ${item.type || "Intervention"}*\n`;
    text += `   • *Client:* ${item.client} (${item.site})\n`;
    text += `   • *GE:* ${item.ge || "N/A"}${item.kva ? ` - ${item.kva} kVA` : ""}\n`;
    if (item.note) text += `   • *Note:* ${item.note}\n`;
    text += `\n`;
  });

  text += `----------------------------------\n`;
  text += `Merci de valider l'exécution au fur et à mesure sur la GMAO STHIC.`;

  return text;
}

/**
 * Builds a WhatsApp message for an Intervention Task.
 */
export function buildTaskWhatsAppMessage(task: Task): string {
  const titre = task.titre || task.motif || "Intervention technique";
  const tech = task.assigne || task.intervenants || "Non assigné";
  const client = task.client || "Client STHIC";
  const site = task.site || "Site client";
  const ge = task.ge || "N/A";
  const echeance = task.echeance || "Aujourd'hui";
  const prio = task.prio || "P3";

  return `🛠️ *GMAO STHIC - ORDRE DE MISSION / TÂCHE*

📌 *Titre / Motif:* ${titre}
🚨 *Priorité:* ${prio}
📅 *Échéance:* ${echeance}
👤 *Intervenant(s):* ${tech}

🏢 *Client:* ${client}
📍 *Site:* ${site}
⚡ *Groupe Électrogène:* ${ge}
📝 *Détails / Instructions:* ${task.notes || task.observation || "Intervention sur site."}

----------------------------------
*GMAO STHIC - Gestion de Maintenance*`;
}
