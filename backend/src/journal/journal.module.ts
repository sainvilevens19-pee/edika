import { Global, Module } from '@nestjs/common';
import { JournalService } from './journal.service';

/**
 * JournalModule — module global d'audit.
 * Déclaré @Global() pour que JournalService soit disponible dans tous les modules
 * sans import explicite.
 */
@Global()
@Module({
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
