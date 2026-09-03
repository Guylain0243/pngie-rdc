// ============================================================
// ROUTEUR : rnso_affectation (donnée métier RNSO — affectation nominative)
// Table   : rnso_affectation
// Portée  : INSTITUTIONNELLE, mais PAS via colonne institution_id directe
//           (cette table n'en a pas). government-builder.js ne peut donc
//           pas générer cette route automatiquement : son scope 'INSTITUTION'
//           suppose une colonne institution_id sur la table cible, absente ici.
//
// Cloisonnement réel (confirmé par inspection de structure, FK non-nullables
// de bout en bout) :
//   rnso_affectation.poste_id (NOT NULL)
//     -> rnso_poste.structure_id (NOT NULL)
//       -> rnso_structure.institution_id (NOT NULL)
//         -> institution.institution_id
//
// rnso_hierarchie a été écartée du cloisonnement : aucune clé primaire,
// aucune contrainte FK (sortante ou entrante), toutes colonnes nullable,
// 0 ligne. C'est une table de cache/chemin (colonne "chemin" en ARRAY),
// pas une source de vérité contrainte. Ne jamais y adosser une décision
// de sécurité.
//
// Source de l'institution courante : la même que government-builder.js,
// à savoir requestContext.getContext().institutionId (src/request-context.js),
// pour ne pas introduire une deuxième façon de résoudre "l'institution de
// l'utilisateur connecté" dans le projet.
//
// Convention de permission : exigerPermission(table, 'READ' | 'WRITE'),
// alignée sur le gabarit ref_tribunal_paix (et non READ/CREATE/UPDATE/DELETE
// utilisé par les routes auto-générées — les deux conventions coexistent
// actuellement dans le projet, harmonisation à envisager séparément).
//
// HYPOTHÈSE À CONFIRMER : CHAMPS_OBLIGATOIRES = ['poste_id'] uniquement.
// date_debut a un DEFAULT CURRENT_DATE en base, donc non bloquant à la
// création. personne_id est nullable (poste vacant autorisé). Si une
// autre règle métier existe (ex. statut obligatoire), l'ajuster ci-dessous.
//
// Écrit manuellement en s'alignant sur routes-generated/ref_tribunal_paix.routes.js,
// PAS généré par government-builder.js (qui ne couvre pas le cas d'un
// cloisonnement par jointure).
// ============================================================

const express = require('express');
const db = require('../src/db');
const { verifierRegles } = require('../src/rule-engine');
const { enregistrerEvenement, historique } = require('../src/event-engine');
const { exigerPermission } = require('../src/security-engine');
const requestContext = require('../src/request-context');

const router = express.Router();

// Colonnes modifiables via l'API (hors clé primaire et horodatages gérés
// par la base).
const CHAMPS = [
    "poste_id",
    "personne_id",
    "date_debut",
    "date_fin",
    "statut",
];

const CHAMPS_OBLIGATOIRES = ["poste_id"];

function validerPayload(body) {
    const manquants = CHAMPS_OBLIGATOIRES.filter(
        c => body[c] === undefined || body[c] === null || body[c] === ''
    );
    return manquants;
}

// Résout l'institution de l'utilisateur authentifié, à partir du même
// contexte de requête que government-builder.js (posé par requireAuth).
function institutionCourante() {
    const ctx = requestContext.getContext();
    return ctx ? ctx.institutionId : null;
}

// Vérifie que le poste_id donné appartient bien à l'institution fournie.
// Retourne l'institution_id réelle du poste (ou null si le poste n'existe pas).
async function institutionDuPoste(posteId) {
    const row = await db.get(
        `SELECT s.institution_id
         FROM rnso_poste p
         JOIN rnso_structure s ON p.structure_id = s.structure_id
         WHERE p.poste_id = ?`,
        [posteId]
    );
    return row ? row.institution_id : null;
}

