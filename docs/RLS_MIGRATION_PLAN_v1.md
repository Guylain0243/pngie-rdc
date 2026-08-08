\# PNGIE-RDC — RLS Migration Architecture v1.0



Document d'architecture marquant le passage d'un modele de securite purement

applicatif (RBAC + ScopeResolver) a un modele hybride ou PostgreSQL applique

egalement la securite des donnees. Redige a l'issue d'un audit complet mene

le 04-08-2026.



\## 1. Contexte



Prealables valides avant l'ouverture de ce chantier :

\- RBAC v1 valide (permission par role, table `permission`, vue `meta\_permission`)

\- ScopeResolver v1 valide (exigerPortee, resource-resolver.js, scope-resolver.js,

&#x20; hierarchy-service.js — teste E2E sur poste\_hierarchie, affectation, agent)

\- RNG Phase 1 valide (institution\_relation, types TUTELLE et

&#x20; RATTACHEMENT\_CONSTITUTIONNEL, normalisation des types d'institution)

\- Audit RLS termine (present document)



\## 2. Constat



Le backend se connecte a PostgreSQL avec le role :



postgres

SUPERUSER = true

BYPASSRLS = true





Consequence directe, verifiee par test SQL reel (pas seulement lecture de

policy) :

\- Toutes les politiques RLS sont contournees, sans exception, quel que soit

&#x20; le contenu de `app.current\_institution\_id`.

\- Les appels `SET LOCAL app.current\_institution\_id` (presents dans

&#x20; `src/db.js`) sont aujourd'hui sans aucun effet sur la securite.

\- La securite du systeme repose \*exclusivement\* sur la chaine applicative :



JWT -> RBAC -> ScopeResolver





Ce n'est pas un bug de conception des policies RLS (qui sont syntaxiquement

correctes et actives — `relrowsecurity=true`, `relforcerowsecurity=true` sur

8 tables), ni un conflit entre deux moteurs de portee. C'est un choix de

configuration d'infrastructure — le compte `postgres` utilise comme compte

applicatif par commodite de developpement — qui neutralise silencieusement

un mecanisme de securite par ailleurs bien construit.



\## 3. Decouvertes de l'audit (sous-systemes non documentes)



Un audit complementaire (149 tables au total, contre \~20 touchees en session)

a revele plusieurs sous-systemes pre-existants inconnus jusqu'ici :



\### Actifs (utilises reellement par le code)

\- RBAC (`permission`, `role`, `meta\_permission`)

\- ScopeResolver (construit cette session)

\- `institution\_relation` (RNG, construit cette session)

\- `src/services/institution-authority.js` — service d'autorite institutionnelle

&#x20; reellement utilise, mais uniquement par `src/rni-commandement-routes.js`

&#x20; (perimetre limite a la chaine de commandement RNI)

\- `delegation\_perimetre` / `delegation\_pouvoir` — tables de delegation

&#x20; temporaire d'autorite, alimentees et lues par institution-authority.js



\### Dormants (existent en base, zero reference dans le code source)

\- Schema `gouvernance` (23 tables `gouv\_\*` : decisions, directives, KPI,

&#x20; missions, objectifs, programmes, projets, politiques, risques, comites —

&#x20; 0 vue, 0 fonction, potentiellement pertinent pour Journal National/Cockpit

&#x20; National mais jamais branche a l'application actuelle)

\- `entity\_relation` (7 lignes), `entity\_scope` (44 lignes, structure trop

&#x20; generique pour porter un vrai scope operationnel)

\- `rnso\_\*` (rnso\_structure, rnso\_hierarchie, rnso\_affectation, rnso\_modele\_\*,

&#x20; rnso\_poste, rnso\_regle...) — hierarchie organisationnelle parallele a

&#x20; poste/unite\_organisationnelle, jamais appelee par le code

\- `fn\_institutions\_descendantes()` — fonction SQL utilisee par la policy RLS

&#x20; de `institution`, basee sur `institution\_parent\_id` (pas sur

&#x20; `institution\_relation`), neutralisee de fait par le bypass du role postgres



Decision : les elements dormants ne bloquent pas la migration RLS immediate.

Ils seront evalues au cas par cas lors des chantiers futurs (Journal National

pourra evaluer le schema `gouvernance` ; le judiciaire pourra reprendre

`rnsj\_\*`, deja identifie separement).



\## 4. Decision d'architecture — source de verite de la hierarchie



\*\*`institution\_relation` devient la source officielle unique\*\* de la

hierarchie institutionnelle (types TUTELLE, RATTACHEMENT\_CONSTITUTIONNEL,

extensible).



`institution\_parent\_id` entre en phase de depreciation : conserve

temporairement (aucune suppression), mais ne doit plus etre lu par aucun

nouveau code. `fn\_institutions\_descendantes()` devra etre migree en Phase 5

pour lire `institution\_relation` au lieu de `institution\_parent\_id`, afin

d'eviter que RLS (une fois reactive) applique une hierarchie differente de

celle du ScopeResolver applicatif.



\## 5. Decision concernant les delegations



`institution-authority.js` est \*\*conserve tel quel\*\*, sans fusion avec le

ScopeResolver. Il repond a un besoin distinct :



| | ScopeResolver | institution-authority.js |

|---|---|---|

| Portee | Visibilite large, heritee | Autorite d'action precise |

| Mecanisme | Recursion hierarchique automatique (TUTELLE) | Affectation directe + delegation explicite, datee |

| Usage | Modules generaux (SIRH, organigramme) | Chaine de commandement RNI |



Les deux coexistent sans conflit : le ScopeResolver determine "que puis-je

voir", institution-authority determine "puis-je agir precisement ici, en

mon nom ou par delegation". Reevaluer une fusion eventuelle si le besoin de

delegation s'etend au-dela du module RNI.



\## 6. Architecture cible



JWT

\-> RBAC (permission par role)

\-> ScopeResolver (perimetre institutionnel, calcule en JS)

\-> SET LOCAL app.current\_institution\_id (propagation du contexte)

\-> PostgreSQL RLS (defense en profondeur, filtre au niveau SQL)

\-> SQL





Le ScopeResolver reste la source de decision "qui peut faire quoi". RLS

devient un filet de securite supplementaire qui protege aussi les scripts

SQL directs, les outils d'administration, les futures API, et toute requete

oubliee dans du code futur qui n'appellerait pas exigerPortee.



Source unique de la hierarchie pour les deux couches : `institution\_relation`.



\## 7. Plan de migration (execution — session dediee, PAS en fin de session longue)



\*\*Phase 1 — Creation du role applicatif\*\*

```sql

CREATE ROLE pngie\_app LOGIN PASSWORD '...';

\-- explicitement SANS SUPERUSER, SANS BYPASSRLS, SANS CREATEDB, SANS CREATEROLE

```



\*\*Phase 2 — Attribution des privileges minimaux\*\*

GRANT CONNECT, USAGE sur le schema public, SELECT/INSERT/UPDATE/DELETE sur

les tables utilisees par le backend (liste a extraire de l'audit des 149

tables — filtrer aux tables reellement referencees dans routes-generated/ et

src/, cf section 3), EXECUTE sur les fonctions necessaires (fn\_\*, notamment

fn\_institutions\_descendantes une fois migree).

Ne pas accorder de privileges sur le schema `gouvernance` ni sur les tables

dormantes tant qu'elles ne sont pas reactivees consciemment.



\*\*Phase 3 — Environnement de test isole\*\*

Nouvelle DATABASE\_URL pointant vers pngie\_app, sans toucher a la config de

production existante.



\*\*Phase 4 — Tests E2E complets sous pngie\_app\*\*

Rejouer explicitement : Login, RBAC, ScopeResolver (poste\_hierarchie,

affectation, agent — les 3 modules deja valides cette session), Organigrammes,

Documents, Recherche. C'est ici que les privileges manquants apparaitront.



\*\*Phase 5 — Migration de fn\_institutions\_descendantes()\*\*

Reecrire pour lire institution\_relation (recursion sur TUTELLE) au lieu de

institution\_parent\_id, en s'inspirant directement de

src/security/hierarchy-service.js pour garantir l'identite de comportement

entre JS et SQL.



\*\*Phase 6 — Activation\*\*

Basculer le backend sur pngie\_app. Reserver `postgres` exclusivement aux

migrations, sauvegardes, taches DBA. A partir de ce moment, RLS est reellement

execute, en complement du ScopeResolver (defense en profondeur).



\## 8. Chantiers geles jusqu'a validation de ce plan



\- Journal National v1

\- Cockpit National

\- ERP Gouvernemental

\- CENI (peuplement organigramme)



Objectif : eviter qu'un futur developpement reprenne ces travaux avant que

le socle de securite soit stabilise et que les deux couches (ScopeResolver +

RLS) soient alignees sur la meme source de verite.



\## 9. Feuille de route apres validation RLS



1\. Journal National v1

2\. Cockpit National

3\. ERP Gouvernemental (RH, Budget, Compta, Tresorerie, Marches publics)

4\. GED Nationale

5\. Interoperabilite Nationale (DGI, DGDA, BCC, CENI, INRB, OCC, PNC, ANR, AN, Senat, Justice)

6\. Intelligence Decisionnelle (BI)

7\. Intelligence Artificielle Gouvernementale

8\. Plateforme Citoyenne



Voir egalement `docs/vision/PNGIE\_Roadmap\_v1.0.md` pour la vision d'ensemble.

