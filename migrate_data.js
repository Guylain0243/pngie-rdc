/**
 * Migration SQLite (db/pngie.db) -> PostgreSQL (pngie_rdc)
 * Perimetre : socle noyau uniquement (institution, unites, postes, affectations,
 * roles/permissions, personnes, referentiels nationaux, meta-workflow, meta-rules,
 * types de documents + 1 document de test).
 *
 * Les modules metiers sectoriels (sante, justice, mines, etc.) ne sont PAS migres
 * ici : ils n'ont pas encore de table PostgreSQL cible (voir echange precedent).
 *
 * Strategie de robustesse :
 *  - chaque table est migree dans sa propre transaction ;
 *  - chaque ligne est inseree via un SAVEPOINT : si une ligne echoue, elle est
 *    annulee et journalisee, mais le reste de la table continue de s'inserer ;
 *  - un rapport complet est ecrit dans migration_report.txt a la fin.
 *
 * Hypotheses / choix faits faute de mapping exact (voir rapport final) :
 *  - poste.code = position_id source (tronque a 30 caracteres si besoin)
 *  - poste.poste_hierarchique_id : pas de source en SQLite -> NULL
 *  - poste.missions : concatene role_defaut_id / autorite de la source (non perdu)
 *  - type_document.code : genere par slug du nom (pas de colonne "code" en SQLite)
 *  - affectation.date_debut : si NULL en SQLite -> valeur par defaut 2020-01-01
 *  - personne.prenom : si NULL en SQLite -> chaine vide (colonne NOT NULL en PG)
 *  - institution.description : prefixee par "[Pouvoir XXX]" issu de pouvoir/organization_type
 *  - permission.entite / action : deduits en decoupant permission.code sur les ":"
 */

const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");
const { Client } = require("pg");

const SQLITE_PATH = path.join(__dirname, "db", "pngie.db");

const PG_CONFIG = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.PGPASSWORD || "Merci@0243",
  database: "pngie_rdc",
};

const report = [];
function log(msg) {
  console.log(msg);
  report.push(msg);
}

function newId() {
  return crypto.randomUUID();
}

function toCode(str, maxLen) {
  if (!str) return newId().slice(0, maxLen);
  if (str.length <= maxLen) return str;
  const hash = crypto.createHash("md5").update(str).digest("hex").slice(0, 6);
  return str.slice(0, maxLen - 7) + "-" + hash;
}

function slugify(str, maxLen) {
  const slug = (str || "SANS_NOM")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug.slice(0, maxLen) || "SANS_NOM";
}

