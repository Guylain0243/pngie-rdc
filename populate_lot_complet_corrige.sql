-- ============================================================================
-- PNGIE-RDC — LOT CORRIGÉ (schéma réel vérifié le 29/07/2026)
-- institution_id / unite_id (pas "id") ; type_institution et type_unite
-- obligatoires (NOT NULL sans défaut) ; unicité unite = (institution_id, code) ;
-- unicité poste = (unite_id, code) ; pourcentage_confiance/participe_calculs
-- sont des colonnes GENERATED, jamais insérées.
-- Exécution : psql -f .\populate_lot_complet_corrige.sql $env:PNGIE_DB_URL
-- ============================================================================


-- ============================================================================
-- SECTION 1 — 27 Cours d'Appel (structure proposée à valider)
-- ============================================================================
BEGIN;

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

CREATE TEMP TABLE t_modele_ca (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_modele_ca VALUES
('PRESIDENCE',  'Présidence',            'PRESIDENCE',   'PP',  'Premier Président'),
('PARQUET_GEN', 'Parquet Général',       'PARQUET',      'PG',  'Procureur Général'),
('CH_CIVILE',   'Chambre Civile',        'CHAMBRE',      'PCC', 'Président de la Chambre Civile'),
('CH_PENALE',   'Chambre Pénale',        'CHAMBRE',      'PCP', 'Président de la Chambre Pénale'),
('CH_SOCIALE',  'Chambre Sociale',       'CHAMBRE',      'PCS', 'Président de la Chambre Sociale'),
('GREFFE',      'Greffe',                'GREFFE',       'GC',  'Greffier en Chef'),
('SG',          'Secrétariat Général',   'SECRETARIAT',  'SG',  'Secrétaire Général');

INSERT INTO institution (code, nom, type_institution, statut)
SELECT code, nom, 'juridiction', 'ACTIF' FROM t_cours_appel
ON CONFLICT (code) DO NOTHING;

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_ca m
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, m.code_poste, m.intitule_poste
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_ca m
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = m.code_unite
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION 1 - Cours Appel' AS section, i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM t_cours_appel c
JOIN institution i ON i.code = c.code
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
GROUP BY i.code ORDER BY i.code;

COMMIT;
\echo '=== SECTION 1 (27 Cours d''Appel) : COMMIT effectué ==='


-- ============================================================================
-- SECTION 2 — Haute Cour Militaire + 12 Cours Militaires
-- ============================================================================
BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
VALUES ('HAUTE_COUR_MILITAIRE', 'Haute Cour Militaire', 'juridiction', 'ACTIF')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_modele_hcm (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_modele_hcm VALUES
('PRESIDENCE',     'Présidence',                       'PRESIDENCE',  'PP', 'Premier Président'),
('AUDIT_GEN',      'Auditorat Général des FARDC',       'PARQUET',     'AG', 'Auditeur Général des FARDC'),
('CH_JUDICIAIRE',  'Chambre Judiciaire',                'CHAMBRE',     'PCJ','Président de la Chambre Judiciaire'),
('CH_DISCIPLINE',  'Chambre de Discipline Militaire',   'CHAMBRE',     'PCD','Président de la Chambre de Discipline'),
('GREFFE',         'Greffe',                            'GREFFE',      'GC', 'Greffier en Chef'),
('SG',             'Secrétariat Général',               'SECRETARIAT', 'SG', 'Secrétaire Général');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM institution i CROSS JOIN t_modele_hcm m
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, m.code_poste, m.intitule_poste
FROM institution i CROSS JOIN t_modele_hcm m
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = m.code_unite
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (unite_id, code) DO NOTHING;

CREATE TEMP TABLE t_cours_militaires (code text PRIMARY KEY, nom text);
INSERT INTO t_cours_militaires (code, nom) VALUES
('CM_KINSHASA_GOMBE',  'Cour Militaire de Kinshasa/Gombe'),
('CM_KINSHASA_MATETE', 'Cour Militaire de Kinshasa/Matete'),
('CM_BANDUNDU',        'Cour Militaire de Bandundu'),
('CM_KONGO_CENTRAL',   'Cour Militaire du Kongo Central (Matadi)'),
('CM_KASAI_CENTRAL',   'Cour Militaire du Kasaï Central (Kananga)'),
('CM_KASAI_ORIENTAL',  'Cour Militaire du Kasaï Oriental (Mbuji-Mayi)'),
('CM_HAUT_KATANGA',    'Cour Militaire du Haut-Katanga (Lubumbashi)'),
('CM_MANIEMA',         'Cour Militaire du Maniema (Kindu)'),
('CM_NORD_KIVU',       'Cour Militaire du Nord-Kivu (Goma)'),
('CM_SUD_KIVU',        'Cour Militaire du Sud-Kivu (Bukavu)'),
('CM_EQUATEUR',        'Cour Militaire de l''Équateur (Mbandaka)'),
('CM_TSHOPO',          'Cour Militaire de la Tshopo (Kisangani)');

CREATE TEMP TABLE t_modele_cm (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_modele_cm VALUES
('PRESIDENCE',    'Présidence',                    'PRESIDENCE',  'P',  'Président'),
('AUDIT_SUP',     'Auditorat Militaire Supérieur', 'PARQUET',     'AMS','Auditeur Militaire Supérieur'),
('CH_JUDICIAIRE', 'Chambre Judiciaire',            'CHAMBRE',     'PCJ','Président de la Chambre Judiciaire'),
('GREFFE',        'Greffe',                        'GREFFE',      'GC', 'Greffier en Chef'),
('SG',            'Secrétariat',                   'SECRETARIAT', 'SG', 'Secrétaire');

INSERT INTO institution (code, nom, type_institution, statut)
SELECT code, nom, 'juridiction', 'ACTIF' FROM t_cours_militaires
ON CONFLICT (code) DO NOTHING;

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM t_cours_militaires c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_cm m
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, m.code_poste, m.intitule_poste
FROM t_cours_militaires c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_cm m
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = m.code_unite
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION 2 - Militaire' AS section, i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'HAUTE_COUR_MILITAIRE' OR i.code LIKE 'CM_%'
GROUP BY i.code ORDER BY i.code;

COMMIT;
\echo '=== SECTION 2 (Haute Cour Militaire + 12 Cours Militaires) : COMMIT effectué ==='


-- ============================================================================
-- SECTION 3 — Ministère de l'Économie Nationale (Tome officiel, Ch.100)
-- ============================================================================
BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
SELECT 'MIN_ECONOMIE', 'Ministère de l''Économie Nationale', 'ministere', 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%conomie%national%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_economie (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_economie VALUES
('CABINET',        'Cabinet du Ministre',                                  'CABINET',            'MIN', 'Ministre'),
('VICE_MIN',       'Vice-Ministre',                                        'DIRECTION',          'VM',  'Vice-Ministre'),
('SG',             'Secrétariat Général',                                  'SECRETARIAT',        'SG',  'Secrétaire Général'),
('IGS',            'Inspection Générale des Services',                     'INSPECTION',         'IG',  'Inspecteur Général des Services'),
('DG_POL_ECO',     'Direction Générale de la Politique Économique',        'DIRECTION_GENERALE', 'DG1', 'Directeur Général de la Politique Économique'),
('DG_REG_MARCHES', 'Direction Générale de la Régulation des Marchés',      'DIRECTION_GENERALE', 'DG2', 'Directeur Général de la Régulation des Marchés'),
('DG_CONCURRENCE', 'Direction Générale de la Concurrence',                 'DIRECTION_GENERALE', 'DG3', 'Directeur Général de la Concurrence'),
('DG_PRIX',        'Direction Générale des Prix',                          'DIRECTION_GENERALE', 'DG4', 'Directeur Général des Prix'),
('DG_CONSO',       'Direction Générale de la Protection des Consommateurs','DIRECTION_GENERALE', 'DG5', 'Directeur Général de la Protection des Consommateurs'),
('DG_INTEL_ECO',   'Direction Générale de l''Intelligence Économique',     'DIRECTION_GENERALE', 'DG6', 'Directeur Général de l''Intelligence Économique'),
('DG_ETUDES',      'Direction Générale des Études Économiques',            'DIRECTION_GENERALE', 'DG7', 'Directeur Général des Études Économiques'),
('D_STAT_ECO',     'Direction des Statistiques Économiques',               'DIRECTION',          'DSE', 'Directeur des Statistiques Économiques'),
('DSI',            'Direction des Systèmes d''Information',                'DIRECTION',          'DSI', 'Directeur des Systèmes d''Information'),
('DRH',            'Direction des Ressources Humaines',                    'DIRECTION',          'DRH', 'Directeur des Ressources Humaines'),
('DAF',            'Direction Administrative et Financière',               'DIRECTION',          'DAF', 'Directeur Administratif et Financier'),
('CELL_PNGIE',     'Cellule PNGIE',                                        'CELLULE',            'CP',  'Chef de la Cellule PNGIE');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_economie t
WHERE i.nom ILIKE '%conomie%national%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_economie t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%conomie%national%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION 3 - Economie' AS section, i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%conomie%national%'
GROUP BY i.code, i.nom;

COMMIT;
\echo '=== SECTION 3 (Ministère Économie) : COMMIT effectué ==='


-- ============================================================================
-- SECTION 4 — Ministère de l'ESU (Tome officiel, Ch.304)
-- ============================================================================
BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
SELECT 'MIN_ESU', 'Ministère de l''Enseignement Supérieur et Universitaire', 'ministere', 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%enseignement sup%rieur%' OR nom ILIKE '%ESU%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_esu (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_esu VALUES
('CABINET',      'Cabinet du Ministre',                                  'CABINET',            'MIN', 'Ministre'),
('VICE_MIN',     'Vice-Ministre',                                        'DIRECTION',          'VM',  'Vice-Ministre'),
('SG',           'Secrétariat Général',                                  'SECRETARIAT',        'SG',  'Secrétaire Général'),
('IG_ESU',       'Inspection Générale de l''ESU',                        'INSPECTION',         'IG',  'Inspecteur Général de l''ESU'),
('DG_UNIV',      'Direction Générale des Universités',                   'DIRECTION_GENERALE', 'DG1', 'Directeur Général des Universités'),
('DG_INST_SUP',  'Direction Générale des Instituts Supérieurs',          'DIRECTION_GENERALE', 'DG2', 'Directeur Général des Instituts Supérieurs'),
('DG_ASS_QUAL',  'Direction Générale de l''Assurance Qualité',           'DIRECTION_GENERALE', 'DG3', 'Directeur Général de l''Assurance Qualité'),
('DG_HOMOL',     'Direction Générale de l''Homologation Académique',     'DIRECTION_GENERALE', 'DG4', 'Directeur Général de l''Homologation Académique'),
('DG_ETUDES',    'Direction Générale des Études et Programmes',          'DIRECTION_GENERALE', 'DG5', 'Directeur Général des Études et Programmes'),
('DG_DIPLOMES',  'Direction Générale des Diplômes Nationaux',            'DIRECTION_GENERALE', 'DG6', 'Directeur Général des Diplômes Nationaux'),
('DG_RECHERCHE', 'Direction Générale de la Recherche Universitaire',     'DIRECTION_GENERALE', 'DG7', 'Directeur Général de la Recherche Universitaire'),
('DG_INNOV',     'Direction Générale de l''Innovation Universitaire',    'DIRECTION_GENERALE', 'DG8', 'Directeur Général de l''Innovation Universitaire'),
('DG_REL_INTL',  'Direction Générale des Relations Internationales',     'DIRECTION_GENERALE', 'DG9', 'Directeur Général des Relations Internationales'),
('DG_TRANS_NUM', 'Direction Générale de la Transformation Numérique',    'DIRECTION_GENERALE', 'DG10','Directeur Général de la Transformation Numérique'),
('DG_STAT_UNIV', 'Direction Générale des Statistiques Universitaires',   'DIRECTION_GENERALE', 'DG11','Directeur Général des Statistiques Universitaires'),
('DSI',          'Direction des Systèmes d''Information',                'DIRECTION',          'DSI', 'Directeur des Systèmes d''Information'),
('DAF',          'Direction Administrative et Financière',               'DIRECTION',          'DAF', 'Directeur Administratif et Financier'),
('DRH',          'Direction des Ressources Humaines',                    'DIRECTION',          'DRH', 'Directeur des Ressources Humaines'),
('CELL_PNGIE',   'Cellule PNGIE',                                        'CELLULE',            'CP',  'Chef de la Cellule PNGIE'),
('COORD_ACAD',   'Coordinations Académiques Nationales',                 'COORDINATION',       'CAN', 'Coordonnateur des Coordinations Académiques Nationales');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_esu t
WHERE i.nom ILIKE '%enseignement sup%rieur%' OR i.nom ILIKE '%ESU%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_esu t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%enseignement sup%rieur%' OR i.nom ILIKE '%ESU%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION 4 - ESU' AS section, i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%enseignement sup%rieur%' OR i.nom ILIKE '%ESU%'
GROUP BY i.code, i.nom;

COMMIT;
\echo '=== SECTION 4 (Ministère ESU) : COMMIT effectué ==='


-- ============================================================================
-- SECTION 5 — Ministère des Affaires Coutumières (Tome officiel, Ch.496)
-- Institution distincte de MIN_0, confirmé par l'utilisateur.
-- ============================================================================
BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
SELECT 'MIN_AFF_COUTUM', 'Ministère des Affaires Coutumières', 'ministere', 'ACTIF'
WHERE NOT EXISTS (
    SELECT 1 FROM institution WHERE nom ILIKE '%coutumi%re%' AND nom NOT ILIKE '%int%rieur%'
)
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_coutumieres (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_coutumieres VALUES
('CABINET',       'Cabinet du Ministre',                                   'CABINET',            'MIN', 'Ministre'),
('VICE_MIN',      'Vice-Ministre',                                         'DIRECTION',          'VM',  'Vice-Ministre'),
('SG',            'Secrétariat Général',                                   'SECRETARIAT',        'SG',  'Secrétaire Général'),
('IG_COUTUM',     'Inspection Générale des Affaires Coutumières',          'INSPECTION',         'IG',  'Inspecteur Général des Affaires Coutumières'),
('DG_AUT_COUT',   'Direction Générale des Autorités Coutumières',          'DIRECTION_GENERALE', 'DG1', 'Directeur Général des Autorités Coutumières'),
('DG_CHEF_SECT',  'Direction Générale des Chefferies et Secteurs',         'DIRECTION_GENERALE', 'DG2', 'Directeur Général des Chefferies et Secteurs'),
('DG_SUCC_COUT',  'Direction Générale des Successions Coutumières',        'DIRECTION_GENERALE', 'DG3', 'Directeur Général des Successions Coutumières'),
('DG_MEDIATION',  'Direction Générale de la Médiation Coutumière',         'DIRECTION_GENERALE', 'DG4', 'Directeur Général de la Médiation Coutumière'),
('DG_PATRIMOINE', 'Direction Générale du Patrimoine Coutumier',            'DIRECTION_GENERALE', 'DG5', 'Directeur Général du Patrimoine Coutumier'),
('DG_ETUDES_REF', 'Direction Générale des Études et Réformes Coutumières', 'DIRECTION_GENERALE', 'DG6', 'Directeur Général des Études et Réformes Coutumières'),
('DG_STAT_COUT',  'Direction Générale des Statistiques Coutumières',       'DIRECTION_GENERALE', 'DG7', 'Directeur Général des Statistiques Coutumières'),
('DG_TRANS_NUM',  'Direction Générale de la Transformation Numérique',     'DIRECTION_GENERALE', 'DG8', 'Directeur Général de la Transformation Numérique'),
('DSI',           'Direction des Systèmes d''Information',                 'DIRECTION',          'DSI', 'Directeur des Systèmes d''Information'),
('DAF',           'Direction Administrative et Financière',                'DIRECTION',          'DAF', 'Directeur Administratif et Financier'),
('DRH',           'Direction des Ressources Humaines',                     'DIRECTION',          'DRH', 'Directeur des Ressources Humaines'),
('D_COOP_INST',   'Direction de la Coopération Institutionnelle',          'DIRECTION',          'DCI', 'Directeur de la Coopération Institutionnelle'),
('CELL_PNGIE',    'Cellule PNGIE',                                         'CELLULE',            'CP',  'Chef de la Cellule PNGIE'),
('COORD_PROV',    'Coordinations Provinciales',                            'COORDINATION',       'CPR', 'Coordonnateur des Coordinations Provinciales');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_coutumieres t
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_coutumieres t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION 5 - Coutumieres' AS section, i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
GROUP BY i.code, i.nom;

COMMIT;
\echo '=== SECTION 5 (Ministère Affaires Coutumières) : COMMIT effectué ==='

\echo ''
\echo '======================================================='
\echo '  TOUTES LES SECTIONS TERMINEES'
\echo '  Attendu : 27 CA (7 unites/postes chacune),'
\echo '            HAUTE_COUR_MILITAIRE (6/6) + 12 CM (5/5),'
\echo '            Economie (16/16), ESU (20/20), Coutumieres (18/18)'
\echo '======================================================='
