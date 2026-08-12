-- Migration : ajout des permissions agent/affectation/poste manquantes dans permission.
-- La vue meta_permission (utilisee par exigerPermission dans agent.routes.js) est
-- un simple JOIN permission+role et n'avait aucune ligne pour ces entites.
-- Matrice deduite de tests/e2e/002_rbac.test.js :
--   MI, PM, PR : lecture (READ) sur agent et affectation -> 200
--   AN, GV, SN : aucune permission -> 403 (refus par defaut du moteur)
--   MI, PR     : ecriture (CREATE/UPDATE/DELETE) sur agent -> 200/201/204 (hypothese, a confirmer)
--   PM         : refuse (403) en ecriture sur agent (lecture seule, confirme par le test)
INSERT INTO permission (role_id, entite, action, statut) VALUES
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'agent', 'READ', 'ACTIF'),
('62c08061-5d35-47a3-b72f-6f37a753d523', 'agent', 'READ', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'agent', 'READ', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'agent', 'CREATE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'agent', 'UPDATE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'agent', 'DELETE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'agent', 'CREATE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'agent', 'UPDATE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'agent', 'DELETE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'affectation', 'READ', 'ACTIF'),
('62c08061-5d35-47a3-b72f-6f37a753d523', 'affectation', 'READ', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'affectation', 'READ', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'affectation', 'CREATE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'affectation', 'UPDATE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'affectation', 'DELETE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'affectation', 'CREATE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'affectation', 'UPDATE', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'affectation', 'DELETE', 'ACTIF'),
('484505a8-7dd6-4ac4-85d1-04f332ac1f6f', 'poste', 'READ', 'ACTIF'),
('62c08061-5d35-47a3-b72f-6f37a753d523', 'poste', 'READ', 'ACTIF'),
('ee66f077-881b-4ba3-8999-396cb0cb44bc', 'poste', 'READ', 'ACTIF');

\echo '=== Verification via la vue meta_permission ==='
SELECT role_code, entity, action FROM meta_permission WHERE entity IN ('agent','affectation','poste') ORDER BY entity, role_code;
