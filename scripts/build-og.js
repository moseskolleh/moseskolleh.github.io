#!/usr/bin/env node
// ===================================================================
// BUILD OG — a preview image for every page and every field note
//
//     npm run og          render assets/og/<page>.png, one per page that
//                         has an og:image, and write assets/og/og.hash
//
// One drilling photo, with no name on it, was the preview of every page:
// a link to the case studies shared on LinkedIn looked the same as a link
// to a field note (docs/plan.md, Phase 5.3). Each page now has a card of
// its own, 1200×630 (the size LinkedIn, Facebook and X's large card ask
// for): the page's or the note's title, a line saying what it is, and who
// it is by, Moses's name and role, in the site's colours and typefaces.
//
// What each card says is read, not written here: a note's title, number,
// tag and date from content/notes/, the other pages' titles from their own
// og:title (less " — Moses Kolleh Sesay"), the homepage's from the roles in
// content/profile.json, and the name and role from profile.json. The
// pages' cards say "Portfolio" above the title where a note's says which
// note it is: an address would date with the site's move to a domain of
// its own. Chromium
// draws the card (the build smoke.js and npm run cv use), with the site's
// fonts inline, so nothing is fetched.
//
// Small on purpose. Every image the repository holds counts against one
// budget (scripts/check-budget.js, allImages), every note adds a card, and
// a preview is fetched once, by whoever unfurls the link. A card is flat
// colour and anti-aliased text, so it is saved as an indexed PNG
// (scripts/lib/png.js): 12 to 21 KB, where Chromium's truecolour PNG was
// 36 to 55 KB and the photo the cards replace 122 KB. tests/og.test.js
// holds each under OG_MAX_BYTES, 32 KB, which leaves room for a title of
// three lines; past it, a shorter title is the fix.
//
// assets/og/og.hash records a hash of every card's words, this file and
// its template, and of each PNG, so tests/og.test.js fails once a title has
// changed without a new render, or a card was replaced by hand. Run this
// after npm run build:content, and commit the images and the hash.
// ===================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const content = require('./lib/content.js');
const { indexed } = require('./lib/png.js');

const ROOT = content.ROOT;
const OG_DIR = path.join(ROOT, 'assets', 'og');
const HASH_FILE = path.join(OG_DIR, 'og.hash');
const SIZE = { width: 1200, height: 630 };
const OG_MAX_BYTES = 32 * 1024;
const SITE = 'https://moseskolleh.github.io/sustaintheworld/';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const dayName = (d) => { const [y, m, day] = d.split('-'); return `${+day} ${MONTHS[+m - 1]} ${y}`; };

/** Every page with an og:image: the root's, then the field notes. */
function ogPages(root = ROOT) {
    const notesDir = path.join(root, 'notes');
    const notes = fs.existsSync(notesDir) ? fs.readdirSync(notesDir).filter(f => f.endsWith('.html')).sort().map(f => `notes/${f}`) : [];
    return fs.readdirSync(root).filter(f => f.endsWith('.html')).sort().concat(notes)
        .filter(rel => /<meta property="og:image"/.test(fs.readFileSync(path.join(root, rel), 'utf8')));
}

/** A page's card's name: its file's, or a note's "note-" and slug, as the visit counter names it. */
const cardName = (rel) => (rel.startsWith('notes/') ? `note-${rel.slice(6, -5)}` : rel.replace(/\.html$/, ''));
/** Where a page's card is, as its og:image gives it. */
const cardUrl = (rel) => `${SITE}assets/og/${cardName(rel)}.png`;

