import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface CreerMatiereDto {
  nom: string;           // ex: "Mathématiques"
  code: string;          // ex: "MATH" (unique par école)
  coefficient?: number;  // ex: 4
  niveau?: string;       // ex: "Fondamental 3ème cycle"
  description?: string;
}

@Injectable()
export class MatieresService {

  // ─────────────────────────────────────────
  // LISTER LES MATIÈRES
  // ─────────────────────────────────────────
  async listerMatieres(
    pool: Pool,
    schemaNom: string,
    filtres?: { niveau?: string },
  ) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      let requete = `SELECT * FROM matieres WHERE 1=1`;
      const params: unknown[] = [];
      let index = 1;

      if (filtres?.niveau) {
        requete += ` AND niveau = $${index++}`;
        params.push(filtres.niveau);
      }

      requete += ` ORDER BY nom`;

      const resultat = await client.query(requete, params);
      return resultat.rows;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // CRÉER UNE MATIÈRE
  // ─────────────────────────────────────────
  async creerMatiere(pool: Pool, schemaNom: string, dto: CreerMatiereDto) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `INSERT INTO matieres (nom, code, coefficient, niveau, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          dto.nom,
          dto.code.toUpperCase(),
          dto.coefficient ?? 1,
          dto.niveau || null,
          dto.description || null,
        ],
      );
      return resultat.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`Une matière avec le code "${dto.code.toUpperCase()}" existe déjà`);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // MODIFIER UNE MATIÈRE
  // ─────────────────────────────────────────
  async modifierMatiere(
    pool: Pool,
    schemaNom: string,
    id: string,
    donnees: Partial<CreerMatiereDto>,
  ) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Normaliser le code en majuscules si fourni
      if (donnees.code) donnees.code = donnees.code.toUpperCase();

      const champs = Object.keys(donnees)
        .map((cle, i) => `${cle} = $${i + 2}`)
        .join(', ');
      const valeurs = Object.values(donnees);

      const resultat = await client.query(
        `UPDATE matieres SET ${champs}
         WHERE id = $1 RETURNING *`,
        [id, ...valeurs],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Matière introuvable');
      }
      return resultat.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`Une matière avec ce code existe déjà`);
      }
      throw err;
    } finally {
      client.release();
    }
  }
}
