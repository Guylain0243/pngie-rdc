-- ============================================================================
-- PNGIE-RDC — 26 Tribunaux Militaires de Garnison + 26 Auditorats correspondants
-- Source : recherche approfondie du 29/07/2026 (recoupement multi-sources,
-- PAS une confirmation CSM officielle — statut institution = ACTIF mais
-- ref_juridiction_militaire garde la traçabilité de la source).
-- Modèles : Tome 16 (structure TMG), Tome 21 (structure Auditorat près TMG).
-- Codes institution = ini du référentiel (ex: TMG-A01, AMG-A01), tous ≤20 car.
-- Exécution : psql -f .\populate_tmg_et_auditorats.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Données de base : les 26 TMG identifiés par la recherche
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE t_tmg_source (
    tmg_ini text, tmg_code text, aud_ini text, aud_code text,
    ville text, denomination text, province text, cm_rattachement_code text
);
INSERT INTO t_tmg_source VALUES
('TMG-A01','TMG-A01','AMG-A01','AMG-A01','Kinshasa/Gombe',    'Tribunal Militaire de Garnison de Kinshasa/Gombe',    'Kinshasa',        'CM_KINSHASA_GOMBE'),
('TMG-A02','TMG-A02','AMG-A02','AMG-A02','Kinshasa/Ngaliema', 'Tribunal Militaire de Garnison de Kinshasa/Ngaliema', 'Kinshasa',        'CM_KINSHASA_GOMBE'),
('TMG-B01','TMG-B01','AMG-B01','AMG-B01','Kinshasa/Matete',   'Tribunal Militaire de Garnison de Kinshasa/Matete',   'Kinshasa',        'CM_KINSHASA_MATETE'),
('TMG-A03','TMG-A03','AMG-A03','AMG-A03','Kinshasa/N''djili', 'Tribunal Militaire de Garnison de Kinshasa/N''djili', 'Kinshasa',        'CM_KINSHASA_MATETE'),
('TMG-B02','TMG-B02','AMG-B02','AMG-B02','Matadi',            'Tribunal Militaire de Garnison de Matadi',            'Kongo Central',   'CM_KONGO_CENTRAL'),
('TMG-B03','TMG-B03','AMG-B03','AMG-B03','Boma',              'Tribunal Militaire de Garnison de Boma',              'Kongo Central',   'CM_KONGO_CENTRAL'),
('TMG-B04','TMG-B04','AMG-B04','AMG-B04','Muanda',            'Tribunal Militaire de Garnison de Muanda',            'Kongo Central',   'CM_KONGO_CENTRAL'),
('TMG-B05','TMG-B05','AMG-B05','AMG-B05','Bandundu',          'Tribunal Militaire de Garnison de Bandundu',          'Kwilu',           'CM_BANDUNDU'),
('TMG-B06','TMG-B06','AMG-B06','AMG-B06','Kikwit',            'Tribunal Militaire de Garnison de Kikwit',            'Kwilu',           'CM_BANDUNDU'),
('TMG-B07','TMG-B07','AMG-B07','AMG-B07','Kananga',           'Tribunal Militaire de Garnison de Kananga',           'Kasaï Central',   'CM_KASAI_CENTRAL'),
('TMG-B08','TMG-B08','AMG-B08','AMG-B08','Tshikapa',          'Tribunal Militaire de Garnison de Tshikapa',          'Kasaï',           'CM_KASAI_CENTRAL'),
('TMG-B09','TMG-B09','AMG-B09','AMG-B09','Mbuji-Mayi',        'Tribunal Militaire de Garnison de Mbuji-Mayi',        'Kasaï Oriental',  'CM_KASAI_ORIENTAL'),
('TMG-A06','TMG-A06','AMG-A06','AMG-A06','Lubumbashi',        'Tribunal Militaire de Garnison de Lubumbashi',        'Haut-Katanga',    'CM_HAUT_KATANGA'),
('TMG-B10','TMG-B10','AMG-B10','AMG-B10','Kipushi',           'Tribunal Militaire de Garnison de Kipushi',           'Haut-Katanga',    'CM_HAUT_KATANGA'),
('TMG-B11','TMG-B11','AMG-B11','AMG-B11','Kolwezi',           'Tribunal Militaire de Garnison de Kolwezi',           'Lualaba',         'CM_HAUT_KATANGA'),
('TMG-B12','TMG-B12','AMG-B12','AMG-B12','Kamina',            'Tribunal Militaire de Garnison de Kamina',            'Haut-Lomami',     'CM_HAUT_KATANGA'),
('TMG-B13','TMG-B13','AMG-B13','AMG-B13','Kalemie',           'Tribunal Militaire de Garnison de Kalemie',           'Tanganyika',      'CM_HAUT_KATANGA'),
('TMG-A09','TMG-A09','AMG-A09','AMG-A09','Kindu',             'Tribunal Militaire de Garnison de Kindu',             'Maniema',         'CM_MANIEMA'),
('TMG-A05','TMG-A05','AMG-A05','AMG-A05','Goma',              'Tribunal Militaire de Garnison de Goma',              'Nord-Kivu',       'CM_NORD_KIVU'),
('TMG-B14','TMG-B14','AMG-B14','AMG-B14','Beni',              'Tribunal Militaire de Garnison de Beni',              'Nord-Kivu',       'CM_NORD_KIVU'),
('TMG-B15','TMG-B15','AMG-B15','AMG-B15','Butembo',           'Tribunal Militaire de Garnison de Butembo',           'Nord-Kivu',       'CM_NORD_KIVU'),
('TMG-A07','TMG-A07','AMG-A07','AMG-A07','Bukavu',            'Tribunal Militaire de Garnison de Bukavu',            'Sud-Kivu',        'CM_SUD_KIVU'),
('TMG-B16','TMG-B16','AMG-B16','AMG-B16','Uvira',             'Tribunal Militaire de Garnison d''Uvira',             'Sud-Kivu',        'CM_SUD_KIVU'),
('TMG-A08','TMG-A08','AMG-A08','AMG-A08','Mbandaka',          'Tribunal Militaire de Garnison de Mbandaka',          'Équateur',        'CM_EQUATEUR'),
('TMG-A04','TMG-A04','AMG-A04','AMG-A04','Bunia',             'Tribunal Militaire de Garnison de Bunia',             'Ituri',           'CM_TSHOPO'),
('TMG-B17','TMG-B17','AMG-B17','AMG-B17','Kisangani',         'Tribunal Militaire de Garnison de Kisangani',         'Tshopo',          'CM_TSHOPO');

