// ============================================
// Authentication JavaScript - USES BACKEND redirectUrl
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Auth JS loaded');
    console.log('📍 Current path:', window.location.pathname);
    console.log('🌐 API_BASE:', window.API_BASE);
    
    initSignupForm();
    initLoginForm();
    initPasswordToggles();
    initForgotPasswordForm();
});

// ============================================
// API Helpers
// ============================================

// Render's free tier hibernates and its proxy replies 429 with a plain-text
// body instead of JSON. Parse defensively so we never throw a SyntaxError.
async function parseApiResponse(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        const trimmed = text.trim();
        const looksLikeHtml = /^<!doctype|^<html/i.test(trimmed);
        return {
            success: false,
            message: looksLikeHtml
                ? `Server error (${response.status})`
                : (trimmed.slice(0, 200) || `Request failed (${response.status})`)
        };
    }
}

// Poll the lightweight /health endpoint until the backend has woken up.
async function wakeBackend(maxWaitMs = 60000) {
    const healthURL = window.API_BASE.replace(/\/api\/?$/, '') + '/health';
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
        try {
            const res = await fetch(healthURL, { cache: 'no-store' });
            if (res.ok) return true;
        } catch {
            // still starting up
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return false;
}

// POST to the API, transparently waiting out a hibernating backend.
async function postToApi(endpoint, payload) {
    const url = `${window.API_BASE}${endpoint}`;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    let response = await fetch(url, options);

    if (response.status === 429) {
        showToast('Server is waking up, please wait...', 'info');
        await wakeBackend();
        response = await fetch(url, options);
    }

    const data = await parseApiResponse(response);
    return { response, data };
}

function getApiErrorMessage(response, data, fallback) {
    if (response.status === 429) {
        return 'The server is taking too long to wake up. Please wait a moment and try again.';
    }
    if (data && data.message) return data.message;
    if (data && Array.isArray(data.errors) && data.errors.length) {
        return data.errors[0].msg || fallback;
    }
    return fallback;
}

// ============================================
// Signup Form
// ============================================
function initSignupForm() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        // CHECK if API_BASE is available
        if (typeof window.API_BASE === 'undefined') {
            showToast('Configuration not loaded. Refreshing...', 'error');
            setTimeout(() => location.reload(), 1000);
            return;
        }
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms');
        
        let hasError = false;
        
        if (!fullName) { showError('fullName', 'Please enter your full name'); hasError = true; }
        if (!email || !validateEmail(email)) { showError('email', 'Please enter a valid email address'); hasError = true; }
        if (!password || password.length < 6) { showError('password', 'Password must be at least 6 characters'); hasError = true; }
        if (password !== confirmPassword) { showError('confirmPassword', 'Passwords do not match'); hasError = true; }
        if (agreeTerms && !agreeTerms.checked) { showToast('Please agree to the Terms of Service', 'warning'); hasError = true; }
        
        if (hasError) return;
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        try {
            // FIXED: Send fullName to match backend expectation
            const { response, data } = await postToApi('/auth/signup', {
                fullName: fullName,  // FIXED: Backend expects 'fullName'
                email: email,
                password: password,
                realpassword: password  // Keep your realpassword field
            });

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast('Account created successfully!', 'success');
                
                // FIXED: Use redirectUrl from backend if available, otherwise default
                setTimeout(() => { 
                    const redirectTo = data.redirectUrl || '/views/dashboard.html';
                    console.log('🔀 Redirecting to:', redirectTo);
                    window.location.href = redirectTo; 
                }, 1000);
            } else {
                throw new Error(getApiErrorMessage(response, data, 'Registration failed'));
            }
        } catch (error) {
            console.error('Signup error:', error);
            showToast(error.message || 'Network error', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const strength = checkPasswordStrength(passwordInput.value);
            updatePasswordStrengthIndicator(strength);
        });
    }
}

// ============================================
// Login Form - NOW USES BACKEND redirectUrl
// ============================================
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        // CHECK if API_BASE is available
        if (typeof window.API_BASE === 'undefined') {
            showToast('Configuration not loaded. Refreshing...', 'error');
            setTimeout(() => location.reload(), 1000);
            return;
        }
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember');
        
        let hasError = false;
        
        if (!email) { showError('email', 'Please enter your email'); hasError = true; }
        if (!password) { showError('password', 'Please enter your password'); hasError = true; }
        
        if (hasError) return;
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        
        try {
            const { response, data } = await postToApi('/auth/login', { email, password });
            console.log('📥 Login response:', data);

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                if (remember && remember.checked) {
                    localStorage.setItem('rememberedEmail', email);
                }
                
                // Check for admin role
                const isAdmin = data.isAdmin || 
                               (data.user && (data.user.isAdmin || data.user.role === 'admin'));
                
                if (isAdmin) {
                    localStorage.setItem('adminToken', data.token);
                    showToast('Welcome Admin! Redirecting...', 'success');
                } else {
                    showToast('Welcome back!', 'success');
                }
                
                // FIXED: USE BACKEND'S redirectUrl
                setTimeout(() => { 
                    const redirectTo = data.redirectUrl || '/views/dashboard.html';
                    console.log('🔀 Redirecting to:', redirectTo);
                    window.location.href = redirectTo; 
                }, 1000);
                
            } else {
                throw new Error(getApiErrorMessage(response, data, 'Invalid email or password'));
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message || 'Network error', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheck = document.getElementById('remember');
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }
}

// ============================================
// Forgot Password Form
// ============================================
function initForgotPasswordForm() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    
    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (typeof window.API_BASE === 'undefined') {
            showToast('Configuration not loaded. Please refresh.', 'error');
            return;
        }
        
        const email = document.getElementById('email').value.trim();
        
        if (!email || !validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            const { response, data } = await postToApi('/auth/forgot-password', { email });

            if (response.ok) {
                showToast('Password reset link sent! Check your email.', 'success');
                forgotForm.reset();
            } else {
                throw new Error(getApiErrorMessage(response, data, 'Failed to send reset link'));
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// ============================================
// Password Toggle
// ============================================
function initPasswordToggles() {
    document.querySelectorAll('.toggle-icon, .fa-eye, .fa-eye-slash').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.parentElement?.querySelector('input') || this.previousElementSibling;
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });
}

// ============================================
// Password Strength Checker
// ============================================
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
}

function updatePasswordStrengthIndicator(strength) {
    const bar = document.getElementById('passwordStrength');
    if (!bar) return;
    bar.className = 'password-strength-bar';
    if (strength <= 1) bar.classList.add('strength-weak');
    else if (strength === 2) bar.classList.add('strength-fair');
    else if (strength === 3) bar.classList.add('strength-good');
    else if (strength >= 4) bar.classList.add('strength-strong');
}

// ============================================
// Form Helpers
// ============================================
function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.add('error');
    const error = input.closest('.form-group')?.querySelector('.form-error');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.form-control.error').forEach(input => input.classList.remove('error'));
    document.querySelectorAll('.form-error').forEach(error => error.style.display = 'none');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const icon = document.createElement('i');
    icon.className = `fas ${icons[type] || icons.info}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(icon, text);
    
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 15px 25px; background: var(--bg-primary, white);
        border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        display: flex; align-items: center; gap: 10px;
        z-index: 10000; font-weight: 500;
        border-left: 4px solid #6366f1;
    `;
    
    if (type === 'success') toast.style.borderLeftColor = '#10b981';
    if (type === 'error') toast.style.borderLeftColor = '#ef4444';
    if (type === 'warning') toast.style.borderLeftColor = '#f59e0b';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}