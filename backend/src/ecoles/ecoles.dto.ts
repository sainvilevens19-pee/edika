import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class InscriptionEcoleDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom de l'école est obligatoire" })
  nom: string;

  @IsString()
  @IsNotEmpty({ message: "Le slug est obligatoire" })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets',
  })
  slug: string; // ex: "saint-pierre"

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  directeur_nom?: string;

  @IsString()
  @IsNotEmpty({ message: "L'année scolaire est obligatoire" })
  @Matches(/^\d{4}-\d{4}$/, {
    message: "Format année scolaire invalide. Exemple: 2024-2025",
  })
  annee_scolaire: string;

  // Compte admin de l'école
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'administrateur est obligatoire' })
  admin_nom: string;

  @IsString()
  @IsNotEmpty({ message: 'Le prénom de l\'administrateur est obligatoire' })
  admin_prenom: string;

  @IsEmail({}, { message: 'Email administrateur invalide' })
  @IsNotEmpty({ message: "L'email de l'administrateur est obligatoire" })
  admin_email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  admin_mot_de_passe: string;
}
