# Notes for AI tools and editors

This is a small static site. Read `README.md` first.

## Rules

- Plain HTML, CSS and JS only. Do not add a framework or build step.
- Colours and fonts are CSS variables at the top of `styles.css`. Use them instead of literal colours. Both themes must keep working: dark is the default, light is `:root[data-theme="light"]`.
- Keep `<script src="theme.js"></script>` in the `<head>` of every page, before the page paints. It sets the theme and carries the choice to other pages by adding `#light` / `#dark`, or `#section~light` / `#section~dark`, to internal links. Link to sections as `index.html#name`.
- Fonts are bundled locally (`fonts.css` and `fonts/`). Do not switch back to a hosted font link, so the site keeps working offline.
- The main site is one long page, `index.html`, made of `section.part` blocks (home, experience, contact). The nav scrolls to them. Company pages stay separate. `experience.html` and `contact.html` are redirect stubs only.
- Pages link to each other with relative links such as `index.html#experience`. Keep them relative so the site works on any host.
- Every page repeats the same header, footer and script tags. Change all pages together.
- Keep the page working at phone width (about 400px) with no sideways scrolling.
- The penguin in `pilot.js` is an original character. Do not replace it with a trademarked mascot or any other existing character.
- Content rules are in `README.md`. Keep employer details general and keep the phone number off the site.

## Check your change

1. Run `python3 -m http.server 8000` and open the pages.
2. Toggle light and dark mode, then move between pages. The theme must stay the same.
3. Look for errors in the browser console.
