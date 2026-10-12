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
    return ['drop', 'estimate', 'manual', 'zone'].includes(draft?.method)
        && isValidPosition(draft?.center) && Number.isFinite(draft?.radius)
        && draft.radius >= 10 && draft.radius <= 1000;
}
