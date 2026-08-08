const db = require("./src/db");

const regles = [
  { rule_id: "OP-SEUIL-BUDGET-10K", entity: "ordre_paiement", nom: "Validation Budget requise au-dela de 10000 USD", description: "Bloque le paiement tant que le Ministere du Budget n'a pas valide", evenement: "AVANT_MODIFICATION", condition_json: JSON.stringify([
    { source: "nouveau", champ: "statut", operateur: "=", valeur: "PAYE" },
    { source: "existant", champ: "montant", operateur: ">", valeur: 10000 },
    { source: "existant", champ: "valide_par_budget", operateur: "!=", valeur: "OUI" }
  ]), message_erreur: "Decaissement superieur a 10000 USD : validation du Ministere du Budget requise avant paiement." },

  { rule_id: "OP-SEUIL-FINANCES-10K", entity: "ordre_paiement", nom: "Validation Finances requise au-dela de 10000 USD", description: "Bloque le paiement tant que le Ministere des Finances n'a pas valide", evenement: "AVANT_MODIFICATION", condition_json: JSON.stringify([
    { source: "nouveau", champ: "statut", operateur: "=", valeur: "PAYE" },
    { source: "existant", champ: "montant", operateur: ">", valeur: 10000 },
    { source: "existant", champ: "valide_par_finances", operateur: "!=", valeur: "OUI" }
  ]), message_erreur: "Decaissement superieur a 10000 USD : validation du Ministere des Finances requise avant paiement." },

  { rule_id: "OP-SEUIL-PRIMATURE-10K", entity: "ordre_paiement", nom: "Validation Primature requise au-dela de 10000 USD", description: "Bloque le paiement tant que la Primature n'a pas valide", evenement: "AVANT_MODIFICATION", condition_json: JSON.stringify([
    { source: "nouveau", champ: "statut", operateur: "=", valeur: "PAYE" },
    { source: "existant", champ: "montant", operateur: ">", valeur: 10000 },
    { source: "existant", champ: "valide_par_primature", operateur: "!=", valeur: "OUI" }
  ]), message_erreur: "Decaissement superieur a 10000 USD : validation de la Primature requise avant paiement." },

  { rule_id: "OP-SEUIL-PRESIDENCE-50K", entity: "ordre_paiement", nom: "Autorisation Presidence requise au-dela de 50000 USD", description: "Bloque le paiement tant que la Presidence n'a pas autorise", evenement: "AVANT_MODIFICATION", condition_json: JSON.stringify([
    { source: "nouveau", champ: "statut", operateur: "=", valeur: "PAYE" },
    { source: "existant", champ: "montant", operateur: ">", valeur: 50000 },
    { source: "existant", champ: "valide_par_presidence", operateur: "!=", valeur: "OUI" }
  ]), message_erreur: "Decaissement superieur a 50000 USD : autorisation de la Presidence requise avant paiement." },

  { rule_id: "OP-SEUIL-IGF-50K", entity: "ordre_paiement", nom: "Controle IGF requis au-dela de 50000 USD", description: "Bloque le paiement tant que l'IGF n'a pas verifie", evenement: "AVANT_MODIFICATION", condition_json: JSON.stringify([
    { source: "nouveau", champ: "statut", operateur: "=", valeur: "PAYE" },
    { source: "existant", champ: "montant", operateur: ">", valeur: 50000 },
    { source: "existant", champ: "valide_par_igf", operateur: "!=", valeur: "OUI" }
  ]), message_erreur: "Decaissement superieur a 50000 USD : controle et verification de l'Inspection Generale des Finances (IGF) requis avant paiement." }
];

async function main() {
  for (const r of regles) {
    await db.run(
      "INSERT OR IGNORE INTO meta_rule (rule_id, entity, nom, description, evenement, condition_json, message_erreur, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIF', ?)",
      [r.rule_id, r.entity, r.nom, r.description, r.evenement, r.condition_json, r.message_erreur, new Date().toISOString()]
    );
  }
  console.log("OK: " + regles.length + " regles de seuil inserees pour ordre_paiement");
}

main().catch(err => { console.error(err); process.exit(1); });
