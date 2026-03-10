import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConnexionDto, ChangerEcoleDto } from './auth.dto';
import { Roles } from '../commun/decorateurs/roles.decorateur';

/**
 * Options communes pour les cookies httpOnly.
 * - httpOnly: invisible au JavaScript (protège contre XSS)
 * - sameSite: 'strict' bloque les requêtes cross-site (CSRF)
 * - secure: true uniquement en production (HTTPS)
 */
const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: maxAgeMs,
});

@Controller('auth')
export class AuthControleur {

  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/connexion
  @Post('connexion')
  @HttpCode(HttpStatus.OK)
  async connexion(
    @Body() dto: ConnexionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAdresse = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];

    const resultat = await this.authService.connexion(dto, ipAdresse, userAgent);

    // Cas multi-écoles professeur → retourner la liste sans cookies
    if ((resultat as any).choix_ecole_requis) {
      return resultat;
    }

    const { access_token, token_rafraichissement, utilisateur, ecole_courante } = resultat as any;

    // Access token : 15 minutes
    res.cookie('access_token', access_token, cookieOptions(15 * 60 * 1000));
    // Refresh token : 30 jours
    res.cookie('refresh_token', token_rafraichissement, cookieOptions(30 * 24 * 60 * 60 * 1000));

    // Retourner uniquement les données non sensibles (pas les tokens)
    return { utilisateur, ecole_courante };
  }

  // POST /api/v1/auth/changer-ecole — PROFESSEUR uniquement
  @Post('changer-ecole')
  @HttpCode(HttpStatus.OK)
  @Roles('PROFESSEUR')
  async changerEcole(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: ChangerEcoleDto,
  ) {
    const resultat = await this.authService.changerEcole(req.utilisateur!.id, dto) as any;

    res.cookie('access_token', resultat.access_token, cookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', resultat.token_rafraichissement, cookieOptions(30 * 24 * 60 * 60 * 1000));

    return { utilisateur: resultat.utilisateur, ecole_courante: resultat.ecole_courante };
  }

  // POST /api/v1/auth/rafraichir — lit le refresh token depuis le cookie httpOnly
  @Post('rafraichir')
  @HttpCode(HttpStatus.OK)
  async rafraichirToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement manquant');
    }

    const resultat = await this.authService.rafraichirToken(refreshToken) as any;

    res.cookie('access_token', resultat.access_token, cookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', resultat.token_rafraichissement, cookieOptions(30 * 24 * 60 * 60 * 1000));

    return { utilisateur: resultat.utilisateur, ecole_courante: resultat.ecole_courante };
  }

  // POST /api/v1/auth/deconnexion
  @Post('deconnexion')
  @HttpCode(HttpStatus.OK)
  async deconnexion(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.['refresh_token'];
    const utilisateurId = req.utilisateur?.id;

    await this.authService.deconnexion(refreshToken ?? '', utilisateurId);

    // Supprimer les cookies côté client
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Déconnexion réussie' };
  }
}
