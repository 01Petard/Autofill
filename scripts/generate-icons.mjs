import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const outputDirectory = resolve("public/icons");
const sourceIcon = resolve("src/assets/app-icon.png");
const sizes = [16, 32, 48, 128];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(sizes.map((size) => sharp(sourceIcon)
  .resize(size, size, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(resolve(outputDirectory, `icon-${size}.png`))));
