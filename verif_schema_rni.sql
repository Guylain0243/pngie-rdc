\d meta_permission
\d role_permission
\d role
\d permission
\d person_role
\d affectation
\d poste
\d unite_organisationnelle
\d audit_log
SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%delegation%' OR table_name ILIKE '%habilitation%';
SELECT DISTINCT role_code FROM meta_permission ORDER BY role_code;
SELECT DISTINCT entity FROM meta_permission ORDER BY entity;
