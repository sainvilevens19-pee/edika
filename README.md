# Système de Gestion Scolaire — Haïti 🇭🇹

Plateforme SaaS multi-tenant pour la gestion des établissements scolaires haïtiens.
Une seule plateforme, plusieurs écoles, données complètement isolées.

---

## Prérequis

- [Docker](https://www.docker.com/) et Docker Compose installés
- [Git](https://git-scm.com/) installé
- Node.js 20 (optionnel — pour travailler sans Docker)

---

## Démarrage en 5 minutes

```bash
# 1. Cloner le projet
git clone https://github.com/xxx/systeme-scolaire.git
cd systeme-scolaire

# 2. Configurer l'environnement
cp .env.exemple .env
# Ouvrir .env et remplir MOT_DE_PASSE_POSTGRES et SECRET_JWT

# 3. Démarrer tout l'environnement
docker-compose up

# 4. (Premier démarrage uniquement) Initialiser la base de données
docker-compose exec backend npm run migrer:global
docker-compose exec backend npm run initialiser:superadmin

# 5. Accéder à l'application
# Frontend  → http://localhost:5173
# API       → http://localhost:3000/api/v1
```

---

## Commandes du quotidien

```bash
# Démarrer l'environnement
docker-compose up

# Démarrer en arrière-plan
docker-compose up -d

# Voir les logs du backend
docker-compose logs -f backend

# Voir les logs du frontend
docker-compose logs -f frontend

# Arrêter tout
docker-compose down

# Reset complet (supprime les données)
docker-compose down -v

# Appliquer les migrations sur tous les tenants
docker-compose exec backend npm run migrer:tenants

# Voir l'état des migrations
docker-compose exec backend npm run migrer:statut

# Ouvrir un terminal dans le backend
docker-compose exec backend sh
```

---

## Structure du projet

```
systeme-scolaire/
├── backend/              → API NestJS + TypeScript
│   ├── src/
│   │   ├── auth/         → Authentification JWT
│   │   ├── tenant/       → Middleware isolation des données
│   │   ├── ecoles/       → Inscription et gestion des écoles
│   │   ├── eleves/       → Gestion des élèves
│   │   ├── classes/      → Gestion des classes
│   │   ├── matieres/     → Gestion des matières
│   │   └── professeurs/  → Gestion des professeurs
│   └── prisma/
│       ├── schema.prisma → Schéma public (global)
│       └── migrations/
│           ├── globales/ → Migrations schéma public
│           └── tenants/  → Migrations pour chaque école
│
├── frontend/             → Interface React PWA
│   └── src/
│       ├── pages/        → Toutes les pages
│       ├── composants/   → Composants réutilisables
│       ├── hooks/        → Hooks personnalisés
│       └── services/     → Appels API
│
├── docs/                 → Documentation technique
├── docker-compose.yml    → Environnement de développement
└── .env.exemple          → Template des variables
```

---

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le détail complet.

---

## Contribuer

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les règles de travail.

---

## Itérations

| Statut | Itération | Description |
|--------|-----------|-------------|
| ✅ | IT.1 — Noyau | École, classes, élèves, professeurs, matières |
| ⏳ | IT.2 — Notes | Périodes, notes, bulletins, moyennes |
| ⏳ | IT.3 — Paiements | Frais, mensualités, reçus, MonCash |
| ⏳ | IT.4 — Communication | Messages, circulaires, absences |
| ⏳ | IT.5 — Statistiques | Tableaux de bord, rapports |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | NestJS 10 + TypeScript 5 |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| Frontend | React 18 + Vite 5 |
| Style | Tailwind CSS 3 |
| Mobile/Offline | PWA + Service Workers |
| Paiement | MonCash API |
| Hébergement | VPS DigitalOcean |
