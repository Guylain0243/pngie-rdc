const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Charge .env.test et ECRASE les variables deja presentes (notamment
// PNGIE_TEST_PASSWORD, susceptible d'etre polluee par une variable Windows
// persistante obsolete) AVANT de requerir helpers.js, qui lit
// process.env.PNGIE_TEST_PASSWORD des son chargement. Meme mecanisme que
// scripts/test-cycle-complet.js (chargerEnvForce).
function chargerEnvForce(nomFichier) {
  const p = path.join(__dirname, "..", "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}
chargerEnvForce(".env.test");

const { Client } = require("pg");
const { login, apiRequest, clearTokenCache, connexionAdmin, resolveInstitutionByCode } = require("./helpers");
// Institutions confirmees le 08/08/2026 (voir personne_role.scope_institution_id
// corrige pour les comptes de test) :
//   MI -> Interieur, Securite, Decentralisation et Affaires coutumieres (MIN_0)
//   SN -> Senat (SENAT)
let INSTITUTION_MI;

// Prï¿½-requis : scripts/prepare-cycle-test.js doit avoir ï¿½tï¿½ exï¿½cutï¿½ au moins une
// fois pour gï¿½nï¿½rer scripts/donnees-test-cycle.json (institutionId + typeActeId
// de COMMUNIQUE), exactement comme le fait scripts/test-cycle-complet.js.
const DONNEES_PATH = path.join(__dirname, "..", "..", "scripts", "donnees-test-cycle.json");

function chargerDonneesTest() {
  if (!fs.existsSync(DONNEES_PATH)) {
    throw new Error(
      `Fichier manquant : ${DONNEES_PATH}\n` +
      "Exï¿½cuter d'abord : node .\\scripts\\prepare-cycle-test.js"
    );
  }
  return JSON.parse(fs.readFileSync(DONNEES_PATH, "utf8"));
}

test("007 - Journal National - cycle de vie complet", async (t) => {
  clearTokenCache();
  const { institutionId, typeActeId } = chargerDonneesTest();
  const tokenPM = await login("PM");

  let acteId;

  await t.test("1. Crï¿½ation d'un acte (POST /api/journal/actes) -> 201", async () => {
    const res = await apiRequest(tokenPM, "POST", "/api/journal/actes", {
      typeActeId,
      institutionEmettriceId: institutionId,
      titre: "Communique de test E2E - 007",
      resume: "Test E2E automatise du cycle de vie d'un acte.",
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body?.data?.id, "La reponse doit contenir data.id");
    acteId = res.body.data.id;
  });

  await t.test("2. Transition refusee : publier directement un brouillon", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/publier`);
    assert.notStrictEqual(res.status, 200, "La publication d'un brouillon doit etre refusee");
  });

  await t.test("3. Soumission (brouillon -> soumis) -> 200", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/soumettre`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("4. Validation (soumis -> valide) -> 200", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/valider`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("5. Signature (valide -> signe) -> 200", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/signer`, {
      hashDocument: "hash-de-test-" + Date.now(),
      roleSignataire: "Primature",
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test("6. Publication (signe -> publie) attribue un numero officiel -> 200", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/publier`);
    assert.strictEqual(res.status, 200);
    const numero = res.body?.data?.numero_officiel;
    assert.ok(numero, "numero_officiel doit etre attribue a la publication");
    assert.match(numero, /^JN-\d{4}-\d{6}$/, "Format attendu JN-AAAA-NNNNNN");
  });

  await t.test("7. Modification refusee apres publication -> statut different de 200", async () => {
    const res = await apiRequest(tokenPM, "PUT", `/api/journal/actes/${acteId}`, {
      titre: "Tentative de modification apres publication",
    });
    assert.notStrictEqual(res.status, 200, "La modification d'un acte publie doit etre refusee");
  });

  await t.test("8. Archivage (publie -> archive) -> 200", async () => {
    const res = await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/archiver`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("9. Historique complet trace toutes les transitions", async () => {
    const res = await apiRequest(tokenPM, "GET", `/api/journal/actes/${acteId}/historique`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body?.data), "data doit etre un tableau d'evenements");
    assert.ok(res.body.data.length >= 5, `Attendu >= 5 evenements, obtenu ${res.body.data.length}`);
  });

  await t.test("10. Consultation d'un acte publie/archive reste possible (GET) -> 200", async () => {
    const res = await apiRequest(tokenPM, "GET", `/api/journal/actes/${acteId}`);
    assert.strictEqual(res.status, 200);
  });
});

test("007b - Journal National - RBAC refus permission manquante", async (t) => {
  await t.test("MI (emetteur) refuse (403) sur validation d'un acte", async () => {
    const { institutionId, typeActeId } = chargerDonneesTest();
    const tokenPM = await login("PM");
    const creation = await apiRequest(tokenPM, "POST", "/api/journal/actes", {
      typeActeId,
      institutionEmettriceId: institutionId,
      titre: "Acte pour test RBAC",
      resume: "Test refus permission.",
    });
    assert.strictEqual(creation.status, 201);
    const acteId = creation.body.data.id;
    await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/soumettre`);

    const tokenMI = await login("MI");
    const res = await apiRequest(tokenMI, "POST", `/api/journal/actes/${acteId}/valider`);
    assert.ok([403, 404].includes(res.status), `Attendu 403 ou 404 (refus RBAC ou acte hors de portee RLS), recu ${res.status}`);
  });
});

test("007c - Journal National - RLS institution vs national", async (t) => {
  const { typeActeId } = chargerDonneesTest();
  const tokenMI = await login("MI");
  INSTITUTION_MI = await resolveInstitutionByCode("MIN_0");
  let acteId;

  await t.test("Creation d'un acte scope institution MI -> 201", async () => {
    const res = await apiRequest(tokenMI, "POST", "/api/journal/actes", {
      typeActeId,
      institutionEmettriceId: INSTITUTION_MI,
      titre: "Acte scope institution - test RLS",
      resume: "Test RLS institution vs national.",
    });
    assert.strictEqual(res.status, 201);
    acteId = res.body.data.id;
  });

  await t.test("SN (autre institution) ne peut pas consulter cet acte", async () => {
    const tokenSN = await login("SN");
    const res = await apiRequest(tokenSN, "GET", `/api/journal/actes/${acteId}`);
    assert.notStrictEqual(res.status, 200, "SN ne doit pas voir un acte scope sur l'institution MI");
  });

  await t.test("PM (national) peut consulter cet acte", async () => {
    const tokenPM = await login("PM");
    const res = await apiRequest(tokenPM, "GET", `/api/journal/actes/${acteId}`);
    assert.strictEqual(res.status, 200, "PM (scope national) doit pouvoir consulter tout acte");
  });

  await t.test("MI (institution emettrice) peut consulter son propre acte", async () => {
    const res = await apiRequest(tokenMI, "GET", `/api/journal/actes/${acteId}`);
    assert.strictEqual(res.status, 200);
  });
});

test("007d - Journal National - trace dans journal_audit", async (t) => {
  const { institutionId, typeActeId } = chargerDonneesTest();
  const tokenPM = await login("PM");
  let acteId;

  await t.test("Creation d'un acte pour verification audit -> 201", async () => {
    const res = await apiRequest(tokenPM, "POST", "/api/journal/actes", {
      typeActeId,
      institutionEmettriceId: institutionId,
      titre: "Acte pour verification journal_audit",
      resume: "Test trace audit bas niveau.",
    });
    assert.strictEqual(res.status, 201);
    acteId = res.body.data.id;
  });

  await t.test("journal_audit contient au moins une ligne 'acte_officiel' pour cet acte", async () => {
    const client = await connexionAdmin();
    try {
      const r = await client.query(
        `SELECT action, valeurs_apres, created_at
         FROM journal_audit
         WHERE entite = 'acte_officiel' AND entite_ref_id = $1
         ORDER BY created_at`,
        [acteId]
      );
      assert.ok(r.rows.length >= 1, `Attendu >= 1 ligne d'audit pour l'acte ${acteId}, obtenu ${r.rows.length}`);
      assert.ok(r.rows[0].action, "La ligne d'audit doit avoir une action renseignee");
    } finally {
      await client.end();
    }
  });

  await t.test("journal_audit trace aussi la signature (entite acte_signature)", async () => {
    await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/soumettre`);
    await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/valider`);
    await apiRequest(tokenPM, "POST", `/api/journal/actes/${acteId}/signer`, {
      hashDocument: "hash-de-test-audit-" + Date.now(),
      roleSignataire: "Primature",
    });

    const client = await connexionAdmin();
    try {
      const r = await client.query(
        `SELECT action, valeurs_apres, created_at
         FROM journal_audit
         WHERE entite = 'acte_signature'
           AND created_at >= now() - interval '2 minutes'
         ORDER BY created_at DESC
         LIMIT 5`
      );
      assert.ok(r.rows.length >= 1, "Attendu au moins une ligne d'audit recente pour l'entite acte_signature");
    } finally {
      await client.end();
    }
  });
});


