// Local staging only. Does not upload media or deploy the application.
import { readFile, copyFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "apps/web/public/media/product-demos");
const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/stage-product-demos.mjs /path/to/approved-video-collection");
const manifest = JSON.parse(await readFile(resolve(target, "manifest.json"), "utf8"));
// Validate every input before writing any destination.
for (const item of manifest) {
  const data = await readFile(resolve(source, item.source));
  if (data.length !== item.bytes || createHash("sha256").update(data).digest("hex") !== item.sha256)
    throw new Error(`Unapproved or changed media: ${item.source}`);
}
await mkdir(target, { recursive: true });
for (const item of manifest) await copyFile(resolve(source, item.source), resolve(target, `${item.id}.mp4`));
console.log(`Staged ${manifest.length} hash-verified videos locally. Nothing published.`);
