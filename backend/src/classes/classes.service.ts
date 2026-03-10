import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface CreerClasseDto {
  nom: string;             // ex: "3ème A"
  niveau: string;          // ex: "Fondamental 3ème cycle"
  cycle: string;           // ex: "Fondamental" / "Secondaire"
  capacite_max?: number;
  annee_scolaire: string;  // ex: "2024-2025"
}

@Injectable()
export class ClassesService {

  // ─────────────────────────────────────────
  // LISTER LES CLASSES
  // ─────────────────────────────────────────
  async listerClasses(
    pool: Pool,
    schemaNom: string,
    filtres?: { annee_scolaire?: string; actif?: boolean },
  ) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      let requete = `
        SELECT c.*,
               COUNT(e.id)::int AS nb_eleves
        FROM classes c
        LEFT JOIN eleves e ON e.classe_id = c.id
        WHERE 1=1
      `;
      const params: unknown[] = [];
      let index = 1;

      if (filtres?.annee_scolaire) {
        requete += ` AND c.annee_scolaire = $${index++}`;
        params.push(filtres.annee_scolaire);
      }
      if (filtres?.actif !== undefined) {
        requete += ` AND c.actif = $${index++}`;
        params.push(filtres.actif);
      }

      requete += ` GROUP BY c.id ORDER BY c.niveau, c.nom`;

      const resultat = await client.query(requete, params);
      return resultat.rows;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // CRÉER UNE CLASSE
  // ─────────────────────────────────────────
  async creerClasse(pool: Pool, schemaNom: string, dto: CreerClasseDto) {
    const capacite = dto.capacite_max ?? 40;
    if (capacite <= 0) {
      throw new BadRequestException('La capacité maximale doit être supérieure à 0');
    }

    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `INSERT INTO classes (nom, niveau, cycle, capacite_max, annee_scolaire)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [dto.nom, dto.niveau, dto.cycle, capacite, dto.annee_scolaire],
      );
      return resultat.rows[0];
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // OBTENIR UNE CLASSE PAR ID
  // ─────────────────────────────────────────
  async obtenirClasse(pool: Pool, schemaNom: string, id: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `SELECT c.*,
                COUNT(e.id)::int AS nb_eleves
         FROM classes c
         LEFT JOIN eleves e ON e.classe_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`,
        [id],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Classe introuvable');
      }
      return resultat.rows[0];
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // MODIFIER UNE CLASSE
  // ─────────────────────────────────────────
  async modifierClasse(
    pool: Pool,
    schemaNom: string,
    id: string,
    donnees: Partial<CreerClasseDto>,
  ) {
    if (donnees.capacite_max !== undefined && donnees.capacite_max <= 0) {
      throw new BadRequestException('La capacité maximale doit être supérieure à 0');
    }

    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      const champs = Object.keys(donnees)
        .map((cle, i) => `${cle} = $${i + 2}`)
        .join(', ');
      const valeurs = Object.values(donnees);

      const resultat = await client.query(
        `UPDATE classes SET ${champs}, modifie_le = NOW()
         WHERE id = $1 RETURNING *`,
        [id, ...valeurs],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Classe introuvable');
      }
      return resultat.rows[0];
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // ARCHIVER UNE CLASSE (soft delete)
  // ─────────────────────────────────────────
  async archiverClasse(pool: Pool, schemaNom: string, id: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `UPDATE classes SET actif = FALSE, modifie_le = NOW()
         WHERE id = $1 RETURNING *`,
        [id],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Classe introuvable');
      }
      return resultat.rows[0];
    } finally {
      client.release();
    }
  }
}
