/**
 * Cloudflare Worker: edge proxy for the Render backend.
 *
 * Why this exists:
 *  - Some ISPs block *.onrender.com, so the frontend talks to this Worker.
 *  - Express rate limiting must see the real visitor, not the Worker's IP.
 *  - Repeated /api/courses calls should be answered from the edge cache.
 *
 * Required secrets / vars (Cloudflare dashboard -> Worker -> Settings):
 *  - PROXY_SECRET: same value as the PROXY_SECRET env var on Render.
 */

const RENDER_ORIGIN = 'https://edua-app.onrender.com';
const COURSES_CACHE_TTL = 60;
const ALLOWED_ORIGINS = new Set([
    'https://edua-app.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173',
]);

const HOP_BY_HOP = [
    'host',
    'cf-connecting-ip',
    'cf-ipcountry',
    'cf-ray',
    'cf-visitor',
    'cdn-loop',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-real-ip',
    'x-real-client-ip',
    'x-proxy-secret',
];

function corsHeaders(origin) {
    const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Expose-Headers': 'Retry-After, X-Edge-Cache',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    });

    if (origin && ALLOWED_ORIGINS.has(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
    }

    return headers;
}

function jsonResponse(status, payload, cors, extra = {}) {
    const headers = new Headers(cors);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    for (const [key, value] of Object.entries(extra)) {
        headers.set(key, value);
    }
    return new Response(JSON.stringify(payload), { status, headers });
}

function withCors(response, cors, edgeCache) {
    const headers = new Headers(response.headers);
    for (const [key, value] of cors) {
        headers.set(key, value);
    }
    if (edgeCache) {
        headers.set('X-Edge-Cache', edgeCache);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin');
        const cors = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            if (origin && !ALLOWED_ORIGINS.has(origin)) {
                return new Response(null, { status: 403, headers: cors });
            }
            return new Response(null, { status: 204, headers: cors });
        }

        const isCoursesGet = request.method === 'GET' && url.pathname === '/api/courses';
        const cache = caches.default;
        const cacheKey = new Request(url.origin + url.pathname + url.search, { method: 'GET' });

        if (isCoursesGet) {
            const cached = await cache.match(cacheKey);
            if (cached) {
                return withCors(cached, cors, 'HIT');
            }
        }

        const upstreamHeaders = new Headers(request.headers);
        for (const name of HOP_BY_HOP) {
            upstreamHeaders.delete(name);
        }

        const clientIp = request.headers.get('cf-connecting-ip');
        if (clientIp) {
            upstreamHeaders.set('X-Real-Client-IP', clientIp);
        }
        if (env.PROXY_SECRET) {
            upstreamHeaders.set('X-Proxy-Secret', env.PROXY_SECRET);
        }

        let upstream;
        try {
            upstream = await fetch(RENDER_ORIGIN + url.pathname + url.search, {
                method: request.method,
                headers: upstreamHeaders,
                redirect: 'manual',
                body: request.method === 'GET' || request.method === 'HEAD'
                    ? undefined
                    : request.body,
            });
        } catch (error) {
            return jsonResponse(
                502,
                { error: 'Backend unreachable. Please try again shortly.' },
                cors,
                { 'Retry-After': '5' }
            );
        }

        // A hibernating Render service answers with a plain-text 429.
        // Always return JSON so the browser never hits "Unexpected token".
        const upstreamType = upstream.headers.get('content-type') || '';
        if (upstream.status === 429 && !upstreamType.includes('application/json')) {
            return jsonResponse(
                429,
                {
                    error: 'Backend is waking up. Please retry in a few seconds.',
                    retryAfter: 5,
                },
                cors,
                { 'Retry-After': '5' }
            );
        }

        const responseHeaders = new Headers(upstream.headers);
        // The Workers runtime decompresses bodies but leaves the encoding
        // headers behind, which breaks downstream clients.
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');
        responseHeaders.delete('transfer-encoding');

        if (isCoursesGet && upstream.ok) {
            responseHeaders.set('Cache-Control', `public, max-age=${COURSES_CACHE_TTL}`);
            responseHeaders.set('X-Edge-Cache', 'MISS');
        }

        for (const [key, value] of cors) {
            responseHeaders.set(key, value);
        }

        const response = new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders,
        });

        if (isCoursesGet && upstream.ok) {
            ctx.waitUntil(cache.put(cacheKey, response.clone()));
        }

        return response;
    },
};
