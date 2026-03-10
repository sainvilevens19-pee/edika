import { Module } from '@nestjs/common';
import { AnneesScolairesService } from './annees-scolaires.service';
import { AnneesScolairesControleur } from './annees-scolaires.controleur';

@Module({
  controllers: [AnneesScolairesControleur],
  providers: [AnneesScolairesService],
  exports: [AnneesScolairesService],
})
export class AnneesScolairesModule {}
