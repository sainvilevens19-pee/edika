-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 005 — Création des années scolaires
-- Sprint 1 — Infrastructure métier centrale
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS annees_scolaires (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle     VARCHAR(20)  NOT NULL UNIQUE,  -- ex: "2024-2025"
  date_debut  DATE,
  date_fin    DATE,
  active      BOOLEAN      NOT NULL DEFAULT FALSE,
  cree_le     TIMESTAMP    DEFAULT NOW()
);

-- Une seule année active à la fois : contrainte gérée applicativement
-- (désactiver toutes, puis activer une dans une transaction)
CREATE INDEX IF NOT EXISTS idx_annees_active ON annees_scolaires(active);
