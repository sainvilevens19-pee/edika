import { Module } from '@nestjs/common';
import { ProfesseursService } from './professeurs.service';
import { ProfesseursControleur } from './professeurs.controleur';
import { PrismaModule } from '../commun/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfesseursControleur],
  providers: [ProfesseursService],
  exports: [ProfesseursService],
})
export class ProfesseursModule {}
