import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

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
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {

    // DÉBOGAGE — voir exactement quel chemin arrive
    console.log('MIDDLEWARE PATH:', req.path);
    console.log('MIDDLEWARE URL:', req.url);
    console.log('MIDDLEWARE ORIGINALURL:', req.originalUrl);

    const ROUTES_PUBLIQUES = [
      '/api/v1/auth/connexion',
      '/auth/connexion',
      '/auth/rafraichir',
      '/auth/deconnexion',
      '/ecoles/inscription',
      '/ecoles/verifier-slug',
    ];

    const estPublique = ROUTES_PUBLIQUES.some(route =>
      req.path === route ||
      req.url === route ||
      req.originalUrl === route ||
      req.originalUrl.startsWith('/api/v1/ecoles/connexion/') ||
      req.path.startsWith('/ecoles/connexion/')
    );

    console.log('EST PUBLIQUE:', estPublique);

    if (estPublique) {
      return next();
    }

    const entete = req.headers.authorization;
    if (!entete || !entete.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = entete.split(' ')[1];

    try {
      const contenu = jwt.verify(token, process.env.SECRET_JWT!) as any;
      req.utilisateur = {
        id: contenu.utilisateur_id,
        role: contenu.role,
        email: contenu.email,
        schema_courant: contenu.schema_courant,
        ecole_id: contenu.ecole_courant_id,
      };
      next();
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}