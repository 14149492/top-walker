import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'topwalker-backend', database: 'connected' };
    } catch { throw new ServiceUnavailableException('Base de datos no disponible'); }
  }
}
