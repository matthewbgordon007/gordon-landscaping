// Converts HEIC images that were mislabeled with a .jpg extension into real,
// optimized JPEGs. Decodes with heic-convert (pure JS), then resizes via sharp.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const heicConvert = require("heic-convert");

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/convert-heic.js <file1> <file2> ...");
  process.exit(1);
}

(async () => {
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error("MISSING:", file);
      continue;
    }
    const isGallery = file.includes("/gallery/");
    const maxDim = isGallery ? 1600 : 1920;
    try {
      const inputBuffer = fs.readFileSync(file);
      const jpegBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      const output = await sharp(jpegBuffer)
        .rotate()
        .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer();
      fs.writeFileSync(file, output);
      const kb = Math.round(output.length / 1024);
      console.log(`OK ${file} (${kb}KB)`);
    } catch (err) {
      console.error("FAILED:", file, err.message);
    }
  }
})();
