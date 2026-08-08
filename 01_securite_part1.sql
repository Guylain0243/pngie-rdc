CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE personne ADD COLUMN IF NOT EXISTS tentatives_echouees INTEGER NOT NULL DEFAULT 0;
ALTER TABLE personne ADD COLUMN IF NOT EXISTS verrouille_jusqu_a TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION fn_chiffrer(valeur TEXT) RETURNS TEXT AS $sig$
BEGIN
    IF valeur IS NULL THEN RETURN NULL; END IF;
    RETURN encode(pgp_sym_encrypt(valeur, current_setting('app.encryption_key', true)), 'base64');
END;
$sig$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_dechiffrer(valeur TEXT) RETURNS TEXT AS $sig$
BEGIN
    IF valeur IS NULL THEN RETURN NULL; END IF;
    RETURN pgp_sym_decrypt(decode(valeur, 'base64'), current_setting('app.encryption_key', true));
END;
$sig$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_enregistrer_echec_connexion(p_personne_id UUID) RETURNS VOID AS $sig$
DECLARE
    v_tentatives INTEGER;
BEGIN
    UPDATE personne
    SET tentatives_echouees = tentatives_echouees + 1
    WHERE personne_id = p_personne_id
    RETURNING tentatives_echouees INTO v_tentatives;

    IF v_tentatives >= 5 THEN
        UPDATE personne
        SET verrouille_jusqu_a = now() + INTERVAL '15 minutes'
        WHERE personne_id = p_personne_id;
    END IF;
END;
$sig$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_reinitialiser_echecs_connexion(p_personne_id UUID) RETURNS VOID AS $sig$
BEGIN
    UPDATE personne
    SET tentatives_echouees = 0, verrouille_jusqu_a = NULL
    WHERE personne_id = p_personne_id;
END;
$sig$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_compte_verrouille(p_personne_id UUID) RETURNS BOOLEAN AS $sig$
DECLARE
    v_verrou TIMESTAMPTZ;
BEGIN
    SELECT verrouille_jusqu_a INTO v_verrou FROM personne WHERE personne_id = p_personne_id;
    RETURN v_verrou IS NOT NULL AND v_verrou > now();
END;
$sig$ LANGUAGE plpgsql;