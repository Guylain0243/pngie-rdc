SELECT to_regclass('public.delegation_perimetre');

SELECT role_code, entity, action
FROM meta_permission
WHERE entity IN ('rni_lien','rni_instruction','rni_rapport')
ORDER BY entity, action, role_code;
