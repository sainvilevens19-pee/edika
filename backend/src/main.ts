import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function demarrer() {
  const app = await NestFactory.create(AppModule);

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api/v1');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Ignorer les champs non déclarés dans le DTO
      forbidNonWhitelisted: true,// Rejeter les requêtes avec des champs inconnus
      transform: true,           // Transformer automatiquement les types
    }),
  );

  // Autoriser les requêtes du frontend
  app.enableCors({
    origin: process.env.URL_FRONTEND || 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT_BACKEND || 3000;
  await app.listen(port);

  console.log(`✅ Backend démarré sur http://localhost:${port}/api/v1`);
  console.log(`🌍 Environnement : ${process.env.ENVIRONNEMENT || 'developpement'}`);
}

demarrer();
