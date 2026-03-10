import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../commun/prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // INSCRIRE UN ÉLÈVE (statut = EN_ATTENTE)
  // ─────────────────────────────────────────
  async inscrireEleve(pool: Pool, schemaNom: string, dto: CreerEleveDto) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Générer un matricule automatiquement : YYYY-NNN
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
          parent_id, classe_id, annee_scolaire, statut
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'EN_ATTENTE')
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
      const params: unknown[] = [];
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

      requete += ' ORDER BY e.nom, e.prenom LIMIT 500';

      const resultat = await client.query(requete, params);
      return resultat.rows;

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // OBTENIR UN ÉLÈVE PAR ID (admin/prof)
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
  // VALIDER UN ÉLÈVE (EN_ATTENTE → VALIDE)
  // Effectué par l'ADMIN_ECOLE (censeur)
  // ─────────────────────────────────────────
  async validerEleve(pool: Pool, schemaNom: string, eleveId: string) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Vérifier le statut actuel
      const eleveRes = await client.query(
        `SELECT id, statut, nom, prenom FROM eleves WHERE id = $1`,
        [eleveId],
      );

      if (eleveRes.rows.length === 0) {
        throw new NotFoundException('Élève introuvable');
      }

      const eleve = eleveRes.rows[0];

      if (eleve.statut !== 'EN_ATTENTE') {
        throw new BadRequestException(
          `Impossible de valider : le statut actuel est "${eleve.statut}" (attendu : EN_ATTENTE)`,
        );
      }

      const resultat = await client.query(
        `UPDATE eleves SET statut = 'VALIDE', modifie_le = NOW()
         WHERE id = $1 RETURNING *`,
        [eleveId],
      );

      return resultat.rows[0];

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // ACTIVER UN ÉLÈVE (VALIDE → ACTIF)
  // Crée le compte Utilisateur et ElevePublic
  // ─────────────────────────────────────────
  async activerEleve(
    pool: Pool,
    schemaNom: string,
    eleveId: string,
    ecoleId: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaNom}"`);

      // Vérifier le statut actuel
      const eleveRes = await client.query(
        `SELECT id, statut, nom, prenom, matricule FROM eleves WHERE id = $1`,
        [eleveId],
      );

      if (eleveRes.rows.length === 0) {
        throw new NotFoundException('Élève introuvable');
      }

      const eleve = eleveRes.rows[0];

      if (eleve.statut !== 'VALIDE') {
        throw new BadRequestException(
          `Impossible d'activer : le statut actuel est "${eleve.statut}" (attendu : VALIDE)`,
        );
      }

      // Vérifier si un compte Utilisateur existe déjà pour cet élève
      if (eleve.utilisateur_id) {
        throw new BadRequestException("Un compte utilisateur est déjà créé pour cet élève");
      }

      // Créer un email auto et un mot de passe initial (= le matricule)
      const emailAuto = `eleve.${eleve.matricule.toLowerCase().replace('-', '.')}@edika.edu.ht`;
      const mdpInitial = eleve.matricule;  // ex: "2024-001"
      const mdpHache = await bcrypt.hash(mdpInitial, 10);

      // Créer Utilisateur + ElevePublic dans le schéma public
      const { utilisateurId } = await this.prisma.$transaction(async (tx) => {
        const utilisateur = await tx.utilisateur.create({
          data: {
            nom: eleve.nom,
            prenom: eleve.prenom,
            email: emailAuto,
            mot_de_passe: mdpHache,
            role: 'ELEVE',
          },
        });

        await tx.elevePublic.create({
          data: {
            utilisateur_id: utilisateur.id,
            ecole_id: ecoleId,
            schema_nom: schemaNom,
            eleve_id: eleveId,
          },
        });

        return { utilisateurId: utilisateur.id };
      });

      // Mettre à jour le statut dans le tenant
      const resultat = await client.query(
        `UPDATE eleves SET statut = 'ACTIF', utilisateur_id = $2, modifie_le = NOW()
         WHERE id = $1 RETURNING *`,
        [eleveId, utilisateurId],
      );

      return {
        eleve: resultat.rows[0],
        credentials: {
          email: emailAuto,
          mot_de_passe_initial: mdpInitial,
          message: 'Ces identifiants doivent être remis à l\'élève et changés dès la première connexion',
        },
      };

    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────
  // VÉRIFIER LA LIAISON PARENT-ÉLÈVE
  // Utilisé avant tout accès d'un PARENT aux données d'un élève.
  // Retourne true si une liaison valide existe en schéma public.
  // ─────────────────────────────────────────
  async verifierLiaisonParent(utilisateurId: string, eleveId: string): Promise<boolean> {
    // Trouver le profil Parent à partir de l'utilisateur
    const parent = await this.prisma.parent.findUnique({
      where: { utilisateur_id: utilisateurId },
    });

    if (!parent) return false;

    const liaison = await this.prisma.liaisonParentEnfant.findFirst({
      where: {
        parent_id: parent.id,
        eleve_id: eleveId,
        valide: true,
      },
    });

    return liaison !== null;
  }

  // ─────────────────────────────────────────
  // OBTENIR UN ÉLÈVE (accès PARENT)
  // Récupère le schéma depuis la liaison validée, puis
  // interroge le schéma tenant approprié.
  // ─────────────────────────────────────────
  async obtenirEleveParent(utilisateurId: string, eleveId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { utilisateur_id: utilisateurId },
    });

    if (!parent) throw new NotFoundException('Profil parent introuvable');

    const liaison = await this.prisma.liaisonParentEnfant.findFirst({
      where: {
        parent_id: parent.id,
        eleve_id: eleveId,
        valide: true,
      },
    });

    if (!liaison) throw new NotFoundException('Liaison parent-enfant introuvable');

    // Créer un pool temporaire pour interroger le schéma tenant de l'école
    const pool = new Pool({ connectionString: process.env.BASE_URL_POSTGRES });
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${liaison.schema_nom}"`);

      const resultat = await client.query(
        `SELECT e.*, c.nom as classe_nom, c.niveau as classe_niveau
         FROM eleves e
         LEFT JOIN classes c ON e.classe_id = c.id
         WHERE e.id = $1`,
        [eleveId],
      );

      if (resultat.rows.length === 0) {
        throw new NotFoundException('Élève introuvable dans ce schéma');
      }

      return resultat.rows[0];

    } finally {
      client.release();
      await pool.end();
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
