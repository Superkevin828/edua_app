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

// /health lives at the server root, not under /api
window.API_HEALTH_URL = window.API_BASE.replace(/\/api\/?$/, '') + '/health';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Poll /health until the backend answers. Render's free tier hibernates and
 * replies 429 with a plain-text body while it boots, so a blind retry usually
 * lands in the same window.
 */
window.waitForBackend = async function(timeoutMs = 30000, intervalMs = 3000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(window.API_HEALTH_URL, { cache: 'no-store' });
            if (response.ok) return true;
        } catch (error) {
            // backend still starting up
        }
        await sleep(intervalMs);
    }

    return false;
};

/**
 * Shared fetch helper for JSON API calls.
 * - Retries 429 using Retry-After (or exponential backoff), waking the backend
 *   in between.
 * - Never lets a plain-text/HTML response reach response.json().
 * - Throws a friendly Error for exhausted 429/non-JSON responses.
 */
window.apiFetch = async function(path, options = {}, retries = 3) {
    const url = path.startsWith('http') ? path : window.API_BASE + path;
    let networkError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        let response;

        try {
            response = await fetch(url, options);
        } catch (error) {
            networkError = error;
            if (attempt === retries) break;
            await sleep(2 ** attempt * 1000);
            continue;
        }

        if (response.status === 429) {
            if (attempt === retries) {
                throw new Error('Too many requests. Please try again shortly.');
            }

            const retryAfter = Number(response.headers.get('Retry-After'));
            const waitMs = (retryAfter > 0 ? retryAfter : Math.min(2 ** attempt, 8)) * 1000;

            await sleep(waitMs);
            await window.waitForBackend(20000);
            continue;
        }

        if (response.status === 204) return null;

        const type = response.headers.get('content-type') || '';
        if (!type.includes('application/json')) {
            throw new Error(`Non-JSON response (${response.status})`);
        }

        return response.json();
    }

    throw networkError || new Error('Network error');
};

// Debug log to verify it's loaded
console.log('✅ Config loaded - API_BASE:', window.API_BASE);
