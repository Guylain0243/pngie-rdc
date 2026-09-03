-- 008_retire_trigger_audit_historique.sql
-- acte_historique.id est BIGSERIAL, pas UUID : fn_audit_generique() ne peut
-- pas caster cette valeur en UUID pour entite_ref_id, d'ou l'echec systematique.
-- Decision : acte_historique EST deja la table d'historique fonctionnel du
-- module (cf. modele technique, section 9) - un audit generique supplementaire
-- dessus est redondant. On retire uniquement ce trigger, on garde
-- trg_audit_acte_officiel et trg_audit_acte_signature (PK UUID, fonctionnels).
BEGIN;
DROP TRIGGER IF EXISTS trg_audit_acte_historique ON acte_historique;
COMMIT;