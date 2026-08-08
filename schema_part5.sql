CREATE TABLE notification (
    notification_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinataire_id               UUID NOT NULL REFERENCES personne(personne_id),
    type_notification              VARCHAR(50) NOT NULL,
    canal                       VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    titre                       VARCHAR(255) NOT NULL,
    contenu                     TEXT,
    entite_liee                  VARCHAR(100),
    entite_liee_ref_id             UUID,
    lu                         BOOLEAN NOT NULL DEFAULT false,
    date_envoi                   TIMESTAMPTZ,
    date_lecture                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_destinataire ON notification(destinataire_id, lu);

CREATE TABLE agent_ia (
    agent_id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                        VARCHAR(50) UNIQUE NOT NULL,
    nom                         VARCHAR(255) NOT NULL,
    type_agent                    VARCHAR(30) NOT NULL,
    institution_id                 UUID REFERENCES institution(institution_id),
    modele_reference                VARCHAR(100),
    perimetre_donnees                TEXT,
    statut                       VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_ia_interaction (
    interaction_id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id                      UUID NOT NULL REFERENCES agent_ia(agent_id),
    personne_id                    UUID REFERENCES personne(personne_id),
    requete                      TEXT NOT NULL,
    reponse                      TEXT,
    entite_liee                    VARCHAR(100),
    entite_liee_ref_id               UUID,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_interaction_agent ON agent_ia_interaction(agent_id);
CREATE INDEX idx_agent_interaction_personne ON agent_ia_interaction(personne_id);