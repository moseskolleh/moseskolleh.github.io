// The stylesheets, kept to what the pages use.
//
// Six stylesheets had grown by accretion: rules for the icon font the
// SVG sprite replaced, for markup that had since left the page, a
// transition on `all` (so a theme switch or a resize animated whatever
// happened to change), and widths in @media queries that differed by a
// pixel for the same break (899, 900 and 901). Each was a few bytes on
// every page and a puzzle for whoever read the sheet next. This fails
// when:
//
//   · a selector in a stylesheet matches nothing on any page that loads it,
//     and nothing a script those pages run (or the template that writes
//     them) could make it match;
//   · a transition animates `all`, or hides what it animates in a token;
//   · an @media width is not one of the named breakpoints below, or one is
//     spelled two ways (max-width: 900px beside min-width: 900px);
//   · one rule's selector appears twice in the same context of a sheet;
//   · a page's first view would declare the typefaces twice, or not at all
//     (why there is no fonts.css: see the end).
//
// Run with: node tests/css.test.js

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { sitePages } = require('../scripts/check-budget.js');
const content = require('../scripts/lib/content.js');

const ROOT = path.join(__dirname, '..');
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

// The stylesheets this holds. modules/*.css are not (yet).
const SHEETS = ['style.css', 'carbon-ai.css', 'content.css', 'notes.css', 'stats.css', 'claims.css'];

// A stylesheet as a flat list of rules: each selector list with the @media
// or @supports it sits in. @font-face and @keyframes hold no selectors.
function rules(css) {
    const out = [];
    (function walk(text, context) {
        let i = 0;
        while (i < text.length) {
            const open = text.indexOf('{', i);
            if (open < 0) break;
            const prelude = text.slice(i, open).trim().replace(/\s+/g, ' ');
            let depth = 1;
            let j = open + 1;
            while (depth && j < text.length) {
                if (text[j] === '{') depth++;
                else if (text[j] === '}') depth--;
                j++;
            }
            const body = text.slice(open + 1, j - 1);
            if (/^@(media|supports|container)\b/.test(prelude)) walk(body, context.concat(prelude));
            else if (!prelude.startsWith('@')) out.push({ selector: prelude, body: body.trim(), context: context.join(' ') });
            i = j;
        }
    })(css.replace(/\/\*[\s\S]*?\*\//g, ''), []);
    return out;
}

// A selector list split at its top-level commas.
function selectors(list) {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of list) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && !depth) { parts.push(cur.trim()); cur = ''; } else cur += ch;
    }
    return parts.concat(cur.trim());
}

// ===================================================================
// Every selector matches something
// ===================================================================
// A selector is held to the pages that load its sheet. What a reader or
// the browser brings (hover, focus, an open <details>, a typed field, a
// ::before) is set aside first; what is left must match a page as
// committed (stats.html also drawn full, as it will be once counting
// starts), or else be something only a script can make: one of its parts
// names a class, an id or an attribute that a script those pages run (or
// the journey map script.js fetches) names, or an element such a script
// writes. A part nothing names (`.ca-tips li i`, after the icon font
// left) fails, and so does an arrangement of parts that are all on the
// page with nothing a script does to them. An arrangement a script could
// make out of parts it touches is beyond a static scan: the one-off pass
// in Chromium that found the last of those is described in this file's
// commit.
const STATE = /:(?:hover|focus-visible|focus-within|focus|active|visited|link|checked|disabled|enabled|target|placeholder-shown|invalid|valid|open|default|required|optional|any-link)(?![\w-])/g;
const atRest = (sel) => sel
    .replace(/:not\((?::[\w-]+)+\)/g, '')     // :not(:placeholder-shown): a state, both ways
    .replace(/::[\w-]+(\([^)]*\))?/g, '')
    .replace(/:(?:before|after|first-letter|first-line)(?![\w-])/g, '')
    .replace(STATE, '')
    .replace(/:root(?![\w-])/g, 'html')
    .replace(/\s+/g, ' ')
    .trim() || '*';

