-- ============================================================
-- 005_triggers_journal.sql
-- Triggers du module Journal National
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- updated_at automatique
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_maj_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acte_officiel_updated_at
    BEFORE UPDATE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_maj_updated_at();

-- ------------------------------------------------------------
-- Recherche plein texte (français, pondérée titre > résumé > contenu)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Garde-fou de sécurité : double contrôle publication.
-- Le backend valide déjà la présence d'une signature avant d'appeler
-- la transition ; ce trigger est le DERNIER rempart en base — il
-- s'applique même si l'update vient d'un script SQL direct, d'une
-- future route oubliée, ou d'une erreur de développement.
-- Il attribue aussi le numéro officiel au moment exact de la publication.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_acte_controle_publication() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'publie' AND OLD.statut IS DISTINCT FROM 'publie' THEN

        IF NOT EXISTS (SELECT 1 FROM acte_signature WHERE acte_id = NEW.id) THEN
            RAISE EXCEPTION 'Publication refusée : acte % sans signature enregistrée', NEW.id;
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

-- ------------------------------------------------------------
-- Extension SÉLECTIVE de journal_audit — uniquement les 3 tables
-- juridiquement sensibles : acte_officiel, acte_signature, acte_historique.
-- (acte_piece_jointe et acte_workflow_transition volontairement exclues :
-- pas d'enjeu juridique direct, déjà couvertes fonctionnellement ailleurs.)
--
-- IMPORTANT : la définition exacte du trigger (BEFORE/AFTER, FOR EACH ROW,
-- arguments passés à fn_audit_generique) doit être recopiée EXACTEMENT
-- depuis un des 5 triggers existants (trg_audit_document, trg_audit_institution,
-- trg_audit_personne, trg_audit_personne_role, trg_audit_role) pour rester
-- cohérente avec le mécanisme déjà en place. Le squelette ci-dessous est
-- indicatif et À VÉRIFIER avant exécution contre la définition réelle.
-- ------------------------------------------------------------
CREATE TRIGGER trg_audit_acte_officiel
    AFTER INSERT OR UPDATE OR DELETE ON acte_officiel
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique();

CREATE TRIGGER trg_audit_acte_signature
    AFTER INSERT OR UPDATE OR DELETE ON acte_signature
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique();

CREATE TRIGGER trg_audit_acte_historique
    AFTER INSERT OR UPDATE OR DELETE ON acte_historique
    FOR EACH ROW EXECUTE FUNCTION fn_audit_generique();

COMMIT;
