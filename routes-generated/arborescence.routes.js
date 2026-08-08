// ==============================================================
// ROUTEUR - Consultation de l'arborescence globale unique
// A placer dans : routes-generated/arborescence.routes.js
// ==============================================================

const express = require('express');
const db = require('../src/db');
const router = express.Router();

// Vue complète (tous les noeuds, à plat)
router.get('/arborescence', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM referentiel_arborescence ORDER BY niveau, code');
        res.json({ total: rows.length, noeuds: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Racines (niveau 1 = les 10 Livres)
router.get('/arborescence/racines', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM referentiel_arborescence WHERE niveau = 1 ORDER BY code');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Détail d'un noeud
router.get('/arborescence/:code', async (req, res) => {
    try {
        const row = await db.get('SELECT * FROM referentiel_arborescence WHERE code = ?', [req.params.code]);
        if (!row) return res.status(404).json({ error: 'Noeud introuvable' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enfants directs d'un noeud
router.get('/arborescence/:code/enfants', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM referentiel_arborescence WHERE parent_code = ? ORDER BY code', [req.params.code]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
