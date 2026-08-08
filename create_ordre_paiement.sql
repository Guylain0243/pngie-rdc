CREATE TABLE IF NOT EXISTS ordre_paiement (
    ordre_paiement_id UUID PRIMARY KEY,
    beneficiaire VARCHAR(255) NOT NULL,
    montant NUMERIC(18,2) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    valide_par_budget VARCHAR(10),
    valide_par_finances VARCHAR(10),
    valide_par_primature VARCHAR(10),
    valide_par_presidence VARCHAR(10),
    valide_par_igf VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ordre_paiement_statut ON ordre_paiement(statut);
CREATE INDEX IF NOT EXISTS idx_ordre_paiement_created ON ordre_paiement(created_at);