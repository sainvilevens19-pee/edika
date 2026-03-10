import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesControleur } from './classes.controleur';

@Module({
  controllers: [ClassesControleur],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
