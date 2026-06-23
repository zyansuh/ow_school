import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public/images');

const TARGETS = [
  { dir: 'banners', maxWidth: 960, quality: 78 },
  { dir: 'mascots', maxWidth: 128, quality: 80 },
  { dir: 'logo', maxWidth: 256, quality: 82 },
];

async function optimizeDir(dir, maxWidth, quality) {
  const full = path.join(ROOT, dir);
  const files = await readdir(full);
  for (const file of files) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const input = path.join(full, file);
    const output = path.join(full, file.replace(/\.(png|jpe?g)$/i, '.webp'));
    const meta = await stat(input);
    await sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toFile(output);
    const outMeta = await stat(output);
    console.log(
      `${dir}/${file} ${(meta.size / 1024).toFixed(0)}KB → ${path.basename(output)} ${(outMeta.size / 1024).toFixed(0)}KB`,
    );
  }
}

for (const t of TARGETS) {
  await optimizeDir(t.dir, t.maxWidth, t.quality);
}

console.log('Done.');
