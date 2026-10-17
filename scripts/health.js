#!/usr/bin/env node
'use strict';
// ===================================================================
// HEALTH — what is broken on the live site, and what still waits on Moses
//
//     npm run health -- --dry-run        run every check and print the report
//     npm run health                     ...and keep the "Site health" issue
//                                        (GITHUB_TOKEN, GITHUB_REPOSITORY)
//     npm run health -- --code-version   the CODE_VERSION Code.gs should carry
//
// The site leans on things only its owner can switch on, and the scheduled
// jobs that depend on them stay green while they are off: the open-counts
// Action "succeeded" every Monday in October 2026 and committed nothing,
// because its secret was never set. A green tick that means "nothing
// happened" is the silent failure docs/plan.md warns about. This runs once a
// week (.github/workflows/health.yml) and says, in one issue, what is broken
// and what is waiting:
//
//   - the live site is main: every page in sitemap.xml answers 200 with the
//     bytes main holds, and a page Pages has not rebuilt yet (main moved in
//     the last hour) is told apart from one it never will;
//   - every link off the site, on its pages and in content/, answers below
//     400; a host that refuses anything but a signed-in browser (LinkedIn's
//     999) is listed as not checkable from here, never as broken;
//   - nothing has gone stale: the profile's facts, Moses's own confirmation
//     of them, the at-a-glance facts, the AI factor set's review date, the CV;
//   - the switches only Moses can throw: the contact form's deployment runs
//     the current Code.gs, a test message goes down the form's own path
//     (once he has set HEALTH_URL), the open counts have a source and a week;
//   - npm audit, at high severity and above;
//   - and the owner checklist's open items, the ones the checks above wait
//     on first, all read from docs/owner-checklist.md.
//
// Every check is pass, fail, waiting or not-checkable, so the issue keeps
// "broken" apart from "waiting on Moses". The issue is opened while anything
// fails or waits, edited in place on later runs, and closed with a comment
// once nothing does; a link that cannot be checked from here, or an open
// owner item no check waits on, does not keep it open.
//
// Every check takes what it reads through `ctx` (fetch, git, npm audit, the
// files, the clock), so tests/health.test.js runs each against fixtures with
// no network. Nothing secret is ever printed: HEALTH_URL carries a token, so
// only its host is; the open counts' secret never reaches this script, only
// whether it is set.
// ===================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const github = require('./lib/github.js');

const ROOT = path.join(__dirname, '..');
const DAY_MS = 864e5;

const STALE_DAYS = 90;                  // a quarter: Phase 7 re-verifies quarterly
const PAGES_GRACE_MS = 60 * 60e3;       // Pages publishes a push within minutes; an hour is generous
const HISTORY_DEPTH = 20;               // versions of a page looked through for the one Pages serves
const TIMEOUT_MS = 10000;
const HOST_GAP_MS = 1000;               // between two requests to one host
const STATS_LATE_DAYS = 9;              // the open counts are written every Monday
const UA = 'sustaintheworld-health-check (scripts/health.js; once a week)';

const TITLE = 'Site health';
const LABEL = {
    name: 'health',
    color: 'd93f0b',
    description: 'The weekly health check keeps one issue open while anything is broken or waiting'
};
const MARKER = '<!-- site-health: written by scripts/health.js; the weekly workflow edits this issue in place -->';

const STATUSES = ['fail', 'waiting', 'not-checkable', 'pass'];
const HEADINGS = {
    fail: 'Broken',
    waiting: 'Waiting on Moses',
    'not-checkable': 'Not checkable from here',
    pass: 'Passing'
};

// Hosts that refuse any request that is not a signed-in browser, whatever
// the page. A link to one is listed as not checkable from here, with this
// reason, and never as broken. Any host answering 999 (LinkedIn's own code
// for a refusal) is treated the same, listed or not.
const REFUSERS = {
    'linkedin.com': 'refuses anything but a signed-in browser, most often with a 999'
};

// The test message the contact form's path is sent. example.com is reserved
// for examples, and nothing is mailed anyway. Each run sends it from an
// address of its own (healthSender), because the form limits messages per
// address and this one is public: anyone could spend its allowance just
// before a run and have the check report the form broken.
const HEALTH_MESSAGE = {
    name: 'Site health check',
    email: 'health-check@example.com',
    subject: 'Weekly health check',
    message: 'A test message from the weekly health check (.github/workflows/health.yml). It goes to the Health tab, and nobody is emailed.',
    source: 'health check'
};
const healthSender = (tag) => HEALTH_MESSAGE.email.replace('@', `+${String(tag).replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'run'}@`);

// Each check names the owner-checklist items it waits on by something the
// item says (its title, or where its answer goes), not by number, so the
// numbering can change under it; tests/health.test.js fails if a needle
// stops finding its item. HEALTH_URL finds nothing until the checklist has
// an item for it.
const NEEDS = {
    publish: ['Redeploy the Apps Script'],
    counter: ['`STATS_TOKEN`'],
    form: ['`SPREADSHEET_ID`', 'Send one real message', 'HEALTH_URL'],
    statsSource: ['`STATS_SOURCE_URL`'],
    confirm: ['`meta.confirmedOn`']
};

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const isoDay = (date) => date.toISOString().slice(0, 10);
const dayMs = (day) => Date.parse(`${day}T00:00:00Z`);
const daysBetween = (from, to) => Math.floor((dayMs(to) - dayMs(from)) / DAY_MS);
const addDays = (day, n) => isoDay(new Date(dayMs(day) + n * DAY_MS));
function addMonths(day, n) {
    const [y, m, d] = day.split('-').map(Number);
    return isoDay(new Date(Date.UTC(y, m - 1 + n, d)));
}
const short = (sha) => String(sha || '').slice(0, 7);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const blank = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
const dig = (obj, field) => field.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '');
const why = (err) => (err && err.cause && err.cause.code) || (err && err.name === 'TimeoutError' ? 'no answer in time' : (err && (err.code || err.name)) || 'error');

