(function () {
    const sidebar = document.querySelector('.admin-sidebar');
    const header = document.querySelector('.admin-header');
    const brand = document.querySelector('.admin-brand');

    if (!sidebar || !header || sidebar.dataset.mobileReady) return;
    sidebar.dataset.mobileReady = 'true';

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'admin-menu-btn';
    menuBtn.setAttribute('aria-label', 'Open admin menu');
    menuBtn.setAttribute('aria-controls', 'adminSidebar');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    header.prepend(menuBtn);

    const overlay = document.createElement('div');
    overlay.className = 'admin-sidebar-overlay';
    document.body.appendChild(overlay);

    let closeBtn = null;
    if (brand) {
        closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'admin-sidebar-close';
        closeBtn.setAttribute('aria-label', 'Close admin menu');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        brand.appendChild(closeBtn);
    }

    const setOpen = (open) => {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);
    };

    menuBtn.addEventListener('click', () => setOpen(true));
    overlay.addEventListener('click', () => setOpen(false));
    closeBtn?.addEventListener('click', () => setOpen(false));

    sidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setOpen(false);
    });
})();
