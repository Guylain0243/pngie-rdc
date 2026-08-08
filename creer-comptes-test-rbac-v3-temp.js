const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("./src/db");

const COMPTES = [
  { role: "AN", institutionCode: "AN",         email: "test-an@pngie.local", prenom: "Test", nom: "RBAC AN" },
  { role: "GV", institutionCode: "PROV_0",      email: "test-gv@pngie.local", prenom: "Test", nom: "RBAC GV" },
  { role: "MI", institutionCode: "MIN_9",       email: "test-mi@pngie.local", prenom: "Test", nom: "RBAC MI" },
  { role: "PM", institutionCode: "PRIMATURE",   email: "test-pm@pngie.local", prenom: "Test", nom: "RBAC PM" },
  { role: "PR", institutionCode: "PRESIDENCE",  email: "test-pr@pngie.local", prenom: "Test", nom: "RBAC PR" },
  { role: "SN", institutionCode: "SENAT",       email: "test-sn@pngie.local", prenom: "Test", nom: "RBAC SN" }
];

async function traiterCompte(c, passwordHash) {
  console.log("`n--- " + c.role + " (" + c.email + ") ---");

  const institution = await db.get("SELECT institution_id, nom FROM institution WHERE code = ?", [c.institutionCode]);
  if (!institution) { console.log("  ERREUR : institution " + c.institutionCode + " introuvable"); return; }

  let unite = await db.get("SELECT unite_id FROM unite_organisationnelle WHERE institution_id = ? AND code = ?", [institution.institution_id, "TEST_RBAC"]);
  if (!unite) {
    const uniteId = crypto.randomUUID();
    await db.run(
      `INSERT INTO unite_organisationnelle (unite_id, institution_id, code, nom, type_unite, niveau_hierarchique, statut) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uniteId, institution.institution_id, "TEST_RBAC", "Unite de test RBAC", "TEST", 99, "ACTIF"]
    );
    unite = { unite_id: uniteId };
    console.log("  Unite de test creee");
  } else {
    console.log("  Unite de test existante reutilisee");
  }

  let poste = await db.get("SELECT poste_id FROM poste WHERE unite_id = ? AND code = ?", [unite.unite_id, "TEST_RBAC"]);
  if (!poste) {
    const posteId = crypto.randomUUID();
    await db.run(
      `INSERT INTO poste (poste_id, unite_id, code, intitule, niveau_hierarchique, categorie, statut, nombre_postes_autorises) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [posteId, unite.unite_id, "TEST_RBAC", "Poste de test RBAC", 99, "TEST", "ACTIF", 1]
    );
    poste = { poste_id: posteId };
    console.log("  Poste de test cree");
  } else {
    console.log("  Poste de test existant reutilise");
  }

  // NOTE : person est une VUE en lecture sur personne (personne_id AS person_id, ...).
  // Une seule ecriture dans personne suffit, person la reflete automatiquement.
  let personne = await db.get("SELECT personne_id FROM personne WHERE email = ?", [c.email]);
  let personneId;
  if (!personne) {
    personneId = crypto.randomUUID();
    await db.run(
      `INSERT INTO personne (personne_id, nom, prenom, email, password_hash, statut) VALUES (?, ?, ?, ?, ?, ?)`,
      [personneId, c.nom, c.prenom, c.email, passwordHash, "ACTIF"]
    );
    console.log("  Personne creee (person la reflete via la vue)");
  } else {
    personneId = personne.personne_id;
    await db.run("UPDATE personne SET password_hash = ? WHERE personne_id = ?", [passwordHash, personneId]);
    console.log("  Personne existante reutilisee, mot de passe resynchronise");
  }

  const role = await db.get("SELECT role_id FROM role WHERE code = ?", [c.role]);
  const dejaRole = await db.get("SELECT 1 FROM personne_role WHERE personne_id = ? AND role_id = ?", [personneId, role.role_id]);
  if (!dejaRole) {
    await db.run("INSERT INTO personne_role (personne_id, role_id) VALUES (?, ?)", [personneId, role.role_id]);
    console.log("  Role " + c.role + " attribue");
  } else {
    console.log("  Role " + c.role + " deja attribue");
  }

  const dejaAffectation = await db.get(
    "SELECT affectation_id FROM affectation WHERE personne_id = ? AND poste_id = ? AND statut = ? AND date_fin IS NULL",
    [personneId, poste.poste_id, "ACTIF"]
  );
  if (!dejaAffectation) {
    await db.run(
      `INSERT INTO affectation (affectation_id, personne_id, poste_id, type_affectation, date_debut, statut) VALUES (?, ?, ?, ?, CURRENT_DATE, ?)`,
      [crypto.randomUUID(), personneId, poste.poste_id, "TEST", "ACTIF"]
    );
    console.log("  Affectation active creee sur " + institution.nom);
  } else {
    console.log("  Affectation active existante");
  }
}

async function main() {
  const password = process.env.PNGIE_TEST_PASSWORD;
  if (!password) { console.log("ERREUR : mot de passe manquant"); process.exit(1); }
  const passwordHash = await bcrypt.hash(password, 12);

  for (const c of COMPTES) {
    try {
      await traiterCompte(c, passwordHash);
    } catch (e) {
      console.log("  ECHEC pour " + c.role + " : " + e.message);
      console.log("  Detail:", e.detail || "aucun");
    }
  }
  console.log("`n===== TERMINE =====");
  process.exit(0);
}

main().catch(err => { console.error("ERREUR FATALE:", err.message); process.exit(1); });
