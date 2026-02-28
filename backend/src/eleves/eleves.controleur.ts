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
} from '@nestjs/common';
import { Request } from 'express';
import { ElevesService } from './eleves.service';
import { Pool } from 'pg';

@Controller('eleves')
export class ElevesControleur {

  constructor(private readonly elevesService: ElevesService) {}

  private obtenirPool(req: Request): Pool {
    return (req as any).connexion_tenant as Pool;
  }

  private obtenirSchema(req: Request): string {
    return (req as any).utilisateur?.schema_courant as string;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async inscrireEleve(@Req() req: Request, @Body() dto: any) {
    return this.elevesService.inscrireEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      dto,
    );
  }

  @Get()
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

  @Get(':id')
  async obtenirEleve(@Req() req: Request, @Param('id') id: string) {
    return this.elevesService.obtenirEleve(
      this.obtenirPool(req),
      this.obtenirSchema(req),
      id,
    );
  }

  @Patch(':id')
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