-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 006 — Workflow élève (EN_ATTENTE → VALIDE → ACTIF)
-- Sprint 1 — Infrastructure métier centrale
-- ─────────────────────────────────────────────────────────

-- 1. Colonne utilisateur_id pour le login ELEVE
--    Référence le compte Utilisateur dans public schema
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS
  utilisateur_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_eleves_utilisateur ON eleves(utilisateur_id);

-- 2. Étendre le CHECK du statut pour inclure EN_ATTENTE et VALIDE
--    et passer le DEFAULT à EN_ATTENTE pour les nouvelles inscriptions
ALTER TABLE eleves DROP CONSTRAINT IF EXISTS eleves_statut_check;

ALTER TABLE eleves ADD CONSTRAINT eleves_statut_check
  CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'ACTIF', 'INACTIF', 'REDOUBLANT', 'TRANSFERE', 'DIPLOME'));

-- Changer le DEFAULT : les nouvelles inscriptions démarrent en EN_ATTENTE
ALTER TABLE eleves ALTER COLUMN statut SET DEFAULT 'EN_ATTENTE';

-- Note : les élèves existants avec statut='ACTIF' ne sont pas affectés
-- (la contrainte est étendue, pas réduite)
