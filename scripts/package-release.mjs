import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { zipSync } from "fflate";

const source = resolve("dist");
const manifest = JSON.parse(await readFile(resolve(source, "manifest.json"), "utf8"));
const entries = {};

async function collect(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute, relative);
    else entries[relative] = new Uint8Array(await readFile(absolute));
  }
}

await collect(source);
await mkdir(resolve("release"), { recursive: true });
const target = resolve("release", `axiom-autofill-${manifest.version}.zip`);
await writeFile(target, zipSync(entries, { level: 9 }));
console.log(target);
