import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    context.switchToHttp().getResponse<Response>().setHeader('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    const allowed = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    if (req.headers.origin !== allowed || req.headers['x-topwalker-request'] !== '1') {
      throw new ForbiddenException('Origen de solicitud no autorizado.');
    }
    return true;
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!await this.auth.current(req.headers.cookie)) throw new UnauthorizedException('Inicia sesión para continuar.');
    context.switchToHttp().getResponse<Response>().setHeader('Cache-Control', 'no-store');
    return true;
  }
}
