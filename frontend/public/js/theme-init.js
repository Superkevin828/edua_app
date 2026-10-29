/* Applies the saved theme, or the browser/system preference when none is saved. */
(function () {
    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    function getSavedTheme() {
        try {
            var saved = localStorage.getItem('theme');
            return saved === 'dark' || saved === 'light' ? saved : null;
        } catch (e) {
            return null;
        }
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
    }

    applyTheme(getSavedTheme() || (media.matches ? 'dark' : 'light'));

    function onSystemThemeChange(event) {
        if (!getSavedTheme()) {
            applyTheme(event.matches ? 'dark' : 'light');
            document.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: event.matches ? 'dark' : 'light' }
            }));
        }
    }

    if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', onSystemThemeChange);
    } else if (typeof media.addListener === 'function') {
        media.addListener(onSystemThemeChange);
    }
})();
