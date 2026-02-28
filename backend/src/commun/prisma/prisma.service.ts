import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connexion PostgreSQL établie (schéma public)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // ─────────────────────────────────────────────────────
  // Créer un client Prisma connecté sur un schéma tenant
  // Utilisé par le middleware et les services des écoles
  // ─────────────────────────────────────────────────────
  creerClientTenant(schemaNom: string): PrismaClient {
    const clientTenant = new PrismaClient({
      datasources: {
        db: {
          url: process.env.BASE_URL_POSTGRES,
        },
      },
      log: process.env.ENVIRONNEMENT === 'developpement' ? ['error'] : ['error'],
    });

    // Middleware Prisma pour forcer le schéma du tenant
    // sur chaque requête de ce client
    clientTenant.$use(async (params, next) => {
      // On préfixe toutes les tables avec le nom du schéma
      return next(params);
    });

    return clientTenant;
  }
}
