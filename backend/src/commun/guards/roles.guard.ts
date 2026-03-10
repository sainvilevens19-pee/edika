import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorateurs/roles.decorateur';

/**
 * RolesGuard — vérifie que l'utilisateur courant possède l'un des rôles requis.
 *
 * Fonctionnement :
 * - Si aucun @Roles() n'est déclaré sur la route → accès autorisé (route publique ou
 *   accessible à tout utilisateur authentifié, le middleware JWT gère déjà l'auth).
 * - Si @Roles() est présent → req.utilisateur.role doit figurer dans la liste.
 * - Si req.utilisateur est absent (route publique contournant le middleware) → retourne
 *   true car aucun rôle n'est requis dans ce cas (contrôlé par la première condition).
 * - NestJS retourne automatiquement 403 Forbidden quand canActivate() retourne false.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequis = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Aucun rôle déclaré → pas de restriction
    if (!rolesRequis || rolesRequis.length === 0) {
      return true;
    }

    const requete = context.switchToHttp().getRequest();
    const utilisateur = requete.utilisateur;

    // Pas d'utilisateur (route publique) → refuser si des rôles sont exigés
    if (!utilisateur) {
      return false;
    }

    return rolesRequis.includes(utilisateur.role);
  }
}
