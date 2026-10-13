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
| `icons.js`, `icons-license.txt` | Lucide icons used in the Skills section, and their licence |
| `pilot.js` | The penguin pilot that flies around and inspects widgets |

Every page repeats the same header and footer. When you change the navigation, change it in each page.

## Adding a section

1. In `index.html`, add `<section class="part" id="name">…</section>` in the right place inside `<main>`. Use `<h2 class="sec-title">` for its heading, not `<h1>`.
2. Add `<a href="index.html#name">Name</a>` to the nav of every page, in the same order as the sections.
3. Update the "Next" link at the bottom of the section before it.

## Editing the Skills section

The Skills section is seven cards (`<article class="card pcard">`) in `index.html`, in a 1 + 2 + 2 + 2 pyramid. Each card has a level (`data-level="daily|working|learning"`, shown as its status label) and a `<ul class="cat-skills">`; the skill network is built from that list. Every `<li>` names its icon in `data-icon`, and the icon itself is looked up in `icons.js`. A category can have any number of skills: the network picks one ring (up to 8 skills) or two rings (more), shrinks the nodes slightly if needed, and on narrow screens grows its panel a little. Only list skills you can back up.

- To rename or swap a skill, edit the `<li>`. Keep about six per card.
- To use a different icon, find it at https://lucide.dev, copy the markup between the `<svg>` tags into `icons.js` under a new name, then use that name in `data-icon`.
- Icons are from Lucide (ISC licence, see `icons-license.txt`). No brand logos are used.
- The card movement and network code is in `app.js` (search for "skills: a pyramid") and the styles are in `styles.css` (search for "skills pyramid").

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
