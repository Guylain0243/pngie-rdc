-- ============================================================================
-- PNGIE-RDC — Cour Constitutionnelle : correction de conformité juridique
-- La Cour constitutionnelle comprend neuf (9) juges (art. 158 de la
-- Constitution ; Loi organique n°13/026 du 15/10/2013).
-- Nature de la modification : correction d'une valeur numérique de
-- paramétrage (nombre_postes_autorises) uniquement. Aucun identifiant,
-- intitulé, code, ou lien hiérarchique n'est modifié.
-- Exécution : psql -f .\fix_nb_juges_cour_constitutionnelle.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_avant int;
BEGIN
    SELECT nombre_postes_autorises INTO v_avant FROM poste WHERE code = 'POS-CC-JUGE-NEW';
    RAISE NOTICE 'POS-CC-JUGE-NEW : nombre_postes_autorises AVANT correction = %', v_avant;
END $$;

UPDATE poste
SET nombre_postes_autorises = 9,
    updated_at = now()
WHERE code = 'POS-CC-JUGE-NEW';

-- Contrôle
SELECT code, intitule, nombre_postes_autorises, statut
FROM poste
WHERE code = 'POS-CC-JUGE-NEW';

-- Attendu : nombre_postes_autorises = 9
COMMIT;
\echo '=== Correction appliquée : POS-CC-JUGE-NEW porté à 9 postes autorisés (art. 158 Constitution, Loi organique n°13/026) ==='
