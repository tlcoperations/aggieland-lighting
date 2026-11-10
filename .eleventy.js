const markdownIt = require("markdown-it");
const photos = require("./src/_data/photos.json");
const site = require("./src/_data/site.json");

const md = markdownIt({ html: true, linkify: false, typographer: true });

// Short tokens you can use inside any block text or link:
//   {phone} {tel} {address} {hours} {shop} {maps}
const tokens = {
  "{phone}": site.phone,
  "{tel}": `tel:${site.phoneE164}`,
  "{address}": `${site.street}, ${site.city}, ${site.region} ${site.zip}`,
  "{hours}": site.hoursText,
  "{shop}": site.shopUrl,
  "{maps}": site.mapsUrl,
};
const fill = (s) => Object.entries(tokens).reduce((out, [k, v]) => out.split(k).join(v), String(s ?? ""));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addWatchTarget("src/css/");

  // Blog posts, newest first
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/posts/*.md").sort((a, b) => b.date - a.date)
  );

  // Text helpers for blocks
  eleventyConfig.addFilter("fill", fill);
  eleventyConfig.addFilter("md", (s) => md.render(fill(s)));
  eleventyConfig.addFilter("mdi", (s) => md.renderInline(fill(s)));

  // {% photo "entry" %}  or  {% photo "entry", "card" %}  or  {% photo "/images/my-shot.jpg", "wide", "Alt text" %}
  // Keys come from src/_data/photos.json. A path starting with "/" uses your own file.
  // Sizes: hero, wide, card, square, tall. Pass lazy=false for images at the top of a page.
  eleventyConfig.addShortcode("photo", (key, size = "card", altOverride = "", lazy = true) => {
    if (!key) return "";
    let src, alt;
    if (String(key).startsWith("/") || String(key).startsWith("http")) {
      src = key; alt = altOverride === "-" ? "" : altOverride;
    } else {
      const p = photos[key];
      if (!p) throw new Error(`Unknown photo "${key}" — add it to src/_data/photos.json`);
      src = `/images/remote/${p.file}`; alt = altOverride === "-" ? "" : altOverride || p.alt || "";
    }
    const dims = { hero: [830, 830], wide: [1250, 540], card: [600, 400], square: [600, 600], tall: [600, 800] }[size] || [600, 400];
    const loading = lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"';
    return `<img class="ph ph-${size}" src="${esc(src)}" alt="${esc(alt)}" width="${dims[0]}" height="${dims[1]}"${loading}>`;
  });
  eleventyConfig.addFilter("photoUrl", (key) =>
    !key ? "" : String(key).startsWith("/") ? key : `/images/remote/${(photos[key] || {}).file}`
  );

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  eleventyConfig.addFilter("readableDate", (d) => {
    const dt = new Date(d);
    return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("absoluteUrl", (path, base) => new URL(path, base).href);
  eleventyConfig.addFilter("jsonString", (s) => JSON.stringify(fill(String(s || ""))));
  eleventyConfig.addFilter("hasBlock", (blocks, type) => (blocks || []).some((b) => b.type === type));
  eleventyConfig.addFilter("limit", (arr, n) => (n ? (arr || []).slice(0, n) : arr || []));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
