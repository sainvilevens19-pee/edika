import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ClassesService, CreerClasseDto } from './classes.service';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('classes')
export class ClassesControleur {
  constructor(private readonly classesService: ClassesService) {}

  // ─────────────────────────────────────────
  // GET /classes
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async listerClasses(
    @Req() req: Request,
    @Query('annee_scolaire') annee_scolaire?: string,
    @Query('actif') actif?: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    const filtres: { annee_scolaire?: string; actif?: boolean } = {};
    if (annee_scolaire) filtres.annee_scolaire = annee_scolaire;
    if (actif !== undefined) filtres.actif = actif !== 'false';
    return this.classesService.listerClasses(pool, schemaNom, filtres);
  }

  // ─────────────────────────────────────────
  // POST /classes
  // ─────────────────────────────────────────
  @Post()
  @Roles('ADMIN_ECOLE')
  async creerClasse(
    @Req() req: Request,
    @Body() dto: CreerClasseDto,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.classesService.creerClasse(pool, schemaNom, dto);
  }

  // ─────────────────────────────────────────
  // GET /classes/:id
  // ─────────────────────────────────────────
  @Get(':id')
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async obtenirClasse(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.classesService.obtenirClasse(pool, schemaNom, id);
  }

  // ─────────────────────────────────────────
  // PATCH /classes/:id
  // ─────────────────────────────────────────
  @Patch(':id')
  @Roles('ADMIN_ECOLE')
  async modifierClasse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() donnees: Partial<CreerClasseDto>,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.classesService.modifierClasse(pool, schemaNom, id, donnees);
  }

  // ─────────────────────────────────────────
  // DELETE /classes/:id  → archivage (soft delete)
  // ─────────────────────────────────────────
  @Delete(':id')
  @Roles('ADMIN_ECOLE')
  async archiverClasse(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.classesService.archiverClasse(pool, schemaNom, id);
  }
}
