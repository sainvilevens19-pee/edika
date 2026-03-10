import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MatieresService, CreerMatiereDto } from './matieres.service';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('matieres')
export class MatieresControleur {
  constructor(private readonly matieresService: MatieresService) {}

  // ─────────────────────────────────────────
  // GET /matieres
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async listerMatieres(
    @Req() req: Request,
    @Query('niveau') niveau?: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.matieresService.listerMatieres(pool, schemaNom, { niveau });
  }

  // ─────────────────────────────────────────
  // POST /matieres
  // ─────────────────────────────────────────
  @Post()
  @Roles('ADMIN_ECOLE')
  async creerMatiere(
    @Req() req: Request,
    @Body() dto: CreerMatiereDto,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.matieresService.creerMatiere(pool, schemaNom, dto);
  }

  // ─────────────────────────────────────────
  // PATCH /matieres/:id
  // ─────────────────────────────────────────
  @Patch(':id')
  @Roles('ADMIN_ECOLE')
  async modifierMatiere(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() donnees: Partial<CreerMatiereDto>,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.matieresService.modifierMatiere(pool, schemaNom, id, donnees);
  }
}
