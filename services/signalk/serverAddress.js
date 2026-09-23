export const DEFAULT_SIGNALK_ADDRESS = 'http://openplotter.local:3000';

export function normalizeServerAddress(value) {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input || /\s/.test(input)) throw new Error('Introduce una dirección válida.');
    const url = new URL(input.includes('://') ? input : `http://${input}`);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.hash) {
        throw new Error('Usa una dirección HTTP, HTTPS, WS o WSS sin credenciales.');
    }
    return url.toString();
}

export function getSignalKSocketUrl(address) {
    const url = new URL(normalizeServerAddress(address));
    url.protocol = ['https:', 'wss:'].includes(url.protocol) ? 'wss:' : 'ws:';
    if (!url.pathname.replace(/\/$/, '').endsWith('/signalk/v1/stream')) {
        url.pathname = `${url.pathname.replace(/\/$/, '')}/signalk/v1/stream`;
    }
    return url.toString();
}
