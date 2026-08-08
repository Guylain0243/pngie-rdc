const fs = require("fs");
const path = "C:\\pngie-rdc\\pngie-backend\\src\\server.js";
const text = fs.readFileSync(path, "utf8");
const lines = text.split("\n");

const startIdx = lines.findIndex(l => l.includes("async function requireAuth"));
if (startIdx === -1) { console.error("INTROUVABLE: async function requireAuth"); process.exit(1); }

// On cherche la ligne "}" qui ferme la fonction, juste après le catch
let endIdx = -1;
for (let i = startIdx; i < startIdx + 20; i++) {
  if (lines[i].trim() === "}" && lines[i-1] && lines[i-1].includes("Token invalide")===false && lines[i-2] && lines[i-2].includes("Token invalide")) {
    endIdx = i;
    break;
  }
}
if (endIdx === -1) { console.error("INTROUVABLE: fin de fonction requireAuth"); process.exit(1); }

console.log("Bloc trouve, lignes " + (startIdx+1) + " a " + (endIdx+1) + " :");
console.log(lines.slice(startIdx, endIdx+1).join("\n"));

const newBlock = [
  "async function requireAuth(req, res, next) {",
  "  const header = req.headers.authorization || '';",
  "  const token = header.startsWith('Bearer ') ? header.slice(7) : null;",
  "  if (!token) return res.status(401).json({ error: 'Token manquant.' });",
  "  try {",
  "    req.user = jwt.verify(token, JWT_SECRET);",
  "  } catch {",
  "    return res.status(401).json({ error: 'Token invalide ou expire.' });",
  "  }",
  "  let institutionId = null;",
  "  try {",
  "    if (req.user.roles && req.user.roles.length > 0) {",
  "      const scope = await db.get(",
  "        'SELECT scope_org_id FROM personne_role WHERE personne_id = ? AND scope_org_id IS NOT NULL LIMIT 1',",
  "        [req.user.sub]",
  "      );",
  "      institutionId = scope ? scope.scope_org_id : null;",
  "    }",
  "  } catch (e) {",
  "    institutionId = null;",
  "  }",
  "  requestContext.run({ institutionId }, next);",
  "}"
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newBlock);
fs.writeFileSync(path, lines.join("\n"), "utf8");
console.log("REMPLACEMENT EFFECTUE.");