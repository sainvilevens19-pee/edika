import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConnexionDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  mot_de_passe: string;

  // Optionnel — pour le professeur multi-écoles qui choisit son école
  @IsOptional()
  @IsString()
  ecole_id?: string;
}

export class ChangerEcoleDto {
  @IsString()
  @IsNotEmpty({ message: "L'identifiant de l'école est obligatoire" })
  ecole_id: string;
}

// RafraichirTokenDto supprimé : le refresh token transite désormais
// uniquement via le cookie httpOnly `refresh_token`, pas dans le corps de la requête.
