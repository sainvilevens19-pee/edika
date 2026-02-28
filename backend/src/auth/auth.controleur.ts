import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { ConnexionDto, ChangerEcoleDto, RafraichirTokenDto } from './auth.dto';

@Controller('auth')
export class AuthControleur {

  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/connexion
  @Post('connexion')
  @HttpCode(HttpStatus.OK)
  async connexion(@Body() dto: ConnexionDto) {
    return this.authService.connexion(dto);
  }

  // POST /api/v1/auth/changer-ecole
  // Pour le professeur multi-écoles
  @Post('changer-ecole')
  @HttpCode(HttpStatus.OK)
  async changerEcole(@Req() req: Request, @Body() dto: ChangerEcoleDto) {
    return this.authService.changerEcole(req.utilisateur!.id, dto);
  }

  // POST /api/v1/auth/rafraichir
  @Post('rafraichir')
  @HttpCode(HttpStatus.OK)
  async rafraichirToken(@Body() dto: RafraichirTokenDto) {
    return this.authService.rafraichirToken(dto);
  }

  // POST /api/v1/auth/deconnexion
  @Post('deconnexion')
  @HttpCode(HttpStatus.OK)
  async deconnexion(@Body('token_rafraichissement') token: string) {
    return this.authService.deconnexion(token);
  }
}
