-- Ã‰quivalent SQLite du schÃ©ma PostgreSQL (db/schema.sql) â€” pour dÃ©mo locale exÃ©cutable.
-- En production rÃ©elle : utiliser schema.sql sur PostgreSQL.
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
  permission_id TEXT PRIMARY KEY, role_id TEXT NOT NULL REFERENCES role(role_id), entite TEXT NOT NULL, action TEXT NOT NULL
);
CREATE INDEX idx_permission_role ON permission(role_id);

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

-- â”€â”€ Cycle de gouvernance : instruction â†’ exÃ©cution â†’ rapport â†’ contrÃ´le â†’ dÃ©cision â”€â”€
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

-- â”€â”€ Registre des logiciels externes intÃ©grÃ©s via API/ESB â”€â”€
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

-- â”€â”€ RÃ©fÃ©rentiels transversaux â”€â”€
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
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Ã‰quivalent SQLite â€” EXTENSION DU SCHÃ‰MA â€” Domaines sectoriels + SÃ©curitÃ© renforcÃ©e
-- Ã€ charger aprÃ¨s schema.sql (rÃ©fÃ©rence organization, lieu, person, document, decision)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 10. DOMAINE JUSTICE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  fonction      VARCHAR(60) NOT NULL, -- PrÃ©sident, Juge, Procureur, Substitut, Greffier
  date_nomination DATE
);

CREATE TABLE dossier_judiciaire (
  dossier_id      TEXT PRIMARY KEY,
  numero_dossier  VARCHAR(50) UNIQUE NOT NULL,
  tribunal_id     TEXT NOT NULL REFERENCES tribunal(tribunal_id),
  nature          VARCHAR(30) NOT NULL CHECK (nature IN ('CIVIL','PENAL','COMMERCIAL','ADMINISTRATIF','SOCIAL')),
  statut          VARCHAR(20) NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT','EN_COURS','JUGE','ARCHIVE','TRANSMIS')),
  date_ouverture  DATE NOT NULL DEFAULT current_date,
  ref_police_rdc  VARCHAR(50) -- lien vers une enquÃªte d'origine, si transmise par la Police
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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 11. DOMAINE SANTÃ‰
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  numero_national VARCHAR(20) UNIQUE, -- lien optionnel vers le registre national d'identitÃ©
  nom            VARCHAR(100) NOT NULL,
  prenom         VARCHAR(100),
  date_naissance DATE,
  sexe           TEXT CHECK (sexe IN ('M','F'))
);

