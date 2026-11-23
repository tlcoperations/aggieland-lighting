// Data for /preview/. Loads src/_data/previewFixtures.json and fails the build with a
// clear message if an entry is incomplete, so a typo never ships a broken preview.
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..");
const fixtures = require("../_data/previewFixtures.json");

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function check(list) {
  const problems = [];
  const warnings = [];
  const ids = new Set();
  if (!Array.isArray(list) || !list.length) problems.push("previewFixtures.json must be a non-empty list");
  (list || []).forEach((f, i) => {
    const at = `previewFixtures.json entry ${i + 1}${f && f.id ? ` (${f.id})` : ""}`;
    if (!f.id || !/^[a-z0-9][a-z0-9-]*$/.test(f.id)) problems.push(`${at}: "id" must be lowercase letters, numbers and dashes`);
    if (ids.has(f.id)) problems.push(`${at}: duplicate id`);
    ids.add(f.id);
    if (!f.name) problems.push(`${at}: missing "name"`);
    for (const k of ["widthIn", "heightIn"]) {
      if (!(typeof f[k] === "number" && f[k] > 0)) problems.push(`${at}: "${k}" must be a number of inches greater than 0`);
    }
    for (const k of ["minHangHeightIn", "overallLengthIn"]) {
      if (f[k] !== undefined && !(typeof f[k] === "number" && f[k] > 0)) problems.push(`${at}: "${k}" must be a number greater than 0 (or left out)`);
    }
    if (!f.cutout || !f.cutout.startsWith("/images/preview/")) {
      problems.push(`${at}: "cutout" must be a path like /images/preview/${f.id || "your-product"}.png`);
    } else {
      const file = path.join(srcDir, f.cutout);
      if (!fs.existsSync(file)) problems.push(`${at}: cutout file not found: src${f.cutout}`);
      else if (!f.cutout.toLowerCase().endsWith(".png")) problems.push(`${at}: cutout must be a transparent PNG`);
      else {
        const size = pngSize(file);
        if (!size) problems.push(`${at}: src${f.cutout} is not a valid PNG`);
        else if (f.widthIn > 0 && f.heightIn > 0) {
          const off = Math.abs(size.w / size.h / (f.widthIn / f.heightIn) - 1);
          if (off > 0.03) {
            warnings.push(`${at}: cutout is ${size.w}x${size.h}px (ratio ${(size.w / size.h).toFixed(2)}) but widthIn/heightIn is ${(f.widthIn / f.heightIn).toFixed(2)}. The fixture will look stretched. Crop the PNG tightly to the fixture, or fix the dimensions.`);
          }
        }
      }
    }
    if (f.catalogUrl && !/^https:\/\//.test(f.catalogUrl)) problems.push(`${at}: "catalogUrl" must start with https:// (or be empty)`);
  });
  if (problems.length) throw new Error("Fixture preview data problems:\n - " + problems.join("\n - "));
  warnings.forEach((w) => console.warn("[preview] WARNING " + w));
}

check(fixtures);

module.exports = {
  fixtures,
  // Safe to drop inside a <script type="application/json"> tag.
  fixturesJson: JSON.stringify(fixtures).replace(/</g, "\\u003c"),
};
