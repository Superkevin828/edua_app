/**
 * API Configuration
 * Determines the base URL for all API calls based on environment
 */

// Use window object to ensure global accessibility
window.API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'              // Local development
    : 'https://edua-app.onrender.com/api'; // Production URL

/**
 * Helper function to construct full API URLs
 * Usage: apiURL('/auth/login') => 'http://localhost:5000/api/auth/login'
 */
window.apiURL = function(endpoint) {
    if (endpoint.startsWith('/')) {
        return window.API_BASE + endpoint;
    }
    return window.API_BASE + '/' + endpoint;
};

// Debug log to verify it's loaded
console.log('✅ Config loaded - API_BASE:', window.API_BASE);