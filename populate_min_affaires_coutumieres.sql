-- ============================================================================
-- PNGIE-RDC — Peuplement du Ministère des Affaires Coutumières
-- Source : Tome 3, Chapitre 496 (organigramme officiel)
-- ⚠️ INSTITUTION DISTINCTE de MIN_0 (Intérieur, Sécurité, Décentralisation
--    et Affaires coutumières) — confirmé explicitement par l'utilisateur.
--    La recherche par nom exclut donc volontairement toute institution
--    dont le nom contient "Intérieur", pour ne jamais retomber sur MIN_0.
--
-- ⚠️ Mêmes hypothèses de schéma que les scripts précédents. Vérifiez \d si erreur.
-- Exécution : psql -f populate_min_affaires_coutumieres.sql "%PNGIE_DB_URL%"
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Localisation de l'institution (par nom, en excluant explicitement MIN_0)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_id int;
    v_code text;
    v_nom text;
    v_nb_unites int;
    v_nb_candidats int;
BEGIN
    SELECT COUNT(*) INTO v_nb_candidats
    FROM institution
    WHERE nom ILIKE '%coutumi%re%' AND nom NOT ILIKE '%int%rieur%';

    IF v_nb_candidats > 1 THEN
        RAISE NOTICE '⚠️ % institutions candidates trouvées (hors MIN_0) — vérifiez manuellement avant de continuer, le script prendra la première.', v_nb_candidats;
    END IF;

    SELECT id, code, nom INTO v_id, v_code, v_nom
    FROM institution
    WHERE nom ILIKE '%coutumi%re%' AND nom NOT ILIKE '%int%rieur%'
    LIMIT 1;

    IF v_id IS NULL THEN
        RAISE NOTICE '❌ Aucune institution "Affaires Coutumières" distincte de MIN_0 trouvée. Le script va en créer une nouvelle avec le code temporaire MIN_AFF_COUTUMIERES — VÉRIFIEZ/RENOMMEZ selon votre numérotation MIN_XX officielle.';
    ELSE
        SELECT COUNT(*) INTO v_nb_unites FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ Institution trouvée : id=%, code=%, nom=%, unités existantes=%', v_id, v_code, v_nom, v_nb_unites;
        IF v_nb_unites > 0 THEN
            RAISE NOTICE '⚠️ Cette institution a déjà % unité(s). ON CONFLICT DO NOTHING préserve l''existant : seules les unités manquantes seront ajoutées.', v_nb_unites;
        END IF;
    END IF;
END $$;

-- Crée l'institution seulement si elle n'existe pas déjà (hors MIN_0)
INSERT INTO institution (code, nom, type, statut)
SELECT 'MIN_AFF_COUTUMIERES', 'Ministère des Affaires Coutumières', 'ministere', 'ACTIF'
WHERE NOT EXISTS (
    SELECT 1 FROM institution WHERE nom ILIKE '%coutumi%re%' AND nom NOT ILIKE '%int%rieur%'
)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Structure officielle (Chapitre 496 — Architecture Institutionnelle)
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE t_unites_coutumieres (suffixe_unite text, nom_unite text, suffixe_poste text, intitule_poste text);
INSERT INTO t_unites_coutumieres VALUES
('CABINET',       'Cabinet du Ministre',                                   'MIN', 'Ministre'),
('VICE_MIN',      'Vice-Ministre',                                         'VM',  'Vice-Ministre'),
('SG',            'Secrétariat Général',                                   'SG',  'Secrétaire Général'),
('IG_COUTUM',     'Inspection Générale des Affaires Coutumières',          'IG',  'Inspecteur Général des Affaires Coutumières'),
('DG_AUT_COUT',   'Direction Générale des Autorités Coutumières',          'DG1', 'Directeur Général des Autorités Coutumières'),
('DG_CHEF_SECT',  'Direction Générale des Chefferies et Secteurs',         'DG2', 'Directeur Général des Chefferies et Secteurs'),
('DG_SUCC_COUT',  'Direction Générale des Successions Coutumières',        'DG3', 'Directeur Général des Successions Coutumières'),
('DG_MEDIATION',  'Direction Générale de la Médiation Coutumière',         'DG4', 'Directeur Général de la Médiation Coutumière'),
('DG_PATRIMOINE', 'Direction Générale du Patrimoine Coutumier',            'DG5', 'Directeur Général du Patrimoine Coutumier'),
('DG_ETUDES_REF', 'Direction Générale des Études et Réformes Coutumières', 'DG6', 'Directeur Général des Études et Réformes Coutumières'),
('DG_STAT_COUT',  'Direction Générale des Statistiques Coutumières',       'DG7', 'Directeur Général des Statistiques Coutumières'),
('DG_TRANS_NUM',  'Direction Générale de la Transformation Numérique',     'DG8', 'Directeur Général de la Transformation Numérique'),
('DSI',           'Direction des Systèmes d''Information',                 'DSI', 'Directeur des Systèmes d''Information'),
('DAF',           'Direction Administrative et Financière',                'DAF', 'Directeur Administratif et Financier'),
('DRH',           'Direction des Ressources Humaines',                     'DRH', 'Directeur des Ressources Humaines'),
('D_COOP_INST',   'Direction de la Coopération Institutionnelle',          'DCI', 'Directeur de la Coopération Institutionnelle'),
('CELL_PNGIE',    'Cellule PNGIE',                                         'CP',  'Chef de la Cellule PNGIE'),
('COORD_PROV',    'Coordinations Provinciales',                            'CPR', 'Coordonnateur des Coordinations Provinciales');

-- ----------------------------------------------------------------------------
-- 3. Insertion des unités (uniquement celles qui manquent)
-- ----------------------------------------------------------------------------
INSERT INTO unite_organisationnelle (institution_id, code, nom)
SELECT i.id, i.code || '-' || t.suffixe_unite, t.nom_unite
FROM institution i
CROSS JOIN t_unites_coutumieres t
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Insertion des postes (uniquement ceux qui manquent)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.id, u.code || '-' || t.suffixe_poste, t.intitule_poste
FROM institution i
CROSS JOIN t_unites_coutumieres t
JOIN unite_organisationnelle u
    ON u.institution_id = i.id AND u.code = i.code || '-' || t.suffixe_unite
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Contrôle avant COMMIT
-- ----------------------------------------------------------------------------
SELECT
    i.code,
    i.nom,
    COUNT(DISTINCT u.id) AS nb_unites,
    COUNT(DISTINCT p.id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.id
LEFT JOIN poste p ON p.unite_id = u.id
WHERE i.nom ILIKE '%coutumi%re%' AND i.nom NOT ILIKE '%int%rieur%'
GROUP BY i.code, i.nom;

-- Attendu : 18 unités / 18 postes
-- Vérifiez aussi qu'AUCUNE ligne "MIN_0" / "Intérieur..." n'apparaît ici —
-- si c'est le cas, ARRÊTEZ (ROLLBACK) : le filtre a échoué et le mauvais
-- ministère aurait été modifié.
-- Si conforme :
COMMIT;
-- Sinon : ROLLBACK, corrigez, relancez.

\echo '=== Peuplement Ministère des Affaires Coutumières terminé ==='
\echo 'RAPPEL : si le code temporaire MIN_AFF_COUTUMIERES a été utilisé, vérifiez/renommez-le'
\echo 'selon votre numérotation MIN_XX officielle.'
