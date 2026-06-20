// ============================================
// LearnPremium Dashboard - Complete JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

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

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    initDashboard();
    initLogout();
    initThemeToggle();
    initMobileMenu();
    initSidebarNav();
    initSearch();
    loadDashboardData();
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    setTimeout(() => {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    }, 800);
});

// ============================================
// Hash/URL Navigation
// ============================================
function handleHashChange() {
    const hash = window.location.hash;
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    
    if (hash === '#browse-courses') {
        switchTab('browse-courses');
        document.querySelector('.nav-browse')?.classList.add('active');
    } else if (hash === '#my-courses') {
        switchTab('my-courses');
        document.querySelector('.nav-my-courses')?.classList.add('active');
    } else if (hash === '#progress') {
        switchTab('progress');
    } else if (hash === '#certificates') {
        switchTab('certificates');
    } else {
        switchTab('my-courses');
        document.querySelector('.nav-dashboard')?.classList.add('active');
    }
}

// ============================================
// Tab Switching
// ============================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const sections = ['myCoursesSection', 'browseCoursesSection', 'progressSection', 'certificatesSection'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    switch(tabName) {
        case 'my-courses':
            document.getElementById('myCoursesSection').style.display = 'block';
            document.querySelector('.tab-btn:nth-child(1)')?.classList.add('active');
            window.location.hash = 'my-courses';
            break;
        case 'browse-courses':
            document.getElementById('browseCoursesSection').style.display = 'block';
            document.querySelector('.tab-btn:nth-child(2)')?.classList.add('active');
            window.location.hash = 'browse-courses';
            break;
        case 'progress':
            document.getElementById('progressSection').style.display = 'block';
            window.location.hash = 'progress';
            break;
        case 'certificates':
            document.getElementById('certificatesSection').style.display = 'block';
            window.location.hash = 'certificates';
            break;
    }
}

// ============================================
// Initialize Dashboard
// ============================================
function initDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.fullName) {
        document.getElementById('userName').textContent = user.fullName;
        const headerName = document.querySelector('.user-name');
        if (headerName) headerName.textContent = user.fullName;
    }
}

// ============================================
// Load Dashboard Data from API
// ============================================
async function loadDashboardData() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${window.API_BASE}/users/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to load dashboard');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
            loadEnrolledCourses(data.enrolledCourses);
            loadAvailableCourses(data.availableCourses);
            updateProgress(data.progress);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Please refresh.');
    }
}

// ============================================
// Update Stats
// ============================================
function updateDashboardStats(stats) {
    if (!stats) return;
    document.getElementById('enrolledCourses').textContent = stats.enrolledCourses || 0;
    document.getElementById('completedLessons').textContent = stats.completedLessons || 0;
    document.getElementById('totalHours').textContent = (stats.totalHours || 0) + 'h';
}

