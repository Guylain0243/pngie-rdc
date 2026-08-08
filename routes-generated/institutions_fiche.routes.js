const express = require("express");
const db = require("../src/db");
const router = express.Router();

// FICHE COMPLETE D'UNE INSTITUTION : organigramme (unites + postes) + relations
router.get("/institutions/:id/fiche-complete", async (req, res) => {
  try {
    const institutionId = req.params.id;

    const institution = await db.get(
      `SELECT institution_id, code, nom, sigle, type_institution, institution_parent_id,
              niveau_hierarchique, description, adresse, telephone, email, site_web, statut
       FROM institution WHERE institution_id = ?`,
      [institutionId]
    );

    if (!institution) {
      return res.status(404).json({ error: "Institution introuvable" });
    }

    const unites = await db.all(
      `SELECT unite_id, unite_parent_id, code, nom, type_unite, niveau_hierarchique, mission, statut
       FROM unite_organisationnelle
       WHERE institution_id = ? AND statut = ?
       ORDER BY niveau_hierarchique, nom`,
      [institutionId, "ACTIF"]
    );

    const postes = await db.all(
      `SELECT p.poste_id, p.unite_id, p.code, p.intitule, p.poste_hierarchique_id,
              p.niveau_hierarchique, p.categorie, p.missions, p.attributions,
              p.responsabilites, p.competences_requises, p.nombre_postes_autorises, p.statut
       FROM poste p
       JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
       WHERE u.institution_id = ? AND p.statut = ?
       ORDER BY p.niveau_hierarchique, p.intitule`,
      [institutionId, "ACTIF"]
    );

    // Regroupe les postes par unite
    const postesParUnite = {};
    for (const p of postes) {
      if (!postesParUnite[p.unite_id]) postesParUnite[p.unite_id] = [];
      postesParUnite[p.unite_id].push({
        poste_id: p.poste_id,
        code: p.code,
        intitule: p.intitule,
        poste_hierarchique_id: p.poste_hierarchique_id,
        niveau_hierarchique: p.niveau_hierarchique,
        categorie: p.categorie,
        missions: p.missions,
        attributions: p.attributions,
        responsabilites: p.responsabilites,
        competences_requises: p.competences_requises,
        nombre_postes_autorises: p.nombre_postes_autorises
      });
    }

    // Construit l'arbre des unites (avec leurs postes nested)
    const unitesById = {};
    for (const u of unites) {
      unitesById[u.unite_id] = {
        unite_id: u.unite_id,
        code: u.code,
        nom: u.nom,
        type_unite: u.type_unite,
        niveau_hierarchique: u.niveau_hierarchique,
        mission: u.mission,
        postes: postesParUnite[u.unite_id] || [],
        enfants: []
      };
    }
    const uniteTree = [];
    for (const u of unites) {
      const node = unitesById[u.unite_id];
      if (u.unite_parent_id && unitesById[u.unite_parent_id]) {
        unitesById[u.unite_parent_id].enfants.push(node);
      } else {
        uniteTree.push(node);
      }
    }

    // Relations directes institution -> institution (sortantes)
    const relationsSortantes = await db.all(
      `SELECT r.relation_id, r.nature_relation, r.echange_principal, r.niveau_confiance,
              i.institution_id AS cible_id, i.nom AS cible_nom, i.code AS cible_code, i.type_institution AS cible_type
       FROM relation_interinstitutionnelle r
       JOIN institution i ON i.institution_id = r.institution_cible_id
       WHERE r.mode = 'INSTITUTION' AND r.institution_source_id = ?`,
      [institutionId]
    );

    // Relations directes institution -> institution (entrantes)
    const relationsEntrantes = await db.all(
      `SELECT r.relation_id, r.nature_relation, r.echange_principal, r.niveau_confiance,
              i.institution_id AS source_id, i.nom AS source_nom, i.code AS source_code, i.type_institution AS source_type
       FROM relation_interinstitutionnelle r
       JOIN institution i ON i.institution_id = r.institution_source_id
       WHERE r.mode = 'INSTITUTION' AND r.institution_cible_id = ?`,
      [institutionId]
    );

    // Relations generiques par type d'institution (mode TYPE_INSTITUTION)
    const relationsParType = await db.all(
      `SELECT relation_id, type_source, type_cible, nature_relation, echange_principal, niveau_confiance
       FROM relation_interinstitutionnelle
       WHERE mode = 'TYPE_INSTITUTION' AND (type_source = ? OR type_cible = ?)`,
      [institution.type_institution, institution.type_institution]
    );

    res.json({
      institution,
      organigramme: uniteTree,
      stats: {
        nb_unites: unites.length,
        nb_postes: postes.length
      },
      relations: {
        sortantes: relationsSortantes,
        entrantes: relationsEntrantes,
        par_type: relationsParType
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
