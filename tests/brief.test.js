// Tests for The Brief (brief.html, brief.js): paste a job ad, get an honest
// fit and a dossier to print or forward, and a link that rebuilds both.
//
// It began as the Assay on the homepage, which counted keyword hits and
// called three a "High-grade match". An ad asking for fluent Dutch, five
// years at a Big Four firm and SAP got top marks with no gaps, because
// nothing looked for what the site cannot show. Every case that held the
// Assay honest holds the Brief now, reading its rubric from
// content/brief.json: the reported ad is graded down with every gap
// listed, ads that do fit still grade well with evidence that links
// somewhere real, a scrap of text is not graded at all, and — the rule the
// whole site runs on — no gap line states a fact about Moses that content/
// does not hold.
//
// And what the Brief adds: the dossier says nothing content/ does not, word
// for word, and reads whole without JavaScript; the shared link carries
// ids from the rubric and never the ad, ignores ids it does not know, and
// rebuilds the same dossier and gaps; and nothing is sent, the visit's
// count included, that carries a word of the ad.
//
// Run with: node tests/brief.test.js

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const content = require('../scripts/lib/content.js');
const { glanceFacts } = require('../scripts/build-content.js');

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

const profileRaw = read('content/profile.json');
const profile = JSON.parse(profileRaw);
const brief = JSON.parse(read('content/brief.json'));
const projects = JSON.parse(read('content/projects.json'));
const HTML = read('brief.html');
const BRIEF_JS = read('brief.js');
const COUNT_JS = read('count.js');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

// A fixed "today", so the open-ended role counts the same months every run.
const NOW = new Date(2026, 8, 26);

/**
 * brief.html as a browser runs it: the counter, then the page's script,
 * at `search` (a shared link's ?focus=…). Every way out to the network is
 * counted, with what it carried.
 */
function boot(search = '', before) {
    const dom = new JSDOM(HTML, { runScripts: 'outside-only', pretendToBeVisual: true, url: `https://example.com/brief.html${search}` });
    const w = dom.window;
    const errors = [];
    const sent = [];
    w.addEventListener('error', e => errors.push(e.error || e.message));
    w.console.error = (...a) => errors.push(a.join(' '));
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.fetch = (url, opts) => { sent.push({ url: String(url), body: String((opts && opts.body) || '') }); return Promise.resolve({ ok: true }); };
    w.navigator.sendBeacon = (url, body) => { sent.push({ url: String(url), body: String(body || '') }); return true; };
    w.XMLHttpRequest = function () { this.open = (m, url) => { this.url = url; }; this.send = (body) => sent.push({ url: String(this.url), body: String(body || '') }); this.setRequestHeader = () => {}; };
    w.document.documentElement.classList.add('js');
    if (before) before(w);
    try { w.eval(COUNT_JS); w.eval(BRIEF_JS); } catch (e) { errors.push(e); }
    return { window: w, doc: w.document, errors, sent };
}

const page = boot();
const doc = page.doc;
const A = page.window.mks.brief;
assert(!!A && typeof A.analyse === 'function' && typeof A.fromFocus === 'function', 'Setup: the Brief exposes its analysis as window.mks.brief');
assert(page.errors.length === 0, `Setup: the page boots without errors (${page.errors.map(String).join('; ') || 'none'})`);
const analyse = (t, opts) => A.analyse(t, Object.assign({ now: NOW }, opts));

// The water sample, as its button pastes it.
const SAMPLE_WATER = brief.samples.find(s => s.id === 'water').text;

// The ads, as a recruiter would paste them.
const ADS = {
    dutch: [
        'Senior ESG Reporting Consultant — Amsterdam',
        'Join our sustainability practice and help clients prepare for CSRD and ESRS reporting.',
        'What you bring:',
        '- Fluent Dutch and English, written and spoken',
        '- 5+ years of experience at a Big Four firm',
        '- Hands-on experience with SAP Sustainability Control Tower',
        '- Strong knowledge of GHG accounting and double materiality assessments',
        '- Experience engaging stakeholders at board level'
    ].join('\n'),
    ai: [
        'Researcher, Sustainable AI',
        'Our university research group studies the environmental footprint of generative AI.',
        'You will:',
        '- Estimate the energy, water and carbon footprint of large language model (LLM) use',
        '- Develop an AI governance framework aligned with CSRD and ESRS disclosure',
        '- Build decision-support prototypes and test them with users in workshops',
        '- Publish research on responsible AI and Scope 2 and Scope 3 emissions',
        'You have:',
        '- An MSc in environmental science, data science or a related field',
        '- Experience with Python and data analysis',
        '- Strong stakeholder engagement and facilitation skills'
    ].join('\n'),
    wash: [
        'WASH Programme Officer — Sierra Leone',
        'Lead our rural water supply programme.',
        'Responsibilities:',
        '- Manage borehole drilling and the rehabilitation of hand-dug wells',
        '- Run hydrogeology surveys, including electrical resistivity, to site boreholes',
        '- Produce GIS maps of groundwater potential in QGIS',
        '- Coordinate with communities and district stakeholders',
        'Requirements:',
        '- Degree in geology, hydrogeology or water resources',
        '- At least one year of field experience in WASH'
    ].join('\n'),
    // Every rule at least once, for the "no invented facts" sweep below.
    everything: [
        'Head of ESG — Director level. Minimum of 7 years of relevant experience.',
        'Native German speaker, business-level French, B2 Spanish.',
        'Experience with Workiva, Enablon and Salesforce Net Zero Cloud.',
        'Background in management consulting; Deloitte or KPMG alumni welcome.',
        'Financial modelling and valuation skills. PhD in economics required. Law degree an advantage.',
        'You must hold the right to work in the EU; no visa sponsorship. Security clearance and a driving licence required. Willing to relocate.',
        'CSRD, GHG accounting, climate risk and stakeholder engagement.'
    ].join('\n')
};

// ===================================================================
// The ad that was reported
// ===================================================================
{
    const a = analyse(ADS.dutch);
    assert(a.status === 'graded', 'Dutch/Big Four/SAP ad: it is long enough to grade');
    assert(a.grade === 'Marginal match' && a.cls === 'marginal', `Dutch/Big Four/SAP ad: graded "Marginal match", as the Assay graded it (got "${a.grade}")`);
    const labels = a.hard.map(g => g.label).join(' | ');
    assert(/^Dutch\b/.test(labels) || / \| Dutch\b/.test(labels), `Dutch/Big Four/SAP ad: fluent Dutch is a hard gap (${labels})`);
    assert(/5\+ years/.test(labels), `Dutch/Big Four/SAP ad: 5+ years is a hard gap (${labels})`);
    assert(/Big Four/.test(labels), `Dutch/Big Four/SAP ad: Big Four experience is a hard gap (${labels})`);
    assert(/\bSAP\b/.test(labels), `Dutch/Big Four/SAP ad: SAP is a hard gap (${labels})`);
    assert(a.hard.length === 4, `Dutch/Big Four/SAP ad: with 4 gaps, as the Assay listed them (${a.hard.length})`);
    assert(a.matched.length >= 3, `Dutch/Big Four/SAP ad: the real overlap is still credited (${a.matched.length} areas)`);

    const dutch = a.hard.find(g => /^Dutch/.test(g.label));
    assert(dutch && /not evidenced on this site/i.test(dutch.text) && /ask Moses/i.test(dutch.text),
        `Dutch/Big Four/SAP ad: the language gap says it is not evidenced and to ask (${dutch && dutch.text})`);

    // The same ad squeezed onto one line is too short to grade honestly.
    const short = analyse('Fluent Dutch · 5+ years Big Four · SAP');
    assert(short.status === 'short', `One-line version: asks for more text rather than grading (${short.status})`);
}

