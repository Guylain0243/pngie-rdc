const fs = require('fs');
const path = "src/lib/errors.js";
let raw = fs.readFileSync(path, "utf8");
const hadCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

const anchor = `function globalErrorHandler(err, req, res, next) {`;

if (!content.includes(anchor)) {
  console.log("ECHEC : ancre non trouvee. Aucune modification.");
  process.exit(1);
}

const sendSuccessFn = `// Succes : { success: true, data: {...} }
// httpStatus optionnel (defaut 200 ; 201 pour une creation, 204 sans corps pour une suppression).
function sendSuccess(res, data, httpStatus = 200) {
    if (httpStatus === 204) return res.status(204).end();
    return res.status(httpStatus).json({ success: true, data });
}

`;

content = content.replace(anchor, sendSuccessFn + anchor);

const exportsOld = `module.exports = { ERROR_CODES, DEFAULT_HTTP_STATUS, sendError, globalErrorHandler };`;
const exportsNew = `module.exports = { ERROR_CODES, DEFAULT_HTTP_STATUS, sendError, sendSuccess, globalErrorHandler };`;

if (!content.includes(exportsOld)) {
  console.log("ECHEC : ancre exports non trouvee. Aucune modification.");
  process.exit(1);
}
content = content.replace(exportsOld, exportsNew);

if (hadCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(path, content, "utf8");
console.log("SUCCES : sendSuccess ajoute a lib/errors.js.");
