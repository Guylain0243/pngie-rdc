// =====================================================================
// ROUTEUR GENERE AUTOMATIQUEMENT par government-builder.js
// Entite : projet_recherche  (table : projet_recherche)
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

const CHAMPS = ["institution_porteuse","domaine","statut"];
const CHAMPS_OBLIGATOIRES = ["institution_porteuse","domaine"];

function validerPayload(body) {
    const manquants = CHAMPS_OBLIGATOIRES.filter(c => body[c] === undefined || body[c] === null || body[c] === '');
    return manquants;
}

function institutionCourante() {
    const ctx = requestContext.getContext();
    return ctx ? ctx.institutionId : null;
}

// LISTE
router.get('/projet_recherches', exigerPermission('projet_recherche', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const rows = await db.all(`SELECT projet_recherche.* FROM projet_recherche WHERE EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'projet_recherche' AND entity_id = projet_recherche.projet_recherche_id::uuid AND institution_id = ?::uuid) ORDER BY created_at DESC`, [instId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DETAIL
router.get('/projet_recherches/:id', exigerPermission('projet_recherche', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const row = await db.get(`SELECT projet_recherche.* FROM projet_recherche WHERE projet_recherche_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'projet_recherche' AND entity_id = projet_recherche.projet_recherche_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!row) return res.status(404).json({ error: 'undefined introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATION
router.post('/projet_recherches', exigerPermission('projet_recherche', 'CREATE'), async (req, res) => {
    const manquants = validerPayload(req.body);
    if (manquants.length > 0) {
        return res.status(400).json({ error: 'Champs obligatoires manquants', champs: manquants });
    }
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const id = crypto.randomUUID();
        const champsRenseignes = CHAMPS.filter(c => req.body[c] !== undefined);
        const colonnes = ['projet_recherche_id', ...champsRenseignes];
        const valeurs = [id, ...champsRenseignes.map(c => req.body[c])];
        const placeholders = colonnes.map(() => '?').join(', ');
        await db.run(
            `INSERT INTO projet_recherche (${colonnes.join(', ')}) VALUES (${placeholders})`,
            valeurs
        );
        await db.run(
            `INSERT INTO multi_institution_participant (participant_id, entity_type, entity_id, institution_id, role_participant, date_ajout) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [crypto.randomUUID(), 'projet_recherche', id, instId, 'PORTEUR']
        );
        const row = await db.get(`SELECT * FROM projet_recherche WHERE projet_recherche_id = ?`, [id]);
        await enregistrerEvenement('projet_recherche', id, 'CREATION', null, row, req.user && req.user.sub);
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODIFICATION
router.put('/projet_recherches/:id', exigerPermission('projet_recherche', 'UPDATE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT projet_recherche.* FROM projet_recherche WHERE projet_recherche_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'projet_recherche' AND entity_id = projet_recherche.projet_recherche_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });

        // Verification des regles metier (meta_rule) avant toute modification
        const violations = await verifierRegles('projet_recherche', 'AVANT_MODIFICATION', existant, req.body);
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
            `UPDATE projet_recherche SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE projet_recherche_id = ?`,
            [...valeurs, req.params.id]
        );
        const row = await db.get(`SELECT * FROM projet_recherche WHERE projet_recherche_id = ?`, [req.params.id]);
        await enregistrerEvenement('projet_recherche', req.params.id, 'MODIFICATION', existant, row, req.user && req.user.sub);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SUPPRESSION
router.delete('/projet_recherches/:id', exigerPermission('projet_recherche', 'DELETE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });
        const existant = await db.get(`SELECT projet_recherche.* FROM projet_recherche WHERE projet_recherche_id = ? AND EXISTS (SELECT 1 FROM multi_institution_participant WHERE entity_type = 'projet_recherche' AND entity_id = projet_recherche.projet_recherche_id::uuid AND institution_id = ?::uuid)`, [req.params.id, instId]);
        if (!existant) return res.status(404).json({ error: 'undefined introuvable' });
        await db.run(`DELETE FROM projet_recherche WHERE projet_recherche_id = ?`, [req.params.id]);
        await db.run(`DELETE FROM multi_institution_participant WHERE entity_type = ? AND entity_id = ?::uuid`, ['projet_recherche', req.params.id]);
        await enregistrerEvenement('projet_recherche', req.params.id, 'SUPPRESSION', existant, null, req.user && req.user.sub);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORIQUE (genere automatiquement par le moteur d'evenements)
router.get('/projet_recherches/:id/historique', exigerPermission('projet_recherche', 'READ'), async (req, res) => {
    try {
        const evenements = await historique('projet_recherche', req.params.id);
        res.json(evenements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
