# COCKPIT GOUVERNEMENTAL — Spécification V1
Statut : **FIGÉE** — 09/08/2026. Toute évolution fonctionnelle après ce point est un nouveau
chantier de conception, pas un ajustement de cette spec.

---

## 0. Périmètre réel de la V1 (fondé sur l'état vérifié du code)

Le Cockpit V1 agrège uniquement ce qui existe et fonctionne aujourd'hui :

- **Journal National** (`acte_officiel` et dérivées) — complet, RLS actif, testé.
- **Décisions gouvernementales** (`decision_gouvernementale`, `decision_action`) — CRUD existant,
  RBAC et RLS à compléter par ce chantier (cf. §3 et §4).

**Explicitement hors périmètre V1** : RNSO, RNSJ, Finances, Marchés publics, Patrimoine, IA,
Notifications, Workflow — aucune route d'exposition exploitable aujourd'hui. `decision_institutionnelle`
est également hors périmètre (cf. §2, décision Q4).

---

## 1. Rôles (7, pas 6)

Les 6 rôles institutionnels existants, plus un nouveau rôle fonctionnel créé pour ce chantier :

| Rôle | Nature | Institution propre ? |
|---|---|---|
| Présidence (PR) | Institutionnel | Oui — racine |
| Primature (PM) | Institutionnel | Oui — enfant de Présidence |
| Ministères (MI) | Institutionnel | Oui — enfant de Primature |
| Gouvernorat de Province (GV) | Institutionnel | Oui — enfant de Primature |
| Assemblée Nationale (AN) | Institutionnel | Oui — rattachée à Présidence |
| Sénat (SN) | Institutionnel | Oui — rattachée à Présidence |
| **Analyste Cockpit** *(nouveau)* | Fonctionnel, transverse | **Non** — aucune institution propre |

---

## 2. Décisions métier figées

### Q1 — Visibilité Assemblée Nationale / Sénat
Vue **restreinte**. AN et SN peuvent consulter les décisions gouvernementales **publiées**, le
Journal National, les indicateurs publics et les statistiques utiles à leur mission de contrôle.
Ils ne peuvent ni créer, ni modifier, ni accéder aux informations internes des ministères — cette
séparation respecte la séparation des pouvoirs tout en garantissant la transparence.

### Q2 — Rôle Analyste Cockpit
Créé dès la V1. Rôle fonctionnel sans institution propre. Missions : consulter les tableaux de
bord, produire des rapports, réaliser des analyses, exporter des données autorisées, préparer des
synthèses. Ne peut ni signer, ni publier, ni créer de décision, ni modifier de donnée métier, ni
administrer le système.

### Q3 — Matrice RBAC et principe d'immuabilité
Aucun `DELETE` physique sur les entités métier du Cockpit. Toute entité est immuable après
création ; toute suppression logique passe par un changement d'état historisé (`ARCHIVEE`,
`ANNULEE`, etc.), cohérent avec le principe déjà appliqué au Journal National.

Matrice de permissions (READ/CREATE/UPDATE/PUBLISH/ARCHIVE) :

| Rôle | READ | CREATE | UPDATE | PUBLISH | ARCHIVE |
|---|---|---|---|---|---|
| PR | ✅ (national) | ✅ | ✅ | ✅ | ✅ |
| PM | ✅ (périmètre gouv.) | ✅ | ✅ | ❌ | ❌ |
| MI | ✅ (périmètre propre) | ✅ | ✅ | ❌ | ❌ |
| GV | ✅ (périmètre propre) | ✅ | ✅ | ❌ | ❌ |
| AN | ✅ (publiées uniquement) | ❌ | ❌ | ❌ | ❌ |
| SN | ✅ (publiées uniquement) | ❌ | ❌ | ❌ | ❌ |
| Analyste Cockpit | ✅ (national, lecture seule) | ❌ | ❌ | ❌ | ❌ |

`decision_action` : ni AN ni SN n'y ont accès (donnée de gestion interne à l'Exécutif, hors de
leur mission de contrôle direct). PR/PM/MI/GV : READ + UPDATE sur leur périmètre respectif.

### Q4 — decision_institutionnelle
**Hors périmètre du Cockpit V1**, définitivement pour cette version. Confirmé par le code :
`decision_institutionnelle.routes.js` est une route générique auto-générée par
`government-builder.js` (même moule que 48 autres entités administratives génériques), sans
clé étrangère ni référence croisée vers `decision_gouvernementale`. Ce sont deux concepts
indépendants, pas des doublons à fusionner. Détail complet :
`CLARIFICATION_decision_institutionnelle.md`.

---

## 3. Indicateurs V1

- Taux d'exécution moyen par décision (déjà implémenté : `/decisions/:id/tableau-bord`)
- Nombre de décisions actives / terminées / bloquées, par institution et au global
- Nombre d'actes officiels publiés sur une période (Journal National)
- Décisions en retard (`date_echeance` dépassée, statut non terminal)
- Répartition des décisions par institution émettrice

## 4. Vues V1

1. Décisions en cours (liste filtrée par portée du rôle)
2. Détail d'une décision (existant : `/decisions/:id`)
3. Tableau de bord d'une décision (existant : `/decisions/:id/tableau-bord`)
4. Synthèse nationale (PR/PM/Analyste Cockpit uniquement, nouveau développement)
5. Journal National récent (filtré par RLS existant)

## 5. Ce qui n'est PAS dans la V1

Graphiques complexes (courbes, cartes géographiques) — pas de recul statistique suffisant
aujourd'hui (1 décision en base). Indicateurs RH/Finances/Justice — modules sans API exploitable.
Notifications automatiques — moteur existant (`notification-engine.js`) mais non branché sur les
décisions, à évaluer en V2.

---

## Prochaine étape

Phase 2 — Architecture : mapper explicitement chaque vue du §4 sur le bon graphe institutionnel
(`institution_parent_id` pour la subordination stricte, `institution_relation` pour le périmètre
fonctionnel élargi), selon la règle documentée dans `ARCHITECTURE_V2.md` §4.8.
