'use strict';
// ===================================================================
// NOTES — the Field Notes, read from content/notes/*.md
//
// One file per note, named for its slug, a short front-matter block and
// then the note:
//
//     ---
//     number: 1
//     title: What 164 water points taught me about data
//     slug: what-164-water-points-taught-me
//     date: 2026-07-06
//     tag: Water
//     summary: Geophysics taught me that data only matters when someone stakes something on it.
//     caseStudy: groundwater
//     ---
//     In the Freetown Complex, a wrong guess isn't a bad cell in a …
//
// The markdown is a small subset, parsed here without a dependency:
// paragraphs, *emphasis*, **strong**, [links](url), ## and ### headings,
// and lists ("- " or "1. ", one line an item). Anything outside it (raw
// HTML, code, an image, a quote, a table, _underscores_, an indented or
// nested line, a lazy continuation of a list item) is refused with its
// line rather than printed wrong: a parser that guessed would put its
// guess on a public page, and the rule this site keeps is that what it
// cannot show it does not print.
//
// The front matter is a subset of YAML for the same reason, from the other
// side: GitHub Pages runs Jekyll over the repository, and Jekyll reads every
// markdown file's front matter as YAML. A value YAML would read differently
// (one opening with a quote or a bracket, or holding ": " or " #") is
// refused here, so a note that passes cannot break the deploy, and nothing
// in it is read as Liquid ("{{" and "{%" are refused too).
//
// This file only reads. What a note must say (a title, a real date not
// still to come, a slug the counter can name, a case study or lens that
// exists) is checked by checkNotes in scripts/lib/content.js; turning it
// into a page is scripts/build-content.js.
// ===================================================================

const FENCE = '---';

// A key, then one plain value on the same line.
const LINE = /^([A-Za-z]+): (.*)$/;
// What makes YAML read a plain value as something else: an indicator at
// its start, a ": " or " #" inside it, a trailing colon.
const YAML_START = /^[-?:,[\]{}#&*!|>'"%@`]/;
const YAML_INSIDE = /: | #|:$/;

/**
 * The front matter and the body of one note file, with every problem
 * found on the way (line numbers are the file's own).
 *   { meta: { key: string }, body: string, bodyLine: number, problems: [] }
 */
function splitNote(text) {
    const problems = [];
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    const meta = {};
    if (lines[0] !== FENCE) {
        return { meta, body: '', bodyLine: 1, problems: ['line 1: a note opens with a front-matter block, "---" on a line of its own'] };
    }
    const end = lines.indexOf(FENCE, 1);
    if (end === -1) return { meta, body: '', bodyLine: 1, problems: ['the front matter has no closing "---"'] };
    for (let i = 1; i < end; i++) {
        const at = `line ${i + 1}`;
        const m = lines[i].match(LINE);
        if (!m) { problems.push(`${at}: front matter is "key: value", one to a line (got ${JSON.stringify(lines[i])})`); continue; }
        const [, key, value] = m;
        if (key in meta) problems.push(`${at}: "${key}" is given twice`);
        if (!value.trim() || value !== value.trim()) problems.push(`${at}: "${key}" has no value, or space around it`);
        else if (YAML_START.test(value) || YAML_INSIDE.test(value)) {
            problems.push(`${at}: "${key}" would not read as plain text in YAML (no quote or bracket first, no ": " or " #" inside) — reword it`);
        }
        meta[key] = value;
    }
    // A blank line between the fence and the note is allowed, and not part of it.
    let from = end + 1;
    while (from < lines.length && lines[from] === '') from++;
    let to = lines.length;
    while (to > from && lines[to - 1] === '') to--;
    return { meta, body: lines.slice(from, to).join('\n'), bodyLine: from + 1, problems };
}

// ------------------------------------------------------------------
// The markdown subset
// ------------------------------------------------------------------

// Inline text a reader of markdown would see as something this subset
// does not print: refused rather than shown as its source.
const INLINE_REFUSED = [
    [/<[A-Za-z/!?]/, 'raw HTML or an autolink (<…>)'],
    [/`/, 'code (a backtick)'],
    [/\\/, 'a backslash escape'],
    [/_/, 'an underscore, which markdown may read as emphasis — use *'],
    [/~~/, 'strikethrough'],
    [/!\[/, 'an image'],
    [/\{\{|\{%/, 'Liquid, which Jekyll would run'],
    [/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i, 'an HTML entity — type the character itself']
];

// Lines that open a block this subset does not have.
const BLOCK_REFUSED = [
    [/^# /, 'a level-one heading: the title is the note\'s one, so use ## or ###'],
    [/^#{4,}/, 'a heading below ###'],
    [/^#[^#\s]/, 'a heading with no space after its #'],
    [/^[*+] /, 'a list item marked * or + — mark it "- "'],
    [/^>/, 'a quotation'],
    [/^(?:```|~~~)/, 'a code block'],
    [/^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/, 'a horizontal rule (or a heading underlined with ---)'],
    [/^=+$/, 'a heading underlined with ==='],
    [/^\|/, 'a table'],
    [/^</, 'raw HTML'],
    [/^\d+\)/, 'a list item numbered "1)" — number it "1. "']
];

