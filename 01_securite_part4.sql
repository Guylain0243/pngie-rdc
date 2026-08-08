CREATE OR REPLACE FUNCTION fn_detecter_anomalie_connexion() RETURNS TRIGGER AS $sig$
DECLARE
    v_echecs_recents INTEGER;
    v_admin RECORD;
BEGIN
    IF NEW.resultat = 'ECHEC' AND NEW.adresse_ip IS NOT NULL THEN
        SELECT count(*) INTO v_echecs_recents
        FROM journal_connexion
        WHERE adresse_ip = NEW.adresse_ip
          AND resultat = 'ECHEC'
          AND created_at > now() - INTERVAL '10 minutes';

        IF v_echecs_recents >= 8 THEN
            FOR v_admin IN
                SELECT DISTINCT pr.personne_id
                FROM personne_role pr
                JOIN role r ON r.role_id = pr.role_id
                WHERE r.code = 'SUPERADMIN' AND pr.statut = 'ACTIF'
            LOOP
                INSERT INTO notification(destinataire_id, type_notification, canal, titre, contenu, entite_liee, entite_liee_ref_id)
                VALUES (
                    v_admin.personne_id,
                    'ALERTE_SECURITE',
                    'IN_APP',
                    'Activite de connexion suspecte detectee',
                    format('Plus de %s tentatives echouees depuis l''adresse IP %s en 10 minutes.', v_echecs_recents, NEW.adresse_ip),
                    'journal_connexion',
                    NEW.connexion_id
                );
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$sig$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detecter_anomalie_connexion ON journal_connexion;
CREATE TRIGGER trg_detecter_anomalie_connexion AFTER INSERT ON journal_connexion
    FOR EACH ROW EXECUTE FUNCTION fn_detecter_anomalie_connexion();

DROP TRIGGER IF EXISTS trg_document_recherche_vecteur ON document;
CREATE TRIGGER trg_document_recherche_vecteur
    BEFORE INSERT OR UPDATE ON document
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(recherche_vecteur, 'pg_catalog.french', titre, resume, contenu_texte);

CREATE OR REPLACE FUNCTION fn_indexer_document() RETURNS TRIGGER AS $sig$
BEGIN
    INSERT INTO index_recherche_global(type_entite, entite_ref_id, titre, extrait, institution_id, recherche_vecteur, date_reference)
    VALUES (
        'document',
        NEW.document_id,
        NEW.titre,
        left(coalesce(NEW.resume, NEW.contenu_texte, ''), 500),
        NEW.institution_id,
        NEW.recherche_vecteur,
        NEW.date_publication::TIMESTAMPTZ
    )
    ON CONFLICT (type_entite, entite_ref_id) DO UPDATE
    SET titre = EXCLUDED.titre,
        extrait = EXCLUDED.extrait,
        institution_id = EXCLUDED.institution_id,
        recherche_vecteur = EXCLUDED.recherche_vecteur,
        date_reference = EXCLUDED.date_reference,
        updated_at = now();
    RETURN NEW;
END;
$sig$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_indexer_document ON document;
CREATE TRIGGER trg_indexer_document AFTER INSERT OR UPDATE ON document
    FOR EACH ROW EXECUTE FUNCTION fn_indexer_document();