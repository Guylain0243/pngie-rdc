// =====================================================================
// ROUTEUR : ref_tribunal_paix (référentiel national Justice)
// Table : ref_tribunal_paix
// Portée : NATIONALE (voir docs/GOUVERNANCE_REFERENTIELS_VS_METIER.md)
//   - Lecture : ouverte à toutes les institutions authentifiées
//   - Écriture : restreinte par permission dédiée (voir exigerPermission)
// Écrit manuellement en s'alignant sur les conventions de
// routes-generated/certificat_pki.routes.js, PAS généré par
// government-builder.js (qui applique par défaut le scoping institution_id,
// non pertinent ici).
// =====================================================================

const express = require('express');
const db = require('../src/db');
const { verifierRegles } = require('../src/rule-engine');
const { enregistrerEvenement, historique } = require('../src/event-engine');
const { exigerPermission } = require('../src/security-engine');

const router = express.Router();

// Colonnes modifiables via l'API (hors clé primaire "ini" et horodatages
// gérés par la base).
const CHAMPS = [
    "code_institution",
    "institution_id",
    "denomination_officielle",
    "ressort_territorial",
    "province",
    "ville_siege",
    "tgi_rattachement",
    "cour_appel_rattachement",
    "president_nom",
    "procureur_republique_nom",
    "greffier_chef_nom",
    "date_creation",
    "reference_acte_juridique",
    "statut",
];

const CHAMPS_OBLIGATOIRES = ["denomination_officielle"];

function validerPayload(body) {
    const manquants = CHAMPS_OBLIGATOIRES.filter(
        c => body[c] === undefined || body[c] === null || body[c] === ''
    );
    return manquants;
}

// LISTE — lecture ouverte à toute institution authentifiée, pas de filtre
// institution_id (référentiel national).
router.get('/ref_tribunal_paix', exigerPermission('ref_tribunal_paix', 'READ'), async (req, res) => {
    try {
        const rows = await db.all(`SELECT * FROM ref_tribunal_paix ORDER BY denomination_officielle ASC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DETAIL
router.get('/ref_tribunal_paix/:ini', exigerPermission('ref_tribunal_paix', 'READ'), async (req, res) => {
    try {
        const row = await db.get(`SELECT * FROM ref_tribunal_paix WHERE ini = ?`, [req.params.ini]);
        if (!row) return res.status(404).json({ error: 'ref_tribunal_paix introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATION
// ⚠️ HYPOTHÈSE À CONFIRMER : "ini" (clé primaire, character varying,
// NOT NULL, sans valeur par défaut en base) est ici traité comme un code
// métier fourni par l'appelant (ex. "TP-KIN-GOMBE"), cohérent avec la
// nature référentielle de la table. Si vous préférez une génération
// automatique, remplacer le bloc de validation ci-dessous par une
// génération (UUID ou séquence) côté serveur.
router.post('/ref_tribunal_paix', exigerPermission('ref_tribunal_paix', 'WRITE'), async (req, res) => {
    if (!req.body.ini) {
        return res.status(400).json({ error: 'Champ obligatoire manquant', champs: ['ini'] });
    }
    const manquants = validerPayload(req.body);
    if (manquants.length > 0) {
        return res.status(400).json({ error: 'Champs obligatoires manquants', champs: manquants });
    }
    try {
        const existant = await db.get(`SELECT ini FROM ref_tribunal_paix WHERE ini = ?`, [req.body.ini]);
        if (existant) {
            return res.status(409).json({ error: 'Ce code (ini) existe déjà' });
        }

        const champsRenseignes = CHAMPS.filter(c => req.body[c] !== undefined);
        const colonnes = ['ini', ...champsRenseignes];
        const valeurs = [req.body.ini, ...champsRenseignes.map(c => req.body[c])];
        const placeholders = colonnes.map(() => '?').join(', ');

        await db.run(
            `INSERT INTO ref_tribunal_paix (${colonnes.join(', ')}) VALUES (${placeholders})`,
            valeurs
        );
        const row = await db.get(`SELECT * FROM ref_tribunal_paix WHERE ini = ?`, [req.body.ini]);
        await enregistrerEvenement('ref_tribunal_paix', req.body.ini, 'CREATION', null, row, req.user && req.user.sub);
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODIFICATION
router.put('/ref_tribunal_paix/:ini', exigerPermission('ref_tribunal_paix', 'WRITE'), async (req, res) => {
    try {
        const existant = await db.get(`SELECT * FROM ref_tribunal_paix WHERE ini = ?`, [req.params.ini]);
        if (!existant) return res.status(404).json({ error: 'ref_tribunal_paix introuvable' });

        const violations = await verifierRegles('ref_tribunal_paix', 'AVANT_MODIFICATION', existant, req.body);
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
            `UPDATE ref_tribunal_paix SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ini = ?`,
            [...valeurs, req.params.ini]
        );
        const row = await db.get(`SELECT * FROM ref_tribunal_paix WHERE ini = ?`, [req.params.ini]);
        await enregistrerEvenement('ref_tribunal_paix', req.params.ini, 'MODIFICATION', existant, row, req.user && req.user.sub);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SUPPRESSION
// ⚠️ À CONFIRMER : pour un référentiel national, une suppression physique
// est rarement souhaitable (perte de traçabilité historique pour des
// dossiers judiciaires liés). À envisager : passage à un statut
// "ARCHIVE"/"SUPPRIME" plutôt qu'un vrai DELETE. Laissé en DELETE physique
// ici pour rester cohérent avec le gabarit certificat_pki, à revoir.
router.delete('/ref_tribunal_paix/:ini', exigerPermission('ref_tribunal_paix', 'WRITE'), async (req, res) => {
    try {
        const existant = await db.get(`SELECT * FROM ref_tribunal_paix WHERE ini = ?`, [req.params.ini]);
        if (!existant) return res.status(404).json({ error: 'ref_tribunal_paix introuvable' });
        await db.run(`DELETE FROM ref_tribunal_paix WHERE ini = ?`, [req.params.ini]);
        await enregistrerEvenement('ref_tribunal_paix', req.params.ini, 'SUPPRESSION', existant, null, req.user && req.user.sub);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORIQUE
router.get('/ref_tribunal_paix/:ini/historique', exigerPermission('ref_tribunal_paix', 'READ'), async (req, res) => {
    try {
        const evenements = await historique('ref_tribunal_paix', req.params.ini);
        res.json(evenements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;