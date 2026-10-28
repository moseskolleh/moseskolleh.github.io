// The Field Notes as articles, their feed, and the site's structured data.
//
// The three notes were teasers folded into the homepage, undated. Each is
// a page of its own now (notes/<slug>.html, from content/notes/<slug>.md),
// dated the day it was first published on this site, in an Atom feed and
// the sitemap. What fails here:
//
//   · the markdown reader prints something outside its small subset, or
//     front matter Jekyll (which GitHub Pages runs over every markdown
//     file) would read another way, instead of refusing it with its line;
//   · the validator lets through a note with no title, a date that is not
//     a day or is still to come, an `updated` day before its date or still
//     to come, a slug the visit counter cannot name, a
//     tie to a case study or lens that does not exist, or a figure the
//     claims ledger does not hold;
//   · a note's page is not dated, has no permalink, tag, case study or
//     Article, or does not link the feed;
//   · feed.xml is not well-formed Atom, an id is not a tag URI fixed for
//     good (a feed reader takes a changed id for a new entry, and the site's
//     address is due to change), or `updated` is not the day each note
//     last changed (and, for the feed, the latest of those);
//   · a JSON-LD block does not parse, or says anything content/ does not.
//
// Run with: node tests/notes.test.js

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const content = require('../scripts/lib/content.js');
const notesLib = require('../scripts/lib/notes.js');
const build = require('../scripts/build-content.js');

const ROOT = content.ROOT;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

let failures = 0;
function assert(cond, msg) {
    if (cond) {
        console.log('PASS:', msg);
    } else {
        console.log('FAIL:', msg);
        failures++;
    }
}

const data = content.loadAll();
build.useLedger(data.claims.claims);
const { profile, notes } = data;
const SITE = profile.links.site;

// ===================================================================
// The markdown subset, and the front matter Jekyll also reads
// ===================================================================
{
    const md = (s) => notesLib.parseMarkdown(s, 1);
    const ok = md('A *quiet* claim, a **loud** one and [a link](case-studies.html#groundwater).\nStill the same paragraph.\n\n## A heading\n\n### A smaller one\n\n- one\n- two\n\n1. first\n2. second');
    assert(ok.problems.length === 0 && ok.blocks.map(b => b.type).join() === 'p,h2,h3,ul,ol' && ok.blocks[3].items.length === 2,
        `Markdown: paragraphs, emphasis, links, ## and ### headings and both lists are read (${ok.problems.join('; ') || ok.blocks.map(b => b.type).join(', ')})`);
    assert(notesLib.runsText(ok.blocks[0].runs) === 'A quiet claim, a loud one and a link. Still the same paragraph.' &&
        notesLib.linksIn(ok.blocks).length === 1 && notesLib.linksIn(ok.blocks)[0].href === 'case-studies.html#groundwater',
        'Markdown: a paragraph\'s lines join with a space, and its link keeps its address');
    const refused = [
        ['raw HTML', 'A <b>bold</b> word.'],
        ['code', 'Run `npm test` first.'],
        ['an image', 'See ![the map](assets/journey-map.svg).'],
        ['a quotation', '> Someone said so.'],
        ['a table', '| a | b |'],
        ['an underscore', 'An _emphasis_ the subset does not have.'],
        ['an indented line', '    code, to markdown'],
        ['a level-one heading', '# Another title'],
        ['a heading below ###', '#### Too deep'],
        ['a list marked *', '* item'],
        ['a lazy continuation', '- item\nthat runs on'],
        ['a list numbered out of turn', '1. first\n3. third'],
        ['an unclosed emphasis', 'A **loud word.'],
        ['a bracket that links nothing', 'A [note] in brackets.'],
        ['Liquid', 'A {{ page.title }} tag.'],
        ['an entity', 'Fish &amp; chips.'],
        ['a trailing space', 'A line break  '],
        ['a rule', 'Text\n\n---'],
        ['a heading underlined', 'Text\n==='],
        ['a code fence', '```\ncode\n```']
    ];
    const let_ = refused.filter(([, s]) => md(s).problems.length === 0).map(([what]) => what);
    assert(let_.length === 0, `Markdown: refuses what the subset does not have rather than printing it wrong (let through: ${let_.join(', ') || 'none'})`);
    assert(/line 2/.test(md('Fine.\nA <i>tag</i>.').problems.join()), 'Markdown: a problem names its line');

    const split = (s) => notesLib.splitNote(s);
    assert(split('---\ntitle: A plain title\n---\n\nBody.').problems.length === 0 && split('---\ntitle: A plain title\n---\n\nBody.').body === 'Body.',
        'Front matter: "key: value" lines between --- fences, and the note after them');
    const yamlBad = [
        ['no opening fence', 'title: x\n---\nBody'],
        ['no closing fence', '---\ntitle: x\nBody'],
        ['a value with ": " in it', '---\nsummary: Two parts: one and two\n---\nBody'],
        ['a value YAML reads as a comment', '---\nsummary: Plain #not\n---\nBody'],
        ['a quoted value', '---\ntitle: "Quoted"\n---\nBody'],
        ['a value opening with a bracket', '---\ntitle: [x]\n---\nBody'],
        ['a key given twice', '---\ntitle: a\ntitle: b\n---\nBody'],
        ['a line that is not "key: value"', '---\ntitle a\n---\nBody']
    ];
    const passed = yamlBad.filter(([, s]) => split(s).problems.length === 0).map(([what]) => what);
    assert(passed.length === 0, `Front matter: refuses what YAML, which Jekyll reads it with, would read another way (let through: ${passed.join(', ') || 'none'})`);
}

