-- Migration : force RLS sur les tables ou RLS etait active mais pas forcee,
-- ce qui exemptait le proprietaire de la table (pngie_app) de toutes les policies.
-- Trouve durant la session Baseline V1 - voir 007c (SN voyait les actes de MI).
ALTER TABLE acte_officiel FORCE ROW LEVEL SECURITY;
ALTER TABLE acte_historique FORCE ROW LEVEL SECURITY;
ALTER TABLE acte_piece_jointe FORCE ROW LEVEL SECURITY;
ALTER TABLE acte_signature FORCE ROW LEVEL SECURITY;
ALTER TABLE rnsj_modification FORCE ROW LEVEL SECURITY;
ALTER TABLE rnsj_relation FORCE ROW LEVEL SECURITY;
ALTER TABLE rnsj_texte FORCE ROW LEVEL SECURITY;
ALTER TABLE rnsj_texte_historique FORCE ROW LEVEL SECURITY;
