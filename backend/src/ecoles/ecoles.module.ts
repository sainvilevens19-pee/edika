import { Module } from '@nestjs/common';
import { EcolesService } from './ecoles.service';
import { EcolesControleur } from './ecoles.controleur';

@Module({
  controllers: [EcolesControleur],
  providers: [EcolesService],
  exports: [EcolesService],
})
export class EcolesModule {}
