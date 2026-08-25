# Zhyvitsa — Website

Marketing site for Zhyvitsa, a floristry & event decoration studio in Warsaw.
Static HTML/CSS/JS, bilingual (Polish default, English at `/en`).

## Structure

```
.
├── index.html              Polish homepage (default / root)
├── en/
│   └── index.html          English homepage
├── robots.txt              Crawler rules + sitemap pointer
├── sitemap.xml             Both language versions, with hreflang alternates
├── site.webmanifest        Icons, name and theme colour for home-screen installs
├── assets/
│   ├── css/
│   │   └── style.css       All site styling (design tokens, layout, components)
│   ├── js/
│   │   ├── vine-geometry.js  Math module: stem curve + vortex-spiral generation
│   │   └── main.js           App wiring: header, nav, scroll reveals, vine animation
│   └── images/             Logo mark, favicons (16/32/192/512 + apple-touch),
│                           and the Open Graph share cards
└── README.md
```

Both `index.html` files share the same `assets/` folder via relative paths
(`assets/...` from the root, `../assets/...` from `en/`), so styling and
behavior stay in sync across languages — only the copy differs.

## Production domain

Absolute URLs live in four places: the `canonical` / `hreflang` / `og:` tags in
both pages, the `@id` and `url` fields of the JSON-LD blocks, `sitemap.xml`, and
`robots.txt`. They all currently point at `https://zhyvitsa.pl`.

**If the site is served from a different origin, change it everywhere before
going live** — a canonical tag pointing at the wrong host will keep the real
pages out of Google:

```bash
grep -rl "https://zhyvitsa.pl" . --exclude-dir=.git \
  | xargs sed -i 's|https://zhyvitsa.pl|https://your-real-domain.example|g'
```

## SEO notes

- **Structured data** — each page carries a `Florist` (LocalBusiness) node plus a
  `WebSite` node in one `@graph`. Keep the address, phone, hours and `sameAs`
  links identical to the visible page copy and to the Google Business Profile;
  mismatched NAP data is the most common local-SEO problem. Validate changes at
  <https://validator.schema.org/> and in Google's Rich Results Test.
- **Do not add `aggregateRating` or `review` unless the reviews are real** and
  shown on the page — Google issues manual actions for self-serving markup.
- **Share images** — `assets/images/og-image.jpg` (PL) and `og-image-en.jpg` (EN)
  are generated brand cards at 1200×630. A real photograph of the studio's work
  will get noticeably more engagement; replace the files at the same paths and
  the meta tags need no change.
- **The portfolio section links to Instagram** rather than holding a photo grid.
  If real photography is added later, put it in `assets/images/gallery/` and
  keep the Instagram card as the last element in the section — the profile is
  always more current than anything hard-coded here.
- **After deploying**, submit `sitemap.xml` in Google Search Console and claim
  the Google Business Profile — for a local florist that profile usually drives
  more enquiries than the site's own rankings.

## Running locally

The JS is loaded as ES modules (`<script type="module">`), which browsers
block from `file://` due to CORS. Serve the folder over HTTP instead, e.g.:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000/`.

Note that the language switcher uses directory-style paths (`/` and `/en/`),
which is what a static host serves — opening the files straight from disk will
not resolve them.

## Notes on the vine animation

`vine-geometry.js` is a self-contained, dependency-free module: it builds an
organically curved "stem" path and a set of "vortex-spiral" branch paths
anchored to it. `main.js` renders these into each `.vine-bg[data-vine]`
mount point and drives their reveal via scroll position — see the doc
comments at the top of `vine-geometry.js` for the underlying math.
