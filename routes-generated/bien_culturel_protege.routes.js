// =====================================================================
// ROUTEUR GENERE AUTOMATIQUEMENT par government-builder.js
// Entite : undefined  (table : bien_culturel_protege)
// Scope  : INSTITUTION
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

const CHAMPS = ["designation","type_bien","localisation","statut"];
const CHAMPS_OBLIGATOIRES = ["designation","type_bien"];

function validerPayload(body) {
    const manquants = CHAMPS_OBLIGATOIRES.filter(c => body[c] === undefined || body[c] === null || body[c] === '');
    return manquants;
}

function institutionCourante() {
    const ctx = requestContext.getContext();
    return ctx ? ctx.institutionId : null;
}

// LISTE
router.get('/bien_culturel_proteges', exigerPermission('bien_culturel_protege', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const rows = await db.all(`SELECT * FROM bien_culturel_protege WHERE institution_id = ? ORDER BY created_at DESC`, [instId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DETAIL
router.get('/bien_culturel_proteges/:id', exigerPermission('bien_culturel_protege', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const row = await db.get(`SELECT * FROM bien_culturel_protege WHERE bien_culturel_protege_id = ? AND institution_id = ?`, [req.params.id, instId]);
        if (!row) return res.status(404).json({ error: 'undefined introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATION
router.post('/bien_culturel_proteges', exigerPermission('bien_culturel_protege', 'CREATE'), async (req, res) => {
    const manquants = validerPayload(req.body);
    if (manquants.length > 0) {
        return res.status(400).json({ error: 'Champs obligatoires manquants', champs: manquants });
    }
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const id = crypto.randomUUID();
        const champsRenseignes = CHAMPS.filter(c => req.body[c] !== undefined);
        const colonnes = ['bien_culturel_protege_id', ...champsRenseignes, 'institution_id'];
        const valeurs = [id, ...champsRenseignes.map(c => req.body[c]), instId];
        const placeholders = colonnes.map(() => '?').join(', ');
        await db.run(
            `INSERT INTO bien_culturel_protege (${colonnes.join(', ')}) VALUES (${placeholders})`,
            valeurs
        );
        const row = await db.get(`SELECT * FROM bien_culturel_protege WHERE bien_culturel_protege_id = ?`, [id]);
        await enregistrerEvenement('bien_culturel_protege', id, 'CREATION', null, row, req.user && req.user.sub);
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODIFICATION
router.put('/bien_culturel_proteges/:id', exigerPermission('bien_culturel_protege', 'UPDATE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT * FROM bien_culturel_protege WHERE bien_culturel_protege_id = ? AND institution_id = ?`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });

        // Verification des regles metier (meta_rule) avant toute modification
        const violations = await verifierRegles('bien_culturel_protege', 'AVANT_MODIFICATION', existant, req.body);
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
            `UPDATE bien_culturel_protege SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE bien_culturel_protege_id = ? AND institution_id = ?`,
            [...valeurs, req.params.id, instId]
        );
        const row = await db.get(`SELECT * FROM bien_culturel_protege WHERE bien_culturel_protege_id = ?`, [req.params.id]);
        await enregistrerEvenement('bien_culturel_protege', req.params.id, 'MODIFICATION', existant, row, req.user && req.user.sub);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SUPPRESSION
router.delete('/bien_culturel_proteges/:id', exigerPermission('bien_culturel_protege', 'DELETE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT * FROM bien_culturel_protege WHERE bien_culturel_protege_id = ? AND institution_id = ?`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });
        await db.run(`DELETE FROM bien_culturel_protege WHERE bien_culturel_protege_id = ? AND institution_id = ?`, [req.params.id, instId]);
        await enregistrerEvenement('bien_culturel_protege', req.params.id, 'SUPPRESSION', existant, null, req.user && req.user.sub);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORIQUE (genere automatiquement par le moteur d'evenements)
router.get('/bien_culturel_proteges/:id/historique', exigerPermission('bien_culturel_protege', 'READ'), async (req, res) => {
    try {
        const evenements = await historique('bien_culturel_protege', req.params.id);
        res.json(evenements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
