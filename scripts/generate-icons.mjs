// Rasterize assets/icon.svg into PNGs that WXT picks up from public/icon/.
// Run with `pnpm icons`.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const sourcePath = resolve(root, 'assets', 'icon.svg');
const outDir = resolve(root, 'public', 'icon');
const sizes = [16, 32, 48, 128];

const svg = await readFile(sourcePath);
await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const outPath = resolve(outDir, `${size}.png`);
  const buffer = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(outPath, buffer);
  console.log(`wrote ${outPath} (${buffer.byteLength} bytes)`);
}
