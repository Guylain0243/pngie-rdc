CREATE TABLE poste (
    poste_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unite_id             UUID NOT NULL REFERENCES unite_organisationnelle(unite_id),
    code                 VARCHAR(30) NOT NULL,
    intitule             VARCHAR(255) NOT NULL,
    poste_hierarchique_id UUID REFERENCES poste(poste_id),
    niveau_hierarchique  INTEGER NOT NULL DEFAULT 0,
    categorie            VARCHAR(50),
    missions             TEXT,
    attributions          TEXT,
    responsabilites       TEXT,
    competences_requises  TEXT,
    nombre_postes_autorises INTEGER NOT NULL DEFAULT 1,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(unite_id, code)
);

CREATE INDEX idx_poste_unite ON poste(unite_id);
CREATE INDEX idx_poste_hierarchique ON poste(poste_hierarchique_id);

CREATE TABLE personne (
    personne_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule            VARCHAR(50) UNIQUE,
    nom                  VARCHAR(150) NOT NULL,
    prenom               VARCHAR(150) NOT NULL,
    date_naissance       DATE,
    lieu_naissance       VARCHAR(255),
    sexe                 CHAR(1) CHECK (sexe IN ('M','F')),
    numero_identite_nationale VARCHAR(50) UNIQUE,
    email                VARCHAR(255) UNIQUE,
    telephone            VARCHAR(50),
    photo_url            TEXT,
    password_hash        TEXT NOT NULL,
    mfa_active           BOOLEAN NOT NULL DEFAULT false,
    mfa_secret           TEXT,
    langue_preferee      VARCHAR(10) NOT NULL DEFAULT 'fr',
    fuseau_horaire        VARCHAR(50) NOT NULL DEFAULT 'Africa/Kinshasa',
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    date_derniere_connexion TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personne_nom ON personne USING gin ((nom || ' ' || prenom) gin_trgm_ops);

CREATE TABLE affectation (
    affectation_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personne_id          UUID NOT NULL REFERENCES personne(personne_id),
    poste_id             UUID NOT NULL REFERENCES poste(poste_id),
    type_affectation      VARCHAR(30) NOT NULL DEFAULT 'TITULAIRE',
    date_debut           DATE NOT NULL,
    date_fin              DATE,
    texte_nomination      VARCHAR(255),
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affectation_personne ON affectation(personne_id);
CREATE INDEX idx_affectation_poste ON affectation(poste_id);
CREATE UNIQUE INDEX uq_affectation_poste_active ON affectation(poste_id)
    WHERE statut = 'ACTIF' AND type_affectation = 'TITULAIRE' AND date_fin IS NULL;

CREATE TABLE delegation_pouvoir (
    delegation_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegant_id          UUID NOT NULL REFERENCES personne(personne_id),
    delegataire_id        UUID NOT NULL REFERENCES personne(personne_id),
    perimetre             TEXT NOT NULL,
    date_debut           TIMESTAMPTZ NOT NULL,
    date_fin              TIMESTAMPTZ NOT NULL,
    texte_reference        VARCHAR(255),
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delegation_delegant ON delegation_pouvoir(delegant_id);
CREATE INDEX idx_delegation_delegataire ON delegation_pouvoir(delegataire_id);

CREATE TABLE role (
    role_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                 VARCHAR(30) UNIQUE NOT NULL,
    nom                  VARCHAR(255) NOT NULL,
    categorie            VARCHAR(50),
    description          TEXT,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE personne_role (
    personne_role_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personne_id          UUID NOT NULL REFERENCES personne(personne_id),
    role_id              UUID NOT NULL REFERENCES role(role_id),
    scope_institution_id  UUID REFERENCES institution(institution_id),
    date_attribution      TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_expiration       TIMESTAMPTZ,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    UNIQUE(personne_id, role_id, scope_institution_id)
);

CREATE INDEX idx_personne_role_personne ON personne_role(personne_id);

CREATE TABLE permission (
    permission_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id              UUID NOT NULL REFERENCES role(role_id),
    entite               VARCHAR(100) NOT NULL,
    action               VARCHAR(30) NOT NULL,
    condition_json         JSONB,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role_id, entite, action)
);

CREATE INDEX idx_permission_role ON permission(role_id);
CREATE INDEX idx_permission_entite ON permission(entite);

CREATE TABLE session_utilisateur (
    session_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personne_id          UUID NOT NULL REFERENCES personne(personne_id),
    token_hash           TEXT NOT NULL,
    adresse_ip            INET,
    user_agent            TEXT,
    date_debut            TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_expiration       TIMESTAMPTZ NOT NULL,
    date_revocation       TIMESTAMPTZ,
    statut               VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
);

CREATE INDEX idx_session_personne ON session_utilisateur(personne_id);

CREATE TABLE journal_connexion (
    connexion_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personne_id          UUID REFERENCES personne(personne_id),
    email_tente           VARCHAR(255),
    adresse_ip            INET,
    resultat              VARCHAR(20) NOT NULL,
    user_agent            TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_connexion_personne ON journal_connexion(personne_id);
CREATE INDEX idx_journal_connexion_date ON journal_connexion(created_at);