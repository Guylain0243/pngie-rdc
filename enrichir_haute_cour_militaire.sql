-- ============================================================================
-- PNGIE-RDC — Enrichissement de la Haute Cour Militaire (Tome 18, modèle complet)
-- Les 6 unités déjà créées (PRESIDENCE, AUDIT_GEN, CH_JUDICIAIRE, CH_DISCIPLINE,
-- GREFFE, SG) ne sont PAS touchées. On ajoute les unités manquantes du modèle
-- officiel, et on complète le Parquet Général Militaire (unité AUDIT_GEN) avec
-- les 2 postes manquants (Premier Avocat Général, Avocat Général) plutôt que
-- de créer une nouvelle unité en doublon.
-- Exécution : psql -f .\enrichir_haute_cour_militaire.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_nb int;
BEGIN
    SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle u
    JOIN institution i ON i.institution_id = u.institution_id
    WHERE i.code = 'HAUTE_COUR_MILITAIRE';
    RAISE NOTICE '% unités existantes sur la Haute Cour Militaire avant enrichissement (attendu 6).', v_nb;
END $$;

CREATE TEMP TABLE t_hcm_ajout (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_hcm_ajout VALUES
('VICE_PRESIDENT',     'Vice-Président',                              'DIRECTION',   'VP',  'Vice-Président'),
('ASSEMBLEE_GEN',      'Assemblée Générale des Magistrats',           'DIRECTION',   'AG',  'Président de l''Assemblée Générale des Magistrats'),
('SERVICE_DOC_JURI',   'Service de Documentation et Jurisprudence',   'DIRECTION',   'SDJ', 'Chef du Service de Documentation et Jurisprudence'),
('DRH',                'Direction des Ressources Humaines',           'DIRECTION',   'DRH', 'Directeur des Ressources Humaines'),
('DAF',                'Direction Administrative et Financière',      'DIRECTION',   'DAF', 'Directeur Administratif et Financier'),
('DSI',                'Direction des Systèmes d''Information',       'DIRECTION',   'DSI', 'Directeur des Systèmes d''Information'),
('D_PLANIF',           'Direction de la Planification',               'DIRECTION',   'DP',  'Directeur de la Planification'),
('INSP_INTERNE',       'Inspection Interne',                          'INSPECTION',  'II',  'Inspecteur Interne'),
('CELL_PNGIE',         'Cellule PNGIE-RDC',                           'CELLULE',     'CP',  'Chef de la Cellule PNGIE-RDC'),
('SECURITE',           'Service de Sécurité',                         'DIRECTION',   'SEC', 'Responsable du Service de Sécurité');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_hcm_ajout t
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_hcm_ajout t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Complément du Parquet Général Militaire (unité AUDIT_GEN déjà existante)
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'AUDIT_GEN'
CROSS JOIN (VALUES
    ('PAG', 'Premier Avocat Général Militaire'),
    ('AG',  'Avocat Général Militaire')
) AS x(code_poste, intitule_poste)
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
GROUP BY i.code;

-- Attendu : 16 unités (6 existantes + 10 nouvelles), 18 postes (6 existants + 10 nouveaux + 2 ajoutés dans AUDIT_GEN)
COMMIT;
\echo '=== Enrichissement de la Haute Cour Militaire terminé (Tome 18) ==='
