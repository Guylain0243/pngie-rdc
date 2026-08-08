CREATE OR REPLACE FUNCTION fn_entite_existe(p_table text, p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_exists boolean;
  v_allowed_tables text[] := ARRAY['institution','document','index_recherche_global','personne_role','ordre_paiement','poste','unite_organisationnelle'];
BEGIN
  IF NOT (p_table = ANY(v_allowed_tables)) THEN
    RAISE EXCEPTION 'Table % non autorisee pour fn_entite_existe', p_table;
  END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', p_table,
    CASE p_table WHEN 'institution' THEN 'institution_id'
                 WHEN 'document' THEN 'document_id'
                 WHEN 'personne_role' THEN 'personne_role_id'
                 WHEN 'ordre_paiement' THEN 'ordre_paiement_id'
                 WHEN 'poste' THEN 'poste_id'
                 WHEN 'unite_organisationnelle' THEN 'unite_id'
                 ELSE 'id' END)
  INTO v_exists USING p_id;
  RETURN v_exists;
END;
$func$;