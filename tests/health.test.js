// Tests for the weekly health check (scripts/health.js) and the quarterly
// review (scripts/review.js), and the workflows that run them.
//
// The open-counts Action "succeeded" twice in October 2026 and committed
// nothing, because its secret was never set; nothing said so anywhere a
// person would look. The health check exists to say so, and to say what is
// broken, in one issue. Each check reads the world through what it is
// handed (fetch, git's history, npm audit, the files, the clock), so every
// one runs here against fixtures with no network: a stale date, a 999, a
// 404, an old script's answer, a page Pages has not rebuilt yet, a ticked
// and an unticked item. The issue is kept against a stand-in for GitHub's
// API: opened once, edited in place, closed when all is clear.
//
// Run with: node tests/health.test.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const health = require('../scripts/health.js');
const review = require('../scripts/review.js');
const github = require('../scripts/lib/github.js');

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

const NOW = new Date('2026-10-20T05:41:00Z');           // a Tuesday, as the workflow runs
const HOUR = 3600e3;
const SITE = 'https://moseskolleh.github.io/sustaintheworld/';
const GAS = (read('script.js').match(/const GOOGLE_APPS_SCRIPT_URL = '([^']+)'/) || [])[1];
const VERSION = health.declaredVersion(read('google-apps-script/Code.gs'));
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const checklist = health.parseChecklist(read('docs/owner-checklist.md'));

/**
 * A network made of one function: (method, url, init) returns a response
 * ({ status, body }), an Error to throw, or nothing (a host that does not
 * resolve). Every request is logged.
 */
function net(answer) {
    const calls = [];
    const fetch = async (url, init = {}) => {
        const method = init.method || 'GET';
        calls.push({ method, url: String(url), body: init.body, headers: init.headers || {} });
        const r = answer(method, String(url), init);
        if (r instanceof Error) throw r;
        if (!r) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
        const buf = Buffer.from(r.body || '');
        return {
            status: r.status || 200,
            text: async () => buf.toString('utf8'),
            arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length),
            body: null
        };
    };
    return { fetch, calls };
}
const json = (o, status = 200) => ({ status, body: JSON.stringify(o) });

/** A context for the checks: the real repository's files unless a fixture replaces one. */
function context(over = {}) {
    const files = over.files || {};
    const readFile = (rel) => {
        if (rel in files) {
            if (files[rel] === null) throw new Error(`ENOENT ${rel}`);
            return files[rel];
        }
        return read(rel);
    };
    const sleeps = [];
    const ctx = {
        now: NOW,
        env: {},
        fetch: net(() => null).fetch,
        sleep: async (ms) => { sleeps.push(ms); },
        sleeps,
        read: readFile,
        list: (dir) => fs.readdirSync(path.join(ROOT, dir)),
        checklist,
        mainSha: 'c5ce9612c38106115d86542802e16854341905ee',
        mainFile: (rel) => Buffer.from(readFile(rel)),
        history: () => [],
        audit: () => ({ status: 0, stdout: JSON.stringify({ vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } }) }),
        cv: () => ({ fresh: true, pdfFresh: true, printed: '2026-10-04' })
    };
    return Object.assign(ctx, over, { files: undefined });
}
const one = (r) => [].concat(r)[0];
const byId = (rs, id) => [].concat(rs).find(r => r.id === id);

