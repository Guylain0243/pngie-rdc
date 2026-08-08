const express = require("express");
const db = require("../src/db");
const router = express.Router();

// CHARGEMENT AUTOMATIQUE DU POSTE DE L'UTILISATEUR CONNECTE
// Institution > Unite > Fonction, sans second mot de passe (lecture directe via req.user.sub)
router.get("/me/poste", async (req, res) => {
  try {
    const personneId = req.user && req.user.sub;
    if (!personneId) return res.status(401).json({ error: "Non authentifiÃ©" });

    const affectation = await db.get(`
      SELECT a.poste_id, pe.personne_id, pe.nom, pe.prenom, pe.email
      FROM affectation a
      JOIN personne pe ON pe.personne_id = a.personne_id
      WHERE a.personne_id = ? AND a.statut = ? AND a.date_fin IS NULL
      ORDER BY a.date_debut DESC
      LIMIT 1
    `, [personneId, "ACTIF"]);

    if (!affectation) {
      return res.json({ personne_id: personneId, poste_intitule: null, unite: null, institution: null, message: "Aucun poste actif rattachÃ© Ã  cet utilisateur" });
    }

    const poste = await db.get(`
      SELECT p.poste_id, p.intitule, p.categorie, u.nom AS unite_nom, i.nom AS institution_nom, i.institution_id, i.type_institution
      FROM poste p
      JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
      JOIN institution i ON i.institution_id = u.institution_id
      WHERE p.poste_id = ?
    `, [affectation.poste_id]);

    res.json({
      personne_id: affectation.personne_id,
      nom: affectation.nom,
      prenom: affectation.prenom,
      email: affectation.email,
      poste_id: poste ? poste.poste_id : null,
      poste_intitule: poste ? poste.intitule : null,
      categorie: poste ? poste.categorie : null,
      unite: poste ? poste.unite_nom : null,
      institution: poste ? poste.institution_nom : null,
      institution_id: poste ? poste.institution_id : null,
      type_institution: poste ? poste.type_institution : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

