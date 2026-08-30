\# Découverte — Désalignement `organization` vs `institution`



\*\*Statut : diagnostic terminé, aucune correction appliquée (hors périmètre immédiat)\*\*



\## Symptôme initial



`GET /api/ministeres` (route historique dans `src/server.js`) renvoie un

tableau vide `\[]` malgré un HTTP 200, alors que le Sprint 2 avait peuplé

42 ministères et 26 provinces.



\## Fausses pistes explorées (par élimination, avec preuve)



1\. Colonne `permission.code` inexistante → pas de crash observé (500),

&#x20;  donc n'explique pas le tableau vide à elle seule.

2\. RLS bloquant les lignes selon `app.current\_institution\_id` → plausible

&#x20;  en théorie (voir `src/db.js`), mais écarté par la preuve suivante.

3\. Requête SQL incorrecte (jointure ou nom de colonne erroné) → écarté :

&#x20;  `organization\_type` contient bien 8 lignes valides (`MINISTERE`,

&#x20;  `PROVINCE`, `PRESIDENCE`, etc.), la jointure est syntaxiquement correcte.



\## Cause racine confirmée



```sql

SELECT COUNT(\*) FROM organization;

\-- Résultat : 0

```



\*\*La table `organization` est vide, sans aucun filtre.\*\* Ce n'est donc pas

un bug de requête, de RLS, ni de permission — la donnée n'existe simplement

pas dans cette table.



\## Explication architecturale



Le seed du Sprint 2 (`db/seed.js`, après troncature) peuple la table

\*\*`institution`\*\* (le nouveau Référentiel National Institutionnel, RNI) —

confirmé par le message de seed \*"42 ministères, 26 provinces, 6 rôles"\* et

par la structure de `ref\_tribunal\_paix` (FK `institution\_id` →

`institution.institution\_id`, vérifiée au Sprint 4).



La route `/api/ministeres` dans `server.js`, elle, interroge l'\*\*ancien\*\*

modèle `organization` / `organization\_type` — un système parallèle, jamais

peuplé par le seed actuel.



Les deux modèles institutionnels coexistent dans le code sans être

synchronisés :



| Modèle | Table(s) | Peuplé par le seed actuel | Utilisé par |

|---|---|---|---|

| Ancien | `organization`, `organization\_type` | ❌ Non (0 ligne) | `/api/ministeres`, `/api/provinces`, `/api/organigramme` (routes inline de `server.js`) |

| Nouveau (RNI) | `institution` | ✅ Oui (42 ministères, 26 provinces) | `ref\_tribunal\_paix` et probablement d'autres tables `ref\_\*`/`rnso\_\*` (Sprint 3-4) |



\## Recommandation (non appliquée, décision à prendre séparément)



Ne pas corriger dans l'urgence. Deux options possibles pour une décision

future, à documenter séparément avant toute action :



1\. \*\*Migrer\*\* `/api/ministeres`/`/api/provinces`/`/api/organigramme` pour

&#x20;  interroger `institution` au lieu de `organization`.

2\. \*\*Déprécier\*\* ces routes si elles sont un résidu de l'ancien modèle,

&#x20;  au profit d'un futur endpoint basé sur `institution`.



Dans les deux cas, vérifier au préalable si `organization`/`organization\_type`

sont utilisées ailleurs dans le code (au-delà des 3 routes citées) avant de

les traiter comme du code mort.



\## Effet de bord de cette investigation



Le mot de passe de l'utilisateur applicatif `pngie\_app` a dû être

réinitialisé pendant cette session (perte d'accès à `DATABASE\_URL` sans

cause identifiée avec certitude — possiblement une variable d'environnement

`PGPASSWORD` propre à un terminal spécifique, jamais localisée). Nouveau

mot de passe en place via `pgdata/reset-pngie-app-password.ps1` (script

réversible : sauvegarde/restauration automatique de `pg\_hba.conf`).



\*\*Action de suivi requise\*\* : faire tourner ce mot de passe une dernière

fois vers une valeur définitive, stockée uniquement dans un gestionnaire

de secrets ou une variable d'environnement locale — il est apparu en clair

à plusieurs reprises pendant cette session de débogage.

