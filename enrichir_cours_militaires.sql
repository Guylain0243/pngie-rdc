-- ============================================================================
-- PNGIE-RDC — Enrichissement des 12 Cours Militaires (Tome 17, modèle complet)
-- Les 5 unités déjà créées (PRESIDENCE, AUDIT_SUP, CH_JUDICIAIRE, GREFFE, SG)
-- ne sont PAS touchées. On ajoute les unités manquantes du modèle officiel,
-- et on complète le Ministère Public Militaire (AUDIT_SUP) avec les 2 postes
-- manquants (Premier Avocat Général, Avocat Général) plutôt que de créer un
-- doublon d'unité.
-- Exécution : psql -f .\enrichir_cours_militaires.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

-- Vérification préalable
DO $$
DECLARE
    v_nb int;
BEGIN
    SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle u
    JOIN institution i ON i.institution_id = u.institution_id
    WHERE i.code LIKE 'CM_%';
    RAISE NOTICE '% unités existantes sur les 12 Cours Militaires avant enrichissement (attendu 60 = 12x5).', v_nb;
END $$;

-- Nouvelles unités du modèle officiel (Tome 17), à ajouter à chaque Cour Militaire
CREATE TEMP TABLE t_cm_ajout (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_cm_ajout VALUES
('VICE_PRESIDENT', 'Vice-Président',                    'DIRECTION',   'VP',  'Vice-Président'),
('SERVICE_DOC',     'Service de Documentation',          'DIRECTION',   'SD',  'Chef du Service de Documentation'),
('SERVICE_INFO',    'Service Informatique',              'DIRECTION',   'SI',  'Chef du Service Informatique'),
('DIR_ADMIN',       'Direction Administrative',          'DIRECTION',   'DA',  'Directeur Administratif'),
('DIR_FIN',         'Direction Financière',              'DIRECTION',   'DF',  'Directeur Financier'),
('DIR_RH',          'Direction des Ressources Humaines',  'DIRECTION',   'DRH', 'Directeur des Ressources Humaines'),
('ARCHIVES',        'Archives',                          'DIRECTION',   'ARC', 'Responsable des Archives'),
('CELL_PNGIE',      'Cellule PNGIE-RDC',                 'CELLULE',     'CP',  'Chef de la Cellule PNGIE-RDC'),
('SECURITE',        'Sécurité',                          'DIRECTION',   'SEC', 'Responsable de la Sécurité');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_cm_ajout t
WHERE i.code LIKE 'CM_%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_cm_ajout t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.code LIKE 'CM_%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Complément du Ministère Public Militaire (unité AUDIT_SUP déjà existante) :
-- ajout des 2 postes manquants du Tome 17, sans créer de nouvelle unité.
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'AUDIT_SUP'
CROSS JOIN (VALUES
    ('PAG', 'Premier Avocat Général Militaire'),
    ('AG',  'Avocat Général Militaire')
) AS x(code_poste, intitule_poste)
WHERE i.code LIKE 'CM_%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Contrôle
SELECT i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code LIKE 'CM_%'
GROUP BY i.code ORDER BY i.code;

-- Attendu par Cour Militaire : 14 unités (5 existantes + 9 nouvelles),
-- 16 postes (5 existants + 9 nouveaux + 2 ajoutés dans AUDIT_SUP)
COMMIT;
\echo '=== Enrichissement des 12 Cours Militaires terminé (Tome 17) ==='
