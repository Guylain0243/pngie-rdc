-- ════════════════════════════════════════════════════════════════
-- PNGIE-RDC — SCHÉMA RELATIONNEL DE RÉFÉRENCE (PostgreSQL 15+)
-- Modèle générique : couvre Présidence, Primature, Parlement,
-- Ministères, Provinces, ETD, Agences et Entreprises publiques
-- sans dupliquer de structure par institution.
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- pour gen_random_uuid()

-- ───────────────────────────────────────────────
-- 1. RÉFÉRENTIEL ORGANISATIONNEL
-- ───────────────────────────────────────────────

CREATE TABLE pouvoir ( -- séparation des pouvoirs (Constitution RDC, art. 68 et suivants)
  pouvoir_id    SMALLINT PRIMARY KEY,
  code          VARCHAR(20) UNIQUE NOT NULL, -- 'EXECUTIF','LEGISLATIF','JUDICIAIRE'
  libelle       VARCHAR(60) NOT NULL
);

CREATE TABLE organization_type (
  id            SMALLINT PRIMARY KEY,
  code          VARCHAR(30) UNIQUE NOT NULL,   -- 'PRESIDENCE','PRIMATURE','MINISTERE','PROVINCE','ETD','AGENCE',...
  libelle       VARCHAR(100) NOT NULL,
  -- NULL = institution d'appui à la démocratie (art. 222 Constitution RDC) : IGF, Cour des comptes...
  -- Ni exécutif, ni législatif, ni judiciaire — catégorie constitutionnelle à part, volontairement non forcée dans les 3.
  pouvoir_id    SMALLINT REFERENCES pouvoir(pouvoir_id)
);

