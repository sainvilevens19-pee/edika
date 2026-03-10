import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './commun/prisma/prisma.module';
import { JournalModule } from './journal/journal.module';
import { AuthModule } from './auth/auth.module';
import { EcolesModule } from './ecoles/ecoles.module';
import { ProfesseursModule } from './professeurs/professeurs.module';
import { ElevesModule } from './eleves/eleves.module';
import { ClassesModule } from './classes/classes.module';
import { MatieresModule } from './matieres/matieres.module';
import { AnneesScolairesModule } from './annees-scolaires/annees-scolaires.module';
import { AffectationsModule } from './affectations/affectations.module';
import { RolesGuard } from './commun/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JournalModule,            // Global — JournalService disponible dans tous les modules
    AuthModule,
    EcolesModule,
    ProfesseursModule,
    ElevesModule,
    ClassesModule,
    MatieresModule,
    AnneesScolairesModule,    // Sprint 1 — gestion des années scolaires
    AffectationsModule,       // Sprint 1 — affectations prof ↔ classe ↔ matière
  ],
  providers: [
    // RolesGuard enregistré globalement — s'applique à toutes les routes.
    // Les routes sans @Roles() sont accessibles à tout utilisateur authentifié.
    // Les routes publiques contournent déjà le middleware JWT (req.utilisateur = undefined)
    // → le guard retourne true si aucun @Roles() n'est déclaré.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
