import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../commun/prisma/prisma.service';

export interface CreerProfesseurDto {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  diplome?: string;
  mot_de_passe?: string;   // optionnel — généré si absent
}

@Injectable()
export class ProfesseursService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // LISTER LES PROFESSEURS DE L'ÉCOLE
  // ─────────────────────────────────────────
  async listerProfesseurs(ecoleId: string) {
    const affectations = await this.prisma.affectationGlobale.findMany({
      where: { ecole_id: ecoleId, statut: 'ACTIVE' },
      include: {
        professeur: {
          include: { utilisateur: true },
        },
      },
      orderBy: {
        professeur: { utilisateur: { nom: 'asc' } },
      },
    });

    return affectations.map((a) => ({
      id: a.professeur.id,
      affectation_id: a.id,
      nom: a.professeur.utilisateur.nom,
      prenom: a.professeur.utilisateur.prenom,
      email: a.professeur.utilisateur.email,
      telephone: a.professeur.utilisateur.telephone,
      specialite: a.professeur.specialite,
      diplome: a.professeur.diplome,
      actif: a.professeur.utilisateur.actif,
      date_affectation: a.date_affectation,
    }));
  }

  // ─────────────────────────────────────────
  // CRÉER UN PROFESSEUR ET L'AFFECTER À L'ÉCOLE
  // ─────────────────────────────────────────
  async creerProfesseur(ecoleId: string, dto: CreerProfesseurDto) {
    // Vérifier si l'email est déjà utilisé
    const existant = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (existant) {
      // Si le compte existe déjà (PROFESSEUR), ajouter l'affectation
      if (existant.role === 'PROFESSEUR') {
        const professeur = await this.prisma.professeur.findUnique({
          where: { utilisateur_id: existant.id },
        });
        if (!professeur) {
          throw new NotFoundException('Profil professeur introuvable pour cet utilisateur');
        }
        // Vérifier si déjà affilié à cette école
        const dejaAffecte = await this.prisma.affectationGlobale.findUnique({
          where: {
            professeur_id_ecole_id: {
              professeur_id: professeur.id,
              ecole_id: ecoleId,
            },
          },
        });
        if (dejaAffecte) {
          throw new ConflictException('Ce professeur est déjà affilié à cette école');
        }
        // Créer une nouvelle affectation
        await this.prisma.affectationGlobale.create({
          data: { professeur_id: professeur.id, ecole_id: ecoleId },
        });
        return {
          message: 'Professeur existant affilié à cette école',
          professeur_id: professeur.id,
        };
      }
      throw new ConflictException(`Un compte avec l'adresse "${dto.email}" existe déjà avec un rôle différent`);
    }

    // Générer un mot de passe initial si non fourni
    const mdpClair = dto.mot_de_passe || this.genererMotDePasse();
    const mdpHache = await bcrypt.hash(mdpClair, 10);

    // Transaction : Utilisateur → Professeur → AffectationGlobale
    const resultat = await this.prisma.$transaction(async (tx) => {
      const utilisateur = await tx.utilisateur.create({
        data: {
          nom: dto.nom,
          prenom: dto.prenom,
          email: dto.email,
          telephone: dto.telephone || null,
          mot_de_passe: mdpHache,
          role: 'PROFESSEUR',
        },
      });

      const professeur = await tx.professeur.create({
        data: {
          utilisateur_id: utilisateur.id,
          specialite: dto.specialite || null,
          diplome: dto.diplome || null,
        },
      });

      await tx.affectationGlobale.create({
        data: {
          professeur_id: professeur.id,
          ecole_id: ecoleId,
        },
      });

      return {
        id: professeur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        mot_de_passe_initial: dto.mot_de_passe ? undefined : mdpClair,
      };
    });

    return resultat;
  }

  // ─────────────────────────────────────────
  // MODIFIER UN PROFESSEUR
  // ─────────────────────────────────────────
  async modifierProfesseur(
    professeurId: string,
    donnees: Partial<Pick<CreerProfesseurDto, 'nom' | 'prenom' | 'telephone' | 'specialite' | 'diplome'>>,
  ) {
    const professeur = await this.prisma.professeur.findUnique({
      where: { id: professeurId },
      include: { utilisateur: true },
    });

    if (!professeur) {
      throw new NotFoundException('Professeur introuvable');
    }

    // Mettre à jour les champs Utilisateur
    const donneesUtilisateur: any = {};
    if (donnees.nom) donneesUtilisateur.nom = donnees.nom;
    if (donnees.prenom) donneesUtilisateur.prenom = donnees.prenom;
    if (donnees.telephone !== undefined) donneesUtilisateur.telephone = donnees.telephone;

    // Mettre à jour les champs Professeur
    const donneesProfesseur: any = {};
    if (donnees.specialite !== undefined) donneesProfesseur.specialite = donnees.specialite;
    if (donnees.diplome !== undefined) donneesProfesseur.diplome = donnees.diplome;

    const [utilisateur] = await this.prisma.$transaction([
      this.prisma.utilisateur.update({
        where: { id: professeur.utilisateur_id },
        data: donneesUtilisateur,
      }),
      ...(Object.keys(donneesProfesseur).length > 0
        ? [this.prisma.professeur.update({
            where: { id: professeurId },
            data: donneesProfesseur,
          })]
        : []),
    ]);

    return {
      id: professeurId,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
    };
  }

  // ─────────────────────────────────────────
  // DÉSAFFECTER UN PROFESSEUR DE L'ÉCOLE
  // (ne supprime pas le compte Utilisateur)
  // ─────────────────────────────────────────
  async desactiverProfesseur(professeurId: string, ecoleId: string) {
    const affectation = await this.prisma.affectationGlobale.findUnique({
      where: {
        professeur_id_ecole_id: {
          professeur_id: professeurId,
          ecole_id: ecoleId,
        },
      },
    });

    if (!affectation) {
      throw new NotFoundException("Ce professeur n'est pas affilié à cette école");
    }

    await this.prisma.affectationGlobale.delete({
      where: { id: affectation.id },
    });

    return { message: 'Professeur désaffecté de cette école' };
  }

  // ─────────────────────────────────────────
  // Générateur de mot de passe initial
  // ─────────────────────────────────────────
  private genererMotDePasse(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let mdp = '';
    for (let i = 0; i < 10; i++) {
      mdp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return mdp;
  }
}
