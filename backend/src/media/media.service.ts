import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MediaService {
  constructor(private readonly db: PrismaService, private readonly auth: AuthService) {}
  private get directory() { return process.env.UPLOAD_DIR || '/app/uploads'; }
  configuration() { return { provider: process.env.MEDIA_STORAGE || 'local', maxFiles: 8, maxBytes: 5 * 1024 * 1024 }; }
  async upload(file?: Express.Multer.File, stableId?: string) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.');
    let buffer: Buffer;
    try {
      const input = sharp(file.buffer, { limitInputPixels: 20_000_000, failOn: 'error' });
      const info = await input.metadata();
      if (!['jpeg', 'png', 'webp'].includes(info.format || '') || (info.pages || 1) > 1) throw new Error('Unsupported image');
      buffer = await input.rotate().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { throw new BadRequestException('El archivo no es una imagen válida o excede 20 megapíxeles.'); }
    const id = stableId || randomUUID();
    if (stableId && await this.db.mediaAsset.findUnique({ where: { id } })) return { id, url: `/api/media/${id}` };
    const provider = process.env.MEDIA_STORAGE || 'local';
    let storageKey = `${id}.webp`, remoteUrl: string | null = null;
    if (provider === 'cloudinary') {
      const cloud_name = process.env.CLOUDINARY_CLOUD_NAME, api_key = process.env.CLOUDINARY_API_KEY, api_secret = process.env.CLOUDINARY_API_SECRET;
      if (!cloud_name || !api_key || !api_secret) throw new ServiceUnavailableException('Cloudinary no está configurado. Contacta al responsable del sistema.');
      try {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ cloud_name, api_key, api_secret, resource_type: 'image', public_id: `topwalker/${id}`, overwrite: false, timeout: 30000 }, (error, result) => error || !result ? reject(error) : resolve(result));
          stream.end(buffer);
        });
        storageKey = result.public_id;
        remoteUrl = result.secure_url;
      } catch { throw new ServiceUnavailableException('No se pudo cargar la imagen a Cloudinary. Inténtalo de nuevo.'); }
    } else if (provider === 'local' && process.env.NODE_ENV !== 'production') {
      await mkdir(this.directory, { recursive: true });
      try { await writeFile(join(this.directory, storageKey), buffer, { flag: 'wx' }); }
      catch (error) {
        if (!stableId || (error as NodeJS.ErrnoException).code !== 'EEXIST' || !(await readFile(join(this.directory, storageKey))).equals(buffer)) throw error;
      }
    } else throw new ServiceUnavailableException('Configura Cloudinary para almacenar fotografías.');
    await this.db.mediaAsset.create({ data: { id, provider, storageKey, remoteUrl } });
    return { id, url: `/api/media/${id}` };
  }
  async read(id: string, cookie?: string) {
    const asset = await this.db.mediaAsset.findUnique({ where: { id }, include: { photos: { where: { product: { published: true, deletedAt: null } }, take: 1, select: { id: true } } } });
    if (!asset || (!asset.photos.length && !await this.auth.current(cookie))) throw new NotFoundException('Imagen no disponible.');
    if (asset.provider === 'cloudinary' && asset.remoteUrl?.startsWith('https://res.cloudinary.com/')) return { url: asset.remoteUrl };
    try { return { buffer: await readFile(join(this.directory, asset.storageKey)) }; }
    catch { throw new NotFoundException('Imagen no disponible.'); }
  }
}
