// src/domains/governance/decision.routes.js
// requireAuth est applique au montage dans server.js, comme pour les autres
// domaines. Contrairement a journal.routes.js, on applique explicitement
// exigerPortee() ici : decision_gouvernementale n'a pas de RLS, donc req.scope
// doit etre peuple par le code avant que le service ne filtre en SQL.
const express = require("express");
const ctrl = require("./decision.controller");
const { exigerPortee } = require("../../security/scope-engine");

const router = express.Router();

router.use(exigerPortee({}));

router.post("/governance/decisions", ctrl.creer);
router.get("/governance/decisions", ctrl.lister);
router.get("/governance/decisions/:id", ctrl.obtenir);
router.put("/governance/decisions/:id", ctrl.modifier);
router.get("/governance/decisions/:id/tableau-bord", ctrl.tableauBord);

router.post("/governance/decisions/:id/publier", ctrl.transitionVers("PUBLIEE"));
router.post("/governance/decisions/:id/archiver", ctrl.transitionVers("ARCHIVEE"));
router.post("/governance/decisions/:id/annuler", ctrl.transitionVers("ANNULEE"));

router.put("/governance/decisions/actions/:actionId", ctrl.modifierAction);

module.exports = router;
