// ════════════════════════════════════════════════════════════════
// PNGIE-RDC — Module RNI : Chaîne de commandement dynamique
// Patron "PNGIE Secure API v1" — Bloc F (réécriture complète)
//
// Chaîne complète pour CHAQUE route :
//   requireAuth -> validate() -> permission RNI (meta_permission) ->
//   autorité institutionnelle -> transaction db.js -> audit() ->
//   réponse JSON normalisée (errors.js)
//
// Aucun institution_id envoyé par le client n'est jamais une preuve
// d'autorité : toujours vérifié via estAutoriseSurInstitution().
// ════════════════════════════════════════════════════════════════
const express = require('express');
const crypto = require('crypto');

const db = require('./db');
const { validate } = require('./middleware/validation');
const { sendError } = require('./lib/errors');
const { verifierPermission } = require('./security-engine');
const { estAutoriseSurInstitution } = require('./services/institution-authority');
const audit = require('./lib/audit');
const requireAuth = require('./middleware/requireAuth');

const router = express.Router();

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.use(requireAuth);

// ─── RBAC : le rôle vient du JWT vérifié (req.user.roles[0]), jamais d'un en-tête client ───
function exigerPermissionRni(entity, action) {
  return wrap(async (req, res, next) => {
    const roleCode = req.user && req.user.roles && req.user.roles[0];
    if (!roleCode) {
      await audit(req.user && req.user.sub, 'PERMISSION_DENIED', entity, null, { action, raison: 'Rôle absent du token' });
      return sendError(res, 'FORBIDDEN', 'Aucun rôle associé à ce compte.');
    }
    const autorise = await verifierPermission(roleCode, entity, action);
    if (!autorise) {
      const auditAction = entity === 'rni_lien' ? 'RNI_LINK_DENIED' : 'PERMISSION_DENIED';
      await audit(req.user.sub, auditAction, entity, null, { roleCode, action });
      return sendError(res, 'FORBIDDEN', `Le rôle "${roleCode}" ne peut pas faire "${action}" sur "${entity}".`);
    }
    req.roleCode = roleCode;
    next();
  });
}

// ─── Autorité institutionnelle : vérifie que l'appelant représente réellement institutionId ───
async function verifierAutoriteInstitution(req, res, institutionId, entity, action) {
  const ok = await estAutoriseSurInstitution(req.user.sub, institutionId, entity, action);
  if (!ok) {
    await audit(req.user.sub, 'INSTITUTION_MISMATCH', entity, institutionId, { action, institutionId });
    sendError(res, 'FORBIDDEN_INSTITUTION', "Vous n'êtes pas autorisé à représenter cette institution.");
    return false;
  }
  return true;
}

// ════════════════════════════════════════════════
// 1. HIÉRARCHIE DYNAMIQUE
// ════════════════════════════════════════════════

router.get('/rni/hierarchie',
  exigerPermissionRni('rni_lien', 'READ'),
  wrap(async (req, res) => {
    const institutions = await db.all(`SELECT institution_id, code, nom FROM institution ORDER BY nom`);
    const liens = await db.all(
      `SELECT lien_id, institution_id, institution_parent_id, type_lien, statut
       FROM rni_lien_hierarchique WHERE statut = 'ACTIF'`
    );
    res.json({ success: true, data: { institutions, liens } });
  })
);

router.get('/rni/hierarchie/:institutionId',
  validate({ params: { institutionId: { type: 'uuid', required: true } } }),
  exigerPermissionRni('rni_lien', 'READ'),
  wrap(async (req, res) => {
    const { institutionId } = req.params;
    const enfants = await db.all(
      `SELECT l.lien_id, l.type_lien, i.institution_id, i.code, i.nom
       FROM rni_lien_hierarchique l
       JOIN institution i ON i.institution_id = l.institution_id
       WHERE l.institution_parent_id = ? AND l.statut = 'ACTIF'
       ORDER BY i.nom`,
      [institutionId]
    );
    const parents = await db.all(
      `SELECT l.lien_id, l.type_lien, i.institution_id, i.code, i.nom
       FROM rni_lien_hierarchique l
       JOIN institution i ON i.institution_id = l.institution_parent_id
       WHERE l.institution_id = ? AND l.statut = 'ACTIF'
       ORDER BY i.nom`,
      [institutionId]
    );
    res.json({ success: true, data: { enfants, parents } });
  })
);

