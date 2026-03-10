import { Module } from '@nestjs/common';
import { AffectationsService } from './affectations.service';
import { AffectationsControleur } from './affectations.controleur';

@Module({
  controllers: [AffectationsControleur],
  providers: [AffectationsService],
  exports: [AffectationsService],
})
export class AffectationsModule {}
