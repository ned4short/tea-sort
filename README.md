# Tea Sort Puzzle

A free tea pouring puzzle with 80 levels, by [NED Air Filters](https://www.nedairfilters.com).
Plain HTML, CSS and JavaScript. No build step, no dependencies.

**Live site:** https://teasort.nedwebservices.com/

## Files

| File | What it is |
|---|---|
| `index.html` | The game page, with the how-to-play text Google reads |
| `about.html`, `privacy.html` | About and Privacy pages |
| `game.js` | Game logic (pouring, undo, extra cup, levels, saved progress) |
| `levels.js` | The 80 levels. Every level was checked by a solver. |
| `style.css` | Styles (light and dark mode) |
| `og-image.png` | Preview image for social shares |
| `sitemap.xml`, `robots.txt` | For search engines |
| `404.html` | "Page not found" page |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |
| `CNAME` | Tells GitHub Pages to use teasort.nedwebservices.com |

## Hosting

- Hosted on GitHub Pages from the `main` branch of `ned4short/tea-sort`.
- Custom domain: `teasort.nedwebservices.com` (set by the `CNAME` file).
- DNS: a `CNAME` record for `teasort` on nedwebservices.com pointing to `ned4short.github.io`.
- The site address appears in `index.html`, `about.html`, `privacy.html`, `sitemap.xml`, `robots.txt` and `CNAME`. Change it in all of those if the domain ever changes.

## Google Search Console

The marked line near the top of `index.html` is where the `google-site-verification` meta tag goes.
