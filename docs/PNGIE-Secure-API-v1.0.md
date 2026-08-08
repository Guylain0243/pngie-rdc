# PNGIE Secure API v1.0

**Standard interne d'architecture backend — PNGIE-RDC**
Statut : figé le 01/08/2026, validé par implémentation testée (module RNI)

---

## 1. Objectif

Standard unique et obligatoire pour tout routeur backend du PNGIE-RDC exposant une API métier. Il remplace le modèle CRUD simplifié utilisé par les modules antérieurs à ce standard.

Ce document n'est pas une proposition d'architecture : il documente une implémentation qui a été écrite, exécutée, et vérifiée par des tests automatisés contre une base de données réelle (module RNI, Blocs A à G, 01/08/2026). Toute divergence entre ce document et le code doit être corrigée dans le code, ou le document doit être mis à jour et reversionné — jamais laissée en silence.

---

## 2. Chaîne obligatoire

Chaque route métier doit exécuter, dans cet ordre exact, sans exception :

```
Client
  │
  ▼
requireAuth              (middleware/requireAuth.js)
  │
  ▼
validate(schema)          (middleware/validation.js)
  │
  ▼
permission RBAC            (security-engine.js : verifierPermission / exigerPermission)
  │
  ▼
autorité institutionnelle  (services/institution-authority.js : estAutoriseSurInstitution)
  │
  ▼
transaction (BEGIN)        (db.js)
  │
  ▼
SQL métier
  │
  ▼
audit()                    (lib/audit.js)
  │
  ▼
transaction (COMMIT)
  │
  ▼
réponse JSON normalisée    (lib/errors.js : sendError / enveloppe success)
```

Aucune étape ne peut être sautée. Aucune route ne peut réimplémenter une de ces étapes localement — voir §7.

---

## 3. Composants transversaux (implémentation unique)

| Responsabilité | Fichier | Export |
|---|---|---|
| Authentification | `src/middleware/requireAuth.js` | `requireAuth(req, res, next)` |
| Validation d'entrée | `src/middleware/validation.js` | `validate(schema)`, `validatePagination(options)`, `sendError`, `UUID_REGEX`, `DATE_REGEX` |
| RBAC | `src/security-engine.js` | `verifierPermission(roleCode, entity, action)`, `exigerPermission(entity, action)` |
| Autorité institutionnelle | `src/services/institution-authority.js` | `estAutoriseSurInstitution(personId, institutionId, entity, action)`, `getInstitutionsAutorisees(personId, entity, action)` |
| Erreurs / réponses | `src/lib/errors.js` | `sendError`, `globalErrorHandler`, `ERROR_CODES`, `DEFAULT_HTTP_STATUS` |
| Audit chaîné | `src/lib/audit.js` | `audit(personId, action, entite, entiteId, detail)` |
| Accès base de données | `src/db.js` | `get(sql, params)`, `all(sql, params)`, `run(sql, params)`, `close()` — double moteur SQLite (dev) / PostgreSQL (prod), transaction courte par appel, propage `app.current_institution_id` pour le RLS |
| Contexte de requête | `src/request-context.js` | `run(context, callback)`, `getContext()` — AsyncLocalStorage |

**Principe non négociable :** une responsabilité transversale a une seule implémentation, référencée par `require()` partout où elle est utilisée. Aucune copie locale dans un routeur, quelle qu'en soit la raison (rapidité, isolement, historique).

> Note de gouvernance : cette règle a été violée deux fois avant d'être corrigée le 01/08/2026 — `requireAuth` existait en double (server.js + routeur RNI) avec des formats de réponse divergents, et `institution-authority.js` contenait par erreur une copie de `validation.js`. Les deux ont été détectés par audit d'intégrité (checksum + `node --check` + recherche de symboles exportés), pas par relecture. Voir §9.

---

## 4. Contrat des réponses API

### Succès
```json
{
  "success": true,
  "data": { }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_INSTITUTION",
    "message": "Vous n'êtes pas autorisé à représenter cette institution.",
    "details": []
  }
}
```
`details` est optionnel, présent uniquement pour `VALIDATION_ERROR` (liste des champs en violation).

