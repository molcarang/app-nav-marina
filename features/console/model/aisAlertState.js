export function aisAlertSnapshot(targets) {
    return Object.entries(targets)
        .filter(([, vessel]) => ['warning', 'danger'].includes(vessel.collision?.level))
        .map(([id, vessel]) => [id, vessel.collision.level])
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
}

export function hasNewAisAlert(acknowledged, alerts) {
    return alerts.length > 0 && (acknowledged === null || alerts.some(([id, risk]) => !Object.hasOwn(acknowledged, id)
        || (acknowledged[id] === 'warning' && risk === 'danger')));
}

export function reconcileAisAcknowledgement(previous, current) {
    if (previous === null) return previous;
    if (!current.length || hasNewAisAlert(previous, current)) return null;
    const changed = Object.keys(previous).length !== current.length || current.some(([id, risk]) => previous[id] !== risk);
    return changed ? Object.fromEntries(current) : previous;
}
