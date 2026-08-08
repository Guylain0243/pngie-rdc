CREATE OR REPLACE FUNCTION fn_audit_generique() RETURNS TRIGGER AS $sig$
DECLARE
    v_personne_id UUID;
    v_entite_ref_id UUID;
    v_avant JSONB;
    v_apres JSONB;
BEGIN
    BEGIN
        v_personne_id := current_setting('app.current_personne_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_personne_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_entite_ref_id := (to_jsonb(NEW)->>TG_ARGV[0])::UUID;
        v_apres := to_jsonb(NEW) - 'password_hash' - 'mfa_secret';
        INSERT INTO journal_audit(personne_id, entite, entite_ref_id, action, valeurs_apres, adresse_ip)
        VALUES (v_personne_id, TG_TABLE_NAME, v_entite_ref_id, 'CREATION', v_apres, inet_client_addr());
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        v_entite_ref_id := (to_jsonb(NEW)->>TG_ARGV[0])::UUID;
        v_avant := to_jsonb(OLD) - 'password_hash' - 'mfa_secret';
        v_apres := to_jsonb(NEW) - 'password_hash' - 'mfa_secret';
        INSERT INTO journal_audit(personne_id, entite, entite_ref_id, action, valeurs_avant, valeurs_apres, adresse_ip)
        VALUES (v_personne_id, TG_TABLE_NAME, v_entite_ref_id, 'MODIFICATION', v_avant, v_apres, inet_client_addr());
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_entite_ref_id := (to_jsonb(OLD)->>TG_ARGV[0])::UUID;
        v_avant := to_jsonb(OLD) - 'password_hash' - 'mfa_secret';
        INSERT INTO journal_audit(personne_id, entite, entite_ref_id, action, valeurs_avant, adresse_ip)
        VALUES (v_personne_id, TG_TABLE_NAME, v_entite_ref_id, 'SUPPRESSION', v_avant, inet_client_addr());
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$sig$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_personne ON personne;
CREATE TRIGGER trg_audit_personne AFTER INSERT OR UPDATE OR DELETE ON personne
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('personne_id');

DROP TRIGGER IF EXISTS trg_audit_document ON document;
CREATE TRIGGER trg_audit_document AFTER INSERT OR UPDATE OR DELETE ON document
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('document_id');

DROP TRIGGER IF EXISTS trg_audit_institution ON institution;
CREATE TRIGGER trg_audit_institution AFTER INSERT OR UPDATE OR DELETE ON institution
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('institution_id');

DROP TRIGGER IF EXISTS trg_audit_role ON role;
CREATE TRIGGER trg_audit_role AFTER INSERT OR UPDATE OR DELETE ON role
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('role_id');

DROP TRIGGER IF EXISTS trg_audit_personne_role ON personne_role;
CREATE TRIGGER trg_audit_personne_role AFTER INSERT OR UPDATE OR DELETE ON personne_role
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique('personne_role_id');