### Codes d'erreur réservés

| Code | HTTP | Usage |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Entrée invalide (UUID, enum, champ manquant, type incorrect) |
| `AUTHENTICATION_REQUIRED` | 401 | Token absent, invalide ou expiré |
| `FORBIDDEN` | 403 | Authentifié, mais permission RBAC refusée |
| `FORBIDDEN_INSTITUTION` | 403 | Authentifié, permission RBAC accordée, mais institution non autorisée |
| `NOT_FOUND` | 404 | Ressource inexistante |
| `CONFLICT` | 409 | Conflit métier (statut incompatible, transition refusée...) |
| `INTERNAL_ERROR` | 500 | Incident serveur — jamais de détail SQL/stack trace exposé au client |

Aucun autre format de réponse d'erreur n'est autorisé (pas de `{"error": "..."}` brut).

---

## 5. Principes de sécurité

### 5.1 Deny by default
Une action n'est autorisée que si une ligne explicite dans `permission` l'accorde pour le rôle appelant. L'absence de ligne équivaut à un refus, jamais à une autorisation implicite. Une matrice de permissions incomplète n'est pas un bug : c'est un refus volontaire tant qu'elle n'a pas été explicitement étendue.

### 5.2 Le client ne prouve jamais son autorité
Aucun `institution_id` (ou équivalent : `emetteur_institution_id`, `verificateur_institution_id`, etc.) envoyé dans une requête n'est une preuve d'autorité, quelle que soit sa provenance apparente. Le serveur vérifie systématiquement, via `estAutoriseSurInstitution()`, que la personne authentifiée représente réellement l'institution invoquée — par affectation active directe, ou par délégation normalisée (`delegation_perimetre`, jamais le champ texte libre `delegation_pouvoir.perimetre`).

### 5.3 Le rôle vient du token vérifié, jamais d'un en-tête client
Le rôle utilisé pour la vérification RBAC est extrait du JWT vérifié côté serveur (`req.user.roles[0]`), jamais d'un en-tête HTTP fourni par le client sans validation.

### 5.4 Aucune suppression physique
Toute désactivation logique (ex. `statut = 'INACTIF'`, `date_fin = ...`). Jamais de `DELETE` sur une donnée métier.

---

## 6. Audit

Chaque route enregistre, via `audit(personId, action, entite, entiteId, detail)`, une ligne dans `audit_log` chaînée par hash SHA-256 (`hash_prec` = `hash_actuel` de la ligne précédente). Taxonomie minimale obligatoire :

| Action | Déclenchée quand |
|---|---|
| `AUTHENTICATION_FAILED` | Token absent ou invalide |
| `PERMISSION_DENIED` | RBAC refuse l'action |
| `<ENTITE>_DENIED` (ex. `RNI_LINK_DENIED`) | Variante spécifique à une entité sensible, si définie |
| `INSTITUTION_MISMATCH` | Autorité institutionnelle refusée |
| `DELEGATION_USED` | Une autorisation a été accordée via délégation plutôt qu'affectation directe |
| `ACTION_SUCCESS` | Écriture réussie |

`VALIDATION_ERROR` n'est délibérément pas audité (choix acté : `validate()` reste découplé de l'audit).

---

## 7. Transactions

Chaque appel à `db.run()` / `db.get()` / `db.all()` s'exécute dans sa propre transaction courte (`BEGIN` / requête / `COMMIT`, `ROLLBACK` en cas d'erreur), gérée par `db.js`. **Limitation connue et acceptée à ce jour :** les écritures multi-étapes au sein d'une même route (ex. `instruction` + `instruction_historique`) ne sont pas atomiques entre elles. Un module qui nécessite une atomicité stricte multi-tables doit explicitement le signaler ; une solution transversale (transaction explicite portée par la route) reste à concevoir avant que cette limitation ne devienne bloquante pour un domaine métier critique.

---

## 8. Convention pour un nouveau routeur

