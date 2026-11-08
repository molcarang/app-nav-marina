export const AIS_NAVIGATION_PATHS = ['navigation.position', 'navigation.courseOverGroundTrue', 'navigation.speedOverGround', 'navigation.headingTrue'];
// Vessel identity is a root delta in the Signal K model, not ordinary telemetry.
export const AIS_SUBSCRIPTION_PATHS = [...AIS_NAVIGATION_PATHS, '', 'name', 'mmsi'];

export function readAisIdentity(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const identity = {};
    for (const key of ['name', 'mmsi']) {
        let field = value[key];
        if (field && typeof field === 'object') field = field.value;
        if (key === 'mmsi' && Number.isInteger(field)) field = String(field);
        if (typeof field !== 'string') continue;
        field = field.replace(/[\s@\u0000]+$/g, '').trim();
        if (field) identity[key] = field;
    }
    return identity;
}

export function aisIdentityUrl(socketUrl, context) {
    const url = new URL(socketUrl);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = url.pathname.replace(/\/signalk\/v1\/stream\/?$/, '')
        + `/signalk/v1/api/vessels/${encodeURIComponent(context.slice('vessels.'.length))}`;
    url.search = '';
    url.hash = '';
    return url.toString();
}

/** Bounded, cancellable identity lookup for servers that do not replay root metadata. */
export function createAisIdentityLoader({ socketUrl, onIdentity, fetchImpl = globalThis.fetch,
    now = Date.now, timeoutMs = 5000, retryMs = 30000, concurrency = 2 }) {
    let disposed = false;
    let active = 0;
    const queue = new Set();
    const running = new Map();
    const attemptedAt = new Map();
    async function load(id) {
        active++;
        attemptedAt.set(id, now());
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        running.set(id, { controller, timeout });
        try {
            const response = await fetchImpl(aisIdentityUrl(socketUrl, id), { signal: controller.signal });
            if (!response.ok) return;
            const snapshot = await response.json();
            if (!disposed && !controller.signal.aborted) onIdentity(id, readAisIdentity(snapshot));
        } catch { /* Missing metadata or a restricted REST API must not interrupt AIS. */ }
        finally {
            clearTimeout(timeout);
            running.delete(id);
            active--;
            pump();
        }
    }
    function pump() {
        while (!disposed && active < concurrency && queue.size) {
            const id = queue.values().next().value;
            queue.delete(id);
            void load(id);
        }
    }
    return {
        request(id) {
            if (disposed || typeof id !== 'string' || !id.startsWith('vessels.')
                || queue.has(id) || running.has(id)) return false;
            const last = attemptedAt.get(id);
            if (last !== undefined && now() - last < retryMs) return false;
            queue.add(id);
            pump();
            return true;
        },
        forget(id) {
            queue.delete(id);
            attemptedAt.delete(id);
            const request = running.get(id);
            if (request) { clearTimeout(request.timeout); request.controller.abort(); }
        },
        dispose() {
            disposed = true;
            queue.clear();
            attemptedAt.clear();
            for (const { controller, timeout } of running.values()) { clearTimeout(timeout); controller.abort(); }
        },
    };
}
