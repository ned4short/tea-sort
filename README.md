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
| `levels.js` | The 80 levels and their par. Every level was checked by a solver, and par is the true fewest pours for each one. |
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

## Cups per row on phones

Phones show 3 cups per row. To change it, edit `--phone-cols` in the phone section at the bottom of `style.css` (for example, 4 for four in a row).

## Par and stars

Each level shows a par: the fewest pours that solve it, found by an exact solver. When a level is completed the pop-up shows moves, par and stars: 3 stars at or under par, 2 stars within max(3, 25% of par) moves of it, 1 star otherwise. The level picker shows each level's best stars. The rules are in `starsFor()` in `game.js`.

## Golden ticket

Each time a player completes a level there's a 1-in-6 chance a golden ticket appears, just below the Play again / Next level buttons on the "level complete" pop-up. Clicking it shows a ticket with a code (like `TB-ABCD-1234`) for a free cup of tea at the Tea Blossom. A ticket expires 30 days after it's found (`TICKET_DAYS` in `game.js`), and its expiry date is printed on it. A player can hold one live ticket at a time; once it expires they can find a new one. To redeem, the player shows the ticket in the game on their phone; staff tap **Redeem ticket** and enter the secret code (`teablossom`, spaces and capitals ignored). The ticket then shows "Ticket redeemed" with the date and is greyed out. Only a SHA-256 hash of the code is in `game.js` (`STAFF_CODE_HASH`); to change the code, replace it with the SHA-256 of the new lowercase code with spaces removed. Like an expired ticket, a redeemed ticket lets the player find a new one later, but each used-up ticket (redeemed or expired) halves the chance for the next one: 1 in 6, then 1 in 12, 1 in 24, and so on. `TICKET_CHANCE` in `game.js` sets the chance for the first ticket; the doubling rule applies on top of whatever it's set to. The top banner says "Find and click the golden ticket…" unless the player holds a live ticket, when it says "Visit the Tea Blossom and show your golden ticket…". To change the claim instructions, edit the `ticketHow` paragraph in `index.html`.

## Google Search Console

The marked line near the top of `index.html` is where the `google-site-verification` meta tag goes.
