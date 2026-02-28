import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './commun/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EcolesModule } from './ecoles/ecoles.module';
import { ProfesseursModule } from './professeurs/professeurs.module';
import { ElevesModule } from './eleves/eleves.module';
import { ClassesModule } from './classes/classes.module';
import { MatieresModule } from './matieres/matieres.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EcolesModule,
    ProfesseursModule,
    ElevesModule,
    ClassesModule,
    MatieresModule,
  ],
})
export class AppModule {}