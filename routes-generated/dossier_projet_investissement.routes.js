// =====================================================================
// ROUTEUR GENERE AUTOMATIQUEMENT par government-builder.js
// Entite : dossier_projet_investissement  (table : dossier_projet_investissement)
// Scope  : MULTI_INSTITUTION
// NE PAS MODIFIER A LA MAIN - regenerer via government-builder.js
// si les metadonnees changent.
// =====================================================================

const express = require('express');
const crypto = require('crypto');
const db = require('../src/db');
const { verifierRegles } = require('../src/rule-engine');
const { enregistrerEvenement, historique } = require('../src/event-engine');
const { exigerPermission } = require('../src/security-engine');
const requestContext = require('../src/request-context');

const router = express.Router();

const CHAMPS = ["intitule","institution_porteuse","budget_previsionnel","statut"];
const CHAMPS_OBLIGATOIRES = ["intitule","institution_porteuse"];

function validerPayload(body) {
    const manquants = CHAMPS_OBLIGATOIRES.filter(c => body[c] === undefined || body[c] === null || body[c] === '');
    return manquants;
}

function institutionCourante() {
    const ctx = requestContext.getContext();
    return ctx ? ctx.institutionId : null;
}

// LISTE
router.get('/dossier_projet_investissements', exigerPermission('dossier_projet_investissement', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const rows = await db.all(`SELECT dossier_projet_investissement.* FROM dossier_projet_investissement WHERE EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'dossier_projet_investissement' AND entity_id = dossier_projet_investissement.dossier_projet_investissement_id::uuid AND institution_id = ?::uuid) ORDER BY created_at DESC`, [instId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DETAIL
router.get('/dossier_projet_investissements/:id', exigerPermission('dossier_projet_investissement', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const row = await db.get(`SELECT dossier_projet_investissement.* FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'dossier_projet_investissement' AND entity_id = dossier_projet_investissement.dossier_projet_investissement_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!row) return res.status(404).json({ error: 'undefined introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATION
router.post('/dossier_projet_investissements', exigerPermission('dossier_projet_investissement', 'CREATE'), async (req, res) => {
    const manquants = validerPayload(req.body);
    if (manquants.length > 0) {
        return res.status(400).json({ error: 'Champs obligatoires manquants', champs: manquants });
    }
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const id = crypto.randomUUID();
        const champsRenseignes = CHAMPS.filter(c => req.body[c] !== undefined);
        const colonnes = ['dossier_projet_investissement_id', ...champsRenseignes];
        const valeurs = [id, ...champsRenseignes.map(c => req.body[c])];
        const placeholders = colonnes.map(() => '?').join(', ');
        await db.run(
            `INSERT INTO dossier_projet_investissement (${colonnes.join(', ')}) VALUES (${placeholders})`,
            valeurs
        );
        await db.run(
            `INSERT INTO multi_institution_participant (participant_id, entity_type, entity_id, institution_id, role_participant, date_ajout) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [crypto.randomUUID(), 'dossier_projet_investissement', id, instId, 'PORTEUR']
        );
        const row = await db.get(`SELECT * FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ?`, [id]);
        await enregistrerEvenement('dossier_projet_investissement', id, 'CREATION', null, row, req.user && req.user.sub);
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODIFICATION
router.put('/dossier_projet_investissements/:id', exigerPermission('dossier_projet_investissement', 'UPDATE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT dossier_projet_investissement.* FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'dossier_projet_investissement' AND entity_id = dossier_projet_investissement.dossier_projet_investissement_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });

        // Verification des regles metier (meta_rule) avant toute modification
        const violations = await verifierRegles('dossier_projet_investissement', 'AVANT_MODIFICATION', existant, req.body);
        if (violations.length > 0) {
            return res.status(409).json({ error: 'Regle(s) metier violee(s)', violations });
        }

        const champsAModifier = CHAMPS.filter(c => req.body[c] !== undefined);
        if (champsAModifier.length === 0) {
            return res.status(400).json({ error: 'Aucun champ a modifier' });
        }
        const setClause = champsAModifier.map(c => `${c} = ?`).join(', ');
        const valeurs = champsAModifier.map(c => req.body[c]);
        await db.run(
            `UPDATE dossier_projet_investissement SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE dossier_projet_investissement_id = ?`,
            [...valeurs, req.params.id]
        );
        const row = await db.get(`SELECT * FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ?`, [req.params.id]);
        await enregistrerEvenement('dossier_projet_investissement', req.params.id, 'MODIFICATION', existant, row, req.user && req.user.sub);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SUPPRESSION
router.delete('/dossier_projet_investissements/:id', exigerPermission('dossier_projet_investissement', 'DELETE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT dossier_projet_investissement.* FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'dossier_projet_investissement' AND entity_id = dossier_projet_investissement.dossier_projet_investissement_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });
        await db.run(`DELETE FROM dossier_projet_investissement WHERE dossier_projet_investissement_id = ?`, [req.params.id]);
        await db.run(`DELETE FROM multi_institution_participant WHERE entity_type = ? AND entity_id = ?::uuid`, ['dossier_projet_investissement', req.params.id]);
        await enregistrerEvenement('dossier_projet_investissement', req.params.id, 'SUPPRESSION', existant, null, req.user && req.user.sub);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORIQUE (genere automatiquement par le moteur d'evenements)
router.get('/dossier_projet_investissements/:id/historique', exigerPermission('dossier_projet_investissement', 'READ'), async (req, res) => {
    try {
        const evenements = await historique('dossier_projet_investissement', req.params.id);
        res.json(evenements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
