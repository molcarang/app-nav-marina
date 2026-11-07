import { isValidPosition } from './gpsPosition.js';

export const AIS_COLLISION_DEFAULTS = {
    aisCollisionEnabled: true,
    aisWarningCpaNm: 0.5,
    aisWarningTcpaMinutes: 15,
    aisDangerCpaNm: 0.2,
    aisDangerTcpaMinutes: 5,
};
export const AIS_RISK_COLORS = { clear: '#45d39a', warning: '#ffad33', danger: '#ff4545', unknown: '#8d9da7', disabled: '#45d39a' };
const NM = 1852;
const RAD = Math.PI / 180;
const bounded = (v, min, max, fallback, step) => Number.isFinite(v) && v >= min && v <= max
    ? Math.round(v / step) * step : fallback;

export function normalizeAisCollisionSettings(settings = {}) {
    const d = AIS_COLLISION_DEFAULTS;
    const warningCpa = bounded(settings.aisWarningCpaNm, 0.05, 5, d.aisWarningCpaNm, 0.05);
    const warningTime = bounded(settings.aisWarningTcpaMinutes, 1, 60, d.aisWarningTcpaMinutes, 1);
    return {
        aisCollisionEnabled: typeof settings.aisCollisionEnabled === 'boolean' ? settings.aisCollisionEnabled : true,
        aisWarningCpaNm: warningCpa,
        aisWarningTcpaMinutes: warningTime,
        aisDangerCpaNm: Math.min(warningCpa, bounded(settings.aisDangerCpaNm, 0.05, 5, d.aisDangerCpaNm, 0.05)),
        aisDangerTcpaMinutes: Math.min(warningTime, bounded(settings.aisDangerTcpaMinutes, 1, 60, d.aisDangerTcpaMinutes, 1)),
    };
}

const fresh = (time, now, age) => Number.isFinite(time) && time <= now + 5000 && now - time < age;
function motion(vessel, now, maxAge) {
    if (!isValidPosition(vessel.position) || !fresh(vessel.positionAt, now, maxAge)
        || !fresh(vessel.speedAt, now, maxAge) || !Number.isFinite(vessel.speed) || vessel.speed < 0 || vessel.speed > 80) return null;
    // A stopped vessel has no reliable COG and does not need one.
    if (vessel.speed <= 0.15) return { east: 0, north: 0 };
    if (!Number.isFinite(vessel.course) || !fresh(vessel.courseAt, now, maxAge)) return null;
    return { east: Math.sin(vessel.course) * vessel.speed, north: Math.cos(vessel.course) * vessel.speed };
}

/** Constant COG/SOG prediction on a local tangent plane; metres and seconds internally. */
export function calculateAisCollision(own, target, settings = {}, now = Date.now()) {
    const limits = normalizeAisCollisionSettings(settings);
    const unknown = { level: 'unknown', cpaNm: null, tcpaMinutes: null, reason: 'data' };
    if (!limits.aisCollisionEnabled) return { ...unknown, level: 'disabled' };
    const a = motion(own, now, 30000), b = motion(target, now, 90000);
    if (!a || !b) return unknown;
    const longitude = ((target.position.longitude - own.position.longitude + 540) % 360) - 180;
    const meanLatitude = (target.position.latitude + own.position.latitude) / 2;
    // This short-range approximation is deliberately not used for polar / distant targets.
    if (Math.abs(meanLatitude) > 85) return unknown;
    const east = longitude * RAD * 6371000 * Math.cos(meanLatitude * RAD)
        + b.east * (now - target.positionAt) / 1000 - a.east * (now - own.positionAt) / 1000;
    const north = (target.position.latitude - own.position.latitude) * RAD * 6371000
        + b.north * (now - target.positionAt) / 1000 - a.north * (now - own.positionAt) / 1000;
    const distanceNm = Math.hypot(east, north) / NM;
    if (distanceNm > 24) return unknown;
    const vx = b.east - a.east, vy = b.north - a.north;
    const relativeSpeedSquared = vx * vx + vy * vy;
    if (relativeSpeedSquared < 0.05 ** 2) {
        const level = distanceNm <= limits.aisDangerCpaNm ? 'danger'
            : distanceNm <= limits.aisWarningCpaNm ? 'warning' : 'clear';
        return { level, cpaNm: distanceNm, tcpaMinutes: null, reason: 'proximity', distanceNm };
    }
    const seconds = -(east * vx + north * vy) / relativeSpeedSquared;
    const cpaNm = Math.hypot(east + vx * seconds, north + vy * seconds) / NM;
    const tcpaMinutes = seconds / 60;
    let level = 'clear';
    if (seconds >= 0 && cpaNm <= limits.aisWarningCpaNm && tcpaMinutes <= limits.aisWarningTcpaMinutes) level = 'warning';
    if (seconds >= 0 && cpaNm <= limits.aisDangerCpaNm && tcpaMinutes <= limits.aisDangerTcpaMinutes) level = 'danger';
    return { level, cpaNm, tcpaMinutes, reason: seconds < 0 ? 'receding' : 'prediction', distanceNm };
}

export function vesselMotion(data) {
    return { position: data['navigation.position'], positionAt: data.collisionPositionReceivedAt,
        speed: data['navigation.speedOverGround'], speedAt: data.speedReceivedAt,
        course: data['navigation.courseOverGroundTrue'], courseAt: data.courseReceivedAt };
}

// Escalate immediately; only release a visual warning after eight stable seconds.
export function stabilizeAisCollision(previous, next, now) {
    const rank = { disabled: -1, unknown: -1, clear: 0, warning: 1, danger: 2 };
    if (!previous || rank[next.level] < 0 || rank[next.level] >= rank[previous.level]) return { ...next, releaseAt: null };
    const releaseAt = previous.releaseAt ?? now + 8000;
    return now >= releaseAt ? { ...next, releaseAt: null }
        : { ...next, level: previous.level, releaseAt };
}
