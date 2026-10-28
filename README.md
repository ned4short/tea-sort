# Tea Sort Puzzle

A free tea pouring puzzle with 80 levels, by Erica Powers. Built by [Ned Games](https://www.nedairfilters.com/games).
Plain HTML, CSS and JavaScript. No build step, no dependencies.

**Live site:** https://teasort.nedwebservices.com/

## Files

| File | What it is |
|---|---|
| `index.html` | The game page, with the how-to-play text Google reads |
| `about.html`, `privacy.html` | About and Privacy pages |
| `game.js` | Game logic (pouring, undo, extra cup, levels, saved progress, golden ticket) |
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

## Golden ticket

Each time a level starts there's a 1-in-6 chance a golden ticket hides on the page: peeking out from behind a cup, in the list of teas, or in the footer. Clicking it shows a ticket with a code (like `TB-ABCD-1234`) for a free cup of tea at the Tea Blossom. Each browser can find one ticket. To change how often it appears, edit `TICKET_CHANCE` near the top of the golden ticket section in `game.js`. To change the claim instructions, edit the `ticketHow` paragraph in `index.html`.

## Google Search Console

The marked line near the top of `index.html` is where the `google-site-verification` meta tag goes.
