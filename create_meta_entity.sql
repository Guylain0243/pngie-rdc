CREATE TABLE IF NOT EXISTS meta_entity (
    entity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_table VARCHAR(100) NOT NULL UNIQUE,
    pk_column VARCHAR(100) NOT NULL,
    libelle VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_relation (
    relation_id UUID PRIMARY KEY,
    source_entity VARCHAR(100) NOT NULL,
    source_id TEXT NOT NULL,
    relation VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id TEXT NOT NULL,
    date_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_relation_source ON entity_relation(source_entity, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_relation_target ON entity_relation(target_entity, target_id);

INSERT INTO meta_entity (nom_table, pk_column, libelle) VALUES
    ('institution', 'institution_id', 'Institution'),
    ('personne', 'personne_id', 'Personne'),
    ('document', 'document_id', 'Document'),
    ('ordre_paiement', 'ordre_paiement_id', 'Ordre de paiement'),
    ('poste', 'poste_id', 'Poste'),
    ('unite_organisationnelle', 'unite_id', 'Unite organisationnelle')
ON CONFLICT (nom_table) DO NOTHING;