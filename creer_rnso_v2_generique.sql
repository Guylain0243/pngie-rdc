-- ============================================================================
-- PNGIE-RDC — RNSO v2 : modèle générique universel (Structure/Poste/Affectation)
--
-- ⚠️ SCHÉMA PARALLÈLE — n'affecte PAS institution/unite_organisationnelle/poste
-- existants. Destiné aux FUTURES institutions ou à un usage expérimental,
-- en attendant une décision de migration complète (voir document
-- "RNSO_v2_architecture_et_plan_migration.md" fourni séparément).
--
-- Objets universels (7) : Institution (RNI existant), Structure, Poste,
-- Affectation, Fonction, Hiérarchie (récursive), Règles.
--
-- Exécution : psql -f .\creer_rnso_v2_generique.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Types de structure et de poste (référentiels de valeurs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_type_structure (
    id      SERIAL PRIMARY KEY,
    code    VARCHAR(30) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL
);

INSERT INTO rnso_type_structure (code, libelle) VALUES
('CABINET',       'Cabinet'),
('SECRETARIAT',   'Secrétariat Général'),
('DIRECTION',     'Direction'),
('DIVISION',      'Division'),
('SERVICE',       'Service'),
('BUREAU',        'Bureau'),
('GREFFE',        'Greffe'),
('PARQUET',       'Parquet'),
('CHAMBRE',       'Chambre'),
('INSPECTION',    'Inspection'),
('DEPARTEMENT',   'Département'),
('CELLULE',       'Cellule')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS rnso_type_poste (
    id      SERIAL PRIMARY KEY,
    code    VARCHAR(30) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL
);

INSERT INTO rnso_type_poste (code, libelle) VALUES
('PRESIDENT',        'Président'),
('PREMIER_PRESIDENT','Premier Président'),
('MINISTRE',         'Ministre'),
('GREFFIER',         'Greffier'),
('PROCUREUR',        'Procureur'),
('CHEF_DIVISION',    'Chef de Division'),
('DIRECTEUR',        'Directeur')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Structure (hiérarchie récursive, historisée, rattachée au RNI existant)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS rnso_structure_seq;

CREATE TABLE IF NOT EXISTS rnso_structure (
    structure_id      BIGINT PRIMARY KEY DEFAULT nextval('rnso_structure_seq'),
    code_national     VARCHAR(20) GENERATED ALWAYS AS ('STR-' || lpad(structure_id::text, 9, '0')) STORED,
    institution_id    UUID NOT NULL REFERENCES institution(institution_id),  -- rattachement RNI obligatoire
    parent_id         BIGINT REFERENCES rnso_structure(structure_id),
    type_structure_id INTEGER NOT NULL REFERENCES rnso_type_structure(id),
    nom               VARCHAR(255) NOT NULL,
    modele_id         INTEGER REFERENCES rnso_modele(modele_id),  -- si générée depuis un modèle du MNGI
    version           INTEGER NOT NULL DEFAULT 1,
    date_creation     DATE NOT NULL DEFAULT CURRENT_DATE,
    date_effet        DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin          DATE,                       -- NULL = toujours active
    etat              VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (etat IN ('ACTIF','CLOTURE','SUSPENDU')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Empêche les cycles dans la hiérarchie (contrainte demandée par le Tome)
CREATE OR REPLACE FUNCTION rnso_check_no_cycle() RETURNS TRIGGER AS $$
DECLARE
    v_current BIGINT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF NEW.parent_id = NEW.structure_id THEN
        RAISE EXCEPTION 'rnso_structure : une structure ne peut pas être son propre parent (id=%)', NEW.structure_id;
    END IF;
    v_current := NEW.parent_id;
    WHILE v_current IS NOT NULL LOOP
        IF v_current = NEW.structure_id THEN
            RAISE EXCEPTION 'rnso_structure : cycle détecté dans la hiérarchie (structure_id=%)', NEW.structure_id;
        END IF;
        SELECT parent_id INTO v_current FROM rnso_structure WHERE structure_id = v_current;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rnso_no_cycle ON rnso_structure;
CREATE TRIGGER trg_rnso_no_cycle
    BEFORE INSERT OR UPDATE ON rnso_structure
    FOR EACH ROW EXECUTE FUNCTION rnso_check_no_cycle();

-- Vue récursive : reconstruit l'organigramme complet à partir de la hiérarchie
-- (remplace la table "rnso_hierarchie" du Tome — matérialisée en vue plutôt
-- qu'en table physique, pour rester automatiquement à jour sans job de sync)
CREATE OR REPLACE VIEW rnso_hierarchie AS
WITH RECURSIVE arbre AS (
    SELECT structure_id, institution_id, parent_id, nom, 0 AS profondeur,
           ARRAY[structure_id] AS chemin
    FROM rnso_structure
    WHERE parent_id IS NULL AND etat = 'ACTIF'
    UNION ALL
    SELECT s.structure_id, s.institution_id, s.parent_id, s.nom, a.profondeur + 1,
           a.chemin || s.structure_id
    FROM rnso_structure s
    JOIN arbre a ON s.parent_id = a.structure_id
    WHERE s.etat = 'ACTIF'
)
SELECT * FROM arbre;

-- ----------------------------------------------------------------------------
-- 3. Poste (existe même vacant, historisé)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS rnso_poste_seq;

CREATE TABLE IF NOT EXISTS rnso_poste (
    poste_id        BIGINT PRIMARY KEY DEFAULT nextval('rnso_poste_seq'),
    code_national   VARCHAR(20) GENERATED ALWAYS AS ('POS-' || lpad(poste_id::text, 9, '0')) STORED,
    structure_id    BIGINT NOT NULL REFERENCES rnso_structure(structure_id),
    type_poste_id   INTEGER NOT NULL REFERENCES rnso_type_poste(id),
    intitule        VARCHAR(255) NOT NULL,
    nombre_autorise INTEGER NOT NULL DEFAULT 1,
    version         INTEGER NOT NULL DEFAULT 1,
    date_effet      DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,
    etat            VARCHAR(20) NOT NULL DEFAULT 'VACANT' CHECK (etat IN ('ACTIF','VACANT','CLOTURE','SUSPENDU')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Affectation (Utilisateur → Poste) — un seul titulaire actif à la fois
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_affectation (
    affectation_id  BIGSERIAL PRIMARY KEY,
    poste_id        BIGINT NOT NULL REFERENCES rnso_poste(poste_id),
    personne_id     UUID,  -- lien vers le registre national des personnes ; non contraint en FK (schéma non confirmé)
    date_debut      DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,
    statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','TERMINE','SUSPENDU')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrainte : un poste ne peut avoir qu'un seul titulaire ACTIF à la fois
-- (sauf cas explicitement prévus, à gérer hors contrainte SQL si besoin)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rnso_affectation_poste_actif
    ON rnso_affectation (poste_id) WHERE statut = 'ACTIF';

-- ----------------------------------------------------------------------------
-- 5. Fonction (rôles temporaires : Président intérimaire, Rapporteur...)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_fonction (
    fonction_id     BIGSERIAL PRIMARY KEY,
    affectation_id  BIGINT REFERENCES rnso_affectation(affectation_id),
    poste_id        BIGINT REFERENCES rnso_poste(poste_id),
    libelle         VARCHAR(255) NOT NULL,
    date_debut      DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. Règles de composition (ex: une Direction contient 1..N Divisions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_regle (
    regle_id                  SERIAL PRIMARY KEY,
    type_structure_parent_id  INTEGER NOT NULL REFERENCES rnso_type_structure(id),
    type_structure_enfant_id  INTEGER NOT NULL REFERENCES rnso_type_structure(id),
    cardinalite_min           INTEGER NOT NULL DEFAULT 0,
    cardinalite_max           INTEGER,  -- NULL = illimité
    commentaire               TEXT,
    UNIQUE (type_structure_parent_id, type_structure_enfant_id)
);

-- Quelques règles d'exemple issues du Tome (Direction→Division, Division→Service)
INSERT INTO rnso_regle (type_structure_parent_id, type_structure_enfant_id, cardinalite_min, cardinalite_max, commentaire)
SELECT p.id, e.id, 1, NULL, 'Une Direction contient 1..N Divisions'
FROM rnso_type_structure p, rnso_type_structure e
WHERE p.code = 'DIRECTION' AND e.code = 'DIVISION'
ON CONFLICT (type_structure_parent_id, type_structure_enfant_id) DO NOTHING;

INSERT INTO rnso_regle (type_structure_parent_id, type_structure_enfant_id, cardinalite_min, cardinalite_max, commentaire)
SELECT p.id, e.id, 0, NULL, 'Une Division contient 0..N Services'
FROM rnso_type_structure p, rnso_type_structure e
WHERE p.code = 'DIVISION' AND e.code = 'SERVICE'
ON CONFLICT (type_structure_parent_id, type_structure_enfant_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Historisation générique (traçabilité, pas de suppression physique)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnso_historique (
    id               BIGSERIAL PRIMARY KEY,
    objet_type       VARCHAR(30) NOT NULL,  -- STRUCTURE, POSTE, AFFECTATION, FONCTION
    objet_id         BIGINT NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- CREATION, MODIFICATION, CLOTURE, NOUVELLE_VERSION
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. Contrôle
-- ----------------------------------------------------------------------------
SELECT 'rnso_type_structure' AS table_name, COUNT(*) AS nb FROM rnso_type_structure
UNION ALL SELECT 'rnso_type_poste', COUNT(*) FROM rnso_type_poste
UNION ALL SELECT 'rnso_structure', COUNT(*) FROM rnso_structure
UNION ALL SELECT 'rnso_poste', COUNT(*) FROM rnso_poste
UNION ALL SELECT 'rnso_affectation', COUNT(*) FROM rnso_affectation
UNION ALL SELECT 'rnso_regle', COUNT(*) FROM rnso_regle;

COMMIT;
\echo '=== RNSO v2 générique créé (schéma parallèle) ==='
\echo 'Types de structure : 12 | Types de poste : 7 | Structures/postes réels : 0 (aucune migration effectuée)'
\echo 'AUCUNE donnée de institution/unite_organisationnelle/poste n''a été touchée ou dupliquée.'
