import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
@Module({ imports: [DatabaseModule, CatalogModule, AuthModule, AdminModule, MediaModule], controllers: [HealthController] })
export class AppModule {}
