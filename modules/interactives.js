// ===================================================================
// INTERACTIVES — the homepage widgets that respond to the visitor
// ===================================================================
// The share helper, You Draw It and The Receipt: JavaScript that only
// matters once someone scrolls to section 05 or opens the footer receipt.
// You Draw It needs ai-carbon-data.js, which the loader fetches first. The
// calculator and Anatomy of a Prompt that were here are on carbon-ai.html,
// and the Assay that sat under the contact form grew into The Brief, a
// page of its own (brief.html, brief.js).
//
// Loaded on demand by script.js (mks.load('interactives')), whose ON-DEMAND
// MODULES section says when, and why it declares nothing at the top level.
// ===================================================================

// ===================================
// SHARE HELPER — let an image a widget draws leave with the visitor.
// Web Share where available (mobile), else a download. Every payload links
// home.
// ===================================
window.mks.share = (() => {
    const SITE = (location.hostname + location.pathname).replace(/\/+$/, '') || 'moseskolleh.github.io/sustaintheworld';
    return {
        site: SITE,
        async image(canvas, filename, text) {
            try {
                if (navigator.share && navigator.canShare) {
                    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                    if (blob) {
                        const file = new File([blob], filename, { type: 'image/png' });
                        if (navigator.canShare({ files: [file] })) {
                            try { await navigator.share({ files: [file], text: text || '' }); return; }
                            catch (e) { if (e && e.name === 'AbortError') return; }
                        }
                    }
                }
            } catch (e) { /* fall through to download */ }
            try {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = filename;
                document.body.appendChild(a); a.click(); a.remove();
            } catch (e) { /* ignore */ }
        }
    };
})();


