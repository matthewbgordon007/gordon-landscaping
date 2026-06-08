// One-off image optimizer. Reads a newline-delimited list of image paths,
// resizes + recompresses them in place with sharp (reliable color handling).
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const listFile = process.argv[2];
if (!listFile) {
  console.error("Usage: node scripts/optimize-images.js <list-file>");
  process.exit(1);
}

const files = fs
  .readFileSync(listFile, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  let ok = 0;
  let skipped = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) {
      skipped++;
      continue;
    }
    const isGallery = file.includes("/gallery/");
    const maxDim = isGallery ? 1600 : 1920;
    try {
      const input = fs.readFileSync(file);
      const output = await sharp(input)
        .rotate() // honor EXIF orientation
        .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72, mozjpeg: true })
        .toColourspace("srgb")
        .toBuffer();
      fs.writeFileSync(file, output);
      ok++;
    } catch (err) {
      console.error("FAILED:", file, err.message);
    }
  }
  console.log(`Optimized ${ok} images, skipped ${skipped} missing.`);
})();
