# Aggieland Lighting and Design — website

A small, fast, SEO-focused site for the College Station showroom, built with [Eleventy](https://www.11ty.dev/) (the same setup as the Texas Light Crew site). Render rebuilds it from GitHub on every push. The LightsAmerica catalog stays separate at **shop.aggielandlighting.com**.

The site is built from **blocks**: every page is just a list of sections in its front matter. To change a page, edit its list. To add a page, copy a page file and change the list. No HTML needed.

## Where things live

```
src/
  _data/site.json        business info, hours, palette   ← edit once, used everywhere
  _data/photos.json      photo library (key → image URL + alt text)
  pages/*.md             one file per page, each a list of blocks
  blog/posts/*.md        blog posts (plain Markdown)
  _includes/blocks/      one file per block type
  _includes/layouts/     base (head, header, footer), page, post
  css/style.css          palettes at the top, then one section per block
```

## Pages

| File | URL |
|---|---|
| `pages/home.md` | `/` |
| `pages/consultation.md` | `/lighting-consultation/` |
| `pages/visit.md` | `/visit/` |
| `pages/about.md` | `/about/` |
| `pages/shop.md` | `/shop/` (hands off to the LightsAmerica store) |
| `pages/blog.md` | `/blog/` |

## Add a page

Create `src/pages/ceiling-fans.md`:

```yaml
---
permalink: /ceiling-fans/
title: "Ceiling Fans in College Station, TX | Aggieland Lighting"
description: "One or two sentences for Google, about 150 characters."
heroImage: living-fan            # used for social sharing

blocks:
  - type: page-header
    eyebrow: Ceiling fans
    title: Ceiling fans for Bryan–College Station homes.
    text: Indoor and outdoor fans you can see running in our showroom.
    image: living-fan

  - type: cards
    columns: 3
    items:
      - { title: Indoor fans, text: "Bedrooms, living rooms and kitchens." }
      - { title: Outdoor fans, text: "Damp- and wet-rated for Texas porches." }
      - { title: Fans with lights, text: "One fixture, two jobs." }

  - type: faq
    items:
      - q: What size fan do I need?
        a: "See our [ceiling fan size guide](/blog/ceiling-fan-size-guide/)."
---
```

It's live on the next push, and it's added to the sitemap automatically. Add it to the menu in `src/_includes/header.njk` if you want it there.

## Block catalog

Every block takes `type`. Most also take `bg` (`plain`, `wash`, `tint`, `hero`, `dark`), `eyebrow` (small label), `title` and `text`. Any `text` can use Markdown (links, **bold**, lists).

| Block | What it is | Extra fields |
|---|---|---|
| `hero` | Big opening section with a photo | `kicker`, `image`, `buttons` |
| `page-header` | Top of an inner page, wide photo underneath | `image`, `buttons` |
| `trust` | Dark bar of short proof points | `items` (list of text) |
| `split` | Text on one side, something on the other | `link`, `buttons`, `image`, plus one of `steps` (title/text list), `quote` (`text`, `by`), `side_image`; `reverse: true` flips sides; `center: true` |
| `cards` | Grid of cards | `columns` (2–4), `items` (`image`, `title`, `meta`, `text`, `link`) |
| `rooms` | Photo tiles with captions | `items` (`image`, `title`, `text`, `href`), `note` |
| `tiles` | Simple link boxes | `columns`, `items` (`title`, `text`, `href`), `note` |
| `posts` | Latest blog posts | `limit` (leave out for all), `columns` |
| `faq` | Questions that open/close; also tells Google (FAQ rich results) | `items` (`q`, `a`) |
| `prose` | Plain written section | `link`, `wide: true` |
| `content` | Shows the Markdown written below the page's front matter | — |
| `visit-info` | Address, hours table and map from `site.json` | — |
| `book` | Consultation request (form or call buttons) | `id` |
| `callout` | Bold colored band with buttons | `buttons` |

**Buttons:** `buttons: [{ text: Call us, href: "{tel}", style: accent }]`. Styles are `primary` (default for the first button), `outline` (default for the rest) and `accent`.

**Shortcuts** you can use in any text or link: `{phone}`, `{tel}`, `{address}`, `{hours}`, `{shop}`, `{maps}`. They fill in from `site.json`.

**New block type:** add `src/_includes/blocks/my-block.njk` (copy a similar one), style it at the bottom of `style.css`, and use `type: my-block` on any page.

## Colors (palettes)

Current shortlist (all espresso brown with warm sand backgrounds): `espresso-brass`, `espresso-sage`, `espresso-rose`, `espresso-camel`, `espresso-slate`, plus the original `clay` (terracotta). Earlier options (`showroom`, `maroon`, `sage`, `navy`, `gallery`) are still in the stylesheet.

- **While previewing**, a small palette switcher sits at the bottom-right of every page. You can also add `?theme=sage` to any URL.
- **To pick one**, set `"theme"` in `src/_data/site.json`. The switcher shows the palettes listed in `pickerThemes`.
- **Before launch**, set `"showThemePicker": false` to hide the switcher.
- To tweak a palette, edit its variables at the top of `src/css/style.css`.

## Photos

Photos live in `src/_data/photos.json` as `key → { url, file, alt }`. Every build downloads them into `src/images/remote/` and the site serves its own copies. Use a key anywhere a block asks for `image`. For your own photo, put the file in `src/images/` and use its path instead, e.g. `image: /images/showroom-floor.jpg`.

The current photos are manufacturer room shots from the store. Real showroom and local project photos will help the look and local search.

## Write a blog post

Add `src/blog/posts/best-kitchen-pendants.md`:

```markdown
---
heroImage: kitchen-island
title: "How to Choose Kitchen Island Pendants"
description: "One or two sentences for Google (about 150 characters)."
date: 2026-12-01
---

Your post text. Use ## for section headings.
```

It appears on the blog page, the home page, the footer and the sitemap automatically.

## Run locally

```bash
npm install
npm start          # http://localhost:8080
npm run build      # outputs _site/
```

## Deploy on Render

1. In Render: **New → Static Site** → pick this repo.
   - Build command: `npm install && npm run build`
   - Publish directory: `_site`
2. Every push to `main` redeploys.
3. **Going live later (not yet):** move the LightsAmerica store to `shop.aggielandlighting.com` first, then add `aggielandlighting.com` as a custom domain in Render and update DNS.

`render.yaml` has redirects for old store paths (`/landing/*`, `/large-chandeliers`) so existing links keep working once the domain moves.

## Before launch checklist

- Choose a palette and set `"showThemePicker": false`.
- Confirm phone and hours in `site.json` match the Google Business Profile.
- Add a form endpoint (Formspree, Basin, etc.) to `consultFormEndpoint` if you want a web form.
- Search Console: add the domain and submit `https://aggielandlighting.com/sitemap.xml`.
