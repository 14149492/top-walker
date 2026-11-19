import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './catalog-query.dto';
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('products') list(@Query() query: CatalogQueryDto) { return this.catalog.list(query); }
  @Get('products/:slug') detail(@Param('slug') slug: string) { return this.catalog.detail(slug); }
  @Get('filters') filters() { return this.catalog.filters(); }
}