// ===================================
// YOU DRAW IT — predict AI's hidden energy curve, then reveal the estimates
// The NYT "you draw it" mechanic, powered by the shared AI carbon data.
// ===================================
(() => {
    const svg = document.getElementById('ydiSvg');
    const revealBtn = document.getElementById('ydiReveal');
    const resetBtn = document.getElementById('ydiReset');
    const verdictEl = document.getElementById('ydiVerdict');
    const hintEl = document.getElementById('ydiHint');
    const tableEl = document.getElementById('ydiTable');
    const shareBtn = document.getElementById('ydiShare');
    const cardCanvas = document.getElementById('ydiCardCanvas');
    const legendEl = document.getElementById('ydiLegend');
    const DATA = (typeof window !== 'undefined') ? window.AICarbonData : null;
    if (!svg || !revealBtn || !DATA) return;
    let cardData = null;

    const set = (e, attrs) => {
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    };
    // A group, not an image (which may hold no control); its words are for
    // the eye, the data table reads them.
    const mk = (name, attrs) => set(document.createElementNS('http://www.w3.org/2000/svg', name), name === 'text' ? { 'aria-hidden': 'true', ...attrs } : attrs);

    const KEYS = ['llama-32-1b', 'gpt-4-1-nano', 'gpt-4o-mini', 'gemini-15-flash', 'gemini-20-flash', 'llama-33-70b', 'claude-37-sonnet', 'gpt-4o', 'gemini-15-pro', 'deepseek-r1'];
    const SHORT = { 'llama-32-1b': '1B', 'gpt-4-1-nano': 'nano', 'gpt-4o-mini': '4o-mini', 'gemini-15-flash': '1.5 Flash', 'gemini-20-flash': '2.0 Flash', 'llama-33-70b': '70B', 'claude-37-sonnet': 'Sonnet', 'gpt-4o': 'GPT-4o', 'gemini-15-pro': '1.5 Pro', 'deepseek-r1': 'R1' };
    const models = KEYS.filter(k => DATA.MODELS[k]).map(k => {
        const m = DATA.MODELS[k], wh = m.energyPer1kTokens_Wh;
        return { key: k, label: m.label, short: SHORT[k] || m.label, wh, range: m.range || [wh, wh] };
    });
    const n = models.length;
    if (n < 5) return;
    const KNOWN = 3;

    // Drawn 640 units wide and scaled to fit, its labels were 5px tall on a
    // phone. It is as many units wide as the pixels it is shown in now (to
    // 640), so 11 units is 11px or more; under 480 it is taller (style.css
    // holds that shape), the model names steeper into the room below.
    const yMax = 1.6;
    let W, H, M, plotW, plotH, narrow;
    const xAt = (i) => M.l + (i / (n - 1)) * plotW;
    const yAt = (wh) => M.t + (1 - Math.min(wh, yMax) / yMax) * plotH;
    const whAtY = (y) => Math.max(0, Math.min(yMax, (1 - (y - M.t) / plotH) * yMax));
    const pts = (whs) => whs.map((wh, i) => `${xAt(i)},${yAt(wh)}`).join(' ');

    const guess = models.map((m, i) => (i < KNOWN ? m.wh : models[KNOWN - 1].wh));
    let revealed = false;
    let interacted = false;
    let cursor = KNOWN;

    // --- static layer: gridlines + y labels ---
    const grid = [0, 0.5, 1.0, 1.5].map(v => {
        const t = mk('text', { class: 'ydi-axis-label', 'text-anchor': 'end' });
        t.textContent = v.toFixed(1);
        return [v, svg.appendChild(mk('line', { class: 'ydi-grid' })), svg.appendChild(t)];
    });
    const yTitle = svg.appendChild(mk('text', { class: 'ydi-axis-title', 'text-anchor': 'start' }));
    yTitle.textContent = 'Wh / answer';

    // x labels
    const xLabels = models.map((m, i) => {
        const t = svg.appendChild(mk('text', { class: 'ydi-xlabel' + (i < KNOWN ? ' known' : ''), 'text-anchor': 'end' }));
        t.textContent = m.short;
        return t;
    });

    // divider + region labels
    const divider = svg.appendChild(mk('line', { class: 'ydi-divider' }));
    const pLabel = svg.appendChild(mk('text', { class: 'ydi-region-label predict', 'text-anchor': 'end' }));
    pLabel.textContent = 'you predict →';

    // known line + dots
    const knownLine = svg.appendChild(mk('polyline', { class: 'ydi-known-line' }));
    const knownDots = models.slice(0, KNOWN).map(() => svg.appendChild(mk('circle', { r: 4, class: 'ydi-known-dot' })));

    // the illustrative straight-line guess + the published estimates (both
    // revealed later, when the dots and the callout join them)
    const intuitLine = svg.appendChild(mk('polyline', { class: 'ydi-intuit-line' }));
    const realLine = svg.appendChild(mk('polyline', { class: 'ydi-real-line' }));
    const realDots = models.map(() => mk('circle', { r: 4, class: 'ydi-real-dot' }));
    const callout = mk('text', { class: 'ydi-callout', 'text-anchor': 'end' });

    // guess line + draggable dots
    const guessLine = svg.appendChild(mk('polyline', { class: 'ydi-guess-line' }));
    const guessDots = models.map((m, i) => (i < KNOWN ? null : svg.appendChild(mk('circle', { r: 5, class: 'ydi-guess-dot' }))));

    const drawGuess = () => {
        guessLine.setAttribute('points', pts(guess).split(' ').slice(KNOWN - 1).join(' '));
        for (let i = KNOWN; i < n; i++) set(guessDots[i], { cx: xAt(i), cy: yAt(guess[i]) });
        const g = guess[cursor].toFixed(2);
        set(hit, { 'aria-valuenow': g, 'aria-valuetext': `${models[cursor].short}: your guess ${g} Wh per answer` });
    };
    // Pulse the first predict dot so people know the curve is grabbable.
    if (guessDots[KNOWN]) guessDots[KNOWN].classList.add('ydi-dot-pulse');
    // Device-aware hint: touch users tap or drag; pointer users drag.
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (hintEl && coarse) hintEl.textContent = 'tap or drag across to draw';

    // --- interaction (pointer + keyboard) ---
    const cursorRing = svg.appendChild(mk('circle', { class: 'ydi-cursor', r: 9 }));
    // A slider, its value the guess at the cursor, spoken as it changes
    // (role=application allows no value: each arrow press was silent).
    const hit = svg.appendChild(mk('rect', { class: 'ydi-hit', fill: 'transparent', tabindex: 0, role: 'slider', 'aria-valuemin': 0, 'aria-valuemax': yMax,
        'aria-label': 'Draw your prediction: left/right arrows move between models, up/down arrows (or Page Up/Down, Home, End) raise or lower the guessed energy, Enter reveals the research estimates. The Reveal button and the data table below are equivalent.' }));

    // The published estimates, and a third line: a straight-line guess that
    // misses the reasoning spike, drawn, not sourced, so the legend and the
    // data table say illustrative.
    const drawReveal = () => {
        const tiny = models[0].wh;
        realLine.setAttribute('points', pts(models.map(m => m.wh)));
        realDots.forEach((c, i) => set(c, { cx: xAt(i), cy: yAt(models[i].wh) }));
        intuitLine.setAttribute('points', pts(models.map((m, i) => tiny + (i / (n - 1)) * (0.55 - tiny))));
        set(callout, { x: xAt(n - 1) - 8, y: yAt(models[n - 1].wh) - 12 });
    };

    const place = () => {
        W = Math.min(640, placedAt) || 640;   // placedAt is 0 before layout (and in jsdom)
        narrow = W < 480;
        H = Math.round(narrow ? W * 0.8 : W * 380 / 640);
        M = narrow ? { l: 36, r: 12, t: 30, b: 64 } : { l: 58, r: 18, t: 26, b: 86 };
        plotW = W - M.l - M.r;
        plotH = H - M.t - M.b;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const lift = narrow ? 14 : 10;
        const ly = H - M.b + (narrow ? 14 : 20);
        grid.forEach(([v, line, t]) => {
            set(line, { x1: M.l, y1: yAt(v), x2: W - M.r, y2: yAt(v) });
            set(t, { x: M.l - (narrow ? 6 : 10), y: yAt(v) + 4 });
        });
        set(yTitle, { x: narrow ? 4 : M.l - 46, y: M.t - lift });
        xLabels.forEach((t, i) => set(t, { x: xAt(i), y: ly, transform: `rotate(${narrow ? -45 : -40} ${xAt(i)} ${ly})` }));
        const dividerX = (xAt(KNOWN - 1) + xAt(KNOWN)) / 2;
        set(divider, { x1: dividerX, y1: M.t, x2: dividerX, y2: M.t + plotH });
        set(pLabel, { x: xAt(n - 1), y: M.t - lift });
        knownLine.setAttribute('points', pts(models.slice(0, KNOWN).map(m => m.wh)));
        knownDots.forEach((c, i) => set(c, { cx: xAt(i), cy: yAt(models[i].wh) }));
        set(hit, { x: M.l, y: M.t, width: plotW, height: plotH });
        set(cursorRing, { cx: xAt(cursor), cy: yAt(guess[cursor]) });
        drawGuess();
        if (revealed) {
            // A new length for the line: its draw-in dashes go.
            realLine.style.strokeDasharray = realLine.style.strokeDashoffset = '';
            drawReveal();
        }
    };
    let placedAt;
    const fit = () => {
        const w = Math.round(svg.getBoundingClientRect().width);
        if (w !== placedAt) { placedAt = w; place(); }
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(svg);

    const markInteracted = () => {
        if (interacted) return;
        interacted = true;
        if (hintEl) hintEl.style.opacity = '0';
        if (guessDots[KNOWN]) guessDots[KNOWN].classList.remove('ydi-dot-pulse');
    };
    const toLocal = (evt) => {
        const rect = svg.getBoundingClientRect();
        return { x: (evt.clientX - rect.left) / rect.width * W, y: (evt.clientY - rect.top) / rect.height * H };
    };
    const paint = (p) => {
        if (revealed) return;
        let i = Math.round((p.x - M.l) / plotW * (n - 1));
        i = Math.max(KNOWN, Math.min(n - 1, i));
        guess[i] = whAtY(p.y);
        cursor = i;
        drawGuess();
        markInteracted();
    };
    let dragging = false;
    hit.addEventListener('pointerdown', (e) => {
        dragging = true;
        if (hit.setPointerCapture) { try { hit.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } }
        paint(toLocal(e));
        e.preventDefault();
    });
    hit.addEventListener('pointermove', (e) => { if (dragging) { paint(toLocal(e)); e.preventDefault(); } });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointercancel', () => { dragging = false; });

    const moveCursor = () => set(cursorRing, { cx: xAt(cursor), cy: yAt(guess[cursor]) });
    hit.addEventListener('focus', () => { svg.classList.add('ydi-kbd'); moveCursor(); });
    hit.addEventListener('blur', () => { svg.classList.remove('ydi-kbd'); });
    // Every key a slider promises: Home, End and Page keys scrolled the page.
    hit.addEventListener('keydown', (e) => {
        if (revealed) return;
        const k = e.key;
        const step = yMax / (/^Page/.test(k) ? 6 : 24);
        if (k === 'ArrowLeft') cursor = Math.max(KNOWN, cursor - 1);
        else if (k === 'ArrowRight') cursor = Math.min(n - 1, cursor + 1);
        else if (k === 'ArrowUp' || k === 'PageUp') guess[cursor] = Math.min(yMax, guess[cursor] + step);
        else if (k === 'ArrowDown' || k === 'PageDown') guess[cursor] = Math.max(0, guess[cursor] - step);
        else if (k === 'Home' || k === 'End') guess[cursor] = k === 'End' ? yMax : 0;
        else if (k === 'Enter' || k === ' ') { doReveal(); e.preventDefault(); return; }
        else return;
        e.preventDefault();
        markInteracted();
        drawGuess();
        moveCursor();
    });

    // --- reveal ---
    const nudge = () => {
        if (hintEl) {
            hintEl.style.opacity = '';
            hintEl.classList.add('ydi-hint-nudge');
            setTimeout(() => hintEl.classList.remove('ydi-hint-nudge'), 1200);
        }
        if (guessDots[KNOWN]) guessDots[KNOWN].classList.add('ydi-dot-pulse');
    };

    const doReveal = () => {
        if (revealed) return;
        if (!interacted) { nudge(); return; }   // draw first — don't grade a guess never made
        revealed = true;
        const reduce = !window.mks.motionOK();
        drawReveal();
        svg.classList.add('revealed');
        // Draw the published estimates in, left to right.
        if (!reduce && realLine.getTotalLength) {
            const len = realLine.getTotalLength();
            realLine.style.strokeDasharray = String(len);
            realLine.style.strokeDashoffset = String(len);
            realLine.getBoundingClientRect(); // force reflow before transitioning
            realLine.style.transition = 'stroke-dashoffset 0.85s ease';
            realLine.style.strokeDashoffset = '0';
        }
        realDots.forEach(c => svg.appendChild(c));
        if (hintEl) hintEl.style.opacity = '0';
        if (resetBtn) resetBtn.hidden = false;
        if (shareBtn) shareBtn.hidden = false;
        // Reveal goes, and focus with it to the page, where a screen reader
        // says nothing of where it went: hand it to what takes its place.
        const next = shareBtn || resetBtn;
        if (next && document.activeElement === revealBtn) next.focus();
        revealBtn.hidden = true;

        // Each figure is a published estimate with a range, good to an order
        // of magnitude. A guess inside the range is not wrong, and a gap
        // quoted to a decimal against the central value was false precision.
        const gWh = Math.max(guess[n - 1], 0);
        const rWh = models[n - 1].wh;
        const tiny = models[0].wh;
        const [lo, hi] = models[n - 1].range, [tLo, tHi] = models[0].range;
        const factorFrontier = Math.round(rWh / tiny);
        const factors = `${Math.round(lo / tHi)}–${Math.round(hi / tLo).toLocaleString('en')}×`;
        const est = `The published estimate is about ${rWh} Wh (${lo}–${hi} Wh)`;
        let msg;
        if (gWh < 0.02) msg = `You put the biggest model near zero. ${est}: a dramatic underestimate of the frontier.`;
        else if (gWh < lo) msg = `You put the biggest model at ~${gWh.toFixed(2)} Wh. ${est}, so you underestimated the frontier, about ${Math.round(rWh / gWh)}× below its central figure.`;
        else if (gWh > hi) msg = `You had the frontier at ~${gWh.toFixed(2)} Wh. ${est}, so that is an overestimate.`;
        else msg = `You had the frontier at ~${gWh.toFixed(2)} Wh. ${est}: your guess is within that range.`;
        msg += ` A 1B model answers for about ${tiny} Wh, so the frontier reasoning model uses roughly ${factorFrontier}× more for the same 1,000-token answer (${factors} across the ranges). That gap is what the tools people prompt with rarely show them.`;
        // Shape grade: did they capture the frontier spike, not just a magnitude?
        let guessPeak = KNOWN;
        for (let i = KNOWN + 1; i < n; i++) if (guess[i] > guess[guessPeak]) guessPeak = i;
        const spread = guess[n - 1] - guess[KNOWN];
        let shape;
        if (guessPeak === n - 1 && gWh >= lo) shape = 'You nailed the shape — you saw the frontier spike.';
        else if (guessPeak === n - 1) shape = 'You saw the spike, but under-scaled how steep it gets.';
        else if (spread < 0.1) shape = 'You drew it nearly flat — the research estimates hide a cliff at the frontier.';
        else shape = 'You put the peak before the frontier — the reasoning model is the outlier.';
        if (verdictEl) { verdictEl.innerHTML = `<span class="ydi-shape">${shape}</span> ${msg}`; verdictEl.hidden = false; }
        cardData = { shape, factor: factorFrontier, factors };
        // Callout on the frontier spike, where drawReveal put it.
        callout.textContent = `R1 · ~${factorFrontier}× a 1B model`;
        svg.appendChild(callout);
        if (legendEl) legendEl.hidden = false;
    };
    revealBtn.addEventListener('click', doReveal);

    // Shareable result card (dark, on-brand) — reuses the canvas-PNG pattern.
    const wrapText = (ctx, text, maxWidth) => {
        const words = text.split(' ');
        const out = [];
        let line = '';
        words.forEach(w => {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = w; }
            else line = test;
        });
        if (line) out.push(line);
        return out;
    };
    const drawCard = () => {
        if (!cardCanvas || !cardCanvas.getContext || !cardData) return;
        const scale = 2, W = 460, padX = 32, cw = W - padX * 2;
        let ctx = cardCanvas.getContext('2d');
        if (!ctx) return;
        ctx.font = "600 19px 'Space Grotesk', system-ui, sans-serif";
        const shapeLines = wrapText(ctx, cardData.shape, cw);
        ctx.font = "400 16px 'Inter', system-ui, sans-serif";
        const factorText = `By the published estimates, the frontier reasoning model uses about ${cardData.factor}× the energy per answer of a 1B model (${cardData.factors} across their ranges).`;
        const factorLines = wrapText(ctx, factorText, cw);
        const headerH = 78;
        const H = headerH + 26 + shapeLines.length * 26 + 14 + factorLines.length * 23 + 66;
        cardCanvas.width = W * scale; cardCanvas.height = H * scale;
        ctx = cardCanvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.fillStyle = '#0b1705'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#7CFC00'; ctx.font = "700 24px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("AI's Hidden Curve", padX, 40);
        ctx.fillStyle = '#9fdf7a'; ctx.font = "400 13px 'IBM Plex Mono', monospace";
        ctx.fillText('I guessed what one AI answer costs', padX, 62);
        let y = headerH + 22;
        ctx.fillStyle = '#eaffe0'; ctx.font = "600 19px 'Space Grotesk', system-ui, sans-serif";
        shapeLines.forEach(l => { ctx.fillText(l, padX, y); y += 26; });
        y += 12;
        ctx.fillStyle = '#cfe8c0'; ctx.font = "400 16px 'Inter', system-ui, sans-serif";
        factorLines.forEach(l => { ctx.fillText(l, padX, y); y += 23; });
        y += 24;
        ctx.fillStyle = '#7CFC00'; ctx.font = "600 15px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText('Moses Kolleh Sesay', padX, y);
        ctx.fillStyle = '#88a878'; ctx.font = "400 12px 'IBM Plex Mono', monospace";
        ctx.fillText(window.mks.share ? window.mks.share.site : 'moseskolleh.github.io/sustaintheworld', padX, y + 18);
    };
    if (shareBtn && cardCanvas) {
        shareBtn.addEventListener('click', () => {
            drawCard();
            const text = `${cardData ? cardData.shape : ''} I tried to guess what one AI answer costs. ${window.mks.share ? window.mks.share.site : ''}`;
            if (window.mks.share) window.mks.share.image(cardCanvas, 'ai-hidden-curve.png', text);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            revealed = false;
            svg.classList.remove('revealed');   // which hides the two lines
            realLine.style.cssText = '';
            if (legendEl) legendEl.hidden = true;
            realDots.forEach(d => d.remove());
            callout.remove();
            for (let i = KNOWN; i < n; i++) guess[i] = models[KNOWN - 1].wh;
            drawGuess();
            if (verdictEl) { verdictEl.hidden = true; verdictEl.textContent = ''; }
            revealBtn.hidden = false;
            if (document.activeElement === resetBtn) revealBtn.focus();
            resetBtn.hidden = true;
            if (shareBtn) shareBtn.hidden = true;
            interacted = false;
            if (hintEl) hintEl.style.opacity = '';
            if (guessDots[KNOWN]) guessDots[KNOWN].classList.add('ydi-dot-pulse');
        });
    }

    // --- accessible, non-visual data table ---
    if (tableEl) {
        const rows = models.map(m => `<tr><td>${m.label}</td><td>${m.wh} Wh</td></tr>`).join('');
        tableEl.innerHTML = `<table><caption>Estimated energy per 1,000-token answer by model: published estimates, to an order of magnitude, before data-centre overhead. The chart's straight-line guess is illustrative — from no source — so it is not listed here.</caption><thead><tr><th>Model</th><th>Wh per answer</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
})();


// ===================================
// THE RECEIPT — this page prints its own itemised carbon bill
// Reads the same Resource Timing data as the footer badge, groups it by asset
// class, and renders a thermal-receipt you can save as a PNG. Pure vanilla:
// the PNG is drawn on a <canvas>, no library, no gigabyte of anything.
// ===================================
(() => {
    const btn = document.getElementById('receiptBtn');
    const panel = document.getElementById('receiptPanel');
    const body = document.getElementById('receiptBody');
    const dlBtn = document.getElementById('receiptDownload');
    const canvas = document.getElementById('receiptCanvas');
    if (!btn || !panel || !body) return;

    // The footer badge (script.js) defines what a byte weighs and how a
    // resource is measured; the receipt uses the same definitions rather than
    // carrying a copy that could drift.
    const carbon = window.mks.carbon;
    if (!carbon) return;
    const G_CO2_PER_MB = carbon.gramsPerMB;
    const MEDIAN_MB = carbon.medianPageMB;
    const bytesOf = carbon.bytesOf;
    const pageOrigin = location.origin;
    const urlText = (location.hostname + location.pathname).replace(/\/+$/, '') || 'moseskolleh.github.io/sustaintheworld';
    let lastReceiptG = 0;

    const classify = (r) => {
        const t = r.initiatorType;
        const n = (r.name || '').toLowerCase();
        if (/\.(woff2?|ttf|otf|eot)(\?|$)/.test(n)) return 'Fonts';
        if (t === 'img' || /\.(webp|png|jpe?g|gif|svg|avif)(\?|$)/.test(n)) return 'Images';
        if (t === 'script' || /\.js(\?|$)/.test(n)) return 'Scripts';
        if (t === 'link' || t === 'css' || /\.css(\?|$)/.test(n)) return 'Styles';
        return 'Other';
    };

    const ORDER = ['HTML', 'Styles', 'Scripts', 'Fonts', 'Images', 'Other'];

    const gather = () => {
        const g = { HTML: 0, Styles: 0, Scripts: 0, Fonts: 0, Images: 0, Other: 0 };
        let unmeasured = 0;
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) g.HTML += bytesOf(nav);
            performance.getEntriesByType('resource').forEach(r => {
                const b = bytesOf(r);
                if (b === 0) {
                    if (r.name && r.name.indexOf(pageOrigin) !== 0) unmeasured++;
                    return;
                }
                g[classify(r)] += b;
            });
        } catch (e) { /* older browsers: receipt stays empty */ }
        return { g, unmeasured };
    };

    const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : Math.round(b / 1024) + ' KB');
    const fmtG = (grams) => (grams >= 1 ? grams.toFixed(2) : grams.toFixed(3)) + ' g';

    const buildLines = () => {
        const { g, unmeasured } = gather();
        let total = 0;
        ORDER.forEach(k => { total += g[k]; });
        const totalMb = total / 1048576;
        const totalG = totalMb * G_CO2_PER_MB;
        lastReceiptG = totalG;
        const dt = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}  ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

        const lines = [];
        lines.push({ t: 'c', s: 'MKS · SUSTAINTHEWORLD', b: true });
        lines.push({ t: 'c', s: 'page-load carbon receipt' });
        lines.push({ t: 'c', s: stamp, dim: true });
        lines.push({ t: 'd' });
        ORDER.forEach(k => {
            if (g[k] > 0) {
                const grams = (g[k] / 1048576) * G_CO2_PER_MB;
                lines.push({ t: 'r', l: k, r: `${fmtSize(g[k])}   ${fmtG(grams)}` });
            }
        });
        lines.push({ t: 'd' });
        lines.push({ t: 'r', l: 'TOTAL', r: `${fmtSize(total)}   ${fmtG(totalG)}`, b: true });
        lines.push({ t: 'c', s: 'CO₂e · global avg grid', dim: true });
        lines.push({ t: 'd' });
        lines.push({ t: 'r', l: 'Median web page', r: `${MEDIAN_MB.toFixed(2)} MB` });
        if (totalMb < MEDIAN_MB) {
            lines.push({ t: 'c', s: `— you're ${Math.round((1 - totalMb / MEDIAN_MB) * 100)}% lighter —` });
        }
        lines.push({ t: 'r', l: 'Text-only report', r: '11 KB' });
        if (unmeasured) {
            lines.push({ t: 'c', s: `* ${unmeasured} off-site request${unmeasured > 1 ? 's' : ''} not counted`, dim: true });
        }
        lines.push({ t: 'd' });
        lines.push({ t: 'c', s: 'browsed lightly — say hello' });
        lines.push({ t: 'd' });
        lines.push({ t: 'c', s: 'MOSES KOLLEH SESAY', b: true });
        lines.push({ t: 'c', s: urlText, dim: true });
        lines.push({ t: 'c', s: 'climate · ESG · sustainable AI' });
        lines.push({ t: 'c', s: '||‖|‖||‖|||‖|‖||‖|||', mono: true });
        return lines;
    };

    const renderDOM = (lines) => {
        body.innerHTML = '';
        lines.forEach(ln => {
            let el;
            if (ln.t === 'd') {
                el = document.createElement('div');
                el.className = 'receipt-divider';
            } else if (ln.t === 'c') {
                el = document.createElement('div');
                el.className = 'receipt-center' + (ln.b ? ' receipt-strong' : '') + (ln.dim ? ' receipt-dim' : '') + (ln.mono ? ' receipt-barcode' : '');
                el.textContent = ln.s;
            } else {
                el = document.createElement('div');
                el.className = 'receipt-row' + (ln.b ? ' receipt-strong' : '');
                const l = document.createElement('span'); l.textContent = ln.l;
                const r = document.createElement('span'); r.textContent = ln.r;
                el.appendChild(l); el.appendChild(r);
            }
            body.appendChild(el);
        });
    };

    const drawCanvas = (lines) => {
        if (!canvas || !canvas.getContext) return;
        const scale = 2, W = 340, padX = 22, padY = 22, lh = 22;
        const H = padY * 2 + lines.length * lh;
        canvas.width = W * scale;
        canvas.height = H * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f5f3ea';
        ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'middle';
        let y = padY + lh / 2;
        lines.forEach(ln => {
            ctx.fillStyle = ln.dim ? '#6b665a' : '#1a1a1a';
            ctx.font = `${ln.b ? '700' : '400'} 13px 'IBM Plex Mono', ui-monospace, monospace`;
            if (ln.t === 'd') {
                ctx.strokeStyle = '#b7b1a1';
                ctx.setLineDash([2, 3]);
                ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
                ctx.setLineDash([]);
            } else if (ln.t === 'c') {
                ctx.textAlign = 'center';
                ctx.fillText(ln.s, W / 2, y);
            } else {
                ctx.textAlign = 'left';
                ctx.fillText(ln.l, padX, y);
                ctx.textAlign = 'right';
                ctx.fillText(ln.r, W - padX, y);
            }
            y += lh;
        });
    };

    let built = false;
    const build = () => {
        const lines = buildLines();
        renderDOM(lines);
        drawCanvas(lines);
        built = true;
    };

    btn.addEventListener('click', () => {
        const open = panel.hasAttribute('hidden');
        if (open) build();
        panel.toggleAttribute('hidden', !open);
        btn.setAttribute('aria-expanded', String(open));
        if (open) panel.scrollIntoView({ behavior: window.mks.scrollMotion(), block: 'nearest' });
    });

    if (dlBtn && canvas) {
        dlBtn.addEventListener('click', () => {
            if (!built) build();
            const fn = 'carbon-receipt-' + lastReceiptG.toFixed(3).replace('.', '_') + 'g.png';
            if (!window.mks.share) return;
            const msg = `This whole climate portfolio cost ${lastReceiptG.toFixed(2)} g CO₂e to view — ${window.mks.share.site}`;
            window.mks.share.image(canvas, fn, msg);
        });
    }
})();

// Tells the loader in script.js that this module is in place.
window.mks.loaded.interactives = true;
