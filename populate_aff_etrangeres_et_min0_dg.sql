-- ============================================================================
-- PNGIE-RDC — Tome 14 (Affaires Étrangères) + Tome 15 (ajout DG à MIN_0)
-- Schéma réel : institution_id/unite_id, type_institution/type_unite obligatoires,
-- unicité unite = (institution_id, code), unicité poste = (unite_id, code).
-- Exécution : psql -f .\populate_aff_etrangeres_et_min0_dg.sql $env:PNGIE_DB_URL
-- ============================================================================


-- ============================================================================
-- SECTION A — Ministère des Affaires Étrangères, Coopération Internationale
-- et Francophonie (Tome 14, structure proposée à valider)
-- ============================================================================
BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
SELECT 'MIN_AFF_ETR', 'Ministère des Affaires Étrangères, Coopération Internationale et Francophonie', 'ministere', 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%affaires %trang%res%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_aff_etr (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_aff_etr VALUES
('CABINET',        'Cabinet du Ministre',                                    'CABINET',            'MIN',  'Ministre'),
('VICE_MIN',       'Vice-Ministre',                                          'DIRECTION',          'VM',   'Vice-Ministre'),
('CAB_VICE_MIN',   'Cabinet du Vice-Ministre',                               'CABINET',            'CVM',  'Chef de Cabinet du Vice-Ministre'),
('IG',             'Inspection Générale',                                    'INSPECTION',         'IG',   'Inspecteur Général'),
('SG',             'Secrétariat Général',                                    'SECRETARIAT',        'SG',   'Secrétaire Général'),
('DG_AFF_POL',     'Direction Générale des Affaires Politiques',             'DIRECTION_GENERALE', 'DG1',  'Directeur Général des Affaires Politiques'),
('DG_COOP_INTL',   'Direction Générale de la Coopération Internationale',    'DIRECTION_GENERALE', 'DG2',  'Directeur Général de la Coopération Internationale'),
('DG_ORG_INTL',    'Direction Générale des Organisations Internationales',   'DIRECTION_GENERALE', 'DG3',  'Directeur Général des Organisations Internationales'),
('DG_AFF_CONSUL',  'Direction Générale des Affaires Consulaires',            'DIRECTION_GENERALE', 'DG4',  'Directeur Général des Affaires Consulaires'),
('DG_PROTOCOLE',   'Direction Générale du Protocole d''État',                'DIRECTION_GENERALE', 'DG5',  'Directeur Général du Protocole d''État'),
('DG_AFF_JURID',   'Direction Générale des Affaires Juridiques et des Traités','DIRECTION_GENERALE','DG6', 'Directeur Général des Affaires Juridiques et des Traités'),
('DG_DIPL_ECO',    'Direction Générale de la Diplomatie Économique',         'DIRECTION_GENERALE', 'DG7',  'Directeur Général de la Diplomatie Économique'),
('DG_DIASPORA',    'Direction Générale de la Diaspora Congolaise',           'DIRECTION_GENERALE', 'DG8',  'Directeur Général de la Diaspora Congolaise'),
('DG_FRANCOPHONIE','Direction Générale de la Francophonie',                  'DIRECTION_GENERALE', 'DG9',  'Directeur Général de la Francophonie'),
('DRH',            'Direction des Ressources Humaines',                      'DIRECTION',          'DRH',  'Directeur des Ressources Humaines'),
('DAF',            'Direction Administrative et Financière',                 'DIRECTION',          'DAF',  'Directeur Administratif et Financier'),
('DSI',            'Direction des Systèmes d''Information',                  'DIRECTION',          'DSI',  'Directeur des Systèmes d''Information'),
('D_PLANIF',       'Direction de la Planification',                         'DIRECTION',          'DP',   'Directeur de la Planification'),
('CELL_PNGIE',     'Cellule PNGIE-RDC',                                      'CELLULE',            'CP',   'Chef de la Cellule PNGIE-RDC'),
('INSP_INTERNE',   'Inspection Interne',                                     'INSPECTION',         'II',   'Inspecteur Interne');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_aff_etr t
WHERE i.nom ILIKE '%affaires %trang%res%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_aff_etr t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%affaires %trang%res%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION A - Affaires Etrangeres' AS section, i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%affaires %trang%res%'
GROUP BY i.code, i.nom;

-- Attendu : 20 unités / 20 postes
COMMIT;
\echo '=== SECTION A (Affaires Étrangères) : COMMIT effectué ==='


-- ============================================================================
-- SECTION B — MIN_0 (Intérieur) : ajout des 9 DG du Tome 15
-- Les 5 directions réelles préexistantes ne sont PAS touchées.
-- Choix utilisateur confirmé : ajouter en plus, doublons éventuels à nettoyer
-- plus tard si un mapping avec l'existant est fait.
-- ============================================================================
BEGIN;

-- Vérification préalable : afficher l'existant avant d'ajouter quoi que ce soit
DO $$
DECLARE
    v_nb_unites int;
BEGIN
    SELECT COUNT(*) INTO v_nb_unites FROM unite_organisationnelle u
    JOIN institution i ON i.institution_id = u.institution_id
    WHERE i.code = 'MIN_0';
    RAISE NOTICE 'MIN_0 a % unité(s) existante(s) avant ajout des 9 nouvelles DG.', v_nb_unites;
END $$;

CREATE TEMP TABLE t_min0_dg (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_min0_dg VALUES
('DG_ADMIN_TERR', 'Direction Générale de l''Administration du Territoire',       'DIRECTION_GENERALE', 'DG1', 'Directeur Général de l''Administration du Territoire'),
('DG_DECENTR',    'Direction Générale de la Décentralisation',                   'DIRECTION_GENERALE', 'DG2', 'Directeur Général de la Décentralisation'),
('DG_GOUV_PROV',  'Direction Générale des Gouvernorats et Provinces',            'DIRECTION_GENERALE', 'DG3', 'Directeur Général des Gouvernorats et Provinces'),
('DG_ETD',        'Direction Générale des ETD',                                  'DIRECTION_GENERALE', 'DG4', 'Directeur Général des ETD'),
('DG_AFF_COUTUM', 'Direction Générale des Affaires Coutumières',                 'DIRECTION_GENERALE', 'DG5', 'Directeur Général des Affaires Coutumières'),
('DG_SEC_CIVILE', 'Direction Générale de la Sécurité Civile',                    'DIRECTION_GENERALE', 'DG6', 'Directeur Général de la Sécurité Civile'),
('DG_PROT_CIVILE','Direction Générale de la Protection Civile et Gestion des Catastrophes','DIRECTION_GENERALE','DG7','Directeur Général de la Protection Civile et Gestion des Catastrophes'),
('DG_POPULATION', 'Direction Générale de la Population et Mouvements Administratifs','DIRECTION_GENERALE','DG8','Directeur Général de la Population et Mouvements Administratifs'),
('DG_FRONTIERES', 'Direction Générale des Frontières et Coopération Frontalière','DIRECTION_GENERALE', 'DG9', 'Directeur Général des Frontières et Coopération Frontalière');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_min0_dg t
WHERE i.code = 'MIN_0'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_min0_dg t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.code = 'MIN_0'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT 'SECTION B - MIN_0 apres ajout' AS section, i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites_total, COUNT(DISTINCT p.poste_id) AS nb_postes_total
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'MIN_0'
GROUP BY i.code, i.nom;

-- Détail des unités de MIN_0 pour vérifier que les 5 réelles sont toujours là
-- et que les 9 nouvelles se sont bien ajoutées à côté
SELECT u.code, u.nom, u.type_unite
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
WHERE i.code = 'MIN_0'
ORDER BY u.nom;

-- Attendu : (nb existant avant, indiqué par le NOTICE) + 9 nouvelles unités
COMMIT;
\echo '=== SECTION B (MIN_0 + 9 DG) : COMMIT effectué ==='
\echo 'RAPPEL : les 5 directions réelles préexistantes ne sont pas censées avoir changé.'
\echo 'Vérifiez la liste détaillée ci-dessus pour repérer d''éventuels doublons à mapper plus tard'
\echo '(ex: Collectivités Locales vs DG_DECENTR / DG_ETD, Affaires Politiques sans équivalent direct).'
