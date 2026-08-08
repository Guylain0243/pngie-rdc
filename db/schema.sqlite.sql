-- Équivalent SQLite du schéma PostgreSQL (db/schema.sql) — pour démo locale exécutable.
-- En production réelle : utiliser schema.sql sur PostgreSQL.
PRAGMA foreign_keys = ON;

CREATE TABLE pouvoir (
  pouvoir_id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, libelle TEXT NOT NULL
);

CREATE TABLE organization_type (
  id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, libelle TEXT NOT NULL,
  pouvoir_id INTEGER REFERENCES pouvoir(pouvoir_id)
);

CREATE TABLE organization (
  organization_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  type_id INTEGER NOT NULL REFERENCES organization_type(id),
  parent_id TEXT REFERENCES organization(organization_id),
  niveau INTEGER NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  description TEXT
);

CREATE TABLE unit (
  unit_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  parent_unit_id TEXT REFERENCES unit(unit_id),
  code TEXT, nom TEXT NOT NULL, type TEXT, ordre INTEGER DEFAULT 0
);

CREATE TABLE position (
  position_id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES unit(unit_id),
  titre TEXT NOT NULL, niveau INTEGER, role_defaut_id TEXT REFERENCES role(role_id), autorite TEXT
);

CREATE TABLE assignment (
  assignment_id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  position_id TEXT NOT NULL REFERENCES position(position_id),
  date_debut TEXT, date_fin TEXT, statut TEXT DEFAULT 'ACTIF'
);

CREATE TABLE mission (
  mission_id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL
);

CREATE TABLE organization_mission (
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  mission_id TEXT NOT NULL REFERENCES mission(mission_id),
  PRIMARY KEY (organization_id, mission_id)
);

CREATE TABLE programme (
  programme_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organization(organization_id),
  nom TEXT NOT NULL,
  description TEXT,
  date_debut TEXT,
  date_fin TEXT,
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  budget_usd REAL
);

CREATE TABLE projet (
  projet_id TEXT PRIMARY KEY,
  programme_id TEXT REFERENCES programme(programme_id),
  organization_id TEXT REFERENCES organization(organization_id),
  nom TEXT NOT NULL,
  description TEXT,
  date_debut TEXT,
  date_fin_prevue TEXT,
  avancement_pct REAL NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  budget_usd REAL
);

CREATE TABLE process (
  process_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organization(organization_id),
  nom TEXT NOT NULL, version TEXT DEFAULT '1.0'
);

CREATE TABLE process_step (
  step_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL REFERENCES process(process_id),
  ordre INTEGER NOT NULL, nom TEXT NOT NULL, acteur_role TEXT
);

CREATE TABLE portal (
  portal_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  nom TEXT NOT NULL, theme_couleur TEXT
);

CREATE TABLE dashboard (
  dashboard_id TEXT PRIMARY KEY,
  portal_id TEXT NOT NULL REFERENCES portal(portal_id),
  nom TEXT NOT NULL, type TEXT
);

CREATE TABLE module (
  module_id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES dashboard(dashboard_id),
  nom TEXT NOT NULL, categorie TEXT
);

CREATE TABLE menu (
  menu_id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES module(module_id),
  parent_menu_id TEXT REFERENCES menu(menu_id),
  libelle TEXT NOT NULL, icone TEXT, ordre INTEGER DEFAULT 0
);

CREATE TABLE page (
  page_id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL REFERENCES menu(menu_id),
  nom TEXT NOT NULL, route TEXT NOT NULL, composant TEXT,
  permission_code TEXT REFERENCES permission(code)
);

CREATE TABLE widget (
  widget_id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES page(page_id),
  type TEXT, position INTEGER, largeur INTEGER, hauteur INTEGER
);

CREATE TABLE kpi (
  kpi_id TEXT PRIMARY KEY,
  widget_id TEXT REFERENCES widget(widget_id),
  nom TEXT NOT NULL, formule TEXT, source TEXT, frequence TEXT
);

