import { Module } from '@nestjs/common';
import { ElevesService } from './eleves.service';
import { ElevesControleur } from './eleves.controleur';

@Module({
  controllers: [ElevesControleur],
  providers: [ElevesService],
  exports: [ElevesService],
})
export class ElevesModule {}
