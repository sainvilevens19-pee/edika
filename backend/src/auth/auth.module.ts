import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthControleur } from './auth.controleur';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SECRET_JWT,
      signOptions: {
        expiresIn: process.env.DUREE_ACCESS_TOKEN || '15m',
      },
    }),
  ],
  controllers: [AuthControleur],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
