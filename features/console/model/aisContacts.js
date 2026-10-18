import { projectAisPosition } from '../../../components/gauges/shared/aisProjection.js';

/** Misma seleccion para el contador, la lista y el alcance del radar. */
export function visibleAisContacts(targets, position, positionReceivedAt, connected, rangeNm, now = Date.now()) {
    if (!connected || !Number.isFinite(positionReceivedAt) || now - positionReceivedAt >= 30000) return [];
    return Object.entries(targets ?? {}).flatMap(([id, target]) => {
        if (!Number.isFinite(target.positionReceivedAt) || now - target.positionReceivedAt >= 300000) return [];
        const projected = projectAisPosition(position, target['navigation.position'], 0, 1, rangeNm);
        return projected ? [{ id, ...target, distanceNm: projected.distanceNm }] : [];
    }).sort((a, b) => a.distanceNm - b.distanceNm || a.id.localeCompare(b.id));
}
