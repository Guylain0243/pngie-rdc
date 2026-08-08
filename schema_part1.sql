CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TABLE institution (
    institution_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                 VARCHAR(20) UNIQUE NOT NULL,
    nom                  VARCHAR(255) NOT NULL,
    sigle                VARCHAR(50),
    type_institution     VARCHAR(50) NOT NULL,
    institution_parent_id UUID REFERENCES institution(institution_id),
    niveau_hierarchique  INTEGER NOT NULL DEFAULT 0,
    description          TEXT,
    adresse              TEXT,
    latitude             NUMERIC(10,7),
    longitude            NUMERIC(10,7),
    telephone            VARCHAR(50),
    email                VARCHAR(255),
    site_web             VARCHAR(255),
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    date_creation_legale DATE,
    texte_creation        VARCHAR(255),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_institution_parent ON institution(institution_parent_id);
CREATE INDEX idx_institution_type ON institution(type_institution);

CREATE TABLE unite_organisationnelle (
    unite_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id       UUID NOT NULL REFERENCES institution(institution_id),
    unite_parent_id       UUID REFERENCES unite_organisationnelle(unite_id),
    code                 VARCHAR(30) NOT NULL,
    nom                  VARCHAR(255) NOT NULL,
    type_unite           VARCHAR(50) NOT NULL,
    niveau_hierarchique  INTEGER NOT NULL DEFAULT 0,
    mission              TEXT,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(institution_id, code)
);

CREATE INDEX idx_unite_institution ON unite_organisationnelle(institution_id);
CREATE INDEX idx_unite_parent ON unite_organisationnelle(unite_parent_id);