import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfesseursService, CreerProfesseurDto } from './professeurs.service';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('professeurs')
export class ProfesseursControleur {
  constructor(private readonly professeursService: ProfesseursService) {}

  // ─────────────────────────────────────────
  // GET /professeurs
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE')
  async listerProfesseurs(@Req() req: Request) {
    const ecoleId = (req as any).utilisateur?.ecole_courant_id;
    return this.professeursService.listerProfesseurs(ecoleId);
  }

  // ─────────────────────────────────────────
  // POST /professeurs
  // ─────────────────────────────────────────
  @Post()
  @Roles('ADMIN_ECOLE')
  async creerProfesseur(
    @Req() req: Request,
    @Body() dto: CreerProfesseurDto,
  ) {
    const ecoleId = (req as any).utilisateur?.ecole_courant_id;
    return this.professeursService.creerProfesseur(ecoleId, dto);
  }

  // ─────────────────────────────────────────
  // PATCH /professeurs/:id
  // ─────────────────────────────────────────
  @Patch(':id')
  @Roles('ADMIN_ECOLE')
  async modifierProfesseur(
    @Param('id') id: string,
    @Body() donnees: Partial<CreerProfesseurDto>,
  ) {
    return this.professeursService.modifierProfesseur(id, donnees);
  }

  // ─────────────────────────────────────────
  // DELETE /professeurs/:id  → désaffectation
  // ─────────────────────────────────────────
  @Delete(':id')
  @Roles('ADMIN_ECOLE')
  async desactiverProfesseur(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const ecoleId = (req as any).utilisateur?.ecole_courant_id;
    return this.professeursService.desactiverProfesseur(id, ecoleId);
  }
}
