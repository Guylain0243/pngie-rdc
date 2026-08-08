CREATE TABLE meta_workflow_transition (
    transition_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entite                VARCHAR(100) NOT NULL,
    from_statut            VARCHAR(50) NOT NULL,
    to_statut              VARCHAR(50) NOT NULL,
    role_code_requis        VARCHAR(30) REFERENCES role(code),
    condition_json          JSONB,
    statut                VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(entite, from_statut, to_statut, role_code_requis)
);

CREATE TABLE meta_rule (
    rule_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entite                 VARCHAR(100) NOT NULL,
    nom                    VARCHAR(255) NOT NULL,
    description             TEXT,
    evenement               VARCHAR(50) NOT NULL,
    condition_json           JSONB NOT NULL,
    message_erreur           TEXT NOT NULL,
    statut                  VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validation (
    validation_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entite                  VARCHAR(100) NOT NULL,
    entite_ref_id            UUID NOT NULL,
    etape                   VARCHAR(100) NOT NULL,
    valideur_id              UUID REFERENCES personne(personne_id),
    role_valideur_code        VARCHAR(30) REFERENCES role(code),
    decision                VARCHAR(20),
    commentaire              TEXT,
    signature_electronique_id UUID,
    date_echeance             TIMESTAMPTZ,
    date_decision             TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_entite ON validation(entite, entite_ref_id);
CREATE INDEX idx_validation_valideur ON validation(valideur_id);

CREATE TABLE signature_electronique (
    signature_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personne_id             UUID NOT NULL REFERENCES personne(personne_id),
    entite                  VARCHAR(100) NOT NULL,
    entite_ref_id            UUID NOT NULL,
    type_signature            VARCHAR(30) NOT NULL,
    empreinte_document        TEXT NOT NULL,
    certificat_reference       TEXT,
    horodatage                TIMESTAMPTZ NOT NULL DEFAULT now(),
    adresse_ip                INET,
    statut                   VARCHAR(20) NOT NULL DEFAULT 'VALIDE'
);

CREATE INDEX idx_signature_entite ON signature_electronique(entite, entite_ref_id);

CREATE TABLE type_document (
    type_document_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(30) UNIQUE NOT NULL,
    nom                     VARCHAR(255) NOT NULL,
    modele_url                TEXT
);

CREATE TABLE document (
    document_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_document_id          UUID NOT NULL REFERENCES type_document(type_document_id),
    institution_id            UUID REFERENCES institution(institution_id),
    titre                    VARCHAR(500) NOT NULL,
    reference                 VARCHAR(100) UNIQUE,
    resume                   TEXT,
    contenu_texte              TEXT,
    fichier_url                TEXT,
    fichier_hash                TEXT,
    langue                   VARCHAR(10) DEFAULT 'fr',
    statut                   VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    confidentialite            VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    auteur_id                 UUID REFERENCES personne(personne_id),
    date_publication            DATE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    recherche_vecteur           TSVECTOR
);

CREATE INDEX idx_document_institution ON document(institution_id);
CREATE INDEX idx_document_type ON document(type_document_id);
CREATE INDEX idx_document_recherche ON document USING gin(recherche_vecteur);

CREATE TABLE document_version (
    version_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id               UUID NOT NULL REFERENCES document(document_id),
    numero_version              INTEGER NOT NULL,
    fichier_url                 TEXT NOT NULL,
    fichier_hash                 TEXT NOT NULL,
    modifie_par_id              UUID REFERENCES personne(personne_id),
    commentaire_version           TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, numero_version)
);