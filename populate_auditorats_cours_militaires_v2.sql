-- ============================================================================
-- PNGIE-RDC — Auditorats Militaires près les Cours Militaires (Tome 20)
-- CORRECTIF : institution.code est limité à varchar(20) ; codes raccourcis
-- (AUD_CM01..AUD_CM12), le nom complet reste dans la colonne "nom".
-- Exécution : psql -f .\populate_auditorats_cours_militaires_v2.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

CREATE TEMP TABLE t_auditorats_cm (code text PRIMARY KEY, nom text);
INSERT INTO t_auditorats_cm (code, nom) VALUES
('AUD_CM01', 'Auditorat Militaire près la Cour Militaire de Kinshasa/Gombe'),
('AUD_CM02', 'Auditorat Militaire près la Cour Militaire de Kinshasa/Matete'),
('AUD_CM03', 'Auditorat Militaire près la Cour Militaire de Bandundu'),
('AUD_CM04', 'Auditorat Militaire près la Cour Militaire du Kongo Central (Matadi)'),
('AUD_CM05', 'Auditorat Militaire près la Cour Militaire du Kasaï Central (Kananga)'),
('AUD_CM06', 'Auditorat Militaire près la Cour Militaire du Kasaï Oriental (Mbuji-Mayi)'),
('AUD_CM07', 'Auditorat Militaire près la Cour Militaire du Haut-Katanga (Lubumbashi)'),
('AUD_CM08', 'Auditorat Militaire près la Cour Militaire du Maniema (Kindu)'),
('AUD_CM09', 'Auditorat Militaire près la Cour Militaire du Nord-Kivu (Goma)'),
('AUD_CM10', 'Auditorat Militaire près la Cour Militaire du Sud-Kivu (Bukavu)'),
('AUD_CM11', 'Auditorat Militaire près la Cour Militaire de l''Équateur (Mbandaka)'),
('AUD_CM12', 'Auditorat Militaire près la Cour Militaire de la Tshopo (Kisangani)');

INSERT INTO institution (code, nom, type_institution, statut)
SELECT code, nom, 'parquet', 'ACTIF' FROM t_auditorats_cm
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_modele_auditcm (code_unite text, nom_unite text, type_unite text);
INSERT INTO t_modele_auditcm VALUES
('CABINET',         'Cabinet',                     'CABINET'),
('SECRETARIAT',     'Secrétariat',                 'SECRETARIAT'),
('SVC_POURSUITES',  'Service des Poursuites',      'DIRECTION'),
('SVC_APPELS',      'Service des Appels',          'DIRECTION'),
('SVC_ENQUETES',    'Service des Enquêtes',        'DIRECTION'),
('SVC_DOC',         'Service de Documentation',    'DIRECTION'),
('GREFFE_PARQUET',  'Greffe du Parquet',           'GREFFE'),
('DIR_ADMIN',       'Direction Administrative',    'DIRECTION'),
('DIR_FIN',         'Direction Financière',        'DIRECTION'),
('RH',              'Ressources Humaines',         'DIRECTION'),
('INFO',            'Informatique',                'DIRECTION'),
('ARCHIVES',        'Archives',                    'DIRECTION'),
('CELL_PNGIE',      'Cellule PNGIE-RDC',           'CELLULE');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, m.code_unite, m.nom_unite, m.type_unite
FROM t_auditorats_cm a
JOIN institution i ON i.code = a.code
CROSS JOIN t_modele_auditcm m
ON CONFLICT (institution_id, code) DO NOTHING;

CREATE TEMP TABLE t_postes_auditcm (code_unite text, code_poste text, intitule_poste text);
INSERT INTO t_postes_auditcm VALUES
('CABINET',        'AMS',  'Auditeur Militaire Supérieur'),
('CABINET',        'AMSA', 'Auditeur Militaire Supérieur Adjoint'),
('SECRETARIAT',    'SEC',  'Secrétaire'),
('SVC_POURSUITES', 'CSP',  'Chef du Service des Poursuites'),
('SVC_APPELS',     'CSA',  'Chef du Service des Appels'),
('SVC_ENQUETES',   'CSE',  'Chef du Service des Enquêtes'),
('SVC_DOC',        'CSD',  'Chef du Service de Documentation'),
('GREFFE_PARQUET', 'GC',   'Greffier en Chef du Parquet'),
('DIR_ADMIN',      'DA',   'Directeur Administratif'),
('DIR_FIN',        'DF',   'Directeur Financier'),
('RH',             'RH',   'Responsable des Ressources Humaines'),
('INFO',           'INF',  'Responsable Informatique'),
('ARCHIVES',       'ARC',  'Responsable des Archives'),
('CELL_PNGIE',     'CP',   'Chef de la Cellule PNGIE-RDC');

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, p.code_poste, p.intitule_poste
FROM t_auditorats_cm a
JOIN institution i ON i.code = a.code
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
JOIN t_postes_auditcm p ON p.code_unite = u.code
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM t_auditorats_cm a
JOIN institution i ON i.code = a.code
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
GROUP BY i.code, i.nom ORDER BY i.code;

-- Attendu par institution : 13 unités / 14 postes
COMMIT;
\echo '=== 12 Auditorats Militaires près les Cours Militaires créés (Tome 20, codes corrigés) ==='
