const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../src/db");
const { exigerPermission } = require("../src/security-engine");
const { exigerPortee } = require("../src/security/scope-engine");
const { validate, sendError } = require("../src/middleware/validation");
const { sendSuccess } = require("../src/lib/errors");
const { enregistrerEvenement } = require("../src/event-engine");

const schemaAffectationBody = {
  personne_id: { type: "uuid", required: true },
  poste_id: { type: "uuid", required: true },
  type_affectation: { type: "enum", required: true, values: ["TITULAIRE", "INTERIM", "MISSION"] },
  date_debut: { type: "date", required: true },
  date_fin: { type: "date" },
  texte_nomination: { type: "string", maxLength: 300 },
};

router.get("/affectations", exigerPermission("affectation", "READ"), exigerPortee({ type: "affectation" }), async (req, res) => {
  try {
    const placeholders = req.scope.institutionsVisibles.map(() => "?").join(",");
    if (!placeholders) return sendSuccess(res, []);
    const rows = await db.all(`
      SELECT a.*, pe.nom AS personne_nom, pe.prenom AS personne_prenom, p.intitule AS poste_intitule
      FROM affectation a
      JOIN personne pe ON pe.personne_id = a.personne_id
      JOIN poste p ON p.poste_id = a.poste_id
      JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
      WHERE u.institution_id IN (${placeholders})
      ORDER BY a.date_debut DESC
    `, req.scope.institutionsVisibles);
    return sendSuccess(res, rows);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture des affectations."); }
});

router.get("/affectations/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("affectation", "READ"), exigerPortee({ type: "affectation", source: "params.id" }), async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM affectation WHERE affectation_id = ?", [req.params.id]);
    if (!row) return sendError(res, 404, "NOT_FOUND", "Affectation introuvable.");
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture de l'affectation."); }
});

router.post("/affectations", exigerPermission("affectation", "CREATE"), validate({ body: schemaAffectationBody }), exigerPortee({ type: "poste", source: "body.poste_id" }), async (req, res) => {
  const b = req.body;
  if (b.date_fin && b.date_fin < b.date_debut) {
    return sendError(res, 400, "VALIDATION_ERROR", "La date de fin doit etre posterieure a la date de debut.");
  }
  const id = crypto.randomUUID();
  try {
    const row = await db.transaction(async (tx) => {
      const conflit = await tx.get(
        `SELECT affectation_id FROM affectation WHERE poste_id = ? AND date_fin IS NULL AND type_affectation = 'TITULAIRE'`,
        [b.poste_id]
      );
      if (conflit && b.type_affectation === "TITULAIRE") {
        throw new Error("POSTE_DEJA_POURVU");
      }
      await tx.run(
        `INSERT INTO affectation (affectation_id, personne_id, poste_id, type_affectation, date_debut, date_fin, texte_nomination, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIF')`,
        [id, b.personne_id, b.poste_id, b.type_affectation, b.date_debut, b.date_fin || null, b.texte_nomination || null]
      );
      return await tx.get("SELECT * FROM affectation WHERE affectation_id = ?", [id]);
    });
    await enregistrerEvenement("affectation", id, "CREATION", null, row, req.user && req.user.sub);
    return sendSuccess(res, row, 201);
  } catch (err) {
    if (err.message === "POSTE_DEJA_POURVU") {
      return sendError(res, 409, "CONFLICT", "Ce poste a deja un titulaire actif. Terminez l'affectation existante avant d'en creer une nouvelle.");
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la creation de l'affectation.");
  }
});

router.put("/affectations/:id", validate({ params: { id: { type: "uuid", required: true } }, body: schemaAffectationBody }), exigerPermission("affectation", "UPDATE"), exigerPortee({ type: "affectation", source: "params.id" }), exigerPortee({ type: "poste", source: "body.poste_id" }), async (req, res) => {
  const b = req.body;
  if (b.date_fin && b.date_fin < b.date_debut) {
    return sendError(res, 400, "VALIDATION_ERROR", "La date de fin doit etre posterieure a la date de debut.");
  }
  try {
    const existant = await db.get("SELECT * FROM affectation WHERE affectation_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Affectation introuvable.");
    const row = await db.transaction(async (tx) => {
      await tx.run(
        `UPDATE affectation SET personne_id=?, poste_id=?, type_affectation=?, date_debut=?, date_fin=?, texte_nomination=?, updated_at=CURRENT_TIMESTAMP WHERE affectation_id = ?`,
        [b.personne_id, b.poste_id, b.type_affectation, b.date_debut, b.date_fin || null, b.texte_nomination || null, req.params.id]
      );
      return await tx.get("SELECT * FROM affectation WHERE affectation_id = ?", [req.params.id]);
    });
    await enregistrerEvenement("affectation", req.params.id, "MODIFICATION", existant, row, req.user && req.user.sub);
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la modification de l'affectation."); }
});

router.delete("/affectations/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("affectation", "DELETE"), exigerPortee({ type: "affectation", source: "params.id" }), async (req, res) => {
  try {
    const existant = await db.get("SELECT * FROM affectation WHERE affectation_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Affectation introuvable.");
    await db.run("DELETE FROM affectation WHERE affectation_id = ?", [req.params.id]);
    await enregistrerEvenement("affectation", req.params.id, "SUPPRESSION", existant, null, req.user && req.user.sub);
    return sendSuccess(res, null, 204);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la suppression de l'affectation."); }
});

module.exports = router;
