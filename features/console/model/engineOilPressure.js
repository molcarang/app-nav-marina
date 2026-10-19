import { ENGINE_OIL_PRESSURE_PATH_PATTERN } from '../../../services/signalk/paths.js';

/** Signal K pressure is in Pa; keep zero and show the lowest available engine reading. */
export function deriveEngineOilPressure(data) {
    const readings = Object.entries(data)
        .filter(([path, value]) => ENGINE_OIL_PRESSURE_PATH_PATTERN.test(path) && Number.isFinite(value) && value >= 0)
        .map(([, value]) => value / 100000);
    return readings.length ? Math.min(...readings) : null;
}
