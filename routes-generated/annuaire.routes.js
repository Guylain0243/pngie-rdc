// ============================================================================
// ROUTE - Annuaire des fonctionnaires (type Outlook)
// Liste les personnes actives avec leur poste, unite et institution.
// ============================================================================

const express = require('express');
const db = require('../src/db');
const { exigerPermission } = require('../src/security-engine');
const router = express.Router();

// ----------------------------------------------------------------------------
// LISTE / RECHERCHE
// Query params optionnels: q (recherche nom/prenom/email), institution_id, unite_id
// ----------------------------------------------------------------------------
router.get('/annuaire', exigerPermission('personne', 'READ'), async (req, res) => {
  try {
    const { q, institution_id, unite_id } = req.query;

    let sql = `
      SELECT
        p.personne_id,
        p.matricule,
        p.nom,
        p.prenom,
        p.email,
        p.telephone,
        p.photo_url,
        po.intitule AS poste_intitule,
        po.categorie AS poste_categorie,
        u.unite_id,
        u.nom AS unite_nom,
        i.institution_id,
        i.nom AS institution_nom,
        i.code AS institution_code
      FROM personne p
      JOIN affectation a ON a.personne_id = p.personne_id
      JOIN poste po ON po.poste_id = a.poste_id
      JOIN unite_organisationnelle u ON u.unite_id = po.unite_id
      JOIN institution i ON i.institution_id = u.institution_id
      WHERE p.statut = 'ACTIF'
        AND (a.date_fin IS NULL OR a.date_fin > NOW())
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.nom ILIKE $${params.length} OR p.prenom ILIKE $${params.length} OR p.email ILIKE $${params.length})`;
    }
    if (institution_id) {
      params.push(institution_id);
      sql += ` AND i.institution_id = $${params.length}`;
    }
    if (unite_id) {
      params.push(unite_id);
      sql += ` AND u.unite_id = $${params.length}`;
    }

    sql += ` ORDER BY i.nom, u.nom, p.nom, p.prenom`;

    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// FICHE DETAILLEE D'UN FONCTIONNAIRE
// ----------------------------------------------------------------------------
router.get('/annuaire/:id', exigerPermission('personne', 'READ'), async (req, res) => {
  try {
    const row = await db.get(
      `SELECT
        p.personne_id, p.matricule, p.nom, p.prenom, p.date_naissance,
        p.lieu_naissance, p.sexe, p.email, p.telephone, p.photo_url, p.statut,
        po.poste_id, po.intitule AS poste_intitule, po.categorie AS poste_categorie,
        po.missions AS poste_missions, po.attributions AS poste_attributions,
        u.unite_id, u.nom AS unite_nom,
        i.institution_id, i.nom AS institution_nom, i.code AS institution_code
      FROM personne p
      JOIN affectation a ON a.personne_id = p.personne_id AND (a.date_fin IS NULL OR a.date_fin > NOW())
      JOIN poste po ON po.poste_id = a.poste_id
      JOIN unite_organisationnelle u ON u.unite_id = po.unite_id
      JOIN institution i ON i.institution_id = u.institution_id
      WHERE p.personne_id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Fonctionnaire introuvable ou sans affectation active.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
