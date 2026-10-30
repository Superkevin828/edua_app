/**
 * API Configuration
 * Determines the base URL for all API calls based on environment
 */

// Use window object to ensure global accessibility
window.API_BASE = window.location.hostname === 'localhost'
    ? 'https://lashawnda-sceptical-ora.ngrok-free.dev/api'              // Local development
    : 'https://render-proxy.earnhub.workers.dev/api'; // Production via Cloudflare Worker proxy

/**
 * Helper function to construct full API URLs
 * Usage: apiURL('/auth/login') => 'https://render-proxy.earnhub.workers.dev/api/auth/login'
 */
window.apiURL = function(endpoint) {
    if (endpoint.startsWith('/')) {
        return window.API_BASE + endpoint;
    }
    return window.API_BASE + '/' + endpoint;
};

// Debug log to verify it's loaded
console.log('✅ Config loaded - API_BASE:', window.API_BASE);
