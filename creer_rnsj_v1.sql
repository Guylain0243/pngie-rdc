-- ============================================================================
-- PNGIE-RDC — RNSJ v1 (Référentiel National des Sources Juridiques)
-- Schéma transversal : chaque texte juridique n'est enregistré qu'une fois,
-- puis référencé par tous les référentiels métier (RNTGI, RNTMG, RNCA, ...).
--
-- Conventions respectées :
--   - Transaction unique (BEGIN/COMMIT), aucune suppression physique
--   - IF NOT EXISTS partout : script rejouable sans erreur
--   - Identifiants internes BIGINT IDENTITY + code national GENERATED ALWAYS
--     AS ... STORED (même pattern que RNSO v2 : STR-000000001, POS-...)
--   - Historisation par table dédiée (avant/après en JSONB), jamais de DELETE
--
-- Exécution : psql -f .\creer_rnsj_v1.sql $env:PNGIE_ADMIN_DB_URL
-- (ADMIN recommandé pour la création de tables/triggers/policies ; à confirmer
-- selon les droits réels du rôle pngie_app sur ce serveur)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABLE PRINCIPALE : rnsj_texte
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnsj_texte (
    id_rnsj              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code_rnsj            VARCHAR(20) GENERATED ALWAYS AS
                              ('RNSJ-' || LPAD(id_rnsj::text, 6, '0')) STORED,

    nature                VARCHAR(30) NOT NULL CHECK (nature IN (
                              'CONSTITUTION', 'LOI', 'LOI_ORGANIQUE', 'LOI_ORDINAIRE',
                              'ORDONNANCE_LOI', 'ORDONNANCE', 'DECRET', 'DECRET_LOI',
                              'ARRETE', 'ARRETE_MINISTERIEL', 'ARRETE_INTERMINISTERIEL',
                              'DECISION', 'CIRCULAIRE', 'CONVENTION_INTERNATIONALE'
                          )),
    reference_officielle  VARCHAR(500) NOT NULL,
    titre                 TEXT,
    date_signature        DATE,
    date_publication      DATE,
    etat_juridique        VARCHAR(20) NOT NULL DEFAULT 'EN_VIGUEUR' CHECK (etat_juridique IN (
                              'EN_VIGUEUR', 'MODIFIE', 'ABROGE', 'REMPLACE', 'SUSPENDU'
                          )),

    -- Texte libre volontairement : le nombre de domaines métier du PNGIE-RDC
    -- va croître (Justice, Finances, Santé, Éducation, Administration
    -- territoriale, ...) ; à normaliser plus tard via une table de référence
    -- ref_domaine si le besoin de contrôle strict se fait sentir.
    domaine               VARCHAR(100) NOT NULL,

    objet                 TEXT,
    resume                TEXT,
    texte_source_url      TEXT,
    localisation_jo       VARCHAR(255),

    niveau_preuve         CHAR(1) NOT NULL CHECK (niveau_preuve IN ('A', 'B', 'C', 'D')),
    hash_document         VARCHAR(128),

    date_validation       DATE,
    valide_par            VARCHAR(255),
    observations          TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Un même texte officiel ne doit jamais être saisi deux fois
    CONSTRAINT rnsj_texte_reference_unique UNIQUE (reference_officielle)
);

COMMENT ON TABLE rnsj_texte IS
    'RNSJ - Référentiel National des Sources Juridiques. Un enregistrement par texte officiel (loi, ordonnance, décret...), référencé par tous les référentiels métier.';
COMMENT ON COLUMN rnsj_texte.niveau_preuve IS
    'A = texte officiel consulté directement. B = cité/corroboré par plusieurs sources indépendantes. C = une seule source secondaire. D = non intégrable (ne devrait jamais apparaître ici).';

CREATE INDEX IF NOT EXISTS idx_rnsj_texte_nature ON rnsj_texte (nature);
CREATE INDEX IF NOT EXISTS idx_rnsj_texte_domaine ON rnsj_texte (domaine);
CREATE INDEX IF NOT EXISTS idx_rnsj_texte_etat ON rnsj_texte (etat_juridique);
CREATE INDEX IF NOT EXISTS idx_rnsj_texte_niveau_preuve ON rnsj_texte (niveau_preuve);

