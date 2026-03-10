import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AffectationsService, CreerAffectationDto } from './affectations.service';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('affectations')
export class AffectationsControleur {
  constructor(private readonly affectationsService: AffectationsService) {}

  // ─────────────────────────────────────────
  // GET /affectations
  // PROFESSEUR : filtre automatique sur son propre professeur_id
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async listerAffectations(
    @Req() req: Request,
    @Query('annee_scolaire') annee_scolaire?: string,
    @Query('professeur_id') professeur_id?: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    const utilisateur = (req as any).utilisateur;

    const filtres: { annee_scolaire?: string; professeur_id?: string } = {};
    if (annee_scolaire) filtres.annee_scolaire = annee_scolaire;

    // PROFESSEUR : restreindre aux affectations qui lui appartiennent
    if (utilisateur?.role === 'PROFESSEUR') {
      filtres.professeur_id = utilisateur.professeur_id || professeur_id;
    } else if (professeur_id) {
      filtres.professeur_id = professeur_id;
    }

    return this.affectationsService.listerAffectations(pool, schemaNom, filtres);
  }

  // ─────────────────────────────────────────
  // POST /affectations
  // ─────────────────────────────────────────
  @Post()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE')
  async creerAffectation(
    @Req() req: Request,
    @Body() dto: CreerAffectationDto,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.affectationsService.creerAffectation(pool, schemaNom, dto);
  }

  // ─────────────────────────────────────────
  // DELETE /affectations/:id
  // ─────────────────────────────────────────
  @Delete(':id')
  @Roles('ADMIN_ECOLE')
  async supprimerAffectation(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const pool = (req as any).connexion_tenant;
    const schemaNom = (req as any).utilisateur?.schema_courant;
    return this.affectationsService.supprimerAffectation(pool, schemaNom, id);
  }
}
