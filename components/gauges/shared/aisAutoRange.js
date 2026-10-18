import { AIS_RANGES_NM } from './aisRange.js';
import { projectAisPosition } from './aisProjection.js';

export function suggestedAisRange({ targets, position, positionReceivedAt, connected }, now) {
    if (!connected || !Number.isFinite(positionReceivedAt) || now - positionReceivedAt >= 30000) return 6;
    let nearest = Infinity;
    for (const target of Object.values(targets)) {
        if (!Number.isFinite(target.positionReceivedAt) || now - target.positionReceivedAt >= 300000) continue;
        const point = projectAisPosition(position, target['navigation.position'], 0, 1, 6);
        if (point) nearest = Math.min(nearest, point.distanceNm);
    }
    return AIS_RANGES_NM.find(range => range >= nearest * 1.25) ?? 6;
}

// Alejar inmediatamente; acercar solo después de ocho segundos de estabilidad.
export function advanceAisRange(state, desired, now) {
    if (desired >= state.range) return { range: desired, candidate: null, since: now };
    if (desired !== state.candidate) return { ...state, candidate: desired, since: now };
    if (now - state.since >= 8000) return { range: desired, candidate: null, since: now };
    return state;
}