-- ----------------------------------------------------------------------------
-- 2. HISTORIQUE : rnsj_texte_historique
--    Aucune suppression, aucune modification silencieuse : toute UPDATE sur
--    rnsj_texte est journalisée ici automatiquement (voir trigger §5).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnsj_texte_historique (
    id_historique   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rnsj         BIGINT NOT NULL REFERENCES rnsj_texte(id_rnsj),
    evenement       VARCHAR(30) NOT NULL DEFAULT 'MODIFICATION' CHECK (evenement IN (
                        'CREATION', 'MODIFICATION', 'VALIDATION', 'CHANGEMENT_NIVEAU_PREUVE'
                    )),
    valeurs_avant   JSONB,
    valeurs_apres   JSONB,
    modifie_par     VARCHAR(255) NOT NULL DEFAULT current_user,
    modifie_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rnsj_historique_texte ON rnsj_texte_historique (id_rnsj);

-- ----------------------------------------------------------------------------
-- 3. RELATIONS TEXTE -> REFERENTIELS METIER : rnsj_relation
--    Polymorphe par construction : un même texte du RNSJ peut être la source
--    d'un TGI (ref_tribunal_grande_instance), d'un TMG (ref_juridiction_militaire),
--    d'une institution (institution), etc. — sans imposer une FK par domaine.
--
--    ATTENTION : id_cible est stocké en TEXT (pas de FK réelle, intégrité
--    applicative). Avant d'insérer des liens vers ref_tribunal_grande_instance
--    ou toute autre table, vérifiez d'abord ses colonnes réelles avec
--    \d nom_de_la_table (comme nous l'avons fait pour ref_execution_decision) :
--    ne jamais supposer un nom de colonne.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnsj_relation (
    id_relation   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rnsj       BIGINT NOT NULL REFERENCES rnsj_texte(id_rnsj),

    table_cible   VARCHAR(100) NOT NULL,   -- ex: 'ref_tribunal_grande_instance'
    id_cible      TEXT NOT NULL,           -- ex: valeur de code_rntgi ou id technique
    code_cible    VARCHAR(50),             -- ex: 'RNTGI-000016' (lisibilité/debug)

    role          VARCHAR(30) NOT NULL DEFAULT 'SOURCE_PRIMAIRE' CHECK (role IN (
                      'SOURCE_PRIMAIRE', 'SOURCE_SECONDAIRE', 'ACTE_MODIFICATIF', 'ACTE_ABROGATIF'
                  )),
    date_effet    DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT rnsj_relation_unique UNIQUE (id_rnsj, table_cible, id_cible, role)
);

CREATE INDEX IF NOT EXISTS idx_rnsj_relation_texte ON rnsj_relation (id_rnsj);
CREATE INDEX IF NOT EXISTS idx_rnsj_relation_cible ON rnsj_relation (table_cible, id_cible);

COMMENT ON TABLE rnsj_relation IS
    'Lien polymorphe entre un texte du RNSJ et un enregistrement de n''importe quel référentiel métier (RNTGI, RNTMG, RNCA, institution...). Aucune contrainte FK réelle sur (table_cible, id_cible) : intégrité assurée au niveau applicatif.';

-- ----------------------------------------------------------------------------
-- 4. RELATIONS TEXTE -> TEXTE : rnsj_modification
--    Ex : Décret 14/015 abroge partiellement Ordonnance 82-044 ;
--         Loi organique 17/003 modifie Loi 023-2002 (Code judiciaire militaire).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rnsj_modification (
    id_modification       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rnsj_origine       BIGINT NOT NULL REFERENCES rnsj_texte(id_rnsj),
    id_rnsj_modificateur  BIGINT NOT NULL REFERENCES rnsj_texte(id_rnsj),
    type_relation         VARCHAR(20) NOT NULL CHECK (type_relation IN (
                              'MODIFIE', 'COMPLETE', 'ABROGE', 'REMPLACE', 'ANNULE', 'PROROGE'
                          )),
    date_effet            DATE,
    observations          TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT rnsj_modification_distincts CHECK (id_rnsj_origine <> id_rnsj_modificateur),
    CONSTRAINT rnsj_modification_unique UNIQUE (id_rnsj_origine, id_rnsj_modificateur, type_relation)
);

CREATE INDEX IF NOT EXISTS idx_rnsj_modification_origine ON rnsj_modification (id_rnsj_origine);
CREATE INDEX IF NOT EXISTS idx_rnsj_modification_modificateur ON rnsj_modification (id_rnsj_modificateur);

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS : updated_at automatique + historisation automatique
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_rnsj_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rnsj_texte_updated_at ON rnsj_texte;
CREATE TRIGGER trg_rnsj_texte_updated_at
    BEFORE UPDATE ON rnsj_texte
    FOR EACH ROW
    EXECUTE FUNCTION fn_rnsj_set_updated_at();

CREATE OR REPLACE FUNCTION fn_rnsj_texte_historiser()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO rnsj_texte_historique (id_rnsj, evenement, valeurs_avant, valeurs_apres)
    VALUES (
        OLD.id_rnsj,
        CASE WHEN OLD.niveau_preuve IS DISTINCT FROM NEW.niveau_preuve
             THEN 'CHANGEMENT_NIVEAU_PREUVE' ELSE 'MODIFICATION' END,
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rnsj_texte_historique ON rnsj_texte;
CREATE TRIGGER trg_rnsj_texte_historique
    AFTER UPDATE ON rnsj_texte
    FOR EACH ROW
    EXECUTE FUNCTION fn_rnsj_texte_historiser();

-- ----------------------------------------------------------------------------
-- 6. RLS (Row Level Security)
--    ATTENTION — À ADAPTER AVANT EXECUTION : les noms de rôles ci-dessous
--    (pngie_app, postgres) sont ceux mentionnés dans le récapitulatif de
--    session, mais je n'ai pas vu le détail exact des GRANT/policies déjà
--    en place sur vos autres tables. Vérifiez avec :
--        SELECT * FROM pg_policies WHERE tablename = 'institution';
--    avant de considérer cette section comme définitive. Le bloc DO ci-dessous
--    ne s'exécute que si le rôle existe réellement, pour éviter une erreur
--    bloquante si le nom diffère.
-- ----------------------------------------------------------------------------
ALTER TABLE rnsj_texte ENABLE ROW LEVEL SECURITY;
ALTER TABLE rnsj_relation ENABLE ROW LEVEL SECURITY;
ALTER TABLE rnsj_modification ENABLE ROW LEVEL SECURITY;
ALTER TABLE rnsj_texte_historique ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pngie_app') THEN

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_texte' AND policyname = 'rnsj_texte_lecture') THEN
            CREATE POLICY rnsj_texte_lecture ON rnsj_texte
                FOR SELECT TO pngie_app USING (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_texte' AND policyname = 'rnsj_texte_ecriture') THEN
            CREATE POLICY rnsj_texte_ecriture ON rnsj_texte
                FOR INSERT TO pngie_app WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_relation' AND policyname = 'rnsj_relation_lecture') THEN
            CREATE POLICY rnsj_relation_lecture ON rnsj_relation
                FOR SELECT TO pngie_app USING (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_relation' AND policyname = 'rnsj_relation_ecriture') THEN
            CREATE POLICY rnsj_relation_ecriture ON rnsj_relation
                FOR INSERT TO pngie_app WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_modification' AND policyname = 'rnsj_modification_lecture') THEN
            CREATE POLICY rnsj_modification_lecture ON rnsj_modification
                FOR SELECT TO pngie_app USING (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rnsj_texte_historique' AND policyname = 'rnsj_historique_lecture') THEN
            CREATE POLICY rnsj_historique_lecture ON rnsj_texte_historique
                FOR SELECT TO pngie_app USING (true);
        END IF;

    ELSE
        RAISE NOTICE 'Rôle pngie_app introuvable : policies RLS non créées. Adapter cette section aux rôles réels de la base avant de considérer le RNSJ comme sécurisé.';
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. AMORCE : les deux textes déjà validés dans cette session
--    (ON CONFLICT DO NOTHING : rejouable sans dupliquer si déjà inséré)
-- ----------------------------------------------------------------------------
INSERT INTO rnsj_texte (
    nature, reference_officielle, titre, date_signature, date_publication,
    etat_juridique, domaine, objet, texte_source_url, localisation_jo,
    niveau_preuve, date_validation, valide_par, observations
) VALUES (
    'LOI_ORGANIQUE',
    'Loi organique n°13/011-B du 11 avril 2013',
    'Loi organique n°13/011-B du 11 avril 2013 portant organisation, fonctionnement et compétences des juridictions de l''ordre judiciaire',
    '2013-04-11',
    NULL,  -- date_publication JO à compléter
    'EN_VIGUEUR',
    'Justice',
    'Organisation des juridictions de l''ordre judiciaire',
    'https://leganet.cd',
    NULL,  -- localisation_jo à compléter
    'A',
    '2026-07-30',
    'PNGIE-RDC',
    'Texte fondateur des juridictions de l''ordre judiciaire. Référencé par le RNTGI, les Cours d''Appel, la Cour de cassation et les autres référentiels judiciaires.'
)
ON CONFLICT (reference_officielle) DO NOTHING;

INSERT INTO rnsj_texte (
    nature, reference_officielle, titre, date_signature, date_publication,
    etat_juridique, domaine, objet, texte_source_url, localisation_jo,
    niveau_preuve, date_validation, valide_par, observations
) VALUES (
    'DECRET',
    'Décret n°14/015 du 08 mai 2014',
    'Décret d''organisation judiciaire n°14/015 du 08 mai 2014 fixant les sièges et les ressorts des Tribunaux de Grande Instance',
    '2014-05-08',
    '2014-06-01',
    'EN_VIGUEUR',
    'Justice',
    'Fixation des sièges et ressorts territoriaux des Tribunaux de Grande Instance',
    'https://www.leganet.cd/Legislation/Droit%20Judiciaire/D.14.O15.08.05.2014.htm',
    'J.O. n°11 du 1er juin 2014, p. 41 (à confirmer selon l''exemplaire officiel utilisé)',
    'A',
    '2026-07-30',
    'PNGIE-RDC',
    'Référence principale utilisée pour le RNTGI (13 TGI créés : Kinshasa x2, Nord-Kivu x3, Sud-Kivu x3, Maniema x4, Kasaï Occidental x2). Les TGI de Kinshasa/Gombe, Kalamu et Matete nécessitent des actes antérieurs (Ordonnance n°82-044 du 31/03/1982, niveau B) pour documenter leur création et leur ressort historique.'
)
ON CONFLICT (reference_officielle) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. VERIFICATION IMMEDIATE
-- ----------------------------------------------------------------------------
\echo ''
\echo '=== RNSJ v1 cree ==='
SELECT code_rnsj, nature, reference_officielle, niveau_preuve, etat_juridique
FROM rnsj_texte
ORDER BY id_rnsj;

COMMIT;

\echo ''
\echo '=== FIN CREATION RNSJ v1 ==='
