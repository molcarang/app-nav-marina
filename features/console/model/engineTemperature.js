import { ENGINE_TEMPERATURE_PATH_PATTERN } from '../../../services/signalk/paths.js';

/** PGN 127489 publishes engine coolant temperature as propulsion.*.temperature. */
export function deriveEngineTemperature(data) {
    const units = new Map();
    for (const [path, value] of Object.entries(data)) {
        if (!ENGINE_TEMPERATURE_PATH_PATTERN.test(path) || !Number.isFinite(value) || value < 0) continue;
        const [, id, field] = path.split('.');
        units.set(id, { ...units.get(id), [field]: value });
    }
    const readings = [...units.values()].map(unit => unit.temperature ?? unit.coolantTemperature);
    return readings.length ? Math.max(...readings) - 273.15 : null;
}
