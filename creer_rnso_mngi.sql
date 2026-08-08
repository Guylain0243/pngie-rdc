-- ============================================================================
-- PNGIE-RDC — RNSO (Référentiel National des Structures Organisationnelles)
-- + MNGI (moteur de génération, version structurelle : unités + postes)
--
-- Portée réelle de ce script : modèles organisationnels réutilisables et
-- génération automatique de la structure (unités/postes) d'une institution
-- à partir d'un modèle. Ne couvre PAS : comptes utilisateurs, portails,
-- workflows, GED, tableaux de bord (couche applicative, hors SQL).
--
-- Amorcé avec deux modèles déjà éprouvés cette session : TMG_STANDARD
-- (Tome 16, utilisé pour les 26 TMG réels) et AUDIT_TMG_STANDARD
-- (Tome 21, utilisé pour les 26 Auditorats près TMG).
--
-- Exécution : psql -f .\creer_rnso_mngi.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. RNSO — Modèles organisationnels
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_modele (
    modele_id               SERIAL PRIMARY KEY,
    code                    VARCHAR(30) UNIQUE NOT NULL,
    nom                     VARCHAR(255) NOT NULL,
    domaine                 VARCHAR(50),               -- ex: justice, finances, justice_militaire
    type_institution_cible  VARCHAR(50),                -- ex: ministere, juridiction, parquet
    description             TEXT,
    version                 INTEGER NOT NULL DEFAULT 1,
    statut                  VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                                CHECK (statut IN ('ACTIF','OBSOLETE','BROUILLON')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rnso_modele_unite (
    id             SERIAL PRIMARY KEY,
    modele_id      INTEGER NOT NULL REFERENCES rnso_modele(modele_id),
    code_unite     VARCHAR(30) NOT NULL,
    nom_unite      VARCHAR(255) NOT NULL,
    type_unite     VARCHAR(50) NOT NULL,
    ordre          INTEGER DEFAULT 0,
    UNIQUE (modele_id, code_unite)
);

CREATE TABLE IF NOT EXISTS rnso_modele_poste (
    id                     SERIAL PRIMARY KEY,
    modele_unite_id        INTEGER NOT NULL REFERENCES rnso_modele_unite(id),
    code_poste             VARCHAR(30) NOT NULL,
    intitule_poste         VARCHAR(255) NOT NULL,
    nombre_postes_defaut   INTEGER NOT NULL DEFAULT 1,
    UNIQUE (modele_unite_id, code_poste)
);

CREATE TABLE IF NOT EXISTS rnso_modele_historique (
    id               SERIAL PRIMARY KEY,
    modele_id        INTEGER NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- CREATION, MODIFICATION, NOUVELLE_VERSION, OBSOLESCENCE
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. MNGI — Fonction de génération automatique (unités + postes)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mngi_generer_institution(
    p_institution_id UUID,
    p_code_modele    VARCHAR
) RETURNS TABLE(unites_creees INT, postes_crees INT) AS $$
DECLARE
    v_modele_id INTEGER;
    v_unites_creees INT := 0;
    v_postes_crees INT := 0;
BEGIN
    SELECT modele_id INTO v_modele_id
    FROM rnso_modele
    WHERE code = p_code_modele AND statut = 'ACTIF';

    IF v_modele_id IS NULL THEN
        RAISE EXCEPTION 'Modèle "%" introuvable ou non actif dans le RNSO', p_code_modele;
    END IF;

    INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
    SELECT p_institution_id, mu.code_unite, mu.nom_unite, mu.type_unite
    FROM rnso_modele_unite mu
    WHERE mu.modele_id = v_modele_id
    ON CONFLICT (institution_id, code) DO NOTHING;
    GET DIAGNOSTICS v_unites_creees = ROW_COUNT;

    INSERT INTO poste (unite_id, code, intitule)
    SELECT u.unite_id, mp.code_poste, mp.intitule_poste
    FROM rnso_modele_unite mu
    JOIN rnso_modele_poste mp ON mp.modele_unite_id = mu.id
    JOIN unite_organisationnelle u ON u.institution_id = p_institution_id AND u.code = mu.code_unite
    WHERE mu.modele_id = v_modele_id
    ON CONFLICT (unite_id, code) DO NOTHING;
    GET DIAGNOSTICS v_postes_crees = ROW_COUNT;

    INSERT INTO rnso_modele_historique (modele_id, type_evenement, nouvelle_valeur, commentaire)
    VALUES (v_modele_id, 'APPLICATION',
            jsonb_build_object('institution_id', p_institution_id, 'unites_creees', v_unites_creees, 'postes_crees', v_postes_crees),
            'Modèle appliqué via mngi_generer_institution()');

    RETURN QUERY SELECT v_unites_creees, v_postes_crees;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Amorçage : deux modèles déjà éprouvés cette session
-- ----------------------------------------------------------------------------

-- 3.1 Modèle TMG_STANDARD (Tome 16 — utilisé pour les 26 TMG réels)
INSERT INTO rnso_modele (code, nom, domaine, type_institution_cible, description)
VALUES ('TMG_STANDARD', 'Tribunal Militaire de Garnison — modèle standard', 'justice_militaire', 'juridiction',
        'Modèle appliqué aux 26 TMG créés lors de cette session (Tome 16).')
ON CONFLICT (code) DO NOTHING;

INSERT INTO rnso_modele_unite (modele_id, code_unite, nom_unite, type_unite, ordre)
SELECT m.modele_id, t.code_unite, t.nom_unite, t.type_unite, t.ordre
FROM rnso_modele m
CROSS JOIN (VALUES
    ('PRESIDENCE',      'Président du Tribunal',      'PRESIDENCE', 1),
    ('VICE_PRESIDENT',  'Vice-Président',             'DIRECTION',  2),
    ('MIN_PUBLIC',      'Ministère Public Militaire',  'PARQUET',    3),
    ('GREFFE',          'Greffe Principal',            'GREFFE',     4),
    ('CH_JUGEMENT',     'Chambres de Jugement',        'CHAMBRE',    5),
    ('SVC_INSTRUCTION', 'Service d''Instruction',      'DIRECTION',  6),
    ('SVC_ADMIN',       'Service Administratif',       'DIRECTION',  7),
    ('SVC_FIN',         'Service Financier',           'DIRECTION',  8),
    ('ARCHIVES',        'Archives Judiciaires',        'DIRECTION',  9),
    ('INFO',            'Informatique',                'DIRECTION', 10),
    ('CELL_PNGIE',      'Cellule PNGIE-RDC',           'CELLULE',   11),
    ('SECURITE',        'Sécurité',                    'DIRECTION', 12)
) AS t(code_unite, nom_unite, type_unite, ordre)
WHERE m.code = 'TMG_STANDARD'
ON CONFLICT (modele_id, code_unite) DO NOTHING;

INSERT INTO rnso_modele_poste (modele_unite_id, code_poste, intitule_poste)
SELECT mu.id, x.code_poste, x.intitule_poste
FROM rnso_modele m
JOIN rnso_modele_unite mu ON mu.modele_id = m.modele_id
CROSS JOIN LATERAL (VALUES
    ('PRESIDENCE',      'PT',   'Président du Tribunal'),
    ('VICE_PRESIDENT',  'VP',   'Vice-Président'),
    ('MIN_PUBLIC',      'AM',   'Auditeur Militaire'),
    ('MIN_PUBLIC',      'PS',   'Premier Substitut'),
    ('MIN_PUBLIC',      'SUB',  'Substitut'),
    ('GREFFE',          'GC',   'Greffier en Chef'),
    ('CH_JUGEMENT',     'PCJ',  'Président de Chambre de Jugement'),
    ('SVC_INSTRUCTION', 'CSI',  'Chef du Service d''Instruction'),
    ('SVC_ADMIN',       'CSA',  'Chef du Service Administratif'),
    ('SVC_FIN',         'CSF',  'Chef du Service Financier'),
    ('ARCHIVES',        'ARC',  'Responsable des Archives Judiciaires'),
    ('INFO',            'INF',  'Responsable Informatique'),
    ('CELL_PNGIE',      'CP',   'Chef de la Cellule PNGIE-RDC'),
    ('SECURITE',        'SEC',  'Responsable de la Sécurité')
) AS x(code_unite, code_poste, intitule_poste)
WHERE m.code = 'TMG_STANDARD' AND mu.code_unite = x.code_unite
ON CONFLICT (modele_unite_id, code_poste) DO NOTHING;

-- 3.2 Modèle AUDIT_TMG_STANDARD (Tome 21 — utilisé pour les 26 Auditorats près TMG)
INSERT INTO rnso_modele (code, nom, domaine, type_institution_cible, description)
VALUES ('AUDIT_TMG_STANDARD', 'Auditorat Militaire près TMG — modèle standard', 'justice_militaire', 'parquet',
        'Modèle appliqué aux 26 Auditorats près TMG créés lors de cette session (Tome 21).')
ON CONFLICT (code) DO NOTHING;

INSERT INTO rnso_modele_unite (modele_id, code_unite, nom_unite, type_unite, ordre)
SELECT m.modele_id, t.code_unite, t.nom_unite, t.type_unite, t.ordre
FROM rnso_modele m
CROSS JOIN (VALUES
    ('CABINET',        'Cabinet',                  'CABINET',      1),
    ('MAGISTRATS',     'Magistrats Militaires',    'DIRECTION',    2),
    ('GREFFE_PARQUET', 'Greffe du Parquet',        'GREFFE',       3),
    ('SECRETARIAT',    'Secrétariat',              'SECRETARIAT',  4),
    ('BUR_ENQUETES',   'Bureau des Enquêtes',      'DIRECTION',    5),
    ('BUR_POURSUITES', 'Bureau des Poursuites',    'DIRECTION',    6),
    ('BUR_EXECUTIONS', 'Bureau des Exécutions',    'DIRECTION',    7),
    ('DOCUMENTATION',  'Documentation',            'DIRECTION',    8),
    ('ARCHIVES',       'Archives',                 'DIRECTION',    9),
    ('INFO',           'Informatique',             'DIRECTION',   10),
    ('ADMIN',          'Administration',           'DIRECTION',   11)
) AS t(code_unite, nom_unite, type_unite, ordre)
WHERE m.code = 'AUDIT_TMG_STANDARD'
ON CONFLICT (modele_id, code_unite) DO NOTHING;

INSERT INTO rnso_modele_poste (modele_unite_id, code_poste, intitule_poste)
SELECT mu.id, x.code_poste, x.intitule_poste
FROM rnso_modele m
JOIN rnso_modele_unite mu ON mu.modele_id = m.modele_id
CROSS JOIN LATERAL (VALUES
    ('CABINET',        'AM',   'Auditeur Militaire'),
    ('CABINET',        'AMA',  'Auditeur Militaire Adjoint'),
    ('MAGISTRATS',     'MM',   'Magistrat Militaire'),
    ('GREFFE_PARQUET', 'GC',   'Greffier en Chef du Parquet'),
    ('SECRETARIAT',    'SEC',  'Secrétaire'),
    ('BUR_ENQUETES',   'CBE',  'Chef du Bureau des Enquêtes'),
    ('BUR_POURSUITES', 'CBP',  'Chef du Bureau des Poursuites'),
    ('BUR_EXECUTIONS', 'CBEX', 'Chef du Bureau des Exécutions'),
    ('DOCUMENTATION',  'CD',   'Chef de la Documentation'),
    ('ARCHIVES',       'ARC',  'Responsable des Archives'),
    ('INFO',           'INF',  'Responsable Informatique'),
    ('ADMIN',          'ADM',  'Responsable Administratif')
) AS x(code_unite, code_poste, intitule_poste)
WHERE m.code = 'AUDIT_TMG_STANDARD' AND mu.code_unite = x.code_unite
ON CONFLICT (modele_unite_id, code_poste) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Contrôle
-- ----------------------------------------------------------------------------
SELECT m.code, m.nom, COUNT(DISTINCT mu.id) AS nb_unites_modele, COUNT(DISTINCT mp.id) AS nb_postes_modele
FROM rnso_modele m
LEFT JOIN rnso_modele_unite mu ON mu.modele_id = m.modele_id
LEFT JOIN rnso_modele_poste mp ON mp.modele_unite_id = mu.id
GROUP BY m.code, m.nom
ORDER BY m.code;

-- Attendu : TMG_STANDARD = 12 unités / 14 postes ; AUDIT_TMG_STANDARD = 11 unités / 12 postes
COMMIT;
\echo '=== RNSO + MNGI créés, amorcés avec TMG_STANDARD et AUDIT_TMG_STANDARD ==='
\echo 'Test recommandé (sur une institution existante, sans risque grâce à ON CONFLICT DO NOTHING) :'
\echo 'SELECT * FROM mngi_generer_institution(''<institution_id>'', ''TMG_STANDARD'');'
