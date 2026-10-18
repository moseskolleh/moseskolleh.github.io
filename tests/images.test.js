// The photos: each one the file scripts/build-images.py made, as like the
// original as it says, and each copy drawn by a page.
//
// A phone fetched the hero's 1600px photo, about half its first view, and
// most photos had been saved at a higher quality than anyone can see.
// npm run images re-encoded every WebP to the lowest quality that still
// scores an SSIM of 0.98 against the original, made the hero an 800px AVIF
// copy for a phone, and an AVIF copy of the homepage's photos where that
// is a tenth lighter again; assets/img/manifest.json records each file,
// its score and its hash. This fails when:
//
//   · a photo is not the file the manifest describes (replaced by hand,
//     or added without npm run images), or a file there is not listed;
//   · a file scores under the threshold, moves a colour, is not the
//     original's shape, or a copy does not save what its rule asks;
//   · a copy is drawn by no page, or a stylesheet names a file that is
//     not there (no test looked at a url() in CSS before);
//   · the hero's preloads and style.css disagree about which file a window
//     draws, so a window would fetch two photos or wait for one, or the
//     preload asks for high priority again (index.html says why not);
//   · a slide after the first is drawn before the rotation asks for it.
//
// What only a browser can show, which file each window fetches and what
// it weighs, is in scripts/smoke.js (exerciseHeroPhotos).
//
// Run with: node tests/images.test.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const IMG = 'assets/img';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const sha256 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

let failures = 0;
function assert(cond, msg) {
    if (cond) {
        console.log('PASS:', msg);
    } else {
        console.log('FAIL:', msg);
        failures++;
    }
}

// The shape a file says it is, from its own header: a WebP's VP8, VP8L or
// VP8X chunk, an AVIF's 'ispe' property.
function shapeOf(rel) {
    const b = fs.readFileSync(path.join(ROOT, rel));
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
        const chunk = b.toString('ascii', 12, 16);
        if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
        if (chunk === 'VP8L') { const v = b.readUInt32LE(21); return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) }; }
        if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (b.toString('ascii', 4, 8) === 'ftyp' && /avif/.test(b.toString('ascii', 8, 24))) {
        const at = b.indexOf('ispe');
        if (at > -1) return { width: b.readUInt32BE(at + 8), height: b.readUInt32BE(at + 12) };
    }
    return null;
}
const sameShape = (rel, w, h) => { const s = shapeOf(rel); return !!s && s.width === w && s.height === h; };

const manifest = JSON.parse(read(`${IMG}/manifest.json`));
const { threshold, colourShift } = manifest.likeness;
const rules = manifest.rules;
const images = manifest.images;
const copies = images.flatMap(e => e.copies);

// --- The manifest: every photo, every copy, each the file it describes ---
{
    assert(threshold >= 0.98 && colourShift <= 1, `Manifest: the threshold is SSIM ${threshold}, colours within ${colourShift} level`);
    const onDisk = fs.readdirSync(path.join(ROOT, IMG)).filter(f => /\.(webp|avif)$/.test(f)).map(f => `${IMG}/${f}`).sort();
    const listed = images.map(e => e.file).concat(copies.map(c => c.file)).sort();
    const unlisted = onDisk.filter(f => !listed.includes(f));
    const missing = listed.filter(f => !onDisk.includes(f));
    assert(!unlisted.length && !missing.length,
        `Manifest: every WebP and AVIF in ${IMG}/ is listed, and every listed one is there (unlisted: ${unlisted.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}) — run npm run images`);

    const changed = images.filter(e => exists(e.file) && (sha256(e.file) !== e.served.sha256 || fs.statSync(path.join(ROOT, e.file)).size !== e.served.bytes))
        .concat(copies.filter(c => exists(c.file) && sha256(c.file) !== c.sha256)).map(e => e.file);
    assert(!changed.length, `Manifest: every file is the one it was scored as (changed since: ${changed.join(', ') || 'none'}) — run npm run images`);

    const blobs = images.filter(e => !/^[0-9a-f]{40}$/.test(e.original.blob) || !/^[0-9a-f]{64}$/.test(e.original.sha256));
    assert(!blobs.length, `Manifest: each photo names its original's git blob, to re-encode from (${blobs.map(e => e.file).join(', ') || 'all'})`);
}

