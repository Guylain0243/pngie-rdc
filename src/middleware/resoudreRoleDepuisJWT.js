// ----------------------------------------------------------------
// PNGIE-RDC - Resolution du role depuis le JWT
// Remplace les 40 blocs inline dupliques dans server.js.
// Monte UNE SEULE FOIS, juste apres requireAuth, avant tous les routeurs /api.
// ----------------------------------------------------------------
function resoudreRoleDepuisJWT(req, res, next) {
  if (req.user && req.user.roles && req.user.roles.length > 0) {
    req.headers["x-role-code"] = req.user.roles[0];
  }
  next();
}

module.exports = resoudreRoleDepuisJWT;
