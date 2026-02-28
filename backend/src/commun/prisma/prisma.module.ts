import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global permet d'utiliser PrismaService dans tous les modules
// sans avoir à le réimporter partout
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
