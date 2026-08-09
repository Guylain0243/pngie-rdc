# Clarification métier — decision_gouvernementale vs decision_institutionnelle
09/08/2026 — préalable à la Phase 1 du Cockpit Gouvernemental V1 (Q4)

## Verdict (fondé sur le code réel, pas sur une hypothèse)

**Ce sont deux entités indépendantes, sans aucun lien, qui ne doivent pas être fusionnées.**

## Preuve

`routes-generated/decision_institutionnelle.routes.js` porte cet en-tête :

```
// ROUTEUR GENERE AUTOMATIQUEMENT par government-builder.js
// Entite : undefined  (table : decision_institutionnelle)
// Scope  : INSTITUTION
```

C'est une route **générique auto-générée** par `government-builder.js`, du même moule exact que les
48 autres fichiers `routes-generated/*.routes.js` (`dossier_scolaire`, `licence_commerciale`,
`declaration_fiscale`, etc.) — pas une route pensée spécifiquement en contrepartie de
`decision_gouvernementale`.

Aucune clé étrangère, aucune colonne partagée, aucune référence croisée entre les deux tables.
Leur schéma le confirme :

| | `decision_gouvernementale` | `decision_institutionnelle` |
|---|---|---|
| Portée | Nationale, aucun filtre RLS/scope | Stricte à une seule institution (`WHERE institution_id = ctx.institutionId`) |
| Émetteur | `emetteur_institution_id` explicite | Institution courante de l'utilisateur connecté, implicite |
| Distribution | Une décision → plusieurs `decision_action` (une par institution concernée) | Aucun mécanisme de distribution — reste locale |
| Champs | `titre`, `description`, `date_emission` | `objet`, `type` (générique) |
| Généré par | Écrit à la main (`// Premier routeur construit integralement...` — cf. commentaires du domaine décision) | `government-builder.js` (génération de masse) |

## Ce que chacune représente réellement

- **`decision_gouvernementale`** : une décision prise au niveau du Gouvernement central
  (Président, Premier Ministre), destinée à être exécutée par une ou plusieurs institutions,
  avec un suivi d'avancement par institution (`decision_action`). C'est le cœur du futur Cockpit.
- **`decision_institutionnelle`** : un enregistrement administratif générique et local à une
  institution — au même titre que `dossier_scolaire` ou `licence_commerciale` sont des
  enregistrements administratifs génériques. Rien n'indique qu'elle ait été conçue pour le
  pilotage national ou pour interagir avec le Cockpit.

## Décision retenue pour le Cockpit V1

**`decision_institutionnelle` est explicitement hors périmètre du Cockpit Gouvernemental V1.**
Elle continue d'exister et de fonctionner comme n'importe quelle autre entité générique du
système (CRUD standard, RBAC propre), mais le Cockpit ne l'agrège pas, ne l'affiche pas, et
n'a aucune dépendance dessus.

Si un besoin métier réel apparaît plus tard (ex. : remonter au Cockpit les décisions internes
significatives d'un ministère), ce sera un chantier de conception à part entière — pas un
ajustement de dernière minute sur cette base actuelle.

## Point de dette technique à noter (hors périmètre de cette clarification)

`decision_institutionnelle.routes.js` autorise encore `DELETE` (suppression physique). Comme
toutes les 48 autres routes générées par `government-builder.js` sur ce modèle. La règle
d'immuabilité validée pour le Cockpit (pas de DELETE, transitions d'état à la place) ne s'y
applique pas automatiquement — à traiter séparément si cette règle doit un jour s'étendre à
l'ensemble des routes générées, hors périmètre du chantier Cockpit.
