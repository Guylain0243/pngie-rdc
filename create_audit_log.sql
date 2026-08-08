CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    person_id UUID,
    action VARCHAR(50) NOT NULL,
    entite VARCHAR(100) NOT NULL,
    entite_id TEXT,
    detail JSONB,
    hash_prec CHAR(64) NOT NULL,
    hash_actuel CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_person ON audit_log(person_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);