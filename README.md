# Ajas Muhammed – Portfolio

A multi-page personal portfolio with a network and terminal theme. Plain HTML, CSS and JavaScript. No build step, no frameworks.

## Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly also works, but a local server is closer to the real thing.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole site as one long page. Sections in order: Home (terminal, site map, port panel), Experience, Contact |
| `experience.html`, `contact.html` | Small redirect pages so old links still work. They send visitors to the matching section of `index.html` |
| `skolte.html`, `webcastle.html`, `hashroot.html`, `aabasoft.html` | One page per workplace |
| `styles.css` | All styling. Colours, fonts and spacing are CSS variables at the top. |
| `fonts.css`, `fonts/` | The three font families as local `.woff2` files, with their licenses |
| `theme.js` | Dark by default, light/dark switch. Keeps the choice across pages. Loaded first in every page so there is no flash. |
| `app.js` | Theme button label, copy buttons, smooth scrolling and active nav link, home page terminal commands |
| `pilot.js` | The penguin pilot that flies around and inspects widgets |

Every page repeats the same header and footer. When you change the navigation, change it in each page.

## Adding a section

1. In `index.html`, add `<section class="part" id="name">…</section>` in the right place inside `<main>`. Use `<h2 class="sec-title">` for its heading, not `<h1>`.
2. Add `<a href="index.html#name">Name</a>` to the nav of every page, in the same order as the sections.
3. Update the "Next" link at the bottom of the section before it.

## Look and feel

- Dark by default, bright green accent, light theme through `data-theme="light"` on the root element.
- Fonts: Chakra Petch (headings), IBM Plex Sans (text), IBM Plex Mono (labels and terminal). They are bundled in `fonts/` and declared in `fonts.css`, so the site needs no internet connection. They are under the SIL Open Font License, see `fonts/LICENSES.txt`.
- Animation is about 7 out of 10 and is switched off for visitors who prefer reduced motion.

## Content rules

- Keep employer details general. Describe responsibilities, not internal tools or setups.
- Contact details on the site are limited to email, LinkedIn and the website.
- Do not claim certifications that have not been earned.

## Still to build

About, Skills (switch-panel), Case studies, Troubleshooting walkthrough, Network lab diagram, Documentation samples, Learning and roadmap, Resume. Photos for the workplace pages and an Instagram link in the footer are waiting for material.

## Hosting

Any static host works. For GitHub Pages: repository Settings, Pages, deploy from the `main` branch root.
