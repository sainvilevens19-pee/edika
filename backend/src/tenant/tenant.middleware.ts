import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Pool } from 'pg';

declare global {
  namespace Express {
    interface Request {
      utilisateur?: {
        id: string;
        role: string;
        email: string;
        schema_courant?: string;
        ecole_id?: string;
      };
      connexion_tenant?: Pool;
    }
  }
}

/**
 * TenantMiddleware — authentification JWT et injection du contexte tenant.
 *
 * Responsabilités :
 * 1. Laisser passer les routes publiques sans vérification
 * 2. Lire le token depuis le cookie httpOnly `access_token` (priorité)
 *    ou depuis l'en-tête `Authorization: Bearer` (fallback pour clients API)
 * 3. Vérifier et décoder le JWT
 * 4. Injecter req.utilisateur avec les données du token
 * 5. Injecter req.connexion_tenant (Pool pg) si l'utilisateur a un schéma tenant
 *
 * Note : la vérification des rôles est déléguée au RolesGuard (@Roles() decorator).
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ROUTES_PUBLIQUES = [
      '/api/v1/auth/connexion',
      '/auth/connexion',
      '/auth/rafraichir',
      '/auth/deconnexion',
      '/ecoles/inscription',
      '/ecoles/verifier-slug',
    ];

    const estPublique =
      ROUTES_PUBLIQUES.some(
        (route) =>
          req.path === route ||
          req.url === route ||
          req.originalUrl === route,
      ) ||
      req.originalUrl.startsWith('/api/v1/ecoles/connexion/') ||
      req.path.startsWith('/ecoles/connexion/');

    if (estPublique) {
      return next();
    }

    // Lire le token depuis le cookie httpOnly (priorité) ou l'en-tête Bearer (fallback)
    const token =
      (req as any).cookies?.['access_token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      const contenu = jwt.verify(token, process.env.SECRET_JWT!) as any;

      req.utilisateur = {
        id: contenu.utilisateur_id,
        role: contenu.role,
        email: contenu.email,
        schema_courant: contenu.schema_courant ?? undefined,
        ecole_id: contenu.ecole_courant_id ?? undefined,
      };

      // Injecter le pool de connexion tenant si l'utilisateur a un schéma associé (fix B3)
      if (contenu.schema_courant) {
        req.connexion_tenant = new Pool({
          connectionString: process.env.BASE_URL_POSTGRES,
        });
      }

      next();
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
