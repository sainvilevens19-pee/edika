import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../commun/prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { InscriptionEcoleDto } from './ecoles.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

@Injectable()
export class EcolesService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  async inscrireEcole(dto: InscriptionEcoleDto, ipAdresse?: string, userAgent?: string) {
    const ecoleExistante = await this.prisma.ecole.findUnique({ where: { slug: dto.slug } });
    if (ecoleExistante) {
      throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé.`);
    }

    const adminExistant = await this.prisma.utilisateur.findUnique({ where: { email: dto.admin_email } });
    if (adminExistant) {
      throw new ConflictException(`L'email "${dto.admin_email}" est déjà utilisé.`);
    }

    const schemaNom = `ecole_${dto.slug.replace(/-/g, '_')}`;

    try {
      const motDePasseHash = await bcrypt.hash(dto.admin_mot_de_passe, 12);

      // Créer le compte administrateur de l'école
      const admin = await this.prisma.utilisateur.create({
        data: {
          nom: dto.admin_nom,
          prenom: dto.admin_prenom,
          email: dto.admin_email,
          mot_de_passe: motDePasseHash,
          role: 'ADMIN_ECOLE',
        },
      });

      // Créer l'école avec le lien vers son administrateur (fix B1)
      const ecole = await this.prisma.ecole.create({
        data: {
          nom: dto.nom,
          slug: dto.slug,
          schema_nom: schemaNom,
          adresse: dto.adresse,
          ville: dto.ville,
          telephone: dto.telephone,
          email: dto.email,
          directeur_nom: dto.directeur_nom,
          annee_scolaire: dto.annee_scolaire,
          statut: 'EN_ATTENTE',
          admin_utilisateur_id: admin.id,  // fix B1 — champ désormais présent dans le schéma
        },
      });

      // Créer le schéma tenant et appliquer les migrations SQL
      await this.creerSchemaTenant(schemaNom, ecole.id);

      // Activer l'école après la création réussie du schéma
      await this.prisma.ecole.update({
        where: { id: ecole.id },
        data: { statut: 'ACTIVE' },
      });

      // Audit log
      await this.journal.journaliser({
        action: 'CREATION_ECOLE',
        entite: 'ecole',
        entite_id: ecole.id,
        details: { nom: ecole.nom, slug: ecole.slug, admin_email: dto.admin_email },
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });

      return {
        message: 'École inscrite avec succès',
        ecole: {
          id: ecole.id,
          nom: ecole.nom,
          slug: ecole.slug,
          url_connexion: `/connexion/${ecole.slug}`,
        },
      };

    } catch (erreur) {
      if (erreur instanceof ConflictException) throw erreur;
      throw new InternalServerErrorException('Erreur lors de l\'inscription : ' + erreur.message);
    }
  }

  private async creerSchemaTenant(schemaNom: string, ecoleId: string) {
    const pool = new Pool({ connectionString: process.env.BASE_URL_POSTGRES });
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaNom}"`);
      const dossierMigrations = path.join(__dirname, '../../prisma/migrations/tenants');
      const fichiers = fs.readdirSync(dossierMigrations).filter((f) => f.endsWith('.sql')).sort();

      for (const fichier of fichiers) {
        const sql = fs.readFileSync(path.join(dossierMigrations, fichier), 'utf-8');
        await client.query(`SET search_path TO "${schemaNom}"`);
        await client.query(sql);
        await this.prisma.historiqueMigration.create({
          data: {
            ecole_id: ecoleId,
            nom_migration: fichier.replace('.sql', ''),
            statut: 'SUCCES',
          },
        });
      }
    } catch (erreur) {
      await this.prisma.historiqueMigration.create({
        data: {
          ecole_id: ecoleId,
          nom_migration: 'creation_schema',
          statut: 'ECHEC',
          message_erreur: erreur.message,
        },
      });
      throw erreur;
    } finally {
      client.release();
      await pool.end();
    }
  }

  async verifierSlug(slug: string) {
    const ecole = await this.prisma.ecole.findUnique({ where: { slug } });
    return { disponible: !ecole, slug };
  }

  async obtenirParSlug(slug: string) {
    const ecole = await this.prisma.ecole.findFirst({
      where: { slug, statut: 'ACTIVE' },
      select: { id: true, nom: true, slug: true, logo_url: true, ville: true },
    });
    if (!ecole) throw new NotFoundException('École introuvable ou inactive');
    return ecole;
  }

  async listerEcoles(utilisateurId?: string, role?: string) {
    // Audit log — qui accède à la liste complète des écoles
    if (utilisateurId) {
      await this.journal.journaliser({
        utilisateur_id: utilisateurId,
        role,
        action: 'ACCES_LISTE_ECOLES',
      });
    }

    return this.prisma.ecole.findMany({
      select: {
        id: true,
        nom: true,
        slug: true,
        ville: true,
        statut: true,
        annee_scolaire: true,
        cree_le: true,
      },
      orderBy: { cree_le: 'desc' },
    });
  }
}
