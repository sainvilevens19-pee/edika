-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 0 — Sécurité Critique & RBAC
-- Migration manuelle (à appliquer via: npx prisma migrate deploy)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nouveaux rôles dans l'énumération
ALTER TYPE "public"."RoleUtilisateur" ADD VALUE IF NOT EXISTS 'SECRETAIRE';
ALTER TYPE "public"."RoleUtilisateur" ADD VALUE IF NOT EXISTS 'ELEVE';

-- 2. Fix B1 — Lien admin_utilisateur_id sur Ecole
ALTER TABLE "public"."ecoles"
  ADD COLUMN IF NOT EXISTS "admin_utilisateur_id" TEXT UNIQUE;

ALTER TABLE "public"."ecoles"
  ADD CONSTRAINT "ecoles_admin_utilisateur_id_fkey"
  FOREIGN KEY ("admin_utilisateur_id")
  REFERENCES "public"."utilisateurs"("id")
  ON DELETE SET NULL
  NOT VALID;

ALTER TABLE "public"."ecoles"
  VALIDATE CONSTRAINT "ecoles_admin_utilisateur_id_fkey";

-- 3. Fix B2 — Contexte école dans les tokens de rafraîchissement
ALTER TABLE "public"."tokens_rafraichissement"
  ADD COLUMN IF NOT EXISTS "ecole_id" TEXT,
  ADD COLUMN IF NOT EXISTS "schema_nom" TEXT;

-- 4. Table d'audit — journal_actions
CREATE TABLE IF NOT EXISTS "public"."journal_actions" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "utilisateur_id" TEXT,
  "role"           TEXT,
  "action"         TEXT        NOT NULL,
  "entite"         TEXT,
  "entite_id"      TEXT,
  "details"        JSONB,
  "ip_adresse"     TEXT,
  "user_agent"     TEXT,
  "cree_le"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "journal_actions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."journal_actions"
  ADD CONSTRAINT "journal_actions_utilisateur_id_fkey"
  FOREIGN KEY ("utilisateur_id")
  REFERENCES "public"."utilisateurs"("id")
  ON DELETE SET NULL
  NOT VALID;

CREATE INDEX IF NOT EXISTS "journal_actions_utilisateur_id_idx"
  ON "public"."journal_actions"("utilisateur_id");

CREATE INDEX IF NOT EXISTS "journal_actions_action_cree_le_idx"
  ON "public"."journal_actions"("action", "cree_le" DESC);

-- 5. Table de liaisons parent-enfant (cross-tenant)
CREATE TABLE IF NOT EXISTS "public"."liaisons_parent_enfant" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "parent_id"    TEXT        NOT NULL,
  "ecole_id"     TEXT        NOT NULL,
  "schema_nom"   TEXT        NOT NULL,
  "eleve_id"     TEXT        NOT NULL,
  "code_dossier" TEXT        NOT NULL,
  "valide"       BOOLEAN     NOT NULL DEFAULT FALSE,
  "valide_le"    TIMESTAMP(3),
  "cree_le"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "liaisons_parent_enfant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "liaisons_parent_enfant_code_dossier_key" UNIQUE ("code_dossier"),
  CONSTRAINT "liaisons_parent_enfant_unique_lien"
    UNIQUE ("parent_id", "ecole_id", "eleve_id")
);

ALTER TABLE "public"."liaisons_parent_enfant"
  ADD CONSTRAINT "liaisons_parent_enfant_parent_id_fkey"
  FOREIGN KEY ("parent_id")
  REFERENCES "public"."parents"("id")
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "public"."liaisons_parent_enfant"
  ADD CONSTRAINT "liaisons_parent_enfant_ecole_id_fkey"
  FOREIGN KEY ("ecole_id")
  REFERENCES "public"."ecoles"("id")
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "public"."liaisons_parent_enfant"
  VALIDATE CONSTRAINT "liaisons_parent_enfant_parent_id_fkey";

ALTER TABLE "public"."liaisons_parent_enfant"
  VALIDATE CONSTRAINT "liaisons_parent_enfant_ecole_id_fkey";

CREATE INDEX IF NOT EXISTS "liaisons_parent_enfant_parent_id_idx"
  ON "public"."liaisons_parent_enfant"("parent_id");