/**
 * One line of inline markdown as a list of runs:
 *   { t: 'text', v } · { t: 'em', v } · { t: 'strong', v } · { t: 'a', v, href }
 * Emphasis and a link's text are plain text: nothing nests. Returns
 * { runs, problems }.
 */
function inline(text, at) {
    const problems = [];
    // A link's address may hold what its text may not (an underscore, say).
    const words = text.replace(/\]\([^()\s]+\)/g, '](…)');
    INLINE_REFUSED.forEach(([re, what]) => { if (re.test(words)) problems.push(`${at}: ${what}`); });
    const runs = [];
    let buf = '';
    const flush = () => { if (buf) runs.push({ t: 'text', v: buf }); buf = ''; };
    let i = 0;
    while (i < text.length) {
        const rest = text.slice(i);
        const strong = rest.match(/^\*\*([^*[\]]+?)\*\*/);
        const em = !strong && rest.match(/^\*([^*[\]]+?)\*/);
        const link = rest.match(/^\[([^[\]*]+)\]\(([^()\s]+)\)/);
        const span = strong || em;
        if (span) {
            if (/^\s|\s$/.test(span[1])) problems.push(`${at}: emphasis that opens or closes on a space ("${span[0]}")`);
            flush();
            runs.push({ t: strong ? 'strong' : 'em', v: span[1] });
            i += span[0].length;
        } else if (link) {
            flush();
            runs.push({ t: 'a', v: link[1], href: link[2] });
            i += link[0].length;
        } else if (text[i] === '*' || text[i] === '[' || text[i] === ']') {
            problems.push(`${at}: a "${text[i]}" that opens no emphasis or link — markdown would read it otherwise`);
            buf += text[i++];
        } else {
            buf += text[i++];
        }
    }
    flush();
    return { runs, problems };
}

/**
 * The body as blocks:
 *   { type: 'p', runs } · { type: 'h2' | 'h3', runs } · { type: 'ul' | 'ol', items: [runs] }
 * Returns { blocks, problems }. `firstLine` is the body's first line in
 * its file, so a problem names the line a writer can find.
 */
function parseMarkdown(body, firstLine = 1) {
    const blocks = [];
    const problems = [];
    let para = null;
    let list = null;
    const close = () => { para = null; list = null; };
    const take = (text, at) => {
        const r = inline(text, at);
        problems.push(...r.problems);
        return r.runs;
    };
    String(body).split('\n').forEach((line, n) => {
        const at = `line ${firstLine + n}`;
        if (line === '') { close(); return; }
        if (/\s$/.test(line)) problems.push(`${at}: trailing space, which markdown reads as a line break`);
        if (/^\s/.test(line)) { problems.push(`${at}: an indented line (markdown reads it as code, or a nested list)`); return; }
        const refused = BLOCK_REFUSED.find(([re]) => re.test(line));
        if (refused) { problems.push(`${at}: ${refused[1]}`); close(); return; }

        const heading = line.match(/^(##|###) (\S.*)$/);
        const bullet = line.match(/^- (\S.*)$/);
        const numbered = line.match(/^(\d+)\. (\S.*)$/);
        if (heading) {
            close();
            blocks.push({ type: heading[1] === '##' ? 'h2' : 'h3', runs: take(heading[2], at) });
        } else if (bullet || numbered) {
            const type = bullet ? 'ul' : 'ol';
            if (!list || list.type !== type) {
                close();
                list = { type, items: [] };
                blocks.push(list);
            }
            // A numbered list counts from 1, one at a time: markdown would
            // renumber anything else, and the page would not say what the file does.
            if (numbered && Number(numbered[1]) !== list.items.length + 1) {
                problems.push(`${at}: item ${numbered[1]} of a numbered list should be ${list.items.length + 1}`);
            }
            list.items.push(take((bullet || numbered)[bullet ? 1 : 2], at));
        } else if (list) {
            problems.push(`${at}: a line straight after a list item, which markdown reads as part of it — leave a blank line`);
        } else {
            if (!para) {
                para = { type: 'p', runs: [] };
                blocks.push(para);
            } else {
                para.runs.push({ t: 'text', v: ' ' });
            }
            para.runs.push(...take(line, at));
        }
    });
    return { blocks, problems };
}

/** A block's runs as plain text, as a reader would read them. */
const runsText = (runs) => runs.map(r => r.v).join('');

/** The whole note as plain text, a block to a line. */
function plainText(blocks) {
    return blocks.map(b => (b.items ? b.items.map(runsText).join('\n') : runsText(b.runs))).join('\n');
}

/** Every link in the note, as { text, href }. */
function linksIn(blocks) {
    return blocks.flatMap(b => (b.items || [b.runs]).flat()).filter(r => r.t === 'a').map(r => ({ text: r.v, href: r.href }));
}

module.exports = { splitNote, parseMarkdown, inline, plainText, runsText, linksIn };