-- ----------------------------------------------------------------------------
-- 1. Création des 26 institutions TMG
-- ----------------------------------------------------------------------------
INSERT INTO institution (code, nom, type_institution, statut)
SELECT tmg_code, denomination, 'juridiction', 'ACTIF' FROM t_tmg_source
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_modele_tmg (code_unite text, nom_unite text, type_unite text);
INSERT INTO t_modele_tmg VALUES
('PRESIDENCE',     'Président du Tribunal',         'PRESIDENCE'),
('VICE_PRESIDENT', 'Vice-Président',                'DIRECTION'),
('MIN_PUBLIC',     'Ministère Public Militaire',    'PARQUET'),
('GREFFE',         'Greffe Principal',              'GREFFE'),
('CH_JUGEMENT',    'Chambres de Jugement',          'CHAMBRE'),
('SVC_INSTRUCTION','Service d''Instruction',        'DIRECTION'),
('SVC_ADMIN',      'Service Administratif',         'DIRECTION'),
('SVC_FIN',        'Service Financier',             'DIRECTION'),
('ARCHIVES',       'Archives Judiciaires',          'DIRECTION'),
('INFO',           'Informatique',                  'DIRECTION'),
('CELL_PNGIE',     'Cellule PNGIE-RDC',             'CELLULE'),
('SECURITE',       'Sécurité',                      'DIRECTION');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM t_tmg_source t
JOIN institution i ON i.code = t.tmg_code
CROSS JOIN t_modele_tmg m
ON CONFLICT (institution_id, code) DO NOTHING;

