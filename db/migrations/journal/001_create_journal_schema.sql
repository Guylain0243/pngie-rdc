-- ============================================================
-- 001_create_journal_schema.sql
-- Module Journal National — création du schéma
-- Réf : JOURNAL_NATIONAL_MODELE_TECHNIQUE_V1.md
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- type_acte_ref
-- ------------------------------------------------------------
CREATE TABLE type_acte_ref (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(40)  NOT NULL UNIQUE,
    libelle         VARCHAR(120) NOT NULL,
    ordre_affichage SMALLINT     NOT NULL DEFAULT 0,
    actif           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- acte_numerotation
-- ------------------------------------------------------------
CREATE TABLE acte_numerotation (
    annee           SMALLINT PRIMARY KEY,
    dernier_numero  INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION fn_generer_numero_acte(p_annee SMALLINT)
RETURNS VARCHAR AS $$
DECLARE
    v_numero INTEGER;
BEGIN
    INSERT INTO acte_numerotation (annee, dernier_numero)
    VALUES (p_annee, 1)
    ON CONFLICT (annee)
    DO UPDATE SET dernier_numero = acte_numerotation.dernier_numero + 1
    RETURNING dernier_numero INTO v_numero;

    RETURN 'JN-' || p_annee || '-' || LPAD(v_numero::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- acte_officiel
-- ------------------------------------------------------------
CREATE TABLE acte_officiel (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_officiel           VARCHAR(20) UNIQUE,
    type_acte_id              INTEGER NOT NULL REFERENCES type_acte_ref(id),
    institution_emettrice_id  UUID NOT NULL REFERENCES institution(institution_id),

    titre                     VARCHAR(500) NOT NULL,
    resume                    TEXT,
    contenu_texte             TEXT,
    document_pdf_id           UUID REFERENCES document(document_id),

    statut                    VARCHAR(30) NOT NULL DEFAULT 'brouillon',
    diffusion                 VARCHAR(20) NOT NULL DEFAULT 'restreint'
                                 CHECK (diffusion IN ('public','restreint','confidentiel')),

    acte_reference_id         UUID REFERENCES acte_officiel(id),
    date_signature            TIMESTAMPTZ,
    date_publication          TIMESTAMPTZ,
    date_entree_vigueur       TIMESTAMPTZ,

    cree_par                  UUID NOT NULL REFERENCES personne(personne_id),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    recherche_tsv             TSVECTOR
);

CREATE INDEX idx_acte_officiel_type ON acte_officiel(type_acte_id);
CREATE INDEX idx_acte_officiel_statut ON acte_officiel(statut);
CREATE INDEX idx_acte_officiel_diffusion ON acte_officiel(diffusion);
CREATE INDEX idx_acte_officiel_institution ON acte_officiel(institution_emettrice_id);
CREATE INDEX idx_acte_officiel_date_publication ON acte_officiel(date_publication DESC);
CREATE INDEX idx_acte_officiel_reference ON acte_officiel(acte_reference_id);
CREATE INDEX idx_acte_recherche_tsv ON acte_officiel USING GIN (recherche_tsv);

-- ------------------------------------------------------------
-- acte_signature
-- ------------------------------------------------------------
CREATE TABLE acte_signature (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acte_id         UUID NOT NULL REFERENCES acte_officiel(id),
    signataire_id             UUID NOT NULL REFERENCES personne(personne_id),
    role_signataire VARCHAR(80),
    date_signature  TIMESTAMPTZ NOT NULL DEFAULT now(),
    hash_document   VARCHAR(128) NOT NULL,
    certificat_ref  VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_acte_signature_acte ON acte_signature(acte_id);

-- ------------------------------------------------------------
-- acte_piece_jointe
-- ------------------------------------------------------------
CREATE TABLE acte_piece_jointe (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acte_id       UUID NOT NULL REFERENCES acte_officiel(id),
    document_id               UUID NOT NULL REFERENCES document(document_id),
    libelle       VARCHAR(255),
    ordre         SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_acte_piece_jointe_acte ON acte_piece_jointe(acte_id);

-- ------------------------------------------------------------
-- acte_historique (historique métier — distinct de journal_audit)
-- ------------------------------------------------------------
CREATE TABLE acte_historique (
    id             BIGSERIAL PRIMARY KEY,
    acte_id        UUID NOT NULL REFERENCES acte_officiel(id),
    type_evenement VARCHAR(40) NOT NULL,
    valeur_avant   JSONB,
    valeur_apres   JSONB,
    modifie_par               UUID REFERENCES personne(personne_id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_acte_historique_acte ON acte_historique(acte_id, created_at);

-- ------------------------------------------------------------
-- acte_workflow_transition (machine à états, V1 — pas de moteur générique)
-- ------------------------------------------------------------
CREATE TABLE acte_workflow_transition (
    id                  SERIAL PRIMARY KEY,
    type_acte_id        INTEGER NOT NULL REFERENCES type_acte_ref(id),
    statut_origine      VARCHAR(30) NOT NULL,
    statut_cible        VARCHAR(30) NOT NULL,
    permission_requise  VARCHAR(60) NOT NULL,
    UNIQUE (type_acte_id, statut_origine, statut_cible)
);

COMMIT;
