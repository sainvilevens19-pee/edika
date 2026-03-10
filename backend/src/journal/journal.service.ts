import { Injectable } from '@nestjs/common';
import { PrismaService } from '../commun/prisma/prisma.service';

export interface DonneesJournal {
  utilisateur_id?: string;
  role?: string;
  action: string;
  entite?: string;
  entite_id?: string;
  details?: Record<string, unknown>;
  ip_adresse?: string;
  user_agent?: string;
}

/**
 * JournalService — audit log de toutes les actions sensibles du système.
 * Chaque action critique (connexion, création, suppression, accès restreint)
 * doit être journalisée pour assurer la traçabilité et la conformité.
 *
 * Actions actuellement journalisées :
 * - CONNEXION_SUCCES / CONNEXION_ECHEC
 * - DECONNEXION
 * - CREATION_ECOLE
 * - ACCES_LISTE_ECOLES
 */
@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async journaliser(donnees: DonneesJournal): Promise<void> {
    try {
      await this.prisma.journalAction.create({ data: donnees });
    } catch {
      // Le journal ne doit jamais faire échouer l'action principale
      // En production, remplacer par un logger structuré (ex: Winston, Pino)
    }
  }
}
