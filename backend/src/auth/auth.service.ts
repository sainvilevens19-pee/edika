import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../commun/prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { ConnexionDto, ChangerEcoleDto } from './auth.dto';

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly journal: JournalService,
  ) {}

  async connexion(dto: ConnexionDto, ipAdresse?: string, userAgent?: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      include: {
        professeur: {
          include: {
            affectations: {
              where: { statut: 'ACTIVE' },
              include: { ecole: true },
            },
          },
        },
      },
    });

    if (!utilisateur || !utilisateur.actif) {
      await this.journal.journaliser({
        action: 'CONNEXION_ECHEC',
        details: { email: dto.email, raison: 'Utilisateur introuvable ou inactif' },
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const motDePasseValide = await bcrypt.compare(dto.mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_ECHEC',
        details: { raison: 'Mot de passe incorrect' },
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      throw new UnauthorizedException('Identifiants incorrects');
    }

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniere_connexion: new Date() },
    });

    // ── SUPER_ADMIN ────────────────────────────────────────────────────────────
    if (utilisateur.role === 'SUPER_ADMIN') {
      const resultat = await this.genererTokens(utilisateur, null, null);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    // ── ADMIN_ECOLE ────────────────────────────────────────────────────────────
    if (utilisateur.role === 'ADMIN_ECOLE') {
      const ecole = await this.prisma.ecole.findFirst({
        where: { admin_utilisateur_id: utilisateur.id, statut: 'ACTIVE' },
      });
      if (!ecole) {
        throw new UnauthorizedException('Aucune école active associée à ce compte');
      }
      const resultat = await this.genererTokens(utilisateur, ecole.id, ecole.schema_nom);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        entite: 'ecole',
        entite_id: ecole.id,
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    // ── PROFESSEUR ─────────────────────────────────────────────────────────────
    if (utilisateur.role === 'PROFESSEUR') {
      const ecoles = utilisateur.professeur?.affectations.map((a) => ({
        id: a.ecole.id,
        nom: a.ecole.nom,
        slug: a.ecole.slug,
        schema_nom: a.ecole.schema_nom,
      })) || [];

      if (ecoles.length === 0) {
        throw new UnauthorizedException("Vous n'êtes affilié à aucune école active");
      }

      if (ecoles.length === 1) {
        const resultat = await this.genererTokens(utilisateur, ecoles[0].id, ecoles[0].schema_nom);
        await this.journal.journaliser({
          utilisateur_id: utilisateur.id,
          role: utilisateur.role,
          action: 'CONNEXION_SUCCES',
          entite: 'ecole',
          entite_id: ecoles[0].id,
          ip_adresse: ipAdresse,
          user_agent: userAgent,
        });
        return resultat;
      }

      // Plusieurs écoles → demander le choix
      if (!dto.ecole_id) {
        return { choix_ecole_requis: true, ecoles, message: 'Veuillez choisir une école' };
      }

      const ecoleChoisie = ecoles.find((e) => e.id === dto.ecole_id);
      if (!ecoleChoisie) {
        throw new UnauthorizedException("Vous n'êtes pas affilié à cette école");
      }

      const resultat = await this.genererTokens(utilisateur, ecoleChoisie.id, ecoleChoisie.schema_nom);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        entite: 'ecole',
        entite_id: ecoleChoisie.id,
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    // ── SECRETAIRE ─────────────────────────────────────────────────────────────
    if (utilisateur.role === 'SECRETAIRE') {
      if (!utilisateur.ecole_id) {
        throw new UnauthorizedException('Aucune école associée à ce compte secrétaire');
      }
      const ecole = await this.prisma.ecole.findFirst({
        where: { id: utilisateur.ecole_id, statut: 'ACTIVE' },
      });
      if (!ecole) {
        throw new UnauthorizedException("L'école associée est inactive ou introuvable");
      }
      const resultat = await this.genererTokens(utilisateur, ecole.id, ecole.schema_nom);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        entite: 'ecole',
        entite_id: ecole.id,
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    // ── PARENT ─────────────────────────────────────────────────────────────────
    if (utilisateur.role === 'PARENT') {
      const resultat = await this.genererTokens(utilisateur, null, null);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    // ── ELEVE ──────────────────────────────────────────────────────────────────
    if (utilisateur.role === 'ELEVE') {
      const elevePublic = await this.prisma.elevePublic.findUnique({
        where: { utilisateur_id: utilisateur.id },
      });
      if (!elevePublic) {
        throw new UnauthorizedException('Compte élève non configuré — contactez votre école');
      }
      const resultat = await this.genererTokens(utilisateur, elevePublic.ecole_id, elevePublic.schema_nom);
      await this.journal.journaliser({
        utilisateur_id: utilisateur.id,
        role: utilisateur.role,
        action: 'CONNEXION_SUCCES',
        entite: 'ecole',
        entite_id: elevePublic.ecole_id,
        ip_adresse: ipAdresse,
        user_agent: userAgent,
      });
      return resultat;
    }

    throw new UnauthorizedException('Rôle non reconnu');
  }

  async changerEcole(utilisateurId: string, dto: ChangerEcoleDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      include: {
        professeur: {
          include: {
            affectations: {
              where: { ecole_id: dto.ecole_id, statut: 'ACTIVE' },
              include: { ecole: true },
            },
          },
        },
      },
    });

    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    const affectation = utilisateur.professeur?.affectations[0];
    if (!affectation) {
      throw new UnauthorizedException("Vous n'êtes pas affilié à cette école ou l'affectation est inactive");
    }

    return this.genererTokens(utilisateur, affectation.ecole.id, affectation.ecole.schema_nom);
  }

  /**
   * Rafraîchit les tokens depuis le refresh token (cookie httpOnly).
   * Fix B2 : le refresh token est un UUID stocké en base, pas un JWT.
   * Le contexte école est restauré depuis les champs ecole_id / schema_nom
   * de la table TokenRafraichissement (ajoutés en Phase 1).
   */
  async rafraichirToken(refreshToken: string) {
    const tokenEnBase = await this.prisma.tokenRafraichissement.findUnique({
      where: { token: refreshToken },
      include: { utilisateur: true },
    });

    if (!tokenEnBase || tokenEnBase.revoque) {
      throw new UnauthorizedException('Token invalide ou révoqué');
    }

    if (tokenEnBase.expire_le < new Date()) {
      throw new UnauthorizedException('Token expiré');
    }

    // Révoquer l'ancien token (rotation de refresh token)
    await this.prisma.tokenRafraichissement.update({
      where: { id: tokenEnBase.id },
      data: { revoque: true },
    });

    // Restaurer le contexte école depuis la base (fix B2 — plus de jwtService.verify sur UUID)
    return this.genererTokens(
      tokenEnBase.utilisateur,
      tokenEnBase.ecole_id ?? null,
      tokenEnBase.schema_nom ?? null,
    );
  }

  async deconnexion(refreshToken: string, utilisateurId?: string) {
    if (refreshToken) {
      await this.prisma.tokenRafraichissement.updateMany({
        where: { token: refreshToken },
        data: { revoque: true },
      });
    }

    if (utilisateurId) {
      await this.journal.journaliser({
        utilisateur_id: utilisateurId,
        action: 'DECONNEXION',
      });
    }

    return { message: 'Déconnexion réussie' };
  }

  /**
   * Génère un access token JWT (15 min) et un refresh token UUID (30 jours).
   * Le contexte école est stocké dans les deux tokens pour restauration correcte.
   */
  async genererTokens(utilisateur: any, ecoleId: string | null, schemaNom: string | null) {
    const contenuToken = {
      utilisateur_id: utilisateur.id,
      role: utilisateur.role,
      email: utilisateur.email,
      ecole_courant_id: ecoleId,
      schema_courant: schemaNom,
    };

    const accessToken = this.jwtService.sign(contenuToken, {
      expiresIn: process.env.DUREE_ACCESS_TOKEN || '15m',
      secret: process.env.SECRET_JWT,
    });

    const refreshToken = uuid();
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 30);

    // Stocker ecole_id + schema_nom dans le token de rafraîchissement (fix B2)
    await this.prisma.tokenRafraichissement.create({
      data: {
        token: refreshToken,
        utilisateur_id: utilisateur.id,
        expire_le: dateExpiration,
        ecole_id: ecoleId,
        schema_nom: schemaNom,
      },
    });

    return {
      access_token: accessToken,
      token_rafraichissement: refreshToken,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      ecole_courante: ecoleId ? { id: ecoleId, schema: schemaNom } : null,
    };
  }
}
