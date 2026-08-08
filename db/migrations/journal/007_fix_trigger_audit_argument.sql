-- 007_fix_trigger_audit_argument.sql
-- Le trigger 005 utilisait fn_audit_generique('id') sur les 3 tables,
-- ce qui est correct pour le nom de colonne (id est bien la PK des 3
-- tables acte_*). Recreation propre pour eliminer toute ambiguite
-- residuelle de definition.
BEGIN;

DROP TRIGGER IF EXISTS trg_audit_acte_officiel ON acte_officiel;
DROP TRIGGER IF EXISTS trg_audit_acte_signature ON acte_signature;
DROP TRIGGER IF EXISTS trg_audit_acte_historique ON acte_historique;

CREATE TRIGGER trg_audit_acte_officiel
    AFTER INSERT OR UPDATE OR DELETE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('id');

CREATE TRIGGER trg_audit_acte_signature
    AFTER INSERT OR UPDATE OR DELETE ON acte_signature
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('id');

CREATE TRIGGER trg_audit_acte_historique
    AFTER INSERT OR UPDATE OR DELETE ON acte_historique
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('id');

COMMIT;
