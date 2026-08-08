-- ============================================================================
-- PNGIE-RDC — Auditorat Général des FARDC (Tome 19, institution autonome)
-- Pilier "Ministère Public militaire", distinct du pilier "juridictions
-- militaires" (Haute Cour Militaire / Cours Militaires / TMG).
-- Exécution : psql -f .\populate_auditorat_general_fardc.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

INSERT INTO institution (code, nom, type_institution, statut)
VALUES ('AUDITORAT_GEN_FARDC', 'Auditorat Général des FARDC', 'parquet', 'ACTIF')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_auditorat (code_unite text, nom_unite text, type_unite text);
INSERT INTO t_auditorat VALUES
('CABINET',        'Cabinet',                                              'CABINET'),
('IG',              'Inspection Générale',                                 'INSPECTION'),
('SG',              'Secrétariat Général',                                 'SECRETARIAT'),
('DG_POURSUITES',   'Direction Générale des Poursuites Militaires',        'DIRECTION_GENERALE'),
('DG_ENQUETES',     'Direction Générale des Enquêtes Militaires',          'DIRECTION_GENERALE'),
('DG_AFF_PENALES',  'Direction Générale des Affaires Pénales Militaires',  'DIRECTION_GENERALE'),
('DG_COOP_JUD',     'Direction Générale de la Coopération Judiciaire Militaire', 'DIRECTION_GENERALE'),
('DG_DOC_JURISPR',  'Direction Générale de la Documentation et Jurisprudence',    'DIRECTION_GENERALE'),
('DG_STAT_JUD',     'Direction Générale des Statistiques Judiciaires',     'DIRECTION_GENERALE'),
('DRH',             'Direction des Ressources Humaines',                   'DIRECTION'),
('DAF',             'Direction Administrative et Financière',              'DIRECTION'),
('DSI',             'Direction des Systèmes d''Information',               'DIRECTION'),
('D_PLANIF',        'Direction de la Planification',                       'DIRECTION'),
('D_AFF_JUR',       'Direction des Affaires Juridiques',                   'DIRECTION'),
('CELL_PNGIE',      'Cellule PNGIE-RDC',                                   'CELLULE'),
('INSP_INTERNE',    'Inspection Interne',                                  'INSPECTION');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_auditorat t
WHERE i.code = 'AUDITORAT_GEN_FARDC'
ON CONFLICT (institution_id, code) DO NOTHING;

-- Postes : un par unité, sauf CABINET qui porte les deux têtes de l'institution
CREATE TEMP TABLE t_postes (code_unite text, code_poste text, intitule_poste text);
INSERT INTO t_postes VALUES
('CABINET',        'AG',  'Auditeur Général des FARDC'),
('CABINET',        'AGA', 'Auditeur Général Adjoint'),
('IG',              'IG',  'Inspecteur Général'),
('SG',              'SG',  'Secrétaire Général'),
('DG_POURSUITES',   'DG1', 'Directeur Général des Poursuites Militaires'),
('DG_ENQUETES',     'DG2', 'Directeur Général des Enquêtes Militaires'),
('DG_AFF_PENALES',  'DG3', 'Directeur Général des Affaires Pénales Militaires'),
('DG_COOP_JUD',     'DG4', 'Directeur Général de la Coopération Judiciaire Militaire'),
('DG_DOC_JURISPR',  'DG5', 'Directeur Général de la Documentation et Jurisprudence'),
('DG_STAT_JUD',     'DG6', 'Directeur Général des Statistiques Judiciaires'),
('DRH',             'DRH', 'Directeur des Ressources Humaines'),
('DAF',             'DAF', 'Directeur Administratif et Financier'),
('DSI',             'DSI', 'Directeur des Systèmes d''Information'),
('D_PLANIF',        'DP',  'Directeur de la Planification'),
('D_AFF_JUR',       'DAJ', 'Directeur des Affaires Juridiques'),
('CELL_PNGIE',      'CP',  'Chef de la Cellule PNGIE-RDC'),
('INSP_INTERNE',    'II',  'Inspecteur Interne');

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, p.code_poste, p.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
JOIN t_postes p ON p.code_unite = u.code
WHERE i.code = 'AUDITORAT_GEN_FARDC'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'AUDITORAT_GEN_FARDC'
GROUP BY i.code, i.nom;

-- Attendu : 16 unités / 17 postes (Cabinet porte 2 postes : Auditeur Général + Adjoint)
COMMIT;
\echo '=== Auditorat Général des FARDC créé (Tome 19) ==='
