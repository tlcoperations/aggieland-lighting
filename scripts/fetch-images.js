// Downloads the photos listed in src/_data/photos.json into src/images/remote/
// so the site serves its own copies. Runs automatically before every build.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const photos = require(path.join(root, "src/_data/photos.json"));
const outDir = path.join(root, "src/images/remote");
fs.mkdirSync(outDir, { recursive: true });

async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "aggieland-site-build" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

(async () => {
  const entries = Object.entries(photos).filter(([k, v]) => !k.startsWith("_") && v.url);
  let failed = 0;
  await Promise.all(entries.map(async ([key, { url, file }]) => {
    const dest = path.join(outDir, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return; // already have it
    try {
      fs.writeFileSync(dest, await get(url));
      console.log(`fetched ${file}`);
    } catch (e) {
      failed++;
      console.error(`FAILED ${key} (${url}): ${e.message}`);
    }
  }));
  if (failed) {
    console.error(`${failed} image(s) could not be downloaded.`);
    process.exit(1);
  }
})();
