import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface CreerAnneeScolaireDto {
  libelle: string;         // ex: "2024-2025"
  date_debut?: string;
  date_fin?: string;
}

@Injectable()
export class AnneesScolairesService {

  // ─────────────────────────────────────────
  // LISTER LES ANNÉES SCOLAIRES
  // ─────────────────────────────────────────
  async listerAnnees(pool: Pool, schemaNom: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `SELECT * FROM annees_scolaires ORDER BY libelle DESC`,
      );
      return resultat.rows;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // CRÉER UNE ANNÉE SCOLAIRE
  // ─────────────────────────────────────────
  async creerAnnee(pool: Pool, schemaNom: string, dto: CreerAnneeScolaireDto) {
    if (!dto.libelle) {
      throw new BadRequestException('Le libellé de l\'année scolaire est requis');
    }

    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `INSERT INTO annees_scolaires (libelle, date_debut, date_fin)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dto.libelle, dto.date_debut || null, dto.date_fin || null],
      );
      return resultat.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new BadRequestException(`L'année scolaire "${dto.libelle}" existe déjà`);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // DÉFINIR UNE ANNÉE COMME ACTIVE
  // Une seule active à la fois (transaction)
  // ─────────────────────────────────────────
  async definirActive(pool: Pool, schemaNom: string, id: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      await client.query('BEGIN');

      // Vérifier que l'année existe
      const existeRes = await client.query(
        `SELECT id FROM annees_scolaires WHERE id = $1`,
        [id],
      );
      if (existeRes.rows.length === 0) {
        throw new NotFoundException('Année scolaire introuvable');
      }

      // Désactiver toutes les années
      await client.query(`UPDATE annees_scolaires SET active = FALSE`);

      // Activer l'année demandée
      const resultat = await client.query(
        `UPDATE annees_scolaires SET active = TRUE WHERE id = $1 RETURNING *`,
        [id],
      );

      await client.query('COMMIT');
      return resultat.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // OBTENIR L'ANNÉE ACTIVE
  // ─────────────────────────────────────────
  async obtenirAnneeActive(pool: Pool, schemaNom: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);
      const resultat = await client.query(
        `SELECT * FROM annees_scolaires WHERE active = TRUE LIMIT 1`,
      );
      return resultat.rows[0] || null;
    } finally {
      client.release();
    }
  }
}
