# Journal des Décisions Techniques

---

## DÉCISION 001 — Isolation par schéma PostgreSQL

**CONTEXTE** : Besoin d'héberger plusieurs écoles sur un système unique
avec garantie que leurs données ne se mélangent jamais.

**CHOIX** : Un schéma PostgreSQL distinct par école.

**RAISON** : PostgreSQL supporte nativement les schémas multiples.
Meilleur compromis entre isolation forte et coût d'hébergement.
Une base de données séparée par école serait trop coûteuse à l'échelle.
Un simple filtre `ecole_id` serait trop risqué (une requête mal écrite
pourrait exposer les données d'une autre école).

**IMPACT** : Toutes les migrations tenants doivent s'appliquer sur chaque
schéma. Un middleware gère le switch de schéma via `search_path` PostgreSQL.

---

## DÉCISION 002 — Identification du tenant par JWT

**CONTEXTE** : Besoin d'identifier l'école active à chaque requête API.

**CHOIX** : `schema_courant` intégré directement dans le JWT.
Slug dans l'URL uniquement pour la page de connexion.

**RAISON** : Les sous-domaines posent des problèmes avec les PWA offline
(le Service Worker est lié à une origine précise) et la configuration DNS
en Haïti est complexe et coûteuse. Le JWT est déjà présent dans chaque
requête — pas besoin d'un header supplémentaire.

**IMPACT** : Le middleware lit `schema_courant` du token avant chaque
requête et configure `search_path` PostgreSQL en conséquence.

---

## DÉCISION 003 — PWA au lieu d'application mobile native

**CONTEXTE** : Besoin d'une expérience mobile et de fonctionnement offline
adapté au contexte haïtien (connexion instable, accès principalement via smartphone).

**CHOIX** : Progressive Web App avec React + Vite + vite-plugin-pwa.

**RAISON** : Évite de maintenir deux codebases (Android + Web).
Pas besoin du Play Store pour l'installation. Les Service Workers
couvrent le besoin offline avec la stratégie NetworkFirst.
Bundle plus léger = meilleure expérience sur connexion lente.

**IMPACT** : Configuration Service Worker requise dans vite.config.ts.
IndexedDB pour le stockage local des données offline.

---

## DÉCISION 004 — Professeur au niveau global du système

**CONTEXTE** : Un professeur peut enseigner dans plusieurs écoles différentes.

**CHOIX** : Table `professeurs` dans le schéma `public`, pas dans
le schéma de chaque école. Table `affectations_globales` fait le pont.

**RAISON** : Si le professeur était dans le schéma d'une école,
il ne pourrait pas exister dans une autre sans duplication des données
et problèmes de synchronisation. Le niveau global résout proprement
le cas multi-écoles.

**IMPACT** : Quand un professeur se connecte avec plusieurs écoles,
le frontend doit présenter un choix. L'endpoint `/auth/changer-ecole`
permet de switcher sans se reconnecter.

---

## DÉCISION 005 — Double token (Access + Refresh)

**CONTEXTE** : Besoin d'authentification sécurisée avec reconnexion
automatique transparente pour l'utilisateur.

**CHOIX** : Access token (15 min) + Refresh token (30 jours, en base).

**RAISON** : Si l'access token est volé, il expire en 15 minutes maximum.
Le refresh token est révocable côté serveur (déconnexion forcée possible,
ex: si un appareil est perdu). Le double token est le standard de l'industrie
pour ce type de système.

**IMPACT** : Le frontend gère automatiquement le rafraîchissement via
l'intercepteur Axios quand il reçoit une réponse 401.

---

## DÉCISION 006 — NestJS pour le backend

**CONTEXTE** : Choix du framework backend TypeScript.

**CHOIX** : NestJS 10.

**RAISON** : Force une architecture modulaire dès le départ, essentielle
pour un projet qui grandit sur 5 itérations. Gère nativement les guards
(permissions), middlewares (isolation tenant), et pipes (validation).
Meilleure maintenabilité qu'un Express nu. Cohérence TypeScript total
avec le frontend React.

**IMPACT** : Structure modulaire stricte : un dossier par domaine fonctionnel.
Chaque module est indépendant et peut évoluer sans impacter les autres.
