# Moses Kolleh Sesay - Portfolio Website

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://moseskolleh.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## About

Professional portfolio website for **Moses Kolleh Sesay**, a Sustainability & Climate Analyst specialising in ESG analysis, climate resilience, and data-driven environmental solutions.

**Live Website:** [https://moseskolleh.github.io/](https://moseskolleh.github.io/) (until October 2026 at `/sustaintheworld/`; an old address goes on to the same page, see `404.html`)

## Features

- **Living journey map**: a hand-built SVG map of the journey region — West Africa to East Asia, so every stop gets real resolution instead of a world map that's half empty ocean (Natural Earth 50 m coastlines, simplified hardest away from the Rhine delta where the map zooms deepest, zero runtime dependencies). It flies from Freetown to Changsha, Bonn, Wageningen, Amsterdam and Pavia as you scroll (on a phone, in a band pinned under the nav bar above the stop you are reading), and fieldwork sites like Wuppertal join the map when the story reaches them. Every name on it is 11px or more on any screen, and the Rhine delta's four sit clear of each other and of the route. Regenerate with `npm install && npm run map:build`, then sync the printed stop pixels into `script.js`; `npm run map:check` proves the committed SVG still matches the script and runs in CI
- **"Seven in ten" — site the borehole**: a playable resistivity profile on the [groundwater case study](case-studies.html#play-borehole) — read the curve, place the rig, drill. Water-bearing fracture, clay pocket or dry hole; your holes fill a scoreboard beside the field records' 7 in 10 at survey-selected sites. It is practice in reading the curve: it once drew blind drilling's ~3 in 10 beside them, which had no source and claimed a gain nothing measured, so that row is gone. It was two widgets, the game and a strike-rate slider, making one point; it is one now
- **"Don't let it become a boat" flood scene**: a schematic Wupper cross-section on the [Wuppertal case study](case-studies.html#play-flood) — slide the river from a calm day to July 2021 and watch the margin under the Schwebebahn's hanging cars shrink. Both games load only when a reader scrolls near them, and without JavaScript each is a note that it needs JavaScript and one line of summary
- **Field terminal**: press <code>`</code> anywhere (or the footer button) for a hidden green-on-black terminal — try `journey`, `drill`, `co2`, `kushe`, `help`
- **Carbon-aware by construction**: images ship as WebP at the lowest quality that still looks the same, with AVIF where that is a tenth lighter again and an 800px hero on a phone (see [The photos](#the-photos)), the three typefaces are self-hosted subsets, and a first view costs about **257 KB over the wire on a desktop, fonts included**, less on a phone, against a 272 KB ceiling `npm test` enforces — a budget, not a number in a README, and one that `npm run smoke` checks against a real browser (see [Performance](#performance)). Everything a visit does not reach — the field terminal, the section-05 interactives, the case studies' two games — is fetched only when it is used. Nothing is loaded from any other origin, and only two things are ever sent to one, both to the site's own Apps Script endpoint: a contact message, and one cookieless visit count per page view (never under Do Not Track or Global Privacy Control; see [The visit counter and privacy](#the-visit-counter-and-privacy)). A live footer badge weighs each visit in the browser (Resource Timing API × Sustainable Web Design model v3, which allocates data-centre, network and device energy per byte transferred). A low-energy mode pauses all animation and honours `prefers-reduced-motion`
- **[Case studies](case-studies.html), evidence-first**: the homepage's six projects and a seventh, GAIA, an open method and tool for reporting an organisation's AI footprint on the lines of a sustainability report, each as **problem → method → artifact → result → findings**. Every result carries the basis it rests on and says plainly whether you can check it from outside; every artifact says whether it is public, available on request, or held by the client; every case study says what the work found or recommends, with its basis. The method is folded to one line until asked for. See [Content pipeline](#content-pipeline)
- **Role-specific lenses**: `case-studies.html?lens=water`, `?lens=climate-risk`, `?lens=sustainable-ai`, `?lens=esg-csrd` — shareable views that reframe the portfolio for one kind of role. They **reorder and frame, they never filter**: every case study stays on the page in every view, because a view that hides inconvenient work is a CV that lies by omission. Without JavaScript the switcher steps aside and every case study shows in the default view
- **No dead ends**: every page but the homepage shares one small nav (Home, Case studies, Research, CV, Contact, with the page you are on marked) and ends with a way to reach Moses: his address, the contact form and the CV. The pages built on `carbon-ai.css` have the homepage's light theme and its switch, and keep the reader's choice from page to page (`theme.js`, before the first paint); with nothing chosen they follow the system's setting, with or without JavaScript. The homepage follows it only with JavaScript: without, it stays dark, because following the system there would put a second copy of every light-theme rule in its first view. The text-only field report and the 404 page take the nav and the call to action as plain lines, and no script
- **[Research outputs](research.html)**: theses, reports, datasets, code and tools, grouped by whether you can open them: public, on request, or held by the client. The public ones lead with Moses's own repositories on GitHub (a groundwater toolkit, the GAIA Green AI framework, a CMIP6 extremes pipeline, an A/B test in SQL and Python, the sustainable-AI prototypes and the newer EcoPrompt Coach), each described only as far as the repository itself shows. No DOI, journal or conference is named anywhere, because none of this work has one — and a test fails the build if one ever appears without proof
- **[Check my numbers](claims.html)**: every figure the site prints, in digits or in words, from the hero's 164 water points and the Wuppertal "team of six" to the first view's weight, with what it counts, the one basis it rests on and whether a reader can check it (public, with where; on request; or not checkable from outside). Each figure on a page is marked with its entry in `content/claims.json`, and `npm test` fails on a figure the ledger does not hold, on a page, in its labels and captions, or in what a script prints of its own (the field terminal, the receipt, the coach's tips). See [Every number has a basis](#every-number-has-a-basis-the-claims-ledger)
- **A CV printed from the same facts**: `npm run cv` prints `assets/Moses_Kolleh_Sesay_CV.pdf` from `content/` and the homepage's own words, so it says what the site says, and a test fails once it falls behind them. See [The CV](#the-cv)
- **[Open counts](stats.html)**: what the site's own cookieless counter has counted, rebuilt weekly — the four numbers that say whether the site works, page views by page, lens and window width, referrers, features used and bytes per page view, in whole weeks. Every count under 5 reads `<5`, a figure that would let one be worked out by subtraction reads `held`, and the page prints the exact payload a page view sends. See [Open counts](#open-counts)
- **Borehole core-log experience timeline**: career history logged the way a geologist logs a core — depth is time, every layer is a chapter. Each role is a short card (dates, role, organisation, one line), the rest a press away
- **EcoPrompt Coach**: one name for one tool. The homepage's section 05 is its teaser, one chart: guess how the energy of one AI answer grows with model size, then see the research estimates. This site's edition of the coach (model × grid × tokens → energy, carbon, water, with an evidence ledger) and Anatomy of a Prompt are on [`carbon-ai.html`](carbon-ai.html), which says how old its figures are; a newer version, with later models (their figures extrapolated, as it says), is the [EcoPrompt Coach app](https://moseskolleh.github.io/promptcoach/) ([code](https://github.com/moseskolleh/promptcoach))
- **Evidence-first skills**: no invented percentages — every tool's proof is public work that shows it, a repository on GitHub, or says there is none: machine learning, shown only by a certificate, links nowhere, and the GIS row links its case study, whose maps are on request. The 164 water points are itemised in About
- **The Brief** (`brief.html`), a page that set a job ad against the work on this site, was retired in October 2026. Its address now answers with a short note, `noindex` and out of the sitemap, that points to the homepage and the case studies, so a link already sent to it (`brief.html?focus=…`) does not end in a 404; an old `/#assay` link goes on to the same note
- **[Field Notes](notes/what-164-water-points-taught-me.html)**: short essays connecting boreholes, scenario storytelling and sustainable AI, each an article of its own in `notes/`, dated the day it was first published on this site, with an [Atom feed](feed.xml); About links the newest three. They are written in markdown in `content/notes/` (see [Field Notes and the feed](#field-notes-and-the-feed))
- **Modern design**: dark theme with vibrant green accents, light mode (the reader's choice, shared by every page, or with none the system's, from the first paint), responsive layout, full SEO/social metadata (Open Graph, a sitemap, an Atom feed, and JSON-LD written from `content/`: see [Structured data](#structured-data))
- **Seven sections**: journey, about (with the CV download and links to the field notes), experience, six project cards leading to the case studies, the EcoPrompt Coach's chart, skills and education, contact form

## Technologies Used

- **HTML5**: Semantic markup for better SEO and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, animations, and transitions
- **JavaScript (Vanilla)**: no framework, no bundler. A 69 KB core (`script.js`, 23 KB gzipped) and four on-demand modules in `modules/`, each fetched the first time it is needed: the core fetches two on the homepage (the section-05 interactives with the footer receipt, and the field terminal), the case studies fetch the two games (`dossier.js` and `.css`) and `carbon-ai.html` fetches Anatomy of a Prompt (`anatomy.js` and `.css`), each as it comes near the screen
- **Icons**: an inline SVG symbol sprite, no icon font
- **Fonts**: Inter, Space Grotesk and IBM Plex Mono, self-hosted as Latin subsets under the SIL Open Font License (see [Fonts](#fonts))
- **GitHub Pages**: Free hosting for static websites

## Sections Overview

### 🏠 Home (Hero)
- Name, role and a one-line value proposition over a rotating set of fieldwork photographs (the rotation only runs while the hero is on screen and the tab is visible)
- An at-a-glance strip written from `content/profile.json` by `npm run build:content`: the roles he is open to and where he is today; seniority, start date, languages and right to work appear once Moses states them, and a fact that is `null` is simply not shown
- One primary action (**See the evidence**, to the case studies), **Get in touch** second, and a quieter CV link; it is the one filled button on the first screen (the nav's Contact is an outline there, filled on hover). The figures below and the photo's caption sit inside the first screen at 1440×900 and 390×844, in a laptop's shorter browser window (1366×657, 1280×720), where the description follows the figures as it does on a phone, and on a small phone (375×667, 360×640)
- A six-link nav: Work, About, Experience, Research, CV and Contact, with the theme switch beside them. The index of the five interactive features sits just before Contact
- Four exact figures (164 water points, 54 hazard systems, 3 continents, 2 master's degrees), written into the HTML so they read correctly without JavaScript; with it they count up to the same values, with nothing appended, and stay still under reduced motion or low-energy mode

### 🗺️ Journey
- The living journey map: Freetown → Changsha → Bonn → Wageningen → Amsterdam → Pavia, flown as you scroll, with a visitor mark for wherever you are reading from. On a phone it is a band pinned under the nav bar while the stops scroll past below it, showing the one being read; it jumps instead of flying under reduced motion or low-energy mode

### 👤 About
- Professional summary with the CV download, and the 164 water points itemised (100 wells rehabilitated, 50 boreholes constructed, 14 solar-powered)
- A link to each of the newest three Field Notes: its number, tag and date, its title and its one line, the note itself a page of its own (`notes/`)

### 💼 Experience
- The borehole core-log timeline: depth is time, every layer a chapter, technology tags for each. Each layer's depths (10 m a year, its top where the role ended, its base where it began) are worked out by `npm run build:content` from the roles' dates in `content/profile.json`, measured from `meta.verifiedOn`, the day the record is logged as of; the head says when the log was logged
- Testimonials under the log, from `content/testimonials.json`, each with who said it and where a reader can check it; none yet, so nothing is shown
- Short cards at every width: dates, role, organisation and the first line, with the rest and the tags behind a More button named for its role; on a desktop a shut card is one row

### 🔬 Projects
- Six teaser cards, generated from `content/projects.json` so they cannot disagree with the case studies: where and when, the headline result with the one line of its basis and whether you can check it from outside, the role lenses, the tools, a thumbnail photo, and one link to the whole story on `case-studies.html` (the subtitle is the case study's). The seventh case study, GAIA, has no card (`homepageCard: false`): it is method and tooling with no photo, and leads the ESG lens, linked from the section's introduction with the other three
- The two games that used to sit in the dossiers are on the case studies they illustrate: "Seven in ten" on groundwater, "Don't let it become a boat" on Wuppertal
- So are the dossiers' 25 field photos, with their captions word for word: a row under each case study, folded under one line until asked for (nothing is fetched until then), each photo a link to the full one. With JavaScript they open in a lightbox that steps through that case study's photos: previous and next, the arrow keys, "2 of 5", Escape

### ⚡ EcoPrompt Coach
- You Draw It, the homepage's one chart from the EcoPrompt Coach research, with a link to the coach on `carbon-ai.html` and to the newer app and its code. It is drawn as wide as it is shown, so every label is 11px or more on a phone (they were about 5px)
- The calculator and Anatomy of a Prompt (where one query lands on a CSRD report) are on `carbon-ai.html`; Anatomy is drawn from the calculator's own numbers and fetched only as its section comes near

### 🛠️ Skills & Education
- Evidence-first: every tool's proof is public work that shows it, or it says there is none; real field numbers instead of percentages
- Areas of expertise, and ESG frameworks and standards (SBTi, CDP, GHG Protocol, TCFD, TNFD, etc.)
- A PhD in Sustainable Development and Climate Change in progress at IUSS Pavia, master's degrees in Environmental Sciences and Industrial Engineering, and a Bachelor's in Geology, each with its dates, institution and what it held
- Professional certifications (ESG Specialist, Google Data Analytics, etc.), each with its issuer, date and what it covered, written from `content/profile.json`; a certificate links its issuer's verification page as soon as its `verifyUrl` is filled in

### 📧 Contact
- Direct contact details, social links and the contact form (Google Apps Script backend, honeypot, rate limits; works without JavaScript by posting to the same endpoint)

## Setup Instructions

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/moseskolleh/moseskolleh.github.io.git
   cd moseskolleh.github.io
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your web browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

   Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (if you have http-server installed)
   npx http-server
   ```

3. **Access the website**
   - Open your browser and navigate to `http://localhost:8000`

### GitHub Pages Deployment

The website is automatically deployed to GitHub Pages from the main branch.

To deploy or update:

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Update portfolio"
   git push origin main
   ```

2. **Enable GitHub Pages** (if not already enabled)
   - Go to repository Settings
   - Navigate to Pages section
   - Select source: Deploy from branch
   - Select branch: `main` (or your deployment branch)
   - Click Save

3. **Access your live site**
   - Your site will be available at: `https://[username].github.io/` (a repository named `[username].github.io` is served at the root; under any other name, at `/[repository]/`, and `404.html`'s root-absolute links would need that prefix)

## Tests and checks

```bash
npm install
npm test          # everything below
```

Node 22.22 or later in the 22 line, or 24.8 or newer (`engines` in
`package.json`): html-validate, which `npm test` runs, needs one of those, and
CI uses Node 22.

| Command | What it holds in place |
|---|---|
| `npm run build:check` | every generated page still matches `content/` |
| `npm run fonts:check` | the committed fonts still hash to their manifest and every stylesheet's `@font-face` block is current |
| `npm run lint:html` | every page is valid HTML ([html-validate](https://html-validate.org/)'s recommended rules; the two relaxations are explained in `.htmlvalidate.cjs`) |
| `npm run test:unit` | every `tests/*.test.js`, side by side, one process per suite, so a new suite runs the day it exists: the thirty-one listed below, and it ends by counting the assertions that passed, so no figure for them is kept here to go stale |
| `npm run map:check` | the committed `journey-map.svg` still matches its generator |
| `npm run budget` | the weights this README quotes, and that its budget tables still say what the script measures (see [Performance](#performance)) |
| `npm run smoke` | every page in a real browser: no errors (nothing the Content-Security-Policy refuses, either), no failed or off-origin requests, one policy on every page ahead of its scripts, an inline script and an `on…=""` attribute put into the EcoPrompt Coach's page refused while its own scripts run, only the origin sent as `Referer` off the site, every on-demand module arrives when used, no axe-core violation at 1440×900 or 390×844 in either theme, and each budgeted page's measured first view no heavier than the budget claims, and every page no longer than its length budget at both sizes once it has settled; every page again with JavaScript off, and the homepage with `script.js` blocked and late; the skip link, Back, the theme switch (followed from page to page, and the system's setting with nothing chosen), back to top and the nav bar at every width, and every other page's shared nav and call to action at 320px, links to a game, a case study or Anatomy of a Prompt landing clear of that nav, and the nav not moving as its theme switch appears; the first screen's figures, caption, strip and primary action, as the strip is today and with every fact at the longest the validator accepts; the journey map pinned over none of its stop's text on a phone, and its delta's names clear of each other on a desktop; an old link to The Brief answering with the note left at its address; the case studies' two games, photo rows and lightbox; every drawing label at 11px or more on a phone, and inside its drawing; where jumps land while sections are drawn on demand, that reading back up after skipping ahead moves nothing, find-in-page and printing, which loops run, and how busy the idle page keeps the main thread at 4× CPU slowdown; the carbon-ai page's dropdowns and numbers; and the visit counter's one request, taken apart: exactly the documented fields, no cookie, no Referer, once per page view, and nothing under Do Not Track or Global Privacy Control or with JavaScript off (its own CI job; needs Chromium — `-- --browser firefox` runs it in Firefox, which CI also does) |
| `npm run health -- --dry-run` | the weekly health check, printed instead of posted: the live site against `main`, every link off the site, what has gone stale, and what still waits on Moses (needs network; see [Health checks and the quarterly review](#health-checks-and-the-quarterly-review)) |

The suites, and the failure each one exists to prevent:

- **`bugs.test.js`** — the original regressions: `href="#"` scroll handling,
  the theme icon matching the persisted theme, the terminal firing `done()`
  twice, and You Draw It handing focus on when the button just pressed goes.
- **`resilience.test.js`** — storage the browser refuses to hand over must not
  abort the script (one unguarded `localStorage.getItem` at module scope used
  to take the rest of the file with it); single-letter shortcuts must not fire
  while a `<select>`, button or contenteditable has focus.
- **`nojs.test.js`** — the page before JavaScript, without it, and when it
  arrives late: nothing is hidden unless `<head>` has marked the page
  `html.js`, one global `[hidden]` rule instead of per-element patches, the
  hero figures written as their real values and read as those while they
  count up, counters that never append a `+` or move under reduced motion or
  low-energy mode and that end 1.8 s in at any frame rate, project cards with nothing a script has to open and case
  study games that ship their controls hidden and say, without JavaScript,
  that they need it, copy that promises a click
  hidden with the script, and a late start that holds the line being read
  while the page fills in. `npm run smoke` loads every page
  with JavaScript disabled (every nav link on show at 390 and 1024px too),
  the homepage with `script.js` blocked and delayed (the line being read
  stays put when it takes over, scroll anchoring off too), and carbon-ai.html
  with its script blocked.
- **`carbon.test.js`** — negative, zero, `NaN` and absurd inputs, in the model
  and through the real page; the input/output token split; the evidence
  ledger, which fails if any factor loses its source, range or review date;
  and the one number formatter both AI pages share: no exponent notation and
  no "0.0" for something that is not zero, from 1e-14 to 1e24. Anatomy of a
  Prompt is fetched only as its section nears, draws the calculator's own
  figures, says whose report its Scope lines are on, and keeps every label at
  11px or more inside the drawing, from a 320px phone to a desktop; nothing
  tells a reader to drag the grid, which is a dropdown.
- **`sections.test.js`** — the shorter homepage, and its one rule: no fact
  leaves the site. Seven sections numbered 01 to 07, the Field Notes' links
  inside About (each note whole on its own page, one press away) and
  Education inside Skills (`#notes` and `#education` still addresses), and no call-to-action band between them; experience as short
  cards at every width, each More button a real button named for its role,
  every card whole without JavaScript and in print; the contact form, and
  nothing after it (the Assay's box, and the line to The Brief that
  replaced it, gone, rules and code with them); every area, framework, degree,
  certificate, field note and project subtitle still on the page or its case
  study, and each figure taken out of About or Skills still shown with the
  role it belongs to.
- **`content.test.js`** — the pages must agree with `content/profile.json`
  (dates, degrees, certifications, JSON-LD, links, sitemap), and so must
  their figures: a record fact (team size, programme length, grade) matches
  its profile entry, every project card shows its case study's years, the page
  weights the footer, the lens and this README quote are the ones `npm run
  budget` measures, the claims removed for having no basis ("10,000+
  people", a project completion rate, "15% efficiency", "advised the UN",
  "certified across", "if a skill is listed, there's a project behind it",
  the UNDRR coverage gain, "top of class", a GPA, and skills with no receipt)
  stay gone, the government partner is named nowhere, the field report names
  no tool the homepage does not show, the illustrative You Draw It guess line
  says so wherever it is shown, and You Draw It judges a
  guess against the published range rather than calling an estimate the
  actual value.
- **`claims.test.js`** — the claims ledger (see [Every number has a
  basis](#every-number-has-a-basis-the-claims-ledger)): every figure marked
  on every page agrees with its entry in `content/claims.json`, and the
  hero's count-up ends on it; no number on any page, in digits or in words,
  in its text or in a label, tooltip, photo caption or description, is
  unmarked unless it is a year, a date, a section number, a standard's name,
  "one", a count of what the page shows in full (held to that count) or the
  like, and each one that is gets printed with its page and the words
  around it; a size said in words ("a fifth", "twice", "millions of") is
  caught as well, unless the factor set holds it ("an order of
  magnitude"); every host the scan skips names the script that fills it,
  and what that script prints of its own is read from its source and held
  to the ledger (the field terminal, whose drill's depths are a made-up log
  that says so, the receipt, You Draw It, the coach
  and its tips, Anatomy of a Prompt, the games), and
  the footer's badge prints no fixed figure; every copy of the grams per MB
  is the ledger's; the hosts hold no figure of their own in the HTML; the
  rules `stats.html` states are the counter's code's; each "Where" link on
  `claims.html` goes to the figure in sight where the page has it so, and
  otherwise into its fold, which it names (`npm run smoke` follows each
  link and finds the figure drawn);
  each figure the budget measures is what it measures today; `claims.html` lists every
  entry, where the pages mark it and how to check it; and the validator is
  fed entries with no basis, two bases, a basis that says another number
  and a link on a figure nobody can check, to prove it still refuses them.
- **`portfolio.test.js`** — every case study has all five stages and every
  result a basis; every case study says what it found, and the build refuses
  one that does not; no artifact claims to be public without a working link,
  and no lens stands without public work of its own behind it, shown in its
  view; the folds open when a page is printed; the lenses reorder
  without ever dropping a case study, each lens's home case studies first
  (`?lens=esg-csrd` opens on GAIA); and the validator is fed deliberately
  fabricated links and findings to prove it still rejects them. The homepage's
  project cards say what their case studies say (title, headline result,
  basis, checkability, lenses), link to them, and carry one lazy photo whose
  declared size is the file's own; no dossier id or link is left behind.
- **`cv.test.js`** — the CV, read back from the committed PDF without a
  browser: two A4 pages, printed by Chromium with every font embedded as
  TrueType; the name, the address, the links, the current role and every
  role with its organisation and dates, every degree and certificate, every
  case study's headline result with its checkability, and every public
  output; none of the claims the site dropped, no name the owner has not
  cleared, no number content/ does not have; and `assets/cv.hash` matching
  what content/ and the homepage say today and the PDF itself.
- **`corelog.test.js`** — the core log's depths, worked out by hand for the
  roles as they are and a year later, a role ending in the month it was
  logged, and one starting after it; the page shows what the dates give, and
  a role added or reordered on one side only stops the build.
- **`credentials.test.js`** — a certificate's `verifyUrl` is absent or an
  https page on an issuer's host (`VERIFY_HOSTS`, all on the link allowlist):
  not null, not a placeholder, not GitHub or LinkedIn; the homepage's cards
  are profile.json's, with a named Verify link exactly where there is one.
- **`testimonials.test.js`** — a quote without a source, a "LinkedIn" source
  that is not the recommendations address of a linkedin.com profile, or an
  on-request one without the date permission was given, is refused, as is a
  fourth entry, a quote over 200 characters or one stating a figure the
  claims ledger does not hold as written; with none, the homepage shows
  nothing, and with one, the quote, its figures marked, who said it and the
  source.
- **`widgets.test.js`** — the case studies' two games: nothing fetched until
  a host is within a screen of view, then the stylesheet before the script;
  the module runs without `script.js` (and with storage refused), wires a
  host before showing it, plays a round with one scoreboard and no second
  slider, never counts a re-drilled strike, draws no blind-drilling rate to
  claim a gain over, drills and floods at once under reduced motion or
  low-energy mode, and sizes its drawing labels for the scale they are
  drawn at, so a phone reads them at 11px or more. `npm run smoke` plays both
  in Chromium and measures those labels at 390 and 320px.
- **`phone.test.js`** — the journey map follows the stop across a reading
  line (below a phone's pinned band), not the next one arriving, zooms in
  further on a narrow band where the stops are close, keeps every name 11 to
  14px on screen and jumps under low-energy mode; You Draw It is drawn as
  wide as it is shown, and again at a new width; the 25 field photos are back
  on their case studies with their captions word for word, folded, lazy and
  at their files' own sizes, and the validator refuses a photo without a
  caption, a size or a file; the lightbox steps with buttons, arrow keys and
  a "2 of 5", goes round, keeps Tab inside and hands focus back. `npm run
  smoke` pins the band over none of its stop's text at 390 and 320px, checks
  the delta's names on a desktop, measures the chart's labels, and steps the
  lightbox in both themes.
- **`stats.test.js`** — the open counts: every published count is 5 or more
  or reads `<5`, and no `<5` can be worked out by subtraction, from one table
  or a chain of them (the rows the review that found it used are the test);
  figures are whole weeks, with nothing published before the first one ends;
  no share is made from a hidden count, small referrers are grouped, names
  the site does not use are published only as "other", no daily row reaches
  `content/stats.json`, and the payload `stats.html` shows has exactly the
  counter's fields. The fetcher runs end to end against a local server, and
  stays green with no source configured, no whole week yet, or a sheet the
  endpoint could not read this time.
- **`html.test.js`** — button types, named landmarks, dialog semantics, image
  dimensions, labelled controls, resolvable links, valid JSON-LD, and no
  stylesheet, script, preload or preconnect pointing off this origin. The one
  off-site address any shipped script may name is the Apps Script deployment
  the contact form posts to (the visit counter adds `?action=count`); nothing
  may use `navigator.sendBeacon`, which cannot leave cookies out; and every
  page loads `count.js` once, deferred. The field notes are read from their
  folder, `notes/`, so a link that climbs out of it wrongly fails too.
- **`csp.test.js`** — the Content-Security-Policy and referrer policy every
  page carries (see [What a page may run](#what-a-page-may-run)): one policy,
  straight after the charset; a hash for each inline script the page runs,
  read from the page itself, and none for a data block or for a script that
  is gone; nothing that would let an injected script run (`'unsafe-inline'`,
  `'unsafe-eval'`, `'unsafe-hashes'`, a scheme, a wildcard) and no `on…=""`
  attribute, which the policy would refuse; off the site, exactly the
  deployment `html.test.js` lets the scripts name and the host it redirects
  to, the form's only on the homepage; and the policy the build would write.
- **`notes.test.js`** — the field notes, their feed and the structured data
  (see [Field Notes and the feed](#field-notes-and-the-feed) and
  [Structured data](#structured-data)): the markdown reader refuses what is
  outside its subset (raw HTML, code, an image, a quotation, a table, an
  underscore, an indented line, a lazy continuation) and front matter YAML
  would read another way, each with its line; the validator refuses a note
  with no title, a date that is not a day or is still to come, a slug the
  counter cannot name, a tie to a case study or lens that does not exist, or
  a figure the claims ledger does not hold; the three first notes are dated
  2026-07-06 and their one lines are their own words; each note's page is
  dated, says the date is when it was first published here, links itself,
  its case study, the older and newer note and the feed, and carries an
  Article; `feed.xml` is well-formed Atom, newest first, `updated` the newest
  note's date, every id a tag URI that never carries the site's address;
  and every JSON-LD block on every page parses and says nothing `content/`
  does not.
- **`og.test.js`** — the preview cards (see [Preview images](#preview-images)):
  every page with an `og:image`, each field note's included, shows its own
  card there and in `twitter:image`, and the photo they all shared is gone;
  each card is a 1200×630 PNG within its size cap; and `assets/og/og.hash`
  fails it once a card's words (a note retitled, a page's `og:title`, the
  role in `profile.json`) have moved on without a new render, or a card was
  replaced by hand.
- **`images.test.js`** — the photos (see [The photos](#the-photos)): every
  WebP and AVIF in `assets/img/` is the file `assets/img/manifest.json`
  describes, by hash and by shape, each one made scored at an SSIM of 0.98
  or more against its original with no colour moved, each AVIF copy a tenth
  lighter than the WebP it stands in for, and each drawn by a page; every
  `url()` in a stylesheet names a file that is there; the hero's two
  preloads fetch the file `style.css` draws in that window, with no
  `fetchpriority`, and its later slides draw nothing until the rotation
  asks.
- **`apps-script.test.js`** — the contact form's backend
  (`google-apps-script/Code.gs`), run in a VM with stand-ins for Google's
  services: both ways in (the JSON post and the JavaScript-free form post,
  which gets a page back that never says "undefined"), formulas stored as
  text, the honeypot, and the per-submitter rate limit. And the visit
  counter's end of it: a visit adds to the right daily totals and a second
  one increments them in place, anything that is not exactly schema v1
  (an extra key, a wrong type, 21 features, a huge `kb`) changes nothing,
  the lock is taken (a count waits for it at most 1.5 s, and past 30 a
  minute not at all, so counts never keep a message waiting), `?test=1`
  stays off the public tab, `?action=stats` serves the rows to the right
  token and to nobody else, and each contact message is counted unless the
  site says the browser asked not to be tracked. And the health check's
  end: `CODE_VERSION` is the file's own hash, `?action=health` refuses a
  POST without `HEALTH_TOKEN` (and every POST while it is unset) before
  reading it, and with it sends one message down the form's own path,
  validated, limited and locked as a visitor's is, to a `Health` tab,
  emailing nobody and counting nothing. It cannot tell you the live
  deployment is configured; the weekly health check asks it, and
  `docs/owner-checklist.md` says how to check by hand.
- **`count.test.js`** — the visit counter's payload, field by field: the page
  (404 names itself), the lens the visit arrived with, the deepest part of
  `<main>` reached (one IntersectionObserver, no scroll handler), features
  clicked or fetched, deduplicated and capped at 20 (two CV links in one view
  add `cv-download` once), the referrer's host and nothing more of it, the
  viewport class and the KB transferred; one count per page view, none under
  Do Not Track or GPC, never an error; and a contact message sent under
  either says `count: false`. Every payload is run through the server's own
  schema check, every `data-analytics` name on the site must be one the
  counter keeps, and every CV and email link on a counted page must have one.
- **`navigation.test.js`** — an in-page link updates the address (so Back
  works) and moves focus to its target, Back and Forward land there again,
  the theme switch sits in the nav bar and names what
  it will do, and back to top waits a full screen and steps aside for every
  control in its corner, not whole regions; a jump lands again when the page
  grows, even in the frame before the first report of it. `npm run smoke`
  checks the same in a real browser: the next Tab after the skip link lands
  inside `<main>`, Back to the first entry returns focus to the link that
  left it, a first jump into or past section 05, and a shared link straight
  to it, lands under the nav bar and stays there, and
  at 390x844 back to top never covers a control from the hero to the footer,
  yet shows on the last screen.
- **`firstview.test.js`** — the hero's at-a-glance strip is exactly what
  `content/profile.json` says (a `null` fact is not drawn; a stand-in such as
  "TBC", a misspelt key or an impossible date fails validation), the hero has
  one primary action, the nav six links with no numbers, the play index sits
  out of the first view, and the nav lights Work on the homepage's projects.
  `npm run smoke` checks that the figures, the caption, the strip and the
  primary action are on the first screen at 1440×900 and 390×844 and in two
  laptop windows, 1366×657 and 1280×720.
- **`shell.test.js`** — every page but the homepage has the same five nav
  links, the current page marked, and one call to action with the address,
  the contact form and the CV; the theme switch only where `theme.js` runs,
  shipped hidden; the hand-authored pages' shell exactly as generated; the
  stored choice (or the system's) on `<html>` before the first paint, a
  press, blocked storage, Back from the page cache, and one choice shared
  with the homepage, which with none opens in the theme `theme.js` would
  (the system's, set on `<html>` from `<head>`, before its stylesheet, so
  no frame is drawn dark first); and the light palette twice and the same,
  the homepage's. `npm run smoke` follows the choice through the
  nav in a real browser, checks the system's setting with JavaScript off
  and on the homepage from its first frame, and every page at 320px.
- **`css.test.js`** — the six stylesheets kept to what the pages use: a
  selector that matches nothing on a page loading its sheet, nor anything a
  script those pages run could make (the icon font's `i` rules outlived
  it); a transition on `all`; an `@media` width that is not one of the
  twelve named breakpoints, or one break spelled two ways (899, 900 and
  901 were); a rule written twice; and a page that would declare the
  typefaces twice, or not at all.
- **`tooling.test.js`** — the machinery under the rest: the runner fails when
  any suite fails, keeps each suite's output in one block and counts the
  assertions that passed, `npm test` runs
  it rather than a hand-kept list of suites, the fake clock fires timers in
  order and only when told, and every page with a first-view budget exists
  and is measured.
- **`budget.test.js`** — the budgets themselves: `npm run budget -- --json`
  gives every budget its measure, ceiling and headroom; the ratchet, run on
  made-up measurements from far under to far over, lowers ceilings to what
  they hold plus 5% and never raises one (or touches a held one, or any line
  but a ceiling's); every page has a length budget at both sizes, the
  homepage's at or under the plan's 10 and 18 screens; the README's tables,
  and its figures for the first view's ceiling and the core script's
  weight, say exactly what `--readme` would write; and the receipt workflow asks for
  no more than it needs and cannot comment from a fork.
- **`receipt.test.js`** — the pull-request receipt, from fixture budgets and
  lengths: a rise with a plus, a fall with a minus, no change as 0, the
  CO₂e at 0.36 g per MB of 1024² bytes, a budget over its ceiling or new on
  one side, the open counts page held drawn full, and tables whose rows are
  as wide as their headers; and, measured with `--root` as the workflow
  measures main, a ceiling the branch moved, added or dropped.
- **`health.test.js`** — the weekly health check and the quarterly review,
  against fixtures with no network: a page Pages has not rebuilt in the
  hour since `main` moved is "not rebuilt yet", and one still stale days
  later is broken; a 404 or an unresolvable host is broken, LinkedIn's 999
  and a 429 are "not checkable from here" and say why, and HEAD is retried
  as GET before anything is called broken; a stale `verifiedOn`, a null
  `confirmedOn`, an available-from date that has passed and an AI factor
  set more than a quarter old wait on Moses; each answer Code.gs has given
  in its life is told apart, and no test message is posted to a deployment
  without the health check; the token in `HEALTH_URL` is never printed; the
  owner checklist's items, ticked and not, are read from the file, and
  each check finds its own; the issue is opened once, edited in place and
  closed when nothing is broken or waiting; the quarterly review opens one
  issue a quarter, and the plan's Phase 7 table says what
  `docs/review-checklist.md` says; and both workflows ask for no more than
  they need.
- **`cpu.test.js`** — the page's keys go through one listener, so one Escape
  closes one layer (terminal, then menu) and the
  backtick follows one rule for "typing"; one `mks.motionOK()` answers for
  reduced motion and low-energy mode, live; the time-zone table is fetched
  only when the journey map needs it; everything the core shares hangs off
  `window.mks`; section offsets are measured once a frame and a jump
  lands again as sections take their real height; sections skipped past are
  drawn once the page rests, and every image states its real shape; and every
  looping animation runs on transform and opacity and pauses out of view and
  in a hidden tab.

The jsdom harness (`tests/harness.js`) evaluates the theme script at the top
of `<body>`, `script.js`, and then the three modules the core fetches on
demand, so the suites see the homepage the way a visitor who used every
feature would — and a module that declared anything at the top level, or
reached for storage directly, fails `resilience.test.js`. The case studies'
games and Anatomy of a Prompt are booted with their own pages
(`widgets.test.js`, `carbon.test.js`). A suite that
tests timing passes `clock: true` and moves time with `await clock.tick(ms)`
instead of sleeping, so a 1.7-second timeout costs nothing to test.

## Health checks and the quarterly review

The tests above run on every pull request. What they cannot see is the live
site and the switches only Moses can throw: the open-counts Action ran
green twice in October 2026 and committed nothing, because its secret was
never set, and nothing said so where anyone would look. Two scheduled
workflows close that gap.

**Site health** (`.github/workflows/health.yml`, Tuesdays 05:41 UTC, or by
hand) runs `scripts/health.js` and keeps one issue, "Site health" (label
`health`): opened while anything is broken or waiting, edited in place on
later runs, and closed with a comment once nothing is. Each check is
*broken*, *waiting on Moses*, *not checkable from here* or *passing*:

- **The live site is `main`.** Every page in `sitemap.xml` answers 200 with
  the bytes `main` holds. A page `main` changed in the last hour is "not
  rebuilt yet"; one still stale after that is broken, and the issue names
  the version Pages is serving. Since `main` passes smoke in CI, this is
  smoke against the live site without running a browser there.
- **Links off the site**, in every page and in `content/`, answer below 400
  (HEAD, then GET, a second apart on one host). A host that refuses
  anything but a signed-in browser (LinkedIn's 999; the list is `REFUSERS`
  in the script) is listed as not checkable, never as broken.
- **What goes stale.** `meta.verifiedOn` more than a quarter old,
  `meta.confirmedOn` still null, an at-a-glance fact the owner checklist's
  table names still unstated or an `availableFrom` that has passed,
  `REVIEWED_ON` in `ai-carbon-data.js` more than a quarter old, and a CV
  printed before `content/` last changed (`assets/cv.hash`).
- **The owner's switches.** The contact form's deployment (the address in
  `script.js`) runs the repository's `Code.gs`: `GET ?action=health` answers
  with its `CODE_VERSION`, and older scripts are told apart by what they
  answer instead. The form end to end, once `HEALTH_URL` is set. The open
  counts' secret is set (the workflow passes only "true" or "false"), and
  `content/stats.json` holds a week, written within the last nine days.
- **`npm audit`** at high or critical. Every dependency here is a dev
  dependency: none ships to a visitor.
- **The owner checklist's open items**, counted from
  `docs/owner-checklist.md`, the ones the checks wait on named first. They
  are listed, but they do not keep the issue open by themselves.

The job stays green once it has written the issue; the issue is the signal.
GitHub notifies nobody when an issue is edited, and this one can stay open
for months while a switch waits on Moses, so a week in which a check breaks
that was not broken the week before (or one is fixed) also adds a comment,
naming the repository's owner, who is notified of it. A week like the one
before edits the issue quietly. Locally, `npm run health -- --dry-run`
prints the report and posts nothing.

**The contact form, end to end.** Once the current `Code.gs` is published,
give the Apps Script a second token, `HEALTH_TOKEN` (any long random
string, not `STATS_TOKEN`), and make the web app URL with
`?action=health&token=<that string>` a repository secret, `HEALTH_URL`.
Each week the check then asks the deployment for its version, and only if
it has the health check sends one test message (from an address of its own
each week, so nobody can spend the form's per-address limit ahead of it)
down the form's own path:
the same validation, limits, escaping and lock as a visitor's, written to a
`Health` tab, emailing nobody and adding nothing to the public counts. The
reply says whether `OWNER_EMAIL` and `TURNSTILE_SECRET` are set, the two
settings that break the form for real visitors without breaking the test.
Without the token, or while it is unset, `?action=health` refuses a POST
before reading it. `testHealth()` in the Apps Script editor does the same
without the token. Until `HEALTH_URL` is set, the check waits on Moses. If
`Code.gs` changes, `CODE_VERSION` has to change with it:
`npm run health -- --code-version` prints the new one, and
`tests/apps-script.test.js` fails until it is in.

**Quarterly review** (`.github/workflows/review.yml`) opens "Quarterly
review — YYYY Qn" (label `review`) on the first Monday of January, April,
July and October, carrying the monthly, quarterly and yearly checklist of
the plan's Phase 7 with links to `stats.html`, the owner checklist and the
latest health issue, and never a second one for the same quarter. The
checklist's words are in [docs/review-checklist.md](docs/review-checklist.md)
and only there; `tests/health.test.js` fails if the plan's table says
anything else. `node scripts/review.js --dry-run` prints the issue.

GitHub turns off scheduled workflows in a public repository after 60 days
without activity in it, and says so to nobody. So each week the health run
enables its own schedule, the quarterly review's and the open counts' again
through the API (with the workflow's `actions: write`), which counts as
activity: the way the keepalive-workflow action keeps schedules running,
without dummy commits. If that is ever refused, the run leaves a warning;
the Actions tab shows a disabled workflow, and one press turns it back on.

## Content pipeline

The site's facts used to live in several places at once — `index.html`, its
JSON-LD block, `field-report.html`, the README and the CV — with nothing
keeping them in step. They had already drifted.

Everything derived now comes from `content/`:

| Source | Feeds |
|---|---|
| `content/profile.json` | the homepage's JSON-LD (the Person, with the certificates as `hasCredential`, and the WebSite), `sitemap.xml`, the homepage's at-a-glance strip, its certificates and its core log's depths, the shared shell's call to action on every page but the homepage, the CV, the facts `content.test.js` holds every page to |
| `content/projects.json` | `case-studies.html` (with each case study's photos, game and findings), the homepage's six project cards (every case study not marked `homepageCard: false`), and each case study's headline result on the CV |
| `content/lenses.json` | the role-specific views (`water`, `climate-risk`, `sustainable-ai`, `esg-csrd`) |
| `content/research.json` | `research.html`, the CV's public work, and `carbon-ai.html`'s JSON-LD (the coach as a SoftwareApplication) |
| `content/notes/*.md` | a page per note, `notes/<slug>.html`; `feed.xml`; the homepage's links to the newest three; their entries in `sitemap.xml`; and each note's Article in its JSON-LD (and, by `npm run og`, its preview card) |
| `content/testimonials.json` | the homepage's testimonials, once there is one |
| `content/claims.json` | `claims.html` ("Check my numbers"), and the `data-claim` mark on every figure a generated page prints from `content/` |
| `content/stats.json` | `stats.html`, the open counts (written weekly by `scripts/fetch-stats.js`) |

```bash
npm run build:content     # regenerate everything derived from content/
npm run build:check       # fail if a generated file is out of date (runs in CI)
```

`index.html` and `field-report.html` stay hand-authored — they are long-form
editorial pages, and templating over their hand-tuned markup to remove
duplication a test already catches would trade a small problem for a large one.
The exceptions are regions the generator writes between markers: in
`index.html` the JSON-LD block, the at-a-glance strip, the six project
cards, the field notes' links, the certificates and the testimonials, and in
place, each core-log layer's depths and the date in the log's head.
`content.test.js` holds them to `content/` instead. `carbon-ai.html` and
`404.html` are hand-authored too, bar the shared shell: the generator writes
the nav and the call to action into them and the field report, between
`<!-- SHELL-NAV -->` and `<!-- SHELL-CTA -->` markers (and `theme.js` into
`carbon-ai.html`'s head, its footer between `<!-- SHELL-FOOT -->` markers,
and its structured data between `<!-- JSON-LD -->` markers), and
`build:check` fails if a page's copy drifts.

### Field Notes and the feed

Each note is a markdown file in `content/notes/`, named for its slug, with a
short front-matter block:

```markdown
---
number: 1
title: What 164 water points taught me about data
slug: what-164-water-points-taught-me
date: 2026-07-06
tag: Water
summary: Geophysics taught me that data only matters when someone stakes something on it.
caseStudy: groundwater
---

In the Freetown Complex, a wrong guess isn't a bad cell in a spreadsheet — …
```

`number` is its place in the series ("Note 01"); `date` the day it was first
published on this site; `tag` the topic the homepage shows; `summary` one
line of plain text, the homepage's line under the title, the page's
description and the feed's summary; and `caseStudy` or `lens` (one of the
two) the case study or role view it belongs with. `npm run build:content`
turns each into `notes/<slug>.html`: the shared shell, the light theme, the
visit counter, the date in a `<time>` with the words "first published on
this site", a permalink, its tag, a link to its case study or view, the
older and the newer note, an `Article` in its JSON-LD, a canonical address
and Open Graph tags for an article. A note's page sits a folder down, so
everything it loads and links climbs back with `../`, and it names itself to
the counter as `note-` and its slug (`data-page`), which no page at the root
can be called. The homepage links the newest three; from there the older and
newer links reach every note, and `feed.xml` and `sitemap.xml` list them all.
A note's page whose source is deleted is removed by the next build.

The markdown is a small subset, read by `scripts/lib/notes.js` with no
dependency: paragraphs, `*emphasis*`, `**strong**`, `[links](url)`, `##` and
`###` headings, and lists marked `- ` or `1. `, one line to an item. Anything
else (raw HTML, code, an image, a quotation, a table, an underscore, an
indented or nested line, a line run on from a list item) fails the build with
its line, rather than being printed wrong. A link is written from the site's
root (`index.html#ecoprompt`); the build makes it climb from `notes/`, and
the validator holds it to a file in the repository or a trusted host. The
front matter is plain YAML, one `key: value` to a line, because GitHub Pages'
Jekyll reads every markdown file's front matter: a value YAML would read
another way (one opening with a quote or a bracket, or holding `: ` or ` #`)
is refused, so a note cannot break the deploy. Jekyll also renders each
markdown file it finds, so until the deploy stops publishing `content/`
(docs/plan.md, Phase 6.1) a plain copy of each note is at
`/content/notes/<slug>.html` too; the canonical address is the page in
`notes/`. The validator (`checkNotes` in `scripts/lib/content.js`) refuses a
note with no title, a date that is not a day or is still to come, a slug
of more than 35 characters (with `note-` before it, the name has to keep to
the counter's 40), a file not named for its slug, a tie to a case study or lens
that does not exist, a reused number, a later number on an earlier date, or a
figure the claims ledger does not hold as written. A figure it does hold is
marked from the ledger, as on every generated page, and
`tests/claims.test.js` scans the notes' pages with the rest.

The three notes the homepage carried as folds are the first three articles,
word for word, with one change: the third pointed "further down" the
homepage to its chart, and on a page of its own says "on the homepage". None
had a date or a summary. Each is dated 2026-07-06, the day it first went on
the site (`git log -S` on its text finds commit `916a7c7`, merged to `main`
that day), and each one line is a line of the note itself.

`feed.xml` is Atom (RFC 4287), linked from the homepage and every note: every
note, newest first, whole, its links absolute. It is deterministic like
every generated file, with no build time in it: `updated` is the newest
note's date. Its id and each entry's are tag URIs (RFC 4151),
`tag:moseskolleh.github.io,2026:sustaintheworld/notes/<slug>`: a feed reader
takes an entry whose id has changed for a new one, and the site's address is
due to change (a domain of its own, Phase 5.5), so the ids never carry it.
Their authority and date are fixed for good, and `tests/notes.test.js` pins
them; the links carry the address.

The notes share one byte budget and one length budget, `notesWire` and
`notes/*.html` in `scripts/check-budget.js`, each held by the heaviest and
the longest note, so a new note needs no ceiling of its own, only to fit
under the one there is. The three today are short (about a hundred words
each), so a longer note will need its ceiling raised, which is a decision
to make on purpose rather than a test to work around.

### Preview images

```bash
npm run og      # draw assets/og/<page>.png for every page with an og:image, and write assets/og/og.hash
```

A link shared on LinkedIn or X unfurls into a preview. One drilling photo,
with no name on it, used to be the preview of every page. `scripts/build-og.js`
now draws a card per page and per field note, with the Chromium the smoke
test uses: the page's or the note's title, a line saying what it is (a
note's number, tag and date; another page's address), and who it is by,
Moses's name and role, in the site's colours and fonts, inline, so nothing
is fetched. The words are read, never written there: a note's from
`content/notes/`, the homepage's from the roles in `profile.json`, every
other page's from its own `og:title`. Each card is named as the visit
counter names its page (`assets/og/case-studies.png`,
`assets/og/note-<slug>.png`), and each page's `og:image` and
`twitter:image` (and a note's Article) point at its own.

The cards are 1200×630, the size LinkedIn, Facebook and X's large card
ask for, drawn at one pixel to one pixel. A card is flat colour and
anti-aliased text, a few hundred colours, so `scripts/lib/png.js` saves it
as an indexed PNG (one byte a pixel and a palette, with Node's zlib and
nothing else; where it needs to, it rounds each channel to a step of 4, too
fine to see on a text's edge): 12 to 21 KB a card, where Chromium's own PNG
was 36 to 55 KB and the photo they replace 122 KB. Each is held under 32 KB
(`OG_MAX_BYTES`), room for a title of three lines: every image in the
repository counts against one budget, every note adds a card, and a preview
is fetched once, by whoever unfurls the link. The ten cards take about
160 KB of it; the photo's removal paid for most of that, and the budget has
room for about five more notes' cards before something has to give. `assets/og/og.hash`, like `assets/cv.hash`,
records a hash of every card's words and of each image, so
`tests/og.test.js` fails when a title changes without a new render: after
`npm run build:content` changes a title, or a new note arrives, run
`npm run og` and commit the images with the hash. Chromium is only needed
to draw them; the test reads the committed files.

### Structured data

Every JSON-LD block is written by `npm run build:content`, from `content/`
alone:

| Page | Block | From |
|---|---|---|
| `index.html` | `Person`: name, role, where he is now (`affiliation` for the university where he is a doctoral researcher on a scholarship, `worksFor` for an employer), address, degrees awarded (`alumniOf`; the PhD in progress is not one), certificates (`hasCredential`, each with its issuer and year, and its verification page once `verifyUrl` is set), `knowsAbout`, `sameAs` | `content/profile.json` |
| `index.html` | `WebSite`, its author the Person by `@id` | `content/profile.json` |
| `notes/*.html` | `Article`: headline, one line, date, tag, author | `content/notes/*.md` |
| `carbon-ai.html` | `SoftwareApplication`: this site's edition of the EcoPrompt Coach, as `content/research.json` names and describes it; it `mentions` the newer tool by its repository, never claiming to be it or built on it | `content/research.json` |

`knowsLanguage` is written once `profile.json` states his languages, which it
does not yet; `sameAs` lists the profiles `profile.json` holds (GitHub,
LinkedIn and ORCID) and no other. `tests/notes.test.js` parses every block on every
page and fails on any value `content/` does not hold, bar the few that are
schema.org's own vocabulary (a credential's category). `404.html`, which
search engines are told not to index, has a title and a description.

### The rules the content model enforces

The point of a content model is not tidiness, it is that unsupported claims
should fail the build rather than ship. `scripts/lib/content.js` refuses:

- **A result with no basis.** Every outcome states how it was measured, and
  whether a reader can check it from outside. Where the answer is no — client
  work, internship deliverables — it says so rather than implying otherwise.
- **A case study that says only what was done.** Every one carries
  `findings`: one to four short entries, each a finding or a recommendation
  (at least one a finding), drawn from what the work's records and this site
  already say, with a basis wherever there is a figure.
- **A lens a reader can check nothing behind.** Each needs a case study, and
  a public artifact among its case studies.
- **An artifact that claims to be public without a working link.** `status` is
  one of `public` / `on-request` / `internal` / `planned`; only `public` may
  carry a URL, and anything `internal` must name who holds it.
- **A link this repository has not already vouched for.** Every URL must resolve
  to a file in the repo or to a host on a short allowlist. Writing a
  plausible-looking DOI or repository URL fails `npm test` — which is the
  point, because a fabricated link is the easiest thing to write and the
  hardest thing for a reader to check.
- **A venue that implies peer review without a DOI.** Two MSc theses were
  examined and defended, and a BSc dissertation examined; none is published in
  a journal, and nothing on the site says otherwise.
- **A role view with nothing a reader can open.** Every lens in
  `content/lenses.json` needs at least one public artifact or research output
  of its own beyond this site's own pages: from a case study that lists it
  first, or an output its own `lenses` place there, which the view's panel
  lists. A case study that only touches a lens does not count for it: the
  climate view passed on the sustainable-AI case's repositories until
  climatematch-pipeline, its own, was shown in it. The water view had two
  games here and nothing else until the groundwater toolkit's repository
  joined it.
- **A testimonial without a source** (`content/testimonials.json`): a
  LinkedIn recommendation's address on linkedin.com, or "on request" with
  the date permission was given.
- **A certificate's verification link off an issuer's host**: `verifyUrl` is
  left out until there is one, never written as a placeholder.

`tests/portfolio.test.js` feeds each of those rules deliberately bad data and
fails if the validator lets it through — the rules are only worth having if
they still fire on content nobody has written yet.

### The CV

`assets/Moses_Kolleh_Sesay_CV.pdf` is printed, not exported:

```bash
npm run cv      # print the CV with the smoke test's Chromium; writes the PDF and assets/cv.hash
```

`scripts/build-cv.js` builds it from `content/profile.json` (contact, roles,
degrees, certificates), `content/projects.json` (each case study's headline
result and the line of its basis), `content/research.json` (the public work)
and the homepage's own words (the hero's two sentences, each role's and
degree's lines, the toolkit with its proof), into the layout and headings of
`scripts/cv.html`, with the site's fonts inline: nothing is fetched. It is not
a page of the site: the PDF is what a recruiter downloads, and the homepage
already says everything in it. `tests/cv.test.js` reads the PDF back and fails
if it leaves out a role, a degree or a certificate, carries a figure
`content/` does not have, or was printed from anything but what `content/`
says now (`assets/cv.hash`): change a fact, run `npm run cv`, commit both.

### Every number has a basis (the claims ledger)

The rule that guards `content/` guards the hand-authored pages too: **no
number is typed straight into `index.html`, or any other page. It goes
through the claims ledger.**

`content/claims.json` holds every figure the site prints: its value as the
page writes it, what it counts, its basis (a case-study result, a field of
`profile.json`, an input of the calculators in `ai-carbon-data.js`, a cited
source with its URL, a budget `npm run budget` measures, a figure worked out
from other entries, or "illustrative" with the reason it has no source), and
whether a reader can check it (`public`, with where; `on-request`;
`not-checkable`). A result's basis and checkability are the case study's,
not repeated. Each figure on a page is marked with its entry:

```html
<span data-claim="water-points">164</span> water points
```

by hand in `index.html`, `carbon-ai.html`, `field-report.html` and
`404.html`, and by `npm run build:content` wherever a generated page prints
one from `content/` (`scripts/lib/claims.js` finds it by how the ledger
writes it). The build writes [`claims.html`](claims.html) from the ledger,
"Check my numbers": every figure, its basis, whether it can be checked, and
the pages that mark it, each linked to the place that shows it in sight: a
section, a view of the case studies, or, where every mark is folded (the
badge's method note, a role behind More, a photo's caption, the research
page's reproduction notes), into the fold, which the link names and the
page opens on arrival. It is linked from the homepage's figures, every
page's footer and the 404 page.

`tests/claims.test.js` fails on a mark that disagrees with its entry, an
entry with no basis or one that says another number, and a number on any page, in digits or
in words, in its text or its labels, tooltips, photo captions and
descriptions, that is neither marked nor a year, a date, a section number,
a standard's name, a place's coordinates, the phone number, "one", a count
of what the page shows in full ("seven case studies", held to the count in
`content/`) or another kind listed in `scripts/lib/claims.js` (`EXEMPT`,
`WORD_EXEMPT`). A count in words is a figure like any other: "team of
six" is an entry, marked on its number, as "164" is. A size said in words
("a fifth of a kettle", "twice as much") is caught too, unless it sums up
the factor set, as "an order of magnitude" does, which the test checks
against `ai-carbon-data.js`. The numbers the calculators work out in
the browser (the coach on `carbon-ai.html`, the homepage's chart, the
footer's receipt) are model outputs, not claims: their hosts are skipped
by name, must hold no figure in the HTML, and their inputs are entries
where the pages print them. What the scripts filling those hosts print of
their own is not skipped: each host names its script, whose strings are
read from the source and held to the ledger the same way, the field
terminal's lines (`modules/terminal.js`), the receipt's field-report size, You Draw It's words and the coach's tips
among them. A testimonial's
or a certificate's figure is marked like any other, and the build refuses
one the ledger does not hold as written. The open counts on `stats.html`
are the counter's own and skipped; the rules that page states (30 counts a
minute, nothing under 5 published, up to 20 features, the window-width
classes) are printed from the counter's code (`counterRules` in
`scripts/lib/content.js` reads `Code.gs`, `count.js` and
`scripts/fetch-stats.js`), marked `data-rule`, and held to it.

To add a figure: give it an entry, mark it on the page (`npm run
build:content` marks it in generated pages, by its value or a `forms`
phrase such as "five months"), and run `npm test`; an unmarked number is
printed with its page and the words around it.

### Keeping the profile honest over time

`content/profile.json` also carries `meta.verifiedOn`: the day the record is
logged as of, from which the open-ended facts (the "Present" role in
particular) fall due for a check. When that goes stale the test prints a
notice rather than failing — a suite that goes red on a calendar date is one
people learn to ignore. It is not Moses's word that the facts still hold:
that is `meta.confirmedOn`, null until he sets it himself (owner checklist
F5).

It is also the surface of the core log: the depths are measured from it, not
from the day of the build (which would make `npm run build:content` give a
different page each month), and the log's head says "LOGGED" and its month.
The CV ends "Facts last confirmed" and a day only once `confirmedOn` is set,
and says nothing of the kind before. So after changing either, run
`npm run build:content` and then `npm run cv`, and commit the redrawn
`index.html` with the new PDF and `assets/cv.hash`.

### Open counts

`stats.html` is built from `content/stats.json`, which only
`scripts/fetch-stats.js` writes. A weekly Action (`.github/workflows/stats.yml`,
Mondays early UTC, or by hand) fetches the counter's daily totals, suppresses
them, rebuilds the page, runs `npm test` and commits the two files if they
changed. The raw daily rows never enter the repository.

The field notes' page views are published as one row, `notes`, every note
together: one note's would mostly read `<5`, and hold a neighbour back with
it. The daily totals keep each note's under its own name.

What is published is whole weeks only, Monday to Sunday: last week, all time
from the first full week to last Sunday, and one line per week. The days
before the first Monday and the week still running are in no figure, so no
sum of the figures leaves a single day's count behind, and nothing is
published at all until a full week has ended. Every count under 5 is `"<5"`.
Where a table adds up to a total shown beside it (pages and window classes
to page views, the known lenses to lens-link visits, the weeks to all time),
a lone `"<5"` would be the total less the rest, so the smallest figure
beside it is held back too, as `"held"`, until nothing hidden can be worked
out, through any chain of such sums. `scripts/lib/content.js` fails the build
if a count under 5, one that subtraction would give away, a part week, today,
a named referrer under 5 or any field it does not know gets into
`content/stats.json`.

To switch it on, first give the Apps Script a `STATS_TOKEN` script property
(any long random string) and publish the current
`google-apps-script/Code.gs` as a new version of the existing deployment, so
that `?action=count` and `?action=stats` exist. `?action=stats` answers only
a request with `&token=` set to that string: its rows are not suppressed, and
the deployment's address is in `count.js` on every page. Then make the web
app URL with `?action=stats&token=<the string>` a repository **secret**
`STATS_SOURCE_URL` (Settings → Secrets and variables → Actions). Do it in
that order: an older deployment answers `?action=stats` with its health
check, and the Action fails on that rather than mistake it for an empty
week. The `Daily` sheet published as CSV also works as the source, but a
published tab is readable by anyone who has its link, which `stats.html`
says is not the case. Until the secret is set, the Action says so and
commits nothing, and the page says counting has not started; the run stays
green, but leaves a notice and a line in its summary saying why, and the
weekly health issue lists the open counts as waiting. The steps, and
how to check each, are items S1 and S2 in
[docs/owner-checklist.md](docs/owner-checklist.md). To run it locally:

```bash
STATS_SOURCE_URL='<url>' node scripts/fetch-stats.js && npm run build:content
```

The sheet's date column should be formatted as plain text; dates Apps Script
serialises as instants are read back to the Amsterdam date, anything else is
dropped and counted in the log. Nothing read from the source is ever printed.

## The visit counter and privacy

The site counts its own page views, so that each later change to it can be
judged against what readers actually do ([docs/plan.md](docs/plan.md),
Phase 1). It uses no analytics service, and the count sets no cookie and
reads or writes no browser storage. (The site itself remembers the theme,
low-energy mode, the reading speed and whether the intro has played, in the
visitor's own browser, and sends none of it.) All of it is `count.js`: 3 KB
(2 KB gzipped), loaded deferred on every page and counted in each page's
budget.

**Status.** Built, tested and on `main`, which the live site is built from,
since pull request #49 was merged (2026-09-27), but not yet counting: the live Apps Script has to be
published again with the counter's code first (item S1 in
[docs/owner-checklist.md](docs/owner-checklist.md)). Until then the counts
reach the old script. Every version of `Code.gs` committed here from
2026-07-17 on reads a count as a contact message with no name and refuses it,
so nothing is recorded and nobody is emailed; the 2025 versions would record
and email every one, which is why S1 starts by checking which version is
live.

**What one page view sends.** One POST, the first time the page is hidden or
left (`visibilitychange` to hidden, or `pagehide`), and never a second for the
same page view. This is the whole of one, exactly as `count.js` sends it:

```json
{"v":1,"page":"index","lens":"","deepest":"contact","features":["cv-download-hero","cv-download","module-interactives"],"ref":"www.linkedin.com","vp":"m","kb":284}
```

| Key | What it holds |
|---|---|
| `v` | `1`, the version of this format |
| `page` | the page's file name without `.html` (`index`, `case-studies`, `research`, `claims`, `carbon-ai`, `field-report`, `stats`), or the name a page gives itself with `data-page`: `404`, and a field note's `note-` and its slug |
| `lens` | the `?lens=` the page view arrived with, or `""` |
| `deepest` | the id of the furthest top-level part of `<main>` that came on screen: on the homepage one of its seven sections, from `journey` to `contact`; `csGrid` on the case studies; `""` on the pages that have no such part |
| `features` | up to 20 distinct names of things used: the site's `data-analytics` hooks (33 today, such as `cv-download-hero` and `receipt-open`), `cv-download` once for a view that used any CV link (the CV-downloads figure counts page views), `cv-download-terminal` when the field terminal's `cv` command fetches the CV, `module-<name>` for each on-demand module fetched and `contact-form-submit` |
| `ref` | the referring site's host only (`www.linkedin.com`); `""` if there was none, or it was this site |
| `vp` | the browser window's width as a class: `s` under 600 px, `m` under 1024 px, `l` wider |
| `kb` | whole KB this page view transferred, from the browser's Resource Timing API, so a cached revisit counts as the near-zero it is |

**What is never sent or stored.**

- No cookie, no browser storage and no id of any kind, so two page views
  cannot be tied to each other, or to a person. Every published figure is a
  count of page views, not of people.
- No `Referer` header and no full referring address, only its host.
- Nothing typed into the page.
- No IP address, browser, device or operating system, and no screen or
  window size beyond the three classes. Apps Script does not give the script the
  sender's address or headers, so there is nothing to store even by mistake.
  Google, which runs the endpoint, receives the request as it receives any
  other.
- No time finer than the day the count arrives.

**Do Not Track and Global Privacy Control.** If the browser sends either
(`navigator.doNotTrack` is `"1"` or `navigator.globalPrivacyControl` is
`true`), `count.js` stops before it adds a single listener, and nothing is
sent. With JavaScript off, nothing is sent either. If `script.js` fails to
load, the counter still counts, since it does not depend on it. A contact
message from such a browser carries `count: false`, and `Code.gs` leaves it
out of the daily contact total; a message sent with JavaScript off cannot
say so (Apps Script does not show the script the request's headers), and is
counted.

**Why a keepalive `fetch`, not `sendBeacon`.** The plan named
`navigator.sendBeacon`, the usual way to send something as a page closes. It
always sends the browser's cookies for the address it posts to — here
`script.google.com`, where a visitor signed in to Google has session cookies —
and a `Referer` unless the whole page changes its referrer policy, and it
cannot be told otherwise for one request. `fetch` with `keepalive: true`
outlives the page the same way, and it takes `credentials: 'omit'` and
`referrerPolicy: 'no-referrer'`. It is sent `mode: 'no-cors'` with a plain
string body, so there is no preflight, which Apps Script cannot answer, and
the page never reads the reply. `tests/html.test.js` fails if any script the
site ships calls `sendBeacon`.

**Where it goes.** To the same Google Apps Script deployment the contact form
posts to, at `?action=count`; the address is in `count.js`, and
`tests/html.test.js` fails if it differs from the form's. `Code.gs` accepts
only a payload that is exactly the one above in shape — those eight keys and
no others, each of the right type, at most 20 features, `kb` from 0 to
100,000 — and silently drops anything else. It then adds one to a handful of
daily totals in a `Daily` tab of Moses's Google Sheet, under the same lock the
contact form uses, waiting for it at most 1.5 s, and not at all past 30
counts a minute, so a burst of page views never keeps a contact message
waiting (a dropped count makes the figures a floor, as `stats.html` says):
`date` (Amsterdam), `metric`, `key`, `count`. No single page view is kept.
`GET ?action=stats&token=...` serves those daily totals to the weekly Action,
which holds the token as a secret, and to nobody else; once a week the Action
suppresses them and rebuilds [stats.html](stats.html) (see
[Open counts](#open-counts)).

**Seen from the page.** The count is a request like any other, so once it has
gone (after the tab has been hidden once), the footer's carbon badge shows a
leading "+" and the Receipt lists "1 off-site request not counted": a request
to another site that the browser will not let the page weigh, as after a
contact message.

**How the promise is held.** `tests/count.test.js` checks the payload field
by field and runs every one it builds through `Code.gs`'s own schema check;
`tests/apps-script.test.js` holds the server to the same schema;
`tests/html.test.js` allows the one off-site address and no `sendBeacon`; and
`npm run smoke` takes a real browser's count apart: exactly the eight keys, no
cookie, no `Referer`, once per page view, and nothing under Do Not Track,
Global Privacy Control or with JavaScript off. Every other browser context in
the smoke test opens with Global Privacy Control on, so a test run never sends
a count to the real endpoint.

## What a page may run

Every page carries a Content-Security-Policy, as a `<meta>` straight after
its charset (GitHub Pages cannot send headers), and a referrer policy. The
policy is what would stop markup that ever got into a page from running. Scripts run from
this origin, and inline ones only by the SHA-256 of their exact text, which
`npm run build:content` works out from each page as it stands and
`build:check` holds; there is no `'unsafe-inline'`, `'unsafe-eval'` or
`on…=""` attribute anywhere (a page script whose failure takes the `html.js`
mark off carries `data-js`, and the mark listens for it). Styles may be
inline, by choice: CSS runs nothing, and anything a style could fetch is held
to this origin. Off the site a page may reach the Apps Script deployment and
`script.googleusercontent.com`, where Apps Script redirects, and nothing else;
only the homepage's form may post there. A meta cannot set
`frame-ancestors`, so a page can still be framed. The referrer policy is
`strict-origin-when-cross-origin`: `count.js` needs the host of the page a
visit came from on this site, to believe a forwarded `?via=`, and a site
this one links to is told only that the visit came from this site's origin,
never the page or its query, which lets
the traffic pages of the repositories it links show where readers came
from. Why each directive is what it is: the comment above
`securityPolicy` in `scripts/build-content.js`. `tests/csp.test.js` and
`npm run smoke` hold it.

## Customisation Guide

### Colors
To change the color scheme, edit the CSS variables in `style.css`:

```css
:root {
    --primary-green: #7CFC00;      /* Main accent color */
    --dark-bg: #0a0a0a;            /* Main background */
    --darker-bg: #000000;          /* Darker sections */
    --card-bg: #1a1a1a;            /* Card backgrounds */
    --text-primary: #ffffff;        /* Primary text */
    --text-secondary: #b0b0b0;     /* Secondary text */
}
```

### Content
- Update personal facts in `content/profile.json` (they feed the JSON-LD, the at-a-glance strip and every other page's call to action) and projects in `content/projects.json`, then run `npm run build:content`; `npm test` names any hand-authored page that still disagrees
- Modify the rest of a section's content directly in the HTML
- Add or remove projects, experiences, and skills as needed

### Images
- All published images live in `assets/img/` as WebP; keep new ones under ~180 KB (e.g. `npx sharp-cli -i photo.jpg -o assets/img/photo.webp resize 900`), commit the photo, then run `npm run images` to re-encode it and record it (see [The photos](#the-photos))
- The link previews in `assets/og/` are drawn, not photographed: `npm run og` (see [Preview images](#preview-images))
- Hero backgrounds use the `-hero.webp` variants (1600 px wide), and their `-hero-800.avif` copies below 600px
- The journey map is generated, not drawn: edit `scripts/generate-journey-map.js` and re-run it to change stops

### Custom domain (recommended)
- Add a `CNAME` file with your domain and configure DNS per [GitHub Pages docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) — then update the `og:url`/canonical tags in `index.html`

## Browser Support

What CI runs every page in, on every pull request:

- ✅ Chromium, the build pinned by `playwright-core` — so Chrome and Edge,
  which share its engine
- ✅ Firefox, the build pinned by `playwright-core` (142 at the moment): its
  own CI job, which first passed on pull request #49 (2026-09-27), once what
  its first run found was fixed. The length budget is measured in Chromium
  only
- ✅ Phone width (390×844) and desktop (1440×900), in both themes, for the
  accessibility checks — a browser window at that size, not a real phone

Safari (WebKit) is not tested, on a Mac or an iPhone. Nothing on the site is
knowingly specific to one engine, but this list claims only what CI runs.

## Performance

This section used to claim a Lighthouse score of 95+ and sub-two-second loads,
with nothing measuring either. Claims like that decay quietly: by the time
anyone checked, the image total had grown past 3 MB while the README still said
"under 2 MB". So the numbers below are the ones `npm run budget` measures on
every run of `npm test`, and the build fails when they are exceeded. The
table itself is written by `npm run budget -- --readme` from those
measurements and the ceilings in `scripts/check-budget.js`, and `npm test`
fails while it says anything else, so it cannot drift the way the old claims
did.

<!-- BUDGET-TABLE:START — generated by scripts/check-budget.js (npm run budget -- --readme). Do not edit by hand. -->
| Budget | Measured | Ceiling |
|---|---|---|
| First view of the homepage on a desktop, over the wire (fonts included) | ~257 KB | 272 KB |
| First view of the homepage on a phone, over the wire (fonts included) | ~214 KB | 227 KB |
| Everything a full visit adds on demand (modules, scripts, map) | ~41 KB | 44 KB |
| Largest single image | ~180 KB | 189 KB |
| Every image in the repository | ~3.38 MB | 3.5 MB |
| Text-only field report, the HTML file (the size the footer quotes) | ~11 KB | 11 KB |
| Text-only field report, over the wire (with its visit counter) | ~7 KB | 8 KB |
| Case studies page, over the wire (fonts included) | ~109 KB | 109 KB |
| Open counts page, over the wire (fonts included; sized for a full page) | ~97 KB | 103 KB |
| Research outputs page, over the wire (fonts included) | ~97 KB | 99 KB |
| Check my numbers (`claims.html`), over the wire (fonts included) | ~99 KB | 101 KB |
| Each field note (`notes/*.html`), over the wire (fonts included; the heaviest) | ~88 KB | 93 KB |
| EcoPrompt Coach (`carbon-ai.html`), over the wire (fonts included) | ~111 KB | 111 KB |
<!-- BUDGET-TABLE:END -->

**What the estimate used to miss.** An earlier version of this table said
234 KB. Opening the page in a real browser measured over 500 KB. Two things
were never counted: about 100 KB of fonts, which came from Google and so were
never a file in this repository, and a second 150 KB hero image the slideshow
fetched "on idle" for every visit, whether or not it stayed the eight seconds
needed to see it. The fonts are now self-hosted and counted; the slideshow
fetches a slide only just before it shows it, and only while the hero is on
screen; and `npm run smoke` opens the page in Chromium and fails if what it
measures comes in above what the table claims. The honest number is larger
than the old one and smaller than the old truth.

**What "over the wire" means.** GitHub Pages compresses text, so HTML, CSS and
JS are counted gzipped — what a visitor actually downloads — while images and
fonts are counted as-is. The first view is `index.html`, its stylesheet, the
core script, the visit counter, the four font files, the icon and the one
preloaded hero image: the 1600px WebP on a desktop, its 800px AVIF copy on
a phone, which is why each has a budget. Everything else is fetched only when it is reached: the
journey map on the first scroll, the portrait and the six project photos as
you get to them (a 480px copy wherever that is enough), a case study's photos
when its row is opened, the remaining hero
backgrounds when the rotation needs them. So "every image in the repository" is what the repository
holds, not the cost of arriving.

**On-demand modules.** About two thirds of the site's JavaScript serves
features most visits never reach. It used to ship in one 155 KB file, parsed
and run on every visit. It now lives in `modules/`, and each file, like the
few data files features read, is fetched the moment it is first needed:

<!-- MODULE-TABLE:START — generated by scripts/check-budget.js (npm run budget -- --readme). Do not edit by hand. -->
| Module | Loads when | Gzipped |
|---|---|---|
| `modules/interactives.js` (+ `ai-carbon-data.js`) | section 05 or the footer receipt comes within a screen of the viewport, or a deep link lands there | ~17 KB |
| `modules/dossier.js` (+ `dossier.css`) | on `case-studies.html`, a game's host comes within a screen of view (the page's own loader, not `script.js`) | ~9 KB |
| `modules/terminal.js` | the backtick key or the footer button | ~4 KB |
| `modules/anatomy.css` + `anatomy.js`, on `carbon-ai.html` | Anatomy of a Prompt comes within 400px of the screen (`carbon-ai.js` fetches them) | ~5 KB |
| `assets/journey-map.svg` | the first sign a reader is heading down the page: a scroll, a key, a touch, or a deep link | ~5 KB |
| `assets/timezones.json` | the journey map arrives, for its "you?" mark (the zone is looked up in the page, never sent) | ~2 KB |
<!-- MODULE-TABLE:END -->

`npm run budget -- --readme` writes this table from `MODULE_TABLE` in
`scripts/check-budget.js`: the words are written there, the weights are
measured, and every file fetched on demand has a row, so the rows add up to
the on-demand budget above.

Modules are classic scripts sharing the page's global scope: they declare
nothing at the top level and reach the core only through `window.mks`.

Run `npm run budget` to see the current numbers, asset by asset. To make
room under a ceiling, remove something of equal weight rather than raise it
([docs/plan.md](docs/plan.md), "Stop doing"). The report ends by naming every
budget whose ceiling could come down: more than 10% headroom, and a ratchet
target (measured plus 5%, at least 1 KB or a tenth of a screen over it) below
the ceiling: "you could lower … from X to Y".

**Length is a budget too.** A long page costs a busy reader what a heavy one
costs the network, so every page is also held to a length: its scroll height
over the window's height, in screens, at 1440×900 and 390×844. `npm run
smoke` measures it in Chromium once the page has settled (fonts loaded, every
section drawn at its real height, on-demand features arrived, nothing opened)
and fails a page above its ceiling. The homepage's ceilings began as the
plan's targets, 10 and 18 screens (it was 19.4 and 32.7), and came down to
what it measured plus 5% once it met them; every other page's is what it
measured when the budget was set, plus 5% (the open counts page drawn full,
as the smoke's fixture draws a busy quarter, since that is the page the
weekly Action will commit).

<!-- LENGTH-TABLE:START — generated by scripts/check-budget.js (npm run budget -- --readme). Do not edit by hand. -->
| Page | Desktop, 1440×900 | Phone, 390×844 |
|---|---|---|
| `index.html` | 9.74 screens | 17.03 screens |
| `case-studies.html` | 11.85 screens | 19.78 screens |
| `carbon-ai.html` | 7.07 screens | 13.38 screens |
| `claims.html` | 7.54 screens | 13.53 screens |
| `brief.html` | 1.05 screens | 1.05 screens |
| `research.html` | 5.75 screens | 8.99 screens |
| `stats.html` | 10.97 screens | 16.25 screens |
| `field-report.html` | 4.4 screens | 7.44 screens |
| `404.html` | 1.05 screens | 1.05 screens |
| `notes/*.html` | 1.4 screens | 2.06 screens |
<!-- LENGTH-TABLE:END -->

```bash
npm run smoke -- --lengths-only        # just the lengths: every page, both sizes (writes .smoke/length.json)
npm run budget -- --ratchet --lengths .smoke/length.json
```

**Ceilings only move down.** `npm run budget -- --ratchet` lowers every
ceiling to what it measures plus 5% (at least 1 KB, or a tenth of a screen,
over it; bytes round up to a whole KB), rewrites this README to match, and
never raises one. One budget is held where it is, because it is sized for
something that has not happened yet: the open counts page once it is full
of counts.

**A carbon receipt on every pull request.** `.github/workflows/receipt.yml`
measures `main` and the pull request with the pull request's own scripts
(`check-budget.js --json`, and `smoke.js --lengths-only` in the Chromium
build CI pins) and posts one comment, updated on each push: the bytes of
every budget and how they moved, the estimated CO₂e of each page's first
view, and how each page's length moved at both sizes. Each side keeps its
own ceilings (main's are read from main's copy of `check-budget.js`), so a
ceiling the pull request moves shows what it was. The CO₂e uses the
constant the footer badge uses (Sustainable Web Design model v3, 0.36 g
per MB transferred, which allocates data-centre, network and device energy
per byte). `scripts/receipt.js` writes
it from two budget files and two length files; on a fork, whose token cannot
comment, it goes to the job summary instead. The receipt reports; the CI
workflow is what fails a pull request over a budget.

**Measured in a browser, not scored.** `npm run smoke` runs every page in
headless Chromium (its own job in CI) and reports the bytes actually
transferred. It does not compute a Lighthouse score, and none is claimed. To
check for yourself:

```bash
npx lighthouse https://moseskolleh.github.io/ --view
```

- **Optimizations**:
  - Minimal dependencies (no framework, no bundler)
  - Lazy loading for images and hero backgrounds; on-demand modules for the features
  - One passive, frame-coalesced scroll listener for the navbar, progress bar, active link and scroll-to-top button; section offsets measured once, not per event
  - The hero rotation stops in hidden tabs and once the hero has scrolled away
  - Sections are laid out and painted only as they near the screen (`content-visibility: auto`, where the browser anchors scrolling; a section the reader has passed stays drawn); every looping animation runs on transform and opacity, which the compositor handles alone, and pauses out of view and in hidden tabs. Measured at 4× CPU slowdown in Chromium (medians of 15 loads before, 10 after): layout on load 238 → 125 ms, the longest task 238 → 110 ms, and main-thread work while nobody touches the page 1,023 → 16 ms per 3 s at the top and 1,250 → 7 ms mid-page; `npm run smoke` holds the idle figure under a ceiling
  - Intrinsic `width`/`height` on every image, so nothing shifts as they arrive

### The photos

A phone fetched the hero's 1600px photo, the same file as a desktop and
about half of its first view, to draw behind an overlay that lets at most
22% of it through; and most photos had been saved at a higher quality than
anyone can see. `npm run images` (`scripts/build-images.py`) does three
things, each held to one test of likeness: an SSIM of 0.98 or more (luma,
the standard 11×11 Gaussian window) against the photo as first committed,
with no colour channel's mean moved by more than one level. Looked at side
by side at twice their size, files at 0.98 could not be told from the
originals; at 0.97 the finest texture had begun to smooth.

- **Every WebP re-encoded** to the lowest quality that passes, where that
  is at least 5% lighter: 34 of 36, 3.22 MB to 2.80 MB, which every browser
  downloads, old or new.
- **An 800px AVIF copy of each hero photo**, drawn below 600px wide and
  preloaded there in place of the full size (`style.css`, `.hero-bg-1` to
  4; the preload's media query is the stylesheet's, so a window fetches
  one file). A browser that does not read AVIF gets the full-size WebP, as
  every phone did before: an 800px WebP as like its source weighs 69–88 KB,
  and four would not fit the image budget.
- **AVIF beside a WebP only where it is a tenth lighter at the same
  likeness**, for the photos the homepage draws: the fourth hero photo and
  the portrait. Measured this way AVIF seldom pays on a photo that was a
  WebP already, since a WebP re-encode keeps much of the original's own
  pattern; it does pay on a freshly resized copy.

The images budget counts every file, a WebP and its AVIF copy both, so the
copies (0.40 MB) were paid for out of the re-encoding, and the repository's
images fell from 3.41 MB to 3.39 MB. `assets/img/manifest.json` records each
file's quality, score and hash and its original's git blob, so a second run
starts from the original rather than re-encoding a re-encode, and
`tests/images.test.js` fails on a photo replaced by hand or added without a
run. The hero's preload carries no `fetchpriority`: in Chromium the largest
paint is the hero's words, never its photo, at 1440×900 and 390×844, with
the network and CPU throttled or not.

```bash
npm run images            # re-encode and write the copies (Python 3, Pillow 11.2+ with AVIF, numpy, git)
npm run images -- --plan  # say what it would do; write nothing
```

### Fonts

Inter, Space Grotesk and IBM Plex Mono live in `assets/fonts/`, subset to the
same Latin range Google Fonts served and instanced to the weights the
stylesheets use (Inter 400–600, Space Grotesk 400–700, Plex Mono 400 and 500):
76 KB in four files, against about 100 KB and two extra origins before. They
are the last third-party request the site had, and `tests/html.test.js` now
fails if one comes back.

```bash
npm run fonts:build     # fetch the sources, subset, write assets/fonts/ and the @font-face blocks
npm run fonts:check     # verify the committed files against their manifest (runs in npm test)
```

`scripts/build-fonts.js` records each file's source URL and hash in
`assets/fonts/manifest.json` and writes the `@font-face` block between the
`FONTS:START` / `FONTS:END` markers in each stylesheet. All three families are
under the SIL Open Font License; the notices are in
`assets/fonts/LICENSE-OFL.txt`.

## Accessibility

Checked by `tests/html.test.js` on every run, so these are enforced rather than
aspirational:

- Semantic HTML5 elements, one `<main>` per page, named `<nav>` landmarks, a skip link on every page
- Every `<button>` carries an explicit `type` (a missing one submits the form
  it sits in)
- Every form control has an accessible name; every image has `alt` plus
  intrinsic `width`/`height`
- The case studies' photo lightbox is a real modal: `role="dialog"`,
  `aria-modal`, an accessible name (the caption, or the alt text), focus moved
  in and restored to the photo on close, Escape to close, Tab kept inside;
  previous, next, the arrow keys and a "2 of 5" step through a case study's
  photos, and without JavaScript each photo is a link to itself
- Skip-to-content link that targets an element which exists and moves focus
  there, so the next Tab lands inside `<main>`; every in-page link moves focus
  and updates the address (`tests/navigation.test.js`, `npm run smoke`)
- Single-letter shortcuts stand down while a form control has focus
- Escape closes one layer at a time: the field terminal, then the menu
- No duplicate `id`s, no focusable element inside an `aria-hidden` container

`npm run smoke` adds axe-core in a real browser: every page at 1440×900 and
390×844 in both themes, the homepage again with the carbon receipt, the
terminal and the phone menu open, and with its script blocked,
the case studies with both games played, a row of photos open and the
lightbox open, and the coach's page with its scripts blocked. Any violation fails, contrast included —
but axe fails only what it can decide, and text over an image or a gradient
it leaves for a person to review.

Not machine-checked, and worth a manual pass when the design changes:
contrast over images and gradients, focus-visible styling, and screen-reader
flow through the interactive widgets.

## Contact

**Moses Kolleh Sesay**
- 📧 Email: [moseskollehsesay@gmail.com](mailto:moseskollehsesay@gmail.com)
- 💼 LinkedIn: [linkedin.com/in/moseskollehsesay](https://linkedin.com/in/moseskollehsesay)
- 🐙 GitHub: [github.com/moseskolleh](https://github.com/moseskolleh)
- 🆔 ORCID: [orcid.org/0009-0002-9429-1672](https://orcid.org/0009-0002-9429-1672)
- 📍 Location: Pavia, Italy

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspiration: EcoSearch theme (environmental sustainability focus)
- Icons: an inline SVG sprite drawn from [Font Awesome Free](https://fontawesome.com/) (CC BY 4.0)
- Fonts: [Inter](https://github.com/rsms/inter), [Space Grotesk](https://github.com/floriankarsten/space-grotesk) & [IBM Plex Mono](https://github.com/IBM/plex), self-hosted under the SIL Open Font License
- Map data: [Natural Earth](https://www.naturalearthdata.com/) via world-atlas, projected with d3-geo
- Hosting: [GitHub Pages](https://pages.github.com/)

## Future Enhancements

- [x] Blog section for sustainability articles (Field Notes)
- [x] Dark/Light theme toggle
- [x] Project detail pages (case studies, with a teaser card for each on the homepage)
- [x] Interactive data visualizations (journey map, AI cost widget, impact charts)
- [x] PDF resume download (printed from `content/` by `npm run cv`)
- [ ] Newsletter subscription
- [ ] Testimonials (the block and its rules are built; it shows once someone has agreed to be quoted)
- [ ] Custom domain

---

**Building a sustainable future through data-driven environmental solutions** 🌍

Made with 💚 by Moses Kolleh Sesay