(async () => {
    // =====================================================================
    // The owner checklist, read as data
    // =====================================================================
    {
        const ids = checklist.items.map(i => i.id);
        assert(['C1', 'C2', 'C3', 'S1', 'S2', 'F1', 'F2', 'F3', 'F5'].every(id => ids.includes(id)), `Checklist: every item is read (${ids.length}, ${ids.slice(0, 6).join(' ')} ...)`);
        const s7 = checklist.items.find(i => i.id === 'S7');
        assert(s7 && s7.done && checklist.items.filter(i => i.done).every(i => /\n- \[x\] \*\*/.test(`\n${read('docs/owner-checklist.md')}`)),
            'Checklist: a ticked item reads as done (S7)');
        const c2 = checklist.items.find(i => i.id === 'C2');
        assert(c2 && c2.title === 'Redeploy the Apps Script as a new version, after #41 and #42, and now the visit counter' && !c2.done,
            `Checklist: a title that runs onto a second line is read whole (${c2 && c2.title})`);
        const f5 = checklist.items.find(i => i.id === 'F5');
        assert(f5 && /`meta\.confirmedOn`/.test(f5.where) && f5.section === 'Facts about you the site cannot state yet', 'Checklist: an item keeps its "Where" note and its section');
        const fields = checklist.facts.map(f => `${f.field}:${f.item}`).join(' ');
        assert(fields === 'atAGlance.seniority:F3 atAGlance.availableFrom:F3 languages:F1 atAGlance.rightToWork:F2',
            `Checklist: the at-a-glance table maps each fact to its field and its item (${fields})`);

        // Each check names its items by what they say, not by number; a
        // rewording that loses one fails here rather than in the issue.
        Object.entries(health.NEEDS).forEach(([name, needles]) => {
            needles.filter(n => n !== 'HEALTH_URL').forEach((n) => {
                const found = health.itemsFor(checklist, [n]);
                assert(found.length === 1, `Checklist: the "${name}" needle ${n} finds one item (${found.join(', ') || 'none'})`);
            });
        });
        assert(health.itemsFor(checklist, health.NEEDS.publish).join() === 'C2' && health.itemsFor(checklist, health.NEEDS.statsSource).join() === 'S2'
            && health.itemsFor(checklist, health.NEEDS.counter).join() === 'S1' && health.itemsFor(checklist, health.NEEDS.confirm).join() === 'F5'
            && health.itemsFor(checklist, health.NEEDS.form).join() === 'C1,C3',
            'Checklist: the needles find publishing the script (C2), the counter (S1), the open counts\' secret (S2), the confirmation (F5) and the form (C1, C3)');

        const fixture = health.parseChecklist([
            '## Do first', '',
            '- [x] **A1. A finished thing.**', '  - *Where:* nowhere.', '',
            '- [ ] **A2. An open thing that runs onto',
            '  a second line.**', '  - *What:* something.', '  - *Where:* `content/x.json` →', '    `field.name`, and more.', '  - *Check:* `npm test`.', '',
            '## Later', '', '| Fact | Field | Today | Item |', '|---|---|---|---|', '| Size | `size.value` | `null` | A2 |', '',
            '- [ ] **B1. Another.**'
        ].join('\n'));
        assert(fixture.items.map(i => `${i.id}${i.done ? '+' : '-'}`).join(' ') === 'A1+ A2- B1-', 'Checklist: a ticked and an unticked item are told apart');
        assert(fixture.items[1].title === 'An open thing that runs onto a second line' && fixture.items[1].where === '`content/x.json` → `field.name`, and more.',
            `Checklist: the "Where" note is read across its lines, and stops at the next note (${fixture.items[1].where})`);
        assert(fixture.items[2].section === 'Later' && fixture.facts.length === 1 && fixture.facts[0].field === 'size.value', 'Checklist: sections and fact tables are read from any section');
    }

    // =====================================================================
    // The live site is main
    // =====================================================================
    {
        const sitemap = `<urlset><url><loc>${SITE}</loc></url><url><loc>${SITE}a.html</loc></url><url><loc>${SITE}notes/</loc></url></urlset>`;
        assert(JSON.stringify(health.sitemapPages(sitemap, SITE).map(p => p.file)) === '["index.html","a.html","notes/index.html"]',
            'Live: sitemap.xml\'s addresses map to the files main serves them from');

        const pages = `<urlset><url><loc>${SITE}</loc></url><url><loc>${SITE}a.html</loc></url></urlset>`;
        const v = { index2: 'index, second version', index1: 'index, first version', a: 'page a' };
        const history = (changedAgo) => (file) => (file === 'index.html'
            ? [{ sha: 'b2b2b2b2', time: NOW.getTime() - changedAgo, hash: sha256(v.index2) }, { sha: 'a1a1a1a1', time: NOW.getTime() - 10 * 24 * HOUR, hash: sha256(v.index1) }]
            : [{ sha: 'a1a1a1a1', time: NOW.getTime() - 10 * 24 * HOUR, hash: sha256(v.a) }]);
        const live = (index, aStatus = 200) => net((m, url) => (url === SITE ? { body: index } : url === `${SITE}a.html` ? { status: aStatus, body: v.a } : null));
        const run = async (fetch, changedAgo = 3 * 24 * HOUR) => one(await health.checkLive(context({ fetch, history: history(changedAgo), files: { 'sitemap.xml': pages } })));

        let n = live(v.index2);
        let r = await run(n.fetch);
        assert(r.status === 'pass' && /All 2 pages/.test(r.summary), `Live: every page answering 200 with main's bytes passes (${r.summary})`);
        assert(n.calls.every(c => c.method === 'GET') && n.calls.length === 2, 'Live: one GET a page, nothing else');

        r = await run(live(v.index1).fetch, 10 * 60e3);
        assert(r.status === 'not-checkable' && /has not finished publishing/.test(r.summary) && /main changed it 10 min ago/.test(r.details.join()),
            `Live: a page main changed ten minutes ago is "not rebuilt yet", not broken (${r.status}: ${r.details.join('; ')})`);

        r = await run(live(v.index1).fetch);
        assert(r.status === 'fail' && /index\.html is main's copy as of a1a1a1a/.test(r.details.join()) && /has not published that/.test(r.details.join()),
            `Live: a page still serving an older version days after main moved is broken, and says which version it serves (${r.details.join('; ')})`);

        r = await run(live('bytes main never held').fetch);
        assert(r.status === 'fail' && /none of main's last 2 versions/.test(r.details.join()), 'Live: bytes main never held are broken');

        r = await run(live(v.index2, 404).fetch);
        assert(r.status === 'fail' && /a\.html answers 404/.test(r.details.join()), 'Live: a page that answers 404 is broken');
        const added = (file) => (file === 'a.html' ? [{ sha: 'c3c3c3c3', time: NOW.getTime() - 5 * 60e3, hash: sha256(v.a) }] : history(3 * 24 * HOUR)(file));
        r = one(await health.checkLive(context({ fetch: live(v.index2, 404).fetch, history: added, files: { 'sitemap.xml': pages } })));
        assert(r.status === 'not-checkable' && /a\.html: main changed it 5 min ago .* answers 404 for now/.test(r.details.join()),
            `Live: a page main added five minutes ago that Pages has not published yet is "not rebuilt yet" (${r.details.join('; ')})`);

        r = await run(net(() => null).fetch);
        assert(r.status === 'not-checkable' && /Could not reach moseskolleh\.github\.io/.test(r.summary), `Live: a site that cannot be reached at all is not checkable from here (${r.summary})`);
    }

    // =====================================================================
    // Links off the site
    // =====================================================================
    {
        const profile = JSON.stringify({ links: { site: SITE, linkedin: 'https://linkedin.com/in/someone' } });
        const files = {
            'content/profile.json': profile,
            'sitemap.xml': `<urlset><url><loc>${SITE}</loc></url><url><loc>${SITE}a.html</loc></url></urlset>`,
            'index.html': [
                '<a href="https://ok.example/">fine</a>',
                '<a href="https://ok.example/#section">the same page</a>',
                '<a href="https://gone.example/page">gone</a>',
                '<a href="https://www.linkedin.com/in/someone">LinkedIn</a>',
                '<a href=\'https://head-refuser.example/x?a=1&amp;b=2\'>HEAD refused</a>',
                '<a href="https://strict.example/">403 to everyone</a>',
                '<a href="https://busy.example/">rate-limited</a>',
                `<a href="${SITE}claims.html">on the site</a>`,
                '<a href="mailto:someone@example.com">mail</a>',
                '<a href="#contact">here</a>'
            ].join('\n'),
            'a.html': '<a href="https://ok.example/">again</a> <a href="https://gone.example/page">again</a>',
            'b.html': '<a href="https://unlisted.example/">a root page not in the sitemap</a>',
            'content/x.json': JSON.stringify({ doc: 'https://content-only.example/doc', note: 'see https://prose.example/ for more' })
        };
        const list = (dir) => (dir === 'content' ? ['profile.json', 'x.json'] : ['index.html', 'a.html', 'b.html', 'README.md']);
        const answers = {
            'ok.example': () => ({ status: 200 }),
            'gone.example': () => ({ status: 404 }),
            'www.linkedin.com': () => ({ status: 403 }),
            'linkedin.com': () => ({ status: 999 }),
            'head-refuser.example': (m) => ({ status: m === 'HEAD' ? 403 : 200 }),
            'strict.example': () => ({ status: 403 }),
            'busy.example': () => ({ status: 429 }),
            'unlisted.example': () => ({ status: 200 }),
            'content-only.example': () => ({ status: 200 })
        };
        const n = net((m, url) => (answers[new URL(url).hostname] || (() => null))(m));
        const ctx = context({ fetch: n.fetch, files, list });
        const rs = await health.checkLinks(ctx);
        const links = byId(rs, 'links');
        const unchecked = byId(rs, 'links-unchecked');
        const asked = [...new Set(n.calls.map(c => c.url))];

        assert(!asked.some(u => u.startsWith(SITE) || /^mailto|#contact|prose\.example/.test(u)) && asked.filter(u => u.startsWith('https://ok.example/')).length === 1,
            `Links: off-site http(s) links only, once each without their #fragment; a URL inside prose in content/ is not a link (${asked.length} asked)`);
        assert(asked.includes('https://content-only.example/doc') && asked.includes('https://unlisted.example/') && asked.includes('https://linkedin.com/in/someone'),
            'Links: links in content/, on root pages the sitemap does not list, and in the profile are checked too');
        assert(asked.includes('https://head-refuser.example/x?a=1&b=2'), 'Links: an &amp; in an href is read as &');
        assert(links.status === 'fail' && links.details.length === 2 && /gone\.example\/page answers 404 \(a\.html, index\.html\)/.test(links.details.join('\n')),
            `Links: a 404 is broken, with every page it is on (${links.summary})`);
        assert(/strict\.example\/ answers 403.*add it to REFUSERS/.test(links.details.join('\n')), 'Links: a 403 from a host not known to refuse bots is broken, with the way to list it');
        assert(!/head-refuser/.test(links.details.join()), 'Links: a host that refuses HEAD but answers GET is fine');
        const heads = n.calls.filter(c => c.url.includes('head-refuser')).map(c => c.method).join(' ');
        assert(heads === 'HEAD GET' && n.calls.filter(c => c.url.startsWith('https://ok.example')).map(c => c.method).join(' ') === 'HEAD',
            `Links: HEAD first, and GET only when HEAD is refused (${heads})`);
        assert(unchecked && unchecked.status === 'not-checkable' && unchecked.details.length === 3 &&
            /linkedin\.com\/in\/someone: linkedin\.com answered 999, and refuses anything but a signed-in browser/.test(unchecked.details.join('\n')) &&
            /www\.linkedin\.com\/in\/someone: linkedin\.com answered 403, and refuses/.test(unchecked.details.join('\n')) && /busy\.example.*429/.test(unchecked.details.join('\n')),
            `Links: LinkedIn's 999, LinkedIn's 403 and a 429 are "not checkable from here", and say which and why (${unchecked && unchecked.details.join(' | ')})`);
        assert(!links.details.some(d => /linkedin|busy/.test(d)), 'Links: ...and none of them is called broken');
        assert(ctx.sleeps.filter(ms => ms === 1000).length >= 1 && ctx.sleeps.every(ms => ms >= 1000),
            `Links: two requests to one host wait a second between them (${ctx.sleeps.length} waits)`);

        const down = net((m, url) => (new URL(url).hostname === 'ok.example' ? { status: 200 } : null));
        const one404 = byId(await health.checkLinks(context({ fetch: down.fetch, files, list })), 'links');
        assert(one404.status === 'fail' && /gone\.example\/page did not answer: ENOTFOUND/.test(one404.details.join()),
            'Links: a host that does not resolve while others answer is broken');
        assert(down.calls.filter(c => c.url.includes('gone.example')).length === 3, 'Links: ...after HEAD, a GET and one more GET after a pause');

        // A server's bad minute is tried again before it is called broken.
        let tries = 0;
        const flaky = net((m, url) => {
            const host = new URL(url).hostname;
            if (host === 'gone.example' && m === 'GET') return { status: ++tries < 2 ? 503 : 200 };
            return host === 'gone.example' ? { status: 503 } : { status: 200 };
        });
        const recovered = byId(await health.checkLinks(context({ fetch: flaky.fetch, files, list })), 'links');
        assert(recovered.status === 'pass' && flaky.calls.filter(c => c.url.includes('gone.example')).map(c => c.method).join(' ') === 'HEAD GET GET',
            'Links: a 503 is tried again after a pause, and a link that then answers is fine');
        const down503 = byId(await health.checkLinks(context({ fetch: net((m, url) => ({ status: new URL(url).hostname === 'gone.example' ? 503 : 200 })).fetch, files, list })), 'links');
        assert(down503.status === 'fail' && /gone\.example\/page answers 503/.test(down503.details.join()), 'Links: ...and one still failing is broken');

        const offline = await health.checkLinks(context({ fetch: net(() => null).fetch, files, list }));
        assert(offline.length === 1 && offline[0].status === 'not-checkable' && /could be reached from here \(ENOTFOUND\)/.test(offline[0].summary),
            'Links: when no host answers at all, it is this machine\'s network, not checkable, not broken');
    }

    // =====================================================================
    // What goes stale
    // =====================================================================
    {
        const real = JSON.parse(read('content/profile.json'));
        const profile = (meta, glance, extra = {}) => JSON.stringify({ ...real, ...extra, meta: { ...real.meta, ...meta }, atAGlance: { ...real.atAGlance, ...glance } });

        let rs = health.checkProfile(context({ files: { 'content/profile.json': profile({ verifiedOn: '2026-06-01', confirmedOn: null }) } }));
        assert(byId(rs, 'profile-verified').status === 'waiting' && /141 days ago/.test(byId(rs, 'profile-verified').summary) && byId(rs, 'profile-verified').items.join() === 'F5',
            `Stale: a profile logged more than 90 days ago is waiting, on F5 (${byId(rs, 'profile-verified').summary})`);
        assert(byId(rs, 'profile-confirmed').status === 'waiting' && /confirmedOn is null/.test(byId(rs, 'profile-confirmed').summary), 'Stale: confirmedOn still null is waiting on Moses');
        rs = health.checkProfile(context({ files: { 'content/profile.json': profile({ verifiedOn: '2026-08-05', confirmedOn: '2026-10-01' }) } }));
        assert(byId(rs, 'profile-verified').status === 'pass' && /falls due on 2026-11-04/.test(byId(rs, 'profile-verified').summary) && byId(rs, 'profile-confirmed').status === 'pass',
            `Stale: a profile logged 76 days ago, and confirmed, passes, and says when it falls due (${byId(rs, 'profile-verified').summary})`);
        rs = health.checkProfile(context({ files: { 'content/profile.json': profile({ verifiedOn: '2026-08-05', confirmedOn: '2026-05-01' }) } }));
        assert(byId(rs, 'profile-confirmed').status === 'waiting', 'Stale: a confirmation more than a quarter old is waiting again');

        let g = health.checkAtAGlance(context({ files: { 'content/profile.json': profile({}, { seniority: null, availableFrom: null, rightToWork: null }) } }));
        assert(g.status === 'waiting' && g.summary.startsWith('Seniority, available from, languages and right to work in the NL and the EU are not stated') && g.items.join() === 'F3,F1,F2',
            `Stale: each at-a-glance fact the checklist's table names is waiting while unstated, on its own item (${g.summary})`);
        const filled = { seniority: 'Mid-level', rightToWork: 'EU citizen' };
        const said = (from) => health.checkAtAGlance(context({ files: { 'content/profile.json': profile({}, { ...filled, availableFrom: from }, { languages: [{ language: 'English', level: 'C2' }] }) } }));
        assert(said('2027-01').status === 'pass' && said('now').status === 'pass' && said('2026-10').status === 'pass', 'Stale: a date still to come, "now", or this month passes');
        g = said('2026-09');
        assert(g.status === 'waiting' && /availableFrom says 2026-09, which has passed/.test(g.summary) && g.items.join() === 'F3', `Stale: an available-from month that has passed is waiting (${g.summary})`);
        assert(said('2026-10-19').status === 'waiting', 'Stale: ...and so is a day that has passed');

        const ai = (date, now = NOW) => health.checkAiData(context({ now, files: { 'ai-carbon-data.js': `    const REVIEWED_ON = '${date}';\n` } }));
        assert(ai('2026-08-05').status === 'pass' && /falls due on 2026-11-05/.test(ai('2026-08-05').summary), 'Stale: the AI factor set reviewed within a quarter passes');
        assert(ai('2026-07-01').status === 'waiting' && /2026-07-01, more than a quarter ago/.test(ai('2026-07-01').summary), 'Stale: reviewed more than a quarter ago is waiting');
        assert(health.checkAiData(context({ files: { 'ai-carbon-data.js': '// no date' } })).status === 'fail', 'Stale: no review date at all is broken');
        assert(/REVIEWED_ON = '\d{4}-\d{2}-\d{2}'/.test(read('ai-carbon-data.js')) && health.checkAiData(context()).summary.includes(require('../ai-carbon-data.js').REVIEWED_ON),
            'Stale: the date is the one ai-carbon-data.js carries');

        assert(health.checkCv(context({ cv: () => ({ fresh: false, pdfFresh: true }) })).status === 'fail', 'Stale: a CV printed before content/ last changed is broken');
        assert(health.checkCv(context({ cv: () => ({ fresh: true, pdfFresh: false }) })).status === 'fail', 'Stale: a PDF replaced by hand is broken');
        const cv = health.defaultContext({}).cv();
        assert(cv.fresh && cv.pdfFresh && /^\d{4}-\d{2}-\d{2}$/.test(cv.printed),
            `Stale: on this checkout the CV is as fresh as assets/cv.hash says, and printed on ${cv.printed} (the same check tests/cv.test.js makes)`);
    }

    // =====================================================================
    // The switches only Moses can throw
    // =====================================================================
    {
        // The deployment script.js posts to: what each version of Code.gs answers.
        const answers = {
            current: { health: json({ status: 'ok', version: VERSION, message: 'x' }) },
            older: { health: json({ status: 'ok', version: '000000000000', message: 'x' }) },
            counter: { health: json({ status: 'ok', message: 'Contact form endpoint is active. Send submissions as POST.' }), stats: json({ status: 'refused', message: 'x' }) },
            plain: { health: json({ status: 'ok', message: 'Contact form endpoint is active. Send submissions as POST.' }), stats: json({ status: 'ok', message: 'Contact form endpoint is active. Send submissions as POST.' }) },
            old: { health: { body: '<!DOCTYPE html><title>Form Response Capture API</title><p>Spreadsheet: Responses</p>' } },
            signin: { health: { body: '<!DOCTYPE html><title>Sign in - Google Accounts</title><a href="https://accounts.google.com/ServiceLogin">' } },
            gone: { health: { status: 404, body: 'Not Found' } }
        };
        const deploy = async (which) => {
            const n = net((m, url) => (url === `${GAS}?action=health` ? answers[which].health : url === `${GAS}?action=stats` ? answers[which].stats : null));
            const r = await health.checkDeployment(context({ fetch: n.fetch }));
            return { r, n };
        };
        let { r, n } = await deploy('current');
        assert(r.status === 'pass' && r.summary.includes(VERSION), `Deployment: the repository's Code.gs, by version, passes (${r.summary})`);
        assert(n.calls.length === 1 && n.calls[0].method === 'GET', 'Deployment: asking costs one GET, and posts nothing to the live form');
        ({ r } = await deploy('older'));
        assert(r.status === 'waiting' && /000000000000, not the repository's/.test(r.summary) && r.items.join() === 'C2', `Deployment: another version is waiting on C2 (${r.summary})`);
        ({ r, n } = await deploy('counter'));
        assert(r.status === 'waiting' && /with the visit counter but without the health check/.test(r.summary) && r.items.join() === 'C2' && n.calls.length === 2,
            'Deployment: the counter\'s Code.gs (stats refused, no health check) is waiting on C2');
        ({ r } = await deploy('plain'));
        assert(r.status === 'waiting' && /before the visit counter/.test(r.summary) && r.items.join() === 'C2,S1', 'Deployment: a Code.gs from before the counter is waiting on C2 and S1');
        ({ r } = await deploy('old'));
        assert(r.status === 'fail' && /Form Response Capture API/.test(r.summary) && /at once/.test(r.summary), 'Deployment: the 2025 script, which may mail every page view, is broken: publish at once');
        ({ r } = await deploy('signin'));
        assert(r.status === 'fail' && /not deployed with access "Anyone"/.test(r.summary), 'Deployment: a Google sign-in page is broken');
        ({ r } = await deploy('gone'));
        assert(r.status === 'fail' && /404/.test(r.summary), 'Deployment: a deleted deployment is broken');
        r = await health.checkDeployment(context({ fetch: net(() => new Error('timeout')).fetch }));
        assert(r.status === 'not-checkable', 'Deployment: an unreachable deployment is not checkable from here');

        // The contact form end to end, through HEALTH_URL.
        const TOKEN = 'sekrit-token-value';
        const HEALTH_URL = 'https://script.google.com/macros/s/TEST/exec?action=health&token=' + TOKEN;
        const probeUrl = 'https://script.google.com/macros/s/TEST/exec?action=health';
        const e2e = async (reply, probe = json({ status: 'ok', version: VERSION, message: 'x' }), env = { HEALTH_URL }) => {
            const n2 = net((m, url) => (m === 'GET' && url === probeUrl ? probe : m === 'POST' && url === HEALTH_URL ? reply : null));
            return { r: await health.checkContact(context({ env, fetch: n2.fetch })), n: n2 };
        };
        const ok = json({ status: 'success', message: 'Response recorded successfully!', version: VERSION, ownerEmail: true, turnstile: false });
        let c = await health.checkContact(context());
        assert(c.status === 'waiting' && /HEALTH_URL/.test(c.summary) && c.items.join() === 'C1,C3', `Contact: no HEALTH_URL is waiting on Moses, on C1 and C3 (${c.items})`);
        ({ r: c, n } = await e2e(ok));
        assert(c.status === 'pass' && /recorded on the Health tab/.test(c.summary), `Contact: a recorded test message with OWNER_EMAIL set passes (${c.summary})`);
        const post = n.calls.find(x => x.method === 'POST');
        assert(n.calls[0].method === 'GET' && n.calls[0].url === probeUrl && !n.calls[0].url.includes(TOKEN),
            'Contact: it asks for the version first, without the token');
        assert(post && post.url === HEALTH_URL && JSON.stringify(JSON.parse(post.body)) === JSON.stringify(health.HEALTH_MESSAGE),
            'Contact: then posts the test message, with the token, to ?action=health');
        ({ r: c, n } = await e2e(ok, json({ status: 'ok', message: 'Contact form endpoint is active. Send submissions as POST.' })));
        assert(c.status === 'waiting' && n.calls.every(x => x.method === 'GET') && c.items.join() === 'C2',
            'Contact: a deployment without the health check gets no POST (it would take the test for a real message and email it), and waits on C2');
        ({ r: c } = await e2e(json({ status: 'refused', message: 'x' })));
        assert(c.status === 'fail' && /not the script's HEALTH_TOKEN/.test(c.summary), 'Contact: a refused token is broken');
        ({ r: c } = await e2e(json({ status: 'error', message: 'Something went wrong on our side. Please try again shortly.' })));
        assert(c.status === 'fail' && /Something went wrong on our side/.test(c.summary) && /Executions log/.test(c.summary), 'Contact: a failure on the form\'s path is broken, quoting the script\'s fixed reply');
        ({ r: c } = await e2e(json({ status: 'success', message: 'x', ownerEmail: false, turnstile: false })));
        assert(c.status === 'fail' && /OWNER_EMAIL is not set/.test(c.summary), 'Contact: recorded but with no OWNER_EMAIL is broken: nobody hears of a real message');
        ({ r: c } = await e2e(json({ status: 'success', message: 'x', ownerEmail: true, turnstile: true })));
        assert(c.status === 'fail' && /TURNSTILE_SECRET is set/.test(c.summary), 'Contact: TURNSTILE_SECRET set is broken: every real message is refused');
        ({ r: c } = await e2e({ status: 302, body: '<html>Moved</html>' }));
        assert(c.status === 'fail' && /no reply from the script/.test(c.summary), 'Contact: an answer that is not the script\'s JSON is broken');
        ({ r: c } = await e2e(ok, null));
        assert(c.status === 'not-checkable', 'Contact: an unreachable deployment is not checkable from here');
        c = await health.checkContact(context({ env: { HEALTH_URL: 'not a url' } }));
        assert(c.status === 'fail' && !/not a url/.test(c.summary), 'Contact: a HEALTH_URL that is not a URL is broken, and is not printed');

        // The token never reaches the report, whatever the outcome.
        const leaks = [];
        for (const reply of [ok, json({ status: 'refused' }), json({ status: 'error', message: 'x' }), null]) {
            const { r: x } = await e2e(reply);
            const body = health.render([x], { checklist, now: NOW, sha: 'abc', repo: 'o/r' });
            if (body.includes(TOKEN) || body.includes('/TEST/')) leaks.push(x.status);
        }
        assert(leaks.length === 0, `Contact: neither the token nor the deployment's path is ever printed, only its host (leaked: ${leaks.join(', ') || 'none'})`);

        // The open counts.
        assert(health.checkStatsSource(context()).status === 'not-checkable', 'Open counts: run outside the workflow, whether the secret is set cannot be known');
        const off = health.checkStatsSource(context({ env: { STATS_SOURCE_SET: 'false' } }));
        assert(off.status === 'waiting' && off.items.join() === 'S2', 'Open counts: the secret unset is waiting on S2');
        assert(health.checkStatsSource(context({ env: { STATS_SOURCE_SET: 'true' } })).status === 'pass', 'Open counts: the secret set passes');

        const stats = JSON.parse(read('content/stats.json'));
        const none = health.checkStatsData(context({ files: { 'content/stats.json': JSON.stringify({ ...stats, status: 'not-collecting', weeks: [] }) } }));
        assert(none.status === 'waiting' && none.items.join() === 'S1,S2', 'Open counts: no week yet is waiting on S1 and S2');
        const collecting = (asOf) => JSON.stringify({ ...stats, status: 'collecting', asOf, week: { start: '2026-10-12', end: '2026-10-18' }, weeks: [{}, {}] });
        assert(health.checkStatsData(context({ files: { 'content/stats.json': collecting('2026-10-19') } })).status === 'pass', 'Open counts: written this Monday passes');
        const late = health.checkStatsData(context({ files: { 'content/stats.json': collecting('2026-10-05') } }));
        assert(late.status === 'fail' && /15 days ago/.test(late.summary), `Open counts: not written for two Mondays is broken (${late.summary})`);
    }

    // =====================================================================
    // npm audit
    // =====================================================================
    {
        const audit = (report) => health.checkAudit(context({ audit: () => ({ status: 1, stdout: typeof report === 'string' ? report : JSON.stringify(report) }) }));
        const meta = (high) => ({ metadata: { vulnerabilities: { low: 2, moderate: 1, high, critical: 0 } } });
        let a = audit({ ...meta(0), vulnerabilities: { tar: { severity: 'moderate' } } });
        assert(a.status === 'pass' && /1 moderate, 2 low/.test(a.summary) && /all 9 dependencies are dev dependencies/.test(a.summary),
            `Audit: nothing at high or above passes, and says every dependency is a dev dependency (${a.summary})`);
        a = audit({ ...meta(1), vulnerabilities: { 'html-validate': { severity: 'high', fixAvailable: true }, tar: { severity: 'moderate' } } });
        assert(a.status === 'fail' && a.details.join() === 'html-validate: high, a fix is available', `Audit: a high advisory is broken, naming the package (${a.details})`);
        assert(audit('npm ERR! network').status === 'not-checkable' && audit({ error: { code: 'ENOAUDIT', summary: 'x' } }).status === 'not-checkable',
            'Audit: no report (no registry from here) is not checkable');
        const pkg = JSON.parse(read('package.json'));
        assert(!pkg.dependencies && Object.keys(pkg.devDependencies).length === 9, 'Audit: package.json has dev dependencies only, as the report line says');
    }

    // =====================================================================
    // The report, and the one issue
    // =====================================================================
    const sample = [
        { id: 'a', title: 'Broken thing', status: 'fail', summary: 'It broke.', details: ['first', 'second'], items: [] },
        { id: 'b', title: 'Waiting thing', status: 'waiting', summary: 'It waits.', details: [], items: ['S2', 'C2'] },
        { id: 'c', title: 'Unseen thing', status: 'not-checkable', summary: 'Cannot see.', details: [], items: [] },
        { id: 'd', title: 'Fine thing', status: 'pass', summary: 'It works.', details: [], items: ['S7'] }
    ];
    {
        const body = health.render(sample, { checklist, now: NOW, sha: 'c5ce9612c381', repo: 'moseskolleh/sustaintheworld', runUrl: 'https://github.com/x/actions/runs/1' });
        assert(body.startsWith(`${health.MARKER}\n`), 'Report: the marker the issue is found by comes first');
        const order = ['### Broken', '### Waiting on Moses', '### Not checkable from here', '### Passing', '### Open owner items'].map(h => body.indexOf(h));
        assert(order.every((n, i) => n > -1 && (i === 0 || n > order[i - 1])), 'Report: broken, then waiting, then not checkable, then passing, then the owner items');
        assert(/\*\*1 broken · 1 waiting on Moses · 1 not checkable from here · 1 passing\.\*\*/.test(body) && /against main at `c5ce961`/.test(body) && /\[this run\]/.test(body),
            'Report: the counts, the commit and the run, at the top');
        assert(/- \*\*Broken thing\.\*\* It broke\.\n {2}- first\n {2}- second/.test(body) && /It waits\. Owner checklist: C2, S2\./.test(body),
            'Report: each check a line, its details below it, its items in the checklist\'s order');
        const open = checklist.items.filter(i => !i.done).length;
        assert(body.includes(`${open} of ${checklist.items.length} items in [docs/owner-checklist.md](https://github.com/moseskolleh/sustaintheworld/blob/main/docs/owner-checklist.md) are open`),
            `Report: the open owner items are counted from the file (${open} of ${checklist.items.length})`);
        const first = body.split('The checks above wait on these:')[1].split('And the rest')[0];
        assert(/\*\*C2\.\*\* Redeploy the Apps Script/.test(first) && /\*\*S2\.\*\*/.test(first) && !/S7/.test(first),
            'Report: the open items a check waits on come first, by title; a ticked one (S7) is not listed');
        assert(/- Switch on the visit counter and the open counts \(Phase 1\): S1, S3, S4, S5, S6\n/.test(body) && !/C2/.test(body.split('And the rest')[1]),
            'Report: the rest are counted by section, each listed once');
        assert(health.needsIssue(sample) && !health.needsIssue([sample[2], sample[3]]) && health.needsIssue([sample[1]]),
            'Report: an issue is needed while anything is broken or waiting, and not for "not checkable" alone');
    }

    /** A stand-in for GitHub's issues API, one repository, logging every call. */
    function fakeGitHub(initial = []) {
        const issues = initial.map(i => ({ state: 'open', labels: [], comments: [], user: { login: 'github-actions[bot]' }, ...i }));
        const labels = new Set();
        const calls = [];
        let next = 50;
        const fetch = async (url, init = {}) => {
            const u = new URL(url);
            const method = init.method || 'GET';
            const body = init.body ? JSON.parse(init.body) : null;
            calls.push({ method, path: u.pathname, query: Object.fromEntries(u.searchParams), body, auth: init.headers.authorization });
            const reply = (status, data) => ({ status, text: async () => (data === undefined ? '' : JSON.stringify(data)) });
            const one = /\/repos\/o\/r\/issues\/(\d+)(\/comments)?$/.exec(u.pathname);
            if (method === 'POST' && u.pathname === '/repos/o/r/labels') {
                if (labels.has(body.name)) return reply(422, { message: 'Validation Failed' });
                labels.add(body.name);
                return reply(201, body);
            }
            if (method === 'GET' && u.pathname === '/repos/o/r/issues') {
                const q = Object.fromEntries(u.searchParams);
                let out = issues.filter(i => q.state === 'all' || i.state === (q.state || 'open'));
                if (q.labels) out = out.filter(i => i.labels.some(l => l.name === q.labels));
                if (q.creator) out = out.filter(i => i.user.login === q.creator);
                if (q.direction === 'desc') out = out.slice().reverse();
                return reply(200, out);
            }
            if (method === 'POST' && u.pathname === '/repos/o/r/issues') {
                // As GitHub does for a token that may not make labels: a label
                // that does not exist yet is dropped.
                const issue = { number: next++, title: body.title, body: body.body, state: 'open', comments: [], user: { login: 'github-actions[bot]' },
                    labels: (body.labels || []).filter(l => labels.has(l)).map(name => ({ name })) };
                issues.push(issue);
                return reply(201, issue);
            }
            if (one && method === 'PATCH' && !one[2]) {
                const i = issues.find(x => x.number === Number(one[1]));
                Object.assign(i, body);
                return reply(200, i);
            }
            if (one && method === 'POST' && one[2]) {
                issues.find(x => x.number === Number(one[1])).comments.push(body.body);
                return reply(201, {});
            }
            return reply(404, { message: 'Not Found' });
        };
        return { gh: github.client({ fetch, token: 't0ken', repo: 'o/r' }), issues, labels, calls };
    }

    {
        const failing = sample;
        const clear = [sample[3]];
        const body = (rs) => health.render(rs, { checklist, now: NOW, sha: 'abc', repo: 'o/r' });

        let w = fakeGitHub();
        let done = await health.syncIssue(w.gh, { results: failing, body: body(failing), now: NOW });
        const made = w.issues[0];
        assert(done.action === 'opened' && w.issues.length === 1 && made.title === 'Site health' && made.labels.map(l => l.name).join() === 'health',
            `Issue: the first run that finds something opens "Site health", labelled health (${done.action})`);
        assert(w.calls[0].method === 'POST' && w.calls[0].path === '/repos/o/r/labels' && w.calls.every(c => c.auth === 'Bearer t0ken'),
            'Issue: the label is made before the issue, so the issue keeps it; every call carries the token');

        done = await health.syncIssue(w.gh, { results: failing, body: body(failing).replace('It broke.', 'It broke again.'), now: NOW });
        assert(done.action === 'updated' && done.number === made.number && w.issues.length === 1 && /It broke again/.test(made.body),
            'Issue: a later run edits the same issue in place, never a second one');

        done = await health.syncIssue(w.gh, { results: [sample[2], sample[3]], body: body([sample[2], sample[3]]), now: NOW });
        assert(done.action === 'closed' && made.state === 'closed' && made.state_reason === 'completed' && made.comments.length === 1 && /Nothing is broken or waiting as of 2026-10-20/.test(made.comments[0]),
            'Issue: once nothing is broken or waiting (not checkable alone does not count), it is edited, commented on and closed');
        assert(/### Passing/.test(made.body) && !/### Broken/.test(made.body), 'Issue: ...and its body is the all-clear report');

        done = await health.syncIssue(w.gh, { results: clear, body: body(clear), now: NOW });
        assert(done.action === 'none' && w.issues.length === 1, 'Issue: all clear with no issue open does nothing');
        done = await health.syncIssue(w.gh, { results: failing, body: body(failing), now: NOW });
        assert(done.action === 'opened' && w.issues.length === 2 && w.issues[1].state === 'open', 'Issue: a failure after a close opens a new issue, and leaves the closed one as the record');

        // Taken off its label by hand: found by the bot's own marker, not duplicated.
        w = fakeGitHub([{ number: 7, title: 'Site health', body: `${health.MARKER}\nold`, labels: [] },
            { number: 8, title: 'Site health', body: 'A person\'s own issue with the same title', labels: [{ name: 'health' }], user: { login: 'moseskolleh' } }]);
        done = await health.syncIssue(w.gh, { results: failing, body: body(failing), now: NOW });
        assert(done.action === 'updated' && done.number === 7 && w.issues.length === 2 && w.issues[1].body.startsWith('A person'),
            'Issue: an issue that lost its label is found by its marker; a person\'s issue with the same title is left alone');

        let threw = '';
        try { await github.client({ fetch: async () => ({ status: 403, text: async () => '{"message":"Resource not accessible by integration"}' }), token: 't', repo: 'o/r' }).listIssues({}); } catch (e) { threw = e.message; }
        assert(/GET \/repos\/o\/r\/issues\?.*answered 403: Resource not accessible by integration/.test(threw), `Issue: an API refusal fails the run with GitHub's own reason (${threw})`);
        let bad = '';
        try { github.client({ fetch: async () => ({}), token: '', repo: 'o/r' }); } catch (e) { bad = e.message; }
        assert(/no token/.test(bad), 'Issue: no token is said plainly, before any request');
    }

    // =====================================================================
    // The quarterly review
    // =====================================================================
    {
        assert(review.quarter(new Date('2026-10-05T06:23:00Z')) === '2026 Q4' && review.quarter(new Date('2027-01-04T06:23:00Z')) === '2027 Q1'
            && review.quarter(new Date('2026-06-30T23:59:00Z')) === '2026 Q2' && review.quarter(new Date('2026-07-06T06:23:00Z')) === '2026 Q3',
            'Review: the quarter is the UTC calendar quarter');
        assert(review.title(new Date('2026-10-05T06:23:00Z')) === 'Quarterly review — 2026 Q4', 'Review: titled "Quarterly review — YYYY Qn"');

        // The plan's Phase 7 table and docs/review-checklist.md say the same
        // things: the file is the one copy, and the table points at it.
        const plan = read('docs/plan.md');
        const phase7 = plan.slice(plan.indexOf('## Phase 7'), plan.indexOf('\n## ', plan.indexOf('## Phase 7') + 1));
        const rows = [...phase7.matchAll(/^\| (Monthly|Quarterly|Yearly) \| (.+?) \|\s*$/gm)].map(m => ({ heading: m[1], items: m[2].split('; ') }));
        const file = review.parseReview(read(review.CHECKLIST));
        const norm = (s) => s.trim().replace(/^./, c => c.toLowerCase());
        assert(rows.length === 3 && file.sections.map(s => s.heading).join() === 'Monthly,Quarterly,Yearly', `Review: the plan has three rows and the checklist three headings (${rows.length}, ${file.sections.map(s => s.heading)})`);
        rows.forEach((row) => {
            const section = file.sections.find(s => s.heading === row.heading) || { items: [] };
            assert(JSON.stringify(row.items.map(norm)) === JSON.stringify(section.items.map(norm)),
                `Review: the ${row.heading.toLowerCase()} row of the plan's table and the checklist's items say the same (${section.items.join('; ')})`);
        });

        const latestHealth = { number: 12, state: 'open', body: `${health.MARKER}\n` };
        const body = review.reviewBody({ now: NOW, checklist: read(review.CHECKLIST), repo: 'o/r', site: SITE, latestHealth });
        const items = file.sections.flatMap(s => s.items);
        assert(items.length === 10 && items.every(i => body.includes(`- [ ] **${i}`)), `Review: the issue carries every item of the checklist as a task (${items.length})`);
        assert(body.includes(`${SITE}stats.html`) && body.includes('https://github.com/o/r/blob/main/docs/owner-checklist.md') && /latest health check: #12 \(open\)/.test(body),
            'Review: it links the open counts, the owner checklist and the latest health issue');
        assert(!body.includes('the one copy of its words') && body.startsWith(review.MARKER), 'Review: it carries the checklist from its first heading, not the file\'s own preamble');

        const w = fakeGitHub([{ number: 3, title: 'Site health', body: `${health.MARKER}\nx`, labels: [{ name: 'health' }], state: 'closed', closed_at: '2026-09-01T05:50:00Z' },
            { number: 4, title: 'Something else', body: 'x', labels: [] }]);
        const checklistMd = read(review.CHECKLIST);
        let done = await review.openReview(w.gh, { now: new Date('2026-10-05T06:23:00Z'), checklist: checklistMd, site: SITE });
        const opened = w.issues.find(i => i.title === 'Quarterly review — 2026 Q4');
        assert(done.action === 'opened' && opened && opened.labels.map(l => l.name).join() === 'review', `Review: the first Monday of a quarter opens its issue, labelled review (${done.action})`);
        assert(/latest health check: #3 \(closed, everything passing on 2026-09-01\)/.test(opened.body), 'Review: ...linking the latest health issue, closed or open');
        done = await review.openReview(w.gh, { now: new Date('2026-10-12T06:23:00Z'), checklist: checklistMd, site: SITE });
        assert(done.action === 'exists' && w.issues.filter(i => /Quarterly review/.test(i.title)).length === 1, 'Review: the next Monday finds it and opens nothing');
        opened.state = 'closed';
        done = await review.openReview(w.gh, { now: new Date('2026-12-28T06:23:00Z'), checklist: checklistMd, site: SITE });
        assert(done.action === 'exists', 'Review: a quarter whose issue was closed early does not get a second one');
        done = await review.openReview(w.gh, { now: new Date('2027-01-04T06:23:00Z'), checklist: checklistMd, site: SITE });
        assert(done.action === 'opened' && w.issues.some(i => i.title === 'Quarterly review — 2027 Q1'), 'Review: the next quarter gets its own');
    }

    // =====================================================================
    // The scripts from the command line, and the workflows
    // =====================================================================
    {
        const env = { PATH: process.env.PATH, HOME: process.env.HOME || os.tmpdir() };
        const cli = (script, args, extra = {}) => spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, encoding: 'utf8', env: { ...env, ...extra }, timeout: 20000 });
        let r = cli('health.js', []);
        assert(r.status === 1 && /GITHUB_TOKEN and GITHUB_REPOSITORY are needed/.test(r.stderr) && /--dry-run/.test(r.stderr),
            'CLI: without a token it says what it needs and how to print instead, before checking anything');
        r = cli('health.js', ['--code-version']);
        assert(r.status === 0 && r.stdout.trim() === VERSION, `CLI: --code-version prints the version Code.gs declares (${r.stdout.trim()})`);
        r = cli('review.js', ['--dry-run'], { GITHUB_REPOSITORY: 'o/r' });
        assert(r.status === 0 && /^Quarterly review — \d{4} Q[1-4]\n/.test(r.stdout) && /- \[ \] \*\*Refresh AI data\.\*\*/.test(r.stdout), 'CLI: review.js --dry-run prints the title and the body, and posts nothing');
        r = cli('review.js', []);
        assert(r.status === 1 && /--dry-run/.test(r.stderr), 'CLI: review.js without a token says so');
        const pkg = JSON.parse(read('package.json'));
        assert(pkg.scripts.health === 'node scripts/health.js', 'CLI: npm run health runs it');

        const workflow = (name) => read(`.github/workflows/${name}`);
        const shared = (yml, name) => {
            assert(/\npermissions:\n {2}contents: read\n {2}issues: write\n(?![ \t]+\w)/.test(yml) && (yml.match(/permissions:/g) || []).length === 1,
                `${name}: asks for contents: read and issues: write, and nothing else`);
            const uses = (yml.match(/uses: \S+/g) || []).map(u => u.slice(6));
            assert(uses.length === 2 && uses.join() === 'actions/checkout@v4,actions/setup-node@v4', `${name}: no action but checkout and setup-node, pinned at v4 (${uses.join(', ')})`);
            assert(/node-version: 22/.test(yml) && /- run: npm ci/.test(yml) && /persist-credentials: false/.test(yml) && /workflow_dispatch:/.test(yml),
                `${name}: Node 22, npm ci, a checkout that keeps no token, and a manual run`);
            assert(/GITHUB_TOKEN: \$\{\{ github\.token \}\}/.test(yml) && (yml.match(/github\.token/g) || []).length === 1, `${name}: the token reaches the one step that posts`);
        };
        const h = workflow('health.yml');
        shared(h, 'Health workflow');
        const cron = (h.match(/- cron: '([^']+)'/) || [])[1] || '';
        const statsCron = (workflow('stats.yml').match(/- cron: '([^']+)'/) || [])[1];
        assert(/^([1-9]|[1-5]\d) \d+ \* \* [0-6]$/.test(cron) && cron !== statsCron && cron.split(' ')[4] !== statsCron.split(' ')[4],
            `Health workflow: weekly, off the hour, on another day than the open counts (${cron}; theirs ${statsCron})`);
        assert(/STATS_SOURCE_SET: \$\{\{ \(secrets\.STATS_SOURCE_URL \|\| vars\.STATS_SOURCE_URL\) != '' \}\}/.test(h) && (h.match(/secrets\.STATS_SOURCE_URL/g) || []).length === 1,
            'Health workflow: the open counts\' secret reaches the script only as whether it is set');
        assert(/HEALTH_URL: \$\{\{ secrets\.HEALTH_URL \}\}/.test(h) && /run: node scripts\/health\.js\n/.test(h) && !/--dry-run/.test(h.split('jobs:')[1]),
            'Health workflow: runs the checks and keeps the issue, with HEALTH_URL for the end-to-end check');
        assert(/fetch-depth: [1-9]\d+/.test(h), 'Health workflow: fetches enough history to tell "not rebuilt yet" from "broken"');

        const rv = workflow('review.yml');
        shared(rv, 'Review workflow');
        assert(/- cron: '\d+ \d+ \* 1,4,7,10 1'/.test(rv), 'Review workflow: on the Mondays of January, April, July and October');
        assert(/run: node scripts\/review\.js\n/.test(rv), 'Review workflow: runs scripts/review.js');
    }

    if (failures > 0) {
        console.log(`\n${failures} assertion(s) failed`);
        process.exit(1);
    }
    console.log('\nAll assertions passed');
})().catch((err) => {
    console.log('FAIL: health tests threw', err && err.stack ? err.stack : err);
    process.exit(1);
});
