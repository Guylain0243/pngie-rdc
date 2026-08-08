-- ============================================================================
-- PNGIE-RDC — Peuplement des Cours d'Appel (27, liste officielle CSM-RDC)
-- Source : https://csm-rdc.cd/Rubriques/Juridiction/Cours-dappel (consulté 29/07/2026)
-- Structure appliquée : "proposée à valider" (pas de Tome officiel par cour reçu)
--   → même statut que Cour de Cassation / Conseil d'État déjà peuplés
--
-- ⚠️ AVANT EXECUTION : vérifiez les noms de colonnes réels avec :
--   \d institution
--   \d unite_organisationnelle
--   \d poste
-- Ce script suppose : institution(id, code, nom, type, statut)
--                      unite_organisationnelle(id, institution_id, code, nom)
--                      poste(id, unite_id, code, intitule)
-- Adaptez si vos colonnes diffèrent (ex: nom -> libelle, intitule -> nom, etc.)
--
-- Exécution : psql -f populate_cours_appel.sql "%PNGIE_DB_URL%"
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Vérification préalable : aucune de ces cours ne doit déjà exister
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    nb_existantes int;
BEGIN
    SELECT COUNT(*) INTO nb_existantes
    FROM institution
    WHERE code LIKE 'CA_%';

    IF nb_existantes > 0 THEN
        RAISE NOTICE '⚠️ % institution(s) avec code CA_% existent déjà — vérifiez avant de continuer (le script continue quand même, sur ON CONFLICT DO NOTHING)', nb_existantes;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Liste officielle des 27 Cours d'Appel
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE t_cours_appel (code text PRIMARY KEY, nom text);

INSERT INTO t_cours_appel (code, nom) VALUES
('CA_KINSHASA_GOMBE',   'Cour d''Appel de Kinshasa/Gombe'),
('CA_KINSHASA_MATETE',  'Cour d''Appel de Kinshasa/Matete'),
('CA_BAS_UELE',         'Cour d''Appel du Bas-Uele'),
('CA_EQUATEUR',         'Cour d''Appel de l''Équateur'),
('CA_HAUT_KATANGA',     'Cour d''Appel du Haut-Katanga'),
('CA_HAUT_LOMAMI',      'Cour d''Appel du Haut-Lomami'),
('CA_HAUT_UELE',        'Cour d''Appel du Haut-Uele'),
('CA_ITURI',            'Cour d''Appel d''Ituri'),
('CA_KASAI',            'Cour d''Appel du Kasaï'),
('CA_KASAI_CENTRAL',    'Cour d''Appel du Kasaï Central'),
('CA_KASAI_ORIENTAL',   'Cour d''Appel du Kasaï Oriental'),
('CA_KONGO_CENTRAL',    'Cour d''Appel du Kongo Central'),
('CA_KWANGO',           'Cour d''Appel du Kwango'),
('CA_KWILU',            'Cour d''Appel du Kwilu'),
('CA_LOMAMI',           'Cour d''Appel de Lomami'),
('CA_LUALABA',          'Cour d''Appel du Lualaba'),
('CA_MAI_NDOMBE',       'Cour d''Appel du Mai-Ndombe'),
('CA_MANIEMA',          'Cour d''Appel du Maniema'),
('CA_MONGALA',          'Cour d''Appel de la Mongala'),
('CA_NORD_KIVU',        'Cour d''Appel du Nord-Kivu'),
('CA_NORD_UBANGI',      'Cour d''Appel du Nord-Ubangi'),
('CA_SANKURU',          'Cour d''Appel du Sankuru'),
('CA_SUD_KIVU',         'Cour d''Appel du Sud-Kivu'),
('CA_SUD_UBANGI',       'Cour d''Appel du Sud-Ubangi'),
('CA_TANGANYIKA',       'Cour d''Appel du Tanganyika'),
('CA_TSHOPO',           'Cour d''Appel de la Tshopo'),
('CA_TSHUAPA',          'Cour d''Appel de la Tshuapa');

-- ----------------------------------------------------------------------------
-- 3. Modèle standard d'unités + postes (proposé, à valider)
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE t_modele (
    suffixe_unite  text,
    nom_unite      text,
    suffixe_poste  text,
    intitule_poste text
);

INSERT INTO t_modele (suffixe_unite, nom_unite, suffixe_poste, intitule_poste) VALUES
('PRESIDENCE',   'Présidence',            'PP',  'Premier Président'),
('PARQUET_GEN',  'Parquet Général',        'PG',  'Procureur Général'),
('CH_CIVILE',    'Chambre Civile',         'PCC', 'Président de la Chambre Civile'),
('CH_PENALE',    'Chambre Pénale',         'PCP', 'Président de la Chambre Pénale'),
('CH_SOCIALE',   'Chambre Sociale',        'PCS', 'Président de la Chambre Sociale'),
('GREFFE',       'Greffe',                 'GC',  'Greffier en Chef'),
('SG',           'Secrétariat Général',    'SG',  'Secrétaire Général');

-- ----------------------------------------------------------------------------
-- 4. Insertion des institutions
-- ----------------------------------------------------------------------------
INSERT INTO institution (code, nom, type, statut)
SELECT code, nom, 'juridiction', 'ACTIF'
FROM t_cours_appel
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Insertion des unités organisationnelles (27 x 7 = 189 unités)
-- ----------------------------------------------------------------------------
INSERT INTO unite_organisationnelle (institution_id, code, nom)
SELECT i.id, i.code || '-' || m.suffixe_unite, m.nom_unite
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele m
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Insertion des postes (27 x 7 = 189 postes)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.id, u.code || '-' || m.suffixe_poste, m.intitule_poste
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele m
JOIN unite_organisationnelle u
    ON u.institution_id = i.id
   AND u.code = i.code || '-' || m.suffixe_unite
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Contrôle final avant COMMIT
-- ----------------------------------------------------------------------------
SELECT
    c.code,
    c.nom,
    COUNT(DISTINCT u.id) AS nb_unites,
    COUNT(DISTINCT p.id) AS nb_postes
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.id
LEFT JOIN poste p ON p.unite_id = u.id
GROUP BY c.code, c.nom
ORDER BY c.code;

-- Si le résultat ci-dessus montre bien 7 unités / 7 postes pour les 27 cours :
COMMIT;
-- Sinon, remplacez COMMIT par ROLLBACK avant d'exécuter, corrigez, et relancez.

\echo '=== Peuplement des 27 Cours d''Appel terminé ==='
