-- ============================================================================
-- PNGIE-RDC — Référentiel National des Juridictions Militaires et des
-- Auditorats Militaires (Tome 22)
--
-- NOTE IMPORTANTE (Tome 23) : Le Tome 23 propose un Référentiel National des
-- Institutions (RNI) couvrant TOUT l'État congolais. Une bonne partie de ce
-- que le Tome 23 décrit (INI, code, nom, type, parent, statut, adresse,
-- coordonnées GPS, référence légale) existe DÉJÀ dans la table `institution`
-- actuelle. Créer un RNI complet redondant serait risqué (deux sources de
-- vérité qui divergent). Ce script se limite donc au périmètre concret du
-- Tome 22 (justice militaire), qui a un besoin réel non couvert : suivre des
-- juridictions/auditorats PAS ENCORE créés officiellement (TMG en attente de
-- liste validée), avec historisation des évolutions — un usage différent de
-- la table `institution` qui ne contient que des institutions confirmées.
-- La décision d'étendre ceci à un RNI global (Tome 23) reste à prendre
-- séparément avec vous, une fois ce périmètre plus restreint validé à l'usage.
--
-- Exécution : psql -f .\creer_referentiel_juridictions_militaires.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Référentiel des juridictions militaires (HCM, CM, TMG)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_juridiction_militaire (
    ini                     VARCHAR(20) PRIMARY KEY,  -- ex: TMG-001, CM-001, HCM-001
    code_institution        VARCHAR(20),               -- lien vers institution.code une fois l'institution réellement créée
    institution_id          UUID REFERENCES institution(institution_id),
    denomination_officielle VARCHAR(255) NOT NULL,
    type_juridiction        VARCHAR(10) NOT NULL CHECK (type_juridiction IN ('HCM','CM','TMG')),
    province                VARCHAR(100),
    ville_siege             VARCHAR(100),
    ressort_territorial     TEXT,
    date_creation           DATE,
    reference_juridique     VARCHAR(255),
    statut                  VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    autorite_tutelle_ini    VARCHAR(20) REFERENCES ref_juridiction_militaire(ini),  -- ex: un TMG rattaché à sa Cour Militaire
    adresse                 TEXT,
    telephone               VARCHAR(50),
    email                   VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Référentiel des auditorats militaires (AGM, AMC, AMG)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_auditorat_militaire (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: AMG-001, AMC-001, AGM-001
    code_institution          VARCHAR(20),
    institution_id            UUID REFERENCES institution(institution_id),
    denomination_officielle   VARCHAR(255) NOT NULL,
    type_auditorat            VARCHAR(10) NOT NULL CHECK (type_auditorat IN ('AGM','AMC','AMG')),
    juridiction_rattachement_ini VARCHAR(20) REFERENCES ref_juridiction_militaire(ini),
    autorite_tutelle_ini      VARCHAR(20) REFERENCES ref_auditorat_militaire(ini),  -- ex: AMG rattaché à son AMC
    province                  VARCHAR(100),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Historisation (aucune donnée n'est jamais supprimée, tout est tracé)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_juridiction_militaire_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- CREATION, MODIFICATION, FUSION, SUPPRESSION, CHANGEMENT_RESSORT, VALIDATION
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_auditorat_militaire_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Pré-remplissage : juridictions DÉJÀ réelles et créées dans `institution`
--    (statut ACTIVE, liées à leur institution_id existante)
-- ----------------------------------------------------------------------------
INSERT INTO ref_juridiction_militaire (ini, code_institution, institution_id, denomination_officielle, type_juridiction, statut)
SELECT 'HCM-001', i.code, i.institution_id, i.nom, 'HCM', 'ACTIVE'
FROM institution i WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (ini) DO NOTHING;

INSERT INTO ref_juridiction_militaire (ini, code_institution, institution_id, denomination_officielle, type_juridiction, statut)
SELECT 'CM-' || LPAD((ROW_NUMBER() OVER (ORDER BY i.code))::text, 3, '0'), i.code, i.institution_id, i.nom, 'CM', 'ACTIVE'
FROM institution i WHERE i.code LIKE 'CM_%'
ON CONFLICT (ini) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Pré-remplissage : TMG repérés par recoupement de sources (PAS une liste
--    officielle confirmée) — statut A_VALIDER, à ne pas transformer en
--    institutions réelles avant validation par un document officiel complet.
-- ----------------------------------------------------------------------------
INSERT INTO ref_juridiction_militaire (ini, denomination_officielle, type_juridiction, ville_siege, statut)
VALUES
    ('TMG-A01', 'Tribunal Militaire de Garnison de Kinshasa/Gombe',   'TMG', 'Kinshasa/Gombe',   'A_VALIDER'),
    ('TMG-A02', 'Tribunal Militaire de Garnison de Kinshasa/Ngaliema','TMG', 'Kinshasa/Ngaliema','A_VALIDER'),
    ('TMG-A03', 'Tribunal Militaire de Garnison de N''djili',        'TMG', 'N''djili',          'A_VALIDER'),
    ('TMG-A04', 'Tribunal Militaire de Garnison de Bunia',           'TMG', 'Bunia',             'A_VALIDER'),
    ('TMG-A05', 'Tribunal Militaire de Garnison de Goma',            'TMG', 'Goma',              'A_VALIDER'),
    ('TMG-A06', 'Tribunal Militaire de Garnison de Lubumbashi',      'TMG', 'Lubumbashi',        'A_VALIDER'),
    ('TMG-A07', 'Tribunal Militaire de Garnison de Bukavu',          'TMG', 'Bukavu',            'A_VALIDER'),
    ('TMG-A08', 'Tribunal Militaire de Garnison de Mbandaka',        'TMG', 'Mbandaka',          'A_VALIDER'),
    ('TMG-A09', 'Tribunal Militaire de Garnison de Kindu',           'TMG', 'Kindu',             'A_VALIDER')
ON CONFLICT (ini) DO NOTHING;

-- Trace l'origine de ce pré-remplissage dans l'historique
INSERT INTO ref_juridiction_militaire_historique (ini, type_evenement, commentaire)
SELECT ini, 'CREATION', 'Repéré par recoupement de sources web (rapports judiciaires, presse) le 29/07/2026 — PAS une liste officielle confirmée. À valider avant toute création d''institution réelle.'
FROM ref_juridiction_militaire WHERE statut = 'A_VALIDER';

-- ----------------------------------------------------------------------------
-- 6. Contrôle
-- ----------------------------------------------------------------------------
SELECT type_juridiction, statut, COUNT(*) AS nb
FROM ref_juridiction_militaire
GROUP BY type_juridiction, statut
ORDER BY type_juridiction, statut;

COMMIT;
\echo '=== Référentiel National des Juridictions et Auditorats Militaires créé (Tome 22) ==='
\echo 'Table ref_juridiction_militaire : HCM + 12 CM en ACTIVE (déjà réels), 9 TMG en A_VALIDER (non confirmés)'
\echo 'Table ref_auditorat_militaire : créée, vide (à peupler quand les TMG seront validés)'
