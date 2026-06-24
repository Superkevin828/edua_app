// ============================================
// LearnPremium - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initScrollAnimations();
    initCourseEnrollment();
    initSmoothScroll();
    initLoader();
    initPricingButtons();
    initMobileMenu();
    checkAuth();
    checkUserRole();
});

// Auto-detect and apply system/browser theme preference
(function() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
})();

// ============================================
// Theme Management
// ============================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ============================================
// Navigation Management
// ============================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
            hamburger?.classList.remove('active');
        });
    });
    
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

function initMobileMenu() {
    document.addEventListener('click', (e) => {
        const navMenu = document.getElementById('navMenu');
        const hamburger = document.getElementById('hamburger');
        
        if (navMenu && hamburger && navMenu.classList.contains('active')) {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
}

// ============================================
// Scroll Animations (AOS)
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// Course Enrollment
// ============================================
function initCourseEnrollment() {
    // Courses that require Pro or Premium subscription.
    // Matches the data-course attribute values on the buttons.
    const PREMIUM_COURSES = ['python-cybersecurity'];

    document.querySelectorAll('.course-enroll').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const courseName = button.getAttribute('data-course');
            const token = localStorage.getItem('token');
            
            if (!token) {
                showToast('Please sign up to enroll in this course', 'info');
                setTimeout(() => {
                    window.location.href = `views/signup.html?course=${courseName}`;
                }, 1500);
                return;
            }

            // ── Premium gating ──────────────────────────────────────────
            // If this course requires a paid plan, check the user's current
            // subscription stored in localStorage. Free-plan users see the
            // pricing modal instead of being sent straight to enrollment.
            if (PREMIUM_COURSES.includes(courseName)) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const plan = (user.subscription || 'free').toLowerCase();
                if (plan === 'free') {
                    // openPricingModal() is defined in index.html's inline script
                    if (typeof openPricingModal === 'function') {
                        const titleEl = document.getElementById('pricingModalTitle');
                        if (titleEl) titleEl.textContent = 'Upgrade to unlock Cybersecurity';
                        openPricingModal();
                    } else {
                        // Fallback: scroll to the pricing section
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        showToast('This course requires a Pro or Premium plan', 'info');
                    }
                    return; // stop — do NOT call the enroll API
                }
            }
            // ────────────────────────────────────────────────────────────
            
            const originalText = button.innerHTML;
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
            
            try {
                const response = await fetch(`${window.API_BASE}/courses/enroll`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ courseName })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Successfully enrolled! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = `views/course.html?id=${data.courseId}`;
                    }, 1500);
                } else {
                    throw new Error(data.message || 'Enrollment failed');
                }
            } catch (error) {
                showToast(error.message, 'error');
                button.classList.remove('loading');
                button.disabled = false;
                button.innerHTML = originalText;
            }
        });
    });
}

// ============================================
// Pricing Buttons
// ============================================
// NOTE: Pricing card buttons on index.html use an inline onclick="handlePlanSelect(...)"
// (defined in index.html itself) which calls /pesapal/create-order directly and
// redirects straight to Pesapal's checkout. This function used to ALSO attach a
// second, independent click listener to the same buttons, which redirected to
// views/dashboard.html after a short delay — firing in parallel with (and
// aborting) the real checkout request. That produced the "click subscribe ->
// land on dashboard -> Pesapal shows up ~4s later" detour. Intentionally a
// no-op now so only the real handlePlanSelect() flow runs.
function initPricingButtons() {}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// Loading Animation
// ============================================
function initLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => {
                    loader.remove();
                }, 500);
            }, 800);
        });
    }
}

// ============================================
// Check Authentication Status
// ============================================
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const loginBtn = document.querySelector('.nav-actions .btn-outline');
    const signupBtn = document.querySelector('.nav-actions .btn-primary');
    
    if (token && user) {
        if (loginBtn) {
            loginBtn.textContent = 'Dashboard';
            loginBtn.href = 'views/dashboard.html';
        }
        if (signupBtn) {
            signupBtn.textContent = 'My Courses';
            signupBtn.href = 'views/dashboard.html';
        }
    }
}

function checkUserRole() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user) {
        const loginBtn = document.querySelector('.nav-actions .btn-outline');
        const signupBtn = document.querySelector('.nav-actions .btn-primary');
        
        if (user.isAdmin || user.role === 'admin') {
            if (loginBtn) {
                loginBtn.textContent = 'Admin Panel';
                loginBtn.href = 'views/admin/dashboard.html';
                loginBtn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                loginBtn.style.color = 'white';
                loginBtn.style.border = 'none';
            }
            if (signupBtn) {
                signupBtn.textContent = 'Dashboard';
                signupBtn.href = 'views/dashboard.html';
            }
        } else {
            if (loginBtn) {
                loginBtn.textContent = 'Dashboard';
                loginBtn.href = 'views/dashboard.html';
            }
            if (signupBtn) {
                signupBtn.textContent = 'My Courses';
                signupBtn.href = 'views/dashboard.html';
            }
        }
    }
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ============================================
// API Helper Functions
// ============================================
const API = {
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    async get(endpoint) {
        try {
            const response = await fetch(`${window.API_BASE}${endpoint}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${window.API_BASE}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    async put(endpoint, data) {
        try {
            const response = await fetch(`${window.API_BASE}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    async delete(endpoint) {
        try {
            const response = await fetch(`${window.API_BASE}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// ============================================
// Utility Functions
// ============================================
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.click();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const token = localStorage.getItem('token');
        if (token) {
            window.location.href = 'views/dashboard.html';
        }
    }
});

// ============================================
// Error Handling
// ============================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// Service Worker Registration
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}