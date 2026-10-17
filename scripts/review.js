#!/usr/bin/env node
'use strict';
// ===================================================================
// REVIEW — this quarter's "Quarterly review" issue (docs/plan.md, Phase 7)
//
//     node scripts/review.js             open this quarter's issue, unless it exists
//     node scripts/review.js --dry-run   print its title and body instead
//
// The plan's last phase is a rhythm, not a feature: a note a month, the
// profile and the AI data re-verified each quarter, the CV and the
// sustainability statement each year. A rhythm nobody is reminded of
// stops, as the Field Notes did. .github/workflows/review.yml runs this on
// the Mondays of January, April, July and October; the first of them opens
// "Quarterly review — YYYY Qn" and the rest find it and do nothing, so a
// quarter gets one issue however often this runs, and a quarter whose
// first run failed gets its issue a week later.
//
// The checklist's words are in docs/review-checklist.md, and only there:
// the issue carries that file from its first heading down, and
// tests/health.test.js holds the plan's Phase 7 table to it. The issue also
// links the open counts, the owner checklist and the latest health issue.
// ===================================================================

const fs = require('fs');
const path = require('path');
const github = require('./lib/github.js');
const health = require('./health.js');

const ROOT = path.join(__dirname, '..');
const CHECKLIST = 'docs/review-checklist.md';
const LABEL = {
    name: 'review',
    color: '0e8a16',
    description: 'The quarterly review: one issue a quarter, opened by scripts/review.js'
};
const MARKER = '<!-- quarterly-review: opened by scripts/review.js -->';

/** The quarter a moment falls in, in UTC: "2026 Q4". */
function quarter(now) {
    return `${now.getUTCFullYear()} Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}
const title = (now) => `Quarterly review — ${quarter(now)}`;

/**
 * docs/review-checklist.md as data: each "## " heading and the words in
 * bold that open each of its items (the plan's words), and the text the
 * issue carries, from the first heading down.
 */
function parseReview(md) {
    const text = String(md).replace(/\r\n/g, '\n');
    const at = text.search(/^## /m);
    const body = at < 0 ? '' : text.slice(at).trim();
    const sections = [];
    body.split('\n').forEach((line) => {
        const heading = /^## (.+?)\s*$/.exec(line);
        if (heading) { sections.push({ heading: heading[1], items: [] }); return; }
        const item = /^- \[ \] \*\*(.+?)\*\*/.exec(line);
        if (item && sections.length) sections[sections.length - 1].items.push(item[1].replace(/\.$/, ''));
    });
    return { sections, body };
}

function reviewBody({ now, checklist, repo, site, latestHealth }) {
    const blob = (file) => `[${file}](https://github.com/${repo}/blob/main/${file})`;
    const healthLine = latestHealth
        ? `#${latestHealth.number} (${latestHealth.state === 'open' ? 'open' : `closed, everything passing on ${String(latestHealth.closed_at || '').slice(0, 10)}`})`
        : 'none yet';
    return [
        MARKER,
        `The Phase 7 review for ${quarter(now)}: about two hours a month (${blob('docs/plan.md')}, "Keep it alive"). Tick each item as it is done, and close this issue when the quarter's are.`,
        '',
        `- The open counts: ${site}stats.html`,
        `- What only Moses can do: ${blob('docs/owner-checklist.md')}`,
        `- The latest health check: ${healthLine}`,
        '',
        // An issue breaks the line wherever the file does, so each item's
        // wrapped lines are joined back into one.
        parseReview(checklist).body.replace(/\n {2}(?=\S)/g, ' '),
        '',
        `_From ${blob(CHECKLIST)}, opened by ${blob('scripts/review.js')}._`,
        ''
    ].join('\n');
}

/**
 * Opens this quarter's issue unless one with its title exists, open or
 * closed. Issues are found by label; the label is made first, so an issue
 * opened with it keeps it.
 */
async function openReview(gh, { now, checklist, site }) {
    const name = title(now);
    await gh.ensureLabel(LABEL.name, LABEL.color, LABEL.description);
    const existing = (await gh.listIssues({ state: 'all', labels: LABEL.name })).find(i => i.title === name);
    if (existing) return { action: 'exists', number: existing.number, title: name };

    const healthIssues = await gh.listIssues({ state: 'all', labels: health.LABEL.name, sort: 'created', direction: 'desc' });
    const latestHealth = healthIssues.find(i => typeof i.body === 'string' && i.body.startsWith(health.MARKER)) || null;
    const body = reviewBody({ now, checklist, repo: gh.repo, site, latestHealth });
    const made = await gh.createIssue({ title: name, body, labels: [LABEL.name] });
    return { action: 'opened', number: made.number, title: name };
}

async function main(argv = process.argv.slice(2), env = process.env) {
    const now = new Date();
    const checklist = fs.readFileSync(path.join(ROOT, CHECKLIST), 'utf8');
    const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'profile.json'), 'utf8')).links.site;
    if (argv.includes('--dry-run')) {
        const repo = env.GITHUB_REPOSITORY || 'owner/repo';
        process.stdout.write(`${title(now)}\n\n${reviewBody({ now, checklist, repo, site, latestHealth: null })}`);
        return;
    }
    if (!(env.GITHUB_TOKEN && env.GITHUB_REPOSITORY)) {
        console.error('  review: GITHUB_TOKEN and GITHUB_REPOSITORY are needed to open the issue. Run with --dry-run to print it instead.');
        process.exitCode = 1;
        return;
    }
    const gh = github.client({ fetch: globalThis.fetch, token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY, api: env.GITHUB_API_URL || github.API });
    const done = await openReview(gh, { now, checklist, site });
    console.log(done.action === 'opened'
        ? `  review: opened #${done.number}, "${done.title}".`
        : `  review: "${done.title}" is #${done.number} already; nothing to do.`);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err && err.stack ? err.stack : err);
        process.exitCode = 1;
    });
}

module.exports = { CHECKLIST, LABEL, MARKER, quarter, title, parseReview, reviewBody, openReview, main };
