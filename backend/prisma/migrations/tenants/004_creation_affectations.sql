-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 004 — Création des affectations
-- Pont entre le professeur global et les matières/classes
-- Itération 1 — Noyau
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affectations (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    professeur_id       UUID        NOT NULL,    -- référence vers public.professeurs
    matiere_id          UUID        NOT NULL     REFERENCES matieres(id) ON DELETE CASCADE,
    classe_id           UUID        NOT NULL     REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire      VARCHAR(20) NOT NULL,
    statut              VARCHAR(20) DEFAULT 'ACTIVE'
                        CHECK (statut IN ('ACTIVE', 'INACTIVE')),
    cree_le             TIMESTAMP   DEFAULT NOW(),
    modifie_le          TIMESTAMP   DEFAULT NOW(),

    -- Un professeur ne peut pas être assigné deux fois
    -- à la même matière dans la même classe la même année
    CONSTRAINT affectation_unique UNIQUE (professeur_id, matiere_id, classe_id, annee_scolaire)
);

CREATE INDEX idx_affectations_professeur ON affectations(professeur_id);
CREATE INDEX idx_affectations_classe ON affectations(classe_id);
CREATE INDEX idx_affectations_matiere ON affectations(matiere_id);
CREATE INDEX idx_affectations_annee ON affectations(annee_scolaire);
