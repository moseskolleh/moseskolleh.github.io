// The Content-Security-Policy and the referrer policy every page carries.
//
// The Brief renders parts of a stranger's paste back into its page, so every
// page states, before any script or stylesheet, what may run and where it may
// talk to (scripts/build-content.js writes it, and says why each directive
// is what it is). A policy is only as good as its fit: an inline script
// whose hash is stale stops running, quietly, and an allowance too broad
// lets back in what the policy is for. So this holds each page's policy to
// the page, read here from the parsed page rather than by the build's own
// code: one meta, first in <head>; a hash for every inline script the page
// runs and for nothing else; nothing that lets an injected script run
// ('unsafe-inline', 'unsafe-eval', 'unsafe-hashes', a scheme, a wildcard);
// no on…="" attribute, which the policy would refuse to run; and off the
// site, exactly the Apps Script deployment and the host it redirects to,
// which is what tests/html.test.js lets the shipped scripts name.
//
// npm run smoke checks the same in a real browser: one policy before any
// script, an inline script injected into a page refused, and no violation
// (a console error) on any page as it is used.
//
// Run with: node tests/csp.test.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const { sitePages } = require('../scripts/check-budget.js');

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

const PAGES = sitePages();
const HAND = ['index.html', 'carbon-ai.html', 'field-report.html', '404.html'];
const GAS = (read('script.js').match(/const GOOGLE_APPS_SCRIPT_URL = '([^']+)'/) || [])[1] || '';
const REDIRECT = 'https://script.googleusercontent.com';
const SVG_NS = 'http://www.w3.org/2000/svg';

// "a b; c d" → { a: ['b'], c: ['d'] }
const parse = (policy) => Object.fromEntries(policy.split(';').map(d => d.trim()).filter(Boolean)
    .map((d) => { const [name, ...sources] = d.split(/\s+/); return [name.toLowerCase(), sources]; }));

