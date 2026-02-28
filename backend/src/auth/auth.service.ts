import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../commun/prisma/prisma.service';
import { ConnexionDto, ChangerEcoleDto, RafraichirTokenDto } from './auth.dto';

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async connexion(dto: ConnexionDto) {
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
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const motDePasseValide = await bcrypt.compare(dto.mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniere_connexion: new Date() },
    });

    if (utilisateur.role === 'SUPER_ADMIN') {
      return this.genererTokens(utilisateur, null, null);
    }

    if (utilisateur.role === 'ADMIN_ECOLE') {
      const ecole = await this.prisma.ecole.findFirst({
        where: { admin_utilisateur_id: utilisateur.id, statut: 'ACTIVE' },
      });
      if (!ecole) throw new UnauthorizedException('Aucune école associée à ce compte');
      return this.genererTokens(utilisateur, ecole.id, ecole.schema_nom);
    }

    if (utilisateur.role === 'PROFESSEUR') {
      const ecoles = utilisateur.professeur?.affectations.map(a => ({
        id: a.ecole.id,
        nom: a.ecole.nom,
        slug: a.ecole.slug,
        schema_nom: a.ecole.schema_nom,
      })) || [];

      if (ecoles.length === 0) throw new UnauthorizedException("Vous n'êtes affilié à aucune école");
      if (ecoles.length === 1) return this.genererTokens(utilisateur, ecoles[0].id, ecoles[0].schema_nom);

      if (!dto.ecole_id) {
        return { choix_ecole_requis: true, ecoles, message: 'Veuillez choisir une école' };
      }

      const ecoleChoisie = ecoles.find(e => e.id === dto.ecole_id);
      if (!ecoleChoisie) throw new UnauthorizedException("Vous n'êtes pas affilié à cette école");
      return this.genererTokens(utilisateur, ecoleChoisie.id, ecoleChoisie.schema_nom);
    }

    if (utilisateur.role === 'PARENT') {
      return this.genererTokens(utilisateur, null, null);
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
    if (!affectation) throw new UnauthorizedException("Vous n'êtes pas affilié à cette école");
    return this.genererTokens(utilisateur, affectation.ecole.id, affectation.ecole.schema_nom);
  }

  async rafraichirToken(dto: RafraichirTokenDto) {
    const tokenEnBase = await this.prisma.tokenRafraichissement.findUnique({
      where: { token: dto.token_rafraichissement },
      include: { utilisateur: true },
    });

    if (!tokenEnBase || tokenEnBase.revoque) throw new UnauthorizedException('Token invalide');
    if (tokenEnBase.expire_le < new Date()) throw new UnauthorizedException('Token expiré');

    let ancienContenu: any;
    try {
      ancienContenu = this.jwtService.verify(dto.token_rafraichissement, {
        secret: process.env.SECRET_JWT,
        ignoreExpiration: true,
      });
    } catch {
      throw new UnauthorizedException('Token invalide');
    }

    await this.prisma.tokenRafraichissement.update({
      where: { id: tokenEnBase.id },
      data: { revoque: true },
    });

    return this.genererTokens(
      tokenEnBase.utilisateur,
      ancienContenu.ecole_courant_id || null,
      ancienContenu.schema_courant || null,
    );
  }

  async deconnexion(tokenRafraichissement: string) {
    await this.prisma.tokenRafraichissement.updateMany({
      where: { token: tokenRafraichissement },
      data: { revoque: true },
    });
    return { message: 'Déconnexion réussie' };
  }

  private async genererTokens(utilisateur: any, ecoleId: string | null, schemaNom: string | null) {
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

    await this.prisma.tokenRafraichissement.create({
      data: {
        token: refreshToken,
        utilisateur_id: utilisateur.id,
        expire_le: dateExpiration,
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