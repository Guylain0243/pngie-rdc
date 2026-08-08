-- ============================================================================
-- PNGIE-RDC — Domaine 01 : GOUVERNANCE
-- Niveau 3.7 — Modèle Physique de Données (MPD)
-- Script DDL PostgreSQL
--
-- Principes appliqués (section 01.130) :
--   - Identifiants techniques UUID (gen_random_uuid())
--   - Encodage UTF-8, horodatage UTC (TIMESTAMPTZ)
--   - Suppression logique (colonne actif) plutôt que suppression physique
--   - Contraintes d'intégrité référentielle (FK vers personne pour les acteurs)
--   - Historisation via colonne version + tables techniques transverses
--
-- Pré-requis : extension pgcrypto pour gen_random_uuid()
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS gouvernance;
SET search_path TO gouvernance, public;

-- ----------------------------------------------------------------------------
-- 01.131 — GOUV_VISION
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_vision (
    vision_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(300) NOT NULL,
    description         TEXT,
    horizon             SMALLINT,
    version             INTEGER      NOT NULL DEFAULT 1,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    date_validation     TIMESTAMPTZ,
    date_publication    TIMESTAMPTZ,
    date_debut          DATE,
    date_fin            DATE,
    cree_par            UUID         NOT NULL,
    date_creation       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    modifie_par         UUID,
    date_modification   TIMESTAMPTZ,
    actif               BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT uk_gouv_vision_code UNIQUE (code),
    CONSTRAINT ck_gouv_vision_statut CHECK (statut IN ('Brouillon','Validé','Publié','Archivé')),
    CONSTRAINT fk_gouv_vision_cree_par FOREIGN KEY (cree_par) REFERENCES personne(personne_id),
    CONSTRAINT fk_gouv_vision_modifie_par FOREIGN KEY (modifie_par) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_vision_statut ON gouv_vision (statut);
CREATE INDEX idx_gouv_vision_actif ON gouv_vision (actif);

-- ----------------------------------------------------------------------------
-- 01.132 — GOUV_MISSION
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_mission (
    mission_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vision_id           UUID NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(250) NOT NULL,
    description         TEXT,
    responsable_id      UUID,
    version             INTEGER      NOT NULL DEFAULT 1,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    date_debut          DATE,
    date_fin            DATE,
    actif               BOOLEAN      NOT NULL DEFAULT true,
    cree_par            UUID         NOT NULL,
    date_creation       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    modifie_par         UUID,
    date_modification   TIMESTAMPTZ,
    CONSTRAINT uk_gouv_mission_code UNIQUE (code),
    CONSTRAINT fk_gouv_mission_vision FOREIGN KEY (vision_id) REFERENCES gouv_vision(vision_id),
    CONSTRAINT fk_gouv_mission_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_mission_vision ON gouv_mission (vision_id);
CREATE INDEX idx_gouv_mission_statut ON gouv_mission (statut);
CREATE INDEX idx_gouv_mission_responsable ON gouv_mission (responsable_id);

-- ----------------------------------------------------------------------------
-- 01.133 — GOUV_OBJECTIF
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_objectif (
    objectif_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id          UUID NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(300) NOT NULL,
    description         TEXT,
    priorite            SMALLINT,
    criticite           SMALLINT,
    responsable_id      UUID,
    date_debut          DATE,
    date_fin            DATE,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    version             INTEGER      NOT NULL DEFAULT 1,
    actif               BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT uk_gouv_objectif_code UNIQUE (code),
    CONSTRAINT fk_gouv_objectif_mission FOREIGN KEY (mission_id) REFERENCES gouv_mission(mission_id),
    CONSTRAINT fk_gouv_objectif_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_objectif_mission ON gouv_objectif (mission_id);
CREATE INDEX idx_objectif_priorite ON gouv_objectif (priorite);
CREATE INDEX idx_objectif_statut ON gouv_objectif (statut);
CREATE INDEX idx_objectif_responsable ON gouv_objectif (responsable_id);

-- ----------------------------------------------------------------------------
-- 01.134 — GOUV_PROGRAMME
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_programme (
    programme_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objectif_id         UUID NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(300) NOT NULL,
    description         TEXT,
    budget              DECIMAL(18,2),
    responsable_id      UUID,
    date_debut          DATE,
    date_fin            DATE,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    version             INTEGER      NOT NULL DEFAULT 1,
    CONSTRAINT uk_gouv_programme_code UNIQUE (code),
    CONSTRAINT fk_gouv_programme_objectif FOREIGN KEY (objectif_id) REFERENCES gouv_objectif(objectif_id),
    CONSTRAINT fk_gouv_programme_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_programme_objectif ON gouv_programme (objectif_id);
CREATE INDEX idx_programme_responsable ON gouv_programme (responsable_id);
CREATE INDEX idx_programme_statut ON gouv_programme (statut);

-- ----------------------------------------------------------------------------
-- 01.135 — GOUV_PROJET
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_projet (
    projet_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id        UUID NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(300) NOT NULL,
    chef_projet_id      UUID,
    budget              DECIMAL(18,2),
    cout                DECIMAL(18,2),
    avancement          NUMERIC(5,2) NOT NULL DEFAULT 0,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    CONSTRAINT uk_gouv_projet_code UNIQUE (code),
    CONSTRAINT ck_gouv_projet_avancement CHECK (avancement >= 0 AND avancement <= 100),
    CONSTRAINT fk_gouv_projet_programme FOREIGN KEY (programme_id) REFERENCES gouv_programme(programme_id),
    CONSTRAINT fk_gouv_projet_chef FOREIGN KEY (chef_projet_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_projet_programme ON gouv_projet (programme_id);
CREATE INDEX idx_projet_statut ON gouv_projet (statut);
CREATE INDEX idx_projet_chef ON gouv_projet (chef_projet_id);

-- ----------------------------------------------------------------------------
-- 01.136 — GOUV_COMITE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_comite (
    comite_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50)  NOT NULL,
    nom                 VARCHAR(250) NOT NULL,
    type                VARCHAR(50),
    president_id        UUID,
    secretaire_id       UUID,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Actif',
    CONSTRAINT uk_gouv_comite_code UNIQUE (code),
    CONSTRAINT fk_gouv_comite_president FOREIGN KEY (president_id) REFERENCES personne(personne_id),
    CONSTRAINT fk_gouv_comite_secretaire FOREIGN KEY (secretaire_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_comite_type ON gouv_comite (type);
CREATE INDEX idx_comite_statut ON gouv_comite (statut);

-- ----------------------------------------------------------------------------
-- 01.137 — GOUV_DECISION
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_decision (
    decision_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comite_id           UUID,
    reference           VARCHAR(100) NOT NULL,
    objet               VARCHAR(500) NOT NULL,
    description         TEXT,
    date_decision        TIMESTAMPTZ,
    statut              VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    version              INTEGER      NOT NULL DEFAULT 1,
    CONSTRAINT uk_gouv_decision_reference UNIQUE (reference),
    CONSTRAINT fk_gouv_decision_comite FOREIGN KEY (comite_id) REFERENCES gouv_comite(comite_id)
);
CREATE INDEX idx_decision_comite ON gouv_decision (comite_id);
CREATE INDEX idx_decision_date ON gouv_decision (date_decision);
CREATE INDEX idx_decision_statut ON gouv_decision (statut);

-- ----------------------------------------------------------------------------
-- 01.138 — GOUV_POLITIQUE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_politique (
    politique_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(300) NOT NULL,
    description          TEXT,
    version              INTEGER      NOT NULL DEFAULT 1,
    date_publication     DATE,
    responsable_id       UUID,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    CONSTRAINT uk_gouv_politique_code UNIQUE (code),
    CONSTRAINT fk_gouv_politique_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_politique_code ON gouv_politique (code);
CREATE INDEX idx_politique_statut ON gouv_politique (statut);

-- ----------------------------------------------------------------------------
-- 01.139 — GOUV_DIRECTIVE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_directive (
    directive_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politique_id         UUID NOT NULL,
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(300) NOT NULL,
    description          TEXT,
    version              INTEGER      NOT NULL DEFAULT 1,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    CONSTRAINT uk_gouv_directive_code UNIQUE (code),
    CONSTRAINT fk_gouv_directive_politique FOREIGN KEY (politique_id) REFERENCES gouv_politique(politique_id)
);
CREATE INDEX idx_directive_politique ON gouv_directive (politique_id);
CREATE INDEX idx_directive_statut ON gouv_directive (statut);

-- ----------------------------------------------------------------------------
-- 01.140 — GOUV_REGLE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_regle (
    regle_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politique_id         UUID NOT NULL,
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(300) NOT NULL,
    type                 VARCHAR(50),
    priorite             SMALLINT,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Brouillon',
    CONSTRAINT uk_gouv_regle_code UNIQUE (code),
    CONSTRAINT fk_gouv_regle_politique FOREIGN KEY (politique_id) REFERENCES gouv_politique(politique_id)
);
CREATE INDEX idx_regle_politique ON gouv_regle (politique_id);
CREATE INDEX idx_regle_statut ON gouv_regle (statut);

-- ----------------------------------------------------------------------------
-- 01.141 — GOUV_KPI
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_kpi (
    kpi_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objectif_id          UUID NOT NULL,
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(300) NOT NULL,
    unite                VARCHAR(30),
    valeur_cible         DECIMAL(18,4),
    periode              VARCHAR(20),
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Actif',
    CONSTRAINT uk_gouv_kpi_code UNIQUE (code),
    CONSTRAINT fk_gouv_kpi_objectif FOREIGN KEY (objectif_id) REFERENCES gouv_objectif(objectif_id)
);
CREATE INDEX idx_kpi_objectif ON gouv_kpi (objectif_id);
CREATE INDEX idx_kpi_statut ON gouv_kpi (statut);

-- ----------------------------------------------------------------------------
-- 01.142 — GOUV_MESURE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_mesure (
    mesure_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id               UUID NOT NULL,
    date_mesure          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valeur               DECIMAL(18,4) NOT NULL,
    source               VARCHAR(100),
    qualite              VARCHAR(30),
    commentaire          TEXT,
    CONSTRAINT fk_gouv_mesure_kpi FOREIGN KEY (kpi_id) REFERENCES gouv_kpi(kpi_id)
);
CREATE INDEX idx_mesure_kpi ON gouv_mesure (kpi_id);
CREATE INDEX idx_mesure_date ON gouv_mesure (date_mesure);

-- ----------------------------------------------------------------------------
-- 01.143 — GOUV_AUDIT
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_audit (
    audit_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference            VARCHAR(100) NOT NULL,
    type                 VARCHAR(50),
    perimetre            VARCHAR(250),
    responsable_id       UUID,
    date_debut           DATE,
    date_fin             DATE,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Planifié',
    CONSTRAINT uk_gouv_audit_reference UNIQUE (reference),
    CONSTRAINT fk_gouv_audit_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_audit_responsable ON gouv_audit (responsable_id);
CREATE INDEX idx_audit_statut ON gouv_audit (statut);

-- ----------------------------------------------------------------------------
-- 01.144 — GOUV_RECOMMANDATION
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_recommandation (
    recommandation_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id             UUID NOT NULL,
    description          TEXT NOT NULL,
    priorite             SMALLINT,
    responsable_id       UUID,
    echeance             DATE,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Ouverte',
    CONSTRAINT fk_gouv_recommandation_audit FOREIGN KEY (audit_id) REFERENCES gouv_audit(audit_id),
    CONSTRAINT fk_gouv_recommandation_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_recommandation_audit ON gouv_recommandation (audit_id);
CREATE INDEX idx_recommandation_statut ON gouv_recommandation (statut);

-- ----------------------------------------------------------------------------
-- 01.145 — GOUV_RISQUE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_risque (
    risque_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(250) NOT NULL,
    description          TEXT,
    probabilite          SMALLINT NOT NULL,
    impact               SMALLINT NOT NULL,
    criticite            SMALLINT GENERATED ALWAYS AS (probabilite * impact) STORED,
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Identifié',
    CONSTRAINT uk_gouv_risque_code UNIQUE (code),
    CONSTRAINT ck_gouv_risque_probabilite CHECK (probabilite BETWEEN 1 AND 5),
    CONSTRAINT ck_gouv_risque_impact CHECK (impact BETWEEN 1 AND 5)
);
CREATE INDEX idx_risque_statut ON gouv_risque (statut);
CREATE INDEX idx_risque_criticite ON gouv_risque (criticite);

-- ----------------------------------------------------------------------------
-- 01.146 — GOUV_CONTROLE
-- ----------------------------------------------------------------------------
CREATE TABLE gouv_controle (
    controle_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risque_id            UUID NOT NULL,
    code                 VARCHAR(50)  NOT NULL,
    nom                  VARCHAR(300) NOT NULL,
    responsable_id       UUID,
    frequence            VARCHAR(30),
    statut               VARCHAR(30)  NOT NULL DEFAULT 'Actif',
    CONSTRAINT uk_gouv_controle_code UNIQUE (code),
    CONSTRAINT fk_gouv_controle_risque FOREIGN KEY (risque_id) REFERENCES gouv_risque(risque_id),
    CONSTRAINT fk_gouv_controle_responsable FOREIGN KEY (responsable_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_controle_risque ON gouv_controle (risque_id);
CREATE INDEX idx_controle_statut ON gouv_controle (statut);

-- ============================================================================
-- 01.147 — Tables techniques transverses
-- Modèle polymorphe (entite_table / entite_id) pour s'appliquer à toutes
-- les tables métier du Domaine 01 sans dupliquer la structure par table.
-- ============================================================================

-- Historique des versions
CREATE TABLE gouv_version (
    version_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table         VARCHAR(100) NOT NULL,
    entite_id            UUID NOT NULL,
    numero_version        INTEGER NOT NULL,
    contenu_json          JSONB,
    cree_par             UUID,
    date_creation         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_gouv_version_cree_par FOREIGN KEY (cree_par) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_version_entite ON gouv_version (entite_table, entite_id);

-- Journal des opérations (audit technique)
CREATE TABLE gouv_audit_log (
    audit_log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table          VARCHAR(100) NOT NULL,
    entite_id             UUID NOT NULL,
    action                VARCHAR(30) NOT NULL,  -- INSERT, UPDATE, DELETE
    ancienne_valeur        JSONB,
    nouvelle_valeur        JSONB,
    acteur_id             UUID,
    date_action            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_gouv_audit_log_acteur FOREIGN KEY (acteur_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_audit_log_entite ON gouv_audit_log (entite_table, entite_id);
CREATE INDEX idx_gouv_audit_log_date ON gouv_audit_log (date_action);

-- Documents associés
CREATE TABLE gouv_piece_jointe (
    piece_jointe_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table           VARCHAR(100) NOT NULL,
    entite_id              UUID NOT NULL,
    nom_fichier             VARCHAR(300) NOT NULL,
    type_mime               VARCHAR(100),
    taille_octets            BIGINT,
    chemin_stockage          TEXT NOT NULL,
    depose_par              UUID,
    date_depot               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_gouv_piece_jointe_depose_par FOREIGN KEY (depose_par) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_piece_jointe_entite ON gouv_piece_jointe (entite_table, entite_id);

-- Commentaires
CREATE TABLE gouv_commentaire (
    commentaire_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table            VARCHAR(100) NOT NULL,
    entite_id               UUID NOT NULL,
    contenu                 TEXT NOT NULL,
    auteur_id               UUID,
    date_creation            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_gouv_commentaire_auteur FOREIGN KEY (auteur_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_commentaire_entite ON gouv_commentaire (entite_table, entite_id);

-- Liens vers référentiels externes
CREATE TABLE gouv_reference_externe (
    reference_externe_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table              VARCHAR(100) NOT NULL,
    entite_id                 UUID NOT NULL,
    referentiel_code          VARCHAR(50) NOT NULL,   -- ex: RNI, RNPM, RNBCM...
    valeur_reference           VARCHAR(200) NOT NULL,
    date_creation               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gouv_ref_externe_entite ON gouv_reference_externe (entite_table, entite_id);
CREATE INDEX idx_gouv_ref_externe_referentiel ON gouv_reference_externe (referentiel_code);

-- Classification fonctionnelle (tags)
CREATE TABLE gouv_tag (
    tag_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table              VARCHAR(100) NOT NULL,
    entite_id                 UUID NOT NULL,
    libelle                    VARCHAR(100) NOT NULL,
    date_creation               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gouv_tag_entite ON gouv_tag (entite_table, entite_id);
CREATE INDEX idx_gouv_tag_libelle ON gouv_tag (libelle);

-- Historique des changements d'état
CREATE TABLE gouv_historique_etat (
    historique_etat_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entite_table              VARCHAR(100) NOT NULL,
    entite_id                 UUID NOT NULL,
    ancien_statut              VARCHAR(30),
    nouveau_statut             VARCHAR(30) NOT NULL,
    acteur_id                 UUID,
    date_changement             TIMESTAMPTZ NOT NULL DEFAULT now(),
    commentaire                TEXT,
    CONSTRAINT fk_gouv_historique_etat_acteur FOREIGN KEY (acteur_id) REFERENCES personne(personne_id)
);
CREATE INDEX idx_gouv_historique_etat_entite ON gouv_historique_etat (entite_table, entite_id);

-- ============================================================================
-- 01.149 — Politique de partitionnement (indicatif)
-- Pour GOUV_AUDIT_LOG, GOUV_MESURE, GOUV_HISTORIQUE_ETAT : envisager un
-- partitionnement par année (RANGE sur la colonne date) une fois le volume
-- de données significatif. Non appliqué ici pour rester compatible avec
-- une création directe ; à activer via un script de migration ultérieur si
-- les tables sont recréées en PARTITION BY RANGE (date_action) etc.
-- ============================================================================

-- Fin du script — Domaine 01 : Gouvernance (15 tables métier + 7 tables techniques)