// ===================================================================
// Ads that do fit still grade well, with evidence that links somewhere
// ===================================================================
const idsIn = (html) => new Set((html.match(/\sid="([^"]+)"/g) || []).map(m => m.slice(5, -1)));
const pageIds = {};
function resolves(href) {
    if (href.startsWith('#')) return false;   // into the Brief itself: the evidence is on other pages
    const [file, hash] = href.split('#');
    if (!fs.existsSync(path.join(ROOT, file))) return false;
    if (!hash) return true;
    if (!pageIds[file]) pageIds[file] = idsIn(read(file));
    return pageIds[file].has(hash);
}

[['ai', 'sustainable-AI research ad', /Sustainable AI/], ['wash', 'WASH / water-resources ad', /Water resources/]].forEach(([key, name, area]) => {
    const a = analyse(ADS[key]);
    assert(a.cls === 'high', `${name}: a High-grade match (got "${a.grade}": ${a.blurb})`);
    assert(a.hard.length === 0, `${name}: no hard gaps (${a.hard.map(g => g.label).join(', ') || 'none'})`);
    assert(a.matched.some(m => area.test(m.label)), `${name}: the defining area is matched`);
    const ev = a.matched.concat(a.met).reduce((all, m) => all.concat(m.ev), []);
    const linked = ev.filter(e => e.href);
    assert(linked.length >= a.matched.length, `${name}: evidence links to where it is shown (${linked.length} links)`);
    const broken = linked.filter(e => !resolves(e.href)).map(e => e.href);
    assert(broken.length === 0, `${name}: every evidence link resolves to a real page and id (${broken.join(', ') || 'all do'})`);
});
{
    const a = analyse(ADS.wash);
    const qgis = a.met.find(m => m.label === 'QGIS');
    assert(qgis && qgis.ev.length === 1 && resolves(qgis.ev[0].href),
        `WASH ad: QGIS is matched to where the homepage shows it (${qgis && qgis.ev[0].t})`);
    // The toolkit says its GIS proof is on request, with no public GIS
    // project yet: the Assay showed that line with a green tick.
    assert(qgis && qgis.ev[0].part === true && /no public/.test(qgis.ev[0].t), `WASH ad: QGIS's proof, with no public project, is marked partial (${qgis && qgis.ev[0].t})`);
    const python = a.met.find(m => m.label === 'Python');
    assert(!python || python.ev.every(e => !e.part), 'WASH ad: a proof with public work behind it is not marked partial');
    const years = a.met.find(m => /year of experience/.test(m.label));
    assert(years && years.ev[0].href === 'index.html#experience', `WASH ad: "at least one year" is met, pointing at the homepage's experience section (${years && years.ev[0].href})`);

    const input = doc.getElementById('briefAd');
    const result = doc.getElementById('briefResult');
    input.value = ADS.wash;
    doc.getElementById('briefRun').click();
    const rowOf = (label) => Array.from(result.querySelectorAll('.bf-matches .bf-row')).find(r => r.querySelector('.bf-req').textContent === label);
    const drawn = rowOf('QGIS');
    assert(!!drawn && !!drawn.querySelector('.bf-ev a.bf-part') && Array.from(result.querySelectorAll('.bf-matches .bf-ev a:not(.bf-part)')).length > 0,
        'Page: the QGIS row\'s proof is drawn partial (brief.css gives it the amber "?"), the rest ticked');
}

// ===================================================================
// Too little text is not graded
// ===================================================================
{
    assert(analyse('ESG analyst, CSRD, Python').status === 'short', 'A tiny ad asks for more text');
    assert(analyse('   ').status === 'empty', 'An empty box asks for a job description');

    const input = doc.getElementById('briefAd');
    input.value = 'ESG analyst, CSRD, Python';
    doc.getElementById('briefRun').click();
    const msg = doc.getElementById('briefMsg');
    assert(doc.getElementById('briefFit').hidden && /too few to grade/.test(msg.textContent) && doc.getElementById('briefShare').hidden,
        `Page: a tiny ad says "too few to grade", with no grade and no link to share (${text(msg).slice(0, 60)})`);
    assert(page.window.location.search === '', `Page: and the address carries no focus for it (${page.window.location.search})`);
}

// ===================================================================
// Nice-to-haves are listed but do not cap the grade
// ===================================================================
{
    const a = analyse(ADS.ai + '\nNice to have:\n- Experience with Workiva\n- Dutch is a plus');
    const soft = a.gaps.filter(g => !g.hard).map(g => g.label);
    assert(soft.includes('Workiva') && soft.includes('Dutch'), `Soft gaps: listed (${soft.join(', ')})`);
    assert(a.cls === 'high', `Soft gaps: do not cap the grade (got "${a.grade}")`);

    const inline = analyse(ADS.ai + '\nRequired: SAP');
    assert(inline.hard.some(g => g.label === 'SAP'), '"Required: SAP" is a requirement, not a heading to skip');

    const capped = analyse(ADS.ai + '\n- Workiva experience required');
    assert(capped.cls !== 'high' && capped.hard.some(g => g.label === 'Workiva'),
        `A hard gap caps the grade, however strong the rest (got "${capped.grade}")`);
}

// ===================================================================
// Right to work and the like: never guessed, always "confirm"
// ===================================================================
{
    const a = analyse(ADS.everything);
    ['Right to work', 'Visa sponsorship', 'Security clearance', 'Driving licence', 'Relocation'].forEach((label) => {
        assert(a.confirm.includes(label), `Confirm: "${label}" is listed to confirm with Moses`);
    });
    assert(/Still to confirm/.test(a.blurb), 'Confirm: the summary says what is still to confirm');
}

// ===================================================================
// Words that look like requirements but are not
// ===================================================================
{
    const base = ADS.ai + '\n';
    const cases = [
        ['You will advise the Dutch Ministry of Finance on its reporting.', g => /^Dutch/.test(g.label), 'a Dutch ministry is not a Dutch-language requirement'],
        ['Our R&D team builds carbon models.', g => g.label === 'R', '"R&D" is not the R language'],
        ['You excel at explaining numbers to non-specialists.', g => g.label === 'Excel', '"excel at" is not Excel'],
        ['An MSc or PhD in environmental science.', g => g.label === 'A PhD', '"MSc or PhD" does not require a PhD'],
        ['You will report to the Head of Sustainability.', g => /Director/.test(g.label), 'reporting to a head of is not being one'],
        ['As one of the Big Four, we offer a structured career path.', g => /Big Four/.test(g.label), 'an employer describing itself is not a requirement'],
        ['This is a 2-year contract with the option to extend.', g => /year/.test(g.label), 'a contract length is not an experience requirement']
    ];
    cases.forEach(([line, isWrong, why]) => {
        const a = analyse(base + line);
        const wrong = a.gaps.filter(isWrong).map(g => g.label);
        assert(wrong.length === 0, `No false gap: ${why} (${wrong.join(', ') || 'none'})`);
    });

    // The employer describing itself, where an ad does: at the top. Each of
    // these used to be a hard gap that cut a High-grade fit to Workable.
    const language = g => /^(Dutch|German|French)\b/.test(g.label);
    const years = g => /years? of experience/.test(g.label);
    [
        ['For over 20 years, we have helped governments make better decisions.', years, 'the firm\'s own history is not an experience requirement'],
        ['We have been active in the water sector for 25 years.', years, '"we … for 25 years" is the employer, not the applicant'],
        ['Our team has over 15 years of industry experience.', years, 'the team\'s experience is not the applicant\'s'],
        ['Dutch Ministry of Finance', language, 'a four-word line naming a Dutch ministry is not a language requirement'],
        ['Employer: Dutch Tax Authority', language, 'a Dutch authority is not a language requirement'],
        ['Client: German Federal Ministry', language, 'a German ministry is not a language requirement'],
        ['Location: Amsterdam, Dutch office', language, 'a Dutch office is not a language requirement'],
        ['You will work with German and French partners, in fluent English.', language, '"fluent" belongs to English, not to the partners\' nationalities'],
        // The team's languages, and the one to apply in, are not the
        // applicant's: each of these cut a High-grade fit to Workable or
        // Marginal with one or two false hard gaps.
        ['Our team works in English, Dutch and French.', language, 'the languages the team works in are not a requirement'],
        ['Our team speaks English, Dutch and German.', language, 'the languages the team speaks are not a requirement'],
        ['We are an international team working in English and Dutch.', language, 'an international team describing itself asks for no language'],
        ['Our working language is English, and many colleagues also speak Dutch.', language, 'what colleagues also speak is not asked of the applicant'],
        ['Applications in English or Dutch are welcome.', language, 'the language to apply in is not one the job needs'],
        ['Please apply in English or French.', language, '"apply in French" is not a French requirement']
    ].forEach(([line, isWrong, why]) => {
        const a = analyse(line + '\n' + ADS.ai);
        const wrong = a.gaps.filter(isWrong).map(g => g.label);
        assert(wrong.length === 0 && a.cls === 'high', `No false gap: ${why} (${wrong.join(', ') || 'none'}; "${a.grade}")`);
    });
    // Nor does the team's language put English on the list to confirm, or
    // count as a requirement line the site does not answer.
    const plain = analyse(ADS.ai);
    const team = analyse('Our team works in English, Dutch and French.\n' + ADS.ai);
    assert(!team.confirm.length && team.coverage.asked === plain.coverage.asked && team.coverage.answered === plain.coverage.answered,
        `Languages: the team's languages change neither coverage nor what to confirm (${team.coverage.answered}/${team.coverage.asked}, confirm: ${team.confirm.join(', ') || 'none'})`);
    // …while the employer's voice still asks where it says so.
    [
        ['Our ideal candidate speaks fluent Dutch.', 'Dutch (C1 / fluent)', true],
        ['We require fluent Dutch.', 'Dutch (C1 / fluent)', true],
        ['Our working language is Dutch.', 'Dutch', true],
        ['Our office language is Dutch, so fluency is essential.', 'Dutch', true]
    ].forEach(([line, label, hard]) => {
        const a = analyse(ADS.ai + '\n' + line);
        assert(a.gaps.some(g => g.label === label && g.hard === hard), `Languages: "${line}" still asks for ${label} (${a.gaps.map(g => g.label).join(', ') || 'no gaps'})`);
    });
    // …while the same words addressed to the applicant still ask.
    const asked = analyse('We are looking for someone with 5+ years of experience.\n' + ADS.ai);
    assert(asked.hard.some(g => /^5\+ years/.test(g.label)), 'Years: "we are looking for someone with 5+ years" is still a requirement');
    const plusGerman = analyse(ADS.ai + '\nFluent English required, German a plus');
    assert(plusGerman.gaps.some(g => g.label === 'German' && !g.hard), `Languages: "…, German a plus" is still a soft German gap (${plusGerman.gaps.map(g => g.label).join(', ')})`);
    const listed = analyse(ADS.ai + '\nDutch, fluent');
    assert(listed.hard.some(g => g.label === 'Dutch (C1 / fluent)'), 'Languages: "Dutch, fluent" asks for fluent Dutch');
    const yearsOnly = analyse(base + 'At least three years of experience in sustainability research.');
    assert(yearsOnly.hard.some(g => /^3\+ years/.test(g.label)), 'Years: "at least three years" is read as 3+');
    const range = analyse(base + '3-5 years of relevant experience.');
    assert(range.gaps.some(g => /^3\+ years/.test(g.label)), 'Years: "3-5 years" asks for the lower bound');
}

// ===================================================================
// English: the site's own language, its level not stated
// ===================================================================
{
    // An English line used to count as a requirement nothing answered, so
    // one "Excellent English." flipped a good fit down a grade and the
    // summary called five matched areas "thin".
    const ad = SAMPLE_WATER + ' Requirements: 3+ years of experience in WASH. Must have the right to work in the Netherlands. Excellent English.';
    const a = analyse(ad);
    const without = analyse(ad.replace(' Excellent English.', ''));
    assert(a.coverage.asked === without.coverage.asked && a.grade === without.grade,
        `English: "Excellent English." is not graded (${a.coverage.answered}/${a.coverage.asked} "${a.grade}" vs ${without.coverage.answered}/${without.coverage.asked} "${without.grade}")`);
    assert(a.confirm.includes('Level of English') && a.gaps.every(g => !/English/.test(g.label)),
        `English: listed to confirm with Moses, never a gap (${a.confirm.join(', ')})`);
    assert(/level of English/.test(a.blurb), `English: the summary names it as still to confirm, capitalised (${a.blurb})`);
    const wash = analyse(ADS.wash + '\n- Excellent written and spoken English');
    assert(wash.cls === 'high' && wash.coverage.asked === analyse(ADS.wash).coverage.asked,
        `English: a fitting ad with an English line keeps its grade and its coverage (${wash.grade}, ${wash.coverage.answered}/${wash.coverage.asked})`);
    const stated = analyse(ad, { facts: Object.assign({}, A.FACTS, { languages: [{ language: 'English', level: 'C2' }] }) });
    assert(stated.met.some(m => /^English/.test(m.label)) && !stated.confirm.includes('Level of English'),
        'English: once profile.json states a level, it is matched like any other language');

    const thin = analyse(SAMPLE_WATER + ' Excellent negotiation skills. Strong sales experience.');
    assert(thin.cls === 'marginal' && thin.matched.length >= 2 && !/\bthin\b/.test(thin.blurb) && /answers only 1 of 3/.test(thin.blurb),
        `Summary: a Marginal grade with several matched areas says what is unanswered, not that the overlap is "thin" (${thin.blurb})`);
}

// ===================================================================
// Another field: general skills alone are not a fit
// ===================================================================
{
    // Five of the areas (stakeholders, data, delivery, international,
    // research) are in almost every office job. An HR and an ERP ad used to
    // grade "High-grade match" on them alone, with the "looks like a fit"
    // button and a copyable result saying so.
    const OFF_FIELD = {
        hr: 'HR Business Partner. You will support managers with workforce planning and employee engagement. Requirements: strong stakeholder management, experience facilitating workshops, a research mindset and data analysis skills in Excel. International environment.',
        erp: 'ERP Implementation Consultant. You will lead the implementation of our finance platform for international clients. Requirements: experience with data analysis and statistics, strong stakeholder engagement and workshop facilitation skills, and research skills to document requirements. You manage project delivery across multiple communities of users.',
        marketing: ['Marketing Manager', 'We are a fast-growing international consumer brand.', 'Responsibilities:',
            '- Develop and deliver integrated marketing campaigns', '- Manage cross-functional collaboration with product and sales',
            '- Analyse campaign performance using data analytics tools', '- Lead community engagement on social channels', 'Requirements:',
            '- Bachelor\'s degree in marketing', '- Experience with project management', '- Strong analytical skills and a research mindset',
            '- Excellent written and verbal communication'].join('\n'),
        itpm: ['IT Project Manager', 'You will lead the implementation of a new CRM system for our international client base.', 'Requirements:',
            '- Proven project management experience (PRINCE2 or Agile)', '- Strong stakeholder engagement across departments',
            '- Experience in data analysis and reporting', '- Excellent communication and collaboration skills'].join('\n')
    };
    Object.entries(OFF_FIELD).forEach(([key, ad]) => {
        const a = analyse(ad);
        assert(a.grade === 'Different field', `Another field (${key}): graded "Different field", not a fit (got "${a.grade}": ${a.blurb})`);
        assert(a.matched.every(m => m.general), `Another field (${key}): only general areas matched (${a.matched.map(m => m.label).join(', ')})`);
    });
    doc.getElementById('briefAd').value = OFF_FIELD.hr;
    doc.getElementById('briefRun').click();
    assert(!doc.querySelector('#briefResult [data-analytics="brief-contact"]'), 'Another field: no "looks like a fit" button');

    // One domain area is enough for Workable, two for High: an ad in the
    // field, but only at its edge, is not the top grade.
    const edge = analyse('Data Analyst. You will build dashboards in Python and SQL, run statistical data analysis, work with stakeholders across the business and present research findings. Some GIS work on customer locations. Requirements: experience in data analysis, strong stakeholder skills, a research background.');
    assert(edge.cls !== 'high', `One domain area (GIS) among general ones: not the top grade (got "${edge.grade}")`);
    assert(A.RULES.high.domain >= 2 && A.RULES.workable.domain >= 1, 'Rules: High needs two domain areas, Workable one');
    assert(!A.RULES.strengths.some(s => s.syn.includes('implementation')), 'Rules: the bare word "implementation" is not field operations');
}

// ===================================================================
// No gap line states a fact about Moses that content/ does not hold
// ===================================================================
{
    // The conservative count, done independently of the script.
    const skip = /\b(?:intern|internship|cohort|accelerator|trainee|volunteer|student)\b/i;
    const m = (ym) => { const [y, mo] = ym.split('-').map(Number); return y * 12 + mo - 1; };
    const current = NOW.getFullYear() * 12 + NOW.getMonth();
    const counted = profile.experience.filter(r => !skip.test(r.title));
    const months = counted.reduce((n, r) => n + ((r.end ? m(r.end) : current) - m(r.start)), 0);

    const sweep = [ADS.dutch, ADS.everything, ADS.ai + '\n- 10+ years of experience'];
    sweep.forEach((ad, i) => {
        const a = analyse(ad);
        const lines = a.gaps.map(g => g.text).concat(a.confirm);
        // Every number in a gap line comes from the ad, from profile.json, or
        // from the month count above.
        const allowed = new Set((ad.match(/\d+/g) || []).concat(profileRaw.match(/\d+/g) || [],
            [String(Math.floor(months / 12)), String(months % 12), String(months)]));
        const invented = [];
        lines.forEach(t => (t.match(/\d+/g) || []).forEach(n => { if (!allowed.has(n)) invented.push(`${n} in "${t.slice(0, 50)}"`); }));
        assert(invented.length === 0, `Facts sweep ${i + 1}: no number in a gap line that content/ or the ad does not hold (${invented.join('; ') || 'none'})`);

        // Nothing asserts an ability or a lack of one: gaps say what the
        // site does not show, and send the reader to Moses.
        const asserting = lines.filter(t => /\b(?:speaks|has used|hasn't used|hasn’t used|never used|is fluent|cannot|can't|is not a|holds a)\b/i.test(t));
        assert(asserting.length === 0, `Facts sweep ${i + 1}: no gap line asserts what Moses can or cannot do (${asserting.join(' / ') || 'none'})`);
        const unsourced = a.gaps.filter(g => !/(ask|confirm with) Moses/i.test(g.text));
        assert(unsourced.length === 0, `Facts sweep ${i + 1}: every gap sends the reader to Moses (${unsourced.map(g => g.label).join(', ') || 'all do'})`);

        // Role titles and dates named in a years gap are profile.json's own.
        a.gaps.filter(g => /years? of experience/.test(g.label)).forEach((g) => {
            profile.experience.forEach((r) => {
                assert(g.text.includes(r.title), `Facts sweep ${i + 1}: the years gap names "${r.title}" from profile.json`);
            });
            counted.forEach((r) => {
                assert(g.text.includes(r.displayDates), `Facts sweep ${i + 1}: the years gap gives ${r.title}'s dates as profile.json does (${r.displayDates})`);
            });
            const y = Math.floor(months / 12);
            const said = g.text.match(/about (\d+) years?(?: (\d+) months?)?/i);
            assert(said && Number(said[1]) === y && Number(said[2] || 0) === months % 12,
                `Facts sweep ${i + 1}: the years gap states the count content/ gives (${said && said[0]}, expected ${y} years ${months % 12} months)`);
        });

        // Degrees named in a gap are profile.json's degrees.
        a.gaps.filter(g => /degrees listed/.test(g.text)).forEach((g) => {
            profile.education.forEach((e) => assert(g.text.includes(e.degree), `Facts sweep ${i + 1}: "${g.label}" lists ${e.degree} from profile.json`));
        });

        // With no languages in profile.json, a language gap claims no level.
        if (!profile.languages) {
            a.gaps.filter(g => /^(Dutch|German|French|Spanish)\b/.test(g.label)).forEach((g) => {
                assert(g.text === 'Not evidenced on this site. Ask Moses.', `Facts sweep ${i + 1}: "${g.label}" claims no level Moses has not stated (${g.text})`);
            });
        }
    });

    // The strengths' own evidence lines link somewhere real (the validator
    // refuses one that does not: below). Their figures ("164 water points",
    // "a 70% aquifer strike rate") are held to the claims ledger, entry by
    // entry, by the validator and in tests/claims.test.js: asking only
    // whether each number appeared somewhere on the site let 164 become 200.
    const broken = [];
    A.RULES.strengths.forEach(s => s.ev.forEach((e) => {
        if (e.href && !resolves(e.href)) broken.push(`link ${e.href} (${e.t.slice(0, 40)})`);
    }));
    assert(broken.length === 0, `Evidence: every link in a strength's evidence resolves (${broken.join('; ') || 'all'})`);
}

// ===================================================================
// The validator holds the rubric to the case studies and the ledger
// ===================================================================
{
    const data = content.loadAll();
    const check = (edit) => {
        const b = JSON.parse(JSON.stringify(data.brief));
        edit(b);
        return content.checkBrief(b, { projects: data.projects, research: data.research, claims: data.claims.claims, indexHtml: read('index.html') });
    };
    assert(check(() => {}).length === 0, 'Validator: content/brief.json as committed passes');
    const water = data.brief.strengths.findIndex(s => s.id === 'water');
    const climate = data.brief.strengths.findIndex(s => s.id === 'climate-risk');
    assert(check(b => { b.strengths[water].ev[0].t = b.strengths[water].ev[0].t.replace('164', '200'); }).some(p => /"200" is a figure the claims ledger does not hold/.test(p)),
        'Validator: an evidence line whose figure drifts from the ledger (164 → 200 water points) is refused');
    assert(check(b => { b.strengths[climate].ev[0].href = '#un-disaster'; }).some(p => /"#un-disaster" is not a case study/.test(p)),
        'Validator: a link written for the homepage ("#un-disaster") is refused: the Brief is a page of its own');
    assert(check(b => { b.strengths[climate].ev[0].href = 'index.html#nowhere'; }).some(p => /index\.html#nowhere/.test(p)),
        'Validator: a link to a place the homepage does not have is refused');
    assert(check(b => { b.strengths[climate].ev[0].href = 'case-studies.html#atlantis'; }).some(p => /atlantis/.test(p)),
        'Validator: a link to a case study that does not exist is refused');
    assert(check(b => { b.strengths[climate].caseStudies = ['wuppertal']; }).some(p => /links to "un-disaster", so caseStudies must include it/.test(p)),
        'Validator: a strength selects every case study its evidence links to');
    assert(check(b => { b.strengths[climate].caseStudies = ['un-disaster', 'wuppertal', 'atlantis']; }).some(p => /"atlantis", which is not a case study/.test(p)),
        'Validator: a strength selects only case studies that exist');
    assert(check(b => { b.tools.push('Sap'); }).some(p => /id "sap" is tool "SAP"'s too/.test(p)),
        'Validator: two ids alike, which a shared link could not tell apart, are refused');
    assert(check(b => { b.gaps[0].id = 'more'; }).some(p => /id "more" is the shared link's/.test(p)),
        'Validator: "more", which a link uses for the rows it leaves out, is no rule\'s id');
    assert(check(b => { b.gaps[0].text = 'Not evidenced.'; }).some(p => /sends the reader to Moses/.test(p)),
        'Validator: a gap that does not send the reader to Moses is refused');
    assert(check(b => { b.gaps[0].re = '(unclosed'; }).some(p => /does not compile/.test(p)),
        'Validator: a pattern that does not compile is refused');
    assert(data.brief.strengths.every(s => Array.isArray(s.caseStudies)) && data.brief.strengths.some(s => s.caseStudies.length),
        'Rubric: every strength says which case studies it selects');
}

// ===================================================================
// Languages: the optional profile.json field, and its validator
// ===================================================================
{
    const facts = Object.assign({}, A.FACTS, { languages: [{ language: 'Dutch', level: 'B1' }] });
    const fluent = analyse(ADS.dutch, { facts });
    const dutch = fluent.hard.find(g => /^Dutch/.test(g.label));
    assert(dutch && /level listed on this site is B1/.test(dutch.text), `Languages: fluent Dutch against a stated B1 is a gap that quotes the stated level (${dutch && dutch.text})`);

    const basic = analyse(ADS.ai + '\n- Working knowledge of Dutch', { facts });
    const met = basic.met.find(x => /^Dutch/.test(x.label));
    assert(met && basic.gaps.every(g => !/^Dutch/.test(g.label)), 'Languages: a B1 requirement is met by a stated B1');

    const both = analyse(ADS.ai + '\n- Working knowledge of Dutch\n- Fluent Dutch for client meetings', { facts });
    assert(both.met.some(x => x.label === 'Dutch (B1)') && both.hard.some(g => g.label === 'Dutch (C1 / fluent)'),
        'Languages: asked at two levels, the one met is met and the one not is still a gap');

    const several = analyse(ADS.everything).gaps.map(g => g.label);
    assert(several.includes('German (native)') && several.includes('French (B2)') && several.includes('Spanish (B2)'),
        `Languages: each language is read at the level written beside it (${several.filter(l => /German|French|Spanish/.test(l)).join(', ')})`);

    assert(A.FACTS.languages === (profile.languages || null), 'Languages: the page carries what profile.json says (none today)');
    assert(content.checkLanguages(undefined).length === 0 && content.checkLanguages(null).length === 0, 'Validator: languages may be absent');
    assert(content.checkLanguages([{ language: 'Dutch', level: 'C1' }, { language: 'Krio', level: 'native' }]).length === 0, 'Validator: CEFR levels and "native" pass');
    assert(content.checkLanguages([{ language: 'Dutch', level: 'good' }]).length === 1, 'Validator: a level that is not CEFR is rejected');
    assert(content.checkLanguages([{ level: 'B2' }]).length === 1, 'Validator: an entry with no language is rejected');
    assert(content.checkLanguages('Dutch').length === 1, 'Validator: languages must be a list');
}

// ===================================================================
// The facts the page carries are profile.json's, and only those
// ===================================================================
{
    const data = JSON.parse(doc.getElementById('briefData').textContent);
    assert(JSON.stringify(Object.keys(data)) === '["rules","facts","toolEvidence","email"]', `Facts: #briefData holds the rubric, the facts, the tools' evidence and the address, and nothing else (${Object.keys(data).join(', ')})`);
    const titles = A.FACTS.experience.map(r => r.title).join('|');
    assert(titles === profile.experience.map(r => r.title).join('|'), 'Facts: the embedded roles are profile.json\'s, in order');
    assert(A.FACTS.degrees.join('|') === profile.education.map(e => e.degree).join('|'), 'Facts: the embedded degrees are profile.json\'s');
    assert(JSON.stringify(Object.keys(A.FACTS)) === '["languages","experience","degrees"]' && data.email === profile.person.email,
        'Facts: the roles, the degrees, the languages and the email, from profile.json');
    const notes = Object.keys(data.rules).filter(k => k.startsWith('$'));
    assert(notes.length === 0 && JSON.stringify(data.rules.strengths) === JSON.stringify(brief.strengths),
        `Facts: the rubric is content/brief.json's, its notes left out (${notes.join(', ') || 'none left in'})`);
}

// ===================================================================
// The page: gaps render as prominently as matches, and nothing is sent
// ===================================================================
{
    const input = doc.getElementById('briefAd');
    const result = doc.getElementById('briefResult');
    const before = page.sent.length;
    input.value = ADS.dutch;
    doc.getElementById('briefRun').click();

    const tag = result.querySelector('.bf-grade-tag');
    assert(tag && tag.textContent === 'Marginal match', `Page: the reported ad is graded "Marginal match" (${tag && tag.textContent})`);
    const gapRows = result.querySelectorAll('.bf-gaps .bf-row.bf-row-gap');
    const matchRows = result.querySelectorAll('.bf-matches .bf-row');
    assert(gapRows.length === 4, `Page: each hard gap is its own row (${gapRows.length})`);
    assert(Array.from(gapRows).every(r => r.querySelector('.bf-req') && r.querySelector('.bf-ev')),
        'Page: a gap row has the same label + evidence structure as a match row');
    const blocks = Array.from(result.querySelectorAll('.bf-map')).map(b => b.classList.contains('bf-gaps') ? 'gaps' : b.classList.contains('bf-matches') ? 'matches' : 'other');
    assert(blocks.indexOf('gaps') > -1 && blocks.indexOf('gaps') < blocks.indexOf('matches'), `Page: hard gaps come before the matches they cap (${blocks.join(' → ')})`);
    assert(matchRows.length > 0 && result.querySelectorAll('.bf-matches a[href]').length > 0, 'Page: matches link to their evidence');
    assert(!result.querySelector('a[href^="mailto:"][data-analytics="brief-contact"]'), 'Page: no "looks like a fit" button under a capped grade');
    assert(/Graded: Marginal match/.test(text(doc.getElementById('briefMsg'))), `Page: a short status says what it graded, for a screen reader (${text(doc.getElementById('briefMsg'))})`);
    assert(page.sent.length === before, `Page: grading sent nothing over the network (${page.sent.length - before} requests)`);

    // The sample buttons still produce a graded result.
    doc.querySelectorAll('.bf-sample').forEach((b) => {
        b.click();
        const t = result.querySelector('.bf-grade-tag');
        assert(t && /match/.test(t.textContent), `Page: the "${b.textContent.trim()}" sample grades (${t && t.textContent})`);
    });
    assert(doc.querySelectorAll('.bf-sample').length === brief.samples.length, `Page: a button for each of the rubric's ${brief.samples.length} samples`);
    assert(page.sent.length === before, 'Page: the samples sent nothing either');
}

// ===================================================================
// The dossier: content/'s words, selected and reordered, never rewritten
// ===================================================================
{
    const bare = new JSDOM(HTML).window.document;
    const items = Array.from(bare.querySelectorAll('#briefCases > li'));
    // Without JavaScript the page reads whole: every case study, in
    // projects.json's order, nothing hidden, and a line saying why there is
    // no grade.
    assert(JSON.stringify(items.map(li => li.id)) === JSON.stringify(projects.caseStudies.map(cs => cs.id)) && items.every(li => !li.hidden && !li.closest('[hidden]')),
        `No JavaScript: the dossier lists every case study, in the case studies' order (${items.map(li => li.id).join(', ')})`);
    const nojs = bare.querySelector('.nojs-note');
    assert(!!nojs && /needs JavaScript/.test(text(nojs)) && !nojs.closest('[hidden]'), `No JavaScript: a line says the grading needs JavaScript ("${text(nojs).slice(0, 50)}…")`);
    assert(/html:not\(\.js\) \.bf-input \{ display: none !important; \}/.test(read('brief.css')) && /html\.js \.nojs-note \{ display: none; \}/.test(read('carbon-ai.css')),
        'No JavaScript: the box to paste into is taken away, and the note shows only then');
    assert(bare.getElementById('briefFit').hidden && bare.getElementById('briefShare').hidden, 'No JavaScript: no fit and no link to share, which only a grade makes');

    // Every line about Moses is a string in content/, as written.
    const strings = new Set();
    const collect = (v) => { if (typeof v === 'string') strings.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
    fs.readdirSync(path.join(ROOT, 'content')).filter(f => f.endsWith('.json')).forEach(f => collect(JSON.parse(read(`content/${f}`))));
    const wrong = [];
    items.forEach((li) => {
        const cs = projects.caseStudies.find(c => c.id === li.id);
        const head = cs.results[0];
        const title = li.querySelector('h4 a');
        if (text(title) !== cs.title || title.getAttribute('href') !== `case-studies.html#${cs.id}`) wrong.push(`${cs.id}: title "${text(title)}"`);
        const when = text(li.querySelector('.bf-cs-when')).split(' · ');
        if (when[0] !== cs.period || (when[1] || undefined) !== cs.location) wrong.push(`${cs.id}: when "${when.join(' · ')}"`);
        if (text(li.querySelector('.bf-cs-claim')) !== head.claim) wrong.push(`${cs.id}: headline "${text(li.querySelector('.bf-cs-claim'))}"`);
        if (text(li.querySelector('.bf-check')) !== (head.verifiable ? 'Checkable from outside' : 'Not checkable from outside')) wrong.push(`${cs.id}: checkability`);
        const work = Array.from(li.querySelectorAll('.bf-cs-work a')).map(a => [text(a), a.getAttribute('href')]);
        const pub = cs.artifacts.filter(a => a.status === 'public' && a.url).map(a => [a.name, a.url]);
        if (JSON.stringify(work) !== JSON.stringify(pub)) wrong.push(`${cs.id}: public work ${JSON.stringify(work)}`);
        [title, li.querySelector('.bf-cs-claim')].concat(Array.from(li.querySelectorAll('.bf-cs-work a'))).forEach((el) => {
            if (!strings.has(text(el))) wrong.push(`${cs.id}: "${text(el)}" is not in content/`);
        });
    });
    assert(items.length === projects.caseStudies.length && wrong.length === 0, `Dossier: each case study is its title, dates and place, headline result, checkability and public work, as content/ writes them (${wrong.join('; ') || 'all are'})`);

    // The facts at a glance: profile.json's, a null one left out.
    const g = profile.atAGlance;
    const open = text(bare.querySelector('.bf-open'));
    assert(open === `Open to ${g.targetRoles}${g.workArea && g.workArea.length ? ` — ${g.workArea.join(', ')}` : ''}`, `Dossier: open to the roles profile.json names ("${open}")`);
    assert(text(bare.getElementById('dossierName')) === profile.person.name && text(bare.querySelector('.bf-role')) === profile.person.jobTitle, 'Dossier: the name and the title are profile.json\'s');
    const shown = Array.from(bare.querySelectorAll('.bf-facts > div')).map(d => [text(d.querySelector('dt')), text(d.querySelector('dd'))]);
    const want = glanceFacts(profile).map(([label, value]) => [label, text(new JSDOM(`<p>${value}</p>`).window.document.querySelector('p'))]);
    assert(JSON.stringify(shown) === JSON.stringify(want) && !shown.some(([label]) => /Seniority|Available|Right to work/.test(label) && g[{ Seniority: 'seniority', Available: 'availableFrom', 'Right to work': 'rightToWork' }[label]] === null),
        `Dossier: the at-a-glance facts profile.json states, a null one left out, not filled (${shown.map(s => s.join(': ')).join('; ')})`);
    const contact = bare.querySelector('.bf-contact');
    assert(!!contact.querySelector(`a[href="mailto:${profile.person.email}"][data-analytics]`) && !!contact.querySelector(`a[href="${profile.links.cv}"][download][data-analytics^="cv-download-"]`) &&
        !!contact.querySelector('a[href="index.html#contact"][data-analytics]'), 'Dossier: the email, the CV and the contact form, each counted when used');
    assert(/brief\.html$/.test(text(bare.getElementById('briefAddress'))), 'Dossier: the page\'s address, for paper');
}

// ===================================================================
// The shared link: ids in, the same dossier and gaps out, never the ad
// ===================================================================
const ID = new Set(['years'].concat(Object.keys(brief.grades), brief.strengths.map(s => s.id),
    brief.tools.map(t => A.slug(t.name || t)), brief.languages.map(l => A.slug(l.name || l)), brief.gaps.map(x => x.id), brief.confirm.map(x => x.id)));
const LEVELS = new Set(brief.levels.map(l => l.id));
/** What a page shows of a result: the grade, the rows, what to confirm and the dossier, in order. */
const shownOf = (d) => ({
    grade: text(d.querySelector('#briefResult .bf-grade-tag')),
    gaps: Array.from(d.querySelectorAll('#briefResult .bf-gaps .bf-row')).map(r => `${text(r.querySelector('.bf-req'))}: ${text(r.querySelector('.bf-ev'))}`),
    matches: Array.from(d.querySelectorAll('#briefResult .bf-matches .bf-row')).map(r => `${text(r.querySelector('.bf-req'))}: ${text(r.querySelector('.bf-ev'))}`),
    confirm: Array.from(d.querySelectorAll('#briefResult .bf-confirm .bf-req')).map(text),
    cases: Array.from(d.querySelectorAll('#briefCases > li')).filter(li => !li.hidden).map(li => li.id)
});
{
    const ads = [['the Dutch ad', ADS.dutch], ['the research ad', ADS.ai], ['the WASH ad', ADS.wash], ['the ad with every rule', ADS.everything],
        ['an ad with nice-to-haves', ADS.ai + '\nNice to have:\n- Experience with Workiva\n- Dutch is a plus'], ['the HR ad', 'HR Business Partner. You will support managers with workforce planning and employee engagement. Requirements: strong stakeholder management, experience facilitating workshops, a research mindset and data analysis skills in Excel. International environment.']];
    // The words the ids are made of: a link may say "big-four" because the
    // rubric names it so, never because the ad did.
    const idWords = new Set(Array.from(ID).concat(Array.from(LEVELS), ['met', 'gap', 'soft', 'ask']).flatMap(id => id.split('-')));
    ads.forEach(([what, plainAd]) => {
        // A line no rule reads, to be sure nothing of the ad rides along.
        const ad = `${plainAd}\nQuote reference ZEBRA-4471 to Quetzalcoatl Recruitment.`;
        const p = boot();
        p.doc.getElementById('briefAd').value = ad;
        p.doc.getElementById('briefRun').click();
        const url = p.window.location.href;
        const focus = new URL(url).searchParams.get('focus');
        const tokens = focus.split(',');
        // Only ids from content/brief.json: a kind, an id, a level or a count of years.
        const foreign = tokens.filter((t) => {
            const m = t.match(/^(?:(met|gap|soft|ask):)?([a-z0-9-]+)(?:\.([a-z0-9]+))?$/);
            if (!m || !ID.has(m[2])) return true;
            if (m[3] === undefined) return false;
            return m[2] === 'years' ? !/^\d{1,2}$/.test(m[3]) : !LEVELS.has(m[3]);
        });
        assert(foreign.length === 0, `Link (${what}): carries only ids from content/brief.json (${foreign.join(', ') || tokens.length + ' ids'})`);
        const said = decodeURIComponent(new URL(url).search).toLowerCase();
        const leaked = (ad.match(/[A-Za-z]{3,}|\d{3,}/g) || []).map(w => w.toLowerCase())
            .filter(w => !idWords.has(w) && said.split(/[^a-z0-9]+/).includes(w));
        assert(leaked.length === 0 && !/zebra|4471|quetzalcoatl|recruitment/.test(said) && !p.sent.length,
            `Link (${what}): no word of the ad is in it, bar the words the rubric's ids are made of, and nothing was sent (${leaked.slice(0, 5).join(', ') || 'none'})`);
        assert(text(p.doc.getElementById('briefLink')) === url && text(p.doc.getElementById('briefAddress')) === url,
            `Link (${what}): the page shows it, and prints it, as its address`);

        const there = boot(new URL(url).search);
        const a = shownOf(p.doc);
        const b = shownOf(there.doc);
        assert(there.errors.length === 0 && JSON.stringify(a) === JSON.stringify(b),
            `Link (${what}): opened, it rebuilds the same grade, gaps, matches, facts to confirm and dossier (${b.grade}; ${b.gaps.length} gaps; ${b.cases.join(', ') || 'no case study'})`);
        assert(there.window.location.href === url && !there.doc.getElementById('briefShare').hidden && there.doc.getElementById('briefAd').value === '',
            `Link (${what}): with its own link to pass on, and an empty box: the ad was never in it`);
    });

    // Unknown ids, and known ones with nonsense attached, are dropped: the
    // page shows what it knows, and its link no longer carries the rest.
    const p = boot();
    p.doc.getElementById('briefAd').value = ADS.dutch;
    p.doc.getElementById('briefRun').click();
    const clean = p.window.location.search;
    const noisy = boot(`${clean},unicorn,gap:unicorn,met:years.0,met:years.x,gap:dutch.z9,ask:the-moon,soft:,%3Cscript%3E,grade,high:x,${'a'.repeat(60)}`);
    assert(noisy.errors.length === 0 && JSON.stringify(shownOf(noisy.doc)) === JSON.stringify(shownOf(p.doc)) && noisy.window.location.search === clean,
        `Link: ids it does not know are ignored, and dropped from the link it passes on (${noisy.window.location.search === clean ? 'dropped' : noisy.window.location.search})`);
    const noisySaid = text(noisy.doc.querySelector('#briefResult .bf-grade p'));
    assert(/11 ids in the link are not on this page's list, and left out\./.test(noisySaid) && !/as the sender saw them/.test(noisySaid),
        `Link: and it says so, rather than show what is left as the sender saw it (${noisySaid.slice(0, 120)}…)`);
    const none = boot('?focus=unicorn,gap:nothing');
    assert(none.doc.getElementById('briefFit').hidden && none.doc.querySelectorAll('#briefCases > li:not([hidden])').length === projects.caseStudies.length,
        'Link: one with nothing it knows shows the whole dossier and no fit, as a plain visit does');

    // In the data, too: ids in, the same result out.
    const a = analyse(ADS.everything);
    const s = A.fromFocus(A.focusOf(a), { now: NOW });
    const rows = (r) => JSON.stringify([r.grade, r.matched.map(m => m.id), r.met.map(m => m.label), r.gaps.map(g => [g.label, g.text, g.hard]), r.confirm]);
    assert(rows(a) === rows(s) && JSON.stringify(A.selectCases(a.matched)) === JSON.stringify(A.selectCases(s.matched)),
        `Link: fromFocus(focusOf(a)) gives back the grade, the areas, every row and what to confirm (${A.focusOf(a).split(',').length} ids)`);
    // The case studies a result selects: those its areas name, the most
    // relevant first.
    const dutch = analyse(ADS.dutch);
    const picked = A.selectCases(dutch.matched);
    const named = new Set(dutch.matched.flatMap(m => m.caseStudies));
    assert(picked.length === named.size && picked.every(id => named.has(id)) && picked[0] === 'sustainable-ai',
        `Dossier: a grade selects the case studies its matched areas name, the most relevant first (${picked.join(', ')})`);
}

// ===================================================================
// A link shows no more than its own ids allow
// ===================================================================
// A link is a list anyone can edit, and it was believed: "?focus=high"
// beside four hard gaps showed "High-grade match" and the "looks like a
// fit" button, and "?focus=field" beside three areas of his own field
// showed "Different field". The grade cannot be worked out again from the
// ids alone (it also weighs how many of the ad's lines the site answers,
// which no link carries), but every rule the ids can be held to holds.
const gradeIdOf = (label) => Object.keys(brief.grades).find(id => brief.grades[id] === label);
/** A link opened, as its reader sees it, with the count it sends. */
const opened = (search, before) => {
    const p = boot(search, before);
    const seen = Object.assign(shownOf(p.doc), {
        blurb: text(p.doc.querySelector('#briefResult .bf-grade p')),
        button: !!p.doc.querySelector('#briefResult [data-analytics="brief-contact"]'),
        search: decodeURIComponent(p.window.location.search),
        p
    });
    p.window.dispatchEvent(new p.window.Event('pagehide'));
    const count = p.sent.find(s => /action=count/.test(s.url));
    seen.features = count ? JSON.parse(count.body).features : [];
    return seen;
};
{
    [
        ['high,esg,ghg,water,gap:big-four,gap:phd,gap:sap,gap:financial-modelling', 'Marginal match', 'four hard gaps end a "High-grade match" at Marginal'],
        ['high,esg,ghg,water,gap:sap', 'Workable match', 'one hard gap caps a "High-grade match" at Workable'],
        ['high,esg,ghg', 'Workable match', 'two areas are too few for the top grade'],
        ['high', 'Different field', '"High-grade match" with nothing matched is a different field'],
        ['high,gap:big-four,gap:phd,gap:sap,gap:financial-modelling', 'Different field', '"High-grade match" with four gaps and no area of his field is a different field'],
        ['workable,international,research', 'Different field', '"Workable match" on general areas alone is a different field'],
        ['field,esg,ghg,water', 'Marginal match', '"Different field" beside three areas of his field is the lowest grade those areas allow']
    ].forEach(([ids, grade, why]) => {
        const s = opened('?focus=' + ids);
        const fits = grade === 'High-grade match' || grade === 'Workable match';
        assert(s.p.errors.length === 0 && s.grade === grade && s.button === fits && s.search.startsWith(`?focus=${gradeIdOf(grade)}`),
            `Link held to its ids: ${why} (${s.grade}; the fit button ${s.button ? 'shown' : 'not shown'}; ${s.search})`);
        assert(!/as the sender saw them/.test(s.blurb) && new RegExp(`The link says "${brief.grades[ids.split(',')[0]]}"`).test(s.blurb) && /closest grade/.test(s.blurb),
            `Link held to its ids: and it says the grade is not the link's, not "as the sender saw them" (${s.blurb.slice(0, 90)}…)`);
    });
    // A grade the ids do allow is the link's, as the sender saw it.
    const fair = opened('?focus=workable,esg,ghg,water,gap:sap');
    assert(fair.grade === 'Workable match' && fair.button && /, as the sender saw them\./.test(fair.blurb) && !/closest grade/.test(fair.blurb),
        `Link held to its ids: one its ids allow keeps its grade and says it is as the sender saw it (${fair.grade})`);

    // Not tampered with: a tool the homepage showed when the link was sent,
    // and has stopped showing, is a hard gap now, and the grade follows it.
    const wash = analyse(ADS.wash + '\n- Python and Excel skills');
    const tools = wash.met.filter(m => A.RULES.tools.some(t => (t.name || t) === m.label));
    const later = A.fromFocus(A.focusOf(wash), { now: NOW, toolEvidence: {} });
    assert(wash.cls === 'high' && tools.length >= 2 && tools.every(t => later.hard.some(g => g.label === t.label)) && later.grade === 'Marginal match' &&
        new RegExp(`${tools.length} requirements are shown as this site reads them today`).test(later.blurb) && !/as the sender saw them/.test(later.blurb),
        `Link held to its ids: tools the homepage stopped showing are hard gaps, the grade follows (${wash.grade} → ${later.grade}) and the summary says why`);

    // Every link the Brief writes, read back today, is as the sender saw it.
    const ours = [ADS.dutch, ADS.ai, ADS.wash, ADS.everything, ADS.ai + '\nNice to have:\n- Experience with Workiva\n- Dutch is a plus'].concat(brief.samples.map(s => s.text));
    const off = ours.map(ad => [analyse(ad), ad]).map(([a]) => [a, A.fromFocus(A.focusOf(a), { now: NOW })]).filter(([a, s]) => s.grade !== a.grade || !/as the sender saw them/.test(s.blurb));
    assert(off.length === 0, `Link held to its ids: every link the Brief writes keeps its grade and its "as the sender saw them" (${off.map(([a, s]) => `${a.grade} → ${s.grade}`).join('; ') || ours.length + ' ads'})`);
}

// ===================================================================
// One thing, one row
// ===================================================================
// "?focus=marginal,met:python,gap:python,gap:sap,soft:sap,gap:years.5,
// gap:years.05" showed Python twice, SAP as a hard and a soft gap, and
// "5+ years" twice. Each id is read for what it names: met where the site
// shows it (a gap there would say "not evidenced", which is false), else a
// gap, hard if any id has it so; and the address passed on is the cleaned
// list.
{
    const s = opened('?focus=marginal,esg,ghg,met:python,gap:python,gap:sap,soft:sap,gap:years.5,gap:years.05,ask:visa,ask:visa');
    const all = s.gaps.concat(s.matches);
    const once = (re) => all.filter(r => re.test(r)).length === 1;
    assert(once(/^Python:/) && s.matches.some(r => /^Python:/.test(r)) && once(/^SAP:/) && s.gaps.some(r => r.startsWith('SAP: ')) && once(/^5\+ years/) && s.confirm.length === 1,
        `Link, one row each: Python once and met, SAP once and hard, "5+ years" once, a fact to confirm once (gaps: ${s.gaps.map(r => r.split(':')[0]).join(', ')}; matches: ${s.matches.map(r => r.split(':')[0]).join(', ')})`);
    assert(s.search === '?focus=marginal,esg,ghg,met:python,gap:sap,gap:years.5,ask:visa',
        `Link, one row each: the address passed on carries the cleaned list (${s.search})`);
    assert(!/as the sender saw them/.test(s.blurb) && /1 requirement is shown as this site reads it today/.test(s.blurb),
        `Link, one row each: a link at odds with itself is not "as the sender saw them" (${s.blurb.slice(0, 120)}…)`);
}

// ===================================================================
// English, once profile.json states it
// ===================================================================
// English is "to confirm" while the site states no level for it, and a
// link carried it only that way: once profile.json states one, the link
// dropped every English row, 970 of 5,558 ads in the reviewer's corpus.
{
    const facts = Object.assign({}, A.FACTS, { languages: [{ language: 'English', level: 'C2' }, { language: 'Dutch', level: 'B1' }] });
    const ad = SAMPLE_WATER + ' Requirements: 3+ years of experience in WASH. Excellent English. Fluent Dutch required.';
    const a = analyse(ad, { facts });
    const s = A.fromFocus(A.focusOf(a), { now: NOW, facts });
    const rows = (r) => JSON.stringify([r.grade, r.met.map(m => [m.label, m.ev]), r.gaps.map(g => [g.label, g.text, g.hard]), r.confirm]);
    assert(a.met.some(m => /^English/.test(m.label)) && rows(a) === rows(s) && /as the sender saw them/.test(s.blurb),
        `English: once stated, a link carries its row there and back (${s.met.map(m => m.label).join(', ')})`);
    const asked = A.fromFocus('marginal,water,gis,ask:english', { now: NOW, facts });
    assert(asked.met.some(m => m.label === 'English') && !asked.confirm.length && /shown as this site reads it today/.test(asked.blurb),
        'English: a link from before it was stated, "to confirm", is graded now, and says so');
    const unstated = A.fromFocus('marginal,water,gis,met:english.c1', { now: NOW });
    assert(unstated.confirm.includes('Level of English') && !unstated.met.length && /shown as this site reads it today/.test(unstated.blurb),
        'English: with no level stated, an English row is a fact to confirm again, and says so');
}

// ===================================================================
// A link has a limit, and says when an ad gives more than it holds
// ===================================================================
// The reader stopped at 80 ids and the writer had no limit: an ad naming
// every tool and language wrote 87, and the link lost five facts to
// confirm and two gaps. One limit now, written and read alike; over it,
// the matched tools go first, then the areas, and the link says how many
// rows it left out.
{
    const lines = ['Senior Sustainability Lead. Requirements:',
        '- ESG, CSRD, GHG accounting, climate risk, WASH, GIS, data analysis, sustainable AI, water quality, stakeholder engagement, project management, international work, research.'];
    brief.tools.forEach(t => lines.push(`- Experience with ${t.name || t} required`));
    brief.languages.map(l => l.name || l).filter(l => l !== 'English').forEach((l) => { lines.push(`- Fluent ${l} required`); lines.push(`- Basic ${l} required`); });
    for (let y = 2; y <= 12; y++) lines.push(`- ${y}+ years of experience in area ${y}`);
    lines.push('- Right to work, visa, security clearance, driving licence, relocation. PhD in economics required. Law degree required. Financial modelling required. Big Four experience required. Director level.');
    const ad = lines.join('\n');
    const a = analyse(ad);
    const all = a.matched.length + a.met.length + a.gaps.length + a.confirm.length + 1;
    const ids = A.focusOf(a).split(',');
    const s = A.fromFocus(ids.join(','), { now: NOW });
    assert(all > A.MAX_IDS && ids.length === A.MAX_IDS && /^more\.\d+$/.test(ids[ids.length - 1]) && +ids[ids.length - 1].split('.')[1] === all - A.MAX_IDS + 1,
        `Limit: an ad giving ${all} ids writes a link of ${ids.length}, the last saying how many rows it leaves out (${ids[ids.length - 1]})`);
    assert(JSON.stringify(s.gaps.map(g => [g.label, g.hard])) === JSON.stringify(a.gaps.map(g => [g.label, g.hard])) && JSON.stringify(s.confirm) === JSON.stringify(a.confirm) &&
        s.grade === a.grade && s.matched.length === a.matched.length,
        `Limit: the grade, every gap, every fact to confirm and every area survive it (${s.gaps.length} of ${a.gaps.length} gaps, ${s.confirm.length} of ${a.confirm.length} to confirm; ${s.met.length} of ${a.met.length} matched tools)`);
    const many = A.fromFocus(['marginal'].concat(Array.from({ length: A.MAX_IDS + 10 }, (x, i) => `gap:years.${i + 1}`)).join(','), { now: NOW });
    assert(many.met.length + many.gaps.length === A.MAX_IDS - 1, `Limit: the reader stops where the writer does, at ${A.MAX_IDS} ids (${many.met.length + many.gaps.length} rows and the grade)`);

    const p = boot();
    p.doc.getElementById('briefAd').value = ad;
    p.doc.getElementById('briefRun').click();
    const left = p.doc.getElementById('briefLeft');
    assert(!!left && !left.hidden && new RegExp(`leaves out ${all - A.MAX_IDS + 1} rows`).test(text(left)), `Limit: the page says what the link leaves out ("${text(left)}")`);
    const there = opened(p.window.location.search);
    assert(/The link could not carry the whole fit/.test(there.blurb) && !/as the sender saw them/.test(there.blurb) && !(there.p.doc.getElementById('briefLeft') || { hidden: true }).hidden,
        `Limit: and so does the page it is opened on (${there.blurb.slice(0, 140)}…)`);
    const short = boot();
    short.doc.getElementById('briefAd').value = ADS.dutch;
    short.doc.getElementById('briefRun').click();
    assert((short.doc.getElementById('briefLeft') || { hidden: true }).hidden, 'Limit: an ad that fits says nothing of it');
}

// ===================================================================
// Your own result, come back to, is not a link someone sent
// ===================================================================
// A reload, or Back from a case study, opened the reader's own result as
// a shared link: "The ad itself was not shared" beside the ad in the box,
// and the visit counted as a shared link opened. The page marks the
// history entry it writes its own address into, and a link someone sent
// arrives without the mark.
{
    const p = boot();
    p.doc.getElementById('briefAd').value = ADS.dutch;
    p.doc.getElementById('briefRun').click();
    const url = p.window.location.href;
    assert(p.window.history.state && p.window.history.state.brief === 'own', `Own: grading marks the history entry as the reader's own (${JSON.stringify(p.window.history.state)})`);
    const own = (w) => w.history.replaceState({ brief: 'own' }, '', url);

    // Reloaded with the box empty: rebuilt from the ids, said as such.
    const empty = opened(new URL(url).search, own);
    assert(empty.grade === 'Marginal match' && /^Rebuilt from this page's address/.test(empty.blurb) && !/shared|sender/i.test(empty.blurb),
        `Own: reloaded with the box empty, it is rebuilt from the address and says nothing of sharing (${empty.blurb.slice(0, 80)}…)`);
    assert(!empty.features.includes('brief-shared') && !empty.features.includes('brief-run'), `Own: and it is counted neither as a shared link nor as a use (${empty.features.join(', ') || 'nothing'})`);

    // Back, with the box given its ad again: graded from the ad, uncounted.
    const back = opened(new URL(url).search, (w) => { own(w); w.document.getElementById('briefAd').value = ADS.dutch; });
    assert(back.blurb === analyse(ADS.dutch).blurb && !back.features.some(f => /^brief-(?:run|shared|marginal)$/.test(f)),
        `Own: come back to with the ad in the box, it is graded from the ad again, and counted as nothing new (${back.features.join(', ') || 'nothing'})`);

    // A link someone sent is counted as it arrives, and not again on a reload.
    const sent = opened(new URL(url).search);
    const again = opened(new URL(url).search, (w) => w.history.replaceState({ brief: 'shared' }, '', url));
    assert(sent.features.includes('brief-shared') && /^Shared from The Brief/.test(sent.blurb) && (sent.p.window.history.state || {}).brief === 'shared' &&
        !again.features.includes('brief-shared') && /^Shared from The Brief/.test(again.blurb),
        `Own: a link someone sent is counted once, as it arrives, not again on a reload (${sent.features.join(', ')} / ${again.features.join(', ') || 'nothing'})`);
}

// ===================================================================
// The ad box, kept in the page
// ===================================================================
// Chrome's Enhanced Spell Check and Edge's Editor send what is typed in a
// box to Google or Microsoft to check it; the page says the ad never
// leaves it.
{
    const box = doc.getElementById('briefAd');
    assert(box.getAttribute('spellcheck') === 'false' && box.getAttribute('autocorrect') === 'off' && box.getAttribute('autocapitalize') === 'off',
        `The box: spellcheck, autocorrect and autocapitalize off, so no browser sends the ad to be checked (${['spellcheck', 'autocorrect', 'autocapitalize'].map(n => `${n}="${box.getAttribute(n)}"`).join(' ')})`);
    // What the link carries, said exactly: years and a language level are
    // the ad's own numbers, as "years.12" and "dutch.c1".
    const said = text(doc.querySelector('#briefShare p'));
    assert(/the years of experience and the language levels the ad asked for/.test(said) && /how many rows it leaves out/.test(said) && /never a word of the ad/.test(said) && !/only the names/.test(said),
        `The link: the page says it carries ids, the years and language levels asked for and what it leaves out, and never a word of the ad ("${said.slice(0, 80)}…")`);
}

// ===================================================================
// A page like any other, and one in from the homepage
// ===================================================================
{
    const budget = require('../scripts/check-budget.js');
    assert(/GENERATED by scripts\/build-content\.js/.test(HTML.slice(0, 900)), 'Page: generated, never hand-edited');
    assert(profile.pages.some(p => p.path === 'brief.html') && /<loc>[^<]*brief\.html<\/loc>/.test(read('sitemap.xml')), 'Page: in profile.json\'s pages, so in the sitemap');
    assert(budget.PAGE_BUDGETS['brief.html'] && budget.BUDGETS[budget.PAGE_BUDGETS['brief.html']] && budget.LENGTH['brief.html'],
        'Page: a first-view budget and a length budget in scripts/check-budget.js');
    assert(!budget.onDemandAssets().includes('brief.js') && !budget.criticalAssets('index.html').includes('brief.js') && budget.criticalAssets('brief.html').includes('brief.js'),
        'Page: its script is its own, in its first view, and in neither the homepage\'s nor its on-demand total');
    const home = new JSDOM(read('index.html')).window.document;
    assert(!!home.querySelector('#contact .brief-line a[href="brief.html"][data-analytics]') && !!home.querySelector('.play-index a[href="brief.html"]'),
        'Page: the homepage leads here, from under the contact form and from the play index');
    assert(/\['assay', 'brief\.html#grade'\]/.test(read('script.js')) && !!doc.getElementById('grade'), 'Page: an address shared for the Assay (/#assay) goes on to the box here');
}

// ===================================================================
// The visit's count: that the Brief was run and its grade, never the ad
// ===================================================================
{
    const p = boot();
    const ad = ADS.dutch + '\nPlease mention the reference ZEBRA-4471 in your letter.';
    p.doc.getElementById('briefAd').value = ad;
    p.doc.getElementById('briefRun').click();
    p.doc.getElementById('briefCopy').click();
    assert(p.sent.length === 0, `Count: nothing is sent while the page is open (${p.sent.length})`);
    p.window.dispatchEvent(new p.window.Event('pagehide'));
    const count = p.sent.filter(s => /action=count/.test(s.url));
    const body = count.length ? JSON.parse(count[0].body) : {};
    assert(count.length === 1 && body.page === 'brief' && body.features.includes('brief-run') && body.features.includes('brief-marginal'),
        `Count: one count, naming the page, that the Brief was run and the grade it gave (${(body.features || []).join(', ')})`);
    const words = (ad.match(/[A-Za-z]{4,}|\d{3,}/g) || []).map(w => w.toLowerCase());
    const carried = p.sent.flatMap(s => words.filter(w => `${decodeURIComponent(s.url)} ${s.body}`.toLowerCase().includes(w)));
    assert(p.sent.length === 1 && carried.length === 0, `Count: and no request carries a word of the ad (${carried.slice(0, 5).join(', ') || 'none'})`);

    const shared = boot(new URL(p.window.location.href).search);
    shared.window.dispatchEvent(new shared.window.Event('pagehide'));
    const sb = JSON.parse((shared.sent[0] || { body: '{}' }).body);
    assert((sb.features || []).includes('brief-shared') && !(sb.features || []).includes('brief-run'),
        `Count: a shared link opened is counted as one, not as a run of the Brief (${(sb.features || []).join(', ')})`);

    // A sample is a press of its button, not a use: stats.html counts Brief
    // uses as page views in which it graded an ad someone pasted in. One
    // press of the WASH sample sent brief-run and brief-high with it.
    const sample = boot();
    sample.doc.querySelector('.bf-sample[data-sample="water"]').click();
    sample.window.dispatchEvent(new sample.window.Event('pagehide'));
    const sf = JSON.parse((sample.sent[0] || { body: '{}' }).body).features || [];
    assert(sample.doc.querySelector('#briefResult .bf-grade-tag') && JSON.stringify(sf) === '["brief-sample"]',
        `Count: a sample graded is counted as a sample and nothing else (${sf.join(', ')})`);
    const stats = new JSDOM(read('stats.html')).window.document;
    const def = Array.from(stats.querySelectorAll('.st-five .st-card')).map(text).find(t => /Brief uses/.test(t)) || '';
    assert(/graded a job ad someone pasted in \(its sample ads are not counted\)/.test(def), `Count: stats.html defines Brief uses the same way ("${def.slice(0, 110)}…")`);
    // The label beside the button says what is true: the grade is counted,
    // the ad is not.
    const label = text(doc.querySelector('.bf-privacy'));
    assert(/the ad is never sent/.test(label) && !/nothing (?:is )?sent/.test(label), `Count: the label beside the button says the ad is never sent, not that nothing is ("${label}")`);
}

// ===================================================================
// Copy link: the link, never the ad, and the button gets its words back
// ===================================================================
(async () => {
    const p = boot();
    const copied = [];
    p.window.navigator.clipboard = { writeText: async (s) => { copied.push(s); } };
    p.doc.getElementById('briefAd').value = ADS.wash;
    p.doc.getElementById('briefRun').click();
    const btn = p.doc.getElementById('briefCopy');
    const before = btn.innerHTML;
    btn.click();
    await new Promise(r => setTimeout(r, 20));
    btn.click();   // pressed again while it still says Copied
    await new Promise(r => setTimeout(r, 20));
    assert(copied.length === 2 && copied.every(c => c === p.window.location.href) && !copied.some(c => /borehole/i.test(c)), `Copy link: copies the page's link, not the ad (${copied[0]})`);
    assert(/Copied/.test(btn.textContent), 'Copy link: the button confirms the copy');
    await new Promise(r => setTimeout(r, 60));
    const heard = p.doc.getElementById('briefCopied');
    assert(!!heard && heard.getAttribute('role') === 'status' && heard.textContent === 'Link copied', `Copy link: a status line says so to a screen reader ("${heard && heard.textContent}")`);
    await new Promise(r => setTimeout(r, 1800));
    assert(btn.innerHTML === before, 'Copy link: the button gets its own words back, even after a second press');

    // A browser without the clipboard API: the old way borrows the focus
    // for a hidden box, and hands it back to the button, which kept a
    // keyboard user's place; and a copy that fails says so.
    for (const [works, said] of [[true, 'Link copied'], [false, 'Copy failed']]) {
        const q = boot('', (w) => { w.document.execCommand = () => works; });
        q.window.navigator.clipboard = undefined;
        q.doc.getElementById('briefAd').value = ADS.wash;
        q.doc.getElementById('briefRun').click();
        const b = q.doc.getElementById('briefCopy');
        b.focus();
        b.click();
        await new Promise(r => setTimeout(r, 80));
        assert(q.doc.activeElement === b && (q.doc.getElementById('briefCopied') || {}).textContent === said && !q.doc.querySelector('body > textarea'),
            `Copy link, the old way: focus back on the button, and "${said}" heard (${q.doc.activeElement.id || q.doc.activeElement.tagName}, "${(q.doc.getElementById('briefCopied') || {}).textContent}")`);
    }

    // Clear: back to the whole dossier, the link back to the bare page.
    p.doc.getElementById('briefClear').click();
    assert(p.window.location.search === '' && p.doc.getElementById('briefFit').hidden && p.doc.getElementById('briefShare').hidden &&
        p.doc.querySelectorAll('#briefCases > li:not([hidden])').length === projects.caseStudies.length &&
        JSON.stringify(Array.from(p.doc.querySelectorAll('#briefCases > li')).map(li => li.id)) === JSON.stringify(projects.caseStudies.map(cs => cs.id)),
    'Clear: the whole dossier again, in its own order, and an address with no focus');

    if (failures > 0) {
        console.log(`\n${failures} assertion(s) failed`);
        process.exit(1);
    }
    console.log('\nAll assertions passed');
    process.exit(0);
})();
