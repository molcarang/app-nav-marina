async function request(options = {}, path = '/api/updates') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(path, { cache: 'no-store', ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`Local updater HTTP ${response.status}`);
        const result = await response.json();
        return result;
    } finally { clearTimeout(timeout); }
}

export async function getRaspberryUpdateStatus() {
    const status = await request();
    if (status.protocol !== 1 || typeof status.token !== 'string') throw new Error('Incompatible local updater');
    return status;
}

export function installRaspberryUpdate(releaseId, token) {
    return request({ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-NavMarina-Token': token },
        body: JSON.stringify({ releaseId }) });
}

export async function exitRaspberryApplication() {
    const { token } = await getRaspberryUpdateStatus();
    return request({ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-NavMarina-Token': token },
        body: '{}' }, '/api/app/exit');
}