// ===================================================================
// The validator
// ===================================================================
{
    const ctx = { projects: data.projects, lenses: data.lenses, claims: data.claims.claims };
    const base = notes.find(n => n.number === 1);
    const one = (patch) => Object.assign({}, base, { problems: [] }, patch);
    const refuses = (label, patch, why) => {
        const problems = content.checkNotes([one(patch)], ctx);
        assert(problems.some(p => why.test(p)), `Validator refuses ${label} (${problems.join('; ') || 'it passed'})`);
    };
    assert(content.checkNotes(notes.map(n => Object.assign({}, n, { problems: [] })), ctx).length === 0, 'Validator: the notes as they are pass');
    refuses('a note with no title', { title: undefined }, /no title/);
    refuses('a placeholder title', { title: 'TBC' }, /no title/);
    refuses('a date that is not a day', { date: '2026-02-30' }, /must be a day/);
    refuses('a date still to come', { date: '2099-01-01' }, /still to come/);
    refuses('an updated day that is not a day', { updated: '2026-13-01' }, /updated must be a day/);
    refuses('an updated day still to come', { updated: '2099-01-01' }, /updated 2099-01-01 is still to come/);
    refuses('an updated day before the note was published', { updated: '2026-01-01' }, /before its date/);
    assert(content.checkNotes([one({ updated: undefined })], ctx).length === 0, 'Validator: a note never changed needs no updated day');
    refuses('a slug in capitals', { slug: 'What-164', file: 'What-164.md' }, /slug/);
    refuses('a slug the counter cannot name', { slug: 'a'.repeat(36), file: `${'a'.repeat(36)}.md` }, /at most 35 characters/);
    refuses('a file not named for its slug', { file: 'other.md' }, /named for its slug/);
    refuses('a tie to a case study that does not exist', { caseStudy: 'atlantis' }, /no case study "atlantis"/);
    refuses('a tie to a lens that does not exist', { caseStudy: undefined, lens: 'astrology' }, /no lens "astrology"/);
    refuses('a tie to both', { lens: 'water' }, /not both/);
    refuses('a tie to neither', { caseStudy: undefined }, /not neither/);
    refuses('an unknown front-matter key', { keys: base.keys.concat('author') }, /unknown front-matter key "author"/);
    refuses('a number that is not a whole number', { number: '1a' }, /whole number/);
    refuses('markdown in the summary', { summary: 'A *loud* line.' }, /plain text/);
    refuses('a link to a host the repository does not trust', { links: [{ text: 'a', href: 'https://example.com/x' }] }, /not a host/);
    refuses('a link to a page that is not there', { links: [{ text: 'a', href: 'nowhere.html' }] }, /not in the repository/);
    refuses('a figure the ledger does not hold', { text: 'I drilled 37 boreholes in a week.' }, /"37"/);
    const twice = content.checkNotes([one({}), one({ file: 'x.md' })], ctx);
    assert(twice.some(p => /the same slug/.test(p)) && twice.some(p => /the same number/.test(p)), 'Validator refuses two notes with one slug, or one number');
    const order = content.checkNotes([one({}), one({ number: 2, slug: 'later', file: 'later.md', title: 'Later', date: '2026-07-01' })], ctx);
    assert(order.some(p => /dated before note 1/.test(p)), 'Validator refuses a note numbered after one it is dated before');
}

