-- Correctif : le poste "Avocat Général Militaire" n'a pas été créé
-- (collision de code 'AG' avec le poste existant "Auditeur Général des FARDC")
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'AVG', 'Avocat Général Militaire'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'AUDIT_GEN'
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'HAUTE_COUR_MILITAIRE'
GROUP BY i.code;
-- Attendu : 16 unités / 18 postes
