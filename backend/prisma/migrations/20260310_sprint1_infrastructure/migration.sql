-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 1 — Infrastructure Métier Centrale
-- Migration publique (à appliquer via: npx prisma migrate deploy)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Colonne ecole_id sur utilisateurs (pour le rôle SECRETAIRE)
ALTER TABLE "public"."utilisateurs"
  ADD COLUMN IF NOT EXISTS "ecole_id" TEXT;

-- 2. Table eleves_public (liaison utilisateur ELEVE ↔ schéma tenant)
CREATE TABLE IF NOT EXISTS "public"."eleves_public" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "utilisateur_id" TEXT        NOT NULL,
  "ecole_id"       TEXT        NOT NULL,
  "schema_nom"     TEXT        NOT NULL,
  "eleve_id"       TEXT        NOT NULL,
  "cree_le"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "eleves_public_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "eleves_public_utilisateur_id_key" UNIQUE ("utilisateur_id")
);

ALTER TABLE "public"."eleves_public"
  ADD CONSTRAINT "eleves_public_utilisateur_id_fkey"
  FOREIGN KEY ("utilisateur_id")
  REFERENCES "public"."utilisateurs"("id")
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "public"."eleves_public"
  ADD CONSTRAINT "eleves_public_ecole_id_fkey"
  FOREIGN KEY ("ecole_id")
  REFERENCES "public"."ecoles"("id")
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "public"."eleves_public"
  VALIDATE CONSTRAINT "eleves_public_utilisateur_id_fkey";

ALTER TABLE "public"."eleves_public"
  VALIDATE CONSTRAINT "eleves_public_ecole_id_fkey";

CREATE INDEX IF NOT EXISTS "eleves_public_ecole_id_idx"
  ON "public"."eleves_public"("ecole_id");