// LISTE — cloisonnée par institution via JOIN poste -> structure.
router.get('/rnso_affectation', exigerPermission('rnso_affectation', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const rows = await db.all(
            `SELECT a.*
             FROM rnso_affectation a
             JOIN rnso_poste p ON a.poste_id = p.poste_id
             JOIN rnso_structure s ON p.structure_id = s.structure_id
             WHERE s.institution_id = ?
             ORDER BY a.date_debut DESC`,
            [instId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DETAIL — cloisonné par institution via JOIN.
router.get('/rnso_affectation/:affectation_id', exigerPermission('rnso_affectation', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const row = await db.get(
            `SELECT a.*
             FROM rnso_affectation a
             JOIN rnso_poste p ON a.poste_id = p.poste_id
             JOIN rnso_structure s ON p.structure_id = s.structure_id
             WHERE a.affectation_id = ? AND s.institution_id = ?`,
            [req.params.affectation_id, instId]
        );
        if (!row) return res.status(404).json({ error: 'rnso_affectation introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATION — le poste_id fourni doit appartenir à l'institution courante.
router.post('/rnso_affectation', exigerPermission('rnso_affectation', 'WRITE'), async (req, res) => {
    const manquants = validerPayload(req.body);
    if (manquants.length > 0) {
        return res.status(400).json({ error: 'Champs obligatoires manquants', champs: manquants });
    }
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const instPoste = await institutionDuPoste(req.body.poste_id);
        if (!instPoste) {
            return res.status(400).json({ error: 'poste_id invalide : poste introuvable' });
        }
        if (instPoste !== instId) {
            return res.status(403).json({ error: 'Le poste indique n\'appartient pas a votre institution' });
        }

        const champsRenseignes = CHAMPS.filter(c => req.body[c] !== undefined);
        const colonnes = champsRenseignes;
        const valeurs = champsRenseignes.map(c => req.body[c]);
        const placeholders = colonnes.map(() => '?').join(', ');

        await db.run(
            `INSERT INTO rnso_affectation (${colonnes.join(', ')}) VALUES (${placeholders})`,
            valeurs
        );
        const row = await db.get(
            `SELECT * FROM rnso_affectation WHERE poste_id = ? ORDER BY affectation_id DESC LIMIT 1`,
            [req.body.poste_id]
        );
        await enregistrerEvenement('rnso_affectation', row.affectation_id, 'CREATION', null, row, req.user && req.user.sub);
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODIFICATION — reconfirme le cloisonnement sur l'existant, et si
// poste_id change, revérifie que le nouveau poste appartient toujours
// à l'institution courante.
router.put('/rnso_affectation/:affectation_id', exigerPermission('rnso_affectation', 'WRITE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const existant = await db.get(
            `SELECT a.*
             FROM rnso_affectation a
             JOIN rnso_poste p ON a.poste_id = p.poste_id
             JOIN rnso_structure s ON p.structure_id = s.structure_id
             WHERE a.affectation_id = ? AND s.institution_id = ?`,
            [req.params.affectation_id, instId]
        );
        if (!existant) return res.status(404).json({ error: 'rnso_affectation introuvable' });

        if (req.body.poste_id !== undefined && req.body.poste_id !== existant.poste_id) {
            const instNouveauPoste = await institutionDuPoste(req.body.poste_id);
            if (!instNouveauPoste) {
                return res.status(400).json({ error: 'poste_id invalide : poste introuvable' });
            }
            if (instNouveauPoste !== instId) {
                return res.status(403).json({ error: 'Le nouveau poste indique n\'appartient pas a votre institution' });
            }
        }

        const violations = await verifierRegles('rnso_affectation', 'AVANT_MODIFICATION', existant, req.body);
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
            `UPDATE rnso_affectation SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE affectation_id = ?`,
            [...valeurs, req.params.affectation_id]
        );
        const row = await db.get(`SELECT * FROM rnso_affectation WHERE affectation_id = ?`, [req.params.affectation_id]);
        await enregistrerEvenement('rnso_affectation', req.params.affectation_id, 'MODIFICATION', existant, row, req.user && req.user.sub);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SUPPRESSION — cloisonnée. DELETE physique conservé pour rester cohérent
// avec le gabarit ref_tribunal_paix ; à revoir si un statut ARCHIVE/SUPPRIME
// est préféré pour la traçabilité des affectations nominatives.
router.delete('/rnso_affectation/:affectation_id', exigerPermission('rnso_affectation', 'WRITE'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const existant = await db.get(
            `SELECT a.*
             FROM rnso_affectation a
             JOIN rnso_poste p ON a.poste_id = p.poste_id
             JOIN rnso_structure s ON p.structure_id = s.structure_id
             WHERE a.affectation_id = ? AND s.institution_id = ?`,
            [req.params.affectation_id, instId]
        );
        if (!existant) return res.status(404).json({ error: 'rnso_affectation introuvable' });

        await db.run(`DELETE FROM rnso_affectation WHERE affectation_id = ?`, [req.params.affectation_id]);
        await enregistrerEvenement('rnso_affectation', req.params.affectation_id, 'SUPPRESSION', existant, null, req.user && req.user.sub);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORIQUE — accès en lecture, cloisonné implicitement par le fait que
// l'affectation elle-même n'est consultable que si elle appartient à
// l'institution courante (vérifié ci-dessus pour DETAIL). Ici on ne
// revérifie pas car historique() s'appuie sur affectation_id déjà connu
// du demandeur ; à durcir si un accès direct par ID sans passage par
// LISTE/DETAIL est jugé risqué.
router.get('/rnso_affectation/:affectation_id/historique', exigerPermission('rnso_affectation', 'READ'), async (req, res) => {
    try {
        const instId = institutionCourante();
        if (!instId) return res.status(403).json({ error: 'Institution non resolue pour cet utilisateur' });

        const existant = await db.get(
            `SELECT a.affectation_id
             FROM rnso_affectation a
             JOIN rnso_poste p ON a.poste_id = p.poste_id
             JOIN rnso_structure s ON p.structure_id = s.structure_id
             WHERE a.affectation_id = ? AND s.institution_id = ?`,
            [req.params.affectation_id, instId]
        );
        if (!existant) return res.status(404).json({ error: 'rnso_affectation introuvable' });

        const evenements = await historique('rnso_affectation', req.params.affectation_id);
        res.json(evenements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