// The parts a selector is chained from: `html.js .nav-menu > a` is
// `html.js`, `.nav-menu` and `a`.
function compounds(sel) {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of sel) {
        if (ch === '(' || ch === '[') depth++;
        if (ch === ')' || ch === ']') depth--;
        if (!depth && /[\s>+~]/.test(ch)) { if (cur) out.push(cur); cur = ''; } else cur += ch;
    }
    return cur ? out.concat(cur) : out;
}

// What a part asks of an element, outside its :not() and :is().
function asks(compound) {
    const bare = compound.replace(/:[\w-]+\((?:[^()]|\([^()]*\))*\)/g, '');
    return {
        type: (bare.match(/^[a-z][\w-]*/) || [])[0] || null,
        classes: (bare.match(/\.-?[_a-zA-Z][\w-]*/g) || []).map(c => c.slice(1)),
        ids: (bare.match(/#-?[_a-zA-Z][\w-]*/g) || []).map(c => c.slice(1)),
        attrs: (bare.match(/\[[\w-]+/g) || []).map(a => a.slice(1))
    };
}

// Which pages load which sheet, read from the pages.
const PAGES = sitePages(ROOT);
const html = Object.fromEntries(PAGES.map(p => [p, read(p)]));
const doms = Object.fromEntries(PAGES.map(p => [p, [new JSDOM(html[p]).window.document]]));

// stats.html as the weekly Action will commit it: four weeks of every page,
// lens, screen size and feature the counter knows, the tables and their
// figures included (the page committed today says counting has not begun).
{
    const fetchStats = require('../scripts/fetch-stats.js');
    const { renderStats } = require('../scripts/build-content.js');
    const known = fetchStats.knownNames();
    const today = '2026-10-05';
    const rows = [];
    for (let d = fetchStats.addDays(today, -28); d < today; d = fetchStats.addDays(d, 1)) {
        rows.push([d, 'visits', '', 40], [d, 'kb', '', 40 * 260], [d, 'ref', 'www.linkedin.com', 4]);
        known.pages.forEach(p => rows.push([d, 'page', p, 3]));
        known.lenses.forEach(l => rows.push([d, 'lens', l, 2]));
        ['s', 'm', 'l'].forEach(v => rows.push([d, 'vp', v, 10]));
        known.features.forEach(f => rows.push([d, 'feature', f, 2]));
        ['journey', 'about', 'contact'].forEach(id => rows.push([d, 'deepest', id, 2]));
    }
    const stats = fetchStats.transform(fetchStats.cleanRows(rows, known, today).rows, { today, known });
    doms['stats.html'].push(new JSDOM(renderStats({ stats, lenses: content.load('lenses') })).window.document);
}
const loads = (page) => [...html[page].matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
    .map(m => path.posix.normalize(path.posix.join(path.posix.dirname(page), m[1])));
const pagesOf = Object.fromEntries(SHEETS.map(s => [s, PAGES.filter(p => loads(p).includes(s))]));

// Everything a script could add to those pages: the scripts the pages
// name, their inline scripts, and what script.js and the pages fetch on
// demand. Not build-content.js: what it writes is the committed pages.
const ON_DEMAND = ['ai-carbon-data.js', 'assets/journey-map.svg']
    .concat(fs.readdirSync(path.join(ROOT, 'modules')).filter(f => f.endsWith('.js')).map(f => `modules/${f}`));
const scriptsOf = (page) => [...html[page].matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map(m => path.posix.normalize(path.posix.join(path.posix.dirname(page), m[1])))
    .filter(f => !f.startsWith('/') && fs.existsSync(path.join(ROOT, f)));
const inline = (page) => [...html[page].matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const sourcesOf = Object.fromEntries(SHEETS.map(s => {
    const files = new Set(pagesOf[s].flatMap(scriptsOf).concat(ON_DEMAND));
    return [s, Array.from(files).map(read).concat(pagesOf[s].map(inline)).join('\n')];
}));
const word = (w) => new RegExp(`(^|[^\\w-])${w.replace(/[-]/g, '\\-')}(?![\\w-])`);
// An element a script makes: in markup it writes, or by createElement(NS).
const makes = (src, type) => new RegExp(`<${type}[\\s>/]|createElement(?:NS)?\\([^)]*['"]${type}['"]\\)|\\bmk\\(['"]${type}['"]`).test(src);

// Rules for what content/ can hold but holds none of today. A static scan
// cannot see these: content/ decides whether they are drawn.
const CONTENT_DRIVEN = {
    'style.css': [
        '.cert-meta a',         // a certificate's Verify link, once profile.json gives one a verifyUrl
        '.testimonial a'        // a testimonial's LinkedIn source, once testimonials.json has one
    ],
    'content.css': [
        '.cs-status-planned'    // a status content.js accepts (STATUSES); no entry is planned today
    ],
    'notes.css': [
        // the headings and lists a note's markdown may use (scripts/lib/notes.js)
        '.nt-text ul', '.nt-text ol', '.nt-text h2', '.nt-text h3'
    ]
};

const dead = [];
SHEETS.forEach((sheet) => {
    const on = pagesOf[sheet];
    const src = sourcesOf[sheet];
    const present = (q) => on.some(p => doms[p].some((d) => { try { return !!d.querySelector(q); } catch (e) { return false; } }));
    rules(read(sheet)).forEach(r => selectors(r.selector).forEach((sel) => {
        if ((CONTENT_DRIVEN[sheet] || []).includes(sel)) return;
        const rest = atRest(sel);
        if (present(rest)) return;
        // Not on the page as committed: can a script bring every part of it?
        let made = false;
        const never = compounds(rest).filter((c) => {
            const a = asks(c);
            const scripted = a.classes.some(n => word(n).test(src)) || a.ids.some(n => word(n).test(src)) ||
                a.attrs.some(n => word(n).test(src)) || (!!a.type && makes(src, a.type));
            made = made || scripted;
            return !scripted && !present(c);
        });
        if (never.length || !made) dead.push(`${sheet}: ${sel}${r.context ? ` (in ${r.context})` : ''}`);
    }));
});
assert(PAGES.length >= 12 && SHEETS.every(s => pagesOf[s].length), `Selectors: each sheet is read against the pages that load it (${SHEETS.map(s => `${s} ${pagesOf[s].length}`).join(', ')})`);
assert(dead.length === 0, `Selectors: every one matches something on a page that loads its sheet, or something a script those pages run can make (matching nothing: ${dead.join('; ') || 'none'})`);
const stale = Object.entries(CONTENT_DRIVEN).flatMap(([sheet, list]) => list
    .filter(sel => !rules(read(sheet)).some(r => selectors(r.selector).includes(sel))).map(sel => `${sheet}: ${sel}`));
assert(stale.length === 0, `Selectors: every one set aside for content/ is still in its sheet (${stale.join('; ') || 'all'})`);

// ===================================================================
// A transition names what it animates
// ===================================================================
// `transition: all` eased every property that changed: a theme switch, a
// focus ring growing in over 0.3 s, a resize across a breakpoint. Each
// transition now lists the properties its states change (hover, a class,
// the theme), and a token cannot hide an `all` again.
const loose = SHEETS.flatMap(sheet => rules(read(sheet)).flatMap((r) => {
    const decls = r.body.split(';').map(d => d.trim()).filter(d => /^transition(-property)?\s*:/.test(d));
    return decls.filter(d => /\ball\b|var\(/.test(d) || /^transition\s*:\s*[\d.]+m?s\b/.test(d)).map(d => `${sheet}: ${r.selector} { ${d} }`);
}));
assert(loose.length === 0, `Transitions: each names the properties it animates, none \`all\` and none through a token (${loose.join('; ') || 'all named'})`);

// ===================================================================
// The breakpoints, named
// ===================================================================
// A custom property cannot be used in a media query, so the widths are
// named here instead, and every @media in the six sheets has to use one of
// them, spelled one way: `min-width: N` for "from N up" and
// `max-width: N-1` for "below N". 899, 900 and 901 had all been spelled
// for the one break; 760 and 768, 1023 and 1024 likewise. The rest moved to
// the nearest width that already broke the same way (560 to 600, 700 to
// 720, 800 and 860 to 900), changing only the widths between. The rest are
// each tuned to what happens at their edge (the hero's two buttons on a
// 375px phone, a select on a 320px one, the scroll drill's margin), and
// moving one would change a phone or a laptop people use: so twelve, not
// the plan's four.
const BREAKPOINTS = {
    360: 'the smallest phones: the hero steps down under a caption on two lines',
    381: 'the hero\'s two buttons keep to one line below this',
    421: 'carbon-ai.css: a 320px phone\'s padding, and the calculator\'s three readings stacked',
    481: 'a phone: the at-a-glance strip and the hero\'s figures in columns',
    600: 'a phone against a tablet: the project cards, the core log, the journey stops',
    641: 'the hero, the case studies and the claims closer set; the map\'s readouts go',
    720: 'the shell\'s nav and call to action on their own rows; the calculator\'s bars stacked',
    768: 'a tablet: the section rhythm, and the index beside each section\'s title',
    900: 'the homepage\'s menu button; the two-column layouts',
    980: 'the journey map beside its stops',
    1024: 'the about section and three project cards across; the chart beside its question',
    1151: 'room in the margin for the scroll drill'
};
const widths = SHEETS.flatMap(sheet => [...read(sheet).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@media[^{]*/g)]
    .flatMap(m => [...m[0].matchAll(/\((min|max)-width:\s*(\d+)px\)/g)].map(w => ({ sheet, kind: w[1], px: +w[2], at: w[1] === 'min' ? +w[2] : +w[2] + 1 }))));
const unnamed = widths.filter(w => !BREAKPOINTS[w.at]).map(w => `${w.sheet}: ${w.kind}-width: ${w.px}px`);
assert(widths.length >= 40 && unnamed.length === 0,
    `Breakpoints: every @media width is one of the ${Object.keys(BREAKPOINTS).length} named, as min-width: N or max-width: N-1 (${widths.length} queries; unnamed: ${[...new Set(unnamed)].join(', ') || 'none'})`);
const unused = Object.keys(BREAKPOINTS).filter(at => !widths.some(w => w.at === +at));
assert(unused.length === 0, `Breakpoints: every named width is used (${unused.join(', ') || 'all'})`);

// ===================================================================
// A rule once
// ===================================================================
// The same selector twice in one context of a sheet is two rules for one
// thing, and a reader of the first never sees the second (style.css had
// two for html). A selector in a shared list and then on its own, for
// what it adds, is one rule each.
const twice = SHEETS.flatMap((sheet) => {
    const seen = new Map();
    rules(read(sheet)).forEach((r) => {
        const key = `${r.context} ${selectors(r.selector).join(', ')}`;
        seen.set(key, (seen.get(key) || 0) + 1);
    });
    return [...seen].filter(([, n]) => n > 1).map(([key]) => `${sheet}: ${key.trim()}`);
});
assert(twice.length === 0, `Rules: no selector has two rules in the same context of a sheet (${twice.join('; ') || 'none'})`);

// ===================================================================
// The typefaces, once a page
// ===================================================================
// Every page that has a stylesheet starts from one of two, style.css (the
// homepage) or carbon-ai.css (every other), and that one carries the
// @font-face blocks scripts/build-fonts.js writes (npm run fonts:check
// holds them to assets/fonts/). A shared fonts.css would be a second
// request on every page's first view, and no lighter: the block is about
// 490 bytes gzipped on its own and 370 inside the sheet it shares a
// dictionary with. So the two copies stay, and what this holds is that no
// page declares the faces twice (content.css had a third copy until wave
// 3) or not at all.
const faces = PAGES.filter(p => loads(p).length).map((p) => {
    const sheets = loads(p).filter(s => fs.existsSync(path.join(ROOT, s)));
    const declaring = sheets.filter(s => /@font-face\s*{/.test(read(s)));
    return { p, first: sheets[0], declaring };
});
const wrong = faces.filter(f => f.declaring.length !== 1 || f.declaring[0] !== f.first).map(f => `${f.p}: ${f.declaring.join(', ') || 'none'}`);
assert(faces.length >= 9 && wrong.length === 0,
    `Fonts: each page's first stylesheet declares the typefaces, and no other it loads does (${faces.length} pages; ${wrong.join('; ') || 'all once'})`);

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
