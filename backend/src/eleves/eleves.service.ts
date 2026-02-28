import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface CreerEleveDto {
  nom: string;
  prenom: string;
  sexe?: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  telephone_parent?: string;
  nom_parent?: string;
  email_parent?: string;
  parent_id?: string;
  classe_id?: string;
  annee_scolaire: string;
}

@Injectable()
export class ElevesService {

  // ─────────────────────────────────────────
  // INSCRIRE UN ÉLÈVE
  // ─────────────────────────────────────────
  async inscrireEleve(pool: Pool, schemaNom: string, dto: CreerEleveDto) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Générer un matricule automatiquement
      const annee = new Date().getFullYear();
      const compteurRes = await client.query(
        `SELECT COUNT(*) as total FROM eleves WHERE annee_scolaire = $1`,
        [dto.annee_scolaire],
      );
      const numero = String(parseInt(compteurRes.rows[0].total) + 1).padStart(3, '0');
      const matricule = `${annee}-${numero}`;

      const resultat = await client.query(
        `INSERT INTO eleves (
          matricule, nom, prenom, sexe, date_naissance, lieu_naissance,
          adresse, telephone_parent, nom_parent, email_parent,
          parent_id, classe_id, annee_scolaire
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *`,
        [
          matricule,
          dto.nom,
          dto.prenom,
          dto.sexe || null,
          dto.date_naissance || null,
          dto.lieu_naissance || null,
          dto.adresse || null,
          dto.telephone_parent || null,
          dto.nom_parent || null,
          dto.email_parent || null,
          dto.parent_id || null,
          dto.classe_id || null,
          dto.annee_scolaire,
        ],
      );

      return resultat.rows[0];

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // LISTER LES ÉLÈVES (avec filtres)
  // ─────────────────────────────────────────
  async listerEleves(
    pool: Pool,
    schemaNom: string,
    filtres: { classe_id?: string; annee_scolaire?: string; statut?: string },
  ) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      let requete = `
        SELECT e.*, c.nom as classe_nom
        FROM eleves e
        LEFT JOIN classes c ON e.classe_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let index = 1;

      if (filtres.classe_id) {
        requete += ` AND e.classe_id = $${index++}`;
        params.push(filtres.classe_id);
      }
      if (filtres.annee_scolaire) {
        requete += ` AND e.annee_scolaire = $${index++}`;
        params.push(filtres.annee_scolaire);
      }
      if (filtres.statut) {
        requete += ` AND e.statut = $${index++}`;
        params.push(filtres.statut);
      }

      requete += ' ORDER BY e.nom, e.prenom';

      const resultat = await client.query(requete, params);
      return resultat.rows;

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // OBTENIR UN ÉLÈVE PAR ID
  // ─────────────────────────────────────────
  async obtenirEleve(pool: Pool, schemaNom: string, eleveId: string) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      const resultat = await client.query(
        `SELECT e.*, c.nom as classe_nom, c.niveau as classe_niveau
         FROM eleves e
         LEFT JOIN classes c ON e.classe_id = c.id
         WHERE e.id = $1`,
        [eleveId],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Élève introuvable');
      }

      return resultat.rows[0];

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // MODIFIER UN ÉLÈVE
  // ─────────────────────────────────────────
  async modifierEleve(
    pool: Pool,
    schemaNom: string,
    eleveId: string,
    donnees: Partial<CreerEleveDto>,
  ) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      const champs = Object.keys(donnees)
        .map((cle, i) => `${cle} = $${i + 2}`)
        .join(', ');

      const valeurs = Object.values(donnees);

      const resultat = await client.query(
        `UPDATE eleves SET ${champs}, modifie_le = NOW()
         WHERE id = $1 RETURNING *`,
        [eleveId, ...valeurs],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Élève introuvable');
      }

      return resultat.rows[0];

    } finally {
      client.release();
    }
  }
}