router.post('/rni/liens',
  validate({
    body: {
      institution_id: { type: 'uuid', required: true },
      institution_parent_id: { type: 'uuid', required: true },
      type_lien: { type: 'enum', values: ['TUTELLE', 'HIERARCHIQUE', 'FONCTIONNEL', 'COORDINATION'], required: true },
      reference_juridique: { type: 'string', maxLength: 500 }
    }
  }),
  exigerPermissionRni('rni_lien', 'CREATE'),
  wrap(async (req, res) => {
    const { institution_id, institution_parent_id, type_lien, reference_juridique } = req.body;

    if (institution_id === institution_parent_id) {
      return sendError(res, 'VALIDATION_ERROR', "Une institution ne peut pas être son propre parent.");
    }

    const autoriseEnfant = await verifierAutoriteInstitution(req, res, institution_id, 'rni_lien', 'CREATE');
    if (!autoriseEnfant) return;

    const lien_id = crypto.randomUUID();
    await db.run(
      `INSERT INTO rni_lien_hierarchique (lien_id, institution_id, institution_parent_id, type_lien, reference_juridique)
       VALUES (?,?,?,?,?)`,
      [lien_id, institution_id, institution_parent_id, type_lien, reference_juridique || null]
    );

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_lien', lien_id, { institution_id, institution_parent_id, type_lien });
    res.status(201).json({ success: true, data: { lien_id } });
  })
);

router.post('/rni/liens/:lienId/desactiver',
  validate({ params: { lienId: { type: 'uuid', required: true } } }),
  exigerPermissionRni('rni_lien', 'DEACTIVATE'),
  wrap(async (req, res) => {
    const { lienId } = req.params;

    const lien = await db.get(`SELECT institution_id FROM rni_lien_hierarchique WHERE lien_id = ?`, [lienId]);
    if (!lien) {
      return sendError(res, 'NOT_FOUND', 'Lien hiérarchique introuvable.');
    }

    const autorise = await verifierAutoriteInstitution(req, res, lien.institution_id, 'rni_lien', 'DEACTIVATE');
    if (!autorise) return;

    await db.run(
      `UPDATE rni_lien_hierarchique SET statut='INACTIF', date_fin=CURRENT_DATE WHERE lien_id=?`,
      [lienId]
    );

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_lien', lienId, { action: 'DEACTIVATE' });
    res.json({ success: true, data: { ok: true } });
  })
);

// ════════════════════════════════════════════════
// 2. INSTRUCTIONS
// ════════════════════════════════════════════════

