\# Journal Sprint 4 — Branchement du référentiel Justice (première route)



\*\*Statut : lecture validée de bout en bout, écriture reportée\*\*



\## Objectif



Brancher la première route sur une table du référentiel Justice déjà réelle

en base mais jamais exposée par une API (catégorie "DOC\_TEST\_SEULEMENT"

identifiée au Sprint 3), en suivant strictement la méthode d'audit-avant-

action appliquée depuis le Sprint 1.



Table choisie comme premier cas : `ref\_tribunal\_paix`.



\## Décisions de gouvernance actées



\### 1. Référentiel national vs donnée métier



Formalisé dans `docs/GOUVERNANCE\_REFERENTIELS\_VS\_METIER.md`. Règle : une

table est un référentiel national (pas de `institution\_id` obligatoire,

lecture ouverte, écriture restreinte) si sa valeur est identique pour toute

la RDC ; sinon c'est une donnée métier (isolation stricte par institution).

`ref\_tribunal\_paix` et toute la famille `ref\_tribunal\_\*` / `ref\_greffe` /

`ref\_parquet` / `ref\_cour\_appel` / etc. relèvent de la première catégorie.



\### 2. Permissions : configuration, pas changement d'architecture



Décision : ajouter des permissions dans le système RBAC existant

(`permission` → vue `meta\_permission` → `security-engine.js`) plutôt que de

brancher la colonne `role.lecture\_nationale` (actuellement inutilisée par

aucun code). Cette généralisation est reportée à un chantier séparé

(ticket \*\*AUTH-001\*\*), pour ne pas mélanger un correctif de configuration

avec une évolution d'architecture transverse.



\### 3. Écriture (WRITE) reportée



Aucune permission WRITE insérée. La gouvernance du référentiel Justice

(qui a l'autorité de créer/modifier un tribunal ?) n'est pas définie.

Reporté au ticket \*\*JUSTICE-REF-001\*\*.



\## Découverte technique : meta\_permission est une vue



Une première tentative d'`INSERT` directement sur `meta\_permission` a

échoué (`ne peut pas insérer dans la vue`). Inspection de la définition

(`pg\_get\_viewdef`) :



```sql

SELECT p.permission\_id, r.code AS role\_code, p.entite AS entity,

&#x20;      p.action, p.statut, p.condition\_json, p.created\_at

FROM permission p JOIN role r ON r.role\_id = p.role\_id

```



C'est le même schéma qu'avait révélé le bug `role\_permission` au Sprint 2 :

une vue de lecture pratique posée sur la table réelle `permission`, avec des

noms de colonnes traduits (`entite` → `entity`, `role\_id` → `role\_code`).

Corrigé en ciblant directement `permission` avec les vrais noms de colonnes.



\## Script d'insertion des permissions



`scripts/diagnostic/grant\_read\_ref\_tribunal\_paix.js` — idempotent, mode

`--dry-run` disponible, insère uniquement READ, résout automatiquement

`role\_id` à partir des codes de rôle (`AN, PM, SN, PR, GV, MI`).



Exécuté avec succès : 6 permissions insérées, vérifiées par relecture à

travers la vue `meta\_permission` (traduction `role\_id`→`role\_code`

confirmée fonctionnelle).



\## Route créée



`routes-generated/ref\_tribunal\_paix.routes.js`, écrite manuellement en

suivant les conventions de `certificat\_pki.routes.js` (seule route

`CABLÉE` confirmée en fonctionnement lors de l'audit Sprint 3), avec deux

adaptations documentées en commentaire dans le code :



\- Pas de filtre `institution\_id` (référentiel national, voir gouvernance §1).

\- Clé primaire `ini` fournie par l'appelant comme code métier (hypothèse

&#x20; posée faute de valeur par défaut en base ; à confirmer si le comportement

&#x20; attendu est différent).

\- DELETE laissé en suppression physique par cohérence avec le gabarit,

&#x20; mais probablement à remplacer par un statut `ARCHIVE` avant mise en

&#x20; production (traçabilité judiciaire).



\## Montage



Route montée dans `src/server.js`, juste après `certificat\_pki.routes`,

suivant le même schéma que toutes les autres routes de `routes-generated/`.



\## Test de bout en bout (validé)



1\. Démarrage du serveur (`npm start`) : aucune erreur, `require()` de la

&#x20;  nouvelle route chargé sans casser le processus.

2\. Authentification réelle via `/api/auth/login` avec un compte de démo du

&#x20;  Sprint 2 (`pr@rdc.gouv.cd`, rôle `PR`) : JWT obtenu.

3\. Appel `GET /api/ref\_tribunal\_paix` avec ce JWT :

&#x20;  - Réponse HTTP 200

&#x20;  - Corps : `\[]` (tableau vide, confirmé — `Object\[]`, `Count: 0`)

&#x20;  - Confirme la chaîne complète : JWT → `requireAuth` →

&#x20;    `resoudreRoleDepuisJWT` (résolution du rôle `PR`) →

&#x20;    `exigerPermission('ref\_tribunal\_paix', 'READ')` → vue

&#x20;    `meta\_permission` → table `permission` → autorisation accordée →

&#x20;    requête SQL exécutée → réponse renvoyée.



Le tableau vide est attendu : la table `ref\_tribunal\_paix` ne contient

aucune ligne (confirmé par `inspect\_table\_structure.js` au Sprint 3).



\## Découverte annexe (hors périmètre, non traitée)



`server.js` contient un second système RBAC plus ancien

(`hasPermission()` / `requirePermission()` inline), utilisé par

`/api/ministeres`, `/api/provinces`, `/api/agents`, etc. Il interroge

`role\_permission` comme une vraie table de jonction et `permission.code`,

alors que :

\- `role\_permission` est une vue (confirmé Sprint 2)

\- la table réelle `permission` n'a pas de colonne `code` visible dans sa

&#x20; structure (`permission\_id, role\_id, entite, action, statut,

&#x20; condition\_json, created\_at`)



Ce chemin RBAC ancien semble donc potentiellement cassé ou désynchronisé.

N'affecte pas les routes passant par `exigerPermission()`/

`security-engine.js` (chemin séparé, celui utilisé par Sprint 4). À

investiguer séparément si des routes utilisant l'ancien système sont

censées fonctionner.



\## Sécurité opérationnelle



Le mot de passe `GATE\_PASS` est apparu en clair pendant une session de

test dans le terminal partagé. Recommandation : le faire tourner

(changer sa valeur) après la clôture du Sprint 4.



\## Prochaines étapes



\- Répéter le même schéma pour `rnso\_affectation` et `rnsj\_texte`

&#x20; (échantillons déjà inspectés au Sprint 3 — voir

&#x20; `inspect\_table\_structure.js`).

\- Ouvrir formellement les tickets AUTH-001 (généralisation

&#x20; `lecture\_nationale`) et JUSTICE-REF-001 (gouvernance des permissions

&#x20; WRITE sur le référentiel Justice).

\- Investiguer le second système RBAC potentiellement cassé dans

&#x20; `server.js` (découverte annexe ci-dessus).

