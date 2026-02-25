/**
 * Generates extension PNG icons from the master SVG source.
 * Edit icons/icon.svg to change the design, then run: node create-icons.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'icons', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [16, 48, 128];

for (const size of sizes) {
  const outPath = join(__dirname, 'icons', `icon${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`Created icons/icon${size}.png`);
}

console.log('All icons created successfully!');
