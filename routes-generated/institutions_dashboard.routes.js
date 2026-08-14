const express = require("express");
const db = require("../src/db");
const requestContext = require("../src/request-context");
const router = express.Router();

// Verifie que l'utilisateur a le droit de consulter l'institution demandee dans l'URL.
// Bloque toute fuite inter-institutions sur les routes /institutions/:id/*.
function verifierAccesInstitution(req, res) {
  const ctx = requestContext.getContext();
  if (!ctx) {
    res.status(403).json({ error: "Contexte utilisateur non resolu." });
    return false;
  }
  if (ctx.lectureNationale) return true;
  if (ctx.institutionId && ctx.institutionId === req.params.id) return true;
  res.status(403).json({ error: "Acces refuse a cette institution." });
  return false;
}

// LISTE DE TOUTES LES INSTITUTIONS, GROUPEES PAR TYPE
router.get("/institutions/liste", async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT institution_id, code, nom, type_institution, institution_parent_id
      FROM institution
      WHERE statut = ?
      ORDER BY type_institution, nom
    `, ["ACTIF"]);

    const groupes = {};
    for (const r of rows) {
      if (!groupes[r.type_institution]) groupes[r.type_institution] = [];
      groupes[r.type_institution].push({
        institution_id: r.institution_id, code: r.code, nom: r.nom,
        institution_parent_id: r.institution_parent_id
      });
    }

    res.json(groupes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TABLEAU DE BORD GENERIQUE D'UNE INSTITUTION
router.get("/institutions/:id/dashboard", async (req, res) => {
  if (!verifierAccesInstitution(req, res)) return;
  try {
    const inst = await db.get(`
      SELECT institution_id, code, nom, type_institution, description, adresse, email, telephone
      FROM institution WHERE institution_id = ?
    `, [req.params.id]);

    if (!inst) return res.status(404).json({ error: "Institution introuvable" });

    const unites = await db.all(`
      SELECT unite_id, nom, type_unite, niveau_hierarchique, unite_parent_id
      FROM unite_organisationnelle
      WHERE institution_id = ? AND statut = ?
      ORDER BY niveau_hierarchique, nom
    `, [req.params.id, "ACTIF"]);

    const postes = await db.all(`
      SELECT p.poste_id, p.intitule, p.categorie, p.niveau_hierarchique, u.nom AS unite_nom,
             a.affectation_id, pe.personne_id, pe.nom AS titulaire_nom, pe.prenom AS titulaire_prenom
      FROM poste p
      JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
      LEFT JOIN affectation a ON a.poste_id = p.poste_id AND a.statut = ? AND a.date_fin IS NULL
      LEFT JOIN personne pe ON pe.personne_id = a.personne_id
      WHERE u.institution_id = ? AND p.statut = ?
      ORDER BY p.niveau_hierarchique, p.intitule
    `, ["ACTIF", req.params.id, "ACTIF"]);

    const documents = await db.all(`
      SELECT document_id, titre, reference, statut, confidentialite, created_at
      FROM document WHERE institution_id = ?
      ORDER BY created_at DESC LIMIT 20
    `, [req.params.id]);

    const nbPostesPourvus = postes.filter(p => p.personne_id).length;

    res.json({
      institution: inst,
      stats: {
        nb_unites: unites.length,
        nb_postes: postes.length,
        nb_postes_pourvus: nbPostesPourvus,
        nb_documents: documents.length
      },
      unites,
      postes: postes.map(p => ({
        poste_id: p.poste_id, intitule: p.intitule, categorie: p.categorie,
        niveau_hierarchique: p.niveau_hierarchique, unite: p.unite_nom,
        titulaire: p.personne_id ? { personne_id: p.personne_id, nom: p.titulaire_nom, prenom: p.titulaire_prenom } : null
      })),
      documents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;