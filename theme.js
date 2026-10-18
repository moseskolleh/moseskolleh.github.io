// THEME for the pages on carbon-ai.css, from <head>: the README's "No dead ends".
(function (root) {
    var bar = document.querySelector('meta[name="theme-color"]');
    var button;
    function chosen() {
        var t;
        try { t = localStorage.getItem('theme'); } catch (e) { /* blocked */ }
        return t === 'light' || t === 'dark' ? t
            : window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function show(theme) {
        var light = theme === 'light';
        root.setAttribute('data-theme', theme);
        if (bar) bar.setAttribute('content', light ? '#f4f6f0' : '#0a0a0a');
        if (!button) return;
        button.setAttribute('aria-label', 'Switch to ' + (light ? 'dark' : 'light') + ' theme');
        button.querySelector('use').setAttribute('href', light ? '#i-sun' : '#i-moon');
    }
    show(chosen());
    document.addEventListener('DOMContentLoaded', function () {
        button = document.getElementById('themeToggle');
        if (!button) return;
        button.onclick = function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            try { localStorage.setItem('theme', next); } catch (e) { /* this page only */ }
            show(next);
        };
        show(root.getAttribute('data-theme'));
        button.hidden = false;   // shipped hidden: without this it does nothing
    });
    // Back from the page cache: the choice may have changed since.
    window.addEventListener('pageshow', function (e) { if (e.persisted) show(chosen()); });
})(document.documentElement);
