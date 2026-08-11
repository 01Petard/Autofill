import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("dist");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const required = new Set([
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action.default_icon ?? {}),
  "content.js",
  "_locales/en/messages.json",
  "_locales/zh_CN/messages.json"
]);
const files = [];

async function walk(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(resolve(directory, entry.name), relative);
    else files.push(relative);
  }
}

await walk(root);
for (const file of required) {
  if (!files.includes(file)) throw new Error(`Missing release file: ${file}`);
}
if (manifest.version !== packageJson.version) throw new Error("Manifest and package versions differ");
const prohibited = files.filter((file) => file.endsWith(".DS_Store") || file.endsWith(".map") || /(^|\/)\.env($|\.)/.test(file));
if (prohibited.length) throw new Error(`Prohibited release artifacts: ${prohibited.join(", ")}`);

for (const file of files.filter((name) => /\.(?:js|html|json|css)$/.test(name))) {
  const content = await readFile(resolve(root, file), "utf8");
  if (/\bsk-[A-Za-z0-9_-]{20,}\b/.test(content)) throw new Error(`Possible API key in ${file}`);
}

console.log(`Release validation passed: ${files.length} files`);
