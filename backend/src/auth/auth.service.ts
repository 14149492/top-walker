import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, verifyPassword } from './password';

export const SESSION_COOKIE = 'topwalker_session';
export const sessionOptions = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production', path: '/' });
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const publicUser = { id: true, username: true, email: true, displayName: true } as const;

@Injectable()
export class AuthService {
  private dummy = hashPassword(randomBytes(32).toString('hex'));
  constructor(private readonly db: PrismaService) {}

  token(cookie?: string) {
    const value = cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
  }
  async current(cookie?: string) {
    const token = this.token(cookie);
    if (!token) return null;
    const session = await this.db.adminSession.findUnique({ where: { tokenHash: digest(token) }, include: { user: { select: { ...publicUser, active: true } } } });
    if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
    const { active: _active, ...user } = session.user;
    void _active;
    return user;
  }
  private async rateLimit(key: string, maximum: number) {
    const now = new Date();
    await this.db.loginAttempt.deleteMany({ where: { expiresAt: { lte: now } } });
    const attempt = await this.db.loginAttempt.upsert({
      where: { key: digest(key) },
      create: { key: digest(key), expiresAt: new Date(now.getTime() + 15 * 60 * 1000) },
      update: { count: { increment: 1 } },
    });
    if (attempt.count > maximum) throw new HttpException('Demasiados intentos. Espera 15 minutos antes de volver a intentar.', 429);
  }
  async login(identifier: string, password: string, ip: string, previousCookie?: string) {
    const normalized = identifier.trim().toLowerCase();
    await this.rateLimit(`ip:${ip}`, 60);
    await this.rateLimit(`identity:${normalized}`, 8);
    const user = await this.db.adminUser.findFirst({ where: { OR: [{ email: normalized }, { username: normalized }] } });
    const valid = await verifyPassword(password, user?.passwordHash || await this.dummy);
    if (!valid || !user?.active) throw new UnauthorizedException('Correo, usuario o contraseña incorrectos.');
    await this.db.loginAttempt.deleteMany({ where: { key: digest(`identity:${normalized}`) } });
    await this.logout(previousCookie);
    await this.db.adminSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await this.db.adminSession.create({ data: { tokenHash: digest(token), userId: user.id, expiresAt } });
    return { token, expiresAt, user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName } };
  }
  async logout(cookie?: string) {
    const token = this.token(cookie);
    if (token) await this.db.adminSession.deleteMany({ where: { tokenHash: digest(token) } });
  }
}