async function insertRow(client, sql, params, label, errors) {
  await client.query("SAVEPOINT sp");
  try {
    await client.query(sql, params);
    await client.query("RELEASE SAVEPOINT sp");
    return true;
  } catch (e) {
    await client.query("ROLLBACK TO SAVEPOINT sp");
    errors.push(`${label} :: ${e.message}`);
    return false;
  }
}

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pg = new Client(PG_CONFIG);
  await pg.connect();

  const orgMap = new Map();
  const unitMap = new Map();
  const posMap = new Map();
  const roleMap = new Map();
  const personMap = new Map();
  const docTypeMap = new Map();
  const refMap = new Map();
  const sectionMap = new Map();

  {
    const errors = [];
    const orgs = sqlite.prepare("SELECT * FROM organization").all();
    const types = new Map(sqlite.prepare("SELECT * FROM organization_type").all().map((t) => [t.id, t]));
    const pouvoirs = new Map(sqlite.prepare("SELECT * FROM pouvoir").all().map((p) => [p.pouvoir_id, p]));

    for (const o of orgs) orgMap.set(o.organization_id, newId());

    await pg.query("BEGIN");
    let ok = 0;
    for (const o of orgs) {
      const typeRow = types.get(o.type_id);
      const typeInstitution = typeRow ? typeRow.code : "AUTRE";
      const pouvoirRow = typeRow && typeRow.pouvoir_id ? pouvoirs.get(typeRow.pouvoir_id) : null;
      const descPrefix = pouvoirRow ? `[${pouvoirRow.libelle}] ` : "";
      const description = (descPrefix + (o.description || "")).trim() || null;

      const success = await insertRow(
        pg,
        `INSERT INTO institution
           (institution_id, code, nom, sigle, type_institution, institution_parent_id,
            niveau_hierarchique, description, statut, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())`,
        [
          orgMap.get(o.organization_id),
          o.code,
          o.nom,
          null,
          typeInstitution,
          null,
          o.niveau || 0,
          description,
          o.statut || "ACTIF",
        ],
        `institution(${o.code})`,
        errors
      );
      if (success) ok++;
    }
    for (const o of orgs) {
      if (o.parent_id && orgMap.has(o.parent_id) && orgMap.has(o.organization_id)) {
        await insertRow(
          pg,
          `UPDATE institution SET institution_parent_id = $1 WHERE institution_id = $2`,
          [orgMap.get(o.parent_id), orgMap.get(o.organization_id)],
          `institution.parent(${o.code})`,
          errors
        );
      }
    }
    await pg.query("COMMIT");
    log(`institution : ${ok}/${orgs.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const units = sqlite.prepare("SELECT * FROM unit").all();
    for (const u of units) unitMap.set(u.unit_id, newId());

    await pg.query("BEGIN");
    let ok = 0;
    for (const u of units) {
      const success = await insertRow(
        pg,
        `INSERT INTO unite_organisationnelle
           (unite_id, institution_id, unite_parent_id, code, nom, type_unite,
            niveau_hierarchique, mission, statut, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())`,
        [
          unitMap.get(u.unit_id),
          orgMap.get(u.organization_id),
          u.parent_unit_id ? unitMap.get(u.parent_unit_id) : null,
          toCode(u.code || u.unit_id, 30),
          u.nom,
          u.type || "AUTRE",
          u.ordre || 0,
          null,
          "ACTIF",
        ],
        `unite(${u.unit_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`unite_organisationnelle : ${ok}/${units.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const positions = sqlite.prepare("SELECT * FROM position").all();
    for (const p of positions) posMap.set(p.position_id, newId());

    await pg.query("BEGIN");
    let ok = 0;
    for (const p of positions) {
      const notes = [];
      if (p.role_defaut_id) notes.push(`role_defaut_id source: ${p.role_defaut_id}`);
      if (p.autorite) notes.push(`autorite: ${p.autorite}`);
      const missions = notes.length ? notes.join(" | ") : null;

      const success = await insertRow(
        pg,
        `INSERT INTO poste
           (poste_id, unite_id, code, intitule, poste_hierarchique_id, niveau_hierarchique,
            categorie, missions, attributions, responsabilites, competences_requises,
            nombre_postes_autorises, statut, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now())`,
        [
          posMap.get(p.position_id),
          unitMap.get(p.unit_id),
          toCode(p.position_id, 30),
          p.titre,
          null,
          p.niveau || 0,
          null,
          missions,
          null,
          null,
          null,
          1,
          "ACTIF",
        ],
        `poste(${p.position_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`poste : ${ok}/${positions.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const roles = sqlite.prepare("SELECT * FROM role").all();
    for (const r of roles) roleMap.set(r.role_id, newId());

    await pg.query("BEGIN");
    let ok = 0;
    for (const r of roles) {
      const success = await insertRow(
        pg,
        `INSERT INTO role (role_id, code, nom, categorie, description, statut, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())`,
        [roleMap.get(r.role_id), r.code, r.nom, r.categorie || null, null, "ACTIF"],
        `role(${r.code})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`role : ${ok}/${roles.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const perms = new Map(sqlite.prepare("SELECT * FROM permission").all().map((p) => [p.permission_id, p]));
    const rolePerms = sqlite.prepare("SELECT * FROM role_permission").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const rp of rolePerms) {
      const perm = perms.get(rp.permission_id);
      if (!perm) {
        errors.push(`permission :: permission_id introuvable ${rp.permission_id}`);
        continue;
      }
      const parts = String(perm.code).split(":");
      const action = parts.pop() || "read";
      const entite = parts.join(":") || perm.code;
      const roleId = roleMap.get(rp.role_id);
      if (!roleId) {
        errors.push(`permission :: role_id introuvable ${rp.role_id} (perm ${perm.code})`);
        continue;
      }
      const success = await insertRow(
        pg,
        `INSERT INTO permission (permission_id, role_id, entite, action, condition_json, statut, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (role_id, entite, action) DO NOTHING`,
        [newId(), roleId, entite, action, null, "ACTIF"],
        `permission(${perm.code})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`permission : ${ok}/${rolePerms.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const persons = sqlite.prepare("SELECT * FROM person").all();
    for (const p of persons) personMap.set(p.person_id, newId());

    await pg.query("BEGIN");
    let ok = 0;
    for (const p of persons) {
      const success = await insertRow(
        pg,
        `INSERT INTO personne
           (personne_id, matricule, nom, prenom, email, password_hash, statut, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())`,
        [
          personMap.get(p.person_id),
          p.matricule || null,
          p.nom,
          p.prenom || "",
          p.email,
          p.password_hash,
          p.statut || "ACTIF",
        ],
        `personne(${p.email})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`personne : ${ok}/${persons.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const assigns = sqlite.prepare("SELECT * FROM assignment").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const a of assigns) {
      const personneId = personMap.get(a.person_id);
      const posteId = posMap.get(a.position_id);
      if (!personneId || !posteId) {
        errors.push(`affectation :: reference manquante person=${a.person_id} position=${a.position_id}`);
        continue;
      }
      const success = await insertRow(
        pg,
        `INSERT INTO affectation
           (affectation_id, personne_id, poste_id, type_affectation, date_debut, date_fin, statut, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())`,
        [
          newId(),
          personneId,
          posteId,
          "TITULAIRE",
          a.date_debut || "2020-01-01",
          a.date_fin || null,
          a.statut || "ACTIF",
        ],
        `affectation(${a.assignment_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`affectation : ${ok}/${assigns.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const prs = sqlite.prepare("SELECT * FROM person_role").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const pr of prs) {
      const personneId = personMap.get(pr.person_id);
      const roleId = roleMap.get(pr.role_id);
      const scopeId = pr.scope_org_id ? orgMap.get(pr.scope_org_id) : null;
      if (!personneId || !roleId || !scopeId) {
        errors.push(
          `personne_role :: reference manquante person=${pr.person_id} role=${pr.role_id} scope=${pr.scope_org_id}`
        );
        continue;
      }
      const success = await insertRow(
        pg,
        `INSERT INTO personne_role
           (personne_role_id, personne_id, role_id, scope_institution_id, date_attribution, statut)
         VALUES ($1,$2,$3,$4, now(), $5)
         ON CONFLICT (personne_id, role_id, scope_institution_id) DO NOTHING`,
        [newId(), personneId, roleId, scopeId, "ACTIF"],
        `personne_role(${pr.person_role_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`personne_role : ${ok}/${prs.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }
  {
    const errors = [];
    const types = sqlite.prepare("SELECT * FROM document_type").all();
    const usedCodes = new Set();

    await pg.query("BEGIN");
    let ok = 0;
    for (const t of types) {
      let code = slugify(t.nom, 30);
      let suffix = 1;
      while (usedCodes.has(code)) {
        code = slugify(t.nom, 26) + "_" + suffix++;
      }
      usedCodes.add(code);
      docTypeMap.set(t.document_type_id, newId());

      const success = await insertRow(
        pg,
        `INSERT INTO type_document
           (type_document_id, code, nom, modele_url, duree_conservation_ans, regle_archivage)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [docTypeMap.get(t.document_type_id), code, t.nom, null, t.duree_conservation_ans || null, t.regle_archivage || null],
        `type_document(${t.nom})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`type_document : ${ok}/${types.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const docs = sqlite.prepare("SELECT * FROM document").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const d of docs) {
      const typeId = docTypeMap.get(d.document_type_id);
      const institutionId = orgMap.get(d.organization_id);
      if (!typeId || !institutionId) {
        errors.push(`document :: reference manquante type=${d.document_type_id} org=${d.organization_id}`);
        continue;
      }
      const success = await insertRow(
        pg,
        `INSERT INTO document
           (document_id, type_document_id, institution_id, titre, reference, statut, confidentialite, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())`,
        [newId(), typeId, institutionId, d.titre, d.reference || null, "BROUILLON", "PUBLIC"],
        `document(${d.titre})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`document : ${ok}/${docs.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const refs = sqlite.prepare("SELECT * FROM referentiel_national").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const r of refs) {
      const uuid = newId();
      refMap.set(r.code, uuid);
      const success = await insertRow(
        pg,
        `INSERT INTO referentiel_national (referentiel_id, code, nom, description, statut, created_at)
         VALUES ($1,$2,$3,$4,$5, now())`,
        [uuid, r.code, r.nom, r.description || null, "ACTIF"],
        `referentiel_national(${r.code})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`referentiel_national : ${ok}/${refs.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const sections = sqlite.prepare("SELECT * FROM referentiel_national_section").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const s of sections) {
      const refId = refMap.get(s.referentiel_code);
      if (!refId) {
        errors.push(`referentiel_national_section :: referentiel introuvable ${s.referentiel_code}`);
        continue;
      }
      const uuid = newId();
      sectionMap.set(s.section_id, uuid);
      const success = await insertRow(
        pg,
        `INSERT INTO referentiel_national_section
           (section_id, referentiel_id, numero_section, titre, code_officiel, contenu_texte, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())`,
        [uuid, refId, s.numero || 0, s.titre, s.code_officiel || null, s.contenu_texte || null],
        `referentiel_national_section(${s.section_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`referentiel_national_section : ${ok}/${sections.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const items = sqlite.prepare("SELECT * FROM referentiel_national_item").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const it of items) {
      const sectionId = sectionMap.get(it.section_id);
      if (!sectionId) {
        errors.push(`referentiel_national_item :: section introuvable ${it.section_id}`);
        continue;
      }
      const metadata = JSON.stringify({ numero: it.numero ?? null });
      const success = await insertRow(
        pg,
        `INSERT INTO referentiel_national_item (item_id, section_id, code_item, libelle, metadata_json, created_at)
         VALUES ($1,$2,$3,$4,$5, now())`,
        [newId(), sectionId, null, it.libelle, metadata],
        `referentiel_national_item(${it.item_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`referentiel_national_item : ${ok}/${items.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const rows = sqlite.prepare("SELECT * FROM meta_workflow_transition").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const t of rows) {
      const success = await insertRow(
        pg,
        `INSERT INTO meta_workflow_transition
           (transition_id, entite, from_statut, to_statut, role_code_requis, condition_json, statut, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (entite, from_statut, to_statut, role_code_requis) DO NOTHING`,
        [newId(), t.entite, t.from_statut, t.to_statut, t.role_code_requis || null, null, t.statut || "ACTIF"],
        `meta_workflow_transition(${t.transition_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`meta_workflow_transition : ${ok}/${rows.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  {
    const errors = [];
    const rows = sqlite.prepare("SELECT * FROM meta_rule").all();

    await pg.query("BEGIN");
    let ok = 0;
    for (const r of rows) {
      const success = await insertRow(
        pg,
        `INSERT INTO meta_rule (rule_id, entite, nom, description, evenement, condition_json, message_erreur, statut, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
        [newId(), r.entity, r.nom, r.description || null, r.evenement, r.condition_json, r.message_erreur, r.statut || "ACTIF"],
        `meta_rule(${r.rule_id})`,
        errors
      );
      if (success) ok++;
    }
    await pg.query("COMMIT");
    log(`meta_rule : ${ok}/${rows.length} lignes migrees (${errors.length} erreurs)`);
    errors.forEach((e) => log("  ! " + e));
  }

  await pg.end();
  sqlite.close();

  require("fs").writeFileSync(
    path.join(__dirname, "migration_report.txt"),
    report.join("\n"),
    "utf8"
  );
  log("\nRapport complet ecrit dans migration_report.txt");
}

main().catch((e) => {
  console.error("ERREUR FATALE :", e);
  process.exit(1);
});