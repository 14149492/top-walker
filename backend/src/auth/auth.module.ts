import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminGuard, OriginGuard } from './auth.guard';
@Module({ providers: [AuthService, AdminGuard, OriginGuard], controllers: [AuthController], exports: [AuthService, AdminGuard, OriginGuard] })
export class AuthModule {}
