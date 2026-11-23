import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsString, Length, MaxLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AdminGuard, OriginGuard } from './auth.guard';
import { AuthService, SESSION_COOKIE, sessionOptions } from './auth.service';

class LoginDto {
  @IsString() @Length(1, 254) identifier!: string;
  @IsString() @Length(1, 128) @MaxLength(128) password!: string;
}
class ChangePasswordDto {
  @IsString() @Length(1, 128) currentPassword!: string;
  @IsString() @Length(8, 128) newPassword!: string;
}
@Controller('auth')
@UseGuards(OriginGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @HttpCode(200)
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.identifier, body.password, req.ip || 'unknown', req.headers.cookie);
    res.cookie(SESSION_COOKIE, result.token, { ...sessionOptions(), expires: result.expiresAt });
    return result.user;
  }
  @Post('logout') @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.headers.cookie);
    res.clearCookie(SESSION_COOKIE, sessionOptions());
    return { message: 'Sesión cerrada.' };
  }
  @Get('me') @UseGuards(AdminGuard)
  me(@Req() req: Request) { return this.auth.current(req.headers.cookie); }
  @Post('change-password') @HttpCode(200) @UseGuards(AdminGuard)
  changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
    return this.auth.changePassword(req.headers.cookie, body.currentPassword, body.newPassword);
  }
}
