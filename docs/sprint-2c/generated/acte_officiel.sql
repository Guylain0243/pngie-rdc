CREATE TABLE acte_officiel (
  id TEXT PRIMARY KEY,
  numero_officiel TEXT,
  type_acte_id INTEGER NOT NULL REFERENCES type_acte_ref(id),
  institution_emettrice_id TEXT NOT NULL REFERENCES institution(institution_id),
  titre TEXT NOT NULL,
  resume TEXT,
  contenu_texte TEXT,
  document_pdf_id TEXT REFERENCES document(document_id),
  statut TEXT NOT NULL DEFAULT 'brouillon',
  diffusion TEXT NOT NULL DEFAULT 'restreint',
  acte_reference_id TEXT REFERENCES acte_officiel(id),
  date_signature TEXT,
  date_publication TEXT,
  date_entree_vigueur TEXT,
  cree_par TEXT NOT NULL REFERENCES personne(personne_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  recherche_tsv TEXT
);
CREATE INDEX idx_acte_officiel_type_acte ON acte_officiel(type_acte_id);
CREATE INDEX idx_acte_officiel_institution_emettrice ON acte_officiel(institution_emettrice_id);
CREATE INDEX idx_acte_officiel_document_pdf ON acte_officiel(document_pdf_id);
CREATE INDEX idx_acte_officiel_acte_reference ON acte_officiel(acte_reference_id);
CREATE INDEX idx_acte_officiel_cree_par ON acte_officiel(cree_par);
