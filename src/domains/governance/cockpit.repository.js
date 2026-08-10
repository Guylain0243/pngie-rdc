// src/domains/governance/cockpit.repository.js
// Requetes d'agregation uniquement. Le Cockpit ne possede aucune donnee : il
// lit decision_gouvernementale/decision_action (et plus tard d'autres domaines)
// et calcule des indicateurs. Reutilise le meme filtrage par perimetre que
// decision.repository.listerDecisions (institutionsVisibles/statutsAutorises).
const db = require("../../db");

function clauseInstitutions(institutionsVisibles, params) {
  if (institutionsVisibles === null) return "";
  if (institutionsVisibles.length === 0) return "AND FALSE"; // aucun perimetre -> aucune ligne
  params.push(...institutionsVisibles);
  return `AND emetteur_institution_id IN (${institutionsVisibles.map(() => "?").join(",")})`;
}

async function compterDecisionsParStatut({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  return db.all(
    `SELECT statut, COUNT(*) AS total FROM decision_gouvernementale
     WHERE TRUE ${clauseInst} ${clauseStatuts}
     GROUP BY statut`,
    params
  );
}

async function compterDecisionsEnRetard({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  const row = await db.get(
    `SELECT COUNT(*) AS total FROM decision_gouvernementale d
     WHERE d.statut NOT IN ('ARCHIVEE', 'ANNULEE')
       AND EXISTS (
         SELECT 1 FROM decision_action da
         WHERE da.decision_id = d.decision_id
           AND da.date_echeance IS NOT NULL
           AND da.date_echeance < CURRENT_DATE
           AND da.statut <> 'TERMINEE'
       )
       ${clauseInst.replace("emetteur_institution_id", "d.emetteur_institution_id")}
       ${clauseStatuts.replace("statut", "d.statut")}`,
    params
  );
  return row ? row.total : 0;
}

async function repartitionParInstitution({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND d.statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  return db.all(
    `SELECT i.nom AS institution_nom, COUNT(*) AS total
     FROM decision_gouvernementale d
     JOIN institution i ON i.institution_id = d.emetteur_institution_id
     WHERE TRUE ${clauseInst} ${clauseStatuts}
     GROUP BY i.nom
     ORDER BY total DESC`,
    params
  );
}

async function compterActesPublies({ depuis }) {
  // Le Journal National a sa propre RLS (pol_acte_officiel_scope) -- ici on ne
  // fait que compter, la visibilite est deja assuree par PostgreSQL au niveau
  // de la session de l'utilisateur connecte (contrairement a decision_gouvernementale).
  const params = [];
  let clauseDate = "";
  if (depuis) { clauseDate = "AND date_publication >= ?"; params.push(depuis); }
  const row = await db.get(
    `SELECT COUNT(*) AS total FROM acte_officiel WHERE statut = 'publie' ${clauseDate}`,
    params
  );
  return row ? row.total : 0;
}

// --- Widget "Actions critiques" --------------------------------------------
// Criticite calculee dynamiquement (aucune colonne priorite/criticite ajoutee,
// decision validee le 09/08/2026) a partir de statut/taux_execution/date_echeance
// deja presents sur decision_action :
//   niveau 1 : en retard (echeance depassee), non terminee
//   niveau 2 : retard > 7 jours OU taux_execution < 30
//   niveau 3 : retard > 30 jours ET (taux_execution = 0 OU statut = 'BLOQUEE')
// statut enum reel de decision_action : NON_DEMARREE | EN_COURS | TERMINEE | BLOQUEE
// (pas de statut EN_ATTENTE dans le schema actuel).
async function listerActionsCritiques({ institutionsVisibles, statutsAutorises }, { limit = 200 } = {}) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  params.push(limit);
  return db.all(
    `SELECT da.action_id, da.decision_id, d.titre AS decision_titre,
            da.institution_id, i.nom AS institution_nom,
            da.statut, da.taux_execution, da.date_echeance,
            CASE
              WHEN da.date_echeance < CURRENT_DATE - INTERVAL '30 days'
                   AND (da.taux_execution = 0 OR da.statut = 'BLOQUEE') THEN 3
              WHEN da.date_echeance < CURRENT_DATE - INTERVAL '7 days'
                   OR da.taux_execution < 30 THEN 2
              ELSE 1
            END AS niveau_criticite
     FROM decision_action da
     JOIN decision_gouvernementale d ON d.decision_id = da.decision_id
     JOIN institution i ON i.institution_id = da.institution_id
     WHERE da.statut <> 'TERMINEE'
       AND da.date_echeance IS NOT NULL
       AND da.date_echeance < CURRENT_DATE
       ${clauseInst.replace("emetteur_institution_id", "d.emetteur_institution_id")}
       ${clauseStatuts.replace(/\bstatut\b/, "d.statut")}
     ORDER BY niveau_criticite DESC, da.date_echeance ASC
     LIMIT ?`,
    params
  );
}

// --- Widget "Alertes nationales" -------------------------------------------
// Reutilise le moteur de notifications existant (notification-engine.js +
// table notification), sans nouveau mecanisme. Filtre par role du demandeur
// (destinataire_id), non-lues en priorite.
async function listerAlertesPourPersonne(personneId, { limit = 20 } = {}) {
  if (!personneId) return [];
  return db.all(
    `SELECT notification_id, entite_liee, entite_liee_ref_id, canal,
            titre, contenu, lu, date_envoi, created_at
     FROM notification
     WHERE destinataire_id = ?
     ORDER BY lu ASC, created_at DESC
     LIMIT ?`,
    [personneId, limit]
  );
} 

// --- Widget "Exécution par province" ----------------------------------------
// La table institution n'a pas de colonne province directe. Les provinces
// sont elles-memes des lignes institution (type_institution = 'PROVINCE').
// On remonte institution_parent_id jusqu'a trouver l'ancetre province la plus
// proche (ou aucune -> niveau national). Aucune nouvelle table/colonne.
async function resoudreProvinceDInstitution(institutionId) {
  const row = await db.get(
    `WITH RECURSIVE remontee AS (
       SELECT institution_id, institution_parent_id, type_institution, nom
       FROM institution WHERE institution_id = ?
       UNION ALL
       SELECT i.institution_id, i.institution_parent_id, i.type_institution, i.nom
       FROM institution i
       JOIN remontee r ON i.institution_id = r.institution_parent_id
     )
     SELECT institution_id, nom FROM remontee
     WHERE type_institution = 'PROVINCE'
     LIMIT 1`,
    [institutionId]
  );
  return row || null;
}

async function repartitionParInstitutionAvecId({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND d.statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  return db.all(
    `SELECT d.emetteur_institution_id AS institution_id, i.nom AS institution_nom, COUNT(*) AS total
     FROM decision_gouvernementale d
     JOIN institution i ON i.institution_id = d.emetteur_institution_id
     WHERE TRUE ${clauseInst} ${clauseStatuts}
     GROUP BY d.emetteur_institution_id, i.nom`,
    params
  );
}

async function repartitionParProvince(filtres) {
  const parInstitution = await repartitionParInstitutionAvecId(filtres);
  const cache = new Map(); // institution_id -> { institution_id|null, nom }
  const parProvince = new Map(); // cle province (id ou 'NATIONAL') -> { province_nom, total }

  for (const ligne of parInstitution) {
    let province = cache.get(ligne.institution_id);
    if (province === undefined) {
      const p = await resoudreProvinceDInstitution(ligne.institution_id);
      province = p ? { id: p.institution_id, nom: p.nom } : { id: null, nom: "Niveau national" };
      cache.set(ligne.institution_id, province);
    }
    const cle = province.id || "NATIONAL";
    const existant = parProvince.get(cle) || { province_nom: province.nom, total: 0 };
    existant.total += Number(ligne.total);
    parProvince.set(cle, existant);
  }
  return [...parProvince.values()].sort((a, b) => b.total - a.total);
}

// --- Widget "Dernières activités" -------------------------------------------
// Reutilise le moteur d'evenements existant (event-engine.js + table
// entity_event), deja alimente a chaque creation/modification de decision.
// Le filtrage par perimetre se fait via une jointure retour vers
// decision_gouvernementale (meme filtre que les autres widgets), pas de
// colonne institution dupliquee sur entity_event.
async function listerDernieresActivites({ institutionsVisibles, statutsAutorises }, { limit = 20 } = {}) {
  const paramsDecision = [];
  const clauseInstDecision = clauseInstitutions(institutionsVisibles, paramsDecision);
  let clauseStatutsDecision = "";
  if (statutsAutorises) {
    clauseStatutsDecision = `AND d.statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    paramsDecision.push(...statutsAutorises);
  }

  const paramsAction = [];
  const clauseInstAction = clauseInstitutions(institutionsVisibles, paramsAction);
  let clauseStatutsAction = "";
  if (statutsAutorises) {
    clauseStatutsAction = `AND d.statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    paramsAction.push(...statutsAutorises);
  }

  const params = [...paramsDecision, ...paramsAction, limit];
  return db.all(
    `SELECT ev.event_id, ev.entity, ev.entity_id, ev.evenement, ev.created_at
     FROM entity_event ev
     WHERE (
       ev.entity = 'decision_gouvernementale' AND ev.entity_id IN (
         SELECT d.decision_id::text FROM decision_gouvernementale d
         WHERE TRUE ${clauseInstDecision.replace("emetteur_institution_id", "d.emetteur_institution_id")} ${clauseStatutsDecision}
       )
     ) OR (
       ev.entity = 'decision_action' AND ev.entity_id IN (
         SELECT da.action_id::text FROM decision_action da
         JOIN decision_gouvernementale d ON d.decision_id = da.decision_id
         WHERE TRUE ${clauseInstAction.replace("emetteur_institution_id", "d.emetteur_institution_id")} ${clauseStatutsAction}
       )
     )
     ORDER BY ev.created_at DESC
     LIMIT ?`,
    params
  );
}

module.exports = {
  compterDecisionsParStatut,
  compterDecisionsEnRetard,
  repartitionParInstitution,
  compterActesPublies,
  listerActionsCritiques,
  listerAlertesPourPersonne,
  repartitionParProvince,
  listerDernieresActivites,
};