CREATE TEMP TABLE t_postes_tmg (code_unite text, code_poste text, intitule_poste text);
INSERT INTO t_postes_tmg VALUES
('PRESIDENCE',      'PT',   'Président du Tribunal'),
('VICE_PRESIDENT',  'VP',   'Vice-Président'),
('MIN_PUBLIC',       'AM',  'Auditeur Militaire'),
('MIN_PUBLIC',       'PS',  'Premier Substitut'),
('MIN_PUBLIC',       'SUB', 'Substitut'),
('GREFFE',           'GC',  'Greffier en Chef'),
('CH_JUGEMENT',      'PCJ', 'Président de Chambre de Jugement'),
('SVC_INSTRUCTION',  'CSI', 'Chef du Service d''Instruction'),
('SVC_ADMIN',        'CSA', 'Chef du Service Administratif'),
('SVC_FIN',          'CSF', 'Chef du Service Financier'),
('ARCHIVES',         'ARC', 'Responsable des Archives Judiciaires'),
('INFO',             'INF', 'Responsable Informatique'),
('CELL_PNGIE',       'CP',  'Chef de la Cellule PNGIE-RDC'),
('SECURITE',         'SEC', 'Responsable de la Sécurité');

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, p.code_poste, p.intitule_poste
FROM t_tmg_source t
JOIN institution i ON i.code = t.tmg_code
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
JOIN t_postes_tmg p ON p.code_unite = u.code
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Création des 26 institutions Auditorat Militaire près TMG
-- ----------------------------------------------------------------------------
INSERT INTO institution (code, nom, type_institution, statut)
SELECT aud_code, 'Auditorat Militaire près le ' || denomination, 'parquet', 'ACTIF' FROM t_tmg_source
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_modele_aud (code_unite text, nom_unite text, type_unite text);
INSERT INTO t_modele_aud VALUES
('CABINET',        'Cabinet',                  'CABINET'),
('MAGISTRATS',     'Magistrats Militaires',    'DIRECTION'),
('GREFFE_PARQUET', 'Greffe du Parquet',        'GREFFE'),
('SECRETARIAT',    'Secrétariat',              'SECRETARIAT'),
('BUR_ENQUETES',   'Bureau des Enquêtes',      'DIRECTION'),
('BUR_POURSUITES', 'Bureau des Poursuites',    'DIRECTION'),
('BUR_EXECUTIONS', 'Bureau des Exécutions',    'DIRECTION'),
('DOCUMENTATION',  'Documentation',            'DIRECTION'),
('ARCHIVES',       'Archives',                 'DIRECTION'),
('INFO',           'Informatique',             'DIRECTION'),
('ADMIN',          'Administration',           'DIRECTION');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM t_tmg_source t
JOIN institution i ON i.code = t.aud_code
CROSS JOIN t_modele_aud m
ON CONFLICT (institution_id, code) DO NOTHING;

CREATE TEMP TABLE t_postes_aud (code_unite text, code_poste text, intitule_poste text);
INSERT INTO t_postes_aud VALUES
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
('ADMIN',          'ADM',  'Responsable Administratif');

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, p.code_poste, p.intitule_poste
FROM t_tmg_source t
JOIN institution i ON i.code = t.aud_code
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
JOIN t_postes_aud p ON p.code_unite = u.code
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Mise à jour du référentiel : ref_juridiction_militaire
--    (upsert : les 9 déjà en A_VALIDER passent ACTIVE + liées à leur vraie
--     institution ; les 17 nouvelles sont insérées)
-- ----------------------------------------------------------------------------
INSERT INTO ref_juridiction_militaire
    (ini, code_institution, institution_id, denomination_officielle, type_juridiction,
     province, ville_siege, statut, autorite_tutelle_ini)
