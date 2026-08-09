// src/domains/governance/cockpit.routes.js
const express = require("express");
const ctrl = require("./cockpit.controller");
const { exigerPortee } = require("../../security/scope-engine");

const router = express.Router();

router.use(exigerPortee({}));

router.get("/cockpit/indicateurs", ctrl.indicateurs);
router.get("/cockpit/synthese-nationale", ctrl.syntheseNationale);

module.exports = router;
