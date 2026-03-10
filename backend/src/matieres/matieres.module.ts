import { Module } from '@nestjs/common';
import { MatieresService } from './matieres.service';
import { MatieresControleur } from './matieres.controleur';

@Module({
  controllers: [MatieresControleur],
  providers: [MatieresService],
  exports: [MatieresService],
})
export class MatieresModule {}
