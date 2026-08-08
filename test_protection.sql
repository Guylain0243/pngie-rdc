-- Test 1 : tentative de modification en tant que pngie_app (doit ECHOUER)
SET ROLE pngie_app;
DO $$
BEGIN
  UPDATE journal_audit SET action = 'HACKED' WHERE audit_id = (SELECT audit_id FROM journal_audit LIMIT 1);
  RAISE NOTICE 'ERREUR CRITIQUE : la modification a reussi, la protection ne fonctionne pas';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK : modification bien refusee (insufficient_privilege)';
END $$;
RESET ROLE;

-- Test 2 : insertion normale, verifier que le hash s'enchaine bien
INSERT INTO journal_audit (personne_id, entite, entite_ref_id, action, valeurs_apres)
VALUES (NULL, 'test_verification', gen_random_uuid(), 'CREATION', '{"test":"verification_hash_chaine"}'::jsonb);

SELECT audit_id, action, hash_prec, hash_actuel FROM journal_audit ORDER BY created_at DESC LIMIT 1;