CREATE TABLE organization (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(30) UNIQUE NOT NULL,
  nom              VARCHAR(200) NOT NULL,
  type_id          SMALLINT NOT NULL REFERENCES organization_type(id),
  parent_id        UUID REFERENCES organization(organization_id),
  niveau           INT NOT NULL DEFAULT 0,
  statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','INACTIF')),
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_parent ON organization(parent_id);
CREATE INDEX idx_org_type   ON organization(type_id);

CREATE TABLE unit ( -- directions, services, bureaux internes à une organisation
  unit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization(organization_id),
  parent_unit_id   UUID REFERENCES unit(unit_id),
  code             VARCHAR(30),
  nom              VARCHAR(200) NOT NULL,
  type             VARCHAR(40), -- Cabinet, Secrétariat Général, Direction, Division, Bureau
  ordre            INT DEFAULT 0
);

CREATE TABLE position ( -- postes / fonctions
  position_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id          UUID NOT NULL REFERENCES unit(unit_id),
  titre            VARCHAR(150) NOT NULL,   -- Ministre, Gouverneur, Directeur Général...
  niveau           INT,
  role_defaut_id   UUID,                    -- FK vers role, ajoutée après création de role
  autorite         VARCHAR(30)              -- décisionnelle, consultative, exécutive
);

CREATE TABLE person (
  person_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule     VARCHAR(30) UNIQUE,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100),
  email         VARCHAR(150) UNIQUE,
  telephone     VARCHAR(30),
  password_hash TEXT NOT NULL,              -- bcrypt
  mfa_enabled   BOOLEAN NOT NULL DEFAULT false,
  mfa_secret    TEXT,
  statut        VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignment ( -- qui occupe quel poste, avec historique
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id     UUID NOT NULL REFERENCES person(person_id),
  position_id   UUID NOT NULL REFERENCES position(position_id),
  date_debut    DATE NOT NULL DEFAULT current_date,
  date_fin      DATE,
  statut        VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);
CREATE INDEX idx_assign_person ON assignment(person_id);

-- ───────────────────────────────────────────────
-- 2. GOUVERNANCE FONCTIONNELLE
--    (réponses aux 10 vues : responsabilités, missions,
--     compétences, processus, décisions, instructions, contrôles)
-- ───────────────────────────────────────────────

CREATE TABLE responsabilite ( -- catalogue réutilisable (ex. "Contrôler" peut s'appliquer à plusieurs institutions)
  responsabilite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle             VARCHAR(300) NOT NULL,
  categorie           VARCHAR(40) -- Gouverner, Légiférer, Contrôler, Exécuter...
);

CREATE TABLE organization_responsabilite ( -- relation many-to-many Institution <-> Responsabilité
  organization_id    UUID NOT NULL REFERENCES organization(organization_id),
  responsabilite_id  UUID NOT NULL REFERENCES responsabilite(responsabilite_id),
  PRIMARY KEY (organization_id, responsabilite_id)
);

CREATE TABLE mission ( -- catalogue réutilisable, même principe que responsabilite
  mission_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle          VARCHAR(300) NOT NULL
);

CREATE TABLE organization_mission ( -- relation many-to-many Institution <-> Mission
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  mission_id      UUID NOT NULL REFERENCES mission(mission_id),
  PRIMARY KEY (organization_id, mission_id)
);

CREATE TABLE programme ( -- programme gouvernemental (peut regrouper plusieurs projets)
  programme_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organization(organization_id), -- institution porteuse
  nom              VARCHAR(200) NOT NULL,
  description      TEXT,
  date_debut       DATE,
  date_fin         DATE,
  statut           VARCHAR(20) NOT NULL DEFAULT 'EN_COURS' CHECK (statut IN ('PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ANNULE')),
  budget_usd       NUMERIC(18,2)
);

CREATE TABLE projet ( -- projet concret, rattachable à un programme (optionnel)
  projet_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id     UUID REFERENCES programme(programme_id),
  organization_id  UUID REFERENCES organization(organization_id),
  nom              VARCHAR(200) NOT NULL,
  description      TEXT,
  date_debut       DATE,
  date_fin_prevue  DATE,
  avancement_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  statut           VARCHAR(20) NOT NULL DEFAULT 'EN_COURS' CHECK (statut IN ('PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ANNULE')),
  budget_usd       NUMERIC(18,2)
);

CREATE TABLE gov_relation ( -- liens fonctionnels entre organisations (coordonne, contrôle, rend compte à...)
  gov_relation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_org_id    UUID NOT NULL REFERENCES organization(organization_id),
  target_org_id    UUID NOT NULL REFERENCES organization(organization_id),
  type_relation    VARCHAR(30) NOT NULL CHECK (type_relation IN
                    ('RATTACHE_A','COORDONNE','CONTROLE','RENDCOMPTE_A','SUPERVISE','APPUIE'))
);

CREATE TABLE process (
  process_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organization(organization_id),
  nom             VARCHAR(200) NOT NULL,
  version         VARCHAR(20) DEFAULT '1.0'
);

CREATE TABLE process_step (
  step_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id  UUID NOT NULL REFERENCES process(process_id),
  ordre       INT NOT NULL,
  nom         VARCHAR(200) NOT NULL,
  acteur_role VARCHAR(100)
);

-- ───────────────────────────────────────────────
-- 3. SÉCURITÉ — RBAC (rôles / permissions)
-- ───────────────────────────────────────────────

CREATE TABLE role (
  role_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code      VARCHAR(30) UNIQUE NOT NULL,   -- 'PR','PM','SN','AN','MI','GV'...
  nom       VARCHAR(150) NOT NULL,
  categorie VARCHAR(60)
);
ALTER TABLE position ADD CONSTRAINT fk_position_role FOREIGN KEY (role_defaut_id) REFERENCES role(role_id);

CREATE TABLE permission (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(60) UNIQUE NOT NULL,  -- 'page:budget:read','page:fiscalite:write'
  nom           VARCHAR(150) NOT NULL
);

CREATE TABLE role_permission (
  role_id       UUID REFERENCES role(role_id),
  permission_id UUID REFERENCES permission(permission_id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE person_role ( -- attribution effective d'un rôle à une personne (peut différer du poste)
  person_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(person_id),
  role_id   UUID REFERENCES role(role_id),
  scope_org_id UUID REFERENCES organization(organization_id) -- ex: rôle "GV" limité à une province précise ; NULL = portée nationale
);
CREATE INDEX idx_person_role_person ON person_role(person_id);

-- ───────────────────────────────────────────────
-- 4. INTERFACES — portails, tableaux de bord, menus (générés depuis les données)
-- ───────────────────────────────────────────────

CREATE TABLE portal (
  portal_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  nom             VARCHAR(150) NOT NULL,
  theme_couleur   VARCHAR(20)
);

CREATE TABLE dashboard (
  dashboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id    UUID NOT NULL REFERENCES portal(portal_id),
  nom          VARCHAR(150) NOT NULL,
  type         VARCHAR(40)
);

CREATE TABLE module (
  module_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboard(dashboard_id),
  nom          VARCHAR(100) NOT NULL,
  categorie    VARCHAR(60)
);

CREATE TABLE menu (
  menu_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id      UUID NOT NULL REFERENCES module(module_id),
  parent_menu_id UUID REFERENCES menu(menu_id),
  libelle        VARCHAR(100) NOT NULL,
  icone          VARCHAR(50),
  ordre          INT DEFAULT 0
);

CREATE TABLE page (
  page_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id     UUID NOT NULL REFERENCES menu(menu_id),
  nom         VARCHAR(100) NOT NULL,
  route       VARCHAR(100) NOT NULL,
  composant   VARCHAR(100),
  permission_code VARCHAR(60) REFERENCES permission(code)
);

CREATE TABLE widget (
  widget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id   UUID NOT NULL REFERENCES page(page_id),
  type      VARCHAR(30), -- kpi, chart, table, map, list
  position  INT,
  largeur   INT,
  hauteur   INT
);

CREATE TABLE kpi (
  kpi_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widget(widget_id),
  nom       VARCHAR(150) NOT NULL,
  formule   TEXT,
  source    VARCHAR(150),
  frequence VARCHAR(30) -- temps réel, journalier, mensuel
);

-- ───────────────────────────────────────────────
-- 5. INTELLIGENCE ARTIFICIELLE — agents & no-code
--    (point d'intégration IA à tous les niveaux)
-- ───────────────────────────────────────────────

CREATE TABLE ai_agent (
  agent_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organization(organization_id), -- null = agent transversal (national)
  nom             VARCHAR(100) NOT NULL,        -- "ARIA — Assistant Présidentiel", "Agent Anti-fraude DGI"
  role_ia         VARCHAR(60),                  -- assistant, detection_fraude, prevision, redaction
  modele          VARCHAR(60) DEFAULT 'claude-sonnet-5',
  system_prompt   TEXT,
  permission_code VARCHAR(60) REFERENCES permission(code), -- ce que l'agent a le droit de lire/faire
  statut          VARCHAR(20) DEFAULT 'ACTIF'
);

CREATE TABLE ai_conversation (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID NOT NULL REFERENCES ai_agent(agent_id),
  person_id       UUID NOT NULL REFERENCES person(person_id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_message (
  message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversation(conversation_id),
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
  contenu         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE nocode_app ( -- applications construites via le Government Studio no-code
  app_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  nom             VARCHAR(150) NOT NULL,
  type            VARCHAR(30), -- formulaire, workflow, dashboard, chatbot, api
  definition_json JSONB NOT NULL,  -- structure déclarative de l'app (champs, étapes, logique)
  cree_par        UUID REFERENCES person(person_id),
  statut          VARCHAR(20) DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON','PUBLIE','ARCHIVE')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE nocode_submission (
  submission_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          UUID NOT NULL REFERENCES nocode_app(app_id),
  person_id       UUID REFERENCES person(person_id),
  data_json       JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────────────────────────
-- 6. TRAÇABILITÉ — journal d'audit (horodatage, intégrité)
-- ───────────────────────────────────────────────

CREATE TABLE audit_log (
  log_id      BIGSERIAL PRIMARY KEY,
  person_id   UUID REFERENCES person(person_id),
  action      VARCHAR(100) NOT NULL,
  entite      VARCHAR(60),
  entite_id   UUID,
  detail      JSONB,
  hash_prec   TEXT,          -- hash de l'entrée précédente
  hash_actuel TEXT NOT NULL, -- SHA-256(entrée + hash_prec) → chaîne infalsifiable
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_person ON audit_log(person_id);
CREATE INDEX idx_audit_date   ON audit_log(created_at);

-- ───────────────────────────────────────────────
-- 7. CYCLE DE GOUVERNANCE — comment un ordre circule, s'exécute,
--    se contrôle et revient sous forme de rapport/décision.
--    (on stocke le FLUX, pas une hiérarchie figée)
-- ───────────────────────────────────────────────

CREATE TABLE instruction (
  instruction_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emetteur_org_id  UUID NOT NULL REFERENCES organization(organization_id), -- qui donne l'ordre
  destinataire_org_id UUID NOT NULL REFERENCES organization(organization_id), -- qui l'exécute
  titre            VARCHAR(200) NOT NULL,
  contenu          TEXT,
  type             VARCHAR(30) DEFAULT 'DIRECTIVE', -- DIRECTIVE, CIRCULAIRE, ORDONNANCE, NOTE_SERVICE
  echeance         DATE,
  statut           VARCHAR(20) NOT NULL DEFAULT 'EMISE' CHECK (statut IN ('EMISE','EN_COURS','EXECUTEE','EN_RETARD','ANNULEE')),
  created_by       UUID REFERENCES person(person_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plan_action (
  plan_action_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id  UUID NOT NULL REFERENCES instruction(instruction_id),
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  titre           VARCHAR(200) NOT NULL,
  date_debut      DATE, date_fin DATE,
  statut          VARCHAR(20) DEFAULT 'PLANIFIE'
);

CREATE TABLE activite (
  activite_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_action_id  UUID NOT NULL REFERENCES plan_action(plan_action_id),
  nom             VARCHAR(200) NOT NULL,
  avancement_pct  INT DEFAULT 0 CHECK (avancement_pct BETWEEN 0 AND 100),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rapport ( -- remonte l'exécution : ETD → Province → Ministère → Primature → Président
  rapport_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id), -- qui rapporte
  destinataire_org_id UUID REFERENCES organization(organization_id),      -- à qui
  instruction_id  UUID REFERENCES instruction(instruction_id),
  plan_action_id  UUID REFERENCES plan_action(plan_action_id),
  titre           VARCHAR(200) NOT NULL,
  synthese        TEXT,
  periode         VARCHAR(20), -- ex: '2027-T1'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpi_valeur ( -- valeurs réelles d'un KPI dans le temps (kpi = définition, kpi_valeur = mesure)
  kpi_valeur_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id        UUID NOT NULL REFERENCES kpi(kpi_id),
  organization_id UUID REFERENCES organization(organization_id),
  valeur        NUMERIC,
  periode       VARCHAR(20),
  mesure_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE controle ( -- mission de vérification (IGF, IGA, contrôle interne...)
  controle_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organe_controle_id UUID NOT NULL REFERENCES organization(organization_id), -- IGF, Cour des Comptes...
  organisation_controlee_id UUID NOT NULL REFERENCES organization(organization_id),
  type            VARCHAR(30), -- ADMINISTRATIF, FINANCIER, CONFORMITE, PERFORMANCE
  objet           VARCHAR(200),
  statut          VARCHAR(20) DEFAULT 'PLANIFIE' CHECK (statut IN ('PLANIFIE','EN_COURS','CLOTURE')),
  date_debut      DATE, date_fin DATE
);

CREATE TABLE audit_mission ( -- audit formel (financier, conformité, performance) rattaché à un contrôle
  audit_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_id     UUID NOT NULL REFERENCES controle(controle_id),
  perimetre       TEXT,
  conclusion      VARCHAR(30), -- CONFORME, RESERVES, NON_CONFORME
  rapport_final   TEXT,
  cloture_at      TIMESTAMPTZ
);

CREATE TABLE recommandation (
  recommandation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id           UUID NOT NULL REFERENCES audit_mission(audit_id),
  libelle            TEXT NOT NULL,
  priorite           VARCHAR(10) DEFAULT 'MOYENNE' CHECK (priorite IN ('BASSE','MOYENNE','HAUTE','CRITIQUE')),
  organisation_responsable_id UUID REFERENCES organization(organization_id)
);

CREATE TABLE decision ( -- arbitrage / mesure corrective (Président, Primature, Ministre...)
  decision_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization(organization_id), -- qui décide
  recommandation_id UUID REFERENCES recommandation(recommandation_id),
  rapport_id       UUID REFERENCES rapport(rapport_id),
  titre            VARCHAR(200) NOT NULL,
  type             VARCHAR(30), -- ARBITRAGE, ORIENTATION, MESURE_CORRECTIVE
  decidee_par      UUID REFERENCES person(person_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suivi ( -- état de mise en œuvre d'une recommandation/décision dans le temps
  suivi_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommandation_id UUID REFERENCES recommandation(recommandation_id),
  decision_id       UUID REFERENCES decision(decision_id),
  statut            VARCHAR(20) NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT','EN_COURS','CLOTURE','ABANDONNE')),
  commentaire       TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────────────────────────
-- 8. COUCHE D'INTÉGRATION — registre des logiciels externes
--    (Outlook, Cegid, SAP, GED, SIEM...) connectés via API/ESB.
--    PNGIE-RDC ne remplace pas ces logiciels : il les orchestre.
-- ───────────────────────────────────────────────

CREATE TABLE systeme_externe (
  systeme_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             VARCHAR(100) NOT NULL,          -- 'Microsoft Outlook','Cegid XRP','SAP S/4HANA'...
  categorie       VARCHAR(50) NOT NULL,           -- Collaboration, ERP_Finances, Audit, GED, Sécurité, BDD, DevOps
  fournisseur     VARCHAR(100),
  protocole       VARCHAR(30),                    -- REST, SOAP, GraphQL, SFTP, Kafka
  statut_connexion VARCHAR(20) DEFAULT 'NON_CONNECTE' CHECK (statut_connexion IN ('NON_CONNECTE','CONFIGURE','ACTIF','ERREUR')),
  organization_id UUID REFERENCES organization(organization_id) -- null = disponible pour toute l'administration
);

CREATE TABLE integration_flux ( -- ce qui transite entre PNGIE-RDC et un système externe
  flux_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  systeme_id      UUID NOT NULL REFERENCES systeme_externe(systeme_id),
  sens            VARCHAR(20) NOT NULL CHECK (sens IN ('ENTRANT','SORTANT','BIDIRECTIONNEL')),
  objet           VARCHAR(150), -- ex: 'Écritures comptables', 'Courriers officiels', 'Alertes SIEM'
  frequence       VARCHAR(30)   -- temps réel, horaire, journalier
);

-- ───────────────────────────────────────────────
-- 9. RÉFÉRENTIELS TRANSVERSAUX
--    (géographie, fonction publique, compétences, documents, services numériques)
-- ───────────────────────────────────────────────

CREATE TABLE lieu ( -- pays → province → territoire → ville → commune → secteur → chefferie → quartier/village
  lieu_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_lieu_id UUID REFERENCES lieu(lieu_id),
  nom            VARCHAR(150) NOT NULL,
  type           VARCHAR(20) NOT NULL CHECK (type IN
                  ('PAYS','PROVINCE','TERRITOIRE','VILLE','COMMUNE','SECTEUR','CHEFFERIE','QUARTIER')),
  organization_id UUID REFERENCES organization(organization_id) -- lien vers l'entité administrative correspondante
);

CREATE TABLE emploi_type ( -- nomenclature officielle des emplois de la fonction publique
  emploi_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,
  intitule    VARCHAR(150) NOT NULL,
  categorie   VARCHAR(40) -- Direction, Encadrement, Exécution, Support
);

CREATE TABLE competence (
  competence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           VARCHAR(150) NOT NULL,
  categorie     VARCHAR(60)
);

CREATE TABLE position_competence ( -- compétences requises pour un poste
  position_id   UUID REFERENCES position(position_id),
  competence_id UUID REFERENCES competence(competence_id),
  niveau_requis VARCHAR(20), -- Notion, Maîtrise, Expert
  PRIMARY KEY (position_id, competence_id)
);

CREATE TABLE document_type (
  document_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               VARCHAR(150) NOT NULL,
  duree_conservation_ans INT,
  regle_archivage   TEXT
);

CREATE TABLE document (
  document_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id UUID REFERENCES document_type(document_type_id),
  organization_id  UUID REFERENCES organization(organization_id),
  titre            VARCHAR(200) NOT NULL,
  reference        VARCHAR(60),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_numerique ( -- catalogue des services exposés par chaque institution
  service_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  nom             VARCHAR(150) NOT NULL,
  description     TEXT,
  url             VARCHAR(200),
  statut          VARCHAR(20) DEFAULT 'ACTIF'
);

-- ═══ FIN DU SCHÉMA — 42 tables au total ═══
-- ════════════════════════════════════════════════════════════════
-- EXTENSION DU SCHÉMA — Domaines sectoriels + Sécurité renforcée
-- À charger après schema.sql (référence organization, lieu, person, document, decision)
-- ════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- 10. DOMAINE JUSTICE
-- ───────────────────────────────────────────────

CREATE TABLE tribunal (
  tribunal_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             VARCHAR(150) NOT NULL,
  type            VARCHAR(30) NOT NULL CHECK (type IN
                  ('COUR_CONSTITUTIONNELLE','COUR_CASSATION','COUR_APPEL','TRIBUNAL_GRANDE_INSTANCE','TRIBUNAL_PAIX','PARQUET')),
  lieu_id         UUID REFERENCES lieu(lieu_id),
  organization_id UUID REFERENCES organization(organization_id)
);

CREATE TABLE magistrat (
  magistrat_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id     UUID NOT NULL REFERENCES person(person_id),
  tribunal_id   UUID NOT NULL REFERENCES tribunal(tribunal_id),
  fonction      VARCHAR(60) NOT NULL, -- Président, Juge, Procureur, Substitut, Greffier
  date_nomination DATE
);

CREATE TABLE dossier_judiciaire (
  dossier_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_dossier  VARCHAR(50) UNIQUE NOT NULL,
  tribunal_id     UUID NOT NULL REFERENCES tribunal(tribunal_id),
  nature          VARCHAR(30) NOT NULL CHECK (nature IN ('CIVIL','PENAL','COMMERCIAL','ADMINISTRATIF','SOCIAL')),
  statut          VARCHAR(20) NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT','EN_COURS','JUGE','ARCHIVE','TRANSMIS')),
  date_ouverture  DATE NOT NULL DEFAULT current_date,
  ref_police_rdc  VARCHAR(50) -- lien vers une enquête d'origine, si transmise par la Police
);
CREATE INDEX idx_dossier_tribunal ON dossier_judiciaire(tribunal_id);

CREATE TABLE jugement (
  jugement_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id    UUID NOT NULL REFERENCES dossier_judiciaire(dossier_id),
  magistrat_id  UUID NOT NULL REFERENCES magistrat(magistrat_id),
  date_jugement DATE NOT NULL,
  decision_rendue TEXT NOT NULL,
  voie_recours  VARCHAR(20) CHECK (voie_recours IN ('AUCUNE','APPEL','CASSATION'))
);
CREATE INDEX idx_jugement_dossier ON jugement(dossier_id);

-- ───────────────────────────────────────────────
-- 11. DOMAINE SANTÉ
-- ───────────────────────────────────────────────

CREATE TABLE etablissement_sante (
  etablissement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              VARCHAR(200) NOT NULL,
  type             VARCHAR(30) NOT NULL CHECK (type IN
                   ('HOPITAL_GENERAL','HOPITAL_REFERENCE','CENTRE_SANTE','POSTE_SANTE','CLINIQUE','PHARMACIE')),
  lieu_id          UUID REFERENCES lieu(lieu_id),
  capacite_lits    INT,
  statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);

CREATE TABLE patient (
  patient_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_national VARCHAR(20) UNIQUE, -- lien optionnel vers le registre national d'identité
  nom            VARCHAR(100) NOT NULL,
  prenom         VARCHAR(100),
  date_naissance DATE,
  sexe           CHAR(1) CHECK (sexe IN ('M','F'))
);

CREATE TABLE consultation (
  consultation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patient(patient_id),
  etablissement_id UUID NOT NULL REFERENCES etablissement_sante(etablissement_id),
  personnel_person_id UUID REFERENCES person(person_id), -- agent médical, lié au registre RH de l'État
  date_consultation TIMESTAMPTZ NOT NULL DEFAULT now(),
  motif            TEXT,
  diagnostic       TEXT
);
CREATE INDEX idx_consult_patient ON consultation(patient_id);
CREATE INDEX idx_consult_etab    ON consultation(etablissement_id);

CREATE TABLE campagne_vaccination (
  campagne_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              VARCHAR(150) NOT NULL,
  maladie_cible    VARCHAR(100) NOT NULL,
  date_debut       DATE NOT NULL,
  date_fin         DATE,
  lieu_id          UUID REFERENCES lieu(lieu_id),
  nb_doses_prevues INT,
  nb_doses_administrees INT DEFAULT 0
);

-- ───────────────────────────────────────────────
-- 12. DOMAINE ÉCONOMIE (Entreprises, Mines, Agriculture, Énergie, Infrastructures, Cadastre)
-- ───────────────────────────────────────────────

CREATE TABLE entreprise (
  entreprise_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raison_sociale  VARCHAR(200) NOT NULL,
  numero_rccm     VARCHAR(50) UNIQUE, -- Registre du Commerce et du Crédit Mobilier
  secteur         VARCHAR(60),
  capital_etat_pct NUMERIC(5,2) DEFAULT 0, -- participation de l'État, si entreprise publique/mixte
  lieu_siege_id   UUID REFERENCES lieu(lieu_id),
  statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);

CREATE TABLE permis_minier (
  permis_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_permis   VARCHAR(50) UNIQUE NOT NULL,
  entreprise_id   UUID NOT NULL REFERENCES entreprise(entreprise_id),
  substance       VARCHAR(60) NOT NULL, -- cobalt, coltan, lithium, or, diamant, cuivre...
  lieu_id         UUID REFERENCES lieu(lieu_id),
  date_octroi     DATE NOT NULL,
  date_expiration DATE,
  statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','SUSPENDU','EXPIRE','REVOQUE'))
);

CREATE TABLE exploitation_agricole (
  exploitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             VARCHAR(150),
  lieu_id         UUID REFERENCES lieu(lieu_id),
  superficie_ha   NUMERIC(10,2),
  filiere         VARCHAR(60), -- café, cacao, manioc, maïs, élevage...
  proprietaire    VARCHAR(200)
);

CREATE TABLE projet_energie (
  projet_energie_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               VARCHAR(150) NOT NULL,
  type              VARCHAR(30) CHECK (type IN ('HYDROELECTRIQUE','SOLAIRE','THERMIQUE','HYDROCARBURES','RESEAU_DISTRIBUTION')),
  lieu_id           UUID REFERENCES lieu(lieu_id),
  capacite_mw       NUMERIC(10,2),
  statut            VARCHAR(20) DEFAULT 'EN_SERVICE'
);

CREATE TABLE infrastructure_projet (
  infra_projet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             VARCHAR(150) NOT NULL,
  type            VARCHAR(30) CHECK (type IN ('ROUTE','PONT','PORT','AEROPORT','CHEMIN_FER')),
  lieu_id         UUID REFERENCES lieu(lieu_id),
  budget_usd      NUMERIC(18,2),
  avancement_pct  NUMERIC(5,2) DEFAULT 0,
  statut          VARCHAR(20) DEFAULT 'EN_ETUDE' CHECK (statut IN ('EN_ETUDE','EN_TRAVAUX','LIVRE','SUSPENDU'))
);

CREATE TABLE parcelle_cadastrale (
  parcelle_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       VARCHAR(50) UNIQUE NOT NULL,
  lieu_id         UUID REFERENCES lieu(lieu_id),
  superficie_m2   NUMERIC(14,2),
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
  code_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES person(person_id),
  code_hash   TEXT NOT NULL, -- haché (bcrypt), jamais stocké en clair
  utilise     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_backup_person ON mfa_backup_code(person_id);

CREATE TABLE mfa_event (
  event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES person(person_id),
  type        VARCHAR(20) NOT NULL CHECK (type IN ('CHALLENGE_ENVOYE','VALIDE','ECHOUE','CODE_SECOURS_UTILISE')),
  ip_adresse  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_event_person ON mfa_event(person_id);

CREATE TABLE pki_certificate (
  certificate_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES person(person_id),
  numero_serie     VARCHAR(80) UNIQUE NOT NULL,
  autorite_emettrice VARCHAR(100) NOT NULL DEFAULT 'PKI Nationale RDC',
  cle_publique     TEXT NOT NULL,
  date_emission    TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_expiration  TIMESTAMPTZ NOT NULL,
  statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','REVOQUE','EXPIRE'))
);
CREATE INDEX idx_pki_cert_person ON pki_certificate(person_id);

CREATE TABLE pki_signature (
  signature_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id  UUID NOT NULL REFERENCES pki_certificate(certificate_id),
  document_id     UUID REFERENCES document(document_id),
  decision_id     UUID REFERENCES decision(decision_id),
  signature_hash  TEXT NOT NULL, -- empreinte cryptographique du document signé
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (document_id IS NOT NULL OR decision_id IS NOT NULL) -- une signature porte sur au moins un objet
);
CREATE INDEX idx_pki_sig_cert ON pki_signature(certificate_id);

-- ═══ FIN DE L'EXTENSION — 18 nouvelles tables (4 Justice, 4 Santé, 6 Économie, 4 Sécurité) ═══
