import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ElevesService } from './eleves.service';
import { Pool } from 'pg';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('eleves')
export class ElevesControleur {

  constructor(private readonly elevesService: ElevesService) {}

  private obtenirPool(req: Request): Pool {
    return req.connexion_tenant as Pool;
  }

  private obtenirSchema(req: Request): string {
    return req.utilisateur?.schema_courant as string;
  }

  // ─────────────────────────────────────────
  // POST /eleves
  // ─────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN_ECOLE', 'SECRETAIRE')
  async inscrireEleve(@Req() req: Request, @Body() dto: any) {
    return this.elevesService.inscrireEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      dto,
    );
  }

  // ─────────────────────────────────────────
  // GET /eleves
  // ─────────────────────────────────────────
  @Get()
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR')
  async listerEleves(
    @Req() req: Request,
    @Query('classe_id') classeId?: string,
    @Query('annee_scolaire') anneeScolaire?: string,
    @Query('statut') statut?: string,
  ) {
    return this.elevesService.listerEleves(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      { classe_id: classeId, annee_scolaire: anneeScolaire, statut },
    );
  }

  // ─────────────────────────────────────────
  // GET /eleves/:id
  // PARENT : vérifie liaison avant accès
  // ─────────────────────────────────────────
  @Get(':id')
  @Roles('ADMIN_ECOLE', 'SECRETAIRE', 'PROFESSEUR', 'PARENT')
  async obtenirEleve(@Req() req: Request, @Param('id') id: string) {
    const utilisateur = req.utilisateur!;

    // Sécurité PARENT : vérifier la liaison avant tout accès
    if (utilisateur.role === 'PARENT') {
      const aAcces = await this.elevesService.verifierLiaisonParent(
        utilisateur.id,
        id,
      );
      if (!aAcces) {
        throw new ForbiddenException(
          "Accès refusé : aucune liaison validée entre ce parent et cet élève. " +
          "Contactez l'administration de l'école pour obtenir un code dossier.",
        );
      }
      return this.elevesService.obtenirEleveParent(utilisateur.id, id);
    }

    return this.elevesService.obtenirEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
    );
  }

  // ─────────────────────────────────────────
  // PATCH /eleves/:id
  // ─────────────────────────────────────────
  @Patch(':id')
  @Roles('ADMIN_ECOLE', 'SECRETAIRE')
  async modifierEleve(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.elevesService.modifierEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
      dto,
    );
  }

  // ─────────────────────────────────────────
  // PATCH /eleves/:id/valider
  // EN_ATTENTE → VALIDE (validé par ADMIN_ECOLE)
  // ─────────────────────────────────────────
  @Patch(':id/valider')
  @Roles('ADMIN_ECOLE')
  async validerEleve(@Req() req: Request, @Param('id') id: string) {
    return this.elevesService.validerEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
    );
  }

  // ─────────────────────────────────────────
  // PATCH /eleves/:id/activer
  // VALIDE → ACTIF + création compte Utilisateur (par ADMIN_ECOLE)
  // ─────────────────────────────────────────
  @Patch(':id/activer')
  @Roles('ADMIN_ECOLE')
  async activerEleve(@Req() req: Request, @Param('id') id: string) {
    const ecoleId = (req as any).utilisateur?.ecole_courant_id;
    return this.elevesService.activerEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
      ecoleId,
    );
  }
}