function result(id, title, status, summary, extra = {}) {
    return { id, title, status, summary, details: extra.details || [], items: extra.items || [] };
}

/**
 * The version Code.gs should declare: the first 12 hex digits of the SHA-256
 * of the file with CODE_VERSION's quotes left empty (and line endings as
 * LF, so a checkout that converts them changes nothing).
 */
function codeVersion(source) {
    const blanked = String(source).replace(/\r\n/g, '\n').replace(/\bvar CODE_VERSION = '[0-9a-f]*';/, "var CODE_VERSION = '';");
    return sha256(blanked).slice(0, 12);
}
const declaredVersion = (source) => (String(source).match(/\bvar CODE_VERSION = '([0-9a-f]*)';/) || [])[1];

// ------------------------------------------------------------------
// docs/owner-checklist.md, read as data
// ------------------------------------------------------------------

/**
 * Every item ("- [ ] **C1. Title.**", ticked or not) with its section and
 * the text of its "*Where:*" note, and every table row that maps a fact to
 * a field and an item (the at-a-glance table: | Seniority |
 * `atAGlance.seniority` | ... | F3 |).
 */
function parseChecklist(md) {
    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    const items = [];
    const facts = [];
    let section = '';
    let item = null;
    let note = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const heading = /^##\s+(.+?)\s*$/.exec(line);
        if (heading) { section = heading[1]; item = null; continue; }

        const start = /^- \[([ xX])\] \*\*([A-Z]\d+)\.\s*(.*)$/.exec(line);
        if (start) {
            let title = start[3];
            while (!title.includes('**') && i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) title += ` ${lines[++i].trim()}`;
            item = { id: start[2], done: start[1] !== ' ', title: title.split('**')[0].trim().replace(/\.$/, ''), section, where: '' };
            items.push(item);
            note = null;
            continue;
        }
        if (item) {
            const sub = /^ {2}- \*([^*]+):\*\s*(.*)$/.exec(line);
            if (sub) {
                note = sub[1].trim().toLowerCase();
                if (note === 'where') item.where = sub[2];
                continue;
            }
            if (note === 'where' && /^ {4,}\S/.test(line)) { item.where += ` ${line.trim()}`; continue; }
            if (/^\S/.test(line)) { item = null; note = null; }
        }

        const row = /^\|(.+)\|\s*$/.exec(line);
        if (row) {
            const cells = row[1].split('|').map(c => c.trim());
            const id = cells[cells.length - 1];
            const field = /`([^`]+)`/.exec(cells[1] || '');
            if (/^[A-Z]\d+$/.test(id) && field) facts.push({ label: cells[0], field: field[1], item: id });
        }
    }
    return { items, facts };
}

/**
 * The ids of the items each needle names: the items whose title says it,
 * or, where no title does, the items whose "Where" note does (a field such
 * as `meta.confirmedOn` is named where its answer goes, not in a title).
 * Titles first, because a note can mention another item's subject in
 * passing: S1's says what would have to change with `STATS_SOURCE_URL`.
 */
function itemsFor(checklist, needles) {
    const ids = new Set();
    needles.forEach((n) => {
        const titled = checklist.items.filter(i => i.title.includes(n));
        (titled.length ? titled : checklist.items.filter(i => i.where.includes(n))).forEach(i => ids.add(i.id));
    });
    return checklist.items.map(i => i.id).filter(id => ids.has(id));
}

// ------------------------------------------------------------------
// Asking a server
// ------------------------------------------------------------------

async function request(ctx, url, method = 'GET', extra = {}) {
    return ctx.fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...extra,
        headers: { 'user-agent': UA, ...(extra.headers || {}) }
    });
}

/** A GET whose answer is read as text, and as JSON where it is JSON. */
async function ask(ctx, url) {
    const res = await request(ctx, url);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* a page, not JSON */ }
    return { status: res.status, text, json };
}

/**
 * What a deployment's answer says about the script behind it. Code.gs has
 * answered GET three ways in its life: a page that names the spreadsheet
 * (the 2025 versions, "Form Response Capture API"), one line of JSON,
 * {"status":"ok",...}, for any GET (from August 2026), and since the visit
 * counter, "refused" to ?action=stats without its token. Since the health
 * check, ?action=health answers with the file's version.
 */
function readAnswer(a) {
    if (a.status === 404) return 'gone';
    if (a.status >= 400) return 'error';
    if (a.json && typeof a.json.version === 'string') return 'versioned';
    if (a.json && a.json.status === 'refused') return 'refused';
    if (a.json && a.json.status === 'ok') return 'plain';
    if (/accounts\.google\.com|ServiceLogin|<title>[^<]*sign in/i.test(a.text)) return 'signin';
    if (/Form Response Capture API/i.test(a.text)) return 'old';
    return 'unknown';
}

const BAD_ANSWERS = {
    gone: 'answers 404: the deployment has been deleted, or the address in script.js is not its address. Every message fails',
    error: 'answers with an error instead of the script\'s reply. Every message may fail; the Apps Script\'s Executions log says why',
    signin: 'asks for a Google sign-in: the web app is not deployed with access "Anyone", so every message fails',
    old: 'runs an old version of the script (its page says "Form Response Capture API" and names the spreadsheet), which may record any POST as a contact message and email it: with the visit counter on every page, that is a row and an email per page view. Publish the current Code.gs at once',
    unknown: 'answers with something other than the script\'s JSON'
};

// ------------------------------------------------------------------
// The live site is main
// ------------------------------------------------------------------

/** The pages sitemap.xml lists, each with the file in the repository it is served from. */
function sitemapPages(xml, site) {
    return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1])
        .filter(loc => loc.startsWith(site))
        .map((loc) => {
            const rel = loc.slice(site.length);
            return { loc, file: rel === '' || rel.endsWith('/') ? `${rel}index.html` : rel };
        });
}

async function checkLive(ctx) {
    const title = 'The live site is main';
    const site = JSON.parse(ctx.read('content/profile.json')).links.site;
    const sitemap = ctx.mainFile('sitemap.xml');
    const pages = sitemap ? sitemapPages(sitemap.toString('utf8'), site) : [];
    if (!pages.length) return result('live', title, 'fail', `main's sitemap.xml lists no page under ${site}.`);

    const now = ctx.now.getTime();
    const wrong = [];
    const pending = [];
    const unreachable = [];
    let ok = 0;
    for (const [n, page] of pages.entries()) {
        if (n) await ctx.sleep(HOST_GAP_MS);
        let res;
        try {
            res = await request(ctx, page.loc);
        } catch (err) {
            unreachable.push({ error: why(err), line: `${page.file} did not answer: ${why(err)}` });
            continue;
        }
        const versions = ctx.history(page.file);
        if (res.status !== 200) {
            // A page main added in the last hour is not there until Pages rebuilds.
            if (versions.length && now - versions[0].time < PAGES_GRACE_MS) pending.push(`${page.file}: main changed it ${Math.max(1, Math.round((now - versions[0].time) / 60e3))} min ago (${short(versions[0].sha)}), and Pages answers ${res.status} for now`);
            else wrong.push(`${page.file} answers ${res.status}`);
            continue;
        }
        const live = sha256(Buffer.from(await res.arrayBuffer()));
        if (versions.length && versions[0].hash === live) { ok++; continue; }
        if (!versions.length) { wrong.push(`${page.file} is in the sitemap but not on main`); continue; }

        const served = versions.findIndex(v => v.hash === live);
        const changed = versions[0];
        const was = served > 0 ? `main's copy as of ${short(versions[served].sha)} (${isoDay(new Date(versions[served].time))})` : null;
        if (now - changed.time < PAGES_GRACE_MS) {
            pending.push(`${page.file}: main changed it ${Math.max(1, Math.round((now - changed.time) / 60e3))} min ago (${short(changed.sha)}), and Pages still serves ${was || 'an older copy'}`);
        } else if (was) {
            wrong.push(`${page.file} is ${was}; main changed it on ${isoDay(new Date(changed.time))} (${short(changed.sha)}), and Pages has not published that`);
        } else {
            wrong.push(`${page.file} serves bytes none of main's last ${plural(versions.length, 'version')} of it holds`);
        }
    }

    const silent = unreachable.map(u => u.line);
    if (wrong.length) {
        return result('live', title, 'fail', `${plural(wrong.length, 'page')} of ${pages.length} in sitemap.xml ${wrong.length === 1 ? 'is' : 'are'} not what main holds. Settings → Pages, and the Actions tab's "pages build and deployment" runs, say why.`,
            { details: wrong.concat(pending, silent) });
    }
    if (unreachable.length === pages.length) {
        return result('live', title, 'not-checkable', `Could not reach ${hostOf(site)} from here (${unreachable[0].error}).`);
    }
    if (pending.length || unreachable.length) {
        return result('live', title, 'not-checkable', `${pending.length ? 'Pages has not finished publishing main\'s latest push' : 'Some pages did not answer'}; ${ok} of ${pages.length} pages are main's. The next run checks again.`,
            { details: pending.concat(silent) });
    }
    return result('live', title, 'pass', `All ${pages.length} pages in sitemap.xml answer 200 with the bytes main holds (main at ${short(ctx.mainSha)}).`);
}

