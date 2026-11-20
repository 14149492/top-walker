import { Controller, Get, Param, ParseUUIDPipe, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AdminGuard, OriginGuard } from '../auth/auth.guard';
import { MediaService } from './media.service';

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}
  @Get('admin/media/config') @UseGuards(AdminGuard, OriginGuard)
  config() { return this.media.configuration(); }
  @Post('admin/media') @UseGuards(AdminGuard, OriginGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file?: Express.Multer.File) { return this.media.upload(file); }
  @Get('media/:id')
  async image(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request, @Res() res: Response) {
    const asset = await this.media.read(id, req.headers.cookie);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (asset.url) return res.redirect(asset.url);
    return res.type('image/webp').send(asset.buffer);
  }
}
