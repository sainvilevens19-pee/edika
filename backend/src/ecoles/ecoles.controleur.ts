import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EcolesService } from './ecoles.service';
import { InscriptionEcoleDto } from './ecoles.dto';

@Controller('ecoles')
export class EcolesControleur {

  constructor(private readonly ecolesService: EcolesService) {}

  // POST /api/v1/ecoles/inscription
  // Route publique — une école s'inscrit sur la plateforme
  @Post('inscription')
  @HttpCode(HttpStatus.CREATED)
  async inscrireEcole(@Body() dto: InscriptionEcoleDto) {
    return this.ecolesService.inscrireEcole(dto);
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
  // Réservé Super Admin — liste toutes les écoles
  @Get()
  async listerEcoles() {
    return this.ecolesService.listerEcoles();
  }
}
