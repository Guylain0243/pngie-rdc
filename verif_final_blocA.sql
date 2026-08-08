SELECT role_code, entity, action, statut
FROM meta_permission
WHERE entity IN ('rni_lien','rni_instruction','rni_rapport')
ORDER BY entity, action, role_code;

SELECT COUNT(*) AS total_rni_permissions
FROM meta_permission
WHERE entity IN ('rni_lien','rni_instruction','rni_rapport');

SELECT COUNT(*) AS permissions_sensibles_non_accordees
FROM meta_permission
WHERE (entity = 'rni_lien' AND action IN ('CREATE','UPDATE','DEACTIVATE'))
   OR (entity = 'rni_instruction' AND action = 'UPDATE_STATUS');

\d delegation_perimetre
