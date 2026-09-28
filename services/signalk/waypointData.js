export const WAYPOINT_BRANCHES = ['navigation.courseRhumbline', 'navigation.courseGreatCircle'];
export const WAYPOINT_SUBSCRIPTIONS = WAYPOINT_BRANCHES.map(path => `${path}.*`);
export const WAYPOINT_TIMEOUT = 30000;
const fields = new Set(['nextPoint.position', 'nextPoint.ID', 'nextPoint.name',
    'nextPoint.distance', 'nextPoint.bearingTrue', 'nextPoint.velocityMadeGood', 'crossTrackError']);
const validPosition = p => Number.isFinite(p?.latitude) && Math.abs(p.latitude) <= 90 &&
    Number.isFinite(p?.longitude) && Math.abs(p.longitude) <= 180;
const numeric = value => Number.isFinite(value) ? value : null;

/** Recupera el estado inicial sin convertir datos antiguos en lecturas recientes. */
export function mergeWaypointSnapshot(state, branch, snapshot) {
    const previous = state[branch];
    // Si el stream ya ha enviado destino o cancelación, tiene prioridad sobre REST.
    if (previous && Object.hasOwn(previous.values, 'nextPoint.position')) return state;
    const values = {}, times = {};
    for (const field of fields) {
        const entry = field.split('.').reduce((node, key) => node?.[key], snapshot);
        const time = Date.parse(entry?.timestamp);
        if (entry && Object.hasOwn(entry, 'value') && Number.isFinite(time)) {
            values[field] = entry.value;
            times[field] = time;
        }
    }
    if (!Object.keys(values).length) return state;
    return { ...state, [branch]: {
        values: { ...values, ...previous?.values },
        times: { ...times, ...previous?.times },
        updatedAt: Math.max(...Object.values(times), previous?.updatedAt ?? 0),
    } };
}

/** Conserva cada familia por separado para no mezclar tramos o cálculos distintos. */
export function mergeWaypointDelta(state, message, self, now = Date.now()) {
    if (message.context && message.context !== 'vessels.self' && message.context !== self) return state;
    let result = state;
    for (const update of message.updates ?? []) {
        const parsed = Date.parse(update.timestamp);
        const time = Number.isFinite(parsed) ? Math.min(parsed, now) : now;
        if (now - time > WAYPOINT_TIMEOUT) continue;
        for (const branch of WAYPOINT_BRANCHES) {
            const changes = {};
            for (const item of update.values ?? []) {
                if ((item.path === branch || item.path === `${branch}.nextPoint`) && item.value === null) {
                    changes['nextPoint.position'] = null;
                } else if (item.path === `${branch}.nextPoint` && item.value && typeof item.value === 'object') {
                    for (const key of ['position', 'ID', 'name', 'distance', 'bearingTrue', 'velocityMadeGood']) {
                        if (Object.hasOwn(item.value, key)) changes[`nextPoint.${key}`] = item.value[key];
                    }
                } else if (item.path?.startsWith(`${branch}.`)) {
                    const field = item.path.slice(branch.length + 1);
                    if (fields.has(field)) changes[field] = item.value;
                }
            }
            if (!Object.keys(changes).length) continue;
            const previous = result[branch] ?? { values: {}, times: {} };
            if (time < (previous.updatedAt ?? 0)) continue;
            let values = previous.values;
            let times = previous.times;
            if (Object.hasOwn(changes, 'nextPoint.position')) {
                const a = values['nextPoint.position'], b = changes['nextPoint.position'];
                if (!validPosition(b) || a?.latitude !== b.latitude || a?.longitude !== b.longitude) {
                    values = {};
                    times = {};
                }
            }
            result = { ...result, [branch]: { values: { ...values, ...changes },
                times: { ...times, ...Object.fromEntries(Object.keys(changes).map(key => [key, time])) },
                updatedAt: time } };
        }
    }
    return result;
}

/** Distancia y demora ortodrómicas de respaldo si el emisor no envía métricas. */
function geometry(own, target) {
    if (!validPosition(own)) return {};
    const radians = n => n * Math.PI / 180;
    const a = radians(own.latitude), b = radians(target.latitude);
    const d = radians(target.longitude - own.longitude);
    const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(d / 2) ** 2;
    return { distance: 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h))),
        bearing: Math.atan2(Math.sin(d) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(d)) };
}

export function deriveWaypoint(state, connected, ownPosition, now = Date.now()) {
    if (!connected) return null;
    const candidates = WAYPOINT_BRANCHES.map(branch => ({ branch, ...state[branch] }))
        .filter(item => Number.isFinite(item.updatedAt)).sort((a, b) => b.updatedAt - a.updatedAt);
    const selected = candidates[0];
    if (!selected || now - selected.updatedAt > WAYPOINT_TIMEOUT) return null;
    const position = selected.values['nextPoint.position'];
    // Una cancelación reciente no debe resucitar el destino retenido en la otra familia.
    if (!validPosition(position)) return null;
    const get = field => now - (selected.times[field] ?? 0) <= WAYPOINT_TIMEOUT ? selected.values[field] : null;
    const fallback = geometry(ownPosition, position);
    const rawDistance = numeric(get('nextPoint.distance'));
    const distance = rawDistance !== null && rawDistance >= 0 ? rawDistance : fallback.distance ?? null;
    const bearing = numeric(get('nextPoint.bearingTrue')) ?? fallback.bearing ?? null;
    const closingSpeed = numeric(get('nextPoint.velocityMadeGood'));
    const xte = numeric(get('crossTrackError'));
    const name = get('nextPoint.name') ?? get('nextPoint.ID');
    return { position, branch: selected.branch, demo: false,
        name: typeof name === 'string' || typeof name === 'number' ? String(name) : null,
        distanceNm: distance === null ? null : distance / 1852,
        bearingDeg: bearing === null ? null : (bearing * 180 / Math.PI + 360) % 360,
        // No usar SOG: el barco puede estar alejándose del destino.
        timeMinutes: distance === 0 ? 0 : distance !== null && closingSpeed > 0 ? distance / closingSpeed / 60 : null,
        crossTrackNm: xte === null ? null : xte / 1852 };
}