// ===================================================================
// The three notes the homepage had: dated, tied, their own words
// ===================================================================
{
    // Each first went on the site in 916a7c7, merged to main on 2026-07-06
    // (pull request #20); git log -S on its text finds it. The note's page
    // says the date is that, and only that.
    const first = [
        ['what-164-water-points-taught-me', 'Water', 'groundwater'],
        ['why-i-wrote-a-pessimistic-future', 'Scenarios', 'coastal'],
        ['every-prompt-has-a-footprint', 'Sustainable AI', 'sustainable-ai']
    ];
    first.forEach(([slug, tag, cs], i) => {
        const n = notes.find(x => x.slug === slug);
        assert(!!n && n.number === i + 1 && n.date === '2026-07-06' && n.tag === tag && n.caseStudy === cs,
            `First notes: note ${i + 1} is "${slug}", dated 2026-07-06, tagged ${tag} as the homepage tagged it, tied to ${cs}`);
        // No summary had ever been written for them, and none is invented:
        // each is a line of its own note, word for word.
        assert(!!n && n.text.replace(/\n/g, ' ').includes(n.summary), `First notes: note ${i + 1}'s one line is a line of the note itself ("${n && n.summary}")`);
    });
}

// ===================================================================
// Each note's page
// ===================================================================
const series = build.inSeries(notes);
const csDoc = new JSDOM(read('case-studies.html')).window.document;
const rsDoc = new JSDOM(read('research.html')).window.document;
const ldOf = (doc) => Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map(s => JSON.parse(s.textContent));
series.forEach((n, i) => {
    const rel = `notes/${n.slug}.html`;
    const src = read(rel);
    const doc = new JSDOM(src).window.document;
    const canonical = `${SITE}${rel}`;
    const meta = (sel) => (doc.querySelector(sel) || { getAttribute: () => null }).getAttribute('content');
    assert(text(doc.querySelector('h1')) === n.title && doc.title.startsWith(n.title) && meta('meta[name="description"]') === n.summary,
        `${rel}: its title is the note's, its description its one line`);
    const hero = doc.querySelector('.ca-hero');
    const time = hero && hero.querySelector('time');
    assert(!!time && time.getAttribute('datetime') === n.date && /^First published on this site on /.test(text(time.parentElement)),
        `${rel}: dated with <time datetime="${n.date}">, which it says is the day it was first published on this site`);
    const self = hero && hero.querySelector('a[rel="bookmark"]');
    assert(!!self && self.getAttribute('href') === `${n.slug}.html`, `${rel}: a permalink to itself`);
    assert(text(hero.querySelector('.ca-hero-tag')).includes(n.tag.toUpperCase()), `${rel}: its tag, ${n.tag}`);
    const tie = doc.querySelector('.nt-tie a');
    const id = tie && (tie.getAttribute('href').match(/^\.\.\/case-studies\.html#([\w-]+)$/) || [])[1];
    assert(!!id && id === n.caseStudy && !!csDoc.getElementById(id), `${rel}: links its case study, ${n.caseStudy}, which the case studies page has`);
    // And the way back: the case study's first line names the note by its
    // number, as do the research outputs that sit in that case study.
    const back = id && csDoc.querySelector(`#${id} .cs-card-meta a[href="${rel}"]`);
    const number = `Note ${String(n.number).padStart(2, '0')}`;
    assert(!!back && text(back) === number, `case-studies.html: ${n.caseStudy} links back to its field note, ${number}`);
    const outputs = content.loadAll().research.outputs.filter(o => o.caseStudy === n.caseStudy);
    const missing = outputs.filter(o => !rsDoc.querySelector(`#${o.id} .rs-item-head a[href="${rel}"]`)).map(o => o.id);
    assert(outputs.length === 0 || missing.length === 0, `research.html: every output of ${n.caseStudy} links its field note (${missing.join(', ') || `${outputs.length} of ${outputs.length}`})`);
    assert(doc.querySelector('link[rel="canonical"]').getAttribute('href') === canonical && meta('meta[property="og:url"]') === canonical &&
        meta('meta[property="og:type"]') === 'article' && meta('meta[property="article:published_time"]') === n.date &&
        !!meta('meta[property="og:title"]') && !!meta('meta[property="og:image"]') && !!meta('meta[name="twitter:card"]'),
        `${rel}: a canonical address, and Open Graph tags for an article published ${n.date}`);
    const feed = doc.querySelector('link[rel="alternate"][type="application/atom+xml"]');
    assert(!!feed && feed.getAttribute('href') === '../feed.xml' && !!doc.querySelector('.nt-feed a[href="../feed.xml"]'), `${rel}: links the feed, in its head and on the page`);
    assert(/<script src="\.\.\/theme\.js"><\/script>/.test(src) && /<script defer src="\.\.\/count\.js" data-page="note-[a-z0-9-]+"><\/script>/.test(src),
        `${rel}: the light theme before first paint, and the visit counter, deferred, under the note's own name`);
    const article = ldOf(doc).find(ld => ld['@type'] === 'Article');
    assert(!!article && article.headline === n.title && article.datePublished === n.date && article.dateModified === (n.updated || n.date) && article.url === canonical &&
        article.author && article.author.name === profile.person.name && article.description === n.summary,
        `${rel}: an Article in its structured data, headline, dates, author and address the page's`);
    // The older and the newer note, in the series' order.
    const prev = doc.querySelector('.nt-near a[rel="prev"]');
    const next = doc.querySelector('.nt-near a[rel="next"]');
    const want = [series[i - 1], series[i + 1]].map(x => (x ? `${x.slug}.html` : null));
    assert((prev ? prev.getAttribute('href') : null) === want[0] && (next ? next.getAttribute('href') : null) === want[1],
        `${rel}: links the older note and the newer one (${want.map(w => w || 'none').join(', ')})`);
});
{
    const files = fs.readdirSync(path.join(ROOT, 'notes')).filter(f => f.endsWith('.html')).sort();
    assert(JSON.stringify(files) === JSON.stringify(notes.map(n => `${n.slug}.html`).sort()), `Pages: notes/ holds a page for each note and nothing else (${files.join(', ')})`);
}

// ===================================================================
// feed.xml: Atom, with ids fixed for good
// ===================================================================
{
    const xml = read('feed.xml');
    const doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
    const ATOM = 'http://www.w3.org/2005/Atom';
    assert(!doc.querySelector('parsererror') && doc.documentElement.localName === 'feed' && doc.documentElement.namespaceURI === ATOM,
        'Feed: well-formed XML, an Atom <feed> in the Atom namespace');
    const kids = (el, name) => Array.from(el.children).filter(c => c.localName === name);
    const one = (el, name) => (kids(el, name).length === 1 ? kids(el, name)[0] : null);
    const feed = doc.documentElement;
    const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    // RFC 4151: tag:authority,date:specific. The authority and the date are
    // fixed for good; tests pin them so a change cannot pass unnoticed.
    const TAG = 'tag:moseskolleh.github.io,2026:sustaintheworld';
    const TAG_URI = /^tag:[a-z0-9.-]+\.[a-z]{2,},\d{4}(?:-\d{2}(?:-\d{2})?)?:[\w./-]+$/;
    assert(build.TAG_ID === TAG, `Feed: the ids' authority and date are the ones first used, fixed for good (${build.TAG_ID})`);
    const feedId = one(feed, 'id');
    assert(!!feedId && feedId.textContent === `${TAG}/notes` && TAG_URI.test(feedId.textContent), `Feed: its id is a tag URI (${feedId && feedId.textContent})`);
    assert(!!one(feed, 'title') && text(one(feed, 'title')) && one(feed, 'author') && text(one(one(feed, 'author'), 'name')) === profile.person.name,
        'Feed: one title, and its author by name');
    const links = kids(feed, 'link');
    assert(links.some(l => l.getAttribute('rel') === 'self' && l.getAttribute('href') === `${SITE}feed.xml`) &&
        links.some(l => l.getAttribute('rel') === 'alternate' && l.getAttribute('href') === SITE), 'Feed: links itself and the site');
    const updated = one(feed, 'updated');
    const newest = notes.map(n => n.updated || n.date).sort().pop();
    assert(!!updated && updated.textContent === `${newest}T00:00:00Z` && RFC3339.test(updated.textContent),
        `Feed: updated is the day a note last changed, the latest of them, not the build's (${updated && updated.textContent})`);

    const entries = kids(feed, 'entry');
    assert(entries.length === notes.length, `Feed: an entry for every note (${entries.length} of ${notes.length})`);
    const ids = [];
    entries.forEach((e, i) => {
        const n = notes[i];   // newest first
        const id = one(e, 'id');
        const link = kids(e, 'link').find(l => l.getAttribute('rel') === 'alternate');
        ids.push(id && id.textContent);
        assert(!!id && id.textContent === `${TAG}/notes/${n.slug}` && TAG_URI.test(id.textContent) && !id.textContent.includes(SITE),
            `Feed: entry ${i + 1} is "${n.slug}", newest first, and its id is a tag URI that does not carry the site's address`);
        assert(!!link && link.getAttribute('href') === `${SITE}notes/${n.slug}.html` && one(e, 'title') && text(one(e, 'title')) === n.title &&
            text(one(e, 'summary')) === n.summary && one(e, 'published') && one(e, 'published').textContent === `${n.date}T00:00:00Z` &&
            one(e, 'updated') && RFC3339.test(one(e, 'updated').textContent) && one(e, 'updated').textContent === `${n.updated || n.date}T00:00:00Z`,
            `Feed: entry ${i + 1} links its page, with its title, its one line and its dates`);
        const body = one(e, 'content');
        const html = body && body.getAttribute('type') === 'html' ? new JSDOM(body.textContent).window.document : null;
        const hrefs = html ? Array.from(html.querySelectorAll('a[href]')).map(a => a.getAttribute('href')) : [];
        assert(!!html && n.text.split('\n').every(line => text(html.body).includes(line)) && hrefs.every(h => /^https:\/\//.test(h)),
            `Feed: entry ${i + 1} carries the whole note, its links absolute (${hrefs.join(', ') || 'none'})`);
    });
    assert(new Set(ids).size === ids.length, 'Feed: no two entries share an id');
    // The site's address will change (a domain of its own); the ids must not.
    const elsewhere = build.renderFeed(Object.assign({}, data, { profile: Object.assign({}, profile, { links: Object.assign({}, profile.links, { site: 'https://example.org/' }) }) }));
    const idsThere = (elsewhere.match(/<id>[^<]+<\/id>/g) || []);
    assert(JSON.stringify(idsThere) === JSON.stringify((xml.match(/<id>[^<]+<\/id>/g) || [])), 'Feed: the ids are the same whatever the site\'s address');
    assert(build.renderFeed(data) === xml, 'Feed: what the build writes, byte for byte, with no build time in it');

    // Linked from the homepage and from every note.
    const home = new JSDOM(read('index.html')).window.document.querySelector('head link[rel="alternate"][type="application/atom+xml"]');
    assert(!!home && home.getAttribute('href') === 'feed.xml', 'Feed: the homepage links it');
}

// ===================================================================
// Structured data: every block parses, every fact is content/'s
// ===================================================================
{
    // Every string content/ holds, front matter and all.
    const held = new Set();
    const gather = (v) => {
        if (typeof v === 'string') held.add(v);
        else if (Array.isArray(v)) v.forEach(gather);
        else if (v && typeof v === 'object') Object.values(v).forEach(gather);
    };
    ['profile', 'projects', 'research', 'lenses'].forEach(name => gather(content.load(name)));
    notes.forEach(n => ['title', 'slug', 'date', 'tag', 'summary', 'caseStudy', 'lens'].forEach(k => gather(n[k])));
    // The few values that are schema.org's vocabulary, not facts about Moses.
    const VOCABULARY = { credentialCategory: ['certificate'] };
    const STRUCTURAL = ['@context', '@type', '@id'];
    const facts = (value, at, out) => {
        if (Array.isArray(value)) value.forEach((v, i) => facts(v, `${at}[${i}]`, out));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => { if (!STRUCTURAL.includes(k)) facts(v, `${at}.${k}`, out); });
        else out.push([at, value]);
        return out;
    };
    const holds = ([at, v]) => {
        const key = at.replace(/\[\d+\]/g, '').split('.').pop();
        if (typeof v !== 'string') return false;
        if (held.has(v) || (VOCABULARY[key] || []).includes(v)) return true;
        if (v === `mailto:${profile.person.email}`) return true;
        // An address on this site is a file it has.
        if (v.startsWith(SITE)) { const rel = v.slice(SITE.length).split('#')[0]; return rel === '' || fs.existsSync(path.join(ROOT, rel)); }
        return false;
    };
    const pages = ['index.html', 'carbon-ai.html', 'case-studies.html', 'research.html', 'claims.html', 'stats.html', 'field-report.html', '404.html']
        .concat(notes.map(n => `notes/${n.slug}.html`));
    let blocks = 0;
    pages.forEach((rel) => {
        const raw = read(rel).match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/g) || [];
        raw.forEach((tag, i) => {
            blocks++;
            let ld = null;
            try { ld = JSON.parse(tag.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch (e) { /* below */ }
            assert(!!ld && ld['@context'] === 'https://schema.org' && !!ld['@type'], `${rel}: JSON-LD block ${i + 1} parses, with a schema.org @context and an @type`);
            if (!ld) return;
            const loose = facts(ld, ld['@type'], []).filter(f => !holds(f));
            assert(loose.length === 0, `${rel}: every fact in its ${ld['@type']} is content/'s (${loose.map(([at, v]) => `${at} = ${JSON.stringify(v)}`).join('; ') || 'all are'})`);
        });
    });
    assert(blocks >= 3 + notes.length, `Structured data: the homepage's Person and WebSite, the coach's SoftwareApplication and an Article per note (${blocks} blocks)`);

    const homeLd = ldOf(new JSDOM(read('index.html')).window.document);
    const person = homeLd.find(ld => ld['@type'] === 'Person');
    const site = homeLd.find(ld => ld['@type'] === 'WebSite');
    assert(!!site && site.url === SITE && site.author && site.author['@id'] === person['@id'], 'Structured data: a WebSite, its author the Person, by @id');
    const creds = (person.hasCredential || []).map(c => `${c.name}|${c.recognizedBy.name}|${c.dateCreated}`);
    assert(JSON.stringify(creds) === JSON.stringify(profile.certifications.map(c => `${c.name}|${c.issuer}|${c.year}`)),
        `Structured data: hasCredential is profile.json's certificates, each with its issuer and year (${creds.length})`);
    // Languages: only once profile.json states them. It does not yet.
    assert(!profile.languages ? !('knowsLanguage' in person) : person.knowsLanguage.length === profile.languages.length,
        'Structured data: knowsLanguage only once profile.json states his languages (it does not yet)');
    const withLanguages = build.personLd(Object.assign({}, profile, { languages: [{ language: 'Dutch', level: 'B1' }] }));
    assert(JSON.stringify(withLanguages.knowsLanguage) === '[{"@type":"Language","name":"Dutch"}]', 'Structured data: and then it is written from them');
    // The X profile the plan names is not in profile.json's links, so it is not in sameAs.
    assert(JSON.stringify(person.sameAs) === JSON.stringify([profile.links.github, profile.links.linkedin, profile.links.orcid]), 'Structured data: sameAs is profile.json\'s links (GitHub, LinkedIn, ORCID), and nothing it does not hold');

    const coach = ldOf(new JSDOM(read('carbon-ai.html')).window.document).find(ld => ld['@type'] === 'SoftwareApplication');
    const edition = data.research.outputs.find(o => o.id === 'ecoprompt-web');
    const maintained = data.research.outputs.find(o => o.id === 'promptcoach');
    assert(!!coach && coach.name === edition.title && coach.description === edition.summary && coach.url === `${SITE}carbon-ai.html`,
        'Structured data: carbon-ai.html is a SoftwareApplication, this site\'s edition, as research.json names and describes it');
    assert(!!coach && coach.mentions && coach.mentions.codeRepository === maintained.url && !('sameAs' in coach) && !('isBasedOn' in coach),
        'Structured data: it mentions the newer tool by its repository, and claims to be neither it nor built on it');
    const shell = read('carbon-ai.html');
    assert(shell.indexOf('<!-- JSON-LD -->') > -1 && shell.indexOf('<!-- JSON-LD -->') < shell.indexOf('application/ld+json') && shell.indexOf('application/ld+json') < shell.indexOf('<!-- /JSON-LD -->'),
        'Structured data: the coach\'s block sits between its markers, written by the build');
}

// ===================================================================
// The 404 page has a title and a description
// ===================================================================
{
    const doc = new JSDOM(read('404.html')).window.document;
    const description = doc.querySelector('meta[name="description"]');
    assert(!!doc.title && !!description && description.getAttribute('content').length > 40, `404.html: a title and a description (${doc.title})`);
}

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
