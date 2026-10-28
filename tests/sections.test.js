// Tests for the shorter homepage (plan Phase 2, step 3: "Halve the page").
//
// The page was 15.5 screens at 1440x900 and 22.9 at 390x844 with every
// mechanism of that step in place; the targets are 10 and 18. It came down
// by making sections denser and merging the ones that overlapped, and by one
// rule: no fact leaves the site. Each role, organisation, date, degree,
// certificate, project, field note, number and link is still on the
// homepage, or one click away on a page that carries it in full. This suite
// holds that rule, and the two disclosures it needed:
//
//   - the experience log as short cards at every width, each opened by a
//     More button named for its role;
//   - the Assay under the contact form, its question and promise in view and
//     its box behind one button, until it grew into The Brief, a page of
//     its own, since retired: the form is the section's last word now.
//
// A real browser measures the length and checks the same at 320, 390 and
// 1280/1440px (scripts/smoke.js: exerciseSections, and checkLengths against
// the LENGTH ceilings in scripts/check-budget.js).
//
// Run with: node tests/sections.test.js

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { run, ROOT } = require('./harness.js');

let failures = 0;
function assert(cond, msg) {
    if (cond) {
        console.log('PASS:', msg);
    } else {
        console.log('FAIL:', msg);
        failures++;
    }
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = read('index.html');
const css = read('style.css');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const click = (window, node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const bare = new JSDOM(html).window.document;   // the page as served: no script has run
const plain = text(bare.body);
const profile = JSON.parse(read('content/profile.json'));

(async () => {
// ===================================================================
// The page's shape: seven sections, numbered in order
// ===================================================================
{
    const ids = Array.from(bare.querySelectorAll('main > section')).map(s => s.id);
    assert(ids.join() === 'journey,about,experience,projects,ecoprompt,skills,contact',
        `Shape: seven sections, Field Notes in About and Education with Skills (${ids.join(', ')})`);
    const numbers = Array.from(bare.querySelectorAll('main > section .section-index')).map(text);
    assert(numbers.join() === '01,02,03,04,05,06,07', `Shape: the section numbers run 01 to 07 with no gap (${numbers.join(', ')})`);
    assert(!bare.querySelector('.cta-band'), 'Shape: the mid-page call-to-action band is gone (Contact is in the nav, a click away all the way down)');
    // Where the band's two actions still are.
    assert(!!bare.querySelector('.nav-menu a[href="#contact"]') && bare.querySelectorAll('a[href$="Moses_Kolleh_Sesay_CV.pdf"][download]').length >= 3,
        'Shape: Contact stays in the nav, and the CV has its links in the nav, the hero and About');
}

// ===================================================================
// Experience: short cards at every width
// ===================================================================
{
    const { window, errors } = run('dark');
    const doc = window.document;
    const cards = Array.from(doc.querySelectorAll('#experience .timeline-content'));
    const buttons = cards.map(c => c.querySelector(':scope > .corelog-more'));

    assert(errors.length === 0, `Experience: the page boots without errors (${errors.map(String).join('; ') || 'none'})`);
    assert(cards.length === profile.experience.length && buttons.every(Boolean), `Experience: every role gets a More button (${buttons.filter(Boolean).length} of ${cards.length})`);
    assert(buttons.every((b, i) => b === cards[i].lastElementChild && b.type === 'button'),
        'Experience: each is a real button (Enter and Space work as they do on any button), after everything it opens');
    assert(buttons.every((b, i) => b.getAttribute('aria-expanded') === 'false' && doc.getElementById(b.getAttribute('aria-controls')) === cards[i].querySelector('ul')),
        'Experience: each says it is closed and names the list it opens');
    assert(buttons.every((b, i) => text(b) === `More about ${text(cards[i].querySelector('h3'))}`),
        `Experience: each is named for its role, not five times "More" (${text(buttons[0])})`);

    const card = cards[0];
    click(window, buttons[0]);
    assert(card.classList.contains('is-open') && buttons[0].getAttribute('aria-expanded') === 'true' && /^Less/.test(text(buttons[0])),
        'Experience: a press opens the card and the button says Less');
    click(window, buttons[0]);
    assert(!card.classList.contains('is-open') && buttons[0].getAttribute('aria-expanded') === 'false' && /^More/.test(text(buttons[0])),
        'Experience: a second press folds it again');

    // Every role keeps its facts in the page: title, organisation and dates
    // from content/profile.json on show, and every line behind More.
    const missing = profile.experience.filter((r, i) => {
        const c = cards[i];
        return !c || !text(c.querySelector('h3')).startsWith(r.title) || !text(c.querySelector('h4')).includes(r.organization.split(' (')[0]) ||
            text(c.querySelector('.timeline-date')) !== r.displayDates;
    }).map(r => r.title);
    assert(missing.length === 0, `Experience: every role shows its title, organisation and dates, in profile.json's order (wrong: ${missing.join('; ') || 'none'})`);
    assert(cards.every(c => c.querySelectorAll('li').length >= 3), 'Experience: every role keeps all its lines in the page');
    assert(bare.querySelectorAll('.corelog-more').length === 0, 'Experience: the markup has no More button; script.js makes them, so without it every card is whole');

    // The folding is at every width now, and only where script.js runs.
    const phone = (css.match(/@media \(max-width: 599px\) \{\s*\.corelog-head,[\s\S]*?\n\}/) || [''])[0];
    const everywhere = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    assert(/html\.js \.timeline-content:not\(\.is-open\) ul li:nth-child\(n\+2\),\s*html\.js \.timeline-content:not\(\.is-open\) \.tags \{\s*display: none;/.test(everywhere),
        'Experience: with html.js, a closed card shows its first line and folds the rest and the tags, at every width');
    assert(/html\.js \.corelog-more \{ display: inline-block; \}/.test(everywhere) && /\.corelog-more \{\s*display: none;/.test(css),
        'Experience: the button shows only with html.js, so without script.js there is none and every card is whole (a late start, which puts html.js back, is held in tests/nojs.test.js)');
    assert(/@media print \{\s*html\.js \.timeline-content:not\(\.is-open\) \{ display: block; \}\s*html\.js \.timeline-content:not\(\.is-open\) ul li:nth-child\(n\+2\) \{ display: list-item; \}/.test(css),
        'Experience: printed, every card is whole');
    assert(/@media \(min-width: 900px\) \{\s*html\.js \.timeline-content:not\(\.is-open\) \{\s*display: grid;/.test(css),
        'Experience: on a desktop a shut card is one row under its dates (who and where, then what), and open it is the whole card');
    assert(/\.corelog-head,\s*\.corelog-depth \{\s*display: none;/.test(phone) && /\.corelog > \.corelog-item \{\s*grid-template-columns: 8px minmax\(0, 1fr\);/.test(phone),
        'Experience: on a phone the depth column gives its width to the text (a desktop keeps the core log\'s depths)');
}

// ===================================================================
// Contact: the form, and no line to The Brief
// ===================================================================
// The Assay sat under the form, folded behind a button: 470px of a desktop
// and 660 of a phone open, for the few who wanted it. It grew into The
// Brief (brief.html), with one line under the form leading there, and both
// went when The Brief was retired: the homepage links to it nowhere.
{
    const contact = bare.getElementById('contact');
    const form = bare.getElementById('contactForm');
    assert(!bare.getElementById('assay') && !bare.querySelector('.brief-line, [class*="assay"], #assayInput, #assayResult'),
        'Contact: neither the Assay nor the line to The Brief is left in the section');
    assert(!bare.querySelector('a[href^="brief.html"], a[href="#assay"], [data-analytics^="brief-"]') && !/Hiring\?|job (?:ad|description)/i.test(text(bare.body)),
        'Contact: the homepage links to The Brief nowhere, the play index included, and asks for no job ad');
    const firstField = contact.querySelector('input, textarea, select');
    assert(firstField && firstField.closest('form') === form, `Contact: the first field in the section is the form's (${firstField && firstField.id})`);
    assert(!/\.assay\b|assay-|\.brief-line/.test(css), 'Contact: the rules for the Assay and the line to The Brief have left style.css');
    assert(!/assay/i.test(read('modules/interactives.js').replace(/^\s*\/\/.*$/gm, '')), 'Contact: and the Assay\'s code has left modules/interactives.js');
}

// ===================================================================
// About: what the chips and fact cards said is said elsewhere, once
// ===================================================================
{
    const about = bare.getElementById('about');
    assert(!about.querySelector('.about-chips, .chip, .about-facts, .fact-card'), 'About: the six chips and four fact cards are gone');
    const said = [
        ['projects across Africa, Europe and Asia', () => Array.from(bare.querySelectorAll('.hero-stat')).some(s => /^3 Continents/.test(text(s))) &&
            ['Freetown, Sierra Leone', 'Changsha, China', 'Bonn, Germany'].every(s => text(bare.getElementById('journey')).includes(s)),
            'the hero\'s "3 continents" and the journey\'s stops in Sierra Leone, China and Germany'],
        ['164 water points across Sierra Leone', () => /164 water points/.test(text(about.querySelector('.about-text p:nth-of-type(2)'))), 'About\'s own paragraph'],
        ['Python, SQL, GIS & ML', () => ['Python', 'SQL', 'QGIS & ArcGIS', 'Machine Learning'].every(t => Array.from(bare.querySelectorAll('#skills .toolkit-name')).some(n => text(n).startsWith(t))), 'the toolkit, each with its proof'],
        ['ESG Specialist Program, Corporate Finance Institute (2024)', () => /^ESG Specialist Program Corporate Finance Institute · Sep 2024/.test(text(bare.querySelector('#education .certification'))), 'the certificates'],
        ['the six chips', () => ['ESG Analysis & Integration', 'GHG Accounting (Scope 1–3)', 'Climate Risk Assessment', 'Water Resource Management'].every(s => text(bare.querySelector('.skills-checklist')).includes(s)) &&
            ['IFRS S1&S2', 'GRI', 'CSRD'].every(s => text(bare.querySelector('.frameworks-list')).includes(s)), 'Skills\' two lists']
    ];
    said.forEach(([what, where, name]) => assert(where(), `About: "${what}" is still on the page, in ${name}`));

    // The 164, itemised under the paragraph that claims it.
    const bar = about.querySelector('.about-text .impact-bar');
    assert(!!bar && about.querySelectorAll('.impact-seg').length === 3 && /100 hand-dug wells rehabilitated, 50 boreholes constructed, 14 solar-powered boreholes/.test(bar.getAttribute('aria-label')) &&
        /164 water points delivered in Sierra Leone, itemised/.test(text(about)),
        'About: the 164 water points are itemised there (100 + 50 + 14), under the paragraph that claims them');

    // The field notes live in About: a short link to each of the newest
    // three, and each note whole on a page of its own, one press away (they
    // were three folds of the whole notes here until Phase 5.1).
    const notes = bare.getElementById('notes');
    const each = notes ? Array.from(notes.querySelectorAll('.fieldnote')) : [];
    const sources = require('../scripts/lib/content.js').loadAll().notes;
    assert(!!notes && notes.closest('#about') === about && each.length === Math.min(3, sources.length) && sources.length >= 3,
        `Notes: a link to each of the newest three field notes is in About (${each.length} of ${sources.length})`);
    assert(!notes.querySelector('details') && !/fieldnote-body/.test(html), 'Notes: no note is folded into the homepage any more; each is a page');
    each.forEach((card) => {
        const a = card.querySelector('h3 a[href^="notes/"]');
        const note = a && sources.find(n => a.getAttribute('href') === `notes/${n.slug}.html`);
        const time = card.querySelector('.fieldnote-tag time');
        assert(!!note && text(a) === note.title && time && time.getAttribute('datetime') === note.date &&
            text(card.querySelector('.fieldnote-tag')).includes(note.tag) && text(card.querySelector('.fieldnote-line')) === note.summary,
            `Notes: "${note ? note.title : '?'}" is its number, tag and date, its title (the link) and its one line`);
        if (!note) return;
        // One press away, whole: every paragraph of the note is on its page.
        const page = new JSDOM(read(`notes/${note.slug}.html`)).window.document;
        const body = text(page.getElementById('note'));
        const missing = note.text.split('\n').filter(line => !body.includes(line.replace(/\s+/g, ' ').trim()));
        assert(missing.length === 0, `Notes: "${note.title}" is whole on notes/${note.slug}.html (${missing.length} paragraph(s) missing)`);
    });
    assert(/short dispatches from the intersection of mud, models and megawatts/i.test(text(notes)), 'Notes: their one line of introduction came with them');
    // The third note pointed down the homepage to the chart it means ("the
    // widget above", then "further down"); on its own page it says where.
    const third = sources.find(n => n.number === 3);
    const thirdPage = new JSDOM(read(`notes/${third.slug}.html`)).window.document;
    const pointer = thirdPage.querySelector('#note a[href="../index.html#ecoprompt"]');
    assert(!!pointer && /on the homepage/.test(text(pointer.parentElement)) && !/further down|widget above/.test(text(thirdPage.getElementById('note'))),
        'Notes: the third points to the chart it means, on the homepage, from its own page');
}

// ===================================================================
// Projects: what left the cards is on the case studies
// ===================================================================
{
    const projects = JSON.parse(read('content/projects.json'));
    const cs = new JSDOM(read('case-studies.html')).window.document;
    const cards = Array.from(bare.querySelectorAll('#projects .project-card'));
    assert(cards.length === 6 && cards.every(c => !c.querySelector('.project-sub')), 'Projects: the cards drop their subtitles');
    const kept = projects.caseStudies.filter(c => text(cs.querySelector(`#${c.id} .cs-card-sub`)) === c.subtitle.replace(/\s+/g, ' ').trim()).length;
    assert(kept === projects.caseStudies.length, `Projects: every subtitle is on its case study, one click away (${kept} of ${projects.caseStudies.length})`);
    assert(cards.every(c => c.querySelector('.project-tags > .project-lenses') && c.querySelector('.project-tags > .project-tech span')),
        'Projects: each card keeps its lenses and its tools, on one run of small type');
    const intro = bare.querySelector('#projects .section-description');
    const lensIds = JSON.parse(read('content/lenses.json')).lenses.map(l => l.id);
    const lensLinks = intro ? Array.from(intro.querySelectorAll('a[href^="case-studies.html?lens="]')).map(a => a.getAttribute('href').split('=')[1]) : [];
    assert(!!intro && intro.querySelectorAll('a[href="case-studies.html"]').length === 1 && lensLinks.join() === lensIds.join() &&
            !bare.querySelector('#projects .section-header > p:nth-of-type(2)'),
        `Projects: one line of introduction, still with the case studies and every lens, in lenses.json's order (${lensLinks.join(', ')})`);
}

// ===================================================================
// Skills & Education: one section, every fact kept
// ===================================================================
{
    const skills = bare.getElementById('skills');
    const skillText = text(skills);
    const education = bare.getElementById('education');
    assert(!!education && education.closest('#skills') === skills && education.tagName !== 'SECTION',
        'Skills & Education: one section; #education is a part of it, still an address');
    assert(/Skills & Education/.test(text(skills.querySelector('.section-title'))), 'Skills & Education: the heading says both');

    // Life Cycle Assessment, Carbon Markets, Circular Economy and SASB were
    // listed too, under "every tool comes with the receipt", with nothing on
    // the site behind them; they went in October 2026 (content.test.js keeps
    // them off the homepage and the field report).
    const expertise = ['ESG Analysis & Integration', 'GHG Accounting (Scope 1–3)', 'Climate Risk Assessment',
        'Water Resource Management', 'Disaster Risk Reduction'];
    const frameworks = ['SBTi', 'CDP', 'GHG Protocol', 'TCFD', 'TNFD', 'ISO 14000', 'IFRS S1&S2', 'GRI', 'CSRD'];
    const listed = (sel) => Array.from(skills.querySelectorAll(sel)).map(text);
    assert(JSON.stringify(listed('.skills-checklist li')) === JSON.stringify(expertise), `Skills: every area of expertise is listed (${listed('.skills-checklist li').length})`);
    assert(JSON.stringify(listed('.frameworks-list li')) === JSON.stringify(frameworks), `Skills: every framework is listed (${listed('.frameworks-list li').length})`);
    assert(skills.querySelectorAll('.toolkit-item .toolkit-proof').length === 6, 'Skills: the six tools keep their proof links');

    // What left Skills was said elsewhere on the page too, and still is.
    [['70%', /70% of those drilled struck water/], ['10,226 sub-basins', /10,226 sub-basins/], ['54 hazard information systems', /54 global hazard information systems/], ['a team of 23', /team of 23/]]
        .forEach(([what, re]) => {
            const outside = Array.from(bare.querySelectorAll('main > section')).filter(s => s.id !== 'skills' && re.test(text(s))).map(s => s.id);
            assert(outside.length > 0 && !re.test(skillText), `Skills: ${what} is not repeated here, and is still in ${outside.join(', ')}`);
        });

    // Every certificate keeps its name, issuer, date and what it covered;
    // every degree its dates, institution and every line it had.
    const certs = Array.from(education.querySelectorAll('.education-card.certification'));
    assert(certs.length === profile.certifications.length, `Education: all ${profile.certifications.length} certificates are shown (${certs.length})`);
    profile.certifications.forEach((c) => {
        const card = certs.find(el => text(el.querySelector('.cert-title')) === c.name);
        assert(!!card && text(card).includes(c.issuer) && text(card).includes(c.displayDate) && text(card.querySelector('.cert-line')).length > 20,
            `Education: "${c.name}" keeps its issuer, date and one line on what it covered`);
    });
    const degrees = Array.from(education.querySelectorAll('.education-grid > .education-card'));
    assert(degrees.length === profile.education.length, `Education: every degree keeps its own entry (${degrees.length})`);
    profile.education.forEach((e) => {
        const d = degrees.find(el => text(el.querySelector('h3')) === e.degree);
        assert(!!d && text(d.querySelector('.education-top')) === e.displayDates && text(d.querySelector('h4')).startsWith(e.institution.replace(/ & Research$/, '')) &&
            !!d.querySelector('.specialization') && d.querySelectorAll('li').length >= 2,
            `Education: ${e.degree} keeps its dates, institution, distinction and lines`);
    });
    ['Wageningen African Scholarship Programme scholar', 'Average grade 7.8/10 (Dutch scale)', 'Full Chinese Government (MOFCOM) Scholarship',
        'First Class Honours', 'Human-Environment Interaction · Water Systems & Global Change',
        'Thesis: socioeconomic drivers of river export of pollutants worldwide', 'Thesis: soft path water management — Freetown case study',
        'Dissertation: groundwater potential mapping, geophysical approach', 'Project management, operations research, systems analysis',
        'Hydrogeology, geophysics, environmental geology']
        .forEach(line => assert(plain.includes(line), `Education: "${line}" is still on the page`));
}

if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nAll assertions passed');
process.exit(0);   // the site script leaves timers running
})().catch((err) => {
    console.log('FAIL: sections checks threw', err);
    process.exit(1);
});
