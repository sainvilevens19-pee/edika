import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AnneesScolairesService, CreerAnneeScolaireDto } from './annees-scolaires.service';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('annees-scolaires')
export class AnneesScolairesControleur {
  constructor(private readonly anneesScolairesService: AnneesScolairesService) {}

  // ─────────────────────────────────────────
  // GET /annees-scolaires
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE')
  async listerAnnees(@Req() req: Request) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.anneesScolairesService.listerAnnees(pool, schemaNom);
  }

  // ─────────────────────────────────────────
  // POST /annees-scolaires
  // ─────────────────────────────────────────
  @Post()
  @Roles('ADMIN_ECOLE')
  async creerAnnee(
    @Req() req: Request,
    @Body() dto: CreerAnneeScolaireDto,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.anneesScolairesService.creerAnnee(pool, schemaNom, dto);
  }

  // ─────────────────────────────────────────
  // PATCH /annees-scolaires/:id/activer
  // ─────────────────────────────────────────
  @Patch(':id/activer')
  @Roles('ADMIN_ECOLE')
  async activerAnnee(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.anneesScolairesService.definirActive(pool, schemaNom, id);
  }

  // ─────────────────────────────────────────
  // GET /annees-scolaires/active
  // ─────────────────────────────────────────
  @Get('active')
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async obtenirActive(@Req() req: Request) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.anneesScolairesService.obtenirAnneeActive(pool, schemaNom);
  }
}
