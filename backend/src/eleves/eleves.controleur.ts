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

  // POST /api/v1/eleves
  // ADMIN_ECOLE et SECRETAIRE uniquement
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

  // GET /api/v1/eleves
  // ADMIN_ECOLE, SECRETAIRE, PROFESSEUR — chacun voit les élèves de son école
  // Note : le filtrage par classe (professeur) sera ajouté en Sprint 1
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

  // GET /api/v1/eleves/:id
  // ADMIN_ECOLE, SECRETAIRE, PROFESSEUR, PARENT
  // Pour PARENT : vérifie qu'une liaison valide existe avant d'accéder aux données
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
      // Récupérer le schéma depuis la liaison (le parent n'a pas de schema_courant dans son JWT)
      return this.elevesService.obtenirEleveParent(utilisateur.id, id);
    }

    return this.elevesService.obtenirEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
    );
  }

  // PATCH /api/v1/eleves/:id
  // ADMIN_ECOLE et SECRETAIRE uniquement — les professeurs ne peuvent pas modifier un élève
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
}
