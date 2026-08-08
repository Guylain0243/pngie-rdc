CREATE TABLE IF NOT EXISTS meta_notification_rule (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entite VARCHAR(100) NOT NULL,
    evenement VARCHAR(50) NOT NULL,
    condition_json JSONB NOT NULL,
    message_template TEXT NOT NULL,
    canal VARCHAR(30) NOT NULL DEFAULT 'INTERNE',
    destinataire_role_code VARCHAR(30) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification (
    notification_id UUID PRIMARY KEY,
    entity VARCHAR(100) NOT NULL,
    entity_id TEXT NOT NULL,
    canal VARCHAR(30) NOT NULL,
    destinataire_role_code VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_dest ON notification(destinataire_role_code);
CREATE INDEX IF NOT EXISTS idx_meta_notif_rule_entite ON meta_notification_rule(entite, evenement);