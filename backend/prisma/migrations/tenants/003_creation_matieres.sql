-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 003 — Création des matières
-- Itération 1 — Noyau
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matieres (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             VARCHAR(100)    NOT NULL,     -- ex: "Mathématiques"
    code            VARCHAR(20)     NOT NULL,     -- ex: "MATH"
    coefficient     NUMERIC(4,2)    DEFAULT 1,    -- pour le calcul des moyennes
    niveau          VARCHAR(100),                 -- ex: "3ème Fondamental"
    description     TEXT,
    actif           BOOLEAN         DEFAULT TRUE,
    cree_le         TIMESTAMP       DEFAULT NOW(),
    modifie_le      TIMESTAMP       DEFAULT NOW(),

    CONSTRAINT matieres_code_unique UNIQUE (code)
);

CREATE INDEX idx_matieres_niveau ON matieres(niveau);
