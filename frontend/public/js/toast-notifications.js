/**
 * Live Activity Toast Notifications
 * Shows a rotating stream of fake "social proof" activity toasts
 * (signups, subscriptions, course joins, etc.) at the top of the page.
 * One toast appears every 3s and each toast auto-dismisses after 3s.
 */
(function () {
    const NAMES = [
        'Tom', 'John', 'Alice', 'Sarah', 'Michael', 'Emma', 'David',
        'Grace', 'Daniel', 'Olivia', 'James', 'Sophia', 'Ethan',
        'Mia', 'Liam', 'Ava', 'Noah', 'Isabella', 'Lucas', 'Chloe'
    ];

    const COURSES = [
        'Python for Beginners', 'Cybersecurity Fundamentals',
        'Full-Stack Web Development', 'Ethical Hacking',
        'JavaScript Mastery', 'Data Structures & Algorithms'
    ];

    // Each template returns { icon, title, meta }
    const ACTIVITY_TEMPLATES = [
        (name) => ({
            icon: name.charAt(0),
            title: `<span class="toast-name">${name}</span> joined the community`,
            meta: 'Just now'
        }),
        (name) => ({
            icon: name.charAt(0),
            title: `<span class="toast-name">${name}</span> signed up`,
            meta: 'A few seconds ago'
        }),
        (name) => ({
            icon: name.charAt(0),
            title: `<span class="toast-name">${name}</span> subscribed to Pro`,
            meta: 'Just now'
        }),
        (name) => {
            const course = COURSES[Math.floor(Math.random() * COURSES.length)];
            return {
                icon: name.charAt(0),
                title: `<span class="toast-name">${name}</span> enrolled in ${course}`,
                meta: 'Just now'
            };
        },
        (name) => {
            const course = COURSES[Math.floor(Math.random() * COURSES.length)];
            return {
                icon: '<i class="fa-solid fa-certificate"></i>',
                title: `<span class="toast-name">${name}</span> completed ${course}`,
                meta: 'A moment ago'
            };
        },
        (name) => ({
            icon: '<i class="fa-solid fa-star"></i>',
            title: `<span class="toast-name">${name}</span> left a 5-star review`,
            meta: 'Just now'
        })
    ];

    const DISPLAY_INTERVAL = 3000; // new toast every 3s
    const AUTO_DISMISS = 3000;     // each toast disappears after 3s

    let usedRecently = [];

    function pickName() {
        // Avoid repeating the same name back-to-back too often
        let name;
        do {
            name = NAMES[Math.floor(Math.random() * NAMES.length)];
        } while (usedRecently.includes(name) && usedRecently.length < NAMES.length);
        usedRecently.push(name);
        if (usedRecently.length > 4) usedRecently.shift();
        return name;
    }

    function buildToast() {
        const name = pickName();
        const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
        return template(name);
    }

    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast() {
        const container = ensureContainer();
        const data = buildToast();

        const toastEl = document.createElement('div');
        toastEl.className = 'activity-toast';
        toastEl.innerHTML = `
            <div class="toast-icon">${data.icon}</div>
            <div class="toast-body">
                <div class="toast-title">${data.title}</div>
                <div class="toast-meta"><i class="fa-solid fa-circle"></i>${data.meta}</div>
            </div>
            <button class="toast-close" aria-label="Dismiss">&times;</button>
        `;

        container.appendChild(toastEl);

        // Trigger enter animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toastEl.classList.add('toast-show'));
        });

        const dismiss = () => {
            if (toastEl.dataset.dismissed) return;
            toastEl.dataset.dismissed = 'true';
            toastEl.classList.remove('toast-show');
            toastEl.classList.add('toast-hide');
            setTimeout(() => toastEl.remove(), 400);
        };

        const timer = setTimeout(dismiss, AUTO_DISMISS);

        toastEl.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            dismiss();
        });
    }

    function startToastLoop() {
        // Show the first one shortly after page load, then every 3s
        setTimeout(showToast, 1500);
        setInterval(showToast, DISPLAY_INTERVAL);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startToastLoop);
    } else {
        startToastLoop();
    }
})();
