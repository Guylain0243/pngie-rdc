// ============================================================
// Routes Express - Referentiel National des Institutions
// A integrer dans src/server.js (voir 05-INSTRUCTIONS.md)
// ============================================================

const express = require('express');
const crypto = require('crypto');

function creerRoutesInstitutions(db) {
    const router = express.Router();

    function verifierMotDePasse(motDePasse, hashStocke, salt) {
        const hashCalcule = crypto.scryptSync(motDePasse, salt, 64).toString('hex');
        const bufCalcule = Buffer.from(hashCalcule);
        const bufStocke = Buffer.from(hashStocke);
        return bufCalcule.length === bufStocke.length &&
               crypto.timingSafeEqual(bufCalcule, bufStocke);
    }

    // GET /api/institutions -> liste plate de toutes les institutions
    router.get('/institutions', (req, res) => {
        const rows = db.prepare(`
            SELECT id, nom, sigle, type, parent_id, ministere_racine_id, mission, statut
            FROM institutions
            ORDER BY ministere_racine_id, parent_id, nom
        `).all();
        res.json(rows);
    });

    // GET /api/institutions/arbre -> hierarchie imbriquee (arbre complet)
    router.get('/institutions/arbre', (req, res) => {
        const rows = db.prepare(`
            SELECT id, nom, sigle, type, parent_id, mission, statut
            FROM institutions
            ORDER BY nom
        `).all();

        const parId = new Map(rows.map(r => [r.id, { ...r, enfants: [] }]));
        const racines = [];

        for (const row of parId.values()) {
            if (row.parent_id && parId.has(row.parent_id)) {
                parId.get(row.parent_id).enfants.push(row);
            } else {
                racines.push(row);
            }
        }
        res.json(racines);
    });

    // GET /api/institutions/:id/organismes -> organismes sous tutelle d'un ministere
    router.get('/institutions/:id/organismes', (req, res) => {
        const rows = db.prepare(`
            SELECT id, nom, sigle, type, mission, statut
            FROM institutions
            WHERE ministere_racine_id = ? AND id != ?
            ORDER BY type, nom
        `).all(req.params.id, req.params.id);
        res.json(rows);
    });

    // POST /api/institutions -> creer un nouvel organisme
    router.post('/institutions', (req, res) => {
        const { nom, sigle, type, parent_id, mission } = req.body;
        if (!nom || !type) {
            return res.status(400).json({ erreur: 'nom et type sont obligatoires' });
        }

        let ministereRacineId = null;
        if (parent_id) {
            const parent = db.prepare('SELECT ministere_racine_id, type FROM institutions WHERE id = ?').get(parent_id);
            if (!parent) {
                return res.status(400).json({ erreur: 'parent_id invalide' });
            }
            ministereRacineId = parent.type === 'ministere' ? parent_id : parent.ministere_racine_id;
        }

        const info = db.prepare(`
            INSERT INTO institutions (nom, sigle, type, parent_id, ministere_racine_id, mission)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(nom, sigle || null, type, parent_id || null, ministereRacineId, mission || null);

        if (type === 'ministere') {
            db.prepare('UPDATE institutions SET ministere_racine_id = ? WHERE id = ?').run(info.lastInsertRowid, info.lastInsertRowid);
        }

        res.status(201).json({ id: info.lastInsertRowid });
    });

    // POST /api/institutions/login -> connexion d'un compte organisme
    router.post('/institutions/login', (req, res) => {
        const { identifiant, mot_de_passe } = req.body;
        if (!identifiant || !mot_de_passe) {
            return res.status(400).json({ erreur: 'identifiant et mot_de_passe requis' });
        }

        const compte = db.prepare(`
            SELECT c.*, i.nom AS institution_nom, i.type AS institution_type
            FROM comptes_institution c
            JOIN institutions i ON i.id = c.institution_id
            WHERE c.identifiant = ? AND c.actif = 1
        `).get(identifiant);

        if (!compte || !verifierMotDePasse(mot_de_passe, compte.mot_de_passe_hash, compte.salt)) {
            return res.status(401).json({ erreur: 'Identifiants invalides' });
        }

        db.prepare('UPDATE comptes_institution SET derniere_connexion = datetime(\'now\') WHERE id = ?').run(compte.id);

        res.json({
            institution_id: compte.institution_id,
            institution_nom: compte.institution_nom,
            institution_type: compte.institution_type,
            role: compte.role
        });
    });

    return router;
}

module.exports = creerRoutesInstitutions;