```js
const express = require('express');
const crypto = require('crypto');

const db = require('../db');
const { validate } = require('../middleware/validation');
const { sendError } = require('../lib/errors');
const { verifierPermission } = require('../security-engine');
const { estAutoriseSurInstitution } = require('../services/institution-authority');
const audit = require('../lib/audit');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Une route = validate() + permission + (si écriture sur une institution) autorité + audit
router.post('/exemple',
  validate({ body: { institution_id: { type: 'uuid', required: true } } }),
  wrap(async (req, res) => {
    const roleCode = req.user.roles[0];
    const autorise = await verifierPermission(roleCode, 'mon_entite', 'CREATE');
    if (!autorise) {
      await audit(req.user.sub, 'PERMISSION_DENIED', 'mon_entite', null, { roleCode });
      return sendError(res, 'FORBIDDEN', `Le rôle "${roleCode}" ne peut pas faire "CREATE" sur "mon_entite".`);
    }

    const ok = await estAutoriseSurInstitution(req.user.sub, req.body.institution_id, 'mon_entite', 'CREATE');
    if (!ok) {
      await audit(req.user.sub, 'INSTITUTION_MISMATCH', 'mon_entite', req.body.institution_id, {});
      return sendError(res, 'FORBIDDEN_INSTITUTION', "Vous n'êtes pas autorisé à représenter cette institution.");
    }

    const id = crypto.randomUUID();
    await db.run(`INSERT INTO ma_table (id, institution_id) VALUES (?,?)`, [id, req.body.institution_id]);

    await audit(req.user.sub, 'ACTION_SUCCESS', 'mon_entite', id, {});
    res.status(201).json({ success: true, data: { id } });
  })
);

module.exports = router;
```

Montage dans `server.js` : `app.use('/api', monRouter);` — le middleware `requireAuth` centralisé est appliqué en interne par `router.use(requireAuth)`, pas au montage.

---

## 9. Contrôle de conformité avant toute livraison

Avant qu'un module soit considéré "terminé", vérifier — sur le disque, pas de mémoire :

1. `node --check <fichier>` passe sans erreur.
2. Le fichier importe bien les 7 composants du §3 par `require()`, sans réimplémentation locale.
3. `grep`/`Select-String` du fichier confirme la présence des symboles attendus (`estAutoriseSurInstitution`, `audit(`, `sendError`, `validate(`) au nombre attendu.
4. Une requête sur `audit_log` après une exécution réelle montre les actions attendues (pas seulement un démarrage sans erreur — un serveur qui démarre ne prouve pas qu'une route fonctionne).
5. Une batterie de tests négatifs (401 sans token, 403 permission, 403 institution usurpée, 400 validation, 404 ressource absente) est exécutée contre le serveur réel, pas simulée.
6. Vérification qu'aucun refus n'a modifié de données (comptage avant/après).

Un composant "annoncé conforme" sans ces vérifications n'est pas conforme — voir l'incident du 01/08/2026 (§3, note de gouvernance) où deux composants documentés comme terminés ne l'étaient pas sur le disque.

---

## 10. Stratégie de migration des modules existants

Les ~30 modules métier actuels utilisent un modèle antérieur (authentification centralisée dans `server.js`, mais sans RBAC institutionnel structuré ni audit chaîné systématique par entité). Migration recommandée :

- Par lots, un domaine métier à la fois.
- Chaque lot suit intégralement §2 à §9 avant d'être considéré migré.
- Non-régression vérifiée par test réel (comme §9.5), pas seulement par relecture.
- Le module RNI (ce document) sert de référence concrète pour chaque migration suivante.

---

## Changelog

**v1.0 — 01/08/2026**
Version initiale, figée après validation complète du module RNI (Blocs A à G) : matrice de permissions, validation, autorité institutionnelle, erreurs normalisées, audit chaîné, réécriture du routeur RNI, authentification centralisée (`requireAuth` unifié entre `server.js` et les routeurs), 11/11 tests négatifs et positifs passés contre le serveur réel.
