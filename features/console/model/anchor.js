import { isValidPosition } from './gpsPosition.js';

export function parseAnchorNumber(value) {
    if (typeof value !== 'string' || !value.trim()) return NaN;
    return Number(value.trim().replace(',', '.'));
}

/** Destino geográfico desde el GPS: distancia horizontal y demora verdadera. */
export function estimateAnchor(position, meters, bearing) {
    if (!isValidPosition(position) || !Number.isFinite(meters) || meters < 0 || meters > 2000
        || !Number.isFinite(bearing) || bearing < 0 || bearing > 360) return null;
    const rad = Math.PI / 180;
    const lat = position.latitude * rad, lon = position.longitude * rad;
    const delta = meters / 6371000, direction = bearing * rad;
    const targetLat = Math.asin(Math.sin(lat) * Math.cos(delta) + Math.cos(lat) * Math.sin(delta) * Math.cos(direction));
    const targetLon = lon + Math.atan2(Math.sin(direction) * Math.sin(delta) * Math.cos(lat),
        Math.cos(delta) - Math.sin(lat) * Math.sin(targetLat));
    return { latitude: targetLat / rad, longitude: ((targetLon / rad + 540) % 360) - 180 };
}

export function validAnchorDraft(draft) {
    return ['drop', 'estimate', 'manual'].includes(draft?.method)
        && isValidPosition(draft?.center) && Number.isFinite(draft?.radius)
        && draft.radius >= 10 && draft.radius <= 1000;
}

export function hasFreshAnchorPosition(position, receivedAt, connected, now = Date.now()) {
    return Boolean(connected) && isValidPosition(position) && Number.isFinite(receivedAt)
        && now - receivedAt >= 0 && now - receivedAt < 30000;
}

/** Estado de vigilancia; un GPS perdido nunca equivale a estar dentro del radio. */
export function anchorWatchStatus(draft, position, receivedAt, connected, now) {
    if (!validAnchorDraft(draft)) return 'inactive';
    if (!hasFreshAnchorPosition(position, receivedAt, connected, now)) return 'gpsLost';
    return anchorDistanceMeters(draft.center, position) > draft.radius ? 'outside' : 'watching';
}

export function anchorDistanceMeters(center, position) {
    if (!isValidPosition(center) || !isValidPosition(position)) return null;
    const rad = Math.PI / 180;
    const latDelta = (position.latitude - center.latitude) * rad;
    const lonDelta = (position.longitude - center.longitude) * rad;
    const a = Math.sin(latDelta / 2) ** 2 + Math.cos(center.latitude * rad)
        * Math.cos(position.latitude * rad) * Math.sin(lonDelta / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export const ANCHOR_OUTSIDE_CONFIRM_MS = 5000;

/** Confirma la salida con nuevas lecturas; el reloj solo no confirma un salto. */
export function filterAnchorWatch(previous, rawStatus, receivedAt) {
    if (rawStatus !== 'outside') return { status: rawStatus, outsideSince: null, lastReceivedAt: null };
    if (!previous || previous.outsideSince === null || receivedAt < previous.lastReceivedAt) {
        return { status: 'pending', outsideSince: receivedAt, lastReceivedAt: receivedAt };
    }
    if (receivedAt === previous.lastReceivedAt) return previous;
    return {
        status: receivedAt - previous.outsideSince >= ANCHOR_OUTSIDE_CONFIRM_MS ? 'outside' : 'pending',
        outsideSince: previous.outsideSince,
        lastReceivedAt: receivedAt,
    };
}
