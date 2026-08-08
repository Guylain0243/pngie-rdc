-- ============================================================================
-- PNGIE-RDC — Peuplement des juridictions militaires (niveau 1 et 2)
-- Source : CSM-RDC (Cour Militaire), recoupé avec presse judiciaire RDC — 29/07/2026
--   "Il est institué une (1) cour militaire par province, deux (2) dans la ville
--    de Kinshasa, soit au total douze (12) cours militaires."
-- Structure appliquée : "proposée à valider" (pas de Tome officiel par cour reçu)
--
-- ⚠️ Mêmes hypothèses de schéma que les scripts précédents (institution, 
-- unite_organisationnelle, poste). Vérifiez \d avant exécution.
--
-- Exécution : psql -f populate_juridictions_militaires.sql "%PNGIE_DB_URL%"
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Haute Cour Militaire (institution unique, sommet de l'ordre militaire)
-- ----------------------------------------------------------------------------
INSERT INTO institution (code, nom, type, statut)
VALUES ('HAUTE_COUR_MILITAIRE', 'Haute Cour Militaire', 'juridiction', 'ACTIF')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_modele_hcm (suffixe_unite text, nom_unite text, suffixe_poste text, intitule_poste text);
INSERT INTO t_modele_hcm VALUES
('PRESIDENCE',      'Présidence',                          'PP', 'Premier Président'),
('AUDIT_GEN_FARDC',  'Auditorat Général des FARDC',         'AG', 'Auditeur Général des FARDC'),
('CH_JUDICIAIRE',   'Chambre Judiciaire',                  'PCJ','Président de la Chambre Judiciaire'),
('CH_DISCIPLINE',   'Chambre de Discipline Militaire',     'PCD','Président de la Chambre de Discipline'),
('GREFFE',          'Greffe',                              'GC', 'Greffier en Chef'),
('SG',              'Secrétariat Général',                 'SG', 'Secrétaire Général');

INSERT INTO unite_organisationnelle (institution_id, code, nom)
SELECT i.id, i.code || '-' || m.suffixe_unite, m.nom_unite
FROM institution i
CROSS JOIN t_modele_hcm m
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.id, u.code || '-' || m.suffixe_poste, m.intitule_poste
FROM institution i
CROSS JOIN t_modele_hcm m
JOIN unite_organisationnelle u
    ON u.institution_id = i.id AND u.code = i.code || '-' || m.suffixe_unite
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Les 12 Cours Militaires
-- ----------------------------------------------------------------------------
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

CREATE TEMP TABLE t_modele_cm (suffixe_unite text, nom_unite text, suffixe_poste text, intitule_poste text);
INSERT INTO t_modele_cm VALUES
('PRESIDENCE',    'Présidence',                     'P',  'Président'),
('AUDIT_SUP',     'Auditorat Militaire Supérieur',  'AMS','Auditeur Militaire Supérieur'),
('CH_JUDICIAIRE', 'Chambre Judiciaire',             'PCJ','Président de la Chambre Judiciaire'),
('GREFFE',        'Greffe',                         'GC', 'Greffier en Chef'),
('SG',            'Secrétariat',                    'SG', 'Secrétaire');

INSERT INTO institution (code, nom, type, statut)
SELECT code, nom, 'juridiction', 'ACTIF'
FROM t_cours_militaires
ON CONFLICT (code) DO NOTHING;

INSERT INTO unite_organisationnelle (institution_id, code, nom)
SELECT i.id, i.code || '-' || m.suffixe_unite, m.nom_unite
FROM t_cours_militaires c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_cm m
ON CONFLICT (code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.id, u.code || '-' || m.suffixe_poste, m.intitule_poste
FROM t_cours_militaires c
JOIN institution i ON i.code = c.code
CROSS JOIN t_modele_cm m
JOIN unite_organisationnelle u
    ON u.institution_id = i.id AND u.code = i.code || '-' || m.suffixe_unite
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Contrôle avant COMMIT
-- ----------------------------------------------------------------------------
SELECT
    i.code,
    i.nom,
    COUNT(DISTINCT u.id) AS nb_unites,
    COUNT(DISTINCT p.id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.id
LEFT JOIN poste p ON p.unite_id = u.id
WHERE i.code = 'HAUTE_COUR_MILITAIRE' OR i.code LIKE 'CM_%'
GROUP BY i.code, i.nom
ORDER BY i.code;

-- Attendu : HAUTE_COUR_MILITAIRE → 6 unités / 6 postes
--           chaque CM_% → 5 unités / 5 postes (12 cours)
-- Si conforme :
COMMIT;
-- Sinon : ROLLBACK, corrigez, relancez.

\echo '=== Peuplement Haute Cour Militaire + 12 Cours Militaires terminé ==='