router.get('/instructions',
  validate({
    query: {
      institution_id: { type: 'uuid' },
      sens: { type: 'enum', values: ['emises', 'recues'] },
      statut: { type: 'enum', values: ['EMISE', 'EN_COURS', 'EXECUTEE', 'EN_RETARD', 'ANNULEE'] }
    }
  }),
  exigerPermissionRni('rni_instruction', 'READ'),
  wrap(async (req, res) => {
    const { institution_id, sens, statut } = req.query;
    const clauses = [];
    const params = [];
    if (institution_id) {
      if (sens === 'emises') { clauses.push(`i.emetteur_institution_id = ?`); params.push(institution_id); }
      else if (sens === 'recues') { clauses.push(`i.destinataire_institution_id = ?`); params.push(institution_id); }
      else { clauses.push(`(i.emetteur_institution_id = ? OR i.destinataire_institution_id = ?)`); params.push(institution_id, institution_id); }
    }
    if (statut) { clauses.push(`i.statut = ?`); params.push(statut); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const rows = await db.all(
      `SELECT i.*, e.nom AS emetteur_nom, d.nom AS destinataire_nom
       FROM instruction i
       JOIN institution e ON e.institution_id = i.emetteur_institution_id
       JOIN institution d ON d.institution_id = i.destinataire_institution_id
       ${where}
       ORDER BY i.date_emission DESC`,
      params
    );
    res.json({ success: true, data: rows });
  })
);

router.get('/instructions/:id',
  validate({ params: { id: { type: 'uuid', required: true } } }),
  exigerPermissionRni('rni_instruction', 'READ'),
  wrap(async (req, res) => {
    const { id } = req.params;
    const instruction = await db.get(
      `SELECT i.*, e.nom AS emetteur_nom, d.nom AS destinataire_nom
       FROM instruction i
       JOIN institution e ON e.institution_id = i.emetteur_institution_id
       JOIN institution d ON d.institution_id = i.destinataire_institution_id
       WHERE i.instruction_id = ?`,
      [id]
    );
    if (!instruction) {
      return sendError(res, 'NOT_FOUND', 'Instruction introuvable.');
    }
    const rapports = await db.all(
      `SELECT * FROM execution_rapport WHERE instruction_id = ? ORDER BY date_rapport DESC`,
      [id]
    );
    const rapportIds = rapports.map(r => r.rapport_id);
    let verifications = [];
    for (const rid of rapportIds) {
      const vs = await db.all(`SELECT * FROM verification WHERE rapport_id = ? ORDER BY date_verification DESC`, [rid]);
      verifications = verifications.concat(vs);
    }
    const historique = await db.all(
      `SELECT * FROM instruction_historique WHERE instruction_id = ? ORDER BY date_changement DESC`,
      [id]
    );
    res.json({ success: true, data: { instruction, rapports, verifications, historique } });
  })
);

router.post('/instructions',
  validate({
    body: {
      emetteur_institution_id: { type: 'uuid', required: true },
      destinataire_institution_id: { type: 'uuid', required: true },
      objet: { type: 'string', required: true, maxLength: 500 },
      description: { type: 'string', maxLength: 5000 },
      priorite: { type: 'enum', values: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
      date_echeance: { type: 'date' },
      reference_juridique: { type: 'string', maxLength: 500 }
    }
  }),
  exigerPermissionRni('rni_instruction', 'CREATE'),
  wrap(async (req, res) => {
    const { destinataire_institution_id, objet, description, priorite, date_echeance, reference_juridique, emetteur_institution_id } = req.body;

    const autorise = await verifierAutoriteInstitution(req, res, emetteur_institution_id, 'rni_instruction', 'CREATE');
    if (!autorise) return;

    const instruction_id = crypto.randomUUID();
    await db.run(
      `INSERT INTO instruction
         (instruction_id, emetteur_institution_id, emetteur_person_id, destinataire_institution_id,
          objet, description, priorite, reference_juridique, date_echeance, statut)
       VALUES (?,?,?,?,?,?,?,?,?,'EMISE')`,
      [instruction_id, emetteur_institution_id, req.user.sub || null, destinataire_institution_id,
       objet, description || null, priorite || 'NORMALE', reference_juridique || null, date_echeance || null]
    );
    await db.run(
      `INSERT INTO instruction_historique (historique_id, instruction_id, ancien_statut, nouveau_statut, person_id, commentaire)
       VALUES (?,?,NULL,'EMISE',?,'Instruction émise')`,
      [crypto.randomUUID(), instruction_id, req.user.sub || null]
    );

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_instruction', instruction_id, { emetteur_institution_id, destinataire_institution_id, objet });
    res.status(201).json({ success: true, data: { instruction_id } });
  })
);

router.post('/instructions/:id/statut',
  validate({
    params: { id: { type: 'uuid', required: true } },
    body: {
      statut: { type: 'enum', values: ['EMISE', 'EN_COURS', 'EXECUTEE', 'EN_RETARD', 'ANNULEE'], required: true },
      commentaire: { type: 'string', maxLength: 1000 }
    }
  }),
  exigerPermissionRni('rni_instruction', 'UPDATE_STATUS'),
  wrap(async (req, res) => {
    const { id } = req.params;
    const { statut, commentaire } = req.body;

    const current = await db.get(`SELECT statut, emetteur_institution_id FROM instruction WHERE instruction_id = ?`, [id]);
    if (!current) {
      return sendError(res, 'NOT_FOUND', 'Instruction introuvable.');
    }

    const autorise = await verifierAutoriteInstitution(req, res, current.emetteur_institution_id, 'rni_instruction', 'UPDATE_STATUS');
    if (!autorise) return;

    await db.run(`UPDATE instruction SET statut=? WHERE instruction_id=?`, [statut, id]);
    await db.run(
      `INSERT INTO instruction_historique (historique_id, instruction_id, ancien_statut, nouveau_statut, person_id, commentaire)
       VALUES (?,?,?,?,?,?)`,
      [crypto.randomUUID(), id, current.statut, statut, req.user.sub || null, commentaire || null]
    );

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_instruction', id, { ancien_statut: current.statut, nouveau_statut: statut });
    res.json({ success: true, data: { ok: true } });
  })
);

// ════════════════════════════════════════════════
// 3. RAPPORTS D'EXÉCUTION
// ════════════════════════════════════════════════

router.post('/instructions/:id/rapports',
  validate({
    params: { id: { type: 'uuid', required: true } },
    body: {
      institution_id: { type: 'uuid', required: true },
      contenu: { type: 'string', required: true, maxLength: 10000 },
      taux_avancement: { type: 'integer', min: 0, max: 100 }
    }
  }),
  exigerPermissionRni('rni_rapport', 'CREATE'),
  wrap(async (req, res) => {
    const { id } = req.params;
    const { institution_id, contenu, taux_avancement } = req.body;

    const instr = await db.get(`SELECT statut FROM instruction WHERE instruction_id=?`, [id]);
    if (!instr) {
      return sendError(res, 'NOT_FOUND', 'Instruction introuvable.');
    }

    const autorise = await verifierAutoriteInstitution(req, res, institution_id, 'rni_rapport', 'CREATE');
    if (!autorise) return;

    const rapport_id = crypto.randomUUID();
    await db.run(
      `INSERT INTO execution_rapport (rapport_id, instruction_id, institution_id, redacteur_person_id, contenu, taux_avancement, statut)
       VALUES (?,?,?,?,?,?,'SOUMIS')`,
      [rapport_id, id, institution_id, req.user.sub || null, contenu, taux_avancement || 0]
    );

    if (instr.statut === 'EMISE') {
      await db.run(`UPDATE instruction SET statut='EN_COURS' WHERE instruction_id=?`, [id]);
      await db.run(
        `INSERT INTO instruction_historique (historique_id, instruction_id, ancien_statut, nouveau_statut, person_id, commentaire)
         VALUES (?,?,'EMISE','EN_COURS',?,'Premier rapport soumis')`,
        [crypto.randomUUID(), id, req.user.sub || null]
      );
    }

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_rapport', rapport_id, { instruction_id: id, institution_id });
    res.status(201).json({ success: true, data: { rapport_id } });
  })
);

router.get('/rapports/:id',
  validate({ params: { id: { type: 'uuid', required: true } } }),
  exigerPermissionRni('rni_rapport', 'READ'),
  wrap(async (req, res) => {
    const rapport = await db.get(`SELECT * FROM execution_rapport WHERE rapport_id=?`, [req.params.id]);
    if (!rapport) {
      return sendError(res, 'NOT_FOUND', 'Rapport introuvable.');
    }
    res.json({ success: true, data: rapport });
  })
);

// ════════════════════════════════════════════════
// 4. VÉRIFICATION
// ════════════════════════════════════════════════

router.post('/rapports/:id/verification',
  validate({
    params: { id: { type: 'uuid', required: true } },
    body: {
      decision: { type: 'enum', values: ['CONFORME', 'NON_CONFORME', 'A_COMPLETER'], required: true },
      commentaire: { type: 'string', maxLength: 2000 },
      verificateur_institution_id: { type: 'uuid', required: true }
    }
  }),
  exigerPermissionRni('rni_rapport', 'VERIFY'),
  wrap(async (req, res) => {
    const { id } = req.params;
    const { decision, commentaire, verificateur_institution_id } = req.body;

    const rap = await db.get(`SELECT instruction_id FROM execution_rapport WHERE rapport_id=?`, [id]);
    if (!rap) {
      return sendError(res, 'NOT_FOUND', 'Rapport introuvable.');
    }

    const autorise = await verifierAutoriteInstitution(req, res, verificateur_institution_id, 'rni_rapport', 'VERIFY');
    if (!autorise) return;

    const verification_id = crypto.randomUUID();
    await db.run(
      `INSERT INTO verification (verification_id, rapport_id, verificateur_person_id, verificateur_institution_id, decision, commentaire)
       VALUES (?,?,?,?,?,?)`,
      [verification_id, id, req.user.sub || null, verificateur_institution_id, decision, commentaire || null]
    );

    const nouveauStatutRapport = decision === 'CONFORME' ? 'VALIDE' : decision === 'A_COMPLETER' ? 'A_COMPLETER' : 'REJETE';
    await db.run(`UPDATE execution_rapport SET statut=? WHERE rapport_id=?`, [nouveauStatutRapport, id]);

    if (decision === 'CONFORME') {
      const instructionId = rap.instruction_id;
      const cur = await db.get(`SELECT statut FROM instruction WHERE instruction_id=?`, [instructionId]);
      await db.run(`UPDATE instruction SET statut='EXECUTEE' WHERE instruction_id=?`, [instructionId]);
      await db.run(
        `INSERT INTO instruction_historique (historique_id, instruction_id, ancien_statut, nouveau_statut, person_id, commentaire)
         VALUES (?,?,?,'EXECUTEE',?,'Rapport vérifié conforme')`,
        [crypto.randomUUID(), instructionId, cur ? cur.statut : null, req.user.sub || null]
      );
    }

    await audit(req.user.sub, 'ACTION_SUCCESS', 'rni_rapport', id, { decision, verificateur_institution_id });
    res.status(201).json({ success: true, data: { verification_id } });
  })
);

module.exports = router;