// --- Likeness: every file at the threshold, the original's shape ---------
{
    const scored = images.filter(e => e.webp).map(e => e.webp).concat(copies);
    const under = scored.filter(s => !(s.ssim >= threshold) || !(s.colourShift <= colourShift)).map(s => `${s.file} (${s.ssim}, ${s.colourShift})`);
    assert(scored.length > 0 && !under.length, `Likeness: all ${scored.length} new files score SSIM ${threshold} or more, colours within ${colourShift} level (under: ${under.join(', ') || 'none'})`);

    const recoded = images.filter(e => e.webp);
    const notLighter = recoded.filter(e => e.webp.bytes > (1 - rules.minRecode) * e.original.bytes).map(e => e.file);
    assert(!notLighter.length, `Re-encoded: each WebP replaced is at least ${rules.minRecode * 100}% lighter than its original (${notLighter.join(', ') || `all ${recoded.length}`})`);
    const kept = images.filter(e => !e.webp && e.served.sha256 !== e.original.sha256).map(e => e.file);
    assert(!kept.length, `Re-encoded: a WebP not replaced is its original, byte for byte (${kept.join(', ') || 'all'})`);

    const misshapen = images.filter(e => !sameShape(e.file, e.original.width, e.original.height)).map(e => e.file)
        .concat(copies.filter(c => !sameShape(c.file, c.width, c.height)).map(c => c.file));
    assert(!misshapen.length, `Shape: every file is the size the manifest gives (${misshapen.join(', ') || 'all'})`);

    const phone = copies.filter(c => /-\d+\.avif$/.test(c.file));
    const whole = copies.filter(c => !/-\d+\.avif$/.test(c.file));
    const ownOf = (c) => images.find(e => e.copies.includes(c));
    const wrongSize = phone.filter(c => c.width !== rules.phoneWidth || Math.abs(c.height / c.width - ownOf(c).original.height / ownOf(c).original.width) > 0.002)
        .concat(whole.filter(c => c.width !== ownOf(c).original.width || c.height !== ownOf(c).original.height)).map(c => c.file);
    assert(!wrongSize.length, `Shape: a phone copy is ${rules.phoneWidth}px wide in its photo's proportions, any other copy its photo's size (${wrongSize.join(', ') || 'all'})`);

    const thin = whole.filter(c => !(c.saves >= rules.minAvif)).map(c => `${c.file} ${c.saves}`)
        .concat(phone.filter(c => !(c.saves > 0)).map(c => `${c.file} ${c.saves}`));
    assert(!thin.length, `AVIF: each copy is at least ${rules.minAvif * 100}% lighter than the WebP it stands in for (a phone copy, lighter at all) (${thin.join(', ') || 'all'})`);
    const heroes = images.filter(e => /-hero\.webp$/.test(e.file));
    assert(heroes.length === 4 && heroes.every(e => e.copies.some(c => c.file === e.file.replace(/\.webp$/, `-${rules.phoneWidth}.avif`))),
        `Phone: each of the hero's ${heroes.length} photos has its ${rules.phoneWidth}px copy`);
}

