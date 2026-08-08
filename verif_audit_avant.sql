SELECT log_id, action, entite, hash_prec, hash_actuel, created_at
FROM audit_log
ORDER BY log_id DESC
LIMIT 3;
