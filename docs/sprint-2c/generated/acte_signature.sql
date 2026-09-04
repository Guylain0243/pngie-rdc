CREATE TABLE acte_signature (
  id TEXT PRIMARY KEY,
  acte_id TEXT NOT NULL REFERENCES acte_officiel(id),
  signataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  role_signataire TEXT,
  date_signature TEXT NOT NULL DEFAULT (datetime('now')),
  hash_document TEXT NOT NULL,
  certificat_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_acte_signature_acte ON acte_signature(acte_id);
CREATE INDEX idx_acte_signature_signataire ON acte_signature(signataire_id);
