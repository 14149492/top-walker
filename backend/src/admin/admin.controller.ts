import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, OriginGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';
import { AdminQueryDto, CategoryDto, DeleteProductDto, ProductDto, PublicationDto } from './product.dto';

@Controller('admin')
@UseGuards(AdminGuard, OriginGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('products') list(@Query() query: AdminQueryDto) { return this.admin.list(query.q); }
  @Get('products/:id') detail(@Param('id') id: string) { return this.admin.detail(id); }
  @Post('products') create(@Body() body: ProductDto) { return this.admin.create(body); }
  @Put('products/:id') update(@Param('id') id: string, @Body() body: ProductDto) { return this.admin.update(id, body); }
  @Delete('products/:id') remove(@Param('id') id: string, @Body() body: DeleteProductDto) { return this.admin.remove(id, body.version); }
  @Patch('products/:id/publication') publish(@Param('id') id: string, @Body() body: PublicationDto) { return this.admin.publish(id, body); }
  @Get('categories') categories() { return this.admin.categories(); }
  @Post('categories') category(@Body() body: CategoryDto) { return this.admin.createCategory(body.name); }
}
