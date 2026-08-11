import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const outputDirectory = resolve("public/icons");
const sizes = [16, 32, 48, 128];
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#1f6feb"/>
  <path fill="#ffffff" fill-rule="evenodd" d="M24 98 54 28h19l31 70H84l-6-16H49l-6 16H24Zm32-33h16L64 44l-8 21Z"/>
  <circle cx="98" cy="30" r="17" fill="#2da44e"/>
  <path d="m89 30 6 6 12-13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all(sizes.map((size) => sharp(Buffer.from(svg))
  .resize(size, size)
  .png({ compressionLevel: 9 })
  .toFile(resolve(outputDirectory, `icon-${size}.png`))));
