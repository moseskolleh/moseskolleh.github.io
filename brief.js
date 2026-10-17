// ===================================================================
// THE BRIEF — paste a job ad, get an honest fit and a one-page dossier
// ===================================================================
// brief.html's own script, and nobody else's: the homepage's Assay grew
// into this page (docs/plan.md, Phase 4.1). Deterministic matching over a
// hand-written rubric and the facts in content/profile.json: no AI, no
// model download, and the ad never leaves the browser. That restraint is
// the argument.
//
// Every requirement the site does not evidence is a gap, shown as
// prominently as a match; a hard gap caps the grade; and the top grade
// needs broad coverage of the ad (why: docs/plan.md, Phase 0 step 7). The
// rubric is content/brief.json, where the validator holds it to the case
// studies; npm run build:content writes what this script needs of it into
// the page's #briefData block, beside the facts it may state and where the
// homepage shows each named tool.
//
// The dossier is in the page already, every case study in the case
// studies' order, which is what a reader without JavaScript gets. A grade
// selects and reorders it: it never writes a line of its own about Moses.
// The address it leaves (?focus=) carries the ids of what matched and what
// did not, from the rubric, and rebuilds the same fit and dossier for
// whoever it is sent to. Never a word of the ad.
// ===================================================================
(() => {
    const mks = (window.mks = window.mks || {});

    // --- Matching, without the rubric ------------------------------------
    // The build reads these too, with no #briefData to find, to say where
    // the homepage shows each tool (scripts/build-content.js).
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cache = new Map();
    const rx = (source, flags) => {
        const key = source + '/' + (flags || '');
        if (!cache.has(key)) cache.set(key, new RegExp(source, flags || ''));
        return cache.get(key);
    };
    // Whole words, so "gis" does not match inside "logistics".
    const hit = (text, syns) => !!(syns && syns.length) &&
        rx('(?:^|[^\\w])(?:' + syns.map(esc).join('|') + ')(?:s|es)?(?!\\w)', 'i').test(text);
    const stemHit = (text, stems) => rx('\\b(?:' + stems.map(esc).join('|') + ')', 'i').test(text);
    const matches = (text, rule) => (!!rule.re && rx(rule.re, rule.flags).test(text)) || hit(text, rule.syn);
    // A tool's or a language's id is its name, as a shared link spells it.
    const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const named = (x) => Object.assign({ id: slug(x.name || x) }, typeof x === 'string' ? { name: x, syn: [x.toLowerCase()] } : x);
    mks.brief = { matches, named, slug };

    const dataEl = document.getElementById('briefData');
    if (!dataEl) return;
    let DATA;
    try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }
    const RULES = DATA.rules;
    const FACTS = DATA.facts;

    const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const TOOLS = RULES.tools.map(named);
    const LANGUAGES = RULES.languages.map(named);
    const LANG_ALT = LANGUAGES.reduce((a, l) => a.concat(l.syn), []).map(esc).join('|');
    const langCue = (text) => hit(text, RULES.languageCues) || /\b[ABC][12]\b/.test(text);
    const wordCount = (text) => text.trim().split(/\s+/).length;
    const langOnly = (text) => !text.replace(rx('\\b(?:' + LANG_ALT + '|and|or)\\b|[\\s/&().-]', 'gi'), '');
    const clauses = (line) => line.split(/[,;]/).reduce((out, c) => {
        if (out.length && langOnly(out[out.length - 1])) out[out.length - 1] += ',' + c; else out.push(c);
        return out;
    }, []);
    // A language, or a nationality? Past any list of languages ("German and
    // French partners"), the next word decides.
    const spoken = (clause, lang) => {
        const at = rx('(?:^|[^\\w])(?:' + lang.syn.map(esc).join('|') + ')(?!\\w)', 'gi');
        return Array.from(clause.matchAll(at)).some((m) => {
            const rest = clause.slice(m.index + m[0].length)
                .replace(rx('^(?:\\s*(?:,|/|&|and|or)\\s*(?:' + LANG_ALT + '))*', 'i'), '');
            const [, next = '', after = ''] = rest.match(/^\s+(\S+)(?:\s+(\S+))?/) || [];
            const name = /^[A-Z][a-z]/.test(next) && !langCue(next) && (/^[A-Z]/.test(after) || after === 'of');
            return !stemHit(next, RULES.nationalStems) && !name;
        });
    };
    const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

    // Where the homepage shows a tool, best proof first, as the build read
    // it; a proof with "no public" work behind it is partial, not ticked.
    const toolEvidence = (tool, map) => {
        const found = (map || DATA.toolEvidence || {})[tool.name];
        return found ? found.map(e => Object.assign({}, e, { part: /no public/.test(e.t) })) : null;
    };

    // One line per requirement: a bullet, a sentence, a semicolon clause —
    // and "·", so "Fluent Dutch · 5+ years Big Four · SAP" is three.
    const splitLines = (raw) => raw
        .replace(/([.!?])\s+(?=[A-Z0-9(])/g, '$1\n')
        .split(/[\n\r;•·▪►]+/)
        .map(l => l.replace(/^\s*(?:[-–—*]+|\d{1,2}[.)])\s+/, '').trim())
        .filter(Boolean);

    const levelOf = (text) => RULES.levels.find(l => rx(l.re, l.flags).test(text)) || null;
    const month = (ym) => { const [y, m] = String(ym).split('-').map(Number); return y * 12 + m - 1; };
    const duration = (months) => {
        const y = Math.floor(months / 12);
        const m = months % 12;
        return y ? plural(y, 'year') + (m ? ' ' + plural(m, 'month') : '') : plural(m, 'month');
    };

    // Professional experience from content/profile.json, counted the
    // conservative way: each role from its first month to its last ("May
    // 2019 — Sept 2019" is four months, mid-month to mid-month), an open
    // role to this month, and internships, programmes and study not at all.
    function experienceCount(facts, now) {
        const skip = rx('\\b(?:' + RULES.notCountedAsYears.join('|') + ')\\b', 'i');
        const roles = facts.experience || [];
        const counted = roles.filter(r => !skip.test(r.title));
        const current = now.getFullYear() * 12 + now.getMonth();
        const months = counted.reduce((n, r) => n + Math.max(0, (r.end ? month(r.end) : current) - month(r.start)), 0);
        return { months, counted, skipped: roles.filter(r => skip.test(r.title)) };
    }

    // What the site says about one named requirement, met or not: a tool, a
    // language at a level, or years of experience. The grading and a shared
    // link both ask here, so the two cannot word a gap differently.
    const said = (facts, now, toolMap) => {
        const exp = experienceCount(facts, now);
        const have = duration(exp.months);
        return {
            exp,
            tool: (tool) => ({ label: tool.name, ev: toolEvidence(tool, toolMap), note: 'Not evidenced on this site. Ask Moses.' }),
            lang: (lang, want) => {
                const has = (facts.languages || []).find(l => hit(String(l.language), lang.syn));
                const hasLevel = has && levelOf(String(has.level));
                const ok = hasLevel && hasLevel.level >= (want ? want.level : RULES.defaultLevel);
                return {
                    label: lang.name + (want ? ` (${want.label})` : ''),
                    ev: ok && [{ t: `${lang.name} at ${has.level}, as listed on this site` }],
                    note: has ? `The level listed on this site is ${has.level}. Ask Moses.` : 'Not evidenced on this site. Ask Moses.'
                };
            },
            years: (years) => ({
                label: `${years}+ year${years === 1 ? '' : 's'} of experience`,
                ev: exp.months >= years * 12 && [{ t: `About ${have} across the professional roles listed on this site (internships, programmes and study not counted)`, href: 'index.html#experience' }],
                note: `About ${have}, counting the professional roles listed on this site: ${listJoin(exp.counted.map(r => `${r.title} (${r.displayDates})`))}. ` +
                    `Not counted: ${listJoin(exp.skipped.map(r => r.title).concat('full-time study'))}. Ask Moses.`
            })
        };
    };

    const GRADE_CLASS = { high: 'high', workable: 'workable', marginal: 'marginal', field: 'marginal' };

    /**
     * The whole assessment, as data. Pure: `opts.facts`, `opts.now` and
     * `opts.toolEvidence` let a test pin all three.
     */
    function analyse(raw, opts) {
        const o = opts || {};
        const facts = o.facts || FACTS;
        const text = String(raw || '');
        const words = (text.match(/[A-Za-z0-9À-ÿ][\w'’&+-]*/g) || []).length;
        if (words < RULES.minWords) return { status: words ? 'short' : 'empty', words };

        const site = said(facts, o.now || new Date(), o.toolEvidence);
        const exp = site.exp;
        const degrees = listJoin(facts.degrees || []) || 'not listed';
        const seen = {};
        const matched = [];     // capability areas, with their evidence
        const met = [];         // named requirements the site evidences
        const gaps = [];        // …and the ones it does not
        const confirm = [];
        const confirmIds = [];
        let softSection = false;
        let reqSection = false;
        let asked = 0;
        let answered = 0;

        splitLines(text).forEach((line) => {
            const n = line.split(/\s+/).length;
            // A heading ("Requirements:", "Nice to have") asks for nothing
            // itself, but a soft one makes every line under it soft.
            const heading = /:$/.test(line);
            if (heading || n <= 4) {
                if (rx(RULES.softHeading, 'i').test(line)) { softSection = true; reqSection = false; return; }
                if (rx(RULES.hardHeading, 'i').test(line)) {
                    // Under "Responsibilities", years are the job's.
                    softSection = false;
                    reqSection = !/^(?:respons|what you(?:'ll| will) do)/i.test(line);
                    return;
                }
                if (heading) return;
            }
            const soft = softSection || hit(line, RULES.softCues);
            let recognised = false;
            let covered = false;
            let missing = false;
            let toConfirm = false;
            // One named requirement: met, with its evidence, or a gap. Asked
            // twice, it is listed once, hard if either time was. `token` is
            // what a shared link calls it.
            const need = (key, token, { label, ev, note }) => {
                recognised = true;
                if (ev) {
                    covered = true;
                    if (!seen[key]) met.push(seen[key] = { label, ev, token });
                    return;
                }
                missing = missing || !soft;
                if (!seen[key]) gaps.push(seen[key] = { label, text: note, hard: false, token });
                seen[key].hard = seen[key].hard || !soft;
            };
            const ask = (label, id) => {
                toConfirm = true;
                if (!seen[label]) { confirm.push(seen[label] = label); confirmIds.push(id); }
            };

            RULES.strengths.forEach((s) => {
                if (!hit(line, s.syn)) return;
                recognised = covered = true;
                if (!seen[s.label]) matched.push(seen[s.label] = s);
            });

            TOOLS.forEach((tool) => {
                if (matches(line, tool)) need('tool:' + tool.name, tool.id, site.tool(tool));
            });

            // The employer describing itself ("Our team works in English,
            // Dutch and French") asks nothing of the applicant, and nor does
            // the language to apply in. In the employer's voice a language is
            // asked for only where the line says so: a level, "a plus", or
            // "language" in its clause ("Our working language is Dutch").
            const Y = RULES.years;
            const ours = hit(line, Y.we) && !stemHit(line, Y.you);
            const asks = (clause) => !ours || levelOf(line) || hit(line, RULES.softCues) || hit(clause, ['language']);
            if ((n <= 4 || langCue(line)) && !hit(line, RULES.applyIn)) {
                clauses(line).forEach((clause) => {
                    if ((wordCount(clause) > 4 && !langCue(clause)) || !asks(clause)) return;
                    LANGUAGES.forEach((lang) => {
                        if (!spoken(clause, lang)) return;
                        // The level beside this language, else its clause's:
                        // "Native German, business-level French" asks for two.
                        const want = levelOf(clause.split(/\/|\band\b/i).find(seg => hit(seg, lang.syn)) || '') || levelOf(clause);
                        const has = (facts.languages || []).find(l => hit(String(l.language), lang.syn));
                        if (lang.confirm && !has) { ask(lang.confirm, lang.id); return; }
                        need(`lang:${lang.name}:${want ? want.level : ''}`, lang.id + (want ? '.' + want.id : ''), site.lang(lang, want));
                    });
                });
            }

            if (!hit(line, Y.not) && !ours) {
                let years = 0;
                for (const m of line.matchAll(rx(Y.re, 'gi'))) {
                    const count = Number(m[2]) || Y.words[m[2].toLowerCase()] || 0;
                    if (m[1] || m[3] || reqSection || hit(line, Y.cue)) years = Math.max(years, count);
                }
                if (years) need('years:' + years, 'years.' + years, site.years(years));
            }

            RULES.gaps.forEach((g) => {
                if (!matches(line, g) || (g.cue && !hit(line, g.cue)) || hit(line, g.not)) return;
                need('gap:' + g.label, g.id, { label: g.label, ev: null, note: g.text.replace('{degrees}', degrees) });
            });

            RULES.confirm.forEach((c) => { if (hit(line, c.syn)) ask(c.label, c.id); });

            // Coverage: of the lines that ask for something, how many does
            // the site answer? A line with a hard gap is not answered, whatever
            // else it mentions; a line that only asks for something to
            // confirm (right to work, say) is not graded at all.
            if (toConfirm && !recognised) return;
            if (recognised || stemHit(line, RULES.requirementCues)) {
                asked++;
                if (covered && !missing) answered++;
            }
        });

        const hard = gaps.filter(g => g.hard);
        const areas = matched.length;
        const domain = matched.filter(m => !m.general).length;
        const share = asked ? answered / asked : 0;
        const lines = `${answered} of ${plural(asked, 'requirement line')}`;
        const fits = (bar) => areas >= bar.areas && domain >= bar.domain && share >= bar.coverage;
        let gradeId, blurb;
        if (!domain) {
            gradeId = 'field';
            blurb = (areas || met.length ? 'Only general skills match: nothing' : 'Nothing') +
                ' here maps to the environmental, climate or sustainability work on this site. Most likely a different field.';
        } else if (!hard.length && fits(RULES.high)) {
            gradeId = 'high';
            blurb = `${plural(areas, 'area')} of this ad map to delivered work on this site, answering ${lines}, with no hard gaps.`;
        } else if (hard.length <= RULES.workable.hardGaps && fits(RULES.workable)) {
            gradeId = 'workable';
            blurb = `${plural(areas, 'area')} map to delivered work, answering ${lines}` +
                (hard.length ? ', but one requirement is not evidenced here; it is listed first.' : '.');
        } else {
            gradeId = 'marginal';
            blurb = hard.length > 1
                ? `The work overlaps in ${plural(areas, 'area')}, but ${hard.length} hard requirements are not evidenced on this site. Read the gaps first.`
                : (areas >= RULES.workable.areas
                    ? `${plural(areas, 'area')} map to delivered work, but the site answers only ${lines}`
                    : `Only ${plural(areas, 'area')} maps to delivered work, answering ${lines}`) +
                  (hard.length ? ', and one hard requirement is not evidenced here.' : '. Worth a conversation only if the rest can be learned on the job.');
        }
        if (confirm.length) blurb += ` Still to confirm: ${listJoin(confirm.map(c => c[0].toLowerCase() + c.slice(1)))}.`;

        return {
            status: 'graded', words, gradeId, grade: RULES.grades[gradeId], cls: GRADE_CLASS[gradeId], blurb,
            matched, met, confirm, confirmIds, hard,
            gaps: hard.concat(gaps.filter(g => !g.hard)),
            coverage: { answered, asked },
            experience: exp
        };
    }

    // --- The shared link ---------------------------------------------------
    // ?focus= is a list of ids from the rubric, comma-separated: the grade,
    // the strengths matched (bare), then each named requirement as met:,
    // gap: (hard), soft: (nice to have) or ask: (to confirm). A tool or a
    // language is its id, a language at a level "dutch.c1", years "years.5",
    // anything else a gap rule's or a confirm's id. Anything unknown is
    // dropped, so a link that outlives a rename shows less, never more.
    function focusOf(a) {
        if (!a || a.status !== 'graded') return '';
        return (a.gradeId ? [a.gradeId] : []).concat(a.matched.map(s => s.id), a.met.map(m => 'met:' + m.token),
            a.gaps.map(g => (g.hard ? 'gap:' : 'soft:') + g.token), a.confirmIds.map(id => 'ask:' + id)).join(',');
    }

    function fromFocus(focus, opts) {
        const o = opts || {};
        const facts = o.facts || FACTS;
        const site = said(facts, o.now || new Date(), o.toolEvidence);
        const degrees = listJoin(facts.degrees || []) || 'not listed';
        const byId = (list, id) => list.find(x => x.id === id);
        let gradeId = null;
        const matched = [];
        const met = [];
        const gaps = [];
        const confirm = [];
        const confirmIds = [];
        const seen = {};
        String(focus || '').split(',').slice(0, 80).forEach((raw) => {
            const token = raw.trim().toLowerCase();
            if (!/^(?:(?:met|gap|soft|ask):)?[a-z0-9-]{1,40}(?:\.[a-z0-9]{1,8})?$/.test(token) || seen[token]) return;
            seen[token] = true;
            const [kind, item] = token.includes(':') ? token.split(':') : ['', token];
            const [id, param] = item.split('.');
            if (!kind) {
                if (param) return;
                if (RULES.grades[id] && !gradeId) gradeId = id;
                const s = byId(RULES.strengths, id);
                if (s && !matched.includes(s)) matched.push(s);
                return;
            }
            if (kind === 'ask') {
                const c = byId(RULES.confirm, id);
                const lang = byId(LANGUAGES, id);
                const label = c ? c.label : lang && lang.confirm;
                if (label && !param && !confirm.includes(label)) { confirm.push(label); confirmIds.push(id); }
                return;
            }
            // A named requirement, said as the site says it today: a link
            // sent before the site showed a tool shows it met now.
            let found = null;
            const tool = byId(TOOLS, id);
            const lang = byId(LANGUAGES, id);
            const rule = byId(RULES.gaps, id);
            if (id === 'years' && /^\d{1,2}$/.test(param || '') && +param > 0) found = site.years(+param);
            else if (tool && !param) found = site.tool(tool);
            else if (lang && !lang.confirm) {
                const want = param ? RULES.levels.find(l => l.id === param) : null;
                if (param && !want) return;
                found = site.lang(lang, want);
            } else if (rule && !param) found = { label: rule.label, ev: null, note: rule.text.replace('{degrees}', degrees) };
            if (!found) return;
            if (found.ev) met.push({ label: found.label, ev: found.ev, token: item });
            else gaps.push({ label: found.label, text: found.note, hard: kind !== 'soft', token: item });
        });
        if (!gradeId && !matched.length && !met.length && !gaps.length && !confirm.length) return null;
        const hard = gaps.filter(g => g.hard);
        return {
            status: 'shared', gradeId, grade: gradeId ? RULES.grades[gradeId] : null, cls: gradeId ? GRADE_CLASS[gradeId] : 'shared',
            blurb: 'Shared from The Brief: the grade, what matched and the gaps, as the sender saw them. The ad itself was not shared, so how much of it the site answers is not shown.',
            matched, met, confirm, confirmIds, hard, gaps: hard.concat(gaps.filter(g => !g.hard))
        };
    }

    // The case studies a result selects, most relevant first: each matched
    // area names its own (content/brief.json), an area of this site's field
    // weighing twice a general one; a tie goes to the area matched first,
    // then to the case study it names first.
    function selectCases(matched) {
        const rank = new Map();
        (matched || []).forEach((s, i) => (s.caseStudies || []).forEach((id, j) => {
            const r = rank.get(id) || { score: 0, at: [i, j] };
            r.score += s.general ? 1 : 2;
            rank.set(id, r);
        }));
        return Array.from(rank).sort((a, b) => b[1].score - a[1].score || a[1].at[0] - b[1].at[0] || a[1].at[1] - b[1].at[1]).map(([id]) => id);
    }

    Object.assign(mks.brief, { analyse, focusOf, fromFocus, selectCases, RULES, FACTS });

    // --- The page -------------------------------------------------------------
    const $ = (id) => document.getElementById(id);
    const input = $('briefAd');
    const runBtn = $('briefRun');
    const clearBtn = $('briefClear');
    const fit = $('briefFit');
    const result = $('briefResult');
    const msg = $('briefMsg');
    const shareBar = $('briefShare');
    const linkEl = $('briefLink');
    const list = $('briefCases');
    const selectedEl = $('briefSelected');
    const addressEl = $('briefAddress');
    if (!fit || !result || !list) return;
    const cases = Array.from(list.children);
    const allSaid = selectedEl ? selectedEl.innerHTML : '';
    const track = (name) => { if (typeof mks.track === 'function') mks.track(name); };
    const base = location.href.split(/[?#]/)[0];
    let link = base;

    // The dossier: every case study in its own order, or the ones a result
    // selects, in theirs.
    const showCases = (ids) => {
        if (!ids) {
            cases.forEach((li) => { li.hidden = false; list.appendChild(li); });
            if (selectedEl) selectedEl.innerHTML = allSaid;
            return;
        }
        cases.forEach((li) => { li.hidden = !ids.includes(li.id); });
        ids.forEach((id) => { const li = cases.find(c => c.id === id); if (li) list.appendChild(li); });
        const n = cases.filter(li => !li.hidden).length;
        if (selectedEl) {
            selectedEl.textContent = n
                ? `Selected for this ad: ${n} of the ${cases.length} case studies, the most relevant first. All of them are on the case studies page.`
                : 'No case study maps to this ad. All of them are on the case studies page.';
        }
    };
    const setLink = (url) => {
        link = url;
        if (linkEl) linkEl.textContent = url;
        if (addressEl) addressEl.textContent = url;
        try { history.replaceState(history.state, '', url); } catch (e) { /* the link still works */ }
    };

    const row = (label, body, cls) => `<div class="bf-row${cls ? ' ' + cls : ''}"><div class="bf-req">${label}</div><div class="bf-ev">${body}</div></div>`;
    const block = (cls, heading, rows) => (rows.length
        ? `<div class="bf-map ${cls}"><h4 class="mono-label bf-map-h">${heading}</h4>${rows.join('')}</div>` : '');
    const evidence = (items) => items.map(e => (e.href
        ? `<a href="${escHtml(e.href)}"${e.part ? ' class="bf-part"' : ''}>${escHtml(e.t)}</a>`
        : `<span>${escHtml(e.t)}</span>`)).join('');

    const render = (a) => {
        const found = a.met.concat(a.matched);
        const matchHtml = block('bf-matches', 'What you asked for → what backs it',
            found.map(m => row(escHtml(m.label), evidence(m.ev))));
        const gapHtml = block('bf-gaps', 'Gaps — what this site does not show', a.gaps.map(g => row(
            escHtml(g.label) + (g.hard ? '' : ' <span class="bf-soft">nice to have</span>'),
            `<span class="bf-miss">${escHtml(g.text)}</span>`, 'bf-row-gap')));
        let html = `<div class="bf-grade bf-grade-${a.cls}">${a.grade ? `<span class="bf-grade-tag">${escHtml(a.grade)}</span>` : ''}<p>${escHtml(a.blurb)}</p></div>`;
        // Hard gaps explain a capped grade, so they come before the matches
        // that would otherwise bury them. With none, the matches lead.
        html += a.hard.length ? gapHtml + matchHtml : matchHtml + gapHtml;
        html += block('bf-confirm', 'Confirm with Moses — not stated on this site',
            a.confirm.map(c => row(escHtml(c), '<span class="bf-ask">Not stated on this site. Confirm with Moses.</span>', 'bf-row-gap')));
        if (a.cls === 'high' || a.cls === 'workable') {
            const subject = encodeURIComponent(`Fit for your role — ${found.length} matching areas`);
            const body = encodeURIComponent(`Hi Moses,\n\nI ran your in-browser fit-check against a role and it flagged ${found.length} matching areas${a.gaps.length ? ` (and ${plural(a.gaps.length, 'gap')})` : ''}. I'd like to talk.\n\n${link}\n`);
            html += `<p class="bf-cta"><a class="ca-btn ca-btn-primary" href="mailto:${escHtml(DATA.email)}?subject=${subject}&amp;body=${body}" data-analytics="brief-contact">This looks like a fit — get in touch</a></p>`;
        }
        html += '<p class="bf-note">Deterministic matching against a hand-written evidence set and the facts on this site: no AI; the ad is never sent. Anything the site does not show is a gap, not a guess. A starting point for a conversation, not a verdict.</p>';
        result.innerHTML = html;
        fit.hidden = false;
        if (shareBar) shareBar.hidden = false;
        showCases(selectCases(a.matched));
    };
    // What a screen reader hears: a line, not the whole fit.
    const say = (line) => { if (msg) msg.textContent = line; };

    const grade = () => {
        const a = analyse(input.value);
        if (a.status !== 'graded') {
            say(a.status === 'empty'
                ? 'Paste a job description first. The requirements section is the part that matters.'
                : `That is ${plural(a.words, 'word')}, too few to grade honestly. Paste the requirements section: ${RULES.minWords} words or more.`);
            fit.hidden = true;
            if (shareBar) shareBar.hidden = true;
            if (clearBtn) clearBtn.hidden = a.status === 'empty';
            setLink(base);
            showCases(null);
            return null;
        }
        setLink(`${base}?focus=${focusOf(a)}`);
        render(a);
        say(`Graded: ${a.grade}. The fit and the dossier are below.`);
        if (clearBtn) clearBtn.hidden = false;
        // count.js records that the Brief was run, and the grade it gave
        // (never the ad); with count.js blocked there is no mks.track, and
        // nothing to record them in.
        track('brief-run');
        track('brief-' + a.cls);
        return a;
    };

    if (runBtn && input) runBtn.addEventListener('click', grade);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            fit.hidden = true;
            result.innerHTML = '';
            say('');
            if (shareBar) shareBar.hidden = true;
            clearBtn.hidden = true;
            setLink(base);
            showCases(null);
            input.focus();
        });
    }

    // Instant demo: a sample ad from the rubric, graded.
    document.querySelectorAll('.bf-sample').forEach((b) => {
        b.addEventListener('click', () => {
            const sample = RULES.samples.find(s => s.id === b.getAttribute('data-sample'));
            input.value = sample ? sample.text : '';
            grade();
            const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (fit.scrollIntoView) fit.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
        });
    });

    // Copy link: the button says it worked, then puts back its own words.
    const copyBtn = $('briefCopy');
    if (copyBtn) {
        const words = copyBtn.innerHTML;
        let timer;
        const flash = (msg) => {
            clearTimeout(timer);
            copyBtn.textContent = msg;
            timer = setTimeout(() => { copyBtn.innerHTML = words; }, 1700);
        };
        copyBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(link);
                    return flash('Copied ✓');
                }
            } catch (e) { /* fall through to the old way */ }
            try {
                const ta = document.createElement('textarea');
                ta.value = link; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.focus(); ta.select();
                document.execCommand('copy'); ta.remove();
                flash('Copied ✓');
            } catch (e) { flash('Copy failed'); }
        });
    }
    const printBtn = $('briefPrint');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // A shared link: the same fit and dossier, rebuilt from its ids.
    const focus = new URLSearchParams(location.search).get('focus');
    const shared = focus ? fromFocus(focus) : null;
    if (shared) {
        setLink(`${base}?focus=${focusOf(Object.assign({}, shared, { status: 'graded' }))}`);
        render(shared);
        if (clearBtn) clearBtn.hidden = false;
        track('brief-shared');
    }
})();