// ------------------------------------------------------------------
// Links off the site
// ------------------------------------------------------------------

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#0*39;|&apos;/g, "'").replace(/&quot;/g, '"');

/**
 * Every off-site http(s) link, without its #fragment, mapped to where it
 * is: the href of each page (the sitemap's and every .html at the root),
 * and every value in content/*.json that is a whole URL.
 */
function offsiteLinks(ctx, site) {
    const found = new Map();
    const add = (raw, where) => {
        let url;
        try { url = new URL(raw); } catch (e) { return; }
        if (!/^https?:$/.test(url.protocol) || raw.startsWith(site)) return;
        url.hash = '';
        if (!found.has(url.href)) found.set(url.href, new Set());
        found.get(url.href).add(where);
    };
    const sitemap = ctx.read('sitemap.xml');
    const files = new Set(sitemapPages(sitemap, site).map(p => p.file).concat(ctx.list('.').filter(f => f.endsWith('.html'))));
    [...files].sort().forEach((file) => {
        let html;
        try { html = ctx.read(file); } catch (e) { return; }
        for (const m of html.matchAll(/\shref\s*=\s*(["'])(.*?)\1/gi)) add(decode(m[2]), file);
    });
    ctx.list('content').filter(f => f.endsWith('.json')).sort().forEach((f) => {
        const walk = (v) => {
            if (typeof v === 'string') { if (/^https?:\/\/\S+$/.test(v)) add(v, `content/${f}`); } else if (Array.isArray(v)) v.forEach(walk);
            else if (v && typeof v === 'object') Object.values(v).forEach(walk);
        };
        walk(JSON.parse(ctx.read(`content/${f}`)));
    });
    return found;
}

const refuser = (host) => Object.keys(REFUSERS).find(k => host === k || host.endsWith(`.${k}`));

/**
 * One link: HEAD first, then GET if HEAD is refused or fails (some hosts
 * answer 403 or 405 to HEAD), and one more GET after a pause before a host
 * that does not answer, or answers with a server error, is called broken:
 * a server has bad minutes, and the issue should not say so for a week.
 * The body is never read.
 */
async function probe(ctx, url) {
    const attempt = async (method) => {
        try {
            const res = await request(ctx, url, method);
            if (res.body && typeof res.body.cancel === 'function') res.body.cancel().catch(() => {});
            return { status: res.status };
        } catch (err) {
            return { error: why(err) };
        }
    };
    const head = await attempt('HEAD');
    if (head.status < 400) return head;
    let get = await attempt('GET');
    if (get.error || get.status >= 500) {
        await ctx.sleep(2000);
        get = await attempt('GET');
    }
    return get;
}

async function checkLinks(ctx) {
    const title = 'Links off the site';
    const site = JSON.parse(ctx.read('content/profile.json')).links.site;
    const links = offsiteLinks(ctx, site);
    if (!links.size) return [result('links', title, 'pass', 'The site links to nothing off it.')];

    const urls = [...links.keys()].sort((a, b) => hostOf(a).localeCompare(hostOf(b)) || a.localeCompare(b));
    const broken = [];
    const unchecked = [];
    const unreachable = [];
    let lastHost = null;
    for (const url of urls) {
        const host = hostOf(url);
        if (host === lastHost) await ctx.sleep(HOST_GAP_MS);
        lastHost = host;
        const where = `(${[...links.get(url)].join(', ')})`;
        const r = await probe(ctx, url);
        const known = refuser(host);
        if (r.error) unreachable.push({ error: r.error, line: `${url} did not answer: ${r.error} ${where}` });
        else if (r.status < 400) continue;
        else if (r.status === 999 || (known && [401, 403, 429].includes(r.status))) {
            unchecked.push(`${url}: ${host} answered ${r.status}${known ? `, and ${REFUSERS[known]}` : ', a refusal of automated requests'} ${where}`);
        } else if (r.status === 429) {
            unchecked.push(`${url}: ${host} answered 429, too many requests; try it by hand ${where}`);
        } else {
            broken.push(`${url} answers ${r.status} ${where}${r.status === 403 ? `. If ${host} refuses automated requests, add it to REFUSERS in scripts/health.js` : ''}`);
        }
    }

    // Not one host answering is this machine's network, not the links.
    if (unreachable.length === urls.length) {
        return [result('links', title, 'not-checkable', `None of the ${urls.length} links off the site could be reached from here (${unreachable[0].error}).`)];
    }
    const out = [];
    const bad = broken.concat(unreachable.map(u => u.line));
    out.push(bad.length
        ? result('links', title, 'fail', `${plural(bad.length, 'link')} of ${urls.length} off the site ${bad.length === 1 ? 'is' : 'are'} broken.`, { details: bad })
        : result('links', title, 'pass', `All ${urls.length - unchecked.length} links off the site that can be checked from here answer.`));
    if (unchecked.length) {
        out.push(result('links-unchecked', 'Links only a browser can check', 'not-checkable',
            `${plural(unchecked.length, 'link')} ${unchecked.length === 1 ? 'goes' : 'go'} to a host that refuses automated requests. Open ${unchecked.length === 1 ? 'it' : 'them'} by hand.`, { details: unchecked }));
    }
    return out;
}

// ------------------------------------------------------------------
// What goes stale
// ------------------------------------------------------------------

function checkProfile(ctx) {
    const meta = JSON.parse(ctx.read('content/profile.json')).meta || {};
    const today = isoDay(ctx.now);
    const items = itemsFor(ctx.checklist, NEEDS.confirm);
    const out = [];

    const age = daysBetween(meta.verifiedOn, today);
    out.push(age > STALE_DAYS
        ? result('profile-verified', 'The profile, re-verified', 'waiting',
            `content/profile.json is logged as of ${meta.verifiedOn}, ${age} days ago, more than a quarter: re-verify its facts and set meta.verifiedOn (a quarterly review item).`, { items })
        : result('profile-verified', 'The profile, re-verified', 'pass',
            `content/profile.json is logged as of ${meta.verifiedOn} (${plural(age, 'day')} ago); a re-verification falls due on ${addDays(meta.verifiedOn, STALE_DAYS + 1)}.`));

    if (!meta.confirmedOn) {
        out.push(result('profile-confirmed', 'The profile, confirmed by Moses', 'waiting',
            'meta.confirmedOn is null: only Moses can say the profile\'s facts still hold, the role marked "Present" among them, and he has not said so yet.', { items }));
    } else {
        const since = daysBetween(meta.confirmedOn, today);
        out.push(since > STALE_DAYS
            ? result('profile-confirmed', 'The profile, confirmed by Moses', 'waiting', `Moses last confirmed the facts on ${meta.confirmedOn}, ${since} days ago, more than a quarter.`, { items })
            : result('profile-confirmed', 'The profile, confirmed by Moses', 'pass', `Moses confirmed the facts on ${meta.confirmedOn}.`));
    }
    return out;
}

/** The fields the checklist's at-a-glance table names, and availableFrom's date. */
function checkAtAGlance(ctx) {
    const title = 'The at-a-glance facts';
    const profile = JSON.parse(ctx.read('content/profile.json'));
    const missing = ctx.checklist.facts.filter(f => blank(dig(profile, f.field)));
    const problems = [];
    const items = [];
    if (missing.length) {
        // The table's names, up to their first comma or bracket.
        const names = missing.map((f, i) => f.label.split(/,|\s\(/)[0].trim().replace(/^./, c => (i ? c.toLowerCase() : c)));
        problems.push(`${list(names)} ${missing.length === 1 ? 'is' : 'are'} not stated in content/profile.json, so the homepage's at-a-glance strip leaves ${missing.length === 1 ? 'it' : 'them'} out`);
        missing.forEach(f => items.push(f.item));
    }
    const from = profile.atAGlance && profile.atAGlance.availableFrom;
    const today = isoDay(ctx.now);
    if (typeof from === 'string' && from !== 'now' && (/^\d{4}-\d{2}$/.test(from) ? from < today.slice(0, 7) : from < today)) {
        problems.push(`atAGlance.availableFrom says ${from}, which has passed: set a new date, or "now"`);
        ctx.checklist.facts.filter(f => f.field === 'atAGlance.availableFrom').forEach(f => items.push(f.item));
    }
    return problems.length
        ? result('at-a-glance', title, 'waiting', `${problems.join('; ')}.`, { items: [...new Set(items)] })
        : result('at-a-glance', title, 'pass', `Every fact the strip can show is stated${from && from !== 'now' ? `, and the available-from date (${from}) is still to come` : ''}.`);
}

function checkAiData(ctx) {
    const title = 'The AI factor set';
    const reviewed = (ctx.read('ai-carbon-data.js').match(/\bconst REVIEWED_ON = '(\d{4}-\d{2}-\d{2})'/) || [])[1];
    if (!reviewed) return result('ai-data', title, 'fail', 'ai-carbon-data.js has no REVIEWED_ON date, so the EcoPrompt Coach cannot say how fresh its figures are.');
    const due = addMonths(reviewed, 3);
    return isoDay(ctx.now) > due
        ? result('ai-data', title, 'waiting', `ai-carbon-data.js was last reviewed against its sources on ${reviewed}, more than a quarter ago: refresh the models and REVIEWED_ON (a quarterly review item).`)
        : result('ai-data', title, 'pass', `ai-carbon-data.js was reviewed against its sources on ${reviewed}; the next review falls due on ${due}.`);
}

function checkCv(ctx) {
    const title = 'The CV';
    const cv = ctx.cv();
    if (!cv.fresh) {
        return result('cv', title, 'fail', 'content/ or the homepage has changed since the CV was printed (assets/cv.hash): run npm run cv, and commit the PDF with assets/cv.hash.');
    }
    if (!cv.pdfFresh) return result('cv', title, 'fail', 'The committed PDF is not the one npm run cv printed (assets/cv.hash): run npm run cv again.');
    return result('cv', title, 'pass', `Printed${cv.printed ? ` on ${cv.printed}` : ''} from content/ and the homepage as they are now.`);
}

// ------------------------------------------------------------------
// The switches only Moses can throw
// ------------------------------------------------------------------

async function checkDeployment(ctx) {
    const title = 'The contact form\'s deployment';
    const url = (ctx.read('script.js').match(/\bconst GOOGLE_APPS_SCRIPT_URL = '([^']+)'/) || [])[1];
    if (!url) return result('deployment', title, 'fail', 'script.js names no Apps Script deployment (GOOGLE_APPS_SCRIPT_URL), so the contact form posts nowhere.');
    const want = declaredVersion(ctx.read('google-apps-script/Code.gs'));
    const host = new URL(url).host;
    const publish = itemsFor(ctx.checklist, NEEDS.publish);

    let health;
    let stats;
    try {
        health = await ask(ctx, `${url}?action=health`);
        if (readAnswer(health) === 'plain') stats = await ask(ctx, `${url}?action=stats`);
    } catch (err) {
        return result('deployment', title, 'not-checkable', `Could not reach ${host} from here (${why(err)}).`);
    }

    const said = readAnswer(health);
    if (said === 'versioned') {
        return health.json.version === want
            ? result('deployment', title, 'pass', `The deployment script.js posts to runs the repository's Code.gs (version ${want}).`)
            : result('deployment', title, 'waiting', `The deployment runs Code.gs version ${health.json.version || '(none)'}, not the repository's ${want}: publish the current file as a new version of the existing deployment.`, { items: publish });
    }
    if (said === 'plain') {
        const counter = readAnswer(stats);
        if (counter === 'refused') {
            return result('deployment', title, 'waiting', 'The deployment runs a Code.gs with the visit counter but without the health check, so not the current one: publish the current file as a new version of the existing deployment.', { items: publish });
        }
        if (counter === 'plain') {
            return result('deployment', title, 'waiting', 'The deployment runs a Code.gs from before the visit counter: nothing the site counts is kept, and ?action=stats answers with the plain health check. Publish the current file as a new version of the existing deployment.',
                { items: publish.concat(itemsFor(ctx.checklist, NEEDS.counter)) });
        }
        return result('deployment', title, 'fail', `?action=stats ${BAD_ANSWERS[counter] || BAD_ANSWERS.unknown}.`, { items: publish });
    }
    return result('deployment', title, 'fail', `The deployment ${BAD_ANSWERS[said] || BAD_ANSWERS.unknown}.`, { items: publish });
}

async function checkContact(ctx) {
    const title = 'The contact form, end to end';
    const items = itemsFor(ctx.checklist, NEEDS.form);
    const raw = String(ctx.env.HEALTH_URL || '').trim();
    if (!raw) {
        return result('contact', title, 'waiting', 'Nothing has shown that the live form records a message. Once the current Code.gs is published, give it a HEALTH_TOKEN, and the repository the secret HEALTH_URL (README, "Health checks and the quarterly review"): this check then sends one each week down the form\'s own path, to a Health tab, emailing nobody.', { items });
    }
    let url;
    try { url = new URL(raw); } catch (e) { return result('contact', title, 'fail', 'HEALTH_URL is not a valid URL.', { items }); }
    const host = url.host;   // the URL carries the token: only the host is ever printed

    // Ask first whether the deployment has the health check at all: an older
    // script would take the test for a real message, record it and email it.
    const version = new URL(url.href);
    version.searchParams.delete('token');
    version.searchParams.set('action', 'health');
    let reply;
    try {
        const a = await ask(ctx, version.href);
        if (readAnswer(a) !== 'versioned') {
            return result('contact', title, 'waiting', `The deployment at ${host} has no health check yet, so nothing was sent: publish the current Code.gs.`,
                { items: itemsFor(ctx.checklist, NEEDS.publish) });
        }
        const post = new URL(url.href);
        post.searchParams.set('action', 'health');
        const res = await request(ctx, post.href, 'POST', {
            headers: { 'content-type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ ...HEALTH_MESSAGE, email: healthSender(ctx.runTag || ctx.now.getTime().toString(36)) })
        });
        const text = await res.text();
        try { reply = JSON.parse(text); } catch (e) { reply = null; }
        if (!reply || typeof reply.status !== 'string') {
            return result('contact', title, 'fail', `${host} answered the test message with ${res.status} and no reply from the script.`, { items });
        }
    } catch (err) {
        return result('contact', title, 'not-checkable', `Could not reach ${host} from here (${why(err)}).`);
    }

    if (reply.status === 'refused') {
        return result('contact', title, 'fail', 'The deployment refused the test message: the token in HEALTH_URL is not the script\'s HEALTH_TOKEN, or HEALTH_TOKEN is unset.', { items });
    }
    if (reply.status !== 'success') {
        // Code.gs answers with fixed sentences only, never an error's text,
        // so the reply can be quoted.
        return result('contact', title, 'fail', `The form's own path did not record the test message: "${String(reply.message || reply.status).slice(0, 200)}". The Apps Script's Executions log says why.`, { items });
    }
    const problems = [];
    if (reply.ownerEmail !== true) problems.push('OWNER_EMAIL is not set, so a real message is recorded and nobody is told of it');
    if (reply.turnstile === true) problems.push('TURNSTILE_SECRET is set, and the site loads no Turnstile widget, so every real message is refused');
    if (problems.length) {
        return result('contact', title, 'fail', `The test message was recorded, but ${problems.join('; and ')}. Change it in the Apps Script's Script Properties.`, { items });
    }
    return result('contact', title, 'pass', 'A test message went down the form\'s own path and was recorded on the Health tab; OWNER_EMAIL is set, and nobody was emailed.');
}

function checkStatsSource(ctx) {
    const title = 'The open counts\' source';
    const flag = String(ctx.env.STATS_SOURCE_SET || '').trim();
    if (!flag) {
        return result('stats-source', title, 'not-checkable', 'Only the workflow can see the repository\'s secrets; it tells this check whether STATS_SOURCE_URL is set, never what it is.');
    }
    return flag === 'true'
        ? result('stats-source', title, 'pass', 'STATS_SOURCE_URL is set.')
        : result('stats-source', title, 'waiting', 'STATS_SOURCE_URL is not set, so the weekly open-counts run fetches nothing and commits nothing, and stays green.',
            { items: itemsFor(ctx.checklist, NEEDS.statsSource) });
}

function checkStatsData(ctx) {
    const title = 'The open counts';
    const stats = JSON.parse(ctx.read('content/stats.json'));
    if (stats.status !== 'collecting') {
        return result('stats-data', title, 'waiting', 'content/stats.json holds no week yet, so stats.html says counting has not started. The first figures follow the first full Monday-to-Sunday week of counting.',
            { items: itemsFor(ctx.checklist, NEEDS.counter.concat(NEEDS.statsSource)) });
    }
    const age = daysBetween(stats.asOf, isoDay(ctx.now));
    if (age > STATS_LATE_DAYS) {
        return result('stats-data', title, 'fail', `content/stats.json was last written on ${stats.asOf}, ${age} days ago, and the weekly run writes it every Monday: its last runs, in the Actions tab under "Open counts", say why.`);
    }
    return result('stats-data', title, 'pass', `${plural(stats.weeks.length, 'whole week')} published, the last ending ${stats.week.end}; written ${stats.asOf}.`);
}

// ------------------------------------------------------------------
// npm audit
// ------------------------------------------------------------------

function checkAudit(ctx) {
    const title = 'npm audit';
    const pkg = JSON.parse(ctx.read('package.json'));
    const dev = Object.keys(pkg.devDependencies || {}).length;
    const run = Object.keys(pkg.dependencies || {}).length;
    const scope = run
        ? `${plural(run, 'runtime dependency', 'runtime dependencies')} and ${dev} dev`
        : `all ${dev} dependencies are dev dependencies (building and testing): none of them ships to a visitor`;
    const out = ctx.audit();
    let report = null;
    try { report = JSON.parse(out.stdout); } catch (e) { /* no report */ }
    if (!report || report.error || !report.metadata) {
        return result('audit', title, 'not-checkable', `npm audit gave no report from here (it asks the npm registry)${report && report.error && report.error.code ? `: ${report.error.code}` : ''}; ${scope}.`);
    }
    const v = report.metadata.vulnerabilities || {};
    const serious = Object.entries(report.vulnerabilities || {}).filter(([, x]) => ['high', 'critical'].includes(x.severity));
    if (serious.length) {
        return result('audit', title, 'fail', `${plural(serious.length, 'package')} with a high or critical advisory; ${scope}. npm audit says which fix applies.`,
            { details: serious.map(([name, x]) => `${name}: ${x.severity}${x.fixAvailable ? ', a fix is available' : ''}`) });
    }
    return result('audit', title, 'pass', `No high or critical advisory (${v.moderate || 0} moderate, ${v.low || 0} low); ${scope}.`);
}

// ------------------------------------------------------------------
// All of it
// ------------------------------------------------------------------

const CHECKS = [checkLive, checkLinks, checkProfile, checkAtAGlance, checkAiData, checkCv,
    checkDeployment, checkContact, checkStatsSource, checkStatsData, checkAudit];

/** Every check's results, in CHECKS order. A check that throws is reported as broken, not lost. */
async function runChecks(ctx) {
    const out = [];
    for (const check of CHECKS) {
        try {
            const r = await check(ctx);
            out.push(...[].concat(r));
        } catch (err) {
            out.push(result(check.name, check.name.replace(/^check/, ''), 'fail', `The check itself failed: ${err && err.message ? err.message : err}.`));
        }
    }
    return out;
}

const needsIssue = (results) => results.some(r => r.status === 'fail' || r.status === 'waiting');

function render(results, { checklist, now, sha, repo, runUrl }) {
    const count = (s) => results.filter(r => r.status === s).length;
    const blob = (file) => (repo ? `[${file}](https://github.com/${repo}/blob/main/${file})` : file);
    const out = [
        MARKER,
        `Checked ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC against main at \`${short(sha)}\`${runUrl ? ` ([this run](${runUrl}))` : ''}.`,
        '',
        `**${count('fail')} broken · ${count('waiting')} waiting on Moses · ${count('not-checkable')} not checkable from here · ${count('pass')} passing.** ` +
        'Broken is for fixing; waiting is a switch only Moses can throw, or a review that has fallen due. ' +
        'This issue stays open while anything is either, and closes itself once nothing is.'
    ];
    STATUSES.forEach((status) => {
        const these = results.filter(r => r.status === status);
        if (!these.length) return;
        out.push('', `### ${HEADINGS[status]}`, '');
        these.forEach((r) => {
            const ids = checklist.items.map(i => i.id).filter(id => r.items.includes(id));
            const refs = ids.length ? ` Owner checklist: ${ids.join(', ')}.` : '';
            out.push(`- **${r.title}.** ${r.summary}${refs}`);
            r.details.forEach(d => out.push(`  - ${d}`));
        });
    });

    const open = checklist.items.filter(i => !i.done);
    const cited = new Set(results.flatMap(r => r.items));
    const first = open.filter(i => cited.has(i.id));
    const rest = open.filter(i => !cited.has(i.id));
    out.push('', '### Open owner items', '',
        `${open.length} of ${checklist.items.length} items in ${blob('docs/owner-checklist.md')} are open.`);
    if (first.length) {
        out.push('', 'The checks above wait on these:', '');
        first.forEach(i => out.push(`- **${i.id}.** ${i.title}`));
    }
    if (rest.length) {
        const sections = [...new Set(rest.map(i => i.section))];
        out.push('', first.length ? 'And the rest, by section:' : 'By section:', '');
        sections.forEach(s => out.push(`- ${s}: ${rest.filter(i => i.section === s).map(i => i.id).join(', ')}`));
    }
    out.push('', `_Written by ${blob('scripts/health.js')} each Tuesday (${blob('.github/workflows/health.yml')}), and edited in place._`);
    // Which checks were broken, for the next run to compare (syncIssue).
    out.push('', `<!-- health:broken=${brokenIds(results).join(',')} -->`);
    return `${out.join('\n')}\n`;
}

const brokenIds = (results) => results.filter(r => r.status === 'fail').map(r => r.id);
const brokenBefore = (body) => {
    const m = /<!-- health:broken=([\w,-]*) -->/.exec(body || '');
    return m ? m[1].split(',').filter(Boolean) : [];
};

/**
 * Keeps one open issue: opened while anything fails or waits, edited in
 * place on later runs, and closed with a comment once nothing does. It is
 * found by the marker on its first line, among the issues labelled health,
 * and among the bot's own if the label was ever taken off.
 *
 * GitHub tells nobody when an issue is edited, and this one can stay open
 * for months while a switch waits on Moses. So a run that finds a check
 * broken that was not broken last week (or fixed one that was) says so in
 * a comment that names the repository's owner, who is then notified; a
 * week like the one before edits the issue quietly.
 */
async function syncIssue(gh, { results, body, now }) {
    await gh.ensureLabel(LABEL.name, LABEL.color, LABEL.description);
    const mine = (i) => typeof i.body === 'string' && i.body.startsWith(MARKER);
    let open = (await gh.listIssues({ state: 'open', labels: LABEL.name })).find(mine);
    if (!open) open = (await gh.listIssues({ state: 'open', creator: 'github-actions[bot]' })).find(mine);

    if (needsIssue(results)) {
        if (open) {
            const before = brokenBefore(open.body);
            const now = brokenIds(results);
            const titled = (ids) => ids.map(id => (results.find(r => r.id === id) || { title: id }).title).join('; ');
            const newly = now.filter(id => !before.includes(id));
            const fixed = before.filter(id => !now.includes(id));
            await gh.updateIssue(open.number, { title: TITLE, body });
            if (newly.length || fixed.length) {
                const lines = [];
                if (newly.length) lines.push(`@${gh.repo.split('/')[0]} newly broken this week: ${titled(newly)}.`);
                if (fixed.length) lines.push(`No longer broken: ${titled(fixed)}.`);
                lines.push('', 'The issue above has the details.');
                await gh.comment(open.number, lines.join('\n'));
            }
            return { action: newly.length || fixed.length ? 'updated and commented' : 'updated', number: open.number };
        }
        const made = await gh.createIssue({ title: TITLE, body, labels: [LABEL.name] });
        return { action: 'opened', number: made.number };
    }
    if (!open) return { action: 'none' };
    await gh.updateIssue(open.number, { body });
    await gh.comment(open.number, `Nothing is broken or waiting as of ${isoDay(now)}, so this closes. The next run that finds something opens a new issue.`);
    await gh.updateIssue(open.number, { state: 'closed', state_reason: 'completed' });
    return { action: 'closed', number: open.number };
}

// GitHub turns off a public repository's scheduled workflows after 60 days
// without activity in it, and says so to nobody; this repository's
// commits come in waves, and the open counts commit only once counting is
// on. So each week this run enables its own schedule and the other two
// again, through the API, which counts as activity (it is how the
// keepalive-workflow action keeps schedules running, without dummy
// commits). It needs the workflow's `actions: write`; without it, or if
// GitHub refuses, the run says so and carries on.
const SCHEDULED = ['health.yml', 'review.yml', 'stats.yml'];
async function keepAlive(gh, files = SCHEDULED) {
    const refused = [];
    for (const file of files) {
        try { await gh.enableWorkflow(file); } catch (err) { refused.push(`${file} (${err.status || why(err)})`); }
    }
    if (refused.length) console.log(`::warning title=Site health::Could not keep these schedules alive: ${refused.join(', ')}. GitHub turns a schedule off after 60 days without activity in the repository.`);
    return refused;
}

// ------------------------------------------------------------------
// The real world: files, git, the network, npm
// ------------------------------------------------------------------

function defaultContext(env = process.env, root = ROOT) {
    const git = (args) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
    // origin/main in a checkout that has it (the workflow's), else main.
    let ref;
    const main = () => {
        if (!ref) {
            ref = ['origin/main', 'main', 'HEAD'].find((r) => {
                try { git(['rev-parse', '--verify', '--quiet', `${r}^{commit}`]); return true; } catch (e) { return false; }
            });
            if (!ref) throw new Error('no git history here to compare the live site with');
        }
        return ref;
    };
    const histories = new Map();
    const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
    return {
        now: new Date(),
        env,
        fetch: globalThis.fetch,
        sleep: (ms) => new Promise(r => setTimeout(r, ms)),
        read,
        list: (dir) => fs.readdirSync(path.join(root, dir)),
        checklist: parseChecklist(read('docs/owner-checklist.md')),
        get mainSha() { return git(['rev-parse', main()]).toString().trim(); },
        mainFile(rel) {
            try { return git(['show', `${main()}:${rel}`]); } catch (e) { return null; }
        },
        /** main's versions of a file, newest first: when main got each, and its hash. */
        history(rel) {
            if (!histories.has(rel)) {
                let versions = [];
                try {
                    versions = git(['log', '--first-parent', '--format=%H %ct', '-n', String(HISTORY_DEPTH), main(), '--', rel])
                        .toString().trim().split('\n').filter(Boolean).map((line) => {
                            const [sha, ct] = line.split(' ');
                            let hash = null;
                            try { hash = sha256(git(['show', `${sha}:${rel}`])); } catch (e) { /* deleted there */ }
                            return { sha, time: Number(ct) * 1000, hash };
                        });
                } catch (e) { /* not in this history */ }
                histories.set(rel, versions);
            }
            return histories.get(rel);
        },
        audit: () => spawnSync('npm', ['audit', '--json'], { cwd: root, encoding: 'utf8', timeout: 120000 }),
        cv() {
            const content = require('./lib/content.js');
            const build = require('./build-cv.js');
            const data = content.loadAll();
            const hash = build.readHashFile();
            const pdf = fs.readFileSync(path.join(root, data.profile.links.cv));
            const date = pdf.toString('latin1').match(/\/CreationDate \(D:(\d{4})(\d{2})(\d{2})/);
            return {
                fresh: hash.source === build.sourceHash(build.cvModel(data, read('index.html'))),
                pdfFresh: hash.pdf === build.fileHash(pdf),
                printed: date ? `${date[1]}-${date[2]}-${date[3]}` : null
            };
        }
    };
}

async function main(argv = process.argv.slice(2), env = process.env) {
    if (argv.includes('--code-version')) {
        console.log(codeVersion(fs.readFileSync(path.join(ROOT, 'google-apps-script', 'Code.gs'), 'utf8')));
        return;
    }
    const dry = argv.includes('--dry-run');
    if (!dry && !(env.GITHUB_TOKEN && env.GITHUB_REPOSITORY)) {
        console.error('  health: GITHUB_TOKEN and GITHUB_REPOSITORY are needed to keep the issue. Run with --dry-run to print the report instead.');
        process.exitCode = 1;
        return;
    }

    const ctx = defaultContext(env);
    const results = await runChecks(ctx);
    const runUrl = env.GITHUB_RUN_ID ? `${env.GITHUB_SERVER_URL || 'https://github.com'}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` : '';
    let sha = '';
    try { sha = ctx.mainSha; } catch (e) { /* no git here: the live check has said so */ }
    const body = render(results, { checklist: ctx.checklist, now: ctx.now, sha, repo: env.GITHUB_REPOSITORY, runUrl });
    if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, body);
    if (dry) {
        process.stdout.write(body);
        return;
    }

    const gh = github.client({ fetch: globalThis.fetch, token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY, api: env.GITHUB_API_URL || github.API });
    const done = await syncIssue(gh, { results, body, now: ctx.now });
    await keepAlive(gh);
    const broken = results.filter(r => r.status === 'fail').length;
    const waiting = results.filter(r => r.status === 'waiting').length;
    const where = done.number ? ` (#${done.number})` : '';
    console.log(`  health: ${broken} broken, ${waiting} waiting; issue ${done.action}${where}.`);
    // The job stays green when it has said what it found: the issue is the
    // signal, and a run that goes red every week while a switch waits on
    // Moses is one people learn to ignore. A broken check still leaves an
    // annotation on the run.
    if (broken) console.log(`::warning title=Site health::${plural(broken, 'check')} broken; see the issue${where}.`);
    else if (waiting) console.log(`::notice title=Site health::Nothing broken; ${waiting} waiting on Moses${where}.`);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err && err.stack ? err.stack : err);
        process.exitCode = 1;
    });
}

module.exports = {
    TITLE, LABEL, MARKER, REFUSERS, NEEDS, STATUSES, HEALTH_MESSAGE, STALE_DAYS, PAGES_GRACE_MS,
    codeVersion, declaredVersion, parseChecklist, itemsFor, sitemapPages, readAnswer,
    checkLive, checkLinks, checkProfile, checkAtAGlance, checkAiData, checkCv,
    checkDeployment, checkContact, checkStatsSource, checkStatsData, checkAudit,
    CHECKS, runChecks, needsIssue, render, syncIssue, brokenBefore, healthSender, SCHEDULED, keepAlive, defaultContext, main
};