// --- Every url() a stylesheet names is a file here -------------------------
const stylesheets = fs.readdirSync(ROOT).filter(f => f.endsWith('.css'))
    .concat(fs.readdirSync(path.join(ROOT, 'modules')).filter(f => f.endsWith('.css')).map(f => `modules/${f}`));
{
    const broken = [];
    stylesheets.forEach((css) => {
        const text = read(css).replace(/\/\*[\s\S]*?\*\//g, '');
        (text.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g) || []).forEach((u) => {
            const ref = u.replace(/^url\(\s*['"]?|['"]?\s*\)$/g, '');
            if (/^(data:|#|https?:|\/\/)/.test(ref)) return;
            const rel = path.posix.normalize(path.posix.join(path.posix.dirname(css), ref.split(/[?#]/)[0]));
            if (!exists(rel)) broken.push(`${css}: ${ref}`);
        });
    });
    assert(!broken.length, `Stylesheets: every url() names a file in the repository (missing: ${broken.join(', ') || 'none'})`);
}

// --- Every copy is drawn somewhere -----------------------------------------
{
    const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).map(read).join('\n') + stylesheets.map(read).join('\n');
    const unused = copies.filter(c => !pages.includes(c.file)).map(c => c.file);
    assert(!unused.length, `Copies: each is named by a page or a stylesheet (unused: ${unused.join(', ') || 'none'})`);
}

// --- The hero: the preload and the stylesheet name the same file ----------
// style.css draws the first slide from a plain url() (a browser without
// image-set()) and then image-set() with type()s; index.html preloads it,
// once per window. The file a preload fetches has to be the one the
// stylesheet then draws, in that window, in a browser that reads AVIF
// (the first candidate), or that browser fetches two; and a preload of an
// AVIF has to say so (type), or a browser that cannot read it fetches it
// for nothing.
const css = read('style.css').replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length));
const html = read('index.html');
// The rule for a selector, and the @media it sits in ('' for none).
function cssRules(selector) {
    const out = [];
    const re = new RegExp(`(^|[\\s}])${selector.replace(/[.[\]]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
    let m;
    while ((m = re.exec(css))) {
        const at = m.index + m[1].length;
        const stack = [];
        let prelude = 0;
        for (let i = 0; i < at; i++) {
            if (css[i] === '{') { stack.push(css.slice(prelude, i).trim()); prelude = i + 1; } else if (css[i] === '}') { stack.pop(); prelude = i + 1; } else if (css[i] === ';') prelude = i + 1;
        }
        const media = stack.filter(s => s.startsWith('@media')).map(s => s.replace(/^@media\s*/, '')).join(' and ');
        const decl = m[2];
        const plain = (decl.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)\s*;/) || [])[1] || null;
        const set = (decl.match(/background-image:\s*image-set\(([^;]*)\)\s*;/) || [])[1] || '';
        const candidates = [...set.matchAll(/url\(['"]?([^'")]+)['"]?\)\s*type\(['"]([^'"]+)['"]\)/g)].map(c => ({ href: c[1], type: c[2] }));
        out.push({ media, plain, candidates });
    }
    return out;
}
{
    const slides = (html.match(/<div class="hero-bg-slide[^"]*"/g) || []).length;
    assert(slides === 4 && /class="hero-bg-slide hero-bg-1 active"/.test(html) && !/hero-bg-slide[^>]*style=/.test(html) && !/data-bg=/.test(html),
        `Hero: ${slides} slides, the first active, none with a photo in its markup (style.css draws them)`);
    // What a browser that reads AVIF draws from a rule: its first candidate,
    // or with no image-set(), the plain url().
    const pick = (r) => (r.candidates.length ? r.candidates[0] : { href: r.plain, type: 'image/webp' });
    for (let n = 1; n <= slides; n++) {
        const sel = n === 1 ? '.hero-bg-1' : `.hero-bg-${n}[data-loaded]`;
        const found = cssRules(sel);
        const phone = found.find(r => r.media === '(max-width: 599px)');
        const desk = found.find(r => r.media === '');
        const photo = desk && desk.plain;
        const own = images.find(e => e.file === photo);
        // The WebP last in each image-set(), and the plain url() before it,
        // is the full-size photo in both windows: a browser that does not
        // read AVIF draws what every browser drew before.
        const formed = [phone, desk].every(r => r && r.plain === photo && r.candidates.every(c => exists(c.href))
            && (!r.candidates.length || (r.candidates[r.candidates.length - 1].href === photo && r.candidates[r.candidates.length - 1].type === 'image/webp')));
        assert(found.length === 2 && !!own && /-hero\.webp$/.test(photo) && formed,
            `Hero: slide ${n} (${sel}) has a rule for a desktop and one under 600px, each falling back to the full-size WebP, ${photo}`);
        const avif = own && own.copies.find(c => c.file === photo.replace(/\.webp$/, '.avif'));
        assert(!!phone && phone.candidates.length === 2 && phone.candidates[0].href === photo.replace(/\.webp$/, `-${rules.phoneWidth}.avif`) && phone.candidates[0].type === 'image/avif',
            `Hero: slide ${n} draws its ${rules.phoneWidth}px AVIF copy under 600px`);
        assert(!!desk && (avif ? desk.candidates.length === 2 && desk.candidates[0].href === avif.file && desk.candidates[0].type === 'image/avif' : !desk.candidates.length),
            `Hero: slide ${n} draws ${avif ? 'its AVIF copy' : 'the WebP'} above 600px, as the manifest has ${avif ? 'one' : 'none'} at full size`);
        if (n > 1) assert(cssRules(`.hero-bg-${n}`).length === 0, `Hero: slide ${n} draws nothing until the rotation marks it [data-loaded]`);
    }

    const preloads = (html.match(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/g) || []).map(t => ({
        href: (t.match(/href="([^"]+)"/) || [])[1], media: (t.match(/media="([^"]+)"/) || [])[1] || '',
        type: (t.match(/type="([^"]+)"/) || [])[1] || '', priority: (t.match(/fetchpriority="([^"]+)"/) || [])[1] || ''
    }));
    const first = cssRules('.hero-bg-1');
    const pairs = [['(max-width: 599px)', '(max-width: 599px)'], ['(min-width: 600px)', '']];
    assert(preloads.length === 2 && pairs.every(([m]) => preloads.some(p => p.media === m)),
        `Preload: two for the hero, one under 600px and one from 600px, as style.css's @media divides them (${preloads.map(p => p.media).join(' / ')})`);
    pairs.forEach(([media, cssMedia]) => {
        const p = preloads.find(x => x.media === media);
        const r = first.find(x => x.media === cssMedia);
        const want = r && pick(r);
        assert(!!p && !!want && p.href === want.href && p.type === want.type,
            `Preload ${media}: the file style.css draws there (${p && p.href}, typed ${p && p.type}), so no window fetches two`);
    });
    assert(preloads.every(p => !p.priority), 'Preload: no fetchpriority on the hero; it is never the largest paint (index.html says what was measured)');
}

// --- The portrait: AVIF where the browser reads it ---------------------------
{
    const portrait = copies.find(c => c.file === `${IMG}/profile.avif`);
    const pic = (html.match(/<picture>\s*<source[^>]*>\s*<img[^>]*profile\.webp[^>]*>\s*<\/picture>/) || [])[0] || '';
    if (portrait) {
        assert(/<source type="image\/avif" srcset="assets\/img\/profile\.avif">/.test(pic),
            'Portrait: a <picture> offers profile.avif to a browser that reads AVIF, the WebP to one that does not');
    } else {
        assert(!pic, 'Portrait: no <picture> for a copy that was not made');
    }
}

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
