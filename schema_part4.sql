CREATE TABLE journal_audit (
    audit_id                  UUID DEFAULT uuid_generate_v4(),
    personne_id               UUID REFERENCES personne(personne_id),
    entite                    VARCHAR(100) NOT NULL,
    entite_ref_id               UUID,
    action                    VARCHAR(30) NOT NULL,
    valeurs_avant                JSONB,
    valeurs_apres                JSONB,
    adresse_ip                 INET,
    user_agent                 TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (audit_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE journal_audit_default PARTITION OF journal_audit DEFAULT;

CREATE INDEX idx_audit_entite ON journal_audit(entite, entite_ref_id);
CREATE INDEX idx_audit_personne ON journal_audit(personne_id);
CREATE INDEX idx_audit_date ON journal_audit(created_at);

CREATE TABLE referentiel_national (
    referentiel_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                     VARCHAR(20) UNIQUE NOT NULL,
    nom                      VARCHAR(255) NOT NULL,
    institution_id             UUID REFERENCES institution(institution_id),
    description               TEXT,
    statut                   VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referentiel_national_section (
    section_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referentiel_id             UUID NOT NULL REFERENCES referentiel_national(referentiel_id),
    numero_section              INTEGER NOT NULL,
    titre                    VARCHAR(255) NOT NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(referentiel_id, numero_section)
);

CREATE TABLE referentiel_national_item (
    item_id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id                 UUID NOT NULL REFERENCES referentiel_national_section(section_id),
    code_item                  VARCHAR(50),
    libelle                   TEXT NOT NULL,
    metadata_json               JSONB,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rn_section_referentiel ON referentiel_national_section(referentiel_id);
CREATE INDEX idx_rn_item_section ON referentiel_national_item(section_id);

CREATE TABLE manuel_architecture (
    chapitre_id                VARCHAR(20) PRIMARY KEY,
    numero_chapitre              INTEGER UNIQUE NOT NULL,
    institution                VARCHAR(255) NOT NULL,
    titre_chapitre               VARCHAR(255) NOT NULL,
    contenu_narratif             TEXT NOT NULL,
    recherche_vecteur             TSVECTOR,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manuel_recherche ON manuel_architecture USING gin(recherche_vecteur);

CREATE TABLE index_recherche_global (
    index_id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_entite                 VARCHAR(50) NOT NULL,
    entite_ref_id                 UUID NOT NULL,
    titre                       VARCHAR(500) NOT NULL,
    extrait                     TEXT,
    institution_id                UUID REFERENCES institution(institution_id),
    recherche_vecteur              TSVECTOR NOT NULL,
    date_reference                 TIMESTAMPTZ,
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(type_entite, entite_ref_id)
);

CREATE INDEX idx_recherche_globale_gin ON index_recherche_global USING gin(recherche_vecteur);
CREATE INDEX idx_recherche_globale_type ON index_recherche_global(type_entite);