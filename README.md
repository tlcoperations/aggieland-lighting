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
| `pages/shop.md` | `/shop/` (landing page that sends visitors into the LightsAmerica catalog) |
| `pages/thanks.md` | `/thanks/` (form thank-you, noindex, counts lead conversions) |
| `pages/blog.md` | `/blog/` |
| `pages/college-station.md` | `/lighting-store-college-station-tx/` |
| `pages/bryan.md` | `/lighting-store-bryan-tx/` |
| `pages/areas.md` | `/areas-we-serve/` (Brazos first, then Grimes, Madison, Burleson) |
| `pages/privacy.md` | `/privacy/` (needed for Google and Meta ads) |
| `lp/showroom.md` | `/lp/showroom/` — ad landing page, hidden from Google |

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
| `book` | Consultation request (form when `consultFormEndpoint` is set, otherwise call/directions buttons) | `id`, `title`, `text` |
| `thanks` | Form confirmation with phone, address, hours; fires the `generate_lead` conversion | `buttons` |
| `callout` | Bold colored band with buttons | `buttons` |
| `areas` | Service area cards from `site.json` (Brazos County highlighted) | `link` |

**Buttons:** `buttons: [{ text: Call us, href: "{tel}", style: accent }]`. Styles are `primary` (default for the first button), `outline` (default for the rest) and `accent`.

**Shortcuts** you can use in any text or link: `{phone}`, `{tel}`, `{address}`, `{hours}`, `{shop}`, `{maps}`. They fill in from `site.json`.

**New block type:** add `src/_includes/blocks/my-block.njk` (copy a similar one), style it at the bottom of `style.css`, and use `type: my-block` on any page.

## Local SEO

Focus: **Bryan and College Station / Brazos County**, then Grimes, Madison and Burleson counties.

- Home, College Station and Bryan pages each target their own searches ("lighting store College Station", "lighting store Bryan TX"). The Areas We Serve page covers the rest of Brazos County and the three outer counties.
- Business info for Google (address, hours, brands, area served by city and county) is on every page. Edit towns and counties in `site.json` → `serviceArea`.
- Breadcrumbs, FAQ answers and blog posts are marked up for Google rich results.
- To add a page for another town, copy `pages/bryan.md`, change the permalink, title, text and FAQ, and link it from `pages/areas.md` and the footer. Write it about that town; near-copies of the same page hurt more than they help.

**The biggest local ranking factor is the Google Business Profile**, not the website. Point its website link to the home page, keep the hours and phone identical to `site.json`, add real photos, and ask happy customers for reviews.

## Ads & tracking (Google and Meta)

Tracking is built in and **off until you paste IDs** into `site.json` → `tracking`:

| Setting | Where to find it |
|---|---|
| `ga4Id` | Google Analytics → Admin → Data streams → web stream → Measurement ID (`G-…`) |
| `googleAdsId` | Google Ads → Goals → Conversions → a conversion → Tag setup → Google tag ID (`AW-…`) |
| `googleAdsConversions` | The label after the slash in each conversion's `send_to` (`AW-123/AbC…` → `AbC…`). Create one per action you want to count: `call`, `directions`, `shop`, `consult` |
| `metaPixelId` | Meta Events Manager → Data sources → your dataset/pixel ID (numbers only) |
| `googleSiteVerification` | Search Console → add property → HTML tag method → the `content` value |
| `metaDomainVerification` | Meta Business Settings → Brand safety → Domains → meta-tag method → the `content` value |

What gets counted automatically on every page:

| Visitor action | Google Analytics event | Google Ads | Meta event |
|---|---|---|---|
| Taps the phone number | `click_to_call` | `call` conversion | `Contact` |
| Taps Get Directions | `get_directions` | `directions` conversion | `FindLocation` |
| Clicks into the online store | `shop_online_click` | `shop` conversion | `ViewContent` |
| Submits the consultation form | `consult_request` (GA4 only) | none (see next row) | none |
| Lands on `/thanks/` after the form | `generate_lead` | `consult` conversion | `Lead` |

- Ad source (UTM tags, `gclid`, `fbclid`) is remembered for the visit, sent with each event, and added to the consultation form as hidden fields.
- Links to the store get `utm_source=aggielandlighting.com` so the store's reports show visits from this site.
- Tag any other link or button with `data-track="call"` (or `directions`, `shop`, `consult`) to count it.

**Ad landing page:** `/lp/showroom/` is built for ads (no clutter, call/directions up top) and hidden from Google so it doesn't compete with the real pages. Use UTM tags on ad links, e.g. `https://aggielandlighting.com/lp/showroom/?utm_source=facebook&utm_medium=paid&utm_campaign=showroom`. Copy it to make landing pages for other campaigns.

**Targeting suggestion:** Brazos County (or a radius around the showroom) as the main campaign; Grimes, Madison and Burleson as a separate, smaller campaign so you can see what each costs.

## Consultation form

Set `consultFormEndpoint` in `site.json` to a form backend URL and the "Book it" block on `/lighting-consultation/` shows a form instead of the call/directions buttons. Leave it blank to keep the buttons.

- The form POSTs `name`, `phone`, `email`, `project_type`, `timeline`, `message`, `source_page` and any `utm_*`/`gclid`/`fbclid` from the visit.
- It asks the backend to redirect to `/thanks/` using both `_next` (FormSubmit.co, Formspree) and `_redirect` (some other backends). `track.js` rewrites these to the current site origin, so Render previews redirect back to the preview, not the live domain.
- Spam: two hidden honeypot fields (`_honey` for FormSubmit.co, `_gotcha` for Formspree). `track.js` also blocks the submit if either is filled in.
- FormSubmit.co: endpoint is `https://formsubmit.co/you@yourdomain.com` (the first submission sends an activation email you must confirm). Formspree: `https://formspree.io/f/xxxxxxxx`; set the redirect/thank-you URL in the Formspree form settings if it ignores `_next`.
- `/thanks/` is `noindex` and not in the sitemap. Count form conversions by that URL in GA4 or Google Ads.

## Colors (palettes)

Current shortlist (all espresso brown with warm sand backgrounds): `espresso-brass`, `espresso-sage`, `espresso-rose`, `espresso-camel`, `espresso-slate`, plus the original `clay` (terracotta). Earlier options (`showroom`, `maroon`, `sage`, `navy`, `gallery`) are still in the stylesheet.

- **The palette is locked** to `theme` and the picker is off (`"showThemePicker": false`). To preview palettes again, set it to `true`: a switcher appears at the bottom-right and `?theme=sage` works on any URL.
- **To pick one**, set `"theme"` in `src/_data/site.json`. The switcher shows the palettes listed in `pickerThemes`.
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

- Confirm phone and hours in `site.json` match the Google Business Profile.
- Add a form endpoint (FormSubmit.co, Formspree, Basin, etc.) to `consultFormEndpoint` to turn on the consultation form, and submit a test request.
- Search Console: add the domain and submit `https://aggielandlighting.com/sitemap.xml`.
- Paste tracking IDs into `site.json` → `tracking`, then check events in GA4 DebugView, Google Tag Assistant and Meta's Test Events.
