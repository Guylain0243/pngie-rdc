# DEBT-0001 — Table `personne` absente du schéma SQLite

**Statut :** ouvert
**Sprint d'origine :** 2D (diagnostic `npm test`)
**Sprint de résolution proposé :** 2E (à ouvrir)

## Constat

Le schéma SQLite (`db/schema.sqlite.sql`) contient plusieurs contraintes de clé étrangère de la forme :

```sql
REFERENCES personne(personne_id)
```

mais ne contient à aucun endroit la définition correspondante :

```sql
CREATE TABLE personne (...)
```

## Preuves

- Erreur SQLite obtenue lors du test de connexion (`POST /api/auth/login`) :
  ```
  SqliteError: no such table: main.personne
  ```
- Origine précise de l'erreur : `session_utilisateur.personne_id REFERENCES personne(personne_id)` (ligne ~1075 de `schema.sqlite.sql`), déclenchée à l'`INSERT INTO session_utilisateur` lors de la création de session après authentification réussie.
- **11 clés étrangères** au total référencent `personne(personne_id)` dans le schéma (compté via `Select-String -Pattern "REFERENCES\s+personne\s*\("`).
- `CREATE TABLE personne` : absent, confirmé par recherche exhaustive dans `schema.sqlite.sql`.
- `person` (anglais, singulier) existe bien comme table, avec une structure simple :
  ```sql
  CREATE TABLE person (
    person_id TEXT PRIMARY KEY,
    matricule TEXT UNIQUE,
    nom TEXT NOT NULL,
    prenom TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'ACTIF',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  ```
- `person_role` référence `organization(organization_id)` via `scope_org_id` — modèle ancien.
- `personne_role` référence `institution(institution_id)` via `scope_institution_id` — modèle nouveau, cohérent avec la migration `organization` → `institution` déjà traitée dans ce même Sprint 2D (voir patch minimal sur `institution`, appliqué et validé).
- Le login (`POST /api/auth/login` dans `src/server.js`) authentifie actuellement via `SELECT * FROM person WHERE email = ? AND statut = ?` — il utilise donc l'ancien modèle pour l'authentification elle-même, mais crée ensuite une session dans `session_utilisateur`, qui exige `personne` (nouveau modèle).

## Impact observé

Le test `connexion avec identifiants valides retourne un token` échoue avec une erreur 500. L'échec se produit **après** une authentification réussie (l'email/mot de passe sont validés contre `person` avec succès), au moment de la création de la session utilisateur. L'erreur provient d'un défaut du schéma (table référencée mais jamais définie), pas d'une erreur dans la requête SQL elle-même — le texte de la requête `INSERT INTO session_utilisateur (...)` a été vérifié caractère par caractère et ne contient aucune anomalie.

## Analyse

Le projet contient actuellement deux ensembles de tables coexistants, correspondant à deux générations du modèle de données :

**Ancien modèle (encore utilisé par le login) :**
```
organization
person
person_role   (→ organization via scope_org_id)
```

**Nouveau modèle (utilisé par le code métier récent : src/domains/governance/*.js, src/domains/journal/*.js) :**
```
institution
personne        ← absente du schéma
personne_role   (→ institution via scope_institution_id)
```

L'absence de `personne` rend le nouveau modèle incomplet et bloque toute opération applicative qui tente d'écrire vers une table référençant `personne` — pas seulement le login, potentiellement les 11 tables listées comme référençant `personne(personne_id)`.

## Décision

Aucune correction n'est appliquée dans le cadre du Sprint 2D. Le diagnostic s'arrête à ce constat prouvé. Un Sprint dédié (proposé : 2E) sera ouvert pour statuer sur la correction, une fois les questions ouvertes ci-dessous investiguées.

**Ce qui n'est PAS tranché par ce document** : la nature exacte de la correction à apporter. Plusieurs pistes sont plausibles mais aucune n'est démontrée à ce stade :
- `personne` était prévue dans le schéma cible mais sa définition n'a jamais été générée (omission du générateur de schéma du Sprint 2C).
- Une migration destinée à créer `personne` existe quelque part dans le projet mais n'a jamais été exécutée.
- Le login aurait dû être basculé vers `personne` en même temps que le reste du code métier, mais ce changement est resté inachevé.
- Une autre table, non encore identifiée, était destinée à remplacer `person` et n'est pas `personne`.

## Questions ouvertes (à investiguer avant toute correction)

- Quelle est la structure exacte attendue pour `personne` ? (comparer aux usages dans `src/domains/governance/*.js`, `src/domains/journal/*.js`, et aux colonnes exigées par les 11 FK)
- Existe-t-il une migration SQL destinée à créer `personne`, non exécutée ou non intégrée au schéma généré ?
- Faut-il migrer les données de `person` vers une nouvelle table `personne`, ou `personne` doit-elle être peuplée indépendamment ?
- Quelles routes/services utilisent encore `person` aujourd'hui, et lesquelles utilisent déjà `personne` ou `personne_role` ?
- `person_role` et `personne_role` doivent-elles à terme fusionner, ou coexister durablement (l'une nationale/legacy, l'autre institutionnelle) ?

## Méthode de diagnostic (pour référence)

Cette anomalie a été mise en évidence en suivant la même discipline que pour les découvertes précédentes de ce Sprint (`institution`/`organization`, `ai_agent`/`agent_ia`) : preuve avant hypothèse, isolation de la cause avant correction, vérification de l'ampleur (comptage des FK, recherche exhaustive) avant toute décision d'architecture. Voir également : `docs/seed-critical-fk.txt`, `docs/seed-missing-fk-tables.txt`, et le patch appliqué sur `institution` dans `db/seed.js` (Sprint 2D, résolu).
## Statut mis a jour (correctif de suivi)

**Statut :** Resolved

Le message du commit 1df4254 contenait une inexactitude : il indiquait a tort
que le seed n'ecrivait plus que dans 'personne'/'personne_role'. En realite,
db/seed.js continue d'ecrire dans les 4 tables (person, personne, person_role,
personne_role) - verifie par compteurs reels : person=6, personne=6,
person_role=6, personne_role=6. Le login (src/server.js) depend toujours de
'person' et continue de fonctionner normalement. Aucune regression fonctionnelle.

Ce correctif documente uniquement la description, sans modification de code.

## Validation

- 37 tests executes, 23 reussis, 14 echecs metier connus (pre-existants)
- 0 occurrence EBUSY
- Login verifie fonctionnel via tests\helpers.js (utilise par tous les tests)
