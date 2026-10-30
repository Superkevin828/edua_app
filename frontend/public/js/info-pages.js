(function () {
    var root = document.documentElement;
    var themeToggle = document.getElementById('themeToggle');
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('navMenu');

    function updateThemeIcon(theme) {
        var icon = themeToggle ? themeToggle.querySelector('i') : null;
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    updateThemeIcon(root.getAttribute('data-theme') || 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = (root.getAttribute('data-theme') || 'light') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try {
                localStorage.setItem('theme', next);
            } catch (e) {
                // Theme still applies for this page view.
            }
            updateThemeIcon(next);
        });
    }

    function closeMenu() {
        if (navMenu) navMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.classList.remove('nav-open');
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            var open = navMenu.classList.toggle('active');
            hamburger.classList.toggle('active', open);
            document.body.classList.toggle('nav-open', open);
        });

        document.addEventListener('click', function (event) {
            if (navMenu.classList.contains('active') && !navMenu.contains(event.target) && !hamburger.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeMenu();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) closeMenu();
        });
    }

    var year = document.getElementById('footerYear');
    if (year) year.textContent = new Date().getFullYear();

    var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.info-toc a[href^="#"]'));
    if (tocLinks.length && 'IntersectionObserver' in window) {
        var sections = tocLinks.map(function (link) {
            return document.querySelector(link.getAttribute('href'));
        }).filter(Boolean);

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                tocLinks.forEach(function (link) {
                    link.style.color = link.getAttribute('href') === '#' + entry.target.id ? 'var(--primary)' : '';
                });
            });
        }, { rootMargin: '-20% 0px -65% 0px' });

        sections.forEach(function (section) { observer.observe(section); });
    }
})();
