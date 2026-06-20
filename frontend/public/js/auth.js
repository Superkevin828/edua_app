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
            const response = await fetch(`${window.API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fullName: fullName,  // FIXED: Backend expects 'fullName'
                    email: email, 
                    password: password,
                    realpassword: password  // Keep your realpassword field
                })
            });
            
            const data = await response.json();
            
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
                throw new Error(data.message || 'Registration failed');
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
            const response = await fetch(`${window.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
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
                throw new Error(data.message || 'Invalid email or password');
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
            const response = await fetch(`${window.API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Password reset link sent! Check your email.', 'success');
                forgotForm.reset();
            } else {
                throw new Error(data.message || 'Failed to send reset link');
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
    const error = input?.parentElement?.nextElementSibling;
    if (input) input.classList.add('error');
    if (error && error.classList.contains('form-error')) {
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
    
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    
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