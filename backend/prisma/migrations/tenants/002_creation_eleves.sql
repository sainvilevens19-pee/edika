-- ─────────────────────────────────────────────────────────
-- MIGRATION TENANT 002 — Création des élèves
-- Itération 1 — Noyau
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eleves (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    matricule           VARCHAR(50)     UNIQUE NOT NULL,  -- ex: "2024-001"
    nom                 VARCHAR(100)    NOT NULL,
    prenom              VARCHAR(100)    NOT NULL,
    sexe                CHAR(1)         CHECK (sexe IN ('M', 'F')),
    date_naissance      DATE,
    lieu_naissance      VARCHAR(200),
    adresse             VARCHAR(300),
    telephone_parent    VARCHAR(20),
    nom_parent          VARCHAR(200),
    email_parent        VARCHAR(200),
    parent_id           UUID,           -- référence vers public.parents (optionnel)
    classe_id           UUID            REFERENCES classes(id) ON DELETE SET NULL,
    annee_scolaire      VARCHAR(20)     NOT NULL,
    statut              VARCHAR(50)     DEFAULT 'ACTIF'
                        CHECK (statut IN ('ACTIF', 'INACTIF', 'REDOUBLANT', 'TRANSFERE', 'DIPLOME')),
    photo_url           VARCHAR(500),
    date_inscription    DATE            DEFAULT CURRENT_DATE,
    cree_le             TIMESTAMP       DEFAULT NOW(),
    modifie_le          TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_eleves_classe ON eleves(classe_id);
CREATE INDEX idx_eleves_annee ON eleves(annee_scolaire);
CREATE INDEX idx_eleves_statut ON eleves(statut);
CREATE INDEX idx_eleves_parent ON eleves(parent_id);
