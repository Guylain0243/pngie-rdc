# Scripts de diagnostic

Scripts utilitaires pour auditer l'état de la base et du schéma
(structure, contraintes, triggers, cohérence des données).
À conserver et enrichir au fil des sprints.

| Script | Rôle |
|---|---|
| check_db_state.js | Vérifie l'état général de la base |
| check_db_state_bypass.js | (à documenter) |
| check_function_def.js | Vérifie la définition des fonctions SQL |
| check_id_compatibility.js | Vérifie la compatibilité des identifiants |
| check_login_query.js | (à documenter) |
| check_ministeres_rattachement.js | Vérifie le rattachement des ministères |
| check_niveau0.js | (à documenter) |
| check_organization_exhaustive_analysis.js | Analyse exhaustive des organisations |
| check_organization_typology.js | Vérifie la typologie des organisations |
| check_person_type.js | Vérifie les types de personnes |
| check_personne_cols.js | Vérifie les colonnes de la table personne |
| check_personne_role_schema.js | Vérifie le schéma des rôles personne |
| check_personne_schema.js | Vérifie le schéma de la table personne |
| check_rattachements.js | Vérifie les rattachements |
| check_schema_fk_tables.js | Vérifie les clés étrangères |
| check_schema_institution.js | Vérifie le schéma institution |
| check_triggers.js | Vérifie les triggers globaux |
| check_triggers_person.js | Vérifie les triggers de la table person |
| check_triggers_personne.js | Vérifie les triggers de la table personne |
| check_truncate_isolated.js | Vérifie le truncate isolé |
| check_truncate_list.js | Vérifie la liste des tables truncatables |
