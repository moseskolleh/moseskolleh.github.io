// A preview image of its own for every page and every field note.
//
// One drilling photo, with no name on it, was the preview of every page.
// npm run og (scripts/build-og.js) now draws a 1200×630 card for each page
// that has an og:image: its title, what it is, and who it is by. This
// fails when:
//
//   · a page's og:image or twitter:image is not its own card;
//   · a card is missing, is not a 1200×630 PNG, or is over the size the
//     image budget can carry (OG_MAX_BYTES);
//   · a card's words have changed since it was drawn (a note retitled, a
//     page's og:title edited, Moses's role) or a card was replaced by
//     hand: assets/og/og.hash records both, as assets/cv.hash does for the
//     CV, so run npm run og and commit the images with it;
//   · a card says what content/ does not.
//
// Run with: node tests/og.test.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const og = require('../scripts/build-og.js');
const content = require('../scripts/lib/content.js');

const ROOT = content.ROOT;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let failures = 0;
function assert(cond, msg) {
    if (cond) {
        console.log('PASS:', msg);
    } else {
        console.log('FAIL:', msg);
        failures++;
    }
}

const cards = og.cards();
const pages = og.ogPages();
const hash = og.readHashFile();
const profile = JSON.parse(read('content/profile.json'));
const notes = content.loadAll().notes;

// Every page a link can be shared to has a card, the notes among them.
assert(pages.length >= 10 && notes.every(n => pages.includes(`notes/${n.slug}.html`)) && ['index.html', 'case-studies.html', 'carbon-ai.html'].every(p => pages.includes(p)),
    `Pages: every page with an og:image, each field note included, has a card (${pages.length})`);

// --- Each page shows its own --------------------------------------------
pages.forEach((rel) => {
    const html = read(rel);
    const meta = (name) => (html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`)) || [])[1];
    const url = og.cardUrl(rel);
    assert(meta('og:image') === url && (meta('twitter:image') === undefined || meta('twitter:image') === url),
        `${rel}: its og:image (and twitter:image) is its own card, ${url.replace(og.SITE, '')}`);
    assert(meta('og:image:width') === undefined || (meta('og:image:width') === '1200' && meta('og:image:height') === '630'), `${rel}: the card's size as it states it is 1200×630`);
});
assert(!fs.existsSync(path.join(ROOT, 'assets', 'img', 'og-image.jpg')) && pages.every(rel => !/og-image\.jpg/.test(read(rel))),
    'Pages: the one photo they all shared is gone, and nothing points at it');
notes.forEach((n) => {
    const article = JSON.parse((read(`notes/${n.slug}.html`).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1] || '{}');
    assert(article.image === og.cardUrl(`notes/${n.slug}.html`), `notes/${n.slug}.html: its Article's image is its card`);
});

// --- Each card: a 1200×630 PNG, small, and the one the hash names ---------
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
assert(!!hash && !!hash.source, 'Hash: assets/og/og.hash records what the cards were drawn from');
cards.forEach((c) => {
    const file = path.join(og.OG_DIR, `${c.name}.png`);
    const buf = fs.existsSync(file) ? fs.readFileSync(file) : null;
    const png = buf && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    assert(!!png && buf.readUInt32BE(16) === og.SIZE.width && buf.readUInt32BE(20) === og.SIZE.height,
        `assets/og/${c.name}.png: a PNG of 1200×630 (${png ? `${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}` : 'missing'})`);
    assert(!!buf && buf.length <= og.OG_MAX_BYTES, `assets/og/${c.name}.png: ${buf ? (buf.length / 1024).toFixed(1) : '?'} KB, within ${og.OG_MAX_BYTES / 1024} KB`);
    assert(!!buf && !!hash && hash.images[`assets/og/${c.name}.png`] === sha(buf), `assets/og/${c.name}.png: the image og.hash records, not one replaced by hand`);
});
const stray = fs.readdirSync(og.OG_DIR).filter(f => f.endsWith('.png') && !cards.some(c => `${c.name}.png` === f));
assert(stray.length === 0, `Cards: none for a page that has gone (${stray.join(', ') || 'none'})`);
assert(!!hash && hash.source === og.sourceHash(cards),
    'Hash: every card was drawn from the words the pages and content/ say now (if not, run npm run og and commit the images and the hash)');

// --- What a card says is content/'s ---------------------------------------
cards.forEach((c) => {
    assert(c.by.name === profile.person.name && c.by.role === profile.person.jobTitle, `${c.rel}: its card is by ${profile.person.name}, ${profile.person.jobTitle}`);
    const n = notes.find(x => c.rel === `notes/${x.slug}.html`);
    if (n) {
        assert(c.title === n.title && c.kicker.includes(n.tag) && c.kicker.includes(String(n.number).padStart(2, '0')),
            `${c.rel}: its card is the note's title, number and tag`);
    }
});

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
