import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Décorateur @Roles(...) — restreint une route à un ou plusieurs rôles.
 * Usage : @Roles('SUPER_ADMIN') ou @Roles('ADMIN_ECOLE', 'SECRETAIRE')
 * Si aucun @Roles() n'est déclaré, la route est accessible à tout utilisateur authentifié.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
