// Peuple les 18 nouvelles tables (Justice, Santé, Économie, Sécurité renforcée)
// Usage : après db/seed.js, exécuter `node db/seed-extension.js`
const db = require('../src/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const uuid = () => crypto.randomUUID();

async function seedExtension() {
  const lieu = await db.get(`SELECT lieu_id FROM lieu LIMIT 1`);
  const org = await db.get(`SELECT organization_id FROM organization LIMIT 1`);
  const person = await db.get(`SELECT person_id FROM person LIMIT 1`);
  const lieuId = lieu ? lieu.lieu_id : null;
  const orgId = org ? org.organization_id : null;
  let doc = await db.get(`SELECT document_id FROM document LIMIT 1`);
  if (!doc && orgId) {
    // Le seed de base ne peuple jamais `document` — on insère un document de
    // démonstration pour que pki_signature ait quelque chose de réel à référencer.
    const demoDocId = uuid();
    await db.run(
      `INSERT INTO document (document_id, organization_id, titre, reference) VALUES (?,?,?,?)`,
      [demoDocId, orgId, 'Décision de nomination — pilote démonstration', 'DOC-2027-DEMO-001']
    );
    doc = { document_id: demoDocId };
  }
  const personId = person ? person.person_id : null;

  // --- Justice ---
  const tribId = uuid();
  await db.run(
    `INSERT INTO tribunal (tribunal_id, nom, type, lieu_id, organization_id) VALUES (?,?,?,?,?)`,
    [tribId, 'Tribunal de Grande Instance de Kinshasa/Gombe', 'TRIBUNAL_GRANDE_INSTANCE', lieuId, orgId]
  );

  if (personId) {
    const magId = uuid();
    await db.run(
      `INSERT INTO magistrat (magistrat_id, person_id, tribunal_id, fonction, date_nomination) VALUES (?,?,?,?,?)`,
      [magId, personId, tribId, 'Président', '2022-01-15']
    );

    const dossierId = uuid();
    await db.run(
      `INSERT INTO dossier_judiciaire (dossier_id, numero_dossier, tribunal_id, nature, statut) VALUES (?,?,?,?,?)`,
      [dossierId, 'RG-2027-000123', tribId, 'PENAL', 'EN_COURS']
    );

    await db.run(
      `INSERT INTO jugement (jugement_id, dossier_id, magistrat_id, date_jugement, decision_rendue, voie_recours) VALUES (?,?,?,?,?,?)`,
      [uuid(), dossierId, magId, '2027-06-10', 'Condamnation avec sursis', 'APPEL']
    );
  }

  // --- Santé ---
  const etabId = uuid();
  await db.run(
    `INSERT INTO etablissement_sante (etablissement_id, nom, type, lieu_id, capacite_lits) VALUES (?,?,?,?,?)`,
    [etabId, 'Hôpital Général de Référence de Kinshasa', 'HOPITAL_REFERENCE', lieuId, 450]
  );

  const patientId = uuid();
  await db.run(
    `INSERT INTO patient (patient_id, nom, prenom, date_naissance, sexe) VALUES (?,?,?,?,?)`,
    [patientId, 'Kabongo', 'Alice', '1990-04-12', 'F']
  );

  await db.run(
    `INSERT INTO consultation (consultation_id, patient_id, etablissement_id, personnel_person_id, motif, diagnostic) VALUES (?,?,?,?,?,?)`,
    [uuid(), patientId, etabId, personId, 'Consultation prénatale', 'RAS']
  );

  await db.run(
    `INSERT INTO campagne_vaccination (campagne_id, nom, maladie_cible, date_debut, date_fin, lieu_id, nb_doses_prevues, nb_doses_administrees) VALUES (?,?,?,?,?,?,?,?)`,
    [uuid(), 'Campagne Rougeole 2027', 'Rougeole', '2027-03-01', '2027-04-15', lieuId, 500000, 210000]
  );

  // --- Économie ---
  const entId = uuid();
  await db.run(
    `INSERT INTO entreprise (entreprise_id, raison_sociale, numero_rccm, secteur, capital_etat_pct, lieu_siege_id) VALUES (?,?,?,?,?,?)`,
    [entId, 'Gécamines SA', 'CD/KIN/RCCM/22-B-0001', 'Mines', 100, lieuId]
  );

  await db.run(
    `INSERT INTO permis_minier (permis_id, numero_permis, entreprise_id, substance, lieu_id, date_octroi, statut) VALUES (?,?,?,?,?,?,?)`,
    [uuid(), 'PE-2020-4471', entId, 'Cobalt', lieuId, '2020-05-01', 'ACTIF']
  );

  await db.run(
    `INSERT INTO exploitation_agricole (exploitation_id, nom, lieu_id, superficie_ha, filiere, proprietaire) VALUES (?,?,?,?,?,?)`,
    [uuid(), 'Coopérative Agricole du Kwilu', lieuId, 320.5, 'Manioc', 'Coopérative locale']
  );

  await db.run(
    `INSERT INTO projet_energie (projet_energie_id, nom, type, lieu_id, capacite_mw, statut) VALUES (?,?,?,?,?,?)`,
    [uuid(), 'Barrage Inga III (phase 1)', 'HYDROELECTRIQUE', lieuId, 4800, 'EN_SERVICE']
  );

  await db.run(
    `INSERT INTO infrastructure_projet (infra_projet_id, nom, type, lieu_id, budget_usd, avancement_pct, statut) VALUES (?,?,?,?,?,?,?)`,
    [uuid(), 'Route Nationale 1 — Tronçon Kinshasa-Matadi', 'ROUTE', lieuId, 320000000, 45, 'EN_TRAVAUX']
  );

  await db.run(
    `INSERT INTO parcelle_cadastrale (parcelle_id, reference, lieu_id, superficie_m2, titre_foncier, proprietaire) VALUES (?,?,?,?,?,?)`,
    [uuid(), 'KIN-GOMBE-00452', lieuId, 1200, 'TF-88213', 'État congolais']
  );

  // --- Sécurité MFA/PKI ---
  if (personId) {
    const codeHash = await bcrypt.hash('BACKUP-CODE-DEMO-0001', 10);
    await db.run(
      `INSERT INTO mfa_backup_code (code_id, person_id, code_hash) VALUES (?,?,?)`,
      [uuid(), personId, codeHash]
    );

    await db.run(
      `INSERT INTO mfa_event (event_id, person_id, type, ip_adresse) VALUES (?,?,?,?)`,
      [uuid(), personId, 'VALIDE', '127.0.0.1']
    );

    const certId = uuid();
    await db.run(
      `INSERT INTO pki_certificate (certificate_id, person_id, numero_serie, cle_publique, date_expiration) VALUES (?,?,?,?,?)`,
      [certId, personId, 'PKI-RDC-2027-000001', '-----BEGIN PUBLIC KEY----- (démo) -----END PUBLIC KEY-----', '2029-01-01']
    );

    if (doc) {
      await db.run(
        `INSERT INTO pki_signature (signature_id, certificate_id, document_id, signature_hash) VALUES (?,?,?,?)`,
        [uuid(), certId, doc.document_id, 'sha256:demo0000']
      );
    }
  }

  console.log('✓ Extension peuplée : Justice, Santé, Économie, Sécurité MFA/PKI');
}

if (require.main === module) {
  seedExtension().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
module.exports = seedExtension;
