CREATE TABLE IF NOT EXISTS entity_event (
    event_id UUID PRIMARY KEY,
    entity VARCHAR(100) NOT NULL,
    entity_id TEXT NOT NULL,
    evenement VARCHAR(50) NOT NULL,
    donnees_avant JSONB,
    donnees_apres JSONB,
    utilisateur_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_event_entity ON entity_event(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_event_created ON entity_event(created_at);