export const DEFAULT_LOW_FUEL_PERCENT = 20;

export function normalizeLowFuelPercent(value) {
    return Number.isFinite(value) && value >= 1 && value <= 100
        ? Math.round(value) : DEFAULT_LOW_FUEL_PERCENT;
}

export function isLowFuelAlarmActive(connected, fuelPercent, threshold) {
    return connected && Number.isFinite(fuelPercent) && fuelPercent >= 0 && fuelPercent <= 100
        && fuelPercent <= normalizeLowFuelPercent(threshold);
}
