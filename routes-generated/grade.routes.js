const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../src/db");
const { exigerPermission } = require("../src/security-engine");
const { validate, sendError } = require("../src/middleware/validation");
const { sendSuccess } = require("../src/lib/errors");
const { enregistrerEvenement } = require("../src/event-engine");

const schemaGradeBody = {
  code: { type: "string", required: true, maxLength: 20 },
  intitule: { type: "string", required: true, maxLength: 200 },
  niveau_hierarchique: { type: "integer" },
  statut: { type: "enum", values: ["ACTIF", "INACTIF"] },
};

router.get("/grades", exigerPermission("grade", "READ"), async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM grade ORDER BY niveau_hierarchique NULLS LAST, intitule");
    return sendSuccess(res, rows);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture des grades."); }
});

router.get("/grades/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("grade", "READ"), async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM grade WHERE grade_id = ?", [req.params.id]);
    if (!row) return sendError(res, 404, "NOT_FOUND", "Grade introuvable.");
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture du grade."); }
});

router.post("/grades", exigerPermission("grade", "CREATE"), validate({ body: schemaGradeBody }), async (req, res) => {
  const b = req.body;
  const id = crypto.randomUUID();
  try {
    const row = await db.transaction(async (tx) => {
      await tx.run(`INSERT INTO grade (grade_id, code, intitule, niveau_hierarchique, statut) VALUES (?, ?, ?, ?, ?)`,
        [id, b.code, b.intitule, b.niveau_hierarchique || null, b.statut || "ACTIF"]);
      return await tx.get("SELECT * FROM grade WHERE grade_id = ?", [id]);
    });
    await enregistrerEvenement("grade", id, "CREATION", null, row, req.user && req.user.sub);
    return sendSuccess(res, row, 201);
  } catch (err) {
    if (err.message && err.message.includes("unique")) return sendError(res, 409, "CONFLICT", "Un grade avec ce code existe deja.");
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la creation du grade.");
  }
});

router.put("/grades/:id", validate({ params: { id: { type: "uuid", required: true } }, body: schemaGradeBody }), exigerPermission("grade", "UPDATE"), async (req, res) => {
  const b = req.body;
  try {
    const existant = await db.get("SELECT * FROM grade WHERE grade_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Grade introuvable.");
    const row = await db.transaction(async (tx) => {
      await tx.run(`UPDATE grade SET code=?, intitule=?, niveau_hierarchique=?, statut=?, updated_at=CURRENT_TIMESTAMP WHERE grade_id = ?`,
        [b.code, b.intitule, b.niveau_hierarchique || null, b.statut || existant.statut, req.params.id]);
      return await tx.get("SELECT * FROM grade WHERE grade_id = ?", [req.params.id]);
    });
    await enregistrerEvenement("grade", req.params.id, "MODIFICATION", existant, row, req.user && req.user.sub);
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la modification du grade."); }
});

router.delete("/grades/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("grade", "DELETE"), async (req, res) => {
  try {
    const existant = await db.get("SELECT * FROM grade WHERE grade_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Grade introuvable.");
    await db.run("DELETE FROM grade WHERE grade_id = ?", [req.params.id]);
    await enregistrerEvenement("grade", req.params.id, "SUPPRESSION", existant, null, req.user && req.user.sub);
    return sendSuccess(res, null, 204);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la suppression du grade."); }
});

module.exports = router;