// Whether a source list lets the page reach an https address: a host
// source matches scheme and host, and its path exactly, or as a prefix if
// it ends in "/"; the query plays no part (CSP Level 3, simplified to the
// sources a page here could carry: no wildcards, no ports).
function allows(list, href) {
    const url = new URL(href);
    return list.some((src) => {
        if (/^'|:$/.test(src)) return false;
        let s;
        try { s = new URL(src); } catch (e) { return false; }
        if (s.protocol !== url.protocol || s.host !== url.host) return false;
        const part = src.replace(/^https?:\/\/[^/]+/, '');
        if (!part) return true;   // a host alone: any path on it
        return part.endsWith('/') ? url.pathname.startsWith(part) : url.pathname === part;
    });
}

// A script element the browser would run: no src, and no type or a
// JavaScript one. JSON-LD and The Brief's application/json are data blocks:
// never run, so the policy has nothing to say about them.
const runs = (el) => !el.hasAttribute('src') && (!el.hasAttribute('type') || /^(text|application)\/(java|ecma)script$|^module$/i.test(el.getAttribute('type')));
const hashOf = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/** The page read as a browser reads it, and what the policy says of it. */
function inspect(rel, html = read(rel)) {
    const doc = new JSDOM(html).window.document;
    const metas = Array.from(doc.querySelectorAll('meta[http-equiv]')).filter(m => /^content-security-policy$/i.test(m.getAttribute('http-equiv')));
    const policy = metas[0] ? parse(metas[0].getAttribute('content')) : {};
    const scripts = Array.from(doc.querySelectorAll('script'));
    return { doc, metas, policy, scripts, inline: scripts.filter(runs), data: scripts.filter(s => !s.hasAttribute('src') && !runs(s)) };
}

// What a page's policy gets wrong about its own inline scripts.
function hashTrouble(r) {
    const want = new Set(r.inline.map(s => hashOf(s.textContent)));
    const have = new Set((r.policy['script-src'] || []).filter(s => s.startsWith("'sha256-")));
    return {
        missing: [...want].filter(h => !have.has(h)),
        extra: [...have].filter(h => !want.has(h))
    };
}

const offSite = (list) => (list || []).filter(s => /^https?:\/\//.test(s));
const policies = {};

PAGES.forEach((rel) => {
    const r = inspect(rel);
    const { doc, metas, policy } = r;
    policies[rel] = policy;

    // --- One policy, first in <head> --------------------------------------
    // A policy given in a meta holds only what comes after it, so it goes in
    // before anything it governs; and two would both apply, the stricter
    // winning, which nobody reading either would expect.
    assert(metas.length === 1, `${rel}: carries exactly one Content-Security-Policy meta (${metas.length})`);
    const meta = metas[0];
    const head = Array.from(doc.head.children);
    const firstGoverned = head.find(el => el.matches('script, style, link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], base'));
    assert(!!meta && meta.parentElement === doc.head && head[0].matches('meta[charset]') && head[1] === meta &&
        (!firstGoverned || head.indexOf(meta) < head.indexOf(firstGoverned)),
    `${rel}: the policy is in <head>, straight after the charset and before any script, stylesheet or other request`);
    const referrer = doc.querySelectorAll('meta[name="referrer"]');
    assert(referrer.length === 1 && referrer[0].getAttribute('content') === 'strict-origin-when-cross-origin' && head.indexOf(referrer[0]) === 2,
        `${rel}: one referrer policy, strict-origin-when-cross-origin, right after it (${Array.from(referrer).map(m => m.getAttribute('content')).join(', ') || 'none'})`);

    // --- What runs ---------------------------------------------------------
    const scriptSrc = policy['script-src'] || [];
    const { missing, extra } = hashTrouble(r);
    assert(scriptSrc[0] === "'self'" && missing.length === 0 && extra.length === 0 && scriptSrc.length === 1 + r.inline.length,
        `${rel}: script-src is 'self' and the hash of each of its ${r.inline.length} inline script(s), and nothing else (missing ${missing.length}, stale ${extra.length})`);
    const loose = (list) => (list || []).filter(s => /^'(unsafe-inline|unsafe-eval|unsafe-hashes|wasm-unsafe-eval|strict-dynamic)'$|^\*|^[a-z][\w+.-]*:$|^'nonce-/i.test(s));
    assert(loose(scriptSrc).length === 0 && loose(policy['default-src']).length === 0 && !policy['script-src-elem'] && !policy['script-src-attr'],
        `${rel}: no page lets an injected script run: no 'unsafe-inline', 'unsafe-eval' or 'unsafe-hashes', no scheme or wildcard (${loose(scriptSrc).concat(loose(policy['default-src'])).join(' ') || 'none'})`);
    if (r.data.length) {
        const hashed = r.data.filter(s => scriptSrc.includes(hashOf(s.textContent)));
        assert(hashed.length === 0, `${rel}: its ${r.data.length} data block(s) (${r.data.map(s => s.getAttribute('type')).join(', ')}) are never run, so carry no hash`);
    }
    // An on…="" attribute is inline script the policy will not run: the
    // html.js mark's fallback used to be one on each page script (onerror).
    const handlers = Array.from(doc.querySelectorAll('*')).flatMap(el => Array.from(el.attributes)
        .filter(a => /^on/i.test(a.name)).map(a => `<${el.localName} ${a.name}>`));
    const jsUrls = Array.from(doc.querySelectorAll('[href], [src], [action]'))
        .filter(el => /^\s*javascript:/i.test(el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('action')));
    assert(handlers.length === 0 && jsUrls.length === 0, `${rel}: no event-handler attribute and no javascript: address (${handlers.join(', ') || 'none'})`);

    // --- Everything else ---------------------------------------------------
    assert((policy['default-src'] || []).join(' ') === "'self'" && (policy['base-uri'] || []).join(' ') === "'none'" &&
        (policy['object-src'] || []).join(' ') === "'none'",
    `${rel}: everything else comes from this origin (default-src 'self'), and base-uri and object-src are 'none'`);
    // Style attributes and the two pages' <style> blocks stay, by choice
    // (build-content.js says why); a hash or a nonce here would switch
    // 'unsafe-inline' off and break every one of them.
    assert((policy['style-src'] || []).join(' ') === "'self' 'unsafe-inline'" && (policy['img-src'] || []).join(' ') === "'self' data:",
        `${rel}: styles from this origin and inline, images from this origin and data: (style-src, img-src)`);
    const ignored = ['frame-ancestors', 'report-uri', 'report-to', 'sandbox'].filter(d => policy[d]);
    assert(ignored.length === 0, `${rel}: nothing a meta policy ignores (and a browser warns of): ${ignored.join(', ') || 'none'}`);

    // --- Off the site --------------------------------------------------------
    const connect = policy['connect-src'] || [];
    assert(connect[0] === "'self'" && offSite(connect).join(' ') === `${GAS} ${REDIRECT}`,
        `${rel}: connect-src is this origin, the deployment and the host it redirects to, and nothing else`);
    const posts = Array.from(doc.querySelectorAll('form[action]')).filter(f => /^https?:/.test(f.getAttribute('action')));
    const formAction = policy['form-action'] || [];
    assert(formAction[0] === "'self'" && offSite(formAction).join(' ') === (posts.length ? `${GAS} ${REDIRECT}` : '') &&
        posts.every(f => allows(formAction, f.getAttribute('action'))),
    `${rel}: form-action is this origin${posts.length ? `, and the deployment its form posts to (${posts.length}) and the host that redirects to` : ' only: no form here posts off it'}`);
    const elsewhere = Object.entries(policy).filter(([d]) => !['connect-src', 'form-action'].includes(d)).flatMap(([d, list]) => offSite(list).map(s => `${d} ${s}`));
    assert(elsewhere.length === 0, `${rel}: no other directive names anywhere off the site (${elsewhere.join(', ') || 'none'})`);
});

// --- Across the site ---------------------------------------------------------
{
    const hosts = new Set(Object.values(policies).flatMap(p => Object.values(p).flatMap(offSite)).map(s => new URL(s).host));
    assert([...hosts].sort().join(' ') === 'script.google.com script.googleusercontent.com',
        `Site: the policies allow exactly two hosts off the site, the Apps Script deployment's and its redirect's (${[...hosts].join(', ')})`);
    assert(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(GAS) &&
        Object.values(policies).every(p => (p['connect-src'] || []).includes(GAS)),
    'Site: script.google.com only as the one deployment script.js names, not any Apps Script');
    const home = Object.values(policies).filter(p => offSite(p['form-action']).length);
    assert(home.length === 1 && policies['index.html'] && offSite(policies['index.html']['form-action']).length === 2,
        'Site: only the homepage, whose contact form posts without JavaScript, lets a form post off the site');
}

// --- The policy and tests/html.test.js's no-third-party rule agree ------------
// That rule lets the shipped scripts name three absolute addresses: the
// deployment, the same with ?action=count, and the SVG namespace (a name,
// never fetched). Each of the first two must be one the policy lets every
// page reach, and the policy must reach nothing those scripts do not name
// bar the redirect, which no script names: Apps Script sends it.
{
    const shipped = ['script.js', 'count.js', 'theme.js', 'carbon-ai.js', 'ai-carbon-data.js', 'brief.js',
        ...fs.readdirSync(path.join(ROOT, 'modules')).filter(f => f.endsWith('.js')).map(f => `modules/${f}`)].map(read);
    PAGES.forEach(rel => inspect(rel).inline.forEach(s => shipped.push(s.textContent)));
    const named = new Set(shipped.flatMap(text => (text.match(/['"`](?:https?:)?\/\/[^'"`\s$]*/g) || []).map(m => m.slice(1))));
    named.delete(SVG_NS);
    assert([...named].sort().join(' ') === [GAS, `${GAS}?action=count`].sort().join(' '),
        `Agree: the scripts name the deployment and its count address and nothing else off the site (${[...named].join(', ')})`);
    const unreached = PAGES.flatMap(rel => [...named].filter(u => !allows(policies[rel]['connect-src'] || [], u)).map(u => `${rel} → ${u}`));
    assert(unreached.length === 0, `Agree: every page's connect-src lets it reach each of those (${unreached.join(', ') || 'all reached'})`);
    const form = (read('index.html').match(/<form[^>]+id=["']contactForm["'][^>]*>/i) || [''])[0];
    const action = (form.match(/\saction=["']([^"']+)["']/) || [])[1] || '';
    assert(action === GAS && allows(policies['index.html']['form-action'] || [], action),
        'Agree: the contact form without JavaScript posts to the deployment, which the homepage\'s form-action allows');
    const beyond = Object.values(policies).flatMap(p => [...offSite(p['connect-src']), ...offSite(p['form-action'])])
        .filter(s => s !== REDIRECT && ![...named].some(u => allows([s], u)));
    assert(beyond.length === 0, `Agree: the policies name nothing off the site the scripts do not, bar the redirect's host (${beyond.join(', ') || 'none'})`);
}

// --- The build writes it, and these checks bite ---------------------------------
{
    HAND.forEach((rel) => {
        const src = read(rel);
        assert(/<!-- CSP -->\n[ \t]*<meta http-equiv="Content-Security-Policy"[^\n]*\n[ \t]*<meta name="referrer"[^\n]*\n[ \t]*<!-- \/CSP -->/.test(src),
            `${rel}: hand-authored, it takes the policy between CSP markers (npm run build:content writes it, build:check holds it)`);
    });
    const { securityPolicy } = require('../scripts/build-content.js');
    const drift = PAGES.filter(rel => inspect(rel).metas[0].getAttribute('content') !== securityPolicy(read(rel)));
    assert(drift.length === 0, `Build: each page's policy is the one the build works out from the page as it stands (${drift.join(', ') || 'all'})`);

    // A one-character change to an inline script, made by hand without a
    // rebuild, is caught; so is a hash left behind for a script taken out.
    const html = read('index.html');
    const edited = html.replace("classList.add('js');", "classList.add('js') ;");
    const stale = hashTrouble(inspect('index.html', edited));
    assert(edited !== html && stale.missing.length === 1 && stale.extra.length === 1,
        'Bites: an inline script edited after the build is a missing hash and a stale one');
}

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
