# CHANGELOG — migrations_rls

## Session de finalisation (voir historique de conversation pour le détail)

- Audit complet des triggers non-SECURITY DEFINER sur les tables
  utilisées (47 triggers au total, 3 tables "invisibles" confirmées :
  `journal_audit`, `rnsj_texte_historique`, `index_recherche_global`).
- Découverte et documentation de `notification` comme cible d'écriture
  de `fn_detecter_anomalie_connexion` (in fine déjà dans le périmètre
  des 84 tables utilisées, pas besoin de GRANT séparé).
- Détection de 156 tables avec GRANT préexistant sur `pngie_app`,
  incluant des privilèges excessifs (`TRUNCATE`, `TRIGGER`,
  `REFERENCES`) et l'accès à des sous-systèmes dormants (`rnso_*`,
  et 8 tables `ref_*`/`meta_*` hors périmètre).
- Confirmation par grep (code + fonctions + vues PostgreSQL) que ces
  tables en trop sont bien inutilisées.
- Sauvegarde complète des GRANT avant nettoyage
  (`pngie_app_grants_backup.txt`, 774 lignes).
- Écriture du module `migrations_rls/` : scripts numérotés
  idempotents, séparation script/transaction (pas de transactions
  imbriquées), pré-check et post-check avec arrêts automatiques,
  procédures de rollback, wrappers PowerShell.

## Points ouverts pour la prochaine session

- Statut définitif de `journal_connexion` (voir ADR-008 /
  SECURITY_NOTES.md).
- Inspection des scripts SQL préexistants dans `pngie-backend/`
  (origine probable des privilèges excessifs découverts).
- Bascule effective de `DATABASE_URL` applicatif vers `pngie_app`,
  uniquement après validation complète de `006_postcheck.sql`.
