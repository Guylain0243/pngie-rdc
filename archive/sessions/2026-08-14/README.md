# Session du 14/08/2026

## Objectif
- Correction du moteur de scope institutionnel (`person_role.scope_org_id`)
- Correction d'une faille d'autorisation (IDOR) sur `/institutions/:id/dashboard`
- Nettoyage et validation du seed
- Nettoyage des permissions et des affectations manquantes
- Nettoyage du dépôt Git après le chantier
- Validation Baseline V1

## Contenu

### diagnostics/
Scripts d'investigation utilisés pour identifier les anomalies (comptes mal affectés,
problèmes d'encodage, structure des rôles/permissions, état des migrations).

### fixes/
Scripts correctifs ponctuels appliqués pendant la session (correction des scopes,
de l'encodage, de la lecture nationale, du seed).

### tools/
Outils de maintenance utilisés pendant la session (nettoyage du dépôt).

## Statut
Ces scripts ne sont plus exécutés par l'application. Ils sont conservés uniquement
pour la traçabilité technique du chantier du 14/08/2026 (Baseline V1).
