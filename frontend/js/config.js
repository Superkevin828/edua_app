/**
 * API Configuration
 * Determines the base URL for all API calls based on environment
 */

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'              // Local development
    : 'https://your-backend.onrender.com/api'; // Production (replace with your Render backend URL)

/**
 * Helper function to construct full API URLs
 * Usage: apiURL('/auth/login') => 'https://your-backend.onrender.com/api/auth/login'
 */
function apiURL(endpoint) {
    if (endpoint.startsWith('/')) {
        return API_BASE + endpoint;
    }
    return API_BASE + '/' + endpoint;
}
