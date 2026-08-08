const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../src/db");
const { exigerPermission } = require("../src/security-engine");
const { validate, sendError } = require("../src/middleware/validation");
const { sendSuccess } = require("../src/lib/errors");
const { enregistrerEvenement } = require("../src/event-engine");

const schemaCorpsBody = {
  code: { type: "string", required: true, maxLength: 20 },
  intitule: { type: "string", required: true, maxLength: 200 },
  description: { type: "string" },
  statut: { type: "enum", values: ["ACTIF", "INACTIF"] },
};

router.get("/corps", exigerPermission("corps", "READ"), async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM corps ORDER BY intitule");
    return sendSuccess(res, rows);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture des corps."); }
});

router.get("/corps/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("corps", "READ"), async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM corps WHERE corps_id = ?", [req.params.id]);
    if (!row) return sendError(res, 404, "NOT_FOUND", "Corps introuvable.");
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture du corps."); }
});

router.post("/corps", exigerPermission("corps", "CREATE"), validate({ body: schemaCorpsBody }), async (req, res) => {
  const b = req.body;
  const id = crypto.randomUUID();
  try {
    const row = await db.transaction(async (tx) => {
      await tx.run(`INSERT INTO corps (corps_id, code, intitule, description, statut) VALUES (?, ?, ?, ?, ?)`,
        [id, b.code, b.intitule, b.description || null, b.statut || "ACTIF"]);
      return await tx.get("SELECT * FROM corps WHERE corps_id = ?", [id]);
    });
    await enregistrerEvenement("corps", id, "CREATION", null, row, req.user && req.user.sub);
    return sendSuccess(res, row, 201);
  } catch (err) {
    if (err.message && err.message.includes("unique")) return sendError(res, 409, "CONFLICT", "Un corps avec ce code existe deja.");
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la creation du corps.");
  }
});

router.put("/corps/:id", validate({ params: { id: { type: "uuid", required: true } }, body: schemaCorpsBody }), exigerPermission("corps", "UPDATE"), async (req, res) => {
  const b = req.body;
  try {
    const existant = await db.get("SELECT * FROM corps WHERE corps_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Corps introuvable.");
    const row = await db.transaction(async (tx) => {
      await tx.run(`UPDATE corps SET code=?, intitule=?, description=?, statut=?, updated_at=CURRENT_TIMESTAMP WHERE corps_id = ?`,
        [b.code, b.intitule, b.description || null, b.statut || existant.statut, req.params.id]);
      return await tx.get("SELECT * FROM corps WHERE corps_id = ?", [req.params.id]);
    });
    await enregistrerEvenement("corps", req.params.id, "MODIFICATION", existant, row, req.user && req.user.sub);
    return sendSuccess(res, row);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la modification du corps."); }
});

router.delete("/corps/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("corps", "DELETE"), async (req, res) => {
  try {
    const existant = await db.get("SELECT * FROM corps WHERE corps_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Corps introuvable.");
    await db.run("DELETE FROM corps WHERE corps_id = ?", [req.params.id]);
    await enregistrerEvenement("corps", req.params.id, "SUPPRESSION", existant, null, req.user && req.user.sub);
    return sendSuccess(res, null, 204);
  } catch (err) { return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la suppression du corps."); }
});

module.exports = router;
