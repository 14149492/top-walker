import { Body, Controller, Get, Module, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { AdminGuard, OriginGuard } from '../auth/auth.guard';
import { AnalyticsService } from './analytics.service';
import { EventDto, StatsQueryDto } from './analytics.dto';

@Controller()
@UseGuards(OriginGuard)
class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService, private readonly auth: AuthService) {}
  @Post('events') async record(@Body() body: EventDto, @Req() req: Request) {
    if (await this.auth.current(req.headers.cookie)) return { recorded: false };
    return this.analytics.record(body, req.ip || 'unknown');
  }
  @Get('admin/statistics') @UseGuards(AdminGuard)
  summary(@Query() query: StatsQueryDto) { return this.analytics.summary(query); }
}
@Module({ imports: [AuthModule], providers: [AnalyticsService], controllers: [AnalyticsController] })
export class AnalyticsModule {}
