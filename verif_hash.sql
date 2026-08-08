SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';
SELECT audit_id, hash_prec, hash_actuel FROM journal_audit ORDER BY created_at DESC LIMIT 3;
SELECT count(*) AS lignes_sans_hash FROM journal_audit WHERE hash_actuel IS NULL;
