import { normalizeEngineConsumptionTable } from './engineConsumptionTable.js';

export const ENGINE_CONSUMPTION_INTERVAL_MS = 5000;

/** Interpolate between rows; outside the curve, scale the nearest endpoint. */
export function estimateEngineConsumption(rpm, table) {
    if (!Number.isFinite(rpm) || rpm <= 0) return null;
    const curve = normalizeEngineConsumptionTable(table);
    if (!curve.length) return null;
    if (rpm < curve[0].rpm || rpm > curve[curve.length - 1].rpm) {
        const nearest = rpm < curve[0].rpm ? curve[0] : curve[curve.length - 1];
        if (nearest.rpm === 0) return null;
        const rate = nearest.litresPerHour * (rpm / nearest.rpm);
        return Number.isFinite(rate) ? rate : null;
    }
    const exact = curve.find(entry => entry.rpm === rpm);
    if (exact) return exact.litresPerHour;
    const upperIndex = curve.findIndex(entry => entry.rpm > rpm);
    const lower = curve[upperIndex - 1], upper = curve[upperIndex];
    const fraction = (rpm - lower.rpm) / (upper.rpm - lower.rpm);
    const rate = lower.litresPerHour + fraction * (upper.litresPerHour - lower.litresPerHour);
    return Number.isFinite(rate) ? rate : null;
}
