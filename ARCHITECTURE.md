# Architecture Technique — Système de Gestion Scolaire

## Vue d'ensemble

Plateforme SaaS multi-tenant avec isolation complète des données par schéma PostgreSQL.
Chaque école possède son propre schéma de base de données.
Les professeurs et parents existent au niveau global (schéma public).

```
INTERNET
    │
NGINX (proxy)
    │
    ├── React PWA (port 5173)
    └── NestJS API (port 3000)
              │
         PostgreSQL 16
              │
    ├── schema: public      ← données globales
    ├── schema: ecole_xxx   ← données école A
    └── schema: ecole_yyy   ← données école B
```

---

## Isolation des données (Multi-Tenant)

**Schéma `public`** — partagé par tout le système :
- `utilisateurs` — tous les acteurs (admins, profs, parents, superadmin)
- `ecoles` — les établissements inscrits
- `professeurs` — profil global, indépendant de toute école
- `parents` — profil global
- `affectations_globales` — pont prof ↔ école
- `abonnements` — plans SaaS
- `historique_migrations` — suivi des migrations par école

**Schéma `ecole_xxx`** — créé automatiquement à l'inscription :
- `classes`, `eleves`, `matieres`, `affectations`
- `periodes_evaluation`, `notes`, `bulletins` (IT.2)
- `types_frais`, `paiements` (IT.3)
- `communications`, `absences` (IT.4)

---

## Identification du Tenant

**Avant connexion** : slug dans l'URL
```
/connexion/saint-pierre → identifie l'école via le slug
```

**Après connexion** : `schema_courant` dans le JWT
```json
{
  "utilisateur_id": "uuid",
  "role": "PROFESSEUR",
  "ecole_courant_id": "uuid",
  "schema_courant": "ecole_saint_pierre"
}
```

Le middleware lit `schema_courant` du token et configure `search_path`
PostgreSQL sur le bon schéma avant chaque requête.

---

## Authentification

Double token :
- **Access token** : 15 minutes, contient schema_courant
- **Refresh token** : 30 jours, stocké en base, révocable

Flow professeur multi-écoles :
1. Connexion → système détecte plusieurs écoles
2. Retourne la liste des écoles au frontend
3. Professeur choisit → nouveau token avec schema_courant de l'école choisie
4. Switch d'école → endpoint `/auth/changer-ecole` → nouveau access token

---

## Migrations Multi-Tenant

Deux types de migrations :
- **Globales** : `prisma/migrations/globales/` → schéma public uniquement
- **Tenants** : `prisma/migrations/tenants/` → appliquées sur TOUS les schémas écoles

Règles :
1. Chaque migration est numérotée `001_`, `002_`...
2. Toute application est tracée dans `public.historique_migrations`
3. On ne migre jamais deux fois la même migration sur le même schéma
4. Une nouvelle école reçoit toutes les migrations existantes
5. On ne modifie jamais une migration déjà appliquée

---

## PWA et Mode Offline

Stratégie `NetworkFirst` via Service Workers :
1. Tentative réseau (timeout 10 secondes)
2. Si échec → fallback sur le cache local
3. Données non synchronisées stockées dans IndexedDB
4. Synchronisation automatique au retour de la connexion

---

## Structure du Backend (NestJS)

```
src/
├── main.ts                  → point d'entrée
├── app.module.ts            → module racine + middleware
├── commun/
│   └── prisma/              → service Prisma global
├── auth/                    → JWT, connexion, tokens
├── tenant/                  → middleware d'isolation
├── ecoles/                  → inscription, création schéma
├── professeurs/             → profil global des profs
├── eleves/                  → gestion élèves (sur schéma tenant)
├── classes/                 → gestion classes (sur schéma tenant)
└── matieres/                → gestion matières (sur schéma tenant)
```

---

## Rôles et Accès

| Rôle | Portée | Peut faire |
|------|--------|------------|
| SUPER_ADMIN | Global | Rapports, supervision toutes écoles |
| ADMIN_ECOLE | Son école | Gérer élèves, classes, affecter profs |
| PROFESSEUR | Ses classes | Saisir notes, voir ses affectations |
| PARENT | Ses enfants | Consulter notes, paiements, communications |