/** What each card says, from content/ and the pages as built. */
function cards(root = ROOT) {
    const profile = JSON.parse(fs.readFileSync(path.join(root, 'content', 'profile.json'), 'utf8'));
    const notes = content.loadNotes(path.join(root, 'content', 'notes'));
    const by = { name: profile.person.name, role: profile.person.jobTitle };
    return ogPages(root).map((rel) => {
        const html = fs.readFileSync(path.join(root, rel), 'utf8');
        const ogTitle = unesc((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '');
        const note = rel.startsWith('notes/') && notes.find(n => `notes/${n.slug}.html` === rel);
        let kicker;
        let title;
        if (note) {
            kicker = `Field note ${String(note.number).padStart(2, '0')} · ${note.tag} · ${dayName(note.date)}`;
            title = note.title;
        } else if (rel === 'index.html') {
            kicker = 'Portfolio';
            title = `Open to ${profile.atAGlance.targetRoles}`;
        } else {
            kicker = 'Portfolio';
            title = ogTitle.replace(new RegExp(` — ${by.name}$`), '');
        }
        return { rel, name: cardName(rel), kicker, title, by };
    });
}

/** The fonts, inline: the card fetches nothing. */
function fontFaces() {
    const file = (name) => fs.readFileSync(path.join(ROOT, 'assets', 'fonts', `${name}.woff2`)).toString('base64');
    return [['Space Grotesk', 'space-grotesk-latin', '300 700'], ['Inter', 'inter-latin', '100 900'], ['IBM Plex Mono', 'ibm-plex-mono-latin-400', '400']]
        .map(([family, f, weight]) => `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url(data:font/woff2;base64,${file(f)}) format('woff2'); }`)
        .join('\n');
}

// The card: the site's dark palette and its green, the logo's rings, the
// kicker in mono, the title as large as its length allows, and the byline.
const TEMPLATE = (card, fonts) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>
${fonts}
* { margin: 0; box-sizing: border-box; }
html, body { width: ${SIZE.width}px; height: ${SIZE.height}px; background: #0a0a0a; color: #ffffff; overflow: hidden; }
body { display: flex; flex-direction: column; justify-content: space-between; padding: 64px 72px; border-left: 12px solid #7CFC00; font-family: 'Inter', sans-serif; }
.kicker { font-family: 'IBM Plex Mono', monospace; font-size: 26px; letter-spacing: 0.06em; text-transform: uppercase; color: #7CFC00; }
h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; line-height: 1.12; letter-spacing: -0.01em; font-size: ${card.title.length > 60 ? 56 : card.title.length > 36 ? 68 : 84}px; max-width: 1000px; }
.by { display: flex; align-items: center; gap: 22px; }
.by svg { width: 64px; height: 64px; color: #7CFC00; flex: none; }
.name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 32px; }
.role { font-size: 24px; color: #b0b0b0; margin-top: 2px; }
</style></head><body>
<p class="kicker">${esc(card.kicker)}</p>
<h1>${esc(card.title)}</h1>
<div class="by">
<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.35"/><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.55"/><circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.8"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/></svg>
<div><p class="name">${esc(card.by.name)}</p><p class="role">${esc(card.by.role)}</p></div>
</div>
</body></html>`;

const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
/** Everything a card is drawn from: its words, this file (and so its template). */
const sourceHash = (list) => sha(JSON.stringify(list.map(({ name, kicker, title, by }) => ({ name, kicker, title, by }))) + fs.readFileSync(__filename, 'utf8'));

function readHashFile(file = HASH_FILE) {
    if (!fs.existsSync(file)) return null;
    const out = { source: null, images: {} };
    fs.readFileSync(file, 'utf8').split('\n').forEach((line) => {
        const m = line.match(/^(source|png)\s+([0-9a-f]{64})\s+(.+)$/);
        if (!m) return;
        if (m[1] === 'source') out.source = m[2];
        else out.images[m[3]] = m[2];
    });
    return out;
}

function writeHashFile(list, pngs) {
    const lines = [
        '# Written by npm run og (scripts/build-og.js). tests/og.test.js fails if any',
        '# line no longer matches: run npm run og again and commit the images with it.',
        `source ${sourceHash(list)}  every card's words, and scripts/build-og.js`
    ].concat(list.map(c => `png    ${sha(pngs[c.name])}  assets/og/${c.name}.png`));
    fs.writeFileSync(HASH_FILE, lines.join('\n') + '\n');
}

// The Chromium smoke.js uses: $SMOKE_CHROME, Playwright's own, or the system's.
function findChromium(engine) {
    if (process.env.SMOKE_CHROME) return process.env.SMOKE_CHROME;
    try {
        const p = engine.executablePath();
        if (p && fs.existsSync(p)) return p;
    } catch (e) { /* not installed */ }
    for (const candidate of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
        try {
            const p = execSync(`command -v ${candidate}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
            if (p) return p;
        } catch (e) { /* keep looking */ }
    }
    return null;
}

async function main() {
    const list = cards();
    const fonts = fontFaces();
    const { chromium } = require('playwright-core');
    const executablePath = findChromium(chromium);
    if (!executablePath) throw new Error('no Chromium found (set SMOKE_CHROME=/path/to/chrome)');
    const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-component-update'] });
    const pngs = {};
    try {
        const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
        await page.route('**/*', route => route.abort());
        for (const card of list) {
            await page.setContent(TEMPLATE(card, fonts), { waitUntil: 'load' });
            const loaded = await page.evaluate(async () => { await document.fonts.ready; return Array.from(document.fonts, f => `${f.family}: ${f.status}`); });
            const missing = loaded.filter(f => !/: loaded$/.test(f));
            if (missing.length) throw new Error(`${card.rel}: fonts did not load: ${missing.join(', ')}`);
            // The title has to fit: one that runs past the card's room is cut, not shrunk.
            const over = await page.evaluate(() => document.body.scrollHeight > innerHeight || document.querySelector('h1').scrollWidth > document.querySelector('h1').clientWidth);
            if (over) throw new Error(`${card.rel}: "${card.title}" does not fit the card`);
            pngs[card.name] = indexed(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...SIZE } })).png;
            if (pngs[card.name].length > OG_MAX_BYTES) throw new Error(`${card.rel}: its card is ${pngs[card.name].length} bytes, over ${OG_MAX_BYTES}`);
        }
    } finally {
        await browser.close();
    }
    fs.mkdirSync(OG_DIR, { recursive: true });
    // A card for a page that has gone goes with it.
    fs.readdirSync(OG_DIR).filter(f => f.endsWith('.png') && !pngs[f.slice(0, -4)]).forEach(f => fs.rmSync(path.join(OG_DIR, f)));
    list.forEach((c) => {
        fs.writeFileSync(path.join(OG_DIR, `${c.name}.png`), pngs[c.name]);
        console.log(`  → assets/og/${`${c.name}.png`.padEnd(46)} ${(pngs[c.name].length / 1024).toFixed(1)} KB  ${c.title}`);
    });
    writeHashFile(list, pngs);
    console.log(`  → assets/og/og.hash  source ${sourceHash(list).slice(0, 12)}…`);
}

if (require.main === module) {
    main().catch((err) => { console.error(`\n  npm run og: ${err.message}\n`); process.exit(1); });
}

module.exports = { cards, ogPages, cardName, cardUrl, sourceHash, readHashFile, HASH_FILE, OG_DIR, SIZE, OG_MAX_BYTES, SITE };
