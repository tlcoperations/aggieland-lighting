# Aggieland Lighting and Design — website

A small, fast, SEO-focused site for the College Station showroom, built with [Eleventy](https://www.11ty.dev/) (same setup as the Texas Light Crew site). Render builds it from GitHub on every push. The LightsAmerica catalog stays separate at **shop.aggielandlighting.com**.

## Pages
| URL | Purpose |
|---|---|
| `/` | Home: showroom story, builder/remodel process, brands, FAQ (with FAQ schema) |
| `/lighting-consultation/` | Free consultation — main call to action |
| `/visit/` | Address, hours, map, directions ("lighting store near me" page) |
| `/about/` | Owners, team, builders/trade |
| `/shop/` | Hand-off to the LightsAmerica store |
| `/blog/` | Lighting guides (4 starter posts) |

Also: `sitemap.xml`, `robots.txt`, `404.html`, LocalBusiness + BlogPosting + Breadcrumb JSON-LD on every page.

## Change business info
Everything (phone, address, hours, store URL, brands, form endpoint) lives in **`src/_data/site.json`**. Edit it once and every page updates.

## Write a new blog post
Add a Markdown file to `src/blog/posts/`, e.g. `src/blog/posts/best-kitchen-pendants.md`:

```markdown
---
title: "How to Choose Kitchen Island Pendants"
description: "One or two sentences for Google (about 150 characters)."
date: 2026-12-01
---

Your post text here. Use ## for section headings.
```

Commit and push — it goes live in a minute or two, and is added to the blog page, home page, footer and sitemap automatically. Aim for posts that answer what people in Bryan–College Station actually ask in the showroom.

## Photos
Photos and logos are listed in `src/_data/photos.json`. Every build downloads them into `src/images/remote/` and the site serves its own copies. To add or swap a photo, add an entry there (or drop your own file in `src/images/`).

## Run locally
```bash
npm install
npm start          # http://localhost:8080
npm run build      # outputs _site/
```

## Deploy on Render
1. Create a GitHub repo (e.g. `aggielandlighting`) and upload these files (everything except `node_modules/` and `_site/`).
2. In Render: **New → Static Site** → pick the repo.
   - Build command: `npm install && npm run build`
   - Publish directory: `_site`
   (Or **New → Blueprint** and Render reads `render.yaml`, which also sets the redirects below.)
3. Check the `*.onrender.com` preview.
4. Custom domain, in this order:
   1. Ask LightsAmerica to move the store to **shop.aggielandlighting.com** and confirm it works there.
   2. In Render → Settings → Custom Domains, add `aggielandlighting.com` and `www.aggielandlighting.com`, then update DNS as Render shows.

## Redirects (render.yaml)
Old store paths on the main domain (`/landing/*`, `/large-chandeliers`) redirect to the store subdomain, so existing Google results and bookmarks still work. Add more under `routes:` if Search Console reports 404s.

## After launch
- Google Search Console: add the domain, submit `https://aggielandlighting.com/sitemap.xml`.
- Google Business Profile: set the website to `https://aggielandlighting.com/`, and put the profile URL in `googleProfileUrl` in `site.json`.
- Photos: the current photos are manufacturer room shots from the store. Add real showroom and local project photos when you have them.
- Consultation form: the site has no server. To add the form, create a free form endpoint (Formspree, Basin, etc.) and paste its URL into `consultFormEndpoint` in `site.json`; until then the page shows call/visit buttons.
