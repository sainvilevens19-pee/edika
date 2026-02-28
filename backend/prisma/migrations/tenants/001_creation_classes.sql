-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 001 — Création des classes
-- Itération 1 — Noyau
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classes (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nom                 VARCHAR(100)    NOT NULL,         -- ex: "3ème A"
    niveau              VARCHAR(100)    NOT NULL,         -- ex: "Fondamental 3ème cycle"
    cycle               VARCHAR(100)    NOT NULL,         -- ex: "Fondamental" / "Secondaire"
    capacite_max        INTEGER         DEFAULT 40,
    annee_scolaire      VARCHAR(20)     NOT NULL,         -- ex: "2024-2025"
    actif               BOOLEAN         DEFAULT TRUE,
    cree_le             TIMESTAMP       DEFAULT NOW(),
    modifie_le          TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_classes_annee ON classes(annee_scolaire);
CREATE INDEX idx_classes_niveau ON classes(niveau);
