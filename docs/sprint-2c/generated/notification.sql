CREATE TABLE notification (
  notification_id TEXT PRIMARY KEY,
  destinataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  type_notification TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'IN_APP',
  titre TEXT NOT NULL,
  contenu TEXT,
  entite_liee TEXT,
  entite_liee_ref_id TEXT,
  lu BOOLEAN NOT NULL DEFAULT 0,
  date_envoi TEXT,
  date_lecture TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notification_destinataire ON notification(destinataire_id);
