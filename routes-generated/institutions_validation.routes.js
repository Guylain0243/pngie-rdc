// ============================================================================
// ROUTES - Workflow de validation pour les modifications d'institutions
// et d'unites organisationnelles.
// Principe : toute modification proposee passe par la table `validation`
// et n'est appliquee qu'apres decision APPROUVE d'un valideur habilite.
// ============================================================================

const express = require('express');
const crypto = require('crypto');
const db = require('../src/db');
const { enregistrerEvenement, historique } = require('../src/event-engine');
const { exigerPermission } = require('../src/security-engine');
const { declencherNotifications } = require('../src/notification-engine');
const router = express.Router();

const ENTITES_SUPPORTEES = {
  institution: { table: 'institution', pk: 'institution_id' },
  unite_organisationnelle: { table: 'unite_organisationnelle', pk: 'unite_id' }
};

// ----------------------------------------------------------------------------
// DEMANDE DE MODIFICATION
// Cree une entree en attente dans `validation` au lieu de modifier directement.
// Body attendu: { champs: { nom: '...', mission: '...', ... } }
// ----------------------------------------------------------------------------
function creerRouteDemande(entiteKey) {
  const { table, pk } = ENTITES_SUPPORTEES[entiteKey];

  router.post(`/${entiteKey}s/:id/demande-modification`, exigerPermission(entiteKey, 'UPDATE'), async (req, res) => {
    try {
      const champs = req.body && req.body.champs;
      if (!champs || typeof champs !== 'object' || Object.keys(champs).length === 0) {
        return res.status(400).json({ error: 'Aucun champ propose pour la modification.' });
      }

      const existant = await db.get(`SELECT * FROM ${table} WHERE ${pk} = ?`, [req.params.id]);
      if (!existant) {
        return res.status(404).json({ error: 'Entite introuvable.' });
      }

      const validationId = crypto.randomUUID();
      await db.run(
        `INSERT INTO validation (validation_id, entite, entite_ref_id, etape, commentaire, date_echeance, created_at)
         VALUES (?, ?, ?, 'EN_ATTENTE', ?, NOW() + INTERVAL '7 days', NOW())`,
        [validationId, entiteKey, req.params.id, JSON.stringify({ champsProposes: champs, demandePar: req.roleCode || null })]
      );

      await enregistrerEvenement('validation', validationId, 'DEMANDE_MODIFICATION', existant);
      await declencherNotifications('validation', validationId, 'DEMANDE_MODIFICATION', { entite: entiteKey, entiteRefId: req.params.id });

      res.status(201).json({
        message: 'Demande de modification soumise, en attente de validation.',
        validationId
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

creerRouteDemande('institution');
creerRouteDemande('unite_organisationnelle');

// ----------------------------------------------------------------------------
// LISTE DES VALIDATIONS EN ATTENTE
// ----------------------------------------------------------------------------
router.get('/validations', exigerPermission('validation', 'READ'), async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM validation WHERE etape = 'EN_ATTENTE' ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// DETAIL D'UNE VALIDATION
// ----------------------------------------------------------------------------
router.get('/validations/:id', exigerPermission('validation', 'READ'), async (req, res) => {
  try {
    const row = await db.get(`SELECT * FROM validation WHERE validation_id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Validation introuvable.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// DECISION SUR UNE VALIDATION (APPROUVE / REJETE)
// Si APPROUVE : applique reellement les champs proposes sur l'entite cible.
// Body attendu: { decision: 'APPROUVE' | 'REJETE', commentaire?: string }
// ----------------------------------------------------------------------------
router.post('/validations/:id/decision', exigerPermission('validation', 'UPDATE'), async (req, res) => {
  try {
    const { decision, commentaire } = req.body || {};
    if (!['APPROUVE', 'REJETE'].includes(decision)) {
      return res.status(400).json({ error: `Decision invalide, attendu 'APPROUVE' ou 'REJETE'.` });
    }

    const validationRow = await db.get(`SELECT * FROM validation WHERE validation_id = ?`, [req.params.id]);
    if (!validationRow) return res.status(404).json({ error: 'Validation introuvable.' });
    if (validationRow.etape !== 'EN_ATTENTE') {
      return res.status(409).json({ error: `Cette validation a deja ete traitee (etape actuelle: ${validationRow.etape}).` });
    }

    const config = ENTITES_SUPPORTEES[validationRow.entite];
    if (!config) {
      return res.status(400).json({ error: `Entite non prise en charge par ce workflow: ${validationRow.entite}` });
    }

    let payload = {};
    try {
      payload = JSON.parse(validationRow.commentaire || '{}');
    } catch {
      payload = {};
    }
    const champsProposes = payload.champsProposes || {};

    if (decision === 'APPROUVE' && Object.keys(champsProposes).length > 0) {
      const colonnes = Object.keys(champsProposes);
      const setClause = colonnes.map(c => `${c} = ?`).join(', ');
      const valeurs = colonnes.map(c => champsProposes[c]);
      await db.run(
        `UPDATE ${config.table} SET ${setClause} WHERE ${config.pk} = ?`,
        [...valeurs, validationRow.entite_ref_id]
      );
    }

    await db.run(
      `UPDATE validation
       SET etape = ?, decision = ?, valideur_id = ?, commentaire = ?, date_decision = NOW()
       WHERE validation_id = ?`,
      [
        decision === 'APPROUVE' ? 'APPROUVEE' : 'REJETEE',
        decision,
        req.user ? req.user.sub : null,
        commentaire || null,
        req.params.id
      ]
    );

    const entiteApresDecision = await db.get(
      `SELECT * FROM ${config.table} WHERE ${config.pk} = ?`,
      [validationRow.entite_ref_id]
    );

    await enregistrerEvenement(validationRow.entite, validationRow.entite_ref_id, `VALIDATION_${decision}`, entiteApresDecision);
    await declencherNotifications(validationRow.entite, validationRow.entite_ref_id, `VALIDATION_${decision}`, { validationId: req.params.id });

    res.json({
      message: decision === 'APPROUVE' ? 'Modification approuvee et appliquee.' : 'Modification rejetee.',
      entite: entiteApresDecision
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