CREATE TABLE consultation (
  consultation_id  TEXT PRIMARY KEY,
  patient_id       TEXT NOT NULL REFERENCES patient(patient_id),
  etablissement_id TEXT NOT NULL REFERENCES etablissement_sante(etablissement_id),
  personnel_person_id TEXT REFERENCES person(person_id), -- agent mÃ©dical, liÃ© au registre RH de l'Ã‰tat
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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 12. DOMAINE Ã‰CONOMIE (Entreprises, Mines, Agriculture, Ã‰nergie, Infrastructures, Cadastre)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE entreprise (
  entreprise_id   TEXT PRIMARY KEY,
  raison_sociale  VARCHAR(200) NOT NULL,
  numero_rccm     VARCHAR(50) UNIQUE, -- Registre du Commerce et du CrÃ©dit Mobilier
  secteur         VARCHAR(60),
  capital_etat_pct REAL DEFAULT 0, -- participation de l'Ã‰tat, si entreprise publique/mixte
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
  filiere         VARCHAR(60), -- cafÃ©, cacao, manioc, maÃ¯s, Ã©levage...
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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 13. SÃ‰CURITÃ‰ RENFORCÃ‰E â€” MFA et PKI
--     (mfa_enabled/mfa_secret existent dÃ©jÃ  sur `person`; on ajoute ici
--      la journalisation des Ã©vÃ¨nements MFA, les codes de secours,
--      et le registre de certificats/signatures PKI)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE mfa_backup_code (
  code_id     TEXT PRIMARY KEY,
  person_id   TEXT NOT NULL REFERENCES person(person_id),
  code_hash   TEXT NOT NULL, -- hachÃ© (bcrypt), jamais stockÃ© en clair
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
  signature_hash  TEXT NOT NULL, -- empreinte cryptographique du document signÃ©
  signed_at       TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (document_id IS NOT NULL OR decision_id IS NOT NULL) -- une signature porte sur au moins un objet
);
CREATE INDEX idx_pki_sig_cert ON pki_signature(certificate_id);

-- â•â•â• FIN DE L'EXTENSION â€” 18 nouvelles tables (4 Justice, 4 SantÃ©, 6 Ã‰conomie, 4 SÃ©curitÃ©) â•â•â•

-- ============================================
-- Sprint 2C - 31 tables ajoutees (motifs A-D)
-- Generees automatiquement, voir docs/sprint-2c/
-- ============================================


-- Table: acte_historique
CREATE TABLE acte_historique (
  id INTEGER PRIMARY KEY,
  acte_id TEXT NOT NULL REFERENCES acte_officiel(id),
  type_evenement TEXT NOT NULL,
  valeur_avant TEXT,
  valeur_apres TEXT,
  modifie_par TEXT REFERENCES personne(personne_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_acte_historique_acte ON acte_historique(acte_id);
CREATE INDEX idx_acte_historique_modifie_par ON acte_historique(modifie_par);


-- Table: acte_officiel
CREATE TABLE acte_officiel (
  id TEXT PRIMARY KEY,
  numero_officiel TEXT,
  type_acte_id INTEGER NOT NULL REFERENCES type_acte_ref(id),
  institution_emettrice_id TEXT NOT NULL REFERENCES institution(institution_id),
  titre TEXT NOT NULL,
  resume TEXT,
  contenu_texte TEXT,
  document_pdf_id TEXT REFERENCES document(document_id),
  statut TEXT NOT NULL DEFAULT 'brouillon',
  diffusion TEXT NOT NULL DEFAULT 'restreint',
  acte_reference_id TEXT REFERENCES acte_officiel(id),
  date_signature TEXT,
  date_publication TEXT,
  date_entree_vigueur TEXT,
  cree_par TEXT NOT NULL REFERENCES personne(personne_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  recherche_tsv TEXT
);
CREATE INDEX idx_acte_officiel_type_acte ON acte_officiel(type_acte_id);
CREATE INDEX idx_acte_officiel_institution_emettrice ON acte_officiel(institution_emettrice_id);
CREATE INDEX idx_acte_officiel_document_pdf ON acte_officiel(document_pdf_id);
CREATE INDEX idx_acte_officiel_acte_reference ON acte_officiel(acte_reference_id);
CREATE INDEX idx_acte_officiel_cree_par ON acte_officiel(cree_par);


-- Table: acte_signature
CREATE TABLE acte_signature (
  id TEXT PRIMARY KEY,
  acte_id TEXT NOT NULL REFERENCES acte_officiel(id),
  signataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  role_signataire TEXT,
  date_signature TEXT NOT NULL DEFAULT (datetime('now')),
  hash_document TEXT NOT NULL,
  certificat_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_acte_signature_acte ON acte_signature(acte_id);
CREATE INDEX idx_acte_signature_signataire ON acte_signature(signataire_id);


-- Table: affectation
CREATE TABLE affectation (
  affectation_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  poste_id TEXT NOT NULL REFERENCES poste(poste_id),
  type_affectation TEXT NOT NULL DEFAULT 'TITULAIRE',
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  texte_nomination TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_affectation_personne ON affectation(personne_id);
CREATE INDEX idx_affectation_poste ON affectation(poste_id);


-- Table: agent
CREATE TABLE agent (
  agent_id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance TEXT NOT NULL,
  matricule TEXT NOT NULL,
  numero_identite_nationale TEXT,
  sexe TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  grade_id TEXT,
  corps_id TEXT,
  personne_id TEXT REFERENCES personne(personne_id),
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_institution ON agent(institution_id);
CREATE INDEX idx_agent_personne ON agent(personne_id);


-- Table: agent_ia
CREATE TABLE agent_ia (
  agent_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_agent TEXT NOT NULL,
  institution_id TEXT REFERENCES institution(institution_id),
  modele_reference TEXT,
  perimetre_donnees TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_ia_institution ON agent_ia(institution_id);


-- Table: agent_ia_interaction
CREATE TABLE agent_ia_interaction (
  interaction_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_ia(agent_id),
  personne_id TEXT REFERENCES personne(personne_id),
  requete TEXT NOT NULL,
  reponse TEXT,
  entite_liee TEXT,
  entite_liee_ref_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_ia_interaction_agent ON agent_ia_interaction(agent_id);
CREATE INDEX idx_agent_ia_interaction_personne ON agent_ia_interaction(personne_id);


-- Table: decision_action
CREATE TABLE decision_action (
  action_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decision_gouvernementale(decision_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  statut TEXT NOT NULL DEFAULT 'NON_DEMARREE',
  taux_execution INTEGER NOT NULL DEFAULT 0,
  commentaire TEXT,
  date_echeance TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_decision_action_decision ON decision_action(decision_id);
CREATE INDEX idx_decision_action_institution ON decision_action(institution_id);


-- Table: decision_gouvernementale
CREATE TABLE decision_gouvernementale (
  decision_id TEXT PRIMARY KEY,
  emetteur_institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  titre TEXT NOT NULL,
  description TEXT,
  date_emission TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  cree_par TEXT,
  date_publication TEXT,
  publie_par TEXT,
  date_archivage TEXT,
  archive_par TEXT
);
CREATE INDEX idx_decision_gouvernementale_emetteur_institution ON decision_gouvernementale(emetteur_institution_id);


-- Table: delegation_perimetre
CREATE TABLE delegation_perimetre (
  delegation_perimetre_id TEXT PRIMARY KEY,
  delegation_id TEXT NOT NULL REFERENCES delegation_pouvoir(delegation_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_delegation_perimetre_delegation ON delegation_perimetre(delegation_id);
CREATE INDEX idx_delegation_perimetre_institution ON delegation_perimetre(institution_id);


-- Table: delegation_pouvoir
CREATE TABLE delegation_pouvoir (
  delegation_id TEXT PRIMARY KEY,
  delegant_id TEXT NOT NULL REFERENCES personne(personne_id),
  delegataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  perimetre TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  texte_reference TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_delegation_pouvoir_delegant ON delegation_pouvoir(delegant_id);
CREATE INDEX idx_delegation_pouvoir_delegataire ON delegation_pouvoir(delegataire_id);


-- Table: entity_event
CREATE TABLE entity_event (
  event_id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  evenement TEXT NOT NULL,
  donnees_avant TEXT,
  donnees_apres TEXT,
  utilisateur_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Table: execution_rapport
CREATE TABLE execution_rapport (
  rapport_id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL REFERENCES instruction(instruction_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  redacteur_person_id TEXT,
  contenu TEXT NOT NULL,
  taux_avancement INTEGER NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'SOUMIS',
  date_rapport TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_execution_rapport_instruction ON execution_rapport(instruction_id);
CREATE INDEX idx_execution_rapport_institution ON execution_rapport(institution_id);


-- Table: institution
CREATE TABLE institution (
  institution_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  sigle TEXT,
  type_institution TEXT NOT NULL,
  institution_parent_id TEXT REFERENCES institution(institution_id),
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  adresse TEXT,
  latitude REAL,
  longitude REAL,
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  date_creation_legale TEXT,
  texte_creation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_institution_parent ON institution(institution_parent_id);


-- Table: institution_relation
CREATE TABLE institution_relation (
  institution_relation_id TEXT PRIMARY KEY,
  institution_source_id TEXT NOT NULL REFERENCES institution(institution_id),
  institution_cible_id TEXT NOT NULL REFERENCES institution(institution_id),
  type_relation TEXT NOT NULL REFERENCES relation_type(code),
  priorite INTEGER DEFAULT 0,
  date_debut TEXT DEFAULT (date('now')),
  date_fin TEXT,
  actif BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_institution_relation_institution_source ON institution_relation(institution_source_id);
CREATE INDEX idx_institution_relation_institution_cible ON institution_relation(institution_cible_id);
CREATE INDEX idx_institution_relation_type_relation ON institution_relation(type_relation);


-- Table: instruction_historique
CREATE TABLE instruction_historique (
  historique_id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL REFERENCES instruction(instruction_id),
  ancien_statut TEXT,
  nouveau_statut TEXT NOT NULL,
  person_id TEXT,
  commentaire TEXT,
  date_changement TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_instruction_historique_instruction ON instruction_historique(instruction_id);


-- Table: meta_notification_rule
CREATE TABLE meta_notification_rule (
  rule_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  evenement TEXT NOT NULL,
  condition_json TEXT NOT NULL,
  message_template TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'INTERNE',
  destinataire_role_code TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Table: meta_rule
CREATE TABLE meta_rule (
  rule_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  evenement TEXT NOT NULL,
  condition_json TEXT NOT NULL,
  message_erreur TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Table: meta_workflow_transition
CREATE TABLE meta_workflow_transition (
  transition_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  from_statut TEXT NOT NULL,
  to_statut TEXT NOT NULL,
  role_code_requis TEXT REFERENCES role(code),
  condition_json TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_meta_workflow_transition_role_code_requis ON meta_workflow_transition(role_code_requis);


-- Table: nocode_formulaire
CREATE TABLE nocode_formulaire (
  formulaire_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  workflow_id TEXT REFERENCES nocode_workflow(workflow_id),
  schema_champs TEXT NOT NULL DEFAULT '[]',
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_formulaire_workflow ON nocode_formulaire(workflow_id);


-- Table: nocode_workflow
CREATE TABLE nocode_workflow (
  workflow_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  institution_id TEXT REFERENCES institution(institution_id),
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'BROUILLON',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_institution ON nocode_workflow(institution_id);


-- Table: nocode_workflow_etape
CREATE TABLE nocode_workflow_etape (
  etape_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES nocode_workflow(workflow_id),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL,
  role_metier_id TEXT REFERENCES role_metier(role_metier_id),
  type_etape TEXT NOT NULL DEFAULT 'VALIDATION',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_etape_workflow ON nocode_workflow_etape(workflow_id);
CREATE INDEX idx_nocode_workflow_etape_role_metier ON nocode_workflow_etape(role_metier_id);


-- Table: nocode_workflow_instance
CREATE TABLE nocode_workflow_instance (
  instance_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES nocode_workflow(workflow_id),
  etape_courante_id TEXT REFERENCES nocode_workflow_etape(etape_id),
  donnees TEXT NOT NULL DEFAULT '{}',
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_instance_workflow ON nocode_workflow_instance(workflow_id);
CREATE INDEX idx_nocode_workflow_instance_etape_courante ON nocode_workflow_instance(etape_courante_id);


-- Table: notification
CREATE TABLE notification (
  notification_id TEXT PRIMARY KEY,
  destinataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  type_notification TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'IN_APP',
  titre TEXT NOT NULL,
  contenu TEXT,
  entite_liee TEXT,
  entite_liee_ref_id TEXT,
  lu BOOLEAN NOT NULL DEFAULT 0,
  date_envoi TEXT,
  date_lecture TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notification_destinataire ON notification(destinataire_id);


-- Table: personne_role
-- Table: personne
CREATE TABLE personne (
  personne_id TEXT PRIMARY KEY,
  matricule TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance TEXT,
  lieu_naissance TEXT,
  sexe TEXT CHECK (sexe IN ('M','F')),
  numero_identite_nationale TEXT,
  email TEXT,
  telephone TEXT,
  photo_url TEXT,
  password_hash TEXT NOT NULL,
  mfa_active INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  langue_preferee TEXT NOT NULL DEFAULT 'fr',
  fuseau_horaire TEXT NOT NULL DEFAULT 'Africa/Kinshasa',
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  date_derniere_connexion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  tentatives_echouees INTEGER NOT NULL DEFAULT 0,
  verrouille_jusqu_a TEXT
);
CREATE INDEX idx_personne_email ON personne(email);

CREATE TABLE personne_role (
  personne_role_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  role_id TEXT NOT NULL REFERENCES role(role_id),
  scope_institution_id TEXT REFERENCES institution(institution_id),
  date_attribution TEXT NOT NULL DEFAULT (datetime('now')),
  date_expiration TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF'
);
CREATE INDEX idx_personne_role_personne ON personne_role(personne_id);
CREATE INDEX idx_personne_role_role ON personne_role(role_id);
CREATE INDEX idx_personne_role_scope_institution ON personne_role(scope_institution_id);


-- Table: poste
CREATE TABLE poste (
  poste_id TEXT PRIMARY KEY,
  unite_id TEXT NOT NULL REFERENCES unite_organisationnelle(unite_id),
  code TEXT NOT NULL,
  intitule TEXT NOT NULL,
  poste_hierarchique_id TEXT REFERENCES poste(poste_id),
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  categorie TEXT,
  missions TEXT,
  attributions TEXT,
  responsabilites TEXT,
  competences_requises TEXT,
  nombre_postes_autorises INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  niveau_confiance TEXT NOT NULL DEFAULT 'A_VALIDER',
  pourcentage_confiance INTEGER,
  participe_calculs BOOLEAN
);
CREATE INDEX idx_poste_unite ON poste(unite_id);
CREATE INDEX idx_poste_hierarchique ON poste(poste_hierarchique_id);


-- Table: rni_lien_hierarchique
CREATE TABLE rni_lien_hierarchique (
  lien_id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  institution_parent_id TEXT NOT NULL REFERENCES institution(institution_id),
  type_lien TEXT NOT NULL,
  reference_juridique TEXT,
  date_debut TEXT NOT NULL DEFAULT (date('now')),
  date_fin TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_rni_lien_hierarchique_institution ON rni_lien_hierarchique(institution_id);
CREATE INDEX idx_rni_lien_hierarchique_institution_parent ON rni_lien_hierarchique(institution_parent_id);


-- Table: session_utilisateur
CREATE TABLE session_utilisateur (
  session_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  token_hash TEXT NOT NULL,
  adresse_ip TEXT,
  user_agent TEXT,
  date_debut TEXT NOT NULL DEFAULT (datetime('now')),
  date_expiration TEXT NOT NULL,
  date_revocation TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF'
);
CREATE INDEX idx_session_utilisateur_personne ON session_utilisateur(personne_id);


-- Table: type_acte_ref
CREATE TABLE type_acte_ref (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- Table: unite_organisationnelle
CREATE TABLE unite_organisationnelle (
  unite_id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  unite_parent_id TEXT REFERENCES unite_organisationnelle(unite_id),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_unite TEXT NOT NULL,
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  mission TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  niveau_confiance TEXT NOT NULL DEFAULT 'A_VALIDER',
  pourcentage_confiance INTEGER,
  participe_calculs BOOLEAN
);
CREATE INDEX idx_unite_organisationnelle_institution ON unite_organisationnelle(institution_id);
CREATE INDEX idx_unite_organisationnelle_unite_parent ON unite_organisationnelle(unite_parent_id);


-- Table: verification
CREATE TABLE verification (
  verification_id TEXT PRIMARY KEY,
  rapport_id TEXT NOT NULL REFERENCES execution_rapport(rapport_id),
  verificateur_person_id TEXT,
  verificateur_institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  decision TEXT NOT NULL,
  commentaire TEXT,
  date_verification TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_verification_rapport ON verification(rapport_id);
CREATE INDEX idx_verification_verificateur_institution ON verification(verificateur_institution_id);

