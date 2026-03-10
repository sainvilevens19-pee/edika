import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { EcolesService } from './ecoles.service';
import { InscriptionEcoleDto } from './ecoles.dto';
import { Roles } from '../commun/decorateurs/roles.decorateur';

@Controller('ecoles')
export class EcolesControleur {

  constructor(private readonly ecolesService: EcolesService) {}

  // POST /api/v1/ecoles/inscription
  // Route publique — une école s'inscrit sur la plateforme
  @Post('inscription')
  @HttpCode(HttpStatus.CREATED)
  async inscrireEcole(@Req() req: Request, @Body() dto: InscriptionEcoleDto) {
    const ipAdresse = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.ecolesService.inscrireEcole(dto, ipAdresse, userAgent);
  }

  // GET /api/v1/ecoles/verifier-slug?slug=saint-pierre
  // Route publique — vérifier si un slug est disponible
  @Get('verifier-slug')
  async verifierSlug(@Query('slug') slug: string) {
    return this.ecolesService.verifierSlug(slug);
  }

  // GET /api/v1/ecoles/connexion/:slug
  // Route publique — données de l'école pour la page de connexion
  @Get('connexion/:slug')
  async obtenirParSlug(@Param('slug') slug: string) {
    return this.ecolesService.obtenirParSlug(slug);
  }

  // GET /api/v1/ecoles
  // SUPER_ADMIN uniquement — liste toutes les écoles de la plateforme
  @Get()
  @Roles('SUPER_ADMIN')
  async listerEcoles(@Req() req: Request) {
    const utilisateurId = req.utilisateur?.id;
    const role = req.utilisateur?.role;
    return this.ecolesService.listerEcoles(utilisateurId, role);
  }
}
