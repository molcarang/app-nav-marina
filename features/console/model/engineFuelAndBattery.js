import { FUEL_LEVEL_PATH_PATTERN, BATTERY_VOLTAGE_PATH_PATTERN } from '../../../services/signalk/paths.js';

/** Show the lowest available tank level and battery voltage without assuming capacities. */
export function deriveEngineFuelAndBattery(data) {
    const fuel = [];
    const battery = [];
    for (const [path, value] of Object.entries(data)) {
        if (!Number.isFinite(value) || value < 0) continue;
        if (FUEL_LEVEL_PATH_PATTERN.test(path) && value <= 1) fuel.push(value * 100);
        if (BATTERY_VOLTAGE_PATH_PATTERN.test(path)) battery.push(value);
    }
    return {
        fuelLevelPercent: fuel.length ? Math.min(...fuel) : null,
        batteryVoltage: battery.length ? Math.min(...battery) : null,
    };
}
