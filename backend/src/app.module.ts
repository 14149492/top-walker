import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { CatalogModule } from './catalog/catalog.module';
@Module({ imports: [DatabaseModule, CatalogModule], controllers: [HealthController] })
export class AppModule {}
