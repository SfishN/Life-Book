import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "basics", "assets", "room", "dark_rose");
const runtimeRoot = path.join(root, "public", "room");
const layerRoot = path.join(runtimeRoot, "layers");
const manifestPath = path.join(root, "src", "room", "roomLayers.json");
const compositePath = path.join(runtimeRoot, "room-composite.png");
const previewPath = path.join(sourceRoot, "current_layout_preview.webp");

await mkdir(layerRoot, { recursive: true });
const layers = JSON.parse(await readFile(manifestPath, "utf8"));
const compositeLayers = [];

for (const layer of layers) {
  if ("crop" in layer || "clipBelowLine" in layer) {
    throw new Error(`${layer.id}: crop metadata is no longer supported`);
  }
  const [left, top, width, height] = layer.target;
  const sourcePath = path.join(sourceRoot, layer.source);
  const metadata = await sharp(sourcePath).metadata();
  if ((metadata.width ?? 0) < width || (metadata.height ?? 0) < height) {
    throw new Error(`${sourcePath}: expected at least ${width} x ${height} pixels, got ${metadata.width} x ${metadata.height}`);
  }
  const resized = await sharp(sourcePath)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  compositeLayers.push({ input: resized, left, top });
  await copyFile(sourcePath, path.join(layerRoot, layer.file));
}

await sharp({
  create: { width: 1536, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite(compositeLayers)
  .flatten({ background: "#241626" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(compositePath);

await sharp(compositePath).webp({ quality: 92, effort: 6 }).toFile(previewPath);
console.log(path.relative(root, compositePath));
console.log(`Preserved ${layers.length} editable runtime layers in ${path.relative(root, layerRoot)}`);
