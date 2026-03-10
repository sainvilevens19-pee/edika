import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface CreerAffectationDto {
  professeur_id: string;    // UUID dans public.professeurs
  matiere_id: string;       // UUID dans tenant.matieres
  classe_id: string;        // UUID dans tenant.classes
  annee_scolaire: string;   // ex: "2024-2025"
}

@Injectable()
export class AffectationsService {

  // ─────────────────────────────────────────
  // LISTER LES AFFECTATIONS
  // ─────────────────────────────────────────
  async listerAffectations(
    pool: Pool,
    schemaNom: string,
    filtres?: { annee_scolaire?: string; professeur_id?: string },
  ) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      let requete = `
        SELECT
          a.id,
          a.professeur_id,
          a.matiere_id,
          a.classe_id,
          a.annee_scolaire,
          a.statut,
          a.cree_le,
          m.nom     AS matiere_nom,
          m.code    AS matiere_code,
          m.coefficient,
          c.nom     AS classe_nom,
          c.niveau  AS classe_niveau
        FROM affectations a
        LEFT JOIN matieres m ON a.matiere_id = m.id
        LEFT JOIN classes  c ON a.classe_id  = c.id
        WHERE 1=1
      `;
      const params: unknown[] = [];
      let index = 1;

      if (filtres?.annee_scolaire) {
        requete += ` AND a.annee_scolaire = $${index++}`;
        params.push(filtres.annee_scolaire);
      }
      if (filtres?.professeur_id) {
        requete += ` AND a.professeur_id = $${index++}`;
        params.push(filtres.professeur_id);
      }

      requete += ` ORDER BY c.nom, m.nom`;

      const resultat = await client.query(requete, params);
      return resultat.rows;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // CRÉER UNE AFFECTATION
  // ─────────────────────────────────────────
  async creerAffectation(pool: Pool, schemaNom: string, dto: CreerAffectationDto) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Vérifier que la matière et la classe existent
      const matiereRes = await client.query(
        `SELECT id FROM matieres WHERE id = $1`,
        [dto.matiere_id],
      );
      if (matiereRes.rows.length === 0) {
        throw new NotFoundException('Matière introuvable');
      }

      const classeRes = await client.query(
        `SELECT id FROM classes WHERE id = $1`,
        [dto.classe_id],
      );
      if (classeRes.rows.length === 0) {
        throw new NotFoundException('Classe introuvable');
      }

      const resultat = await client.query(
        `INSERT INTO affectations (professeur_id, matiere_id, classe_id, annee_scolaire)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [dto.professeur_id, dto.matiere_id, dto.classe_id, dto.annee_scolaire],
      );

      return resultat.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(
          'Ce professeur est déjà affecté à cette matière dans cette classe pour cette année',
        );
      }
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // SUPPRIMER UNE AFFECTATION
  // ─────────────────────────────────────────
  async supprimerAffectation(pool: Pool, schemaNom: string, id: string) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      const resultat = await client.query(
        `DELETE FROM affectations WHERE id = $1 RETURNING id`,
        [id],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Affectation introuvable');
      }

      return { message: 'Affectation supprimée', id };
    } finally {
      client.release();
    }
  }
}
