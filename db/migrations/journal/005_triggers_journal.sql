-- ============================================================
-- 005_triggers_journal.sql (v2 — argument fn_audit_generique(pk) confirme par audit)
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION fn_maj_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acte_officiel_updated_at
    BEFORE UPDATE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_maj_updated_at();

CREATE OR REPLACE FUNCTION fn_acte_maj_tsvector() RETURNS TRIGGER AS $$
BEGIN
    NEW.recherche_tsv :=
        setweight(to_tsvector('french', coalesce(NEW.titre,'')), 'A') ||
        setweight(to_tsvector('french', coalesce(NEW.resume,'')), 'B') ||
        setweight(to_tsvector('french', coalesce(NEW.contenu_texte,'')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acte_tsvector
    BEFORE INSERT OR UPDATE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_acte_maj_tsvector();

CREATE OR REPLACE FUNCTION fn_acte_controle_publication() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'publie' AND OLD.statut IS DISTINCT FROM 'publie' THEN
        IF NOT EXISTS (SELECT 1 FROM acte_signature WHERE acte_id = NEW.id) THEN
            RAISE EXCEPTION 'Publication refusee : acte % sans signature enregistree', NEW.id;
        END IF;
        IF NEW.numero_officiel IS NULL THEN
            NEW.numero_officiel := fn_generer_numero_acte(EXTRACT(YEAR FROM now())::SMALLINT);
        END IF;
        IF NEW.date_publication IS NULL THEN
            NEW.date_publication := now();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acte_controle_publication
    BEFORE UPDATE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_acte_controle_publication();

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
