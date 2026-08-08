-- ============================================================================
-- PNGIE-RDC — J14 : Intégration des 17 premiers TGI validés dans RNTGI
-- + création RNSJ-000003 (Ordonnance n°82-044, niveau B)
-- + liaison RNTGI <-> RNSJ via rnsj_relation
--
-- Prérequis : RNSJ v1 déjà créé (creer_rnsj_v1.sql exécuté avec succès).
-- La table ref_tribunal_grande_instance existe déjà (créée en session
-- antérieure) mais sans les colonnes de gouvernance (niveau_preuve,
-- date_validation, valide_par, province_administrative_actuelle) : on les
-- ajoute ici avant d'insérer les données.
--
-- Exécution : psql -f .\integrer_rntgi_serie1a5.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ajout des colonnes de gouvernance manquantes sur ref_tribunal_grande_instance
-- ----------------------------------------------------------------------------
ALTER TABLE ref_tribunal_grande_instance
    ADD COLUMN IF NOT EXISTS niveau_preuve CHAR(1) CHECK (niveau_preuve IN ('A', 'B', 'C', 'D')),
    ADD COLUMN IF NOT EXISTS province_administrative_actuelle VARCHAR(100),
    ADD COLUMN IF NOT EXISTS date_validation DATE,
    ADD COLUMN IF NOT EXISTS valide_par VARCHAR(255);

COMMENT ON COLUMN ref_tribunal_grande_instance.province IS
    'Province telle que désignée dans l''acte juridique fondateur (peut être obsolète administrativement, ex: Kasaï Occidental).';
COMMENT ON COLUMN ref_tribunal_grande_instance.province_administrative_actuelle IS
    'Province administrative actuelle (post-redécoupage 2015 le cas échéant). Distincte de province pour préserver la traçabilité historique.';