// ============================================
// Load Enrolled Courses
// ============================================
function loadEnrolledCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    
    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-book-open" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <h3>No Enrolled Courses</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Browse available courses to start learning!</p>
                <button class="btn btn-primary" onclick="switchTab('browse-courses')">
                    <i class="fas fa-search"></i> Browse Courses
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = courses.map(course => `
        <div class="course-card enrolled" onclick="window.location.href='course.html?id=${course._id}'" style="cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">
                    ${course.category || 'Course'}
                </span>
                <span style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">
                    ${Math.round(course.progress || 0)}%
                </span>
            </div>
            <h3 style="margin-bottom: 8px; font-size: 1.1rem;">${course.title}</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 15px;">
                ${(course.description || '').substring(0, 80)}...
            </p>
            <div style="width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                <div style="height: 100%; width: ${course.progress || 0}%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted);">
                <span><i class="fas fa-check-circle"></i> ${course.completedLessons || 0}/${course.totalLessons || 0} Lessons</span>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.location.href='course.html?id=${course._id}'">
                    <i class="fas fa-play"></i> Continue
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// Premium Course Gating
// ============================================
function isPremiumCourse(course) {
    const text = `${course.category || ''} ${course.title || ''}`.toLowerCase();
    return text.includes('cyber');
}

function getUserPlan() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.subscription || 'free';
}

function renderCourseActionButton(course) {
    if (isPremiumCourse(course) && getUserPlan() === 'free') {
        const safeTitle = (course.title || 'this course').replace(/'/g, "\\'");
        return `
            <button class="btn btn-primary btn-block" onclick="requirePlanForCourse('${safeTitle}')">
                <i class="fas fa-lock"></i> Unlock with Pro / Premium
            </button>
        `;
    }
    return `
        <button class="btn btn-primary btn-block enroll-btn" onclick="enrollInCourse(event, '${course._id}')">
            <i class="fas fa-plus-circle"></i> Enroll Now - Free
        </button>
    `;
}

// ============================================
// Load Available Courses
// ============================================
function loadAvailableCourses(courses) {
    const grid = document.getElementById('availableCoursesGrid');
    if (!grid) return;
    
    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981; margin-bottom: 20px;"></i>
                <h3>All Caught Up!</h3>
                <p style="color: var(--text-secondary);">You're enrolled in all available courses.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = courses.map(course => `
        <div class="course-card available" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">
                    ${course.category || 'Course'}
                </span>
                ${isPremiumCourse(course) && getUserPlan() === 'free'
                    ? `<span style="background:#ede9fe; color:#6d28d9; padding:4px 12px; border-radius:15px; font-size:0.75rem; font-weight:600;"><i class="fas fa-lock"></i> Pro/Premium</span>`
                    : `<span style="font-size: 0.9rem; color: var(--text-muted);"><i class="fas fa-star" style="color: #f59e0b;"></i> ${course.rating || '4.5'}</span>`}
            </div>
            <h3 style="margin-bottom: 8px; font-size: 1.1rem;">${course.title}</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">
                ${(course.description || '').substring(0, 80)}...
            </p>
            <div style="display: flex; gap: 15px; margin-bottom: 15px; font-size: 0.85rem; color: var(--text-muted);">
                <span><i class="fas fa-clock"></i> ${course.duration || 'N/A'}</span>
                <span><i class="fas fa-signal"></i> ${course.level || 'All'}</span>
                <span><i class="fas fa-book"></i> ${course.totalLessons || 0} Lessons</span>
            </div>
            ${renderCourseActionButton(course)}
        </div>
    `).join('');
}

// ============================================
// Enroll in Course
// ============================================
async function enrollInCourse(event, courseId) {
    event.stopPropagation();
    
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${window.API_BASE}/courses/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseName: courseId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            button.innerHTML = '<i class="fas fa-check"></i> Enrolled!';
            button.style.background = '#10b981';
            
            showToast('Successfully enrolled!', 'success');
            
            setTimeout(() => {
                window.location.href = `course.html?id=${courseId}`;
            }, 1000);
        } else {
            throw new Error(data.message || 'Enrollment failed');
        }
    } catch (error) {
        showToast(error.message, 'error');
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

// ============================================
// Update Progress Section
// ============================================
function updateProgress(progress) {
    if (!progress) return;
    
    const circle = document.getElementById('progressCircle');
    const progressValue = document.getElementById('overallProgress');
    
    if (circle && progressValue) {
        const circumference = 2 * Math.PI * 60;
        const percent = progress.overall || 0;
        const offset = circumference - (percent / 100) * circumference;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
        progressValue.textContent = Math.round(percent) + '%';
    }
    
    const completionList = document.getElementById('completionList');
    if (completionList && progress.courses && progress.courses.length > 0) {
        completionList.innerHTML = progress.courses.map(course => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <span style="flex: 1; font-size: 0.9rem; font-weight: 500;">${course.title}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 100px; height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${course.completion || 0}%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 3px; transition: width 0.5s;"></div>
                    </div>
                    <span style="font-weight: 700; color: var(--primary); min-width: 40px; text-align: right;">${course.completion || 0}%</span>
                </div>
            </div>
        `).join('');
    } else if (completionList) {
        completionList.innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 20px;">
                Enroll in courses to see your progress
            </p>
        `;
    }
}

// ============================================
// Sidebar Navigation
// ============================================
function initSidebarNav() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            if (href === '#my-courses') {
                e.preventDefault();
                switchTab('my-courses');
            } else if (href === '#browse-courses') {
                e.preventDefault();
                switchTab('browse-courses');
            } else if (href === '#progress') {
                e.preventDefault();
                switchTab('progress');
            } else if (href === '#certificates') {
                e.preventDefault();
                switchTab('certificates');
            }
        });
    });
}

// ============================================
// Search Functionality
// ============================================
function initSearch() {
    const searchInput = document.getElementById('courseSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const courseCards = document.querySelectorAll('.course-card');
        
        courseCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            
            if (title.includes(query) || description.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// ============================================
// Logout
// ============================================
function initLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = '../index.html';
        }
    });
}

// ============================================
// Theme Toggle
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
    const header = document.querySelector('.dashboard-header');
    if (header && !document.getElementById('mobileMenuBtn')) {
        const btn = document.createElement('button');
        btn.id = 'mobileMenuBtn';
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        btn.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; display: none; padding: 10px;';
        btn.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
        });
        header.prepend(btn);
        
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        if (mediaQuery.matches) btn.style.display = 'block';
        mediaQuery.addListener((e) => {
            btn.style.display = e.matches ? 'block' : 'none';
        });
    }
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; padding: 15px 25px;
        background: var(--bg-primary, white); border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
        display: flex; align-items: center; gap: 12px; font-weight: 500;
        border-left: 4px solid #6366f1; animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    showToast(message, 'error');
}