SELECT
    t.tmg_ini, t.tmg_code, i.institution_id, t.denomination, 'TMG',
    t.province, t.ville, 'ACTIVE',
    (SELECT ini FROM ref_juridiction_militaire WHERE code_institution = t.cm_rattachement_code)
FROM t_tmg_source t
JOIN institution i ON i.code = t.tmg_code
ON CONFLICT (ini) DO UPDATE SET
    code_institution = EXCLUDED.code_institution,
    institution_id   = EXCLUDED.institution_id,
    province         = EXCLUDED.province,
    ville_siege      = EXCLUDED.ville_siege,
    statut           = 'ACTIVE',
    autorite_tutelle_ini = EXCLUDED.autorite_tutelle_ini,
    updated_at       = now();

INSERT INTO ref_juridiction_militaire_historique (ini, type_evenement, commentaire)
SELECT tmg_ini, 'VALIDATION',
    'Institution réelle créée le 29/07/2026 suite à recherche approfondie multi-sources (CSM, ONU/MONUSCO, ASF, ICTJ, presse). PAS une confirmation CSM officielle formelle — statut ACTIVE appliqué par analogie avec la méthode "structure proposée à valider" du projet, décision utilisateur explicite.'
FROM t_tmg_source;

-- ----------------------------------------------------------------------------
-- 4. Peuplement du référentiel : ref_auditorat_militaire
-- ----------------------------------------------------------------------------
INSERT INTO ref_auditorat_militaire
    (ini, code_institution, institution_id, denomination_officielle, type_auditorat,
     juridiction_rattachement_ini, province, statut)
SELECT
    t.aud_ini, t.aud_code, i.institution_id, 'Auditorat Militaire près le ' || t.denomination, 'AMG',
    t.tmg_ini, t.province, 'ACTIVE'
FROM t_tmg_source t
JOIN institution i ON i.code = t.aud_code
ON CONFLICT (ini) DO UPDATE SET
    code_institution = EXCLUDED.code_institution,
    institution_id   = EXCLUDED.institution_id,
    province         = EXCLUDED.province,
    statut           = 'ACTIVE',
    updated_at       = now();

INSERT INTO ref_auditorat_militaire_historique (ini, type_evenement, commentaire)
SELECT aud_ini, 'CREATION', 'Créé le 29/07/2026 en miroir du TMG correspondant, suite à recherche approfondie multi-sources.'
FROM t_tmg_source;

-- ----------------------------------------------------------------------------
-- 5. Contrôle avant COMMIT
-- ----------------------------------------------------------------------------
SELECT 'TMG (institutions)' AS ensemble, COUNT(DISTINCT i.institution_id) AS nb_institutions,
       COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM t_tmg_source t
JOIN institution i ON i.code = t.tmg_code
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
UNION ALL
SELECT 'Auditorats (institutions)', COUNT(DISTINCT i.institution_id),
       COUNT(DISTINCT u.unite_id), COUNT(DISTINCT p.poste_id)
FROM t_tmg_source t
JOIN institution i ON i.code = t.aud_code
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id;

SELECT type_juridiction, statut, COUNT(*) AS nb FROM ref_juridiction_militaire GROUP BY type_juridiction, statut ORDER BY 1,2;
SELECT type_auditorat, statut, COUNT(*) AS nb FROM ref_auditorat_militaire GROUP BY type_auditorat, statut ORDER BY 1,2;

-- Attendu : 26 institutions TMG (12 unités / 14 postes chacune)
--           26 institutions Auditorat (11 unités / 12 postes chacune)
--           ref_juridiction_militaire : TMG/ACTIVE = 26, CM/ACTIVE = 12, HCM/ACTIVE = 1
--           ref_auditorat_militaire : AMG/ACTIVE = 26
COMMIT;
\echo '=== 26 TMG + 26 Auditorats créés, référentiel mis à jour ==='