CREATE TABLE kpi_valeur (
  kpi_valeur_id TEXT PRIMARY KEY,
  kpi_id TEXT NOT NULL REFERENCES kpi(kpi_id),
  organization_id TEXT REFERENCES organization(organization_id),
  valeur REAL,
  periode TEXT,
  mesure_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE role (
  role_id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, nom TEXT NOT NULL, categorie TEXT
);

CREATE TABLE permission (
  permission_id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, nom TEXT NOT NULL
);

CREATE TABLE role_permission (
  role_id TEXT REFERENCES role(role_id),
  permission_id TEXT REFERENCES permission(permission_id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE person (
  person_id TEXT PRIMARY KEY,
  matricule TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE person_role (
  person_role_id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES person(person_id),
  role_id TEXT REFERENCES role(role_id),
  scope_org_id TEXT REFERENCES organization(organization_id)
);

CREATE TABLE responsabilite (
  responsabilite_id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  categorie TEXT
);

CREATE TABLE organization_responsabilite (
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  responsabilite_id TEXT NOT NULL REFERENCES responsabilite(responsabilite_id),
  PRIMARY KEY (organization_id, responsabilite_id)
);

CREATE TABLE gov_relation (
  gov_relation_id TEXT PRIMARY KEY,
  source_org_id TEXT NOT NULL REFERENCES organization(organization_id),
  target_org_id TEXT NOT NULL REFERENCES organization(organization_id),
  type_relation TEXT NOT NULL
);

CREATE TABLE ai_agent (
  agent_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organization(organization_id),
  nom TEXT NOT NULL,
  role_ia TEXT,
  modele TEXT DEFAULT 'claude-sonnet-5',
  system_prompt TEXT,
  permission_code TEXT REFERENCES permission(code),
  statut TEXT DEFAULT 'ACTIF'
);

CREATE TABLE ai_conversation (
  conversation_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES ai_agent(agent_id),
  person_id TEXT NOT NULL REFERENCES person(person_id),
  started_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ai_message (
  message_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversation(conversation_id),
  role TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE nocode_app (
  app_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  nom TEXT NOT NULL,
  type TEXT,
  definition_json TEXT NOT NULL,
  cree_par TEXT REFERENCES person(person_id),
  statut TEXT DEFAULT 'BROUILLON',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE nocode_submission (
  submission_id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES nocode_app(app_id),
  person_id TEXT REFERENCES person(person_id),
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE audit_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT REFERENCES person(person_id),
  action TEXT NOT NULL,
  entite TEXT,
  entite_id TEXT,
  detail TEXT,
  hash_prec TEXT,
  hash_actuel TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Cycle de gouvernance : instruction → exécution → rapport → contrôle → décision ──
CREATE TABLE instruction (
  instruction_id TEXT PRIMARY KEY,
  emetteur_org_id TEXT NOT NULL REFERENCES organization(organization_id),
  destinataire_org_id TEXT NOT NULL REFERENCES organization(organization_id),
  titre TEXT NOT NULL,
  contenu TEXT,
  type TEXT DEFAULT 'DIRECTIVE',
  echeance TEXT,
  statut TEXT NOT NULL DEFAULT 'EMISE',
  created_by TEXT REFERENCES person(person_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE plan_action (
  plan_action_id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL REFERENCES instruction(instruction_id),
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  titre TEXT NOT NULL,
  statut TEXT DEFAULT 'PLANIFIE'
);

CREATE TABLE activite (
  activite_id TEXT PRIMARY KEY,
  plan_action_id TEXT NOT NULL REFERENCES plan_action(plan_action_id),
  nom TEXT NOT NULL,
  avancement_pct INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rapport (
  rapport_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  destinataire_org_id TEXT REFERENCES organization(organization_id),
  instruction_id TEXT REFERENCES instruction(instruction_id),
  plan_action_id TEXT REFERENCES plan_action(plan_action_id),
  titre TEXT NOT NULL,
  synthese TEXT,
  periode TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE controle (
  controle_id TEXT PRIMARY KEY,
  organe_controle_id TEXT NOT NULL REFERENCES organization(organization_id),
  organisation_controlee_id TEXT NOT NULL REFERENCES organization(organization_id),
  type TEXT,
  objet TEXT,
  statut TEXT DEFAULT 'PLANIFIE'
);

CREATE TABLE audit_mission (
  audit_id TEXT PRIMARY KEY,
  controle_id TEXT NOT NULL REFERENCES controle(controle_id),
  perimetre TEXT,
  conclusion TEXT,
  rapport_final TEXT
);

CREATE TABLE recommandation (
  recommandation_id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audit_mission(audit_id),
  libelle TEXT NOT NULL,
  priorite TEXT DEFAULT 'MOYENNE',
  organisation_responsable_id TEXT REFERENCES organization(organization_id)
);

CREATE TABLE decision (
  decision_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  recommandation_id TEXT REFERENCES recommandation(recommandation_id),
  rapport_id TEXT REFERENCES rapport(rapport_id),
  titre TEXT NOT NULL,
  type TEXT,
  decidee_par TEXT REFERENCES person(person_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE suivi (
  suivi_id TEXT PRIMARY KEY,
  recommandation_id TEXT REFERENCES recommandation(recommandation_id),
  decision_id TEXT REFERENCES decision(decision_id),
  statut TEXT NOT NULL DEFAULT 'OUVERT',
  commentaire TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Registre des logiciels externes intégrés via API/ESB ──
CREATE TABLE systeme_externe (
  systeme_id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  fournisseur TEXT,
  protocole TEXT,
  statut_connexion TEXT DEFAULT 'NON_CONNECTE',
  organization_id TEXT REFERENCES organization(organization_id)
);

CREATE TABLE integration_flux (
  flux_id TEXT PRIMARY KEY,
  systeme_id TEXT NOT NULL REFERENCES systeme_externe(systeme_id),
  sens TEXT NOT NULL,
  objet TEXT,
  frequence TEXT
);

-- ── Référentiels transversaux ──
CREATE TABLE lieu (
  lieu_id TEXT PRIMARY KEY,
  parent_lieu_id TEXT REFERENCES lieu(lieu_id),
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  organization_id TEXT REFERENCES organization(organization_id)
);

CREATE TABLE emploi_type (
  emploi_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  intitule TEXT NOT NULL,
  categorie TEXT
);

CREATE TABLE competence (
  competence_id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT
);

CREATE TABLE position_competence (
  position_id TEXT REFERENCES position(position_id),
  competence_id TEXT REFERENCES competence(competence_id),
  niveau_requis TEXT,
  PRIMARY KEY (position_id, competence_id)
);

CREATE TABLE document_type (
  document_type_id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  duree_conservation_ans INTEGER,
  regle_archivage TEXT
);

CREATE TABLE document (
  document_id TEXT PRIMARY KEY,
  document_type_id TEXT REFERENCES document_type(document_type_id),
  organization_id TEXT REFERENCES organization(organization_id),
  titre TEXT NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE service_numerique (
  service_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  nom TEXT NOT NULL,
  description TEXT,
  url TEXT,
  statut TEXT DEFAULT 'ACTIF'
);
-- ════════════════════════════════════════════════════════════════
-- Équivalent SQLite — EXTENSION DU SCHÉMA — Domaines sectoriels + Sécurité renforcée
-- À charger après schema.sql (référence organization, lieu, person, document, decision)
-- ════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- 10. DOMAINE JUSTICE
-- ───────────────────────────────────────────────

CREATE TABLE tribunal (
  tribunal_id     TEXT PRIMARY KEY,
  nom             VARCHAR(150) NOT NULL,
  type            VARCHAR(30) NOT NULL CHECK (type IN
                  ('COUR_CONSTITUTIONNELLE','COUR_CASSATION','COUR_APPEL','TRIBUNAL_GRANDE_INSTANCE','TRIBUNAL_PAIX','PARQUET')),
  lieu_id         TEXT REFERENCES lieu(lieu_id),
  organization_id TEXT REFERENCES organization(organization_id)
);

CREATE TABLE magistrat (
  magistrat_id  TEXT PRIMARY KEY,
  person_id     TEXT NOT NULL REFERENCES person(person_id),
  tribunal_id   TEXT NOT NULL REFERENCES tribunal(tribunal_id),
  fonction      VARCHAR(60) NOT NULL, -- Président, Juge, Procureur, Substitut, Greffier
  date_nomination DATE
);

CREATE TABLE dossier_judiciaire (
  dossier_id      TEXT PRIMARY KEY,
  numero_dossier  VARCHAR(50) UNIQUE NOT NULL,
  tribunal_id     TEXT NOT NULL REFERENCES tribunal(tribunal_id),
  nature          VARCHAR(30) NOT NULL CHECK (nature IN ('CIVIL','PENAL','COMMERCIAL','ADMINISTRATIF','SOCIAL')),
  statut          VARCHAR(20) NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT','EN_COURS','JUGE','ARCHIVE','TRANSMIS')),
  date_ouverture  DATE NOT NULL DEFAULT current_date,
  ref_police_rdc  VARCHAR(50) -- lien vers une enquête d'origine, si transmise par la Police
);
CREATE INDEX idx_dossier_tribunal ON dossier_judiciaire(tribunal_id);

CREATE TABLE jugement (
  jugement_id   TEXT PRIMARY KEY,
  dossier_id    TEXT NOT NULL REFERENCES dossier_judiciaire(dossier_id),
  magistrat_id  TEXT NOT NULL REFERENCES magistrat(magistrat_id),
  date_jugement DATE NOT NULL,
  decision_rendue TEXT NOT NULL,
  voie_recours  VARCHAR(20) CHECK (voie_recours IN ('AUCUNE','APPEL','CASSATION'))
);
CREATE INDEX idx_jugement_dossier ON jugement(dossier_id);

-- ───────────────────────────────────────────────
-- 11. DOMAINE SANTÉ
-- ───────────────────────────────────────────────

CREATE TABLE etablissement_sante (
  etablissement_id TEXT PRIMARY KEY,
  nom              VARCHAR(200) NOT NULL,
  type             VARCHAR(30) NOT NULL CHECK (type IN
                   ('HOPITAL_GENERAL','HOPITAL_REFERENCE','CENTRE_SANTE','POSTE_SANTE','CLINIQUE','PHARMACIE')),
  lieu_id          TEXT REFERENCES lieu(lieu_id),
  capacite_lits    INT,
  statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);

CREATE TABLE patient (
  patient_id     TEXT PRIMARY KEY,
  numero_national VARCHAR(20) UNIQUE, -- lien optionnel vers le registre national d'identité
  nom            VARCHAR(100) NOT NULL,
  prenom         VARCHAR(100),
  date_naissance DATE,
  sexe           TEXT CHECK (sexe IN ('M','F'))
);

CREATE TABLE consultation (
  consultation_id  TEXT PRIMARY KEY,
  patient_id       TEXT NOT NULL REFERENCES patient(patient_id),
  etablissement_id TEXT NOT NULL REFERENCES etablissement_sante(etablissement_id),
  personnel_person_id TEXT REFERENCES person(person_id), -- agent médical, lié au registre RH de l'État
  date_consultation TEXT NOT NULL DEFAULT (datetime('now')),
  motif            TEXT,
  diagnostic       TEXT
);
CREATE INDEX idx_consult_patient ON consultation(patient_id);
CREATE INDEX idx_consult_etab    ON consultation(etablissement_id);

CREATE TABLE campagne_vaccination (
  campagne_id      TEXT PRIMARY KEY,
  nom              VARCHAR(150) NOT NULL,
  maladie_cible    VARCHAR(100) NOT NULL,
  date_debut       DATE NOT NULL,
  date_fin         DATE,
  lieu_id          TEXT REFERENCES lieu(lieu_id),
  nb_doses_prevues INT,
  nb_doses_administrees INT DEFAULT 0
);

-- ───────────────────────────────────────────────
-- 12. DOMAINE ÉCONOMIE (Entreprises, Mines, Agriculture, Énergie, Infrastructures, Cadastre)
-- ───────────────────────────────────────────────

CREATE TABLE entreprise (
  entreprise_id   TEXT PRIMARY KEY,
  raison_sociale  VARCHAR(200) NOT NULL,
  numero_rccm     VARCHAR(50) UNIQUE, -- Registre du Commerce et du Crédit Mobilier
  secteur         VARCHAR(60),
  capital_etat_pct REAL DEFAULT 0, -- participation de l'État, si entreprise publique/mixte
  lieu_siege_id   TEXT REFERENCES lieu(lieu_id),
  statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);

CREATE TABLE permis_minier (
  permis_id       TEXT PRIMARY KEY,
  numero_permis   VARCHAR(50) UNIQUE NOT NULL,
  entreprise_id   TEXT NOT NULL REFERENCES entreprise(entreprise_id),
  substance       VARCHAR(60) NOT NULL, -- cobalt, coltan, lithium, or, diamant, cuivre...
  lieu_id         TEXT REFERENCES lieu(lieu_id),
  date_octroi     DATE NOT NULL,
  date_expiration DATE,
  statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','SUSPENDU','EXPIRE','REVOQUE'))
);

CREATE TABLE exploitation_agricole (
  exploitation_id TEXT PRIMARY KEY,
  nom             VARCHAR(150),
  lieu_id         TEXT REFERENCES lieu(lieu_id),
  superficie_ha   REAL,
  filiere         VARCHAR(60), -- café, cacao, manioc, maïs, élevage...
  proprietaire    VARCHAR(200)
);

CREATE TABLE projet_energie (
  projet_energie_id TEXT PRIMARY KEY,
  nom               VARCHAR(150) NOT NULL,
  type              VARCHAR(30) CHECK (type IN ('HYDROELECTRIQUE','SOLAIRE','THERMIQUE','HYDROCARBURES','RESEAU_DISTRIBUTION')),
  lieu_id           TEXT REFERENCES lieu(lieu_id),
  capacite_mw       REAL,
  statut            VARCHAR(20) DEFAULT 'EN_SERVICE'
);

CREATE TABLE infrastructure_projet (
  infra_projet_id TEXT PRIMARY KEY,
  nom             VARCHAR(150) NOT NULL,
  type            VARCHAR(30) CHECK (type IN ('ROUTE','PONT','PORT','AEROPORT','CHEMIN_FER')),
  lieu_id         TEXT REFERENCES lieu(lieu_id),
  budget_usd      REAL,
  avancement_pct  REAL DEFAULT 0,
  statut          VARCHAR(20) DEFAULT 'EN_ETUDE' CHECK (statut IN ('EN_ETUDE','EN_TRAVAUX','LIVRE','SUSPENDU'))
);

CREATE TABLE parcelle_cadastrale (
  parcelle_id     TEXT PRIMARY KEY,
  reference       VARCHAR(50) UNIQUE NOT NULL,
  lieu_id         TEXT REFERENCES lieu(lieu_id),
  superficie_m2   REAL,
  titre_foncier   VARCHAR(50),
  proprietaire    VARCHAR(200),
  litige_en_cours BOOLEAN NOT NULL DEFAULT false
);

-- ───────────────────────────────────────────────
-- 13. SÉCURITÉ RENFORCÉE — MFA et PKI
--     (mfa_enabled/mfa_secret existent déjà sur `person`; on ajoute ici
--      la journalisation des évènements MFA, les codes de secours,
--      et le registre de certificats/signatures PKI)
-- ───────────────────────────────────────────────

CREATE TABLE mfa_backup_code (
  code_id     TEXT PRIMARY KEY,
  person_id   TEXT NOT NULL REFERENCES person(person_id),
  code_hash   TEXT NOT NULL, -- haché (bcrypt), jamais stocké en clair
  utilise     BOOLEAN NOT NULL DEFAULT false,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mfa_backup_person ON mfa_backup_code(person_id);

CREATE TABLE mfa_event (
  event_id    TEXT PRIMARY KEY,
  person_id   TEXT NOT NULL REFERENCES person(person_id),
  type        VARCHAR(20) NOT NULL CHECK (type IN ('CHALLENGE_ENVOYE','VALIDE','ECHOUE','CODE_SECOURS_UTILISE')),
  ip_adresse  VARCHAR(45),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mfa_event_person ON mfa_event(person_id);

CREATE TABLE pki_certificate (
  certificate_id   TEXT PRIMARY KEY,
  person_id        TEXT NOT NULL REFERENCES person(person_id),
  numero_serie     VARCHAR(80) UNIQUE NOT NULL,
  autorite_emettrice VARCHAR(100) NOT NULL DEFAULT 'PKI Nationale RDC',
  cle_publique     TEXT NOT NULL,
  date_emission    TEXT NOT NULL DEFAULT (datetime('now')),
  date_expiration  TEXT NOT NULL,
  statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','REVOQUE','EXPIRE'))
);
CREATE INDEX idx_pki_cert_person ON pki_certificate(person_id);

CREATE TABLE pki_signature (
  signature_id    TEXT PRIMARY KEY,
  certificate_id  TEXT NOT NULL REFERENCES pki_certificate(certificate_id),
  document_id     TEXT REFERENCES document(document_id),
  decision_id     TEXT REFERENCES decision(decision_id),
  signature_hash  TEXT NOT NULL, -- empreinte cryptographique du document signé
  signed_at       TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (document_id IS NOT NULL OR decision_id IS NOT NULL) -- une signature porte sur au moins un objet
);
CREATE INDEX idx_pki_sig_cert ON pki_signature(certificate_id);

-- ═══ FIN DE L'EXTENSION — 18 nouvelles tables (4 Justice, 4 Santé, 6 Économie, 4 Sécurité) ═══