-- ----------------------------------------------------------------------------
-- 2. RNSJ-000003 : Ordonnance n°82-044 du 31/03/1982 (niveau B)
--    Texte primaire non localisé ; corroboré par 3 sources secondaires
--    indépendantes concordantes (cf. conversation).
-- ----------------------------------------------------------------------------
INSERT INTO rnsj_texte (
    nature, reference_officielle, titre, date_signature, date_publication,
    etat_juridique, domaine, objet, texte_source_url, localisation_jo,
    niveau_preuve, date_validation, valide_par, observations
) VALUES (
    'ORDONNANCE',
    'Ordonnance n°82-044 du 31 mars 1982',
    'Ordonnance d''organisation judiciaire n°82-044 du 31 mars 1982 portant fixation du ressort territorial des tribunaux de grande instance de la ville de Kinshasa',
    '1982-03-31',
    NULL,
    'EN_VIGUEUR',
    'Justice',
    'Fixation du ressort territorial des TGI de la ville de Kinshasa (Gombe, Kalamu, Matete)',
    NULL,
    NULL,
    'B',
    '2026-07-30',
    'PNGIE-RDC',
    'Texte primaire non localisé malgré recherche. Niveau B : corroboré par 3 sources secondaires indépendantes et concordantes (rapports de stage PGI Kinshasa/Matete x2, PGI Kinshasa/Kalamu, et cohérence avec le ressort des tribunaux de paix de Gombe/Ngaliema rattachés à la même Cour d''Appel). À requalifier en niveau A si le texte du Journal Officiel (JOZ 1982) est retrouvé.'
)
ON CONFLICT (reference_officielle) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Insertion des 17 TGI (Séries 1 à 5) — idempotent via ON CONFLICT (ini)
-- ----------------------------------------------------------------------------
INSERT INTO ref_tribunal_grande_instance (
    ini, code_institution, denomination_officielle, ressort_territorial,
    province, province_administrative_actuelle, ville_siege,
    cour_appel_rattachement, date_creation, reference_acte_juridique,
    statut, niveau_preuve, date_validation, valide_par
) VALUES
-- Série 1 — Kinshasa (niveau B : Gombe/Kalamu/Matete ; niveau A : N'Djili/Kinkole)
('RNTGI-000001', 'TGI_GOMBE',    'Tribunal de Grande Instance de Kinshasa/Gombe',
    'Communes de Gombe, Barumbu, Kinshasa, Lingwala, Kitambo, Ngaliema, Mont-Ngafula',
    'Kinshasa', 'Kinshasa', 'Gombe', NULL, NULL,
    'Ordonnance n°82-044 du 31/03/1982 (niveau B)', 'ACTIVE', 'B', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000002', 'TGI_KALAMU',   'Tribunal de Grande Instance de Kinshasa/Kalamu',
    'Communes de Kalamu, Kasa-Vubu, Bandalungwa, Ngiri-Ngiri, Bumbu, Selembao, Makala',
    'Kinshasa', 'Kinshasa', 'Kalamu', NULL, NULL,
    'Ordonnance n°82-044 du 31/03/1982 (niveau B)', 'ACTIVE', 'B', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000003', 'TGI_MATETE',   'Tribunal de Grande Instance de Kinshasa/Matete',
    'Communes de Matete, Lemba, Limete, Ngaba, Kisenso (+ Makala à titre exceptionnel pour le tribunal de paix)',
    'Kinshasa', 'Kinshasa', 'Matete', NULL, NULL,
    'Ordonnance n°82-044 du 31/03/1982 (niveau B)', 'ACTIVE', 'B', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000004', 'TGI_NDJILI',   'Tribunal de Grande Instance de N''Djili',
    'Communes de N''Djili, Kimbanseke, Masina',
    'Kinshasa', 'Kinshasa', 'N''Djili', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000005', 'TGI_KINKOLE',  'Tribunal de Grande Instance de Kinkole',
    'Communes de N''Sele, Maluku',
    'Kinshasa', 'Kinshasa', 'Kinkole', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

-- Série 2 — Nord-Kivu (niveau A)
('RNTGI-000006', 'TGI_GOMA',     'Tribunal de Grande Instance de Goma',
    'Territoires de Masisi, Rutshuru, Walikale',
    'Nord-Kivu', 'Nord-Kivu', 'Goma', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000007', 'TGI_BUTEMBO',  'Tribunal de Grande Instance de Butembo',
    'Territoire de Lubero',
    'Nord-Kivu', 'Nord-Kivu', 'Butembo', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000008', 'TGI_BENI',     'Tribunal de Grande Instance de Beni',
    'Territoire de Beni',
    'Nord-Kivu', 'Nord-Kivu', 'Beni', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

-- Série 3 — Sud-Kivu (niveau A)
('RNTGI-000009', 'TGI_UVIRA',    'Tribunal de Grande Instance d''Uvira',
    'Ville d''Uvira et territoire de Fizi',
    'Sud-Kivu', 'Sud-Kivu', 'Uvira', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000010', 'TGI_KAVUMU',   'Tribunal de Grande Instance de Kavumu',
    'Territoires d''Idjwi, Kabare, Kalehe',
    'Sud-Kivu', 'Sud-Kivu', 'Kavumu', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000011', 'TGI_KAMITUGA', 'Tribunal de Grande Instance de Kamituga',
    'Territoires de Walungu, Mwenga, Shabunda',
    'Sud-Kivu', 'Sud-Kivu', 'Kamituga', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

-- Série 4 — Maniema (niveau A, Cour d'Appel à vérifier séparément)
('RNTGI-000012', 'TGI_KINDU',    'Tribunal de Grande Instance de Kindu',
    'Territoire de Kibombo',
    'Maniema', 'Maniema', 'Kindu', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000013', 'TGI_KASONGO',  'Tribunal de Grande Instance de Kasongo',
    'Territoires de Kasongo, Kabambare',
    'Maniema', 'Maniema', 'Kasongo', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000014', 'TGI_PUNIA',    'Tribunal de Grande Instance de Punia',
    'Territoires de Punia, Lubutu',
    'Maniema', 'Maniema', 'Punia', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000015', 'TGI_KALIMA',   'Tribunal de Grande Instance de Kalima',
    'Ville de Kalima, territoires de Pangi, Kailo',
    'Maniema', 'Maniema', 'Kalima', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

-- Série 5 — Kasaï Occidental / actuellement Kasaï (niveau A, Cour d'Appel à vérifier)
('RNTGI-000016', 'TGI_LUEBO',    'Tribunal de Grande Instance de Luebo',
    'Territoires de Luebo, Ilebo, Mweka, Dekese',
    'Kasaï Occidental', 'Kasaï', 'Luebo', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC'),

('RNTGI-000017', 'TGI_TSHIKAPA', 'Tribunal de Grande Instance de Tshikapa',
    'Ville et territoire de Tshikapa',
    'Kasaï Occidental', 'Kasaï', 'Tshikapa', NULL, '2014-05-08',
    'Décret n°14/015 du 08/05/2014', 'ACTIVE', 'A', '2026-07-30', 'PNGIE-RDC')

ON CONFLICT (ini) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Liaison RNTGI -> RNSJ via rnsj_relation
--    id_rnsj = 2 (Décret 14/015) pour les 14 TGI qui en découlent
--    id_rnsj = 3 (Ordonnance 82-044) pour les 3 TGI historiques de Kinshasa
-- ----------------------------------------------------------------------------
INSERT INTO rnsj_relation (id_rnsj, table_cible, id_cible, code_cible, role, date_effet)
SELECT t.id_rnsj, 'ref_tribunal_grande_instance', v.ini, v.ini, 'SOURCE_PRIMAIRE', v.date_effet
FROM (VALUES
    ('RNTGI-000001', 'Ordonnance n°82-044 du 31 mars 1982', DATE '1982-03-31'),
    ('RNTGI-000002', 'Ordonnance n°82-044 du 31 mars 1982', DATE '1982-03-31'),
    ('RNTGI-000003', 'Ordonnance n°82-044 du 31 mars 1982', DATE '1982-03-31'),
    ('RNTGI-000004', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000005', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000006', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000007', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000008', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000009', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000010', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000011', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000012', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000013', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000014', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000015', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000016', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08'),
    ('RNTGI-000017', 'Décret n°14/015 du 08 mai 2014', DATE '2014-05-08')
) AS v(ini, ref, date_effet)
JOIN rnsj_texte t ON t.reference_officielle = v.ref
ON CONFLICT (id_rnsj, table_cible, id_cible, role) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Vérification immédiate
-- ----------------------------------------------------------------------------
\echo ''
\echo '=== RNTGI : 17 TGI integres ==='
SELECT ini, denomination_officielle, province, province_administrative_actuelle,
       niveau_preuve, statut, cour_appel_rattachement
FROM ref_tribunal_grande_instance
ORDER BY ini;

\echo ''
\echo '=== Liaisons RNTGI -> RNSJ ==='
SELECT r.code_cible, t.code_rnsj, t.reference_officielle, t.niveau_preuve
FROM rnsj_relation r
JOIN rnsj_texte t ON t.id_rnsj = r.id_rnsj
WHERE r.table_cible = 'ref_tribunal_grande_instance'
ORDER BY r.code_cible;

\echo ''
\echo '=== Repartition par niveau de preuve ==='
SELECT niveau_preuve, COUNT(*) AS nb
FROM ref_tribunal_grande_instance
GROUP BY niveau_preuve
ORDER BY niveau_preuve;

COMMIT;

\echo ''
\echo '=== FIN INTEGRATION SERIES 1-5 ==='
