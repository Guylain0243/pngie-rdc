CREATE TABLE agent_ia_interaction (
  interaction_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_ia(agent_id),
  personne_id TEXT REFERENCES personne(personne_id),
  requete TEXT NOT NULL,
  reponse TEXT,
  entite_liee TEXT,
  entite_liee_ref_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_ia_interaction_agent ON agent_ia_interaction(agent_id);
CREATE INDEX idx_agent_ia_interaction_personne ON agent_ia_interaction(personne_id);
