SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('institution', 'document', 'index_recherche_global', 'personne_role');