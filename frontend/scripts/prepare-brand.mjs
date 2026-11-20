// Deterministic favicon derived from the supplied logo. No redraw or distortion.
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/brand/top-walker-logo.png');
const target = path.join(root, 'public/brand/favicon.png');
sharp(source).trim({ background: '#ffffff', threshold: 10 }).resize(64, 64, { fit: 'contain', background: '#ffffff' }).png().toFile(target)
  .then(() => { if (!fs.existsSync(target)) throw new Error('Favicon was not generated'); console.log('Favicon generado conservando proporciones del logotipo.'); })
  .catch(() => { console.error('No se pudo generar el favicon.'); process.exitCode = 1; });
