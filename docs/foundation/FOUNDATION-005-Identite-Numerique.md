# FOUNDATION-005 — Identité Numérique Nationale

**Statut :** Proposé — en attente de validation
**Date :** 2026-09-05
**Type :** Document fondateur (stable)
**Dépend de :** FOUNDATION-002 (Métamodèle National, §5 modèle d'identification à 3 niveaux), FOUNDATION-003 (RNI), FOUNDATION-004 (RNSO)
**Portée :** Ce document couvre deux sujets distincts mais liés : (A) l'identification de toute entité du PNGIE, généralisant le modèle à 3 niveaux déjà posé dans FOUNDATION-002 ; (B) l'identité numérique des agents publics — authentification, MFA, PKI, signature électronique, gestion de session.

---

## Partie A — Identification universelle des entités

### 1. Rappel du modèle à 3 niveaux (FOUNDATION-002 §5)

| Niveau | Rôle |
|---|---|
| UUID technique | Clé primaire, intégrité relationnelle |
| Code métier | Lisible, stable, utilisable dans les règles fonctionnelles |
| Identifiant canonique (URN) | Référence pérenne inter-systèmes |

Ce document généralise ce modèle à **toutes** les entités du métamodèle, pas seulement l'Institution (déjà couverte par FOUNDATION-003 §5).

### 2. Convention d'URN par entité

| Entité | Référentiel | Convention URN proposée | Exemple |
|---|---|---|---|
| Institution | RNI | `urn:rdc:rni:<code>` | `urn:rdc:rni:presidence` |
| Organisation | RNSO | `urn:rdc:rnso:<institution>:<code>` | `urn:rdc:rnso:min-sante:cabinet` |
| Structure organisationnelle | RNSO | `urn:rdc:rnso:<institution>:<organisation>:<code>` | `urn:rdc:rnso:min-sante:cabinet:drh` |
| Poste | RNPST | `urn:rdc:rnpst:<code-structure>:<code-poste>` | `urn:rdc:rnpst:drh:directeur` |
| Personne | RNP | `urn:rdc:rnp:<identifiant-national>` | `urn:rdc:rnp:<n° identité nationale>` |
| Document | RND | `urn:rdc:rnd:<type>:<numero>` | `urn:rdc:rnd:decret:2026-045` |
| Affectation | RNA | technique uniquement (voir §3) | — |
| Événement | RNAUD | technique uniquement (voir §3) | — |

**Note sur les URN imbriqués (Organisation, Structure, Poste) :** l'URN inclut le chemin hiérarchique complet plutôt qu'un identifiant plat, pour rester lisible et éviter les collisions de codes entre institutions différentes (ex. deux ministères peuvent chacun avoir un « Cabinet » — leurs URN restent distincts).

### 3. Entités sans identifiant métier naturel

Certaines entités (Affectation, Événement) n'ont pas de code métier stable par nature — leur identité repose sur un triplet ou un contexte (cf. FOUNDATION-002 fiches 4.5 et 4.9). Pour ces entités, seul le niveau UUID technique s'applique ; aucun URN n'est requis, car rien ne justifie une référence externe stable à un événement ou une affectation individuelle en dehors du système lui-même.

### 4. Règle de conservation (rappel, déjà actée FOUNDATION-002 §5)

L'UUID technique est conservé à l'identique lors de toute migration technique (changement de table, de moteur de base de données). Cette règle s'applique à toutes les entités listées ci-dessus, sans exception.

---

## Partie B — Identité numérique des agents

### 5. Objet

Cette partie ne concerne que les Personnes physiques (RNP, FOUNDATION-002 fiche 4.6) dans leur rôle d'agents publics utilisateurs du système — pas l'identification générale de l'entité Personne elle-même (couverte en Partie A et détaillée dans le futur FOUNDATION-006, RNP).

### 6. Compte

Un **Compte** est l'entité technique permettant à une Personne de s'authentifier auprès du système. Une Personne peut, en principe, ne pas avoir de Compte (toutes les Personnes du RNP ne sont pas nécessairement des utilisateurs actifs du système) ; à l'inverse, un Compte référence toujours exactement une Personne.

```
Personne (RNP)
      │
      │ 0..1 (une personne peut ne pas avoir de compte)
      ▼
   Compte
```

### 7. Authentification

Mécanisme vérifiant l'identité d'un Compte au moment de la connexion. Le système actuel implémente une authentification par identifiant/mot de passe avec émission d'un jeton JWT (voir le code existant, `POST /api/auth/login`).

**Limite actuelle à documenter comme dette d'architecture :** l'authentification actuelle ne couvre pas les mécanismes suivants (MFA, PKI, signature), qui restent à spécifier avant toute mise en production à l'échelle nationale.

### 8. MFA (authentification multi-facteurs)

Renforcement de l'authentification par un second facteur (code temporaire, application dédiée, biométrie). **Non implémenté à ce jour** — à spécifier avant toute extension du système à des rôles à privilèges élevés (ex. validation de décrets, accès aux données sensibles).

### 9. PKI (infrastructure à clés publiques)

Infrastructure permettant à chaque agent de disposer d'une paire de clés cryptographiques (publique/privée), support de la signature électronique (§10) et, potentiellement, d'une authentification forte par certificat. **Non implémenté à ce jour.**

### 10. Signature électronique

Mécanisme permettant à un agent d'apposer une signature juridiquement valable sur un Document (RND, FOUNDATION-002 fiche 4.7). Dépend de la PKI (§9). **Non implémenté à ce jour** — nécessaire avant toute dématérialisation complète des actes officiels (décrets, arrêtés).

### 11. Session

Une **Session** représente une période d'activité authentifiée d'un Compte. Le système actuel gère les sessions via jeton JWT à expiration (durée à documenter précisément dans une future révision technique). Aucune gestion de session multi-appareils ni de révocation centralisée n'est actuellement spécifiée — point à traiter avant mise à l'échelle.

---

## 12. Articulation avec les Foundations existantes et à venir

```
FOUNDATION-002 (Métamodèle)
      │
      ├── pose le modèle d'identification à 3 niveaux (§5)
      │
FOUNDATION-005 (ce document)
      │
      ├── Partie A : généralise l'identification à toutes les entités
      ├── Partie B : spécifie l'identité numérique des agents (Comptes)
      │
      ▼
FOUNDATION-006 (RNP, à venir)
      │
      └── détaille la distinction Personne → Agent public → Utilisateur → Compte
             déjà esquissée ici (§6) mais à approfondir spécifiquement
```

---

## 13. Actions ouvertes avant validation finale

- [ ] Valider les conventions d'URN par entité (§2) avec un premier cas d'usage réel (ex. génération effective de l'URN de la Présidence)
- [ ] Décider du calendrier d'implémentation de MFA/PKI/Signature (§8-10) — actuellement non spécifiés dans le temps, seulement identifiés comme dettes
- [ ] Documenter précisément la durée de vie actuelle des jetons JWT et le mécanisme de renouvellement (§11), à partir du code existant
- [ ] Trancher si un Compte peut référencer plusieurs Personnes (cas de comptes de service) ou si cette règle reste strictement 1:1

---

## 14. Ce que ce document ne couvre pas

- La distinction Personne / Agent public / Utilisateur / Compte en détail → **FOUNDATION-006 (RNP)**
- Les rôles, permissions et portées associées à un Compte → **FOUNDATION-008 (RBAC National, à venir)**
- Les règles de row-level security liées à l'identité → **FOUNDATION-009 (RLS Nationale, à venir)**

---

## 15. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — actions ouvertes du §13 à lever |
| Validation technique | *(à compléter)* | | En attente |
