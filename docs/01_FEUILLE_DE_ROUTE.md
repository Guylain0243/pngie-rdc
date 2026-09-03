# PNGIE-RDC — Feuille de route

Ce document donne une vue d'ensemble des grandes étapes du projet, du
développement logiciel jusqu'à l'exploitation nationale. Il est mis à
jour au fil de l'avancement ; il ne remplace pas le suivi détaillé des
sprints (voir `docs/PHASE_*.md` et l'historique Git pour le détail du
travail en cours).

## Les 10 étapes

| # | Étape | Périmètre | État |
|---|---|---|---|
| 1 | Développement du logiciel | Backend, base de données, API, RBAC, RLS, tests | 🟡 En cours |
| 2 | Stabilisation | 100 % des tests verts, schéma stabilisé, CI/CD | 🟡 En cours |
| 3 | Infrastructure de référence | Documentation d'architecture, exigences techniques | ⏳ À préparer |
| 4 | Déploiement pilote | Quelques institutions volontaires | ⏳ |
| 5 | Déploiement ministériel | Ministères | ⏳ |
| 6 | Déploiement provincial | Les provinces | ⏳ |
| 7 | Déploiement territorial | Divisions, districts, territoires | ⏳ |
| 8 | Formation des utilisateurs | Équipes locales et nationales | ⏳ |
| 9 | Mise en service nationale | Généralisation | ⏳ |
| 10 | Exploitation permanente | Support, évolutions, nouveaux modules | ⏳ |

## État détaillé — Étape 1 (Développement)

Le développement suit une logique de sprints, documentée
individuellement dans `docs/`. État au dernier point de synchronisation :

- **Sprint 1** — Suite de tests e2e : 106/106 tests verts. ✅
- **Sprint 2A** — Isolation SQLite / DATABASE_URL. ✅
- **Sprint 2B** — Alignement du schéma SQLite sur PostgreSQL.
  - Phase 0-4A : diagnostic et corrections de trajectoire successives. ✅
  - Phase 5 : périmètre stabilisé à 33 tables prioritaires, classées en
    5 motifs structurels. Décision : automatisation justifiée pour
    31/33 tables (94 %). ✅
- **Sprint 2C** — Générateur SQLite paramétrable. ⏳ À démarrer
  (voir plan détaillé en fin de session la plus récente).
- **Sprint 2D** — `npm test` entièrement vert en SQLite. ⏳
- **Sprints 3 à 6** — Nettoyage architecture, qualité/CI, documentation,
  performance. ⏳
- **Sprints 7-8** — Sécurité applicative, release logicielle. ⏳

## Séquencement général

Le travail suit un ordre volontairement strict : chaque étape s'appuie
sur la précédente, sans anticiper prématurément sur les suivantes.

```
1. Terminer le logiciel
   (Sprint 2C, 2D, stabilisation, qualité)
        |
        v
2. Préparer l'architecture de référence
   (documentation, exigences, sécurité, réseau, haute disponibilité)
        |
        v
3. Préparer le programme de déploiement
   (pilote, formation, exploitation, gouvernance)
        |
        v
4. Mise en service opérationnelle
   (déploiement progressif, accompagnement, exploitation continue)
```

Les étapes 3 (infrastructure de référence, niveau documentation
d'exigences) et suivantes ne seront détaillées qu'une fois le logiciel
stabilisé (fin de l'étape 1-2). Documenter une infrastructure nationale
avant que le schéma de données et l'architecture applicative soient
stables produirait une documentation qui devrait être réécrite à chaque
évolution des fondations.

## Note sur le périmètre

Les étapes 3 à 10 concernent un déploiement d'ampleur nationale
(infrastructure réseau gouvernementale, VPN, haute disponibilité,
formation, gouvernance institutionnelle). Ce sont des décisions et des
travaux qui dépassent le développement logiciel et impliquent des choix
de gouvernance, de budget et d'organisation qui ne relèvent pas d'une
seule équipe de développement. Ce document sert de boussole d'ensemble ;
il ne préjuge pas des décisions institutionnelles à venir.
