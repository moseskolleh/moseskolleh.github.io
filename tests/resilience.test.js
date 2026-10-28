// Regression tests for the ways the page is expected to degrade rather than
// break: storage the browser refuses to hand over, and keyboard shortcuts
// firing while a form control has focus.
//
// Run with: node tests/resilience.test.js

const fs = require('fs');
const path = require('path');
const { run, ROOT, MODULE_FILES } = require('./harness.js');

let failures = 0;
function assert(cond, msg) {
    if (cond) {
        console.log('PASS:', msg);
    } else {
        console.log('FAIL:', msg);
        failures++;
    }
}

// ===================================================================
// Blocked storage must not abort the script
// ===================================================================
// `localStorage.getItem('theme')` used to sit at module scope. With storage
// blocked the property access throws SecurityError, and everything defined
// after it — the theme toggle, low-energy mode, the terminal — never
// initialised at all.
{
    const { window, errors } = run('dark', { storage: 'blocked' });
    const doc = window.document;

    const securityErrors = errors.filter((e) => {
        const s = String((e && e.message) || e);
        return /SecurityError|Access to storage/.test(s);
    });
    assert(securityErrors.length === 0, `Storage: a blocked store raises no uncaught error (${securityErrors.length} seen)`);

    // Each of these is defined at a different point in script.js. If an early
    // throw aborted the file, the later ones are the ones that go missing.
    // The switch is in the markup, hidden until the script shows it.
    assert(doc.querySelector('.theme-toggle').hidden === false, 'Storage blocked: the script still shows the theme toggle');
    assert(!!doc.getElementById('terminalToggle'), 'Storage blocked: the field terminal is still wired');

    // The adapter itself must be usable and honest about what it can promise.
    const store = window.mks.storage;
    assert(!!store, 'Storage blocked: the safe adapter is exposed');
    assert(store.local.persistent === false, 'Storage blocked: the adapter reports that nothing will persist');
    assert(store.local.get('nothing-here', 'fallback') === 'fallback', 'Storage blocked: reads fall back to the supplied default');
    assert(store.local.set('k', 'v') === false, 'Storage blocked: a write reports that it did not persist');
    assert(store.local.get('k') === 'v', 'Storage blocked: the write is still readable in-memory for this session');
    store.local.remove('k');
    assert(store.local.get('k') === null, 'Storage blocked: remove clears the in-memory copy');

    // Interactions that write a preference must not throw either.
    const toggle = doc.querySelector('.theme-toggle');
    let threw = null;
    try {
        toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (err) { threw = err; }
    assert(!threw, `Storage blocked: toggling the theme does not throw (${threw && threw.message})`);
    assert(doc.documentElement.classList.contains('light-mode'), 'Storage blocked: the theme still changes, it just is not remembered');

    const eco = doc.getElementById('ecoModeToggle');
    threw = null;
    try {
        eco.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (err) { threw = err; }
    assert(!threw, `Storage blocked: toggling low-energy mode does not throw (${threw && threw.message})`);
}

// With storage working, preferences must still actually persist — the point
// is graceful degradation, not silently dropping everyone's settings.
{
    const { window } = run('dark');
    const store = window.mks.storage;
    assert(store.local.persistent === true, 'Storage available: the adapter reports that writes persist');
    assert(store.local.set('mks-test', 'value') === true, 'Storage available: a write reports success');
    assert(window.localStorage.getItem('mks-test') === 'value', 'Storage available: the value really reaches localStorage');
    assert(store.local.get('theme') === 'dark', 'Storage available: seeded values are read back');
}

// No direct storage access may creep back into the shipped scripts — the
// core after its adapter, and every on-demand module.
{
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    const body = src.slice(src.indexOf('// ON-DEMAND MODULES'));   // skip the adapter itself
    const direct = body.match(/(?<!\.)\b(?:window\.)?(?:local|session)Storage\s*\./g) || [];
    assert(direct.length === 0, `Storage: nothing in script.js reaches past the adapter (found: ${direct.join(', ') || 'none'})`);

    MODULE_FILES.forEach((rel) => {
        const mod = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        const hits = mod.match(/(?<!\.)\b(?:window\.)?(?:local|session)Storage\s*\./g) || [];
        assert(hits.length === 0, `Storage: ${rel} goes through the adapter too (found: ${hits.join(', ') || 'none'})`);
        // A module is a classic script sharing the page's global scope, so a
        // top-level declaration would collide with the core's — `const
        // safeStorage` twice is a SyntaxError that takes the module with it.
        const topLevel = mod.split('\n').filter((l) => /^(const|let|class|function|async function)\s/.test(l));
        assert(topLevel.length === 0, `Modules: ${rel} declares nothing at the top level (found: ${topLevel.join(' | ') || 'none'})`);
    });
}

// ===================================================================
// Keyboard shortcuts must not hijack form controls
// ===================================================================
// Pressing "c" with a <select> focused scrolled the page to Contact instead
// of jumping to the option starting with C.
{
    const { window } = run('dark');
    const doc = window.document;

    // Record every scroll the shortcut handler would perform.
    let scrolled = [];
    window.HTMLElement.prototype.scrollIntoView = function () { scrolled.push(this.id || this.tagName); };

    const press = (key, target, init) => {
        scrolled = [];
        const ev = new window.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, init || {}));
        target.dispatchEvent(ev);
        return scrolled;
    };

    // The case reported was the homepage calculator's model picker. The
    // calculator has moved to carbon-ai.html, and the homepage has no
    // <select> of its own now, so one is built, as the contenteditable is.
    const select = doc.querySelector('select') || doc.body.appendChild(doc.createElement('select'));
    select.appendChild(new window.Option('Claude', 'c'));
    assert(press('c', select).length === 0, 'Shortcut: "c" on a <select> does not scroll to Contact');
    assert(press('h', select).length === 0, 'Shortcut: "h" on a <select> does not scroll home');

    const button = doc.querySelector('button');
    assert(press('c', button).length === 0, 'Shortcut: "c" on a <button> is ignored');

    const input = doc.getElementById('name');
    assert(!!input && press('c', input).length === 0, 'Shortcut: "c" in a text input is ignored');

    const textarea = doc.getElementById('message');
    assert(!!textarea && press('c', textarea).length === 0, 'Shortcut: "c" in a textarea is ignored');

    // contenteditable is not present in the markup, so build one.
    const editable = doc.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    doc.body.appendChild(editable);
    assert(press('c', editable).length === 0, 'Shortcut: "c" in a contenteditable region is ignored');

    // A child of a control counts as the control — events bubble from the
    // <span> inside a button, not from the button itself.
    const nested = doc.querySelector('button span') || (() => {
        const b = doc.createElement('button');
        const s = doc.createElement('span');
        b.appendChild(s);
        doc.body.appendChild(b);
        return s;
    })();
    assert(press('c', nested).length === 0, 'Shortcut: a keystroke on a control\'s child is ignored too');

    // Modified keystrokes are somebody else's: Ctrl+C is copy.
    assert(press('c', doc.body, { ctrlKey: true }).length === 0, 'Shortcut: Ctrl+C is left alone');
    assert(press('c', doc.body, { metaKey: true }).length === 0, 'Shortcut: Cmd+C is left alone');
    assert(press('c', doc.body, { altKey: true }).length === 0, 'Shortcut: Alt+C is left alone');

    // …and the shortcut must still work where it is supposed to.
    assert(press('c', doc.body).length === 1, 'Shortcut: "c" on the page body still jumps to Contact');
    assert(press('h', doc.body).length === 1, 'Shortcut: "h" on the page body still jumps home');
    assert(press('C', doc.body).length === 1, 'Shortcut: the uppercase form still works');
}

function finish() {
    if (failures > 0) {
        console.log(`\n${failures} assertion(s) failed`);
        process.exit(1);
    }
    console.log('\nAll assertions passed');
    // The site script leaves timers running (slideshow, typewriter) which
    // would otherwise keep the process alive forever.
    process.exit(0);
}

finish